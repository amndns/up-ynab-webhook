/**
 * YNAB Service
 *
 * Wrapper around the official YNAB SDK with error handling.
 */

import * as ynab from "ynab";
import { YNAB_BUDGET_ID } from "../config/accounts";
import type { CreateTransactionResult } from "../types/internal";

/**
 * Create a transaction in YNAB
 *
 * @param transaction - YNAB NewTransaction object
 * @param apiToken - YNAB API token
 * @returns Result with success status and transaction ID or error
 */
export async function createTransaction(
  transaction: ynab.NewTransaction,
  apiToken: string
): Promise<CreateTransactionResult> {
  const api = new ynab.API(apiToken);

  try {
    const response = await api.transactions.createTransaction(YNAB_BUDGET_ID, {
      transaction,
    });

    return {
      success: true,
      duplicate: false,
      transactionId: response.data.transaction?.id,
    };
  } catch (error) {
    // YNAB SDK throws on 409 (duplicate import_id)
    if (error instanceof Error) {
      // Check if it's a duplicate error
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes("409") || errorMessage.includes("duplicate")) {
        return {
          success: true,
          duplicate: true,
        };
      }
    }

    // Re-throw other errors
    throw error;
  }
}
