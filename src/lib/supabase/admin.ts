import { createClient as createSupabaseAdminClient, type SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/database.types";

type AdminClient = SupabaseClient<Database>;

/**
 * Service-role Supabase client that bypasses RLS. Server-only — never import
 * this into a Client Component. Returns null when the service role key or URL
 * is missing so callers can fail loudly instead of silently using anon access.
 */
export function createAdminClient(): AdminClient | null {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return null;
  }

  return createSupabaseAdminClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Prefer the service-role client (bypasses RLS for trusted server flows), but
 * fall back to the caller's request-scoped client when the service role key is
 * not configured.
 */
export function createDatabaseClient(fallback: AdminClient): AdminClient {
  return createAdminClient() ?? fallback;
}
