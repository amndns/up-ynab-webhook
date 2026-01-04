/**
 * Transaction Processing Decision Logic
 *
 * Determines whether a webhook event should be processed based on
 * event type, transaction status, and transaction type.
 */

import type { WebhookEventType, UpTransaction } from "../types/upbank";
import type { ProcessDecision } from "../types/internal";
import {
  shouldWaitForSettlement,
  isKnownTransactionType,
} from "../config/transaction-rules";

/**
 * Determine if a transaction should be processed
 *
 * Decision matrix:
 * - PING/DELETED events: Don't process
 * - Unknown transaction types: Don't process, but LOG
 * - TRANSACTION_CREATED + SETTLED: Process (transfers, interest, immediate)
 * - TRANSACTION_CREATED + HELD + needs settlement: Don't process (wait for SETTLED)
 * - TRANSACTION_CREATED + HELD + immediate types: Process (card payments)
 * - TRANSACTION_SETTLED + was deferred: Process now
 * - TRANSACTION_SETTLED + wasn't deferred: Already processed, skip
 */
export function shouldProcess(
  eventType: WebhookEventType,
  transaction: UpTransaction
): ProcessDecision {
  const { status, transactionType } = transaction.attributes;

  // PING and DELETED events are never processed
  if (eventType === "PING" || eventType === "TRANSACTION_DELETED") {
    return {
      process: false,
      reason: `EVENT_TYPE:${eventType}`,
    };
  }

  // Unknown transaction type → Log and ignore
  if (!isKnownTransactionType(transactionType)) {
    return {
      process: false,
      reason: `UNKNOWN_TYPE:${transactionType}`,
      shouldLog: true, // Log for manual review
    };
  }

  // TRANSACTION_CREATED event
  if (eventType === "TRANSACTION_CREATED") {
    // Already SETTLED on creation (transfers, interest, immediate settlements)
    if (status === "SETTLED") {
      return {
        process: true,
        reason: "CREATED_SETTLED",
      };
    }

    // HELD but should wait for SETTLED (Pay Anyone, Direct Debit, Salary)
    if (shouldWaitForSettlement(transactionType)) {
      return {
        process: false,
        reason: "WAITING_FOR_SETTLED",
      };
    }

    // HELD and should process immediately (card payments)
    return {
      process: true,
      reason: "CREATED_HELD",
    };
  }

  // TRANSACTION_SETTLED event
  if (eventType === "TRANSACTION_SETTLED") {
    // Only process types we deferred (Pay Anyone, Direct Debit, Salary)
    if (shouldWaitForSettlement(transactionType)) {
      return {
        process: true,
        reason: "DEFERRED_NOW_SETTLED",
      };
    }

    // Already processed on CREATED (card payments)
    return {
      process: false,
      reason: "ALREADY_PROCESSED_ON_HELD",
    };
  }

  // Unknown event type
  return {
    process: false,
    reason: "UNKNOWN_EVENT",
  };
}
