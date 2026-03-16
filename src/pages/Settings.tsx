import { useState } from "react";
import { motion } from "framer-motion";
import {
  Palette,
  Brain,
  ImageIcon,
  Database,
  Volume2,
  Monitor,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonToggle } from "@/components/ui/NeonToggle";
import { NeonSlider } from "@/components/ui/NeonSlider";
import { NeonInput } from "@/components/ui/NeonInput";
import { NeonButton } from "@/components/ui/NeonButton";

interface SettingsSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}

function SettingsSection({ title, icon, children, delay = 0 }: SettingsSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <GlassCard className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
        </div>
        <div className="flex flex-col gap-4">{children}</div>
      </GlassCard>
    </motion.div>
  );
}

export default function Settings() {
  const [darkMode, setDarkMode] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(75);
  const [memeAlerts, setMemeAlerts] = useState(true);
  const [aiProvider, setAiProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [particleEffects, setParticleEffects] = useState(true);

  return (
    <div className="h-full p-8 overflow-y-auto">
      <motion.h1
        className="text-3xl font-bold text-text-primary tracking-tight mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Settings
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
        {/* Theme */}
        <SettingsSection
          title="Theme"
          icon={<Palette className="w-5 h-5 text-neon-purple" />}
          delay={0.1}
        >
          <NeonToggle
            checked={darkMode}
            onChange={setDarkMode}
            label="Dark Mode (Cyberpunk)"
          />
          <NeonToggle
            checked={particleEffects}
            onChange={setParticleEffects}
            label="Particle Background Effects"
          />
          <div className="flex items-center gap-3">
            <Monitor className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-secondary">
              Accent Color
            </span>
            <div className="flex gap-2 ml-auto">
              {["#00f0ff", "#bf00ff", "#ff003c", "#00ff88"].map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded-full border-2 border-transparent hover:border-white/30 transition-colors"
                  style={{
                    background: color,
                    boxShadow: `0 0 8px ${color}40`,
                  }}
                />
              ))}
            </div>
          </div>
        </SettingsSection>

        {/* AI Provider */}
        <SettingsSection
          title="AI Provider"
          icon={<Brain className="w-5 h-5 text-neon-cyan" />}
          delay={0.2}
        >
          <div className="flex gap-3">
            {["openai", "anthropic", "local"].map((provider) => (
              <NeonButton
                key={provider}
                variant={aiProvider === provider ? "primary" : "ghost"}
                size="sm"
                onClick={() => setAiProvider(provider)}
              >
                {provider.charAt(0).toUpperCase() + provider.slice(1)}
              </NeonButton>
            ))}
          </div>
          <NeonInput
            label="API Key"
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </SettingsSection>

        {/* Memes & Sound */}
        <SettingsSection
          title="Memes & Alerts"
          icon={<ImageIcon className="w-5 h-5 text-neon-green" />}
          delay={0.3}
        >
          <NeonToggle
            checked={memeAlerts}
            onChange={setMemeAlerts}
            label="Show Meme Alerts"
          />
          <NeonToggle
            checked={soundEnabled}
            onChange={setSoundEnabled}
            label="Sound Effects"
          />
          <NeonSlider
            label="Volume"
            min={0}
            max={100}
            value={volume}
            onChange={setVolume}
            unit="%"
          />
          <div className="flex items-center gap-2 text-text-muted">
            <Volume2 className="w-4 h-4" />
            <span className="text-xs">
              Alarm sound plays when distraction is detected
            </span>
          </div>
        </SettingsSection>

        {/* Data */}
        <SettingsSection
          title="Data & Storage"
          icon={<Database className="w-5 h-5 text-neon-red" />}
          delay={0.4}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">
              Local data usage
            </span>
            <span className="text-sm font-mono text-text-primary">
              2.4 MB
            </span>
          </div>
          <div className="flex gap-3">
            <NeonButton variant="ghost" size="sm">
              Export Data
            </NeonButton>
            <NeonButton variant="danger" size="sm">
              Clear All Data
            </NeonButton>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
