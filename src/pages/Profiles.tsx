import { motion } from "framer-motion";
import { Code2, BookOpen, Gamepad2, Plus } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

const mockProfiles = [
  {
    id: 1,
    name: "Deep Work",
    icon: Code2,
    color: "cyan" as const,
    description: "Maximum focus, block all distractions",
    apps: 12,
  },
  {
    id: 2,
    name: "Study Mode",
    icon: BookOpen,
    color: "purple" as const,
    description: "Block social media, allow reference sites",
    apps: 8,
  },
  {
    id: 3,
    name: "Gaming Break",
    icon: Gamepad2,
    color: "green" as const,
    description: "Relax mode with minimal restrictions",
    apps: 3,
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Profiles() {
  return (
    <div className="h-full p-8">
      <motion.h1
        className="text-3xl font-bold text-text-primary tracking-tight mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Profiles
      </motion.h1>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {mockProfiles.map((profile) => {
          const Icon = profile.icon;
          return (
            <motion.div key={profile.id} variants={item}>
              <GlassCard glow={profile.color} hoverable className="h-full">
                <div className="flex flex-col gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background:
                        profile.color === "cyan"
                          ? "rgba(0,240,255,0.1)"
                          : profile.color === "purple"
                          ? "rgba(191,0,255,0.1)"
                          : "rgba(0,255,136,0.1)",
                    }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{
                        color:
                          profile.color === "cyan"
                            ? "#00f0ff"
                            : profile.color === "purple"
                            ? "#bf00ff"
                            : "#00ff88",
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-text-primary">
                      {profile.name}
                    </h3>
                    <p className="text-xs text-text-secondary mt-1">
                      {profile.description}
                    </p>
                  </div>
                  <div className="text-xs text-text-muted">
                    {profile.apps} apps monitored
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}

        {/* Add new profile card */}
        <motion.div variants={item}>
          <GlassCard
            hoverable
            className="h-full flex items-center justify-center min-h-[180px] border-dashed"
          >
            <div className="flex flex-col items-center gap-3 text-text-muted">
              <div className="w-12 h-12 rounded-xl border border-dashed border-text-muted/30 flex items-center justify-center">
                <Plus className="w-6 h-6" />
              </div>
              <span className="text-sm">New Profile</span>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
