/**
 * Structured Logging Utilities
 *
 * Provides transaction-scoped logging with consistent formatting.
 */

export interface TransactionLogger {
  info: (message: string, data?: object) => void;
  warn: (message: string, data?: object) => void;
  error: (message: string, error?: unknown) => void;
  ignored: (reason: string, data?: object) => void;
}

/**
 * Create a logger scoped to a specific transaction
 *
 * All log messages will be prefixed with [txn:{transactionId}]
 * for easy searching and filtering.
 *
 * @example
 * const logger = createTransactionLogger("abc-123");
 * logger.info("Processing started", { status: "HELD" });
 * // Output: [txn:abc-123] Processing started {"status":"HELD"}
 */
export function createTransactionLogger(
  transactionId: string
): TransactionLogger {
  const prefix = `[txn:${transactionId}]`;

  return {
    info: (message: string, data?: object) =>
      console.log(`${prefix} ${message}`, data ? JSON.stringify(data) : ""),

    warn: (message: string, data?: object) =>
      console.warn(`${prefix} ${message}`, data ? JSON.stringify(data) : ""),

    error: (message: string, error?: unknown) =>
      console.error(`${prefix} ${message}`, error),

    ignored: (reason: string, data?: object) =>
      console.log(
        `${prefix} [IGNORED] reason=${reason}`,
        data ? JSON.stringify(data) : ""
      ),
  };
}
