import { Settings } from "@/components/settings/Settings";
import { PageHeader } from "@/components/ui/PageHeader";

export default function SettingsPage() {
  return (
    <div className="max-w-[1100px]">
      <PageHeader
        title="Settings"
        intro="Everything you do in FeynLearn is stored in this browser only."
      />
      <Settings />
    </div>
  );
}
