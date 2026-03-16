import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings2,
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
      className="relative h-full flex flex-col z-20 bg-white/[0.03] border-r border-white/[0.06]"
      animate={{ width: expanded ? 220 : 56 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-4 overflow-hidden">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-white">F</span>
        </div>
        <motion.span
          className="ml-3 text-sm font-semibold text-text-primary whitespace-nowrap"
          animate={{ opacity: expanded ? 1 : 0 }}
          transition={{ duration: 0.1 }}
        >
          Focus Detector
        </motion.span>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5 py-2 px-2">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive =
            to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(to);

          return (
            <NavLink key={to} to={to} className="block">
              <div
                className={cn(
                  "flex items-center gap-3 h-9 px-3 rounded-md",
                  "transition-colors duration-100",
                  isActive
                    ? "bg-white/[0.08] text-text-primary"
                    : "text-text-muted hover:bg-white/[0.05] hover:text-text-secondary"
                )}
              >
                <Icon className="flex-shrink-0 w-[18px] h-[18px]" strokeWidth={1.8} />
                <motion.span
                  className="text-[13px] whitespace-nowrap"
                  animate={{ opacity: expanded ? 1 : 0 }}
                  transition={{ duration: 0.1 }}
                >
                  {label}
                </motion.span>
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Version */}
      <div className="px-4 py-3 overflow-hidden">
        <motion.span
          className="text-[10px] text-text-muted font-mono"
          animate={{ opacity: expanded ? 0.5 : 0 }}
          transition={{ duration: 0.1 }}
        >
          v0.1.0
        </motion.span>
      </div>
    </motion.aside>
  );
}
