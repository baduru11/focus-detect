import { useState, useEffect } from "react";
import { Volume2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonSlider } from "@/components/ui/NeonSlider";
import { setVolume, getVolume, playChime } from "@/services/alarmSound";
import { getSettingValue, setSettingValue } from "@/services/profileService";

export function VolumeControl() {
  const [vol, setVol] = useState(getVolume() * 100);

  useEffect(() => {
    getSettingValue("alarm_volume").then((saved) => {
      if (saved !== null) {
        const v = parseFloat(saved);
        if (!isNaN(v)) {
          setVol(v * 100);
          setVolume(v);
        }
      }
    }).catch(() => {});
  }, []);

  const handleChange = (value: number) => {
    const normalized = value / 100;
    setVol(value);
    setVolume(normalized);
    setSettingValue("alarm_volume", String(normalized)).catch(() => {});
  };

  const handleTest = () => {
    playChime();
  };

  return (
    <GlassCard>
      <div className="flex items-center gap-3 mb-4">
        <Volume2 className="w-5 h-5 text-neon-cyan" />
        <h3 className="text-sm font-semibold text-text-primary">Alarm Volume</h3>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <NeonSlider
            min={0}
            max={100}
            value={vol}
            onChange={handleChange}
            label=""
            unit="%"
          />
        </div>
        <button
          onClick={handleTest}
          className="text-xs px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-text-secondary hover:bg-white/10 transition-colors"
        >
          Test
        </button>
      </div>
    </GlassCard>
  );
}
