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
      className={cn(
        "relative h-full flex flex-col z-20",
        "border-r border-white/[0.06]"
      )}
      animate={{ width: expanded ? 240 : 64 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.015) 100%)",
        backdropFilter: "blur(40px) saturate(1.4)",
        WebkitBackdropFilter: "blur(40px) saturate(1.4)",
      }}
    >
      {/* Logo area */}
      <div className="flex items-center h-16 px-5 border-b border-white/[0.06] overflow-hidden">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-white leading-none">F</span>
        </div>
        <motion.span
          className="ml-3 text-sm font-semibold text-text-primary whitespace-nowrap"
          animate={{ opacity: expanded ? 1 : 0, width: expanded ? "auto" : 0 }}
          transition={{ duration: 0.15 }}
        >
          Focus
        </motion.span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 py-3 px-2.5">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive =
            to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(to);

          return (
            <NavLink key={to} to={to} className="block">
              <motion.div
                className={cn(
                  "relative flex items-center gap-3 h-11 px-3.5 rounded-xl overflow-hidden",
                  "transition-colors duration-150",
                  isActive
                    ? "text-text-primary bg-white/[0.07]"
                    : "text-text-muted hover:text-text-secondary hover:bg-white/[0.04]"
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-4 rounded-r-full bg-accent"
                    layoutId="sidebar-indicator"
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  />
                )}

                <Icon className="flex-shrink-0 w-5 h-5" strokeWidth={1.6} />

                <motion.span
                  className="text-sm whitespace-nowrap font-medium"
                  animate={{ opacity: expanded ? 1 : 0 }}
                  transition={{ duration: 0.12 }}
                >
                  {label}
                </motion.span>
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* Separator */}
      <div className="mx-3 border-t border-white/[0.06]" />

      {/* Bottom branding */}
      <div className="px-5 py-3 overflow-hidden">
        <motion.div
          className="flex items-center gap-2"
          animate={{ opacity: expanded ? 0.4 : 0 }}
          transition={{ duration: 0.12 }}
        >
          <span className="text-[10px] text-text-muted tracking-widest font-mono">
            v0.1.0
          </span>
        </motion.div>
      </div>
    </motion.aside>
  );
}
