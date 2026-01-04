/**
 * Transaction Scenario Definitions
 *
 * Defines the 7 scenarios for how Up Bank transactions map to YNAB.
 */

import type { UpTransaction } from "../types/upbank";
import type { ScenarioConfig } from "../types/internal";
import { Scenario } from "../types/internal";
import { UP_ACCOUNTS, YNAB_ACCOUNTS, YNAB_TRANSFER_PAYEES } from "./accounts";

/**
 * Resolve which scenario applies to a transaction.
 *
 * Returns null if transaction should be ignored (e.g., from joint account).
 *
 * ⚠️ UPDATE THIS when adding new accounts or changing routing logic.
 */
export function resolveScenario(
  transaction: UpTransaction
): ScenarioConfig | null {
  const sourceAccountId = transaction.relationships.account.data.id;
  const transferAccountId = transaction.relationships.transferAccount?.data?.id;
  const transactionType = transaction.attributes.transactionType;

  // Scenario 7: Joint account → Ignore
  if (sourceAccountId === UP_ACCOUNTS.JOINT_2UP) {
    return null;
  }

  // ========================================================================
  // FROM SPENDING ACCOUNT
  // ========================================================================
  if (sourceAccountId === UP_ACCOUNTS.SPENDING) {
    // Scenario 3: Transfer to Saver
    if (
      transactionType === "Transfer" &&
      transferAccountId === UP_ACCOUNTS.SAVER
    ) {
      return {
        scenario: Scenario.TRANSFER_SPENDING_TO_SAVER,
        ynabAccountId: YNAB_ACCOUNTS.UP_PAYROLL,
        needsCategory: false,
        transferPayeeId: YNAB_TRANSFER_PAYEES.TO_SAVINGS,
        description: "Transfer: Spending → Saver",
      };
    }

    // Scenario 5: Transfer to Joint
    if (
      transactionType === "Transfer" &&
      transferAccountId === UP_ACCOUNTS.JOINT_2UP
    ) {
      return {
        scenario: Scenario.TRANSFER_TO_JOINT,
        ynabAccountId: YNAB_ACCOUNTS.UP_PAYROLL,
        needsCategory: true, // Categorize based on message
        description: "Transfer to Joint (debit only)",
      };
    }

    // Scenario 1: Payment from Spending
    return {
      scenario: Scenario.PAYMENT_FROM_SPENDING,
      ynabAccountId: YNAB_ACCOUNTS.UP_PAYROLL,
      needsCategory: true,
      description: "Payment from Spending",
    };
  }

  // ========================================================================
  // FROM SAVER ACCOUNT
  // ========================================================================
  if (sourceAccountId === UP_ACCOUNTS.SAVER) {
    // Scenario 2: Interest
    if (transactionType === "Interest") {
      return {
        scenario: Scenario.INTEREST_ON_SAVER,
        ynabAccountId: YNAB_ACCOUNTS.UP_SAVINGS,
        needsCategory: false,
        description: "Interest on Saver",
      };
    }

    // Scenario 4: Transfer to Spending
    if (
      transactionType === "Transfer" &&
      transferAccountId === UP_ACCOUNTS.SPENDING
    ) {
      return {
        scenario: Scenario.TRANSFER_SAVER_TO_SPENDING,
        ynabAccountId: YNAB_ACCOUNTS.UP_SAVINGS,
        needsCategory: false,
        transferPayeeId: YNAB_TRANSFER_PAYEES.TO_PAYROLL,
        description: "Transfer: Saver → Spending",
      };
    }

    // Scenario 6: Payment from Saver
    return {
      scenario: Scenario.PAYMENT_FROM_SAVER,
      ynabAccountId: YNAB_ACCOUNTS.UP_SAVINGS,
      needsCategory: true,
      description: "Payment from Saver",
    };
  }

  // Unknown source account
  return null;
}
