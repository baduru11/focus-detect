import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database as DatabaseIcon, FileJson, FileSpreadsheet, AlertTriangle } from "lucide-react";
import Database from "@tauri-apps/plugin-sql";
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

  const clearAllData = async () => {
    try {
      const db = await Database.load("sqlite:focus_detector.db");
      await db.execute("DELETE FROM distractions");
      await db.execute("DELETE FROM sessions");
      // Don't delete profiles or settings — just session data
    } catch (err) {
      console.error("Failed to clear data:", err);
    }
  };

  const handleClearData = () => {
    if (showClearConfirm) {
      clearAllData();
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 5000);
    }
  };

  return (
    <GlassCard interactive>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-7 h-7 rounded-lg bg-danger/10 flex items-center justify-center">
          <DatabaseIcon className="w-3.5 h-3.5 text-danger" strokeWidth={1.8} />
        </div>
        <h2 className="text-sm font-semibold text-text-primary">
          Data & Export
        </h2>
      </div>

      <div className="flex flex-col gap-6">
        {/* Export Buttons */}
        <div className="flex flex-col gap-3">
          <span className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-medium">Export Sessions</span>
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
        <div className="border-t border-white/[0.06]" />

        {/* Clear Data */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-3.5 h-3.5 text-danger/50 mt-0.5 shrink-0" strokeWidth={1.8} />
            <p className="text-[13px] text-text-muted leading-relaxed">
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
                <span className="text-[13px] text-danger/80 font-semibold">
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
