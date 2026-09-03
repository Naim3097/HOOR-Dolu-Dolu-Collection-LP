import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { supabaseSession } from "@/lib/supabase/server";

export type Role = "owner" | "staff";
export type Staff = { id: string; email: string; name: string | null; role: Role };

/**
 * The signed-in staff member for this request, or null. cache() dedupes so the
 * admin layout and its page share one auth round trip. getUser() verifies the
 * JWT against Supabase; never trust getSession() on the server.
 */
export const getStaff = cache(async (): Promise<Staff | null> => {
  const sb = await supabaseSession();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: p } = await sb.from("profiles").select("email, full_name, role").eq("id", user.id).maybeSingle();
  if (!p) return null;
  return { id: user.id, email: p.email, name: p.full_name, role: p.role as Role };
});

/** For server actions: the acting staff member, or a redirect to login. */
export async function requireStaff(): Promise<Staff> {
  const s = await getStaff();
  if (!s) redirect("/admin/login");
  return s;
}
