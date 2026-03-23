import { useState, useEffect } from "react";
import { Power } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonToggle } from "@/components/ui/NeonToggle";

export function AutoStartToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { isEnabled } = await import("@tauri-apps/plugin-autostart");
        setEnabled(await isEnabled());
      } catch {
        setError("Auto-start not available");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleToggle = async (value: boolean) => {
    setError(null);
    try {
      const { enable, disable } = await import("@tauri-apps/plugin-autostart");
      if (value) {
        await enable();
      } else {
        await disable();
      }
      setEnabled(value);
    } catch (e) {
      setError("Failed to update auto-start setting");
      console.warn("Auto-start toggle error:", e);
    }
  };

  return (
    <GlassCard>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Power className="w-5 h-5 text-neon-green" />
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Start on Boot</h3>
            <p className="text-xs text-text-secondary">
              {error || "Launch Focus Detector when Windows starts"}
            </p>
          </div>
        </div>
        {!loading && (
          <NeonToggle
            checked={enabled}
            onChange={handleToggle}
          />
        )}
      </div>
    </GlassCard>
  );
}
