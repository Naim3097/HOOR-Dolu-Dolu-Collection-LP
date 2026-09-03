import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getStaff } from "@/lib/auth";
import { NavLink } from "@/components/admin/nav-link";
import { SignOut } from "@/components/admin/sign-out";

export const metadata: Metadata = { title: "HOOR back office", robots: { index: false, follow: false } };

const NAV = [
  { heading: "Store", items: [
    { label: "Dashboard", to: "/admin", exact: true },
    { label: "Orders", to: "/admin/orders" },
    { label: "Products", to: "/admin/products" },
    { label: "Customers", to: "/admin/customers" },
    { label: "Discounts", to: "/admin/discounts" },
  ] },
  { heading: "Operations", items: [
    { label: "Shipping", to: "/admin/shipping" },
  ] },
  { heading: "Configure", items: [
    { label: "Settings", to: "/admin/settings" },
    { label: "Staff", to: "/admin/staff" },
    { label: "Audit log", to: "/admin/audit" },
  ] },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login");
  return (
    <div className="flex min-h-screen bg-[var(--paper)] text-[var(--ink)] print:block print:bg-white">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col bg-[#1E1B18] lg:flex print:hidden">
        <Link href="/" className="border-b border-white/10 px-5 py-5">
          <span className="block font-[family-name:var(--serif)] text-xl tracking-[0.2em] text-white">HOOR</span>
          <span className="block text-[9px] uppercase tracking-[0.3em] text-white/50">Back office</span>
        </Link>
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {NAV.map((s) => (
            <div key={s.heading} className="mb-6">
              <p className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[0.3em] text-white/40">{s.heading}</p>
              <ul className="space-y-0.5">{s.items.map((i) => <li key={i.to}><NavLink href={i.to} exact={i.exact}>{i.label}</NavLink></li>)}</ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10 px-5 py-4 pb-14 text-[12px] text-white/50">
          <p className="truncate text-white/80">{staff.name ?? staff.email}</p>
          <p className="mb-2 uppercase tracking-[0.2em] text-[10px]">{staff.role}</p>
          <SignOut />
        </div>
      </aside>
      <div className="flex min-h-screen flex-1 flex-col lg:pl-56 print:pl-0">
        <div className="flex items-center gap-4 overflow-x-auto bg-[#1E1B18] px-4 py-3 lg:hidden print:hidden">
          <span className="font-[family-name:var(--serif)] tracking-[0.2em] text-white">HOOR</span>
          {NAV.flatMap((s) => s.items).map((i) => <Link key={i.to} href={i.to} className="whitespace-nowrap text-[12px] text-white/70">{i.label}</Link>)}
        </div>
        <main className="flex-1 px-5 py-8 lg:px-10 print:p-0">{children}</main>
      </div>
    </div>
  );
}
