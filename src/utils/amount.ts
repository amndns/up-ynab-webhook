/**
 * Currency Amount Conversion Utilities
 *
 * Handles conversion between Up Bank's "base units" (cents)
 * and YNAB's "milliunits" (1/1000 of currency).
 */

/**
 * Convert Up Bank "base units" to YNAB "milliunits"
 *
 * Up Bank:  valueInBaseUnits = cents (1702 = $17.02)
 * YNAB:     milliunits = 1/1000 (17020 = $17.02)
 *
 * Conversion: milliunits = baseUnits * 10
 *
 * @example
 * toYnabMilliunits(1702)  // returns 17020 ($17.02)
 * toYnabMilliunits(-5000) // returns -50000 (-$50.00)
 */
export function toYnabMilliunits(upBaseUnits: number): number {
  return upBaseUnits * 10;
}

/**
 * Convert YNAB milliunits to a human-readable dollar amount
 *
 * @example
 * toDisplayAmount(17020)  // returns "17.02"
 * toDisplayAmount(-50000) // returns "-50.00"
 */
export function toDisplayAmount(milliunits: number): string {
  return (milliunits / 1000).toFixed(2);
}
