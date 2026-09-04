import Link from "next/link";
import { getStaff } from "@/lib/auth";
import { getSettings } from "@/lib/admin/config";
import { getConnection } from "@/lib/shipping/config";
import { rm } from "@/lib/money";
import { Card, CardHead, PageHead, btnGhostCls } from "@/components/admin/ui";
import { EasyparcelConnection, SenderForm, PricingModeForm } from "@/components/admin/shipping-panels";

export const dynamic = "force-dynamic";

export default async function ShippingPage({ searchParams }: { searchParams: Promise<{ connected?: string; error?: string }> }) {
  const [{ connected, error }, me, s, conn] = await Promise.all([searchParams, getStaff(), getSettings(), getConnection()]);
  return (
    <div className="space-y-6">
      <PageHead title="Shipping" sub="What customers pay, and how parcels get booked." />
      {connected && <p className="border border-emerald-300 bg-emerald-50 px-4 py-2 text-[13px] text-emerald-900">{connected}</p>}
      {error && <p className="border border-rose-300 bg-rose-50 px-4 py-2 text-[13px] text-rose-900">{error}</p>}
      <Card>
        <CardHead title="What customers pay" action={<Link href="/admin/settings" className={btnGhostCls}>Edit charges</Link>} />
        <dl className="grid gap-y-2 px-5 py-4 text-[13px] sm:grid-cols-[14rem_1fr]">
          <dt className="text-[var(--ink-55)]">Semenanjung</dt><dd>{rm(s.west_rate_sen)}</dd>
          <dt className="text-[var(--ink-55)]">Sabah, Sarawak, Labuan</dt><dd>{rm(s.east_rate_sen)}</dd>
          <dt className="text-[var(--ink-55)]">Free delivery</dt><dd>{s.free_shipping_threshold_sen == null ? "Never" : `Malaysian orders of ${rm(s.free_shipping_threshold_sen)} and above`}</dd>
        </dl>
        <p className="border-t border-[var(--line-soft)] px-5 py-3 text-[12px] text-[var(--ink-55)]">Customers always pay the zone rate. Booking a courier is HOOR&apos;s own cost, paid from the EasyParcel wallet; the difference is margin or subsidy.</p>
      </Card>
      <PricingModeForm mode={conn.mode} domestic={conn.domesticAllowedCouriers} international={conn.internationalAllowedCouriers} connected={conn.connected} />
      <EasyparcelConnection configured={conn.configured} connected={conn.connected} refreshExpires={conn.refreshExpires} isOwner={me?.role === "owner"} />
      <SenderForm sender={conn.sender} />
      <Card>
        <CardHead title="Booking by hand" />
        <p className="px-5 py-4 text-[13px] leading-relaxed">Without EasyParcel, open the order and add a parcel with the courier and tracking number. The tracking link is filled in for J&amp;T, Pos Laju, Ninja Van, DHL and City-Link, and the customer gets the shipped email either way.</p>
      </Card>
    </div>
  );
}
