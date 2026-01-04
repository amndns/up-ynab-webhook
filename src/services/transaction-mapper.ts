/**
 * Transaction Mapper
 *
 * Maps Up Bank transactions to YNAB SaveTransaction format.
 */

import * as ynab from "ynab";
import type { UpTransaction } from "../types/upbank";
import type { ScenarioConfig } from "../types/internal";
import { toYnabMilliunits } from "../utils/amount";

/**
 * Map an Up Bank transaction to YNAB NewTransaction format
 *
 * @param transaction - Up Bank transaction
 * @param scenario - Resolved scenario configuration
 * @param categorization - LLM categorization result (for payment scenarios)
 * @returns YNAB NewTransaction object
 */
export function mapToYnabTransaction(
  transaction: UpTransaction,
  scenario: ScenarioConfig,
  categorization?: { categoryId: string | null; approved: boolean }
): ynab.NewTransaction {
  const attrs = transaction.attributes;
  const importId = transaction.id;
  const date = attrs.settledAt?.split("T")[0] ?? attrs.createdAt.split("T")[0];
  const amount = toYnabMilliunits(attrs.amount.valueInBaseUnits);

  // Build memo with useful context
  const memoParts: string[] = [];
  if (attrs.transactionType !== "Purchase") {
    memoParts.push(attrs.transactionType);
  }
  if (attrs.foreignAmount) {
    memoParts.push(
      `${attrs.foreignAmount.currencyCode} ${attrs.foreignAmount.value}`
    );
  }
  if (attrs.message) {
    memoParts.push(attrs.message);
  }
  const memo = memoParts.length > 0 ? memoParts.join(" | ") : undefined;

  // Transfer scenarios use payee_id
  if (scenario.transferPayeeId) {
    return {
      account_id: scenario.ynabAccountId,
      date,
      amount,
      payee_id: scenario.transferPayeeId,
      memo,
      cleared: "cleared" as const,
      approved: true,
      import_id: importId,
    };
  }

  // Payment scenarios use payee_name and category
  return {
    account_id: scenario.ynabAccountId,
    date,
    amount,
    payee_name: attrs.description,
    category_id: categorization?.categoryId || undefined,
    memo,
    cleared: "cleared" as const,
    approved: categorization?.approved ?? false,
    import_id: importId,
  };
}
