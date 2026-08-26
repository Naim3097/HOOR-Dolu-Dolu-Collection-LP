import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { CONFIG } from "@/lib/products";
import { PurchaseEvent } from "./purchase-event";

export const dynamic = "force-dynamic";

export default async function ReturnPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  const { data: order } = ref
    ? await supabaseAdmin().from("orders").select("ref,status,total,customer").eq("ref", ref).single()
    : { data: null };

  if (!order) return <Shell title="Order not found">We could not find that order. Email {CONFIG.support.email} with any details you have.</Shell>;

  if (order.status === "paid")
    return (
      <Shell title="Thank you — your order is confirmed">
        <p>Order <strong>{order.ref}</strong>. A confirmation is on its way to {order.customer.email}. Dispatch within {CONFIG.policy.dispatchDays} working days.</p>
        <PurchaseEvent orderRef={order.ref} value={order.total} />
      </Shell>
    );

  if (order.status === "failed")
    return <Shell title="Payment did not go through">Nothing was charged. Your bag is saved — go back and try another method.</Shell>;

  return <Shell title="Confirming your payment…">Order {order.ref}. This page refreshes automatically. <meta httpEquiv="refresh" content="4" /></Shell>;
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-xl px-gut py-sect">
      <h1 className="font-serif text-title mb-6">{title}</h1>
      <div className="text-ink-80 leading-relaxed">{children}</div>
      <Link href="/" className="mt-10 inline-block border border-ink px-6 py-3 text-label uppercase tracking-widest hover:bg-ink hover:text-paper transition-colors">Back to the collection</Link>
    </main>
  );
}
