import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, FileJson, FileSpreadsheet, AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

export function DataExport() {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleExportJSON = () => {
    // Placeholder for actual export logic
    console.log("Exporting sessions as JSON...");
  };

  const handleExportCSV = () => {
    // Placeholder for actual export logic
    console.log("Exporting sessions as CSV...");
  };

  const handleClearData = () => {
    if (showClearConfirm) {
      // Placeholder for actual clear logic
      console.log("Clearing all data...");
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 5000);
    }
  };

  return (
    <GlassCard>
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-4 h-4 text-neon-red/60" />
        <h2 className="text-base font-semibold text-text-primary">
          Data & Export
        </h2>
      </div>

      <div className="flex flex-col gap-6">
        {/* Export Buttons */}
        <div className="flex flex-col gap-3">
          <span className="text-xs text-text-muted uppercase tracking-wider">Export Sessions</span>
          <div className="flex gap-3">
            <NeonButton variant="ghost" size="sm" onClick={handleExportJSON}>
              <FileJson className="w-3.5 h-3.5 mr-2 inline" />
              Export JSON
            </NeonButton>
            <NeonButton variant="ghost" size="sm" onClick={handleExportCSV}>
              <FileSpreadsheet className="w-3.5 h-3.5 mr-2 inline" />
              Export CSV
            </NeonButton>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.04]" />

        {/* Clear Data */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-neon-red/40 mt-0.5 shrink-0" />
            <p className="text-xs text-text-muted leading-relaxed">
              Clearing all data will permanently remove all session history,
              statistics, and cached AI analysis results. This action cannot be
              undone.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {showClearConfirm ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-3"
              >
                <span className="text-sm text-neon-red/80 font-semibold">
                  Are you sure?
                </span>
                <NeonButton
                  variant="danger"
                  size="sm"
                  onClick={handleClearData}
                >
                  Yes, Clear Everything
                </NeonButton>
                <NeonButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowClearConfirm(false)}
                >
                  Cancel
                </NeonButton>
              </motion.div>
            ) : (
              <motion.div
                key="button"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                <NeonButton
                  variant="danger"
                  size="sm"
                  onClick={handleClearData}
                >
                  Clear All Data
                </NeonButton>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </GlassCard>
  );
}
