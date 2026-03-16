import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/profile";

interface ProfileCardProps {
  profile: Profile;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ProfileCard({
  profile,
  isActive,
  onSelect,
  onEdit,
  onDelete,
}: ProfileCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showDeleteConfirm) {
      onDelete();
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };

  return (
    <motion.div
      layoutId={`profile-card-${profile.id}`}
      className={cn(
        "glass-panel rounded-2xl p-5 cursor-pointer relative group select-none",
        "transition-colors duration-200",
        isActive
          ? "border-neon-cyan/60"
          : "border-border-glow hover:border-neon-cyan/30"
      )}
      style={
        isActive
          ? {
              boxShadow:
                "0 0 25px rgba(0, 240, 255, 0.35), 0 0 60px rgba(0, 240, 255, 0.1), inset 0 0 25px rgba(0, 240, 255, 0.06)",
            }
          : undefined
      }
      whileHover={{
        scale: 1.02,
        borderColor: "rgba(0, 240, 255, 0.4)",
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onSelect}
    >
      {/* Animated glow border for active profile */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,240,255,0.15), rgba(191,0,255,0.08), rgba(0,240,255,0.15))",
            backgroundSize: "200% 200%",
          }}
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Action buttons */}
      <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <motion.button
          className="w-7 h-7 rounded-lg bg-white/5 border border-border-glow flex items-center justify-center text-text-secondary hover:text-neon-cyan hover:border-neon-cyan/40 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleEdit}
        >
          <Pencil className="w-3.5 h-3.5" />
        </motion.button>
        <motion.button
          className={cn(
            "w-7 h-7 rounded-lg border flex items-center justify-center transition-colors",
            showDeleteConfirm
              ? "bg-neon-red/20 border-neon-red/50 text-neon-red"
              : "bg-white/5 border-border-glow text-text-secondary hover:text-neon-red hover:border-neon-red/40"
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleDelete}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </motion.button>
      </div>

      {/* Content */}
      <div className="relative z-[1] flex flex-col gap-3">
        {/* Icon + Name */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center text-xl",
              "bg-white/5 border border-border-glow"
            )}
          >
            {profile.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-text-primary truncate">
              {profile.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              {/* Mode badge */}
              <span
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                  profile.mode === "whitelist"
                    ? "text-neon-green border-neon-green/30 bg-neon-green/10"
                    : "text-neon-red border-neon-red/30 bg-neon-red/10"
                )}
              >
                {profile.mode}
              </span>
            </div>
          </div>
        </div>

        {/* Info row */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">
            {profile.apps.length} app{profile.apps.length !== 1 ? "s" : ""} monitored
          </span>
          {isActive && (
            <motion.span
              className="text-[10px] font-bold uppercase tracking-widest text-neon-cyan animate-neon-pulse"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              Active
            </motion.span>
          )}
        </div>
      </div>

      {/* Delete confirmation overlay */}
      {showDeleteConfirm && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-void/80 backdrop-blur-sm flex items-center justify-center z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <span className="text-sm text-neon-red font-semibold">
            Click again to confirm delete
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
