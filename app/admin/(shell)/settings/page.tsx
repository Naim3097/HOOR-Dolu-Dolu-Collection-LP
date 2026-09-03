import { getSettings } from "@/lib/admin/config";
import { PageHead } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/config-forms";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const s = await getSettings();
  return (
    <div className="space-y-6">
      <PageHead title="Settings" sub="Store contact details, delivery charges and the returns window. Changes reach the site within a few minutes." />
      <SettingsForm settings={s} />
    </div>
  );
}
