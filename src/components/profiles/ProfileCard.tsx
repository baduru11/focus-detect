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
        "p-5 cursor-pointer relative group select-none",
        "transition-colors duration-200"
      )}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={onSelect}
    >
      {/* Action buttons */}
      <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <motion.button
          className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-text-muted hover:text-accent-light hover:border-accent/20 transition-colors"
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
              ? "bg-danger/10 border-danger/30 text-danger/80"
              : "bg-white/[0.04] border-white/[0.06] text-text-muted hover:text-danger/70 hover:border-danger/20"
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
              "w-10 h-10 rounded-lg flex items-center justify-center text-lg",
              "bg-white/[0.04] border border-white/[0.06]"
            )}
          >
            {profile.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-text-primary truncate">
              {profile.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              {/* Mode badge */}
              <span
                className={cn(
                  "text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-md border",
                  profile.mode === "whitelist"
                    ? "text-success/70 border-success/15 bg-success/[0.06]"
                    : "text-danger/70 border-danger/15 bg-danger/[0.06]"
                )}
              >
                {profile.mode}
              </span>
            </div>
          </div>
        </div>

        {/* Info row */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted font-light">
            {profile.apps.length} app{profile.apps.length !== 1 ? "s" : ""} monitored
          </span>
          {isActive && (
            <motion.span
              className="text-[9px] font-semibold uppercase tracking-widest text-accent-light/60"
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
          className="absolute inset-0 rounded-2xl bg-base/80 backdrop-blur-sm flex items-center justify-center z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <span className="text-sm text-danger/80 font-semibold">
            Click again to confirm delete
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
