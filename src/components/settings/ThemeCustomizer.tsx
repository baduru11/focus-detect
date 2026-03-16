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
      <div className="flex items-center gap-3 mb-5">
        <Palette className="w-5 h-5 text-neon-purple" />
        <h2 className="text-lg font-semibold text-text-primary">Theme</h2>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm text-text-secondary">Accent Color</span>
          <div className="flex gap-3">
            {ACCENT_COLORS.map((color) => (
              <motion.button
                key={color.hex}
                type="button"
                className={cn(
                  "relative w-9 h-9 rounded-full transition-all duration-200",
                  selectedColor === color.hex
                    ? "ring-2 ring-offset-2 ring-offset-void"
                    : "hover:scale-110"
                )}
                style={{
                  background: color.hex,
                  boxShadow:
                    selectedColor === color.hex
                      ? `0 0 20px ${color.hex}80, 0 0 40px ${color.hex}40`
                      : `0 0 8px ${color.hex}30`,
                  // Ring color set via className ring utility
                }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedColor(color.hex)}
                title={color.name}
              >
                {selectedColor === color.hex && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      boxShadow: `0 0 20px ${color.hex}80, 0 0 40px ${color.hex}40`,
                    }}
                    animate={{
                      boxShadow: [
                        `0 0 15px ${color.hex}60, 0 0 30px ${color.hex}30`,
                        `0 0 25px ${color.hex}80, 0 0 50px ${color.hex}50`,
                        `0 0 15px ${color.hex}60, 0 0 30px ${color.hex}30`,
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Preview Swatch */}
        <div className="flex flex-col gap-2">
          <span className="text-sm text-text-secondary">Preview</span>
          <div
            className="h-12 rounded-xl border border-white/10 flex items-center justify-center gap-3"
            style={{
              background: `linear-gradient(135deg, ${selectedColor}15, ${selectedColor}05)`,
              borderColor: `${selectedColor}30`,
            }}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{
                background: selectedColor,
                boxShadow: `0 0 8px ${selectedColor}80`,
              }}
            />
            <span
              className="text-sm font-semibold"
              style={{ color: selectedColor }}
            >
              {ACCENT_COLORS.find((c) => c.hex === selectedColor)?.name ?? "Custom"} Accent
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
