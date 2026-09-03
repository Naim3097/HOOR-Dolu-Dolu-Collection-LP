import Link from "next/link";
import { getSettings } from "@/lib/admin/config";
import { rm } from "@/lib/money";
import { Card, CardHead, PageHead, btnGhostCls } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function ShippingPage() {
  const s = await getSettings();
  return (
    <div className="space-y-6">
      <PageHead title="Shipping" sub="What customers pay, and how parcels get booked." />
      <Card>
        <CardHead title="What customers pay" action={<Link href="/admin/settings" className={btnGhostCls}>Edit charges</Link>} />
        <dl className="grid gap-y-2 px-5 py-4 text-[13px] sm:grid-cols-[14rem_1fr]">
          <dt className="text-[var(--ink-55)]">Semenanjung</dt><dd>{rm(s.west_rate_sen)}</dd>
          <dt className="text-[var(--ink-55)]">Sabah, Sarawak, Labuan</dt><dd>{rm(s.east_rate_sen)}</dd>
          <dt className="text-[var(--ink-55)]">Free delivery</dt><dd>{s.free_shipping_threshold_sen == null ? "Never" : `Orders of ${rm(s.free_shipping_threshold_sen)} and above`}</dd>
        </dl>
      </Card>
      <Card>
        <CardHead title="Booking parcels" />
        <div className="space-y-2 px-5 py-4 text-[13px] leading-relaxed">
          <p>Parcels are booked by hand for now: open the order, add a parcel with the courier and tracking number, and the customer-facing tracking link is filled in for J&amp;T, Pos Laju, Ninja Van, DHL and City-Link.</p>
          <p className="text-[var(--ink-55)]">Booking straight from an order through EasyParcel, with the label and AWB pulled back automatically, is the next step once HOOR has an EasyParcel account to connect.</p>
        </div>
      </Card>
    </div>
  );
}
