/**
 * Transaction-Scoped Logging Utility
 *
 * Uses structured logging for Cloudflare Workers observability.
 * All logs include transaction ID and request ID for distributed tracing.
 *
 * @see https://developers.cloudflare.com/workers/observability/logs/workers-logs/
 */

export interface TransactionLogger {
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, error?: unknown) => void;
  ignored: (reason: string, meta?: Record<string, unknown>) => void;
}

/**
 * Create a logger instance scoped to a transaction and request
 *
 * Uses structured logging (objects passed directly to console methods)
 * as recommended by Cloudflare for optimal log indexing and filtering.
 *
 * All logs include:
 * - message: Human-readable log message
 * - transactionId: Up Bank transaction ID (for business context)
 * - requestId: Cloudflare Ray ID (for distributed tracing)
 * - timestamp: ISO timestamp
 * - level: Log level (info, warn, error)
 *
 * View logs in Cloudflare Dashboard:
 * - Real-time: `pnpm wrangler tail`
 * - Production: Workers & Pages > your-worker > Logs
 * - Search by: transactionId or requestId for full trace
 *
 * @param transactionId - Up Bank transaction ID
 * @param requestId - Optional Cloudflare Ray ID from request header
 * @returns Logger instance with contextual methods
 *
 * @example
 * const logger = createTransactionLogger("abc-123", "cf-ray-id");
 * logger.info("Processing started", { status: "HELD" });
 * // Output: { level: "info", message: "Processing started", transactionId: "abc-123", requestId: "cf-ray-id", timestamp: "2025-01-04T...", status: "HELD" }
 */
export function createTransactionLogger(
  transactionId: string,
  requestId?: string
): TransactionLogger {
  const baseContext = {
    transactionId,
    requestId: requestId || crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };

  return {
    info: (message: string, meta?: Record<string, unknown>) => {
      console.log({
        level: "info",
        message,
        ...baseContext,
        ...meta,
      });
    },

    warn: (message: string, meta?: Record<string, unknown>) => {
      console.warn({
        level: "warn",
        message,
        ...baseContext,
        ...meta,
      });
    },

    error: (message: string, error?: unknown) => {
      console.error({
        level: "error",
        message,
        ...baseContext,
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : error,
      });
    },

    ignored: (reason: string, meta?: Record<string, unknown>) => {
      console.log({
        level: "info",
        message: "Transaction ignored",
        reason,
        ...baseContext,
        ...meta,
      });
    },
  };
}
