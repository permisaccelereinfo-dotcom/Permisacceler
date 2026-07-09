import { describe, expect, it } from "vitest";
import { calculateCheckoutTotal, EXAM_SUPPORT_PRICE } from "./pricing";

describe("checkout pricing", () => {
  it("keeps the exam support price server-owned", () => {
    expect(EXAM_SUPPORT_PRICE).toBe(65);
    expect(calculateCheckoutTotal(1_200)).toBe(1_265);
  });

  it("rejects invalid stage prices", () => {
    expect(() => calculateCheckoutTotal(Number.NaN)).toThrow("Stage price");
    expect(() => calculateCheckoutTotal(-1)).toThrow("Stage price");
  });

  it("rejects invalid option prices before they reach Stripe", () => {
    expect(() => calculateCheckoutTotal(1_200, Number.POSITIVE_INFINITY)).toThrow(
      "Exam support price"
    );
    expect(() => calculateCheckoutTotal(1_200, -65)).toThrow("Exam support price");
  });
});
