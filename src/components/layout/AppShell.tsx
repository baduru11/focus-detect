import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { FlickeringGrid } from "@/components/magicui/FlickeringGrid";

export function AppShell() {
  return (
    <div className="flex h-full w-full overflow-hidden bg-base relative">
      <FlickeringGrid
        className="fixed inset-0 z-0 [mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
        squareSize={4}
        gridGap={6}
        color="#818cf8"
        maxOpacity={0.3}
        flickerChance={0.08}
      />
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
