import { FirstRunGate } from "@/components/shell/FirstRunGate";
import { TopBar } from "@/components/shell/TopBar";

export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto w-full max-w-[1600px] p-4 tab:p-6">
        <FirstRunGate>{children}</FirstRunGate>
      </main>
    </div>
  );
}
