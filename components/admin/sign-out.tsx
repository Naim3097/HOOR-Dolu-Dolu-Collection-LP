"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOut() {
  const router = useRouter();
  return (
    <button type="button" className="text-[11px] uppercase tracking-[0.14em] text-white/60 hover:text-white" onClick={async () => { await createClient().auth.signOut(); router.replace("/admin/login"); router.refresh(); }}>
      Sign out
    </button>
  );
}
