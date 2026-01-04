/**
 * Up Bank Webhook Handler
 *
 * Handles incoming webhooks from Up Bank and orchestrates transaction processing.
 */

import type { Context } from "hono";
import type { UpWebhookEvent } from "../types/upbank";
import { verifyUpWebhookSignature } from "../lib/webhook-verifier";
import { fetchTransaction } from "../lib/upbank-client";
import { shouldProcess } from "../services/should-process";
import { resolveScenario } from "../config/scenarios";
import { mapToYnabTransaction } from "../services/transaction-mapper";
import { categorizeTransaction } from "../lib/categorizer";
import { createTransaction } from "../services/ynab-service";
import { createTransactionLogger } from "../utils/logger";
import { isAcceptedUpAccount } from "../config/accounts";

interface Env {
  UP_API_TOKEN: string;
  UP_WEBHOOK_SECRET: string;
  YNAB_API_TOKEN: string;
  GOOGLE_GENERATIVE_AI_API_KEY: string;
}

export async function handleUpWebhook(c: Context<{ Bindings: Env }>) {
  // 1. Verify signature
  const rawBody = await c.req.text();
  const signature = c.req.header("X-Up-Authenticity-Signature");

  if (!signature) {
    return c.json({ error: "Missing signature header" }, 401);
  }

  const isValid = await verifyUpWebhookSignature(
    rawBody,
    signature,
    c.env.UP_WEBHOOK_SECRET
  );

  if (!isValid) {
    console.warn("Invalid webhook signature");
    return c.json({ error: "Invalid signature" }, 401);
  }

  // 2. Parse event
  let event: UpWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch (error) {
    return c.json({ error: "Invalid JSON payload" }, 400);
  }

  const eventType = event.data.attributes.eventType;

  // 3. Handle PING events
  if (eventType === "PING") {
    console.log("[webhook] PING received");
    return c.json({ ok: true }, 200);
  }

  // 4. Extract transaction ID
  const transactionId = event.data.relationships.transaction?.data?.id;
  if (!transactionId) {
    console.warn("[webhook] No transaction ID in event");
    return c.json({ ok: true }, 200);
  }

  // Get Cloudflare request ID for distributed tracing
  const requestId = c.req.header("cf-ray");
  const logger = createTransactionLogger(transactionId, requestId);

  try {
    // 5. Fetch full transaction
    logger.info("Fetching transaction", { eventType });
    const { data: transaction } = await fetchTransaction(
      transactionId,
      c.env.UP_API_TOKEN
    );

    // 6. Validate account ID (only process SPENDING and SAVER)
    const sourceAccountId = transaction.relationships.account.data.id;

    if (!isAcceptedUpAccount(sourceAccountId)) {
      logger.ignored("UNACCEPTED_ACCOUNT", {
        accountId: sourceAccountId,
        description: transaction.attributes.description,
      });
      return c.json({ ok: true }, 200);
    }

    // 7. Check if we should process
    const decision = shouldProcess(eventType, transaction);

    if (!decision.process) {
      if (decision.shouldLog) {
        logger.ignored(decision.reason, {
          type: transaction.attributes.transactionType,
          amount: transaction.attributes.amount.value,
          description: transaction.attributes.description,
        });
      } else {
        logger.info("Skipping", { reason: decision.reason });
      }
      return c.json({ ok: true }, 200);
    }

    logger.info("Processing", {
      reason: decision.reason,
      type: transaction.attributes.transactionType,
      status: transaction.attributes.status,
    });

    // 8. Determine scenario
    const scenario = resolveScenario(transaction);

    if (!scenario) {
      logger.ignored("NO_SCENARIO", {
        sourceAccount: transaction.relationships.account.data.id,
      });
      return c.json({ ok: true }, 200);
    }

    logger.info("Scenario resolved", {
      scenario: scenario.scenario,
      description: scenario.description,
    });

    // 9. Categorize if needed
    let categorization;
    if (scenario.needsCategory) {
      logger.info("Categorizing transaction");
      categorization = await categorizeTransaction(
        {
          description: transaction.attributes.description,
          parentCategory:
            transaction.relationships.parentCategory?.data?.id ?? null,
          category: transaction.relationships.category?.data?.id ?? null,
          message: transaction.attributes.message,
        },
        c.env.GOOGLE_GENERATIVE_AI_API_KEY
      );

      logger.info("Category determined", {
        categoryName: categorization.categoryName,
        approved: categorization.approved,
      });
    }

    // 10. Map to YNAB transaction
    const ynabTransaction = mapToYnabTransaction(
      transaction,
      scenario,
      categorization
    );

    // 11. Create YNAB transaction
    logger.info("Creating YNAB transaction");
    const result = await createTransaction(
      ynabTransaction,
      c.env.YNAB_API_TOKEN
    );

    if (result.duplicate) {
      logger.info("Transaction already exists (duplicate import_id)");
    } else {
      logger.info("YNAB transaction created", {
        ynabId: result.transactionId,
      });
    }

    return c.json({ ok: true }, 200);
  } catch (error) {
    logger.error("Processing failed", error);
    // Return 500 to allow Up Bank to retry
    return c.json({ error: "Internal server error" }, 500);
  }
}
