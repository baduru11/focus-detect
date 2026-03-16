import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonInput } from "@/components/ui/NeonInput";
import { NeonToggle } from "@/components/ui/NeonToggle";

type ConnectionStatus = "idle" | "testing" | "connected" | "error";

interface ProviderState {
  apiKey: string;
  status: ConnectionStatus;
}

const PROVIDERS = [
  { key: "gemini", label: "Gemini", placeholder: "AIza..." },
  { key: "groq", label: "Groq", placeholder: "gsk_..." },
  { key: "openrouter", label: "OpenRouter", placeholder: "sk-or-..." },
] as const;

type ProviderKey = (typeof PROVIDERS)[number]["key"];

function StatusDot({ status }: { status: ConnectionStatus }) {
  const colors: Record<ConnectionStatus, string> = {
    idle: "bg-text-muted/50",
    testing: "bg-neon-orange/60 animate-pulse",
    connected: "bg-neon-green/60",
    error: "bg-neon-red/60",
  };

  const labels: Record<ConnectionStatus, string> = {
    idle: "Not configured",
    testing: "Testing...",
    connected: "Connected",
    error: "Error",
  };

  return (
    <div className="flex items-center gap-2">
      <motion.div
        className={cn("w-2 h-2 rounded-full", colors[status])}
      />
      <span className="text-[10px] text-text-muted">{labels[status]}</span>
    </div>
  );
}

export function AIProviderConfig() {
  const [aiEnabled, setAiEnabled] = useState(false);
  const [providers, setProviders] = useState<Record<ProviderKey, ProviderState>>(
    {
      gemini: { apiKey: "", status: "idle" },
      groq: { apiKey: "", status: "idle" },
      openrouter: { apiKey: "", status: "idle" },
    }
  );

  const updateProviderKey = (key: ProviderKey, apiKey: string) => {
    setProviders((prev) => ({
      ...prev,
      [key]: { ...prev[key], apiKey, status: apiKey ? prev[key].status : "idle" },
    }));
  };

  const testConnection = async (key: ProviderKey) => {
    setProviders((prev) => ({
      ...prev,
      [key]: { ...prev[key], status: "testing" },
    }));

    // Simulate connection test
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const hasKey = providers[key].apiKey.trim().length > 0;
    setProviders((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        status: hasKey ? "connected" : "error",
      },
    }));
  };

  return (
    <GlassCard>
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-4 h-4 text-neon-cyan/60" />
        <h2 className="text-base font-semibold text-text-primary">AI Provider</h2>
      </div>

      <div className="flex flex-col gap-6">
        <NeonToggle
          checked={aiEnabled}
          onChange={setAiEnabled}
          label="Enable AI Vision"
        />

        <motion.div
          className="flex flex-col gap-5"
          animate={{ opacity: aiEnabled ? 1 : 0.4 }}
          style={{ pointerEvents: aiEnabled ? "auto" : "none" }}
        >
          {PROVIDERS.map(({ key, label, placeholder }) => (
            <div
              key={key}
              className="rounded-lg p-4 border border-white/[0.04] bg-white/[0.02] flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">
                  {label}
                </span>
                <StatusDot status={providers[key].status} />
              </div>

              <NeonInput
                type="password"
                placeholder={placeholder}
                value={providers[key].apiKey}
                onChange={(e) => updateProviderKey(key, e.target.value)}
              />

              <NeonButton
                variant="ghost"
                size="sm"
                onClick={() => testConnection(key)}
                disabled={
                  !providers[key].apiKey.trim() ||
                  providers[key].status === "testing"
                }
              >
                {providers[key].status === "testing" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 inline animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test Connection"
                )}
              </NeonButton>
            </div>
          ))}
        </motion.div>
      </div>
    </GlassCard>
  );
}
