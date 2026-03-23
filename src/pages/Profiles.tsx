import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Shield } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { ProfileCard } from "@/components/profiles/ProfileCard";
import { ProfileEditor } from "@/components/profiles/ProfileEditor";
import type { Profile } from "@/types/profile";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export default function Profiles() {
  const {
    profiles: dbProfiles,
    activeProfile,
    setActiveProfile,
    createProfile,
    updateProfile,
    deleteProfile,
  } = useApp();

  const profiles = dbProfiles;
  const activeId = activeProfile?.id ?? (profiles.length > 0 ? profiles[0].id : null);

  const [editorState, setEditorState] = useState<
    | { mode: "closed" }
    | { mode: "create" }
    | { mode: "edit"; profile: Profile }
  >({ mode: "closed" });

  const handleSave = async (
    profileData: Omit<Profile, "id"> | Profile
  ) => {
    try {
      console.log("[Profile Save] Data:", JSON.stringify(profileData, null, 2));
      if ("id" in profileData) {
        const { id, ...updates } = profileData;
        console.log("[Profile Save] Updating id:", id, "updates:", Object.keys(updates));
        await updateProfile(id, updates);
        console.log("[Profile Save] Update successful");
      } else {
        console.log("[Profile Save] Creating new profile");
        await createProfile(profileData);
        console.log("[Profile Save] Create successful");
      }
      setEditorState({ mode: "closed" });
    } catch (err) {
      console.error("[Profile Save] FAILED:", err);
      alert(`Save failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteProfile(id);
  };


  return (
    <div className="h-full px-10 py-10 overflow-y-auto">
      {/* Title */}
      <motion.h1
        className="text-2xl font-semibold tracking-tight mb-8 text-text-primary"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Activity Profiles
      </motion.h1>

      {/* Empty State */}
      {profiles.length === 0 && (
        <motion.div
          className="flex flex-col items-center justify-center py-20 gap-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.03] border border-accent/15 flex items-center justify-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_0_12px_rgba(99,102,241,0.06)]">
            <Shield className="w-7 h-7 text-accent/60" />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[15px] font-medium text-text-primary">
              Create your first profile to get started
            </span>
            <span className="text-[13px] text-text-muted max-w-xs text-center">
              Profiles define which apps are allowed or blocked during focus sessions.
            </span>
          </div>
        </motion.div>
      )}

      {/* Profile Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <AnimatePresence mode="popLayout">
          {profiles.map((profile) => {
            const isActive = profile.id === activeId;

            return (
              <motion.div
                key={profile.id}
                variants={item}
                layout
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative"
              >
                <div
                  className={`rounded-2xl border transition-all duration-200 ${
                    isActive
                      ? "border-accent/25 bg-gradient-to-br from-white/[0.05] via-white/[0.03] to-white/[0.04] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_0_0_1px_rgba(99,102,241,0.08)]"
                      : "border-white/[0.07] bg-gradient-to-br from-white/[0.04] to-white/[0.02] hover:from-white/[0.055] hover:to-white/[0.03] hover:border-white/[0.1]"
                  } backdrop-blur-[32px]`}
                >
                  <ProfileCard
                    profile={profile}
                    isActive={isActive}
                    onSelect={() => setActiveProfile(profile.id)}
                    onEdit={() =>
                      setEditorState({ mode: "edit", profile })
                    }
                    onDelete={() => handleDelete(profile.id)}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Add New Profile Card */}
        <motion.div variants={item} layout>
          <motion.div
            className="rounded-2xl p-5 cursor-pointer flex items-center justify-center min-h-[140px] border border-dashed border-white/[0.08] hover:border-accent/25 transition-all duration-200 bg-white/[0.015]"
            whileHover={{
              scale: 1.01,
              borderColor: "rgba(99, 102, 241, 0.25)",
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setEditorState({ mode: "create" })}
          >
            <div className="flex flex-col items-center gap-3 text-text-muted">
              <motion.div
                className="w-10 h-10 rounded-xl border border-dashed border-white/[0.1] flex items-center justify-center bg-white/[0.02]"
                whileHover={{
                  borderColor: "rgba(99, 102, 241, 0.25)",
                }}
              >
                <Plus className="w-4.5 h-4.5" />
              </motion.div>
              <span className="text-[13px] font-medium">New Profile</span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Profile Editor Overlay */}
      <AnimatePresence>
        {editorState.mode !== "closed" && (
          <ProfileEditor
            profile={
              editorState.mode === "edit" ? editorState.profile : null
            }
            onSave={handleSave}
            onCancel={() => setEditorState({ mode: "closed" })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
