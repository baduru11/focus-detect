import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Particles } from "@/components/magicui/Particles";

export function AppShell() {
  return (
    <div className="flex h-full w-full overflow-hidden bg-base relative">
      <Particles
        className="fixed inset-0 z-0"
        quantity={25}
        color="#6366f1"
        size={0.3}
        staticity={90}
        ease={80}
      />
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
