/**
 * Transaction Processing Rules
 *
 * Defines which transaction types should be processed on HELD vs SETTLED status.
 */

/**
 * Transaction types that should ONLY be processed when SETTLED.
 *
 * These are typically bank-to-bank transfers where we want to wait
 * for confirmation before recording in YNAB.
 *
 * ⚠️ MODIFY THIS SET to change which types wait for settlement.
 */
export const PROCESS_ON_SETTLED_ONLY = new Set([
  "Payment", // Generic payment type (e.g., Wise, other services)
  "Pay Anyone",
  "Direct Debit",
  "Salary",
]);

/**
 * Transaction types we know how to handle.
 * Unknown types will be logged and ignored.
 *
 * ⚠️ ADD NEW TYPES HERE when Up Bank introduces them.
 */
export const KNOWN_TRANSACTION_TYPES = new Set([
  // Card payments (process on HELD)
  "Purchase",
  "International Purchase",
  "Contactless Payment",
  "ATM Withdrawal",

  // Bank transfers (process on SETTLED)
  "Payment", // Generic payment type (e.g., Wise, other services)
  "Pay Anyone",
  "Direct Debit",
  "Salary",

  // Special types (always SETTLED immediately)
  "Transfer",
  "Interest",
]);

/**
 * Check if a transaction type should only be processed when SETTLED
 */
export function shouldWaitForSettlement(transactionType: string): boolean {
  return PROCESS_ON_SETTLED_ONLY.has(transactionType);
}

/**
 * Check if a transaction type is known/supported
 */
export function isKnownTransactionType(transactionType: string): boolean {
  return KNOWN_TRANSACTION_TYPES.has(transactionType);
}
