import { motion } from "framer-motion";
import { ThemeCustomizer } from "@/components/settings/ThemeCustomizer";
import { AIProviderConfig } from "@/components/settings/AIProviderConfig";
import { DataExport } from "@/components/settings/DataExport";

const sectionVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

export default function Settings() {
  return (
    <div className="h-full p-8 overflow-y-auto">
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
        Settings
      </motion.h1>

      <motion.div
        className="flex flex-col gap-6 max-w-3xl"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={sectionVariants}>
          <ThemeCustomizer />
        </motion.div>

        <motion.div variants={sectionVariants}>
          <AIProviderConfig />
        </motion.div>

        <motion.div variants={sectionVariants}>
          <DataExport />
        </motion.div>
      </motion.div>
    </div>
  );
}
