import { getSettingValue, setSettingValue } from "@/services/profileService";
import type { ApiKeys } from "@/services/visionService";

// Setting keys used for AI provider configuration
const SETTING_KEYS = {
  aiEnabled: "ai_enabled",
  geminiKey: "ai_gemini_key",
  groqKey: "ai_groq_key",
  openRouterKey: "ai_openrouter_key",
  ollamaModel: "ai_ollama_model",
  ollamaEndpoint: "ai_ollama_endpoint",
} as const;

export interface AISettings {
  enabled: boolean;
  keys: ApiKeys;
}

/**
 * Load all AI-related settings from the SQLite settings table.
 */
export async function loadAISettings(): Promise<AISettings> {
  const [enabled, gemini, groq, openRouter, ollamaModel, ollamaEndpoint] =
    await Promise.all([
      getSettingValue(SETTING_KEYS.aiEnabled),
      getSettingValue(SETTING_KEYS.geminiKey),
      getSettingValue(SETTING_KEYS.groqKey),
      getSettingValue(SETTING_KEYS.openRouterKey),
      getSettingValue(SETTING_KEYS.ollamaModel),
      getSettingValue(SETTING_KEYS.ollamaEndpoint),
    ]);

  return {
    enabled: enabled === "true",
    keys: {
      gemini: gemini || undefined,
      groq: groq || undefined,
      openRouter: openRouter || undefined,
      ollamaModel: ollamaModel || "llava",
      ollamaEndpoint: ollamaEndpoint || "http://localhost:11434",
    },
  };
}

/**
 * Save the AI-enabled toggle.
 */
export async function saveAIEnabled(enabled: boolean): Promise<void> {
  await setSettingValue(SETTING_KEYS.aiEnabled, String(enabled));
}

/**
 * Save an individual API key to the settings table.
 */
export async function saveApiKey(
  provider: "gemini" | "groq" | "openRouter",
  key: string
): Promise<void> {
  const settingKey =
    provider === "gemini"
      ? SETTING_KEYS.geminiKey
      : provider === "groq"
        ? SETTING_KEYS.groqKey
        : SETTING_KEYS.openRouterKey;

  await setSettingValue(settingKey, key);
}

/**
 * Save Ollama-specific settings.
 */
export async function saveOllamaSettings(
  model: string,
  endpoint: string
): Promise<void> {
  await Promise.all([
    setSettingValue(SETTING_KEYS.ollamaModel, model),
    setSettingValue(SETTING_KEYS.ollamaEndpoint, endpoint),
  ]);
}

/**
 * Convenience: get the current ApiKeys config for use by the vision service.
 */
export async function getAIConfig(): Promise<ApiKeys> {
  const settings = await loadAISettings();
  if (!settings.enabled) {
    // AI is disabled — return empty keys so no provider is used
    return {};
  }
  return settings.keys;
}
