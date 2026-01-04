/**
 * Up Bank and YNAB Account IDs
 *
 * These are hardcoded constants that map Up Bank accounts to YNAB accounts.
 */

// ============================================================================
// UP BANK ACCOUNT IDS
// ============================================================================

export const UP_ACCOUNTS = {
  SPENDING: "545cab13-2e48-485f-a04c-b4b90fca45bc",
  SAVER: "f6d995bc-8536-4165-8f0c-6b6a49543878",
  JOINT_2UP: "3413fdd4-3c78-4a89-b47f-66e4c0d1801f",
} as const;

// ============================================================================
// YNAB IDS
// ============================================================================

export const YNAB_BUDGET_ID = "89de8741-0d5e-4fe0-a5ec-4991759b7910";

export const YNAB_ACCOUNTS = {
  UP_PAYROLL: "e8a87e9a-ad0b-4ff7-b0f3-253493d7a612",
  UP_SAVINGS: "f45ebb3c-1134-417e-a703-c4bc5db10237",
} as const;

export const YNAB_TRANSFER_PAYEES = {
  TO_SAVINGS: "36e62f60-d80e-4c1d-a6c1-e78febb0f16d", // "Transfer : Up Savings"
  TO_PAYROLL: "ef6fee8d-07b5-4c68-a29b-41a88ebfb174", // "Transfer : Up Payroll"
} as const;

// ============================================================================
// MAPPINGS
// ============================================================================

/**
 * Map Up Bank account ID → YNAB account ID
 */
export const UP_TO_YNAB_ACCOUNT: Record<string, string> = {
  [UP_ACCOUNTS.SPENDING]: YNAB_ACCOUNTS.UP_PAYROLL,
  [UP_ACCOUNTS.SAVER]: YNAB_ACCOUNTS.UP_SAVINGS,
  // Joint account not mapped (not tracked in YNAB)
};

/**
 * Map Up Bank account ID → YNAB transfer payee ID
 * Used when creating transfers between accounts
 */
export const UP_TO_YNAB_TRANSFER_PAYEE: Record<string, string> = {
  [UP_ACCOUNTS.SPENDING]: YNAB_TRANSFER_PAYEES.TO_PAYROLL,
  [UP_ACCOUNTS.SAVER]: YNAB_TRANSFER_PAYEES.TO_SAVINGS,
};
