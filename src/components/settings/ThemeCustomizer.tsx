import { useState } from "react";
import { motion } from "framer-motion";
import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";

const ACCENT_COLORS = [
  { name: "Indigo", hex: "#6366f1" },
  { name: "Purple", hex: "#a855f7" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Green", hex: "#22c55e" },
  { name: "Orange", hex: "#f59e0b" },
  { name: "Pink", hex: "#ec4899" },
];

export function ThemeCustomizer() {
  const [selectedColor, setSelectedColor] = useState("#6366f1");

  return (
    <GlassCard>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
          <Palette className="w-3.5 h-3.5 text-accent-light" strokeWidth={1.8} />
        </div>
        <h2 className="text-sm font-semibold text-text-primary">Theme</h2>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <span className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-medium">Accent Color</span>
          <div className="flex gap-3">
            {ACCENT_COLORS.map((color) => (
              <motion.button
                key={color.hex}
                type="button"
                className={cn(
                  "relative w-7 h-7 rounded-full transition-all duration-200",
                  selectedColor === color.hex
                    ? "ring-2 ring-offset-2 ring-offset-base scale-110"
                    : "hover:scale-110"
                )}
                style={{
                  background: color.hex,
                  opacity: selectedColor === color.hex ? 1 : 0.55,
                  ringColor: selectedColor === color.hex ? color.hex : undefined,
                }}
                whileHover={{ scale: 1.15, opacity: 0.85 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedColor(color.hex)}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Preview Swatch */}
        <div className="flex flex-col gap-3">
          <span className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-medium">Preview</span>
          <div
            className="h-11 rounded-xl border border-white/[0.06] flex items-center justify-center gap-3"
            style={{
              background: `linear-gradient(135deg, ${selectedColor}08, ${selectedColor}03)`,
              borderColor: `${selectedColor}15`,
            }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: selectedColor,
                opacity: 0.75,
              }}
            />
            <span
              className="text-[13px] font-medium"
              style={{ color: selectedColor, opacity: 0.75 }}
            >
              {ACCENT_COLORS.find((c) => c.hex === selectedColor)?.name ?? "Custom"} Accent
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
