import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL_ = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Anon client for public reads (products, stock). Respects RLS. No session. */
export function supabaseAnon() {
  return createClient(URL_(), ANON(), { auth: { persistSession: false } });
}

/**
 * Session-aware client for Server Components, Route Handlers and Server
 * Actions: reads the staff session from cookies so RLS applies as that user.
 * Created per request, never hoisted.
 */
export async function supabaseSession(): Promise<SupabaseClient> {
  const store = await cookies();
  return createServerClient(URL_(), ANON(), {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* read-only in Server Components; proxy.ts refreshes */ }
      },
    },
  });
}

/** Service-role client. SERVER ONLY — orders, stock mutation, webhooks, admin writes. */
export function supabaseAdmin() {
  if (typeof window !== "undefined") throw new Error("supabaseAdmin() must never run in the browser");
  return createClient(URL_(), process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
}
