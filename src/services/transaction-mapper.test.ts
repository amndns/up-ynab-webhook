import { describe, it, expect } from "vitest";
import { mapToYnabTransaction } from "./transaction-mapper";
import { Scenario } from "../types/internal";
import { YNAB_ACCOUNTS, YNAB_TRANSFER_PAYEES } from "../config/accounts";
import type { UpTransaction } from "../types/upbank";
import type { ScenarioConfig } from "../types/internal";

function createMockTransaction(
  description: string,
  amount: number,
  transactionType: string = "Purchase"
): UpTransaction {
  return {
    type: "transactions",
    id: "test-id-123",
    attributes: {
      status: "SETTLED",
      rawText: null,
      description,
      message: null,
      isCategorizable: true,
      holdInfo: null,
      roundUp: null,
      cashback: null,
      amount: {
        currencyCode: "AUD",
        value: (amount / 100).toFixed(2),
        valueInBaseUnits: amount,
      },
      foreignAmount: null,
      cardPurchaseMethod: null,
      settledAt: "2025-01-04T12:00:00+11:00",
      createdAt: "2025-01-04T11:00:00+11:00",
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

describe("transaction mapper", () => {
  describe("payment scenarios", () => {
    const scenario: ScenarioConfig = {
      scenario: Scenario.PAYMENT_FROM_SPENDING,
      ynabAccountId: YNAB_ACCOUNTS.UP_PAYROLL,
      needsCategory: true,
      description: "Test",
    };

    it("maps basic payment transaction", () => {
      const txn = createMockTransaction("Woolworths", -5000); // -$50.00
      const result = mapToYnabTransaction(txn, scenario, {
        categoryId: "groceries-id",
        approved: true,
      });

      expect(result.account_id).toBe(YNAB_ACCOUNTS.UP_PAYROLL);
      expect(result.date).toBe("2025-01-04");
      expect(result.amount).toBe(-50000); // milliunits
      expect(result.payee_name).toBeUndefined(); // No payee for regular transactions
      expect(result.category_id).toBe("groceries-id");
      expect(result.approved).toBe(true);
      expect(result.import_id).toBe("test-id-123");
    });

    it("sets approved to false when category is uncertain", () => {
      const txn = createMockTransaction("Unknown Merchant", -2000);
      const result = mapToYnabTransaction(txn, scenario, {
        categoryId: null,
        approved: false,
      });

      expect(result.category_id).toBeUndefined();
      expect(result.approved).toBe(false);
    });

    it("includes foreign amount in memo", () => {
      const txn = createMockTransaction("EZ Fly", -1702);
      txn.attributes.transactionType = "International Purchase";
      txn.attributes.foreignAmount = {
        currencyCode: "TWD",
        value: "-355.00",
        valueInBaseUnits: -35500,
      };

      const result = mapToYnabTransaction(txn, scenario);

      expect(result.memo).toContain("TWD -355.00");
    });

    it("includes message in memo", () => {
      const txn = createMockTransaction("Transfer", -158000);
      txn.attributes.message = "Rent payment";

      const result = mapToYnabTransaction(txn, scenario);

      expect(result.memo).toContain("Rent payment");
    });
  });

  describe("transfer scenarios", () => {
    const scenario: ScenarioConfig = {
      scenario: Scenario.TRANSFER_SPENDING_TO_SAVER,
      ynabAccountId: YNAB_ACCOUNTS.UP_PAYROLL,
      needsCategory: false,
      transferPayeeId: YNAB_TRANSFER_PAYEES.TO_SAVINGS,
      description: "Test",
    };

    it("maps transfer transaction with payee_id", () => {
      const txn = createMockTransaction(
        "Transfer to Medical",
        -3500,
        "Transfer"
      );
      const result = mapToYnabTransaction(txn, scenario);

      expect(result.account_id).toBe(YNAB_ACCOUNTS.UP_PAYROLL);
      expect(result.amount).toBe(-35000);
      expect(result.payee_id).toBe(YNAB_TRANSFER_PAYEES.TO_SAVINGS);
      expect(result.payee_name).toBeUndefined();
      expect(result.category_id).toBeUndefined();
      expect(result.approved).toBe(true);
      expect(result.import_id).toBe("test-id-123");
    });
  });

  describe("amount conversion", () => {
    const scenario: ScenarioConfig = {
      scenario: Scenario.PAYMENT_FROM_SPENDING,
      ynabAccountId: YNAB_ACCOUNTS.UP_PAYROLL,
      needsCategory: true,
      description: "Test",
    };

    it("converts negative amounts correctly", () => {
      const txn = createMockTransaction("Test", -17020);
      const result = mapToYnabTransaction(txn, scenario);
      expect(result.amount).toBe(-170200); // -$170.20
    });

    it("converts positive amounts correctly", () => {
      const txn = createMockTransaction("Interest", 40, "Interest");
      const result = mapToYnabTransaction(txn, scenario);
      expect(result.amount).toBe(400); // $0.40
    });
  });

  describe("date handling", () => {
    const scenario: ScenarioConfig = {
      scenario: Scenario.PAYMENT_FROM_SPENDING,
      ynabAccountId: YNAB_ACCOUNTS.UP_PAYROLL,
      needsCategory: true,
      description: "Test",
    };

    it("uses settledAt date when available", () => {
      const txn = createMockTransaction("Test", -1000);
      txn.attributes.settledAt = "2025-02-15T10:00:00+11:00";
      const result = mapToYnabTransaction(txn, scenario);
      expect(result.date).toBe("2025-02-15");
    });

    it("falls back to createdAt when settledAt is null", () => {
      const txn = createMockTransaction("Test", -1000);
      txn.attributes.settledAt = null;
      txn.attributes.createdAt = "2025-02-20T10:00:00+11:00";
      const result = mapToYnabTransaction(txn, scenario);
      expect(result.date).toBe("2025-02-20");
    });
  });
});
