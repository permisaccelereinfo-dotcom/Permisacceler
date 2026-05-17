"use client";

import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/supabase/database.types";

type BrowserClient = ReturnType<typeof createBrowserClient<Database>>;

let browserClient: BrowserClient | undefined;

export function createClient() {
  browserClient ??= createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return browserClient;
}
