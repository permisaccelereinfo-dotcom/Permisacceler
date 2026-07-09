import { describe, expect, it } from "vitest";
import { canStartCheckoutForStatus, isPaidBookingStatus } from "./status";

describe("booking status policy", () => {
  it("treats confirmed and completed bookings as paid terminal states", () => {
    expect(isPaidBookingStatus("confirmed")).toBe(true);
    expect(isPaidBookingStatus("completed")).toBe(true);
  });

  it("allows checkout retries only for non-paid states", () => {
    expect(canStartCheckoutForStatus("pending")).toBe(true);
    expect(canStartCheckoutForStatus("cancelled")).toBe(true);
    expect(canStartCheckoutForStatus(null)).toBe(true);
    expect(canStartCheckoutForStatus("confirmed")).toBe(false);
    expect(canStartCheckoutForStatus("completed")).toBe(false);
  });
});
