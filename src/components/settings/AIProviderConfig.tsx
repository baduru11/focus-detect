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
    idle: "bg-text-muted",
    testing: "bg-neon-orange animate-pulse",
    connected: "bg-neon-green",
    error: "bg-neon-red",
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
        className={cn("w-2.5 h-2.5 rounded-full", colors[status])}
        style={
          status === "connected"
            ? { boxShadow: "0 0 8px rgba(0, 255, 136, 0.6)" }
            : status === "error"
              ? { boxShadow: "0 0 8px rgba(255, 0, 60, 0.6)" }
              : undefined
        }
      />
      <span className="text-xs text-text-muted">{labels[status]}</span>
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
      <div className="flex items-center gap-3 mb-5">
        <Brain className="w-5 h-5 text-neon-cyan" />
        <h2 className="text-lg font-semibold text-text-primary">AI Provider</h2>
      </div>

      <div className="flex flex-col gap-5">
        <NeonToggle
          checked={aiEnabled}
          onChange={setAiEnabled}
          label="Enable AI Vision"
        />

        <motion.div
          className="flex flex-col gap-4"
          animate={{ opacity: aiEnabled ? 1 : 0.4 }}
          style={{ pointerEvents: aiEnabled ? "auto" : "none" }}
        >
          {PROVIDERS.map(({ key, label, placeholder }) => (
            <div
              key={key}
              className="glass-panel rounded-xl p-4 border border-border-glow flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text-primary">
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
