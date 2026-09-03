"use client";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHead, Field, inputCls, btnGhostCls } from "@/components/admin/ui";

/** The signed-in person changes their own password; Supabase updates the session in place. */
export function ChangePassword() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setMsg(null);
    if (pw.length < 10) return setMsg({ ok: false, text: "Use at least 10 characters." });
    if (pw !== pw2) return setMsg({ ok: false, text: "The two entries do not match." });
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setMsg({ ok: false, text: error.message });
    setPw(""); setPw2(""); setMsg({ ok: true, text: "Password changed. Use it next time you sign in." });
  };
  return (
    <Card>
      <CardHead title="Change my password" />
      <form className="grid items-end gap-3 px-5 py-4 sm:grid-cols-[1fr_1fr_auto]" onSubmit={submit}>
        <Field label="New password"><input className={inputCls} type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} required /></Field>
        <Field label="Repeat it"><input className={inputCls} type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} required /></Field>
        <button className={btnGhostCls} disabled={busy}>{busy ? "Saving…" : "Change password"}</button>
      </form>
      {msg && <p className={`px-5 pb-4 text-[13px] ${msg.ok ? "text-emerald-700" : "text-rose-700"}`}>{msg.text}</p>}
    </Card>
  );
}
