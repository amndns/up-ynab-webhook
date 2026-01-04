/**
 * Internal Application Types
 *
 * Type definitions for internal data structures and business logic.
 */

import type { WebhookEventType } from "./upbank";

// ============================================================================
// DECISION TYPES
// ============================================================================

export interface ProcessDecision {
  /**
   * Whether to process this transaction
   */
  process: boolean;

  /**
   * Reason code for the decision
   */
  reason: string;

  /**
   * Whether to log this decision (for ignored transactions)
   */
  shouldLog?: boolean;
}

// ============================================================================
// SCENARIO TYPES
// ============================================================================

export enum Scenario {
  PAYMENT_FROM_SPENDING = 1,
  INTEREST_ON_SAVER = 2,
  TRANSFER_SPENDING_TO_SAVER = 3,
  TRANSFER_SAVER_TO_SPENDING = 4,
  TRANSFER_TO_JOINT = 5,
  PAYMENT_FROM_SAVER = 6,
  IGNORE_JOINT = 7,
}

export interface ScenarioConfig {
  scenario: Scenario;
  ynabAccountId: string;
  needsCategory: boolean;
  transferPayeeId?: string;
  description: string;
}

// ============================================================================
// CATEGORIZATION TYPES
// ============================================================================

export interface CategorizationInput {
  description: string;
  rawText: string | null;
  parentCategory: string | null;
  category: string | null;
  message: string | null;
}

export interface CategorizationOutput {
  categoryName: string;
  categoryId: string | null;
  approved: boolean;
}

// ============================================================================
// SERVICE RESULT TYPES
// ============================================================================

export interface CreateTransactionResult {
  success: boolean;
  duplicate: boolean;
  transactionId?: string;
  error?: string;
}
