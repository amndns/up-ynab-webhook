import { describe, it, expect } from "vitest";
import { toYnabMilliunits, toDisplayAmount } from "./amount";

describe("amount utilities", () => {
  describe("toYnabMilliunits", () => {
    it("converts positive amounts correctly", () => {
      expect(toYnabMilliunits(1702)).toBe(17020); // $17.02
      expect(toYnabMilliunits(5000)).toBe(50000); // $50.00
      expect(toYnabMilliunits(100)).toBe(1000); // $1.00
    });

    it("converts negative amounts correctly", () => {
      expect(toYnabMilliunits(-1702)).toBe(-17020); // -$17.02
      expect(toYnabMilliunits(-5000)).toBe(-50000); // -$50.00
    });

    it("handles zero correctly", () => {
      expect(toYnabMilliunits(0)).toBe(0);
    });

    it("handles small amounts correctly", () => {
      expect(toYnabMilliunits(1)).toBe(10); // $0.01
      expect(toYnabMilliunits(50)).toBe(500); // $0.50
    });
  });

  describe("toDisplayAmount", () => {
    it("converts milliunits to display format", () => {
      expect(toDisplayAmount(17020)).toBe("17.02");
      expect(toDisplayAmount(50000)).toBe("50.00");
      expect(toDisplayAmount(1000)).toBe("1.00");
    });

    it("handles negative amounts", () => {
      expect(toDisplayAmount(-17020)).toBe("-17.02");
    });

    it("handles zero", () => {
      expect(toDisplayAmount(0)).toBe("0.00");
    });

    it("always shows 2 decimal places", () => {
      expect(toDisplayAmount(10000)).toBe("10.00");
      expect(toDisplayAmount(10500)).toBe("10.50");
    });
  });
});
