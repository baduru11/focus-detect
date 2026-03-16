import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/profiles", icon: Users, label: "Profiles" },
  { to: "/stats", icon: BarChart3, label: "Statistics" },
  { to: "/settings", icon: Settings2, label: "Settings" },
] as const;

export function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();

  return (
    <motion.aside
      className="relative h-full flex flex-col glass-panel rounded-none rounded-r-2xl border-l-0 border-t-0 border-b-0 z-20"
      animate={{ width: expanded ? 240 : 72 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        background:
          "linear-gradient(180deg, rgba(15,15,35,0.8) 0%, rgba(10,10,25,0.9) 100%)",
      }}
    >
      {/* Top logo area */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border-glow overflow-hidden">
        <div
          className="flex-shrink-0 w-9 h-9 rounded-lg bg-neon-cyan/10 flex items-center justify-center"
          style={{
            boxShadow: "0 0 12px rgba(0, 240, 255, 0.2)",
          }}
        >
          <Zap className="w-5 h-5 text-neon-cyan" />
        </div>
        <motion.span
          className="text-sm font-semibold text-text-primary whitespace-nowrap"
          animate={{ opacity: expanded ? 1 : 0 }}
          transition={{ duration: 0.15 }}
        >
          Focus Detector
        </motion.span>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 flex flex-col gap-1 py-4 px-2">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive =
            to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(to);

          return (
            <NavLink key={to} to={to} className="block">
              <motion.div
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-xl overflow-hidden transition-colors duration-150",
                  isActive
                    ? "bg-neon-cyan/10 text-neon-cyan"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                )}
                whileHover={
                  !isActive
                    ? {
                        backgroundColor: "rgba(0, 240, 255, 0.05)",
                      }
                    : undefined
                }
              >
                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-neon-cyan"
                    layoutId="sidebar-indicator"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    style={{
                      boxShadow: "0 0 8px rgba(0, 240, 255, 0.6)",
                    }}
                  />
                )}

                <Icon
                  className="flex-shrink-0 w-5 h-5"
                  style={
                    isActive
                      ? {
                          filter: "drop-shadow(0 0 6px rgba(0, 240, 255, 0.5))",
                        }
                      : undefined
                  }
                />

                <motion.span
                  className="text-sm whitespace-nowrap"
                  animate={{ opacity: expanded ? 1 : 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {label}
                </motion.span>
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom branding */}
      <div className="px-4 py-4 border-t border-border-glow overflow-hidden">
        <motion.div
          className="flex items-center gap-2"
          animate={{ opacity: expanded ? 1 : 0 }}
          transition={{ duration: 0.15 }}
        >
          <span className="text-[10px] text-text-muted tracking-widest uppercase">
            v0.1.0
          </span>
        </motion.div>
      </div>
    </motion.aside>
  );
}
