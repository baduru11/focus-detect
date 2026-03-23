import type { VisionProvider, VisionResult } from "@/types/ai";

export interface ApiKeys {
  gemini?: string;
  groq?: string;
  openRouter?: string;
  ollamaModel?: string;
  ollamaEndpoint?: string;
}

const VISION_PROMPT_TEMPLATE = (profileContext: string) =>
  `The user should be doing: ${profileContext}. Based on this screenshot, are they on task? Respond with JSON only, no markdown: {"onTask": bool, "confidence": 0-1, "reason": "string"}`;

function parseVisionResponse(text: string): VisionResult {
  // Try to extract JSON from the response, handling markdown code blocks
  const jsonMatch = text.match(/\{[\s\S]*?"onTask"[\s\S]*?\}/);
  if (!jsonMatch) {
    throw new Error("No valid JSON found in vision response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    onTask: Boolean(parsed.onTask),
    confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0)),
    reason: String(parsed.reason || "No reason provided"),
  };
}

/**
 * Check if Ollama is running and accessible at the given endpoint.
 */
export async function isOllamaAvailable(
  endpoint: string = "http://localhost:11434"
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${endpoint}/api/tags`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

class OllamaProvider implements VisionProvider {
  name = "Ollama";
  type = "local" as const;
  private model: string;
  private endpoint: string;

  constructor(model: string = "llava", endpoint: string = "http://localhost:11434") {
    this.model = model;
    this.endpoint = endpoint;
  }

  async analyze(screenshot: string, profileContext: string): Promise<VisionResult> {
    const prompt = VISION_PROMPT_TEMPLATE(profileContext);

    const response = await fetch(`${this.endpoint}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        prompt,
        images: [screenshot],
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 256,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Ollama API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const text = data.response;
    if (!text) {
      throw new Error("Empty response from Ollama");
    }

    return parseVisionResponse(text);
  }
}

class GeminiProvider implements VisionProvider {
  name = "Gemini";
  type = "cloud" as const;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyze(screenshot: string, profileContext: string): Promise<VisionResult> {
    const prompt = VISION_PROMPT_TEMPLATE(profileContext);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: "image/png",
                    data: screenshot,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 256,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    return parseVisionResponse(text);
  }
}

class GroqProvider implements VisionProvider {
  name = "Groq";
  type = "cloud" as const;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyze(screenshot: string, profileContext: string): Promise<VisionResult> {
    const prompt = VISION_PROMPT_TEMPLATE(profileContext);

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.2-90b-vision-preview",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/png;base64,${screenshot}`,
                  },
                },
              ],
            },
          ],
          temperature: 0.1,
          max_tokens: 256,
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Groq API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error("Empty response from Groq");
    }

    return parseVisionResponse(text);
  }
}

class OpenRouterProvider implements VisionProvider {
  name = "OpenRouter";
  type = "cloud" as const;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyze(screenshot: string, profileContext: string): Promise<VisionResult> {
    const prompt = VISION_PROMPT_TEMPLATE(profileContext);

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "X-Title": "Focus Detector",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-maverick:free",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/png;base64,${screenshot}`,
                  },
                },
              ],
            },
          ],
          temperature: 0.1,
          max_tokens: 256,
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenRouter API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error("Empty response from OpenRouter");
    }

    return parseVisionResponse(text);
  }
}

// Cache Ollama availability to avoid 3s timeout on every check
let ollamaCacheResult: boolean | null = null;
let ollamaCacheTime = 0;
const OLLAMA_CACHE_TTL = 60_000; // 60 seconds

async function isOllamaCached(endpoint: string): Promise<boolean> {
  const now = Date.now();
  if (ollamaCacheResult !== null && now - ollamaCacheTime < OLLAMA_CACHE_TTL) {
    return ollamaCacheResult;
  }
  ollamaCacheResult = await isOllamaAvailable(endpoint);
  ollamaCacheTime = now;
  return ollamaCacheResult;
}

export async function analyzeScreenshot(
  base64Screenshot: string,
  profileContext: string,
  apiKeys: ApiKeys
): Promise<VisionResult> {
  const providers: VisionProvider[] = [];

  // Ollama (local) is first in the chain — free and fast if available
  const ollamaEndpoint = apiKeys.ollamaEndpoint || "http://localhost:11434";
  const ollamaModel = apiKeys.ollamaModel || "llava";
  const ollamaUp = await isOllamaCached(ollamaEndpoint);
  if (ollamaUp) {
    providers.push(new OllamaProvider(ollamaModel, ollamaEndpoint));
  }

  // Cloud providers as fallbacks
  if (apiKeys.gemini) {
    providers.push(new GeminiProvider(apiKeys.gemini));
  }
  if (apiKeys.groq) {
    providers.push(new GroqProvider(apiKeys.groq));
  }
  if (apiKeys.openRouter) {
    providers.push(new OpenRouterProvider(apiKeys.openRouter));
  }

  if (providers.length === 0) {
    return {
      onTask: true,
      confidence: 0,
      reason: "No AI vision providers available. Configure Ollama or add API keys.",
    };
  }

  const errors: string[] = [];

  for (const provider of providers) {
    try {
      const result = await provider.analyze(base64Screenshot, profileContext);
      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      errors.push(`${provider.name}: ${message}`);
      console.warn(`Vision provider ${provider.name} failed:`, message);
    }
  }

  return {
    onTask: true,
    confidence: 0,
    reason: `All vision providers failed: ${errors.join("; ")}`,
  };
}
