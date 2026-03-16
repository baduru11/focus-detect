import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { ParticleBackground } from "@/components/ui/ParticleBackground";

export function AppShell() {
  return (
    <div className="flex h-full w-full overflow-hidden bg-void relative">
      <ParticleBackground />
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
