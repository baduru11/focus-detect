import { motion } from "framer-motion";
import { ThemeCustomizer } from "@/components/settings/ThemeCustomizer";
import { AIProviderConfig } from "@/components/settings/AIProviderConfig";
import { DataExport } from "@/components/settings/DataExport";
import { VolumeControl } from "@/components/settings/VolumeControl";
import { MemeManager } from "@/components/settings/MemeManager";
import { AutoStartToggle } from "@/components/settings/AutoStartToggle";

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

export default function Settings() {
  return (
    <div className="h-full px-10 py-10 overflow-y-auto flex flex-col items-center">
      <div className="w-full max-w-2xl">
      <motion.h1
        className="text-xl font-semibold tracking-tight mb-8 text-text-primary"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Settings
      </motion.h1>

      <motion.div
        className="flex flex-col gap-8 w-full"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={sectionVariants}>
          <ThemeCustomizer />
        </motion.div>

        <motion.div variants={sectionVariants}>
          <VolumeControl />
        </motion.div>

        <motion.div variants={sectionVariants}>
          <MemeManager />
        </motion.div>

        <motion.div variants={sectionVariants}>
          <AIProviderConfig />
        </motion.div>

        <motion.div variants={sectionVariants}>
          <AutoStartToggle />
        </motion.div>

        <motion.div variants={sectionVariants}>
          <DataExport />
        </motion.div>
      </motion.div>
      </div>
    </div>
  );
}
