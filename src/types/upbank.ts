/**
 * Up Bank API Types
 *
 * Type definitions for Up Bank webhook events and API responses.
 */

// ============================================================================
// WEBHOOK EVENT TYPES
// ============================================================================

export type WebhookEventType =
  | "PING"
  | "TRANSACTION_CREATED"
  | "TRANSACTION_SETTLED"
  | "TRANSACTION_DELETED";

export interface UpWebhookEvent {
  data: {
    type: "webhook-events";
    id: string;
    attributes: {
      eventType: WebhookEventType;
      createdAt: string;
    };
    relationships: {
      webhook: {
        data: { type: "webhooks"; id: string };
      };
      transaction?: {
        data: { type: "transactions"; id: string };
        links?: { related: string };
      };
    };
  };
}

// ============================================================================
// TRANSACTION TYPES
// ============================================================================

export type TransactionStatus = "HELD" | "SETTLED";

export type TransactionType =
  | "Purchase"
  | "International Purchase"
  | "Contactless Payment"
  | "ATM Withdrawal"
  | "Pay Anyone"
  | "Direct Debit"
  | "Salary"
  | "Transfer"
  | "Interest"
  | string; // Allow other types for forward compatibility

export interface UpAmount {
  currencyCode: string;
  value: string;
  valueInBaseUnits: number;
}

export interface UpHoldInfo {
  amount: UpAmount;
  foreignAmount: UpAmount | null;
}

export interface UpCardPurchaseMethod {
  method: string;
  cardNumberSuffix: string;
}

export interface UpTransaction {
  type: "transactions";
  id: string;
  attributes: {
    status: TransactionStatus;
    rawText: string | null;
    description: string;
    message: string | null;
    isCategorizable: boolean;
    holdInfo: UpHoldInfo | null;
    roundUp: unknown | null;
    cashback: unknown | null;
    amount: UpAmount;
    foreignAmount: UpAmount | null;
    cardPurchaseMethod: UpCardPurchaseMethod | null;
    settledAt: string | null;
    createdAt: string;
    transactionType: TransactionType;
    note: string | null;
    performingCustomer: {
      displayName: string;
    } | null;
    deepLinkURL: string;
  };
  relationships: {
    account: {
      data: {
        type: "accounts";
        id: string;
      };
      links: {
        related: string;
      };
    };
    transferAccount: {
      data: {
        type: "accounts";
        id: string;
      } | null;
      links?: {
        related: string;
      };
    };
    category: {
      data: {
        type: "categories";
        id: string;
      } | null;
      links?: {
        self: string;
        related: string;
      };
    };
    parentCategory: {
      data: {
        type: "categories";
        id: string;
      } | null;
      links?: {
        related: string;
      };
    };
    tags: {
      data: unknown[];
      links: {
        self: string;
      };
    };
    attachment: {
      data: unknown | null;
    };
  };
  links: {
    self: string;
  };
}

export interface UpTransactionResponse {
  data: UpTransaction;
}
