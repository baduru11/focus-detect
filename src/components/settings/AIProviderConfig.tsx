import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Brain, Loader2, Server } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonInput } from "@/components/ui/NeonInput";
import { NeonToggle } from "@/components/ui/NeonToggle";
import {
  loadAISettings,
  saveAIEnabled,
  saveApiKey,
  saveOllamaSettings,
} from "@/services/settingsService";
import { isOllamaAvailable } from "@/services/visionService";

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

// Map UI keys to settingsService keys
const PROVIDER_SAVE_KEY: Record<ProviderKey, "gemini" | "groq" | "openRouter"> = {
  gemini: "gemini",
  groq: "groq",
  openrouter: "openRouter",
};

function StatusDot({ status }: { status: ConnectionStatus }) {
  const colors: Record<ConnectionStatus, string> = {
    idle: "bg-text-muted/50",
    testing: "bg-warning/60 animate-pulse",
    connected: "bg-success/60",
    error: "bg-danger/60",
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
      <span className="text-[11px] text-text-muted font-medium">{labels[status]}</span>
    </div>
  );
}

export function AIProviderConfig() {
  const [aiEnabled, setAiEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [providers, setProviders] = useState<Record<ProviderKey, ProviderState>>(
    {
      gemini: { apiKey: "", status: "idle" },
      groq: { apiKey: "", status: "idle" },
      openrouter: { apiKey: "", status: "idle" },
    }
  );
  const [ollamaModel, setOllamaModel] = useState("llava");
  const [ollamaEndpoint, setOllamaEndpoint] = useState("http://localhost:11434");
  const [ollamaStatus, setOllamaStatus] = useState<ConnectionStatus>("idle");

  // Load saved settings on mount
  useEffect(() => {
    loadAISettings()
      .then((settings) => {
        setAiEnabled(settings.enabled);
        setProviders({
          gemini: {
            apiKey: settings.keys.gemini || "",
            status: settings.keys.gemini ? "connected" : "idle",
          },
          groq: {
            apiKey: settings.keys.groq || "",
            status: settings.keys.groq ? "connected" : "idle",
          },
          openrouter: {
            apiKey: settings.keys.openRouter || "",
            status: settings.keys.openRouter ? "connected" : "idle",
          },
        });
        setOllamaModel(settings.keys.ollamaModel || "llava");
        setOllamaEndpoint(settings.keys.ollamaEndpoint || "http://localhost:11434");
        setLoaded(true);
      })
      .catch((err) => {
        console.warn("Failed to load AI settings:", err);
        setLoaded(true);
      });
  }, []);

  // Check Ollama connectivity on mount and when endpoint changes
  useEffect(() => {
    if (!loaded) return;
    setOllamaStatus("testing");
    isOllamaAvailable(ollamaEndpoint).then((available) => {
      setOllamaStatus(available ? "connected" : "idle");
    });
  }, [ollamaEndpoint, loaded]);

  const handleToggleAI = useCallback(
    (enabled: boolean) => {
      setAiEnabled(enabled);
      saveAIEnabled(enabled).catch(console.warn);
    },
    []
  );

  const updateProviderKey = useCallback(
    (key: ProviderKey, apiKey: string) => {
      setProviders((prev) => ({
        ...prev,
        [key]: { ...prev[key], apiKey, status: apiKey ? prev[key].status : "idle" },
      }));
    },
    []
  );

  const saveProviderKey = useCallback(
    (key: ProviderKey) => {
      const value = providers[key].apiKey.trim();
      if (!value) return;

      setProviders((prev) => ({
        ...prev,
        [key]: { ...prev[key], status: "testing" },
      }));

      saveApiKey(PROVIDER_SAVE_KEY[key], value)
        .then(() => {
          setProviders((prev) => ({
            ...prev,
            [key]: { ...prev[key], status: "connected" },
          }));
        })
        .catch(() => {
          setProviders((prev) => ({
            ...prev,
            [key]: { ...prev[key], status: "error" },
          }));
        });
    },
    [providers]
  );

  const testOllama = useCallback(async () => {
    setOllamaStatus("testing");
    // Save settings first
    await saveOllamaSettings(ollamaModel, ollamaEndpoint).catch(console.warn);
    const available = await isOllamaAvailable(ollamaEndpoint);
    setOllamaStatus(available ? "connected" : "error");
  }, [ollamaModel, ollamaEndpoint]);

  return (
    <GlassCard>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
          <Brain className="w-3.5 h-3.5 text-accent-light" strokeWidth={1.8} />
        </div>
        <h2 className="text-sm font-semibold text-text-primary">AI Provider</h2>
      </div>

      <div className="flex flex-col gap-6">
        <NeonToggle
          checked={aiEnabled}
          onChange={handleToggleAI}
          label="Enable AI Vision"
        />

        <motion.div
          className="flex flex-col gap-4"
          animate={{ opacity: aiEnabled ? 1 : 0.35 }}
          style={{ pointerEvents: aiEnabled ? "auto" : "none" }}
        >
          {/* Ollama (Local) */}
          <div className="rounded-xl p-4 border border-white/[0.06] bg-white/[0.02] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-accent/10 flex items-center justify-center">
                  <Server className="w-3 h-3 text-accent-light" strokeWidth={1.8} />
                </div>
                <span className="text-[13px] font-medium text-text-primary">
                  Ollama (Local)
                </span>
              </div>
              <StatusDot status={ollamaStatus} />
            </div>

            <select
              value={ollamaModel}
              onChange={(e) => setOllamaModel(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-text-primary focus:outline-none focus:border-accent/50 transition-colors cursor-pointer appearance-none"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b8ca0' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
            >
              <option value="llava">llava (4.7GB — recommended)</option>
              <option value="llava:13b">llava:13b (8GB — higher quality)</option>
              <option value="llava-phi3">llava-phi3 (2.9GB — fast)</option>
              <option value="moondream">moondream (1.7GB — lightweight)</option>
              <option value="qwen2-vl">qwen2-vl (4.4GB — multilingual)</option>
              <option value="minicpm-v">minicpm-v (5.5GB — balanced)</option>
            </select>

            <NeonInput
              type="text"
              placeholder="http://localhost:11434"
              value={ollamaEndpoint}
              onChange={(e) => setOllamaEndpoint(e.target.value)}
            />

            <NeonButton
              variant="ghost"
              size="sm"
              onClick={testOllama}
              disabled={ollamaStatus === "testing"}
            >
              {ollamaStatus === "testing" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 inline animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Connection"
              )}
            </NeonButton>
          </div>

          {/* Cloud Providers */}
          {PROVIDERS.map(({ key, label, placeholder }) => (
            <div
              key={key}
              className="rounded-xl p-4 border border-white/[0.06] bg-white/[0.02] flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-text-primary">
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
                onClick={() => saveProviderKey(key)}
                disabled={
                  !providers[key].apiKey.trim() ||
                  providers[key].status === "testing"
                }
              >
                {providers[key].status === "testing" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 inline animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save & Test"
                )}
              </NeonButton>
            </div>
          ))}
        </motion.div>
      </div>
    </GlassCard>
  );
}
