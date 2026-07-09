import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const migrationPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "reserve_booking_for_checkout.sql"
);
const migrationSql = readFileSync(migrationPath, "utf8");

// NOTE: This is a STATIC CONTRACT check — it only asserts that key clauses are
// present in the SQL source. It does NOT execute the function, so it cannot
// catch logic regressions that preserve these strings. The real behavioral
// test (capacity enforcement, row locking, duplicate handling) runs against a
// live Postgres via `supabase test db` — see
// supabase/tests/reserve_booking_for_checkout.test.sql.
describe("reserve_booking_for_checkout migration (static contract)", () => {
  it("defines the atomic reservation RPC with row locking", () => {
    expect(migrationSql).toContain("CREATE OR REPLACE FUNCTION public.reserve_booking_for_checkout");
    expect(migrationSql).toContain("FOR UPDATE");
    expect(migrationSql).toContain("SECURITY DEFINER");
  });

  it("counts pending bookings as reserved capacity", () => {
    expect(migrationSql).toContain("status IN ('pending', 'confirmed', 'completed')");
  });

  it("keeps confirmed bookings from being downgraded by a new checkout", () => {
    expect(migrationSql).toContain("existing_booking.status IN ('confirmed', 'completed')");
    expect(migrationSql).toContain("Vous avez déjà une réservation confirmée pour ce stage.");
  });
});
