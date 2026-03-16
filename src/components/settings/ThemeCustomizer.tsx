import { useState } from "react";
import { motion } from "framer-motion";
import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";

const ACCENT_COLORS = [
  { name: "Cyan", hex: "#00f0ff" },
  { name: "Purple", hex: "#bf00ff" },
  { name: "Red", hex: "#ff003c" },
  { name: "Green", hex: "#00ff88" },
  { name: "Orange", hex: "#ff8c00" },
  { name: "Pink", hex: "#ff69b4" },
];

export function ThemeCustomizer() {
  const [selectedColor, setSelectedColor] = useState("#00f0ff");

  return (
    <GlassCard>
      <div className="flex items-center gap-3 mb-6">
        <Palette className="w-4 h-4 text-neon-purple/60" />
        <h2 className="text-base font-semibold text-text-primary">Theme</h2>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <span className="text-xs text-text-muted uppercase tracking-wider">Accent Color</span>
          <div className="flex gap-3">
            {ACCENT_COLORS.map((color) => (
              <motion.button
                key={color.hex}
                type="button"
                className={cn(
                  "relative w-7 h-7 rounded-full transition-all duration-200",
                  selectedColor === color.hex
                    ? "ring-2 ring-offset-2 ring-offset-void"
                    : "hover:scale-110"
                )}
                style={{
                  background: color.hex,
                  opacity: selectedColor === color.hex ? 1 : 0.6,
                  boxShadow:
                    selectedColor === color.hex
                      ? `0 0 10px ${color.hex}40`
                      : "none",
                }}
                whileHover={{ scale: 1.15, opacity: 0.9 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedColor(color.hex)}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Preview Swatch */}
        <div className="flex flex-col gap-3">
          <span className="text-xs text-text-muted uppercase tracking-wider">Preview</span>
          <div
            className="h-11 rounded-lg border border-white/[0.06] flex items-center justify-center gap-3"
            style={{
              background: `linear-gradient(135deg, ${selectedColor}08, ${selectedColor}03)`,
              borderColor: `${selectedColor}15`,
            }}
          >
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{
                background: selectedColor,
                opacity: 0.7,
                boxShadow: `0 0 6px ${selectedColor}40`,
              }}
            />
            <span
              className="text-xs font-medium"
              style={{ color: selectedColor, opacity: 0.7 }}
            >
              {ACCENT_COLORS.find((c) => c.hex === selectedColor)?.name ?? "Custom"} Accent
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
