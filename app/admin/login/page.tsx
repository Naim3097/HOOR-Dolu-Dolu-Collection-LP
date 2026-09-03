"use client";
import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Field, inputCls, btnCls } from "@/components/admin/ui";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError(null);
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    if (error) { setError("That email and password do not match a staff account."); setBusy(false); return; }
    router.replace(params.get("next") || "/admin"); router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-4 text-[var(--ink)]">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 border border-[var(--line)] bg-[var(--white)] p-8">
        <div>
          <p className="font-[family-name:var(--serif)] text-2xl tracking-[0.2em]">HOOR</p>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--ink-55)]">Back office</p>
        </div>
        <Field label="Email"><input className={inputCls} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
        <Field label="Password"><input className={inputCls} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
        {error && <p className="text-[13px] text-rose-700">{error}</p>}
        <button className={`${btnCls} w-full`} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <p className="text-[12px] text-[var(--ink-55)]">Staff accounts are created by the owner under Staff. Forgotten your password? Ask the owner to reset it.</p>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
