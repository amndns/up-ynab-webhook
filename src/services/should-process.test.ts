import { describe, it, expect } from "vitest";
import { shouldProcess } from "./should-process";
import type { UpTransaction } from "../types/upbank";

function createMockTransaction(
  status: "HELD" | "SETTLED",
  transactionType: string
): UpTransaction {
  return {
    type: "transactions",
    id: "test-id",
    attributes: {
      status,
      rawText: null,
      description: "Test",
      message: null,
      isCategorizable: true,
      holdInfo: null,
      roundUp: null,
      cashback: null,
      amount: {
        currencyCode: "AUD",
        value: "10.00",
        valueInBaseUnits: 1000,
      },
      foreignAmount: null,
      cardPurchaseMethod: null,
      settledAt: status === "SETTLED" ? "2025-01-01T00:00:00Z" : null,
      createdAt: "2025-01-01T00:00:00Z",
      transactionType,
      note: null,
      performingCustomer: null,
      deepLinkURL: "up://test",
    },
    relationships: {
      account: {
        data: { type: "accounts", id: "test-account" },
        links: { related: "" },
      },
      transferAccount: { data: null },
      category: { data: null },
      parentCategory: { data: null },
      tags: { data: [], links: { self: "" } },
      attachment: { data: null },
    },
    links: { self: "" },
  };
}

describe("shouldProcess", () => {
  describe("PING events", () => {
    it("does not process PING events", () => {
      const txn = createMockTransaction("SETTLED", "Purchase");
      const result = shouldProcess("PING", txn);

      expect(result.process).toBe(false);
      expect(result.reason).toBe("EVENT_TYPE:PING");
    });
  });

  describe("TRANSACTION_DELETED events", () => {
    it("does not process DELETED events", () => {
      const txn = createMockTransaction("HELD", "Purchase");
      const result = shouldProcess("TRANSACTION_DELETED", txn);

      expect(result.process).toBe(false);
      expect(result.reason).toBe("EVENT_TYPE:TRANSACTION_DELETED");
    });
  });

  describe("Unknown transaction types", () => {
    it("does not process but logs unknown types", () => {
      const txn = createMockTransaction("SETTLED", "Unknown Type");
      const result = shouldProcess("TRANSACTION_CREATED", txn);

      expect(result.process).toBe(false);
      expect(result.reason).toBe("UNKNOWN_TYPE:Unknown Type");
      expect(result.shouldLog).toBe(true);
    });
  });

  describe("TRANSACTION_CREATED events", () => {
    describe("immediate settlement types (Transfer, Interest)", () => {
      it("processes when SETTLED immediately", () => {
        const txn = createMockTransaction("SETTLED", "Transfer");
        const result = shouldProcess("TRANSACTION_CREATED", txn);

        expect(result.process).toBe(true);
        expect(result.reason).toBe("CREATED_SETTLED");
      });

      it("processes Interest when SETTLED", () => {
        const txn = createMockTransaction("SETTLED", "Interest");
        const result = shouldProcess("TRANSACTION_CREATED", txn);

        expect(result.process).toBe(true);
        expect(result.reason).toBe("CREATED_SETTLED");
      });
    });

    describe("deferred types (Pay Anyone, Direct Debit, Salary)", () => {
      it("does not process Pay Anyone when HELD", () => {
        const txn = createMockTransaction("HELD", "Pay Anyone");
        const result = shouldProcess("TRANSACTION_CREATED", txn);

        expect(result.process).toBe(false);
        expect(result.reason).toBe("WAITING_FOR_SETTLED");
      });

      it("does not process Direct Debit when HELD", () => {
        const txn = createMockTransaction("HELD", "Direct Debit");
        const result = shouldProcess("TRANSACTION_CREATED", txn);

        expect(result.process).toBe(false);
        expect(result.reason).toBe("WAITING_FOR_SETTLED");
      });

      it("does not process Salary when HELD", () => {
        const txn = createMockTransaction("HELD", "Salary");
        const result = shouldProcess("TRANSACTION_CREATED", txn);

        expect(result.process).toBe(false);
        expect(result.reason).toBe("WAITING_FOR_SETTLED");
      });

      it("does not process Direct Credit when HELD", () => {
        const txn = createMockTransaction("HELD", "Direct Credit");
        const result = shouldProcess("TRANSACTION_CREATED", txn);

        expect(result.process).toBe(false);
        expect(result.reason).toBe("WAITING_FOR_SETTLED");
      });
    });

    describe("immediate types (card payments)", () => {
      it("processes International Purchase when HELD", () => {
        const txn = createMockTransaction("HELD", "International Purchase");
        const result = shouldProcess("TRANSACTION_CREATED", txn);

        expect(result.process).toBe(true);
        expect(result.reason).toBe("CREATED_HELD");
      });

      it("processes Purchase when HELD", () => {
        const txn = createMockTransaction("HELD", "Purchase");
        const result = shouldProcess("TRANSACTION_CREATED", txn);

        expect(result.process).toBe(true);
        expect(result.reason).toBe("CREATED_HELD");
      });
    });
  });

  describe("TRANSACTION_SETTLED events", () => {
    describe("deferred types", () => {
      it("processes Pay Anyone when settled", () => {
        const txn = createMockTransaction("SETTLED", "Pay Anyone");
        const result = shouldProcess("TRANSACTION_SETTLED", txn);

        expect(result.process).toBe(true);
        expect(result.reason).toBe("DEFERRED_NOW_SETTLED");
      });

      it("processes Direct Debit when settled", () => {
        const txn = createMockTransaction("SETTLED", "Direct Debit");
        const result = shouldProcess("TRANSACTION_SETTLED", txn);

        expect(result.process).toBe(true);
        expect(result.reason).toBe("DEFERRED_NOW_SETTLED");
      });

      it("processes Direct Credit when settled", () => {
        const txn = createMockTransaction("SETTLED", "Direct Credit");
        const result = shouldProcess("TRANSACTION_SETTLED", txn);

        expect(result.process).toBe(true);
        expect(result.reason).toBe("DEFERRED_NOW_SETTLED");
      });
    });

    describe("immediate types (already processed)", () => {
      it("does not reprocess card payments", () => {
        const txn = createMockTransaction("SETTLED", "International Purchase");
        const result = shouldProcess("TRANSACTION_SETTLED", txn);

        expect(result.process).toBe(false);
        expect(result.reason).toBe("ALREADY_PROCESSED_ON_HELD");
      });

      it("does not reprocess regular purchases", () => {
        const txn = createMockTransaction("SETTLED", "Purchase");
        const result = shouldProcess("TRANSACTION_SETTLED", txn);

        expect(result.process).toBe(false);
        expect(result.reason).toBe("ALREADY_PROCESSED_ON_HELD");
      });
    });
  });

  describe("comprehensive flow tests", () => {
    it("processes card payment: CREATED+HELD → yes, SETTLED → no", () => {
      const txn = createMockTransaction("HELD", "Purchase");

      // First event: TRANSACTION_CREATED with HELD
      const created = shouldProcess("TRANSACTION_CREATED", txn);
      expect(created.process).toBe(true);

      // Second event: TRANSACTION_SETTLED (already processed)
      txn.attributes.status = "SETTLED";
      const settled = shouldProcess("TRANSACTION_SETTLED", txn);
      expect(settled.process).toBe(false);
    });

    it("processes bank transfer: CREATED+HELD → no, SETTLED → yes", () => {
      const txn = createMockTransaction("HELD", "Pay Anyone");

      // First event: TRANSACTION_CREATED with HELD
      const created = shouldProcess("TRANSACTION_CREATED", txn);
      expect(created.process).toBe(false);

      // Second event: TRANSACTION_SETTLED
      txn.attributes.status = "SETTLED";
      const settled = shouldProcess("TRANSACTION_SETTLED", txn);
      expect(settled.process).toBe(true);
    });

    it("processes internal transfer: CREATED+SETTLED → yes (only one event)", () => {
      const txn = createMockTransaction("SETTLED", "Transfer");

      const result = shouldProcess("TRANSACTION_CREATED", txn);
      expect(result.process).toBe(true);
    });
  });
});
