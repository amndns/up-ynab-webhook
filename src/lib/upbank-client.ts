/**
 * Up Bank API Client
 *
 * Fetches transaction details from the Up Bank API.
 */

import type { UpTransactionResponse } from "../types/upbank";

/**
 * Fetch a single transaction from Up Bank
 *
 * @param transactionId - Up Bank transaction ID
 * @param apiToken - Up Bank Personal Access Token
 * @returns Transaction details
 * @throws Error if request fails
 */
export async function fetchTransaction(
  transactionId: string,
  apiToken: string
): Promise<UpTransactionResponse> {
  const response = await fetch(
    `https://api.up.com.au/api/v1/transactions/${transactionId}`,
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Failed to fetch transaction ${transactionId}: ${response.status} ${error}`
    );
  }

  return response.json();
}
