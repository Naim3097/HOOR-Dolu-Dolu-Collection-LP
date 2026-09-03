import { getStaff } from "@/lib/auth";
import { listStaff } from "@/lib/admin/config";
import { PageHead } from "@/components/admin/ui";
import { StaffTable } from "@/components/admin/config-forms";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const [me, staff] = await Promise.all([getStaff(), listStaff()]);
  return (
    <div className="space-y-6">
      <PageHead title="Staff" sub="Who can sign in to the back office. The owner adds people and hands them a one-time password." />
      <StaffTable staff={staff} meId={me!.id} isOwner={me!.role === "owner"} />
    </div>
  );
}
