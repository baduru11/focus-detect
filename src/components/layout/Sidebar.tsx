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
      className={cn(
        "relative h-full flex flex-col z-20",
        "border-r border-white/[0.04]",
        "backdrop-blur-2xl"
      )}
      animate={{ width: expanded ? 200 : 56 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        background:
          "linear-gradient(180deg, rgba(12,12,24,0.85) 0%, rgba(8,8,18,0.95) 100%)",
      }}
    >
      {/* Top logo area */}
      <div className="flex items-center gap-2.5 px-3.5 h-14 border-b border-white/[0.04] overflow-hidden">
        <div
          className="flex-shrink-0 w-7 h-7 rounded-md bg-neon-cyan/8 flex items-center justify-center"
        >
          <Zap className="w-4 h-4 text-neon-cyan/80" />
        </div>
        <motion.span
          className="text-sm font-heading text-text-primary whitespace-nowrap"
          animate={{ opacity: expanded ? 1 : 0 }}
          transition={{ duration: 0.15 }}
        >
          Focus Detector
        </motion.span>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 flex flex-col gap-0.5 py-3 px-1.5">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive =
            to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(to);

          return (
            <NavLink key={to} to={to} className="block">
              <motion.div
                className={cn(
                  "relative flex items-center gap-2.5 px-3 py-2 rounded-lg overflow-hidden transition-colors duration-150",
                  isActive
                    ? "text-neon-cyan bg-neon-cyan/[0.06]"
                    : "text-text-muted hover:text-text-secondary hover:bg-white/[0.03]"
                )}
              >
                {/* Active indicator — thin left bar */}
                {isActive && (
                  <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-r-full bg-neon-cyan/70"
                    layoutId="sidebar-indicator"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                <Icon className="flex-shrink-0 w-[18px] h-[18px]" />

                <motion.span
                  className="text-[13px] whitespace-nowrap font-medium"
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

      {/* Separator */}
      <div className="mx-3 border-t border-white/[0.04]" />

      {/* Bottom branding */}
      <div className="px-3.5 py-3 overflow-hidden">
        <motion.div
          className="flex items-center gap-2"
          animate={{ opacity: expanded ? 0.5 : 0 }}
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
