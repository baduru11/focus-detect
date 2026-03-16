import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Loader2 } from "lucide-react";
import { useProfiles } from "@/hooks/useProfiles";
import { ProfileCard } from "@/components/profiles/ProfileCard";
import { ProfileEditor } from "@/components/profiles/ProfileEditor";
import type { Profile } from "@/types/profile";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export default function Profiles() {
  const {
    profiles,
    activeProfile,
    loading,
    setActiveProfile,
    createProfile,
    updateProfile,
    deleteProfile,
  } = useProfiles();

  const [editorState, setEditorState] = useState<
    | { mode: "closed" }
    | { mode: "create" }
    | { mode: "edit"; profile: Profile }
  >({ mode: "closed" });

  const handleSave = async (
    profileData: Omit<Profile, "id"> | Profile
  ) => {
    if ("id" in profileData) {
      const { id, ...updates } = profileData;
      await updateProfile(id, updates);
    } else {
      await createProfile(profileData);
    }
    setEditorState({ mode: "closed" });
  };

  const handleDelete = async (id: string) => {
    await deleteProfile(id);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <Loader2 className="w-8 h-8 text-neon-cyan animate-spin" />
          <span className="text-sm text-text-muted">Loading profiles...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full p-8 overflow-y-auto">
      {/* Title */}
      <motion.h1
        className="text-3xl font-bold tracking-tight mb-8"
        style={{
          background: "linear-gradient(135deg, #00f0ff, #bf00ff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Activity Profiles
      </motion.h1>

      {/* Profile Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <AnimatePresence mode="popLayout">
          {profiles.map((profile) => (
            <motion.div
              key={profile.id}
              variants={item}
              layout
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <ProfileCard
                profile={profile}
                isActive={activeProfile?.id === profile.id}
                onSelect={() => setActiveProfile(profile.id)}
                onEdit={() =>
                  setEditorState({ mode: "edit", profile })
                }
                onDelete={() => handleDelete(profile.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add New Profile Card */}
        <motion.div variants={item} layout>
          <motion.div
            className="glass-panel rounded-2xl p-5 cursor-pointer flex items-center justify-center min-h-[140px] border border-dashed border-text-muted/20 hover:border-neon-cyan/30 transition-colors"
            whileHover={{
              scale: 1.02,
              borderColor: "rgba(0, 240, 255, 0.4)",
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setEditorState({ mode: "create" })}
          >
            <div className="flex flex-col items-center gap-3 text-text-muted">
              <motion.div
                className="w-12 h-12 rounded-xl border border-dashed border-text-muted/30 flex items-center justify-center"
                whileHover={{
                  borderColor: "rgba(0, 240, 255, 0.5)",
                  boxShadow: "0 0 15px rgba(0, 240, 255, 0.15)",
                }}
              >
                <Plus className="w-6 h-6" />
              </motion.div>
              <span className="text-sm font-medium">New Profile</span>
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
