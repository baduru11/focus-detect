import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Palette, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  getSettingValue,
  setSettingValue,
} from "@/services/profileService";

const ACCENT_COLORS = [
  { name: "Indigo", hex: "#6366f1" },
  { name: "Purple", hex: "#a855f7" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Green", hex: "#22c55e" },
  { name: "Orange", hex: "#f59e0b" },
  { name: "Pink", hex: "#ec4899" },
];

const THEME_KEY = "accent_color";

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function lighten(hex: string, amount = 0.2): string {
  const [r, g, b] = hexToRgb(hex);
  const lr = Math.round(r + (255 - r) * amount);
  const lg = Math.round(g + (255 - g) * amount);
  const lb = Math.round(b + (255 - b) * amount);
  return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`;
}

/** Apply accent color to CSS custom properties on :root */
export function applyAccentColor(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  const el = document.documentElement;
  el.style.setProperty("--color-accent", hex);
  el.style.setProperty("--color-accent-light", lighten(hex));
  el.style.setProperty("--color-accent-glow", `rgba(${r}, ${g}, ${b}, 0.15)`);
}

/** Load saved accent from DB and apply. Call once at app startup. */
export async function loadSavedTheme() {
  try {
    const saved = await getSettingValue(THEME_KEY);
    if (saved) applyAccentColor(saved);
  } catch { /* DB not ready yet — use CSS defaults */ }
}

export function ThemeCustomizer() {
  const [selectedColor, setSelectedColor] = useState("#6366f1");

  // Load saved accent on mount
  useEffect(() => {
    getSettingValue(THEME_KEY).then((saved) => {
      if (saved) {
        setSelectedColor(saved);
        applyAccentColor(saved);
      }
    }).catch(() => {});
  }, []);

  const handleSelect = (hex: string) => {
    setSelectedColor(hex);
    applyAccentColor(hex);
    setSettingValue(THEME_KEY, hex).catch(() => {});
  };

  return (
    <GlassCard interactive>
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
                  "relative w-7 h-7 rounded-full transition-all duration-200 flex items-center justify-center",
                  selectedColor === color.hex
                    ? "ring-2 ring-offset-2 ring-offset-base scale-110"
                    : "hover:scale-110"
                )}
                style={{
                  background: color.hex,
                  opacity: selectedColor === color.hex ? 1 : 0.55,
                  ["--tw-ring-color" as string]: selectedColor === color.hex ? color.hex : undefined,
                }}
                whileHover={{ scale: 1.15, opacity: 0.85 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSelect(color.hex)}
                title={color.name}
              >
                {selectedColor === color.hex && (
                  <Check className="w-3.5 h-3.5 text-white drop-shadow-sm" strokeWidth={2.5} />
                )}
              </motion.button>
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
