import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Titlebar } from "@/components/layout/Titlebar";
import { FlickeringGrid } from "@/components/magicui/FlickeringGrid";
import { useApp } from "@/context/AppContext";

export function AppShell() {
  const { pomodoroState } = useApp();
  const timerActive = pomodoroState.status !== "idle";

  return (
    <div className="flex h-full w-full overflow-hidden relative" style={{ background: 'rgba(6, 6, 12, 0.78)' }}>
      <FlickeringGrid
        className="fixed inset-0 z-0 [mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
        squareSize={4}
        gridGap={6}
        color="#818cf8"
        maxOpacity={0.3}
        flickerChance={0.08}
        paused={timerActive}
      />
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Titlebar />
        <main className="flex-1 overflow-y-auto relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
