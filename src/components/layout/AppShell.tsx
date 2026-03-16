import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { ParticleBackground } from "@/components/ui/ParticleBackground";

export function AppShell() {
  const location = useLocation();

  return (
    <div className="flex h-full w-full overflow-hidden bg-void relative">
      <ParticleBackground />
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            className="h-full"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
