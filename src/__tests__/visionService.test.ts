import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// We need a fresh module for each test to reset the module-level Ollama cache
// (ollamaCacheResult / ollamaCacheTime). Dynamic import + vi.resetModules()
// achieves this.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Global fetch mock
// ---------------------------------------------------------------------------
const fetchMock = vi.fn<typeof globalThis.fetch>();
vi.stubGlobal("fetch", fetchMock);

// Helpers to build Response-like objects
function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

function errorResponse(body: string, status = 500): Response {
  return {
    ok: false,
    status,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(body),
  } as unknown as Response;
}

/** Import fresh module with reset cache state */
async function freshImport() {
  vi.resetModules();
  return await import("@/services/visionService");
}

// ---------------------------------------------------------------------------
// Reset state between tests
// ---------------------------------------------------------------------------
beforeEach(() => {
  fetchMock.mockReset();
});

// ---------------------------------------------------------------------------
// 1. analyzeScreenshot — no providers configured
// ---------------------------------------------------------------------------
describe("analyzeScreenshot", () => {
  it("returns onTask:true, confidence:0 when no providers are configured", async () => {
    const { analyzeScreenshot } = await freshImport();

    // Ollama is not reachable, and no API keys supplied
    fetchMock.mockRejectedValue(new Error("Network error"));

    const result = await analyzeScreenshot("base64img", "writing code", {});

    expect(result.onTask).toBe(true);
    expect(result.confidence).toBe(0);
    expect(result.reason).toMatch(/no ai vision providers/i);
  });

  // -------------------------------------------------------------------------
  // 2. Ollama available and responding
  // -------------------------------------------------------------------------
  it("returns parsed result when Ollama is available and responds", async () => {
    const { analyzeScreenshot } = await freshImport();

    // First call: isOllamaCached -> isOllamaAvailable -> GET /api/tags
    // Second call: OllamaProvider.analyze -> POST /api/generate
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ models: [] })) // /api/tags OK
      .mockResolvedValueOnce(
        jsonResponse({
          response:
            '{"onTask": false, "confidence": 0.85, "reason": "Playing a game"}',
        })
      );

    const result = await analyzeScreenshot("base64img", "writing code", {});

    expect(result.onTask).toBe(false);
    expect(result.confidence).toBe(0.85);
    expect(result.reason).toBe("Playing a game");

    // Verify the generate call was made to Ollama
    const generateCall = fetchMock.mock.calls[1];
    expect(generateCall[0]).toContain("/api/generate");
  });

  // -------------------------------------------------------------------------
  // 3. Ollama fails, Gemini succeeds (fallback)
  // -------------------------------------------------------------------------
  it("falls back to Gemini when Ollama fails", async () => {
    const { analyzeScreenshot } = await freshImport();
    const geminiKey = "test-gemini-key";

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ models: [] })) // /api/tags OK
      .mockResolvedValueOnce(errorResponse("Ollama model not found", 404)) // Ollama generate fails
      .mockResolvedValueOnce(
        jsonResponse({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: '{"onTask": true, "confidence": 0.9, "reason": "Writing code in VS Code"}',
                  },
                ],
              },
            },
          ],
        })
      ); // Gemini succeeds

    const result = await analyzeScreenshot("base64img", "writing code", {
      gemini: geminiKey,
    });

    expect(result.onTask).toBe(true);
    expect(result.confidence).toBe(0.9);
    expect(result.reason).toBe("Writing code in VS Code");

    // Verify Gemini was called (third fetch call)
    const geminiCall = fetchMock.mock.calls[2];
    expect(geminiCall[0]).toContain("generativelanguage.googleapis.com");
  });

  // -------------------------------------------------------------------------
  // 4. All providers fail
  // -------------------------------------------------------------------------
  it("returns onTask:true with 'all failed' reason when every provider fails", async () => {
    const { analyzeScreenshot } = await freshImport();

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ models: [] })) // Ollama tags OK
      .mockResolvedValueOnce(errorResponse("Ollama error", 500)) // Ollama generate fails
      .mockResolvedValueOnce(errorResponse("Gemini error", 500)) // Gemini fails
      .mockResolvedValueOnce(errorResponse("Groq error", 500)) // Groq fails
      .mockResolvedValueOnce(errorResponse("OpenRouter error", 500)); // OpenRouter fails

    const result = await analyzeScreenshot("base64img", "writing code", {
      gemini: "gk",
      groq: "grk",
      openRouter: "ork",
    });

    expect(result.onTask).toBe(true);
    expect(result.confidence).toBe(0);
    expect(result.reason).toMatch(/all.*failed/i);
  });
});

// ---------------------------------------------------------------------------
// 5-8. parseVisionResponse (tested indirectly via analyzeScreenshot -> Ollama)
// ---------------------------------------------------------------------------
describe("parseVisionResponse (indirect via Ollama)", () => {
  /** Helper: fresh module + Ollama available, return a custom response */
  async function analyzeViaOllama(responseText: string) {
    const { analyzeScreenshot } = await freshImport();
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ models: [] })) // tags
      .mockResolvedValueOnce(jsonResponse({ response: responseText })); // generate
    return analyzeScreenshot("img", "coding", {});
  }

  // 5. Valid JSON
  it("parses valid JSON correctly", async () => {
    const result = await analyzeViaOllama(
      '{"onTask": true, "confidence": 0.7, "reason": "On task"}'
    );
    expect(result.onTask).toBe(true);
    expect(result.confidence).toBe(0.7);
    expect(result.reason).toBe("On task");
  });

  // 6. JSON inside markdown code block
  it("extracts JSON from a markdown code block", async () => {
    const result = await analyzeViaOllama(
      '```json\n{"onTask": false, "confidence": 0.6, "reason": "Browsing Reddit"}\n```'
    );
    expect(result.onTask).toBe(false);
    expect(result.confidence).toBe(0.6);
    expect(result.reason).toBe("Browsing Reddit");
  });

  // 7. No JSON in response -> provider throws, falls through to "all failed"
  it("treats response with no JSON as a provider failure", async () => {
    const { analyzeScreenshot } = await freshImport();
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ models: [] }))
      .mockResolvedValueOnce(
        jsonResponse({ response: "I cannot analyze this image." })
      );

    // No other providers configured, so we get the "all failed" fallback
    const result = await analyzeScreenshot("img", "coding", {});
    expect(result.onTask).toBe(true);
    expect(result.confidence).toBe(0);
    expect(result.reason).toMatch(/failed/i);
  });

  // 8. Confidence clamped to 0-1 range
  it("clamps confidence above 1 down to 1", async () => {
    const result = await analyzeViaOllama(
      '{"onTask": true, "confidence": 5.0, "reason": "Very sure"}'
    );
    expect(result.confidence).toBe(1);
  });

  it("clamps negative confidence up to 0", async () => {
    const result = await analyzeViaOllama(
      '{"onTask": false, "confidence": -0.5, "reason": "Unsure"}'
    );
    expect(result.confidence).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 9-10. isOllamaAvailable
// ---------------------------------------------------------------------------
describe("isOllamaAvailable", () => {
  // 9. Server responds OK
  it("returns true when server responds OK", async () => {
    const { isOllamaAvailable } = await freshImport();
    fetchMock.mockResolvedValueOnce(jsonResponse({ models: [] }));

    const available = await isOllamaAvailable("http://localhost:11434");

    expect(available).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:11434/api/tags",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  // 10. Server unreachable
  it("returns false when server is unreachable", async () => {
    const { isOllamaAvailable } = await freshImport();
    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const available = await isOllamaAvailable("http://localhost:11434");

    expect(available).toBe(false);
  });

  it("returns false when server returns non-OK status", async () => {
    const { isOllamaAvailable } = await freshImport();
    fetchMock.mockResolvedValueOnce(errorResponse("Not Found", 404));

    const available = await isOllamaAvailable("http://localhost:11434");

    expect(available).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 11-12. Ollama cache (isOllamaCached)
// ---------------------------------------------------------------------------
describe("Ollama availability cache", () => {
  // 11. Cached result reused within 60s
  it("does not re-fetch within 60s TTL", async () => {
    const { analyzeScreenshot } = await freshImport();

    // First analyzeScreenshot: isOllamaCached fetches /api/tags
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ models: [] })) // tags (first check)
      .mockResolvedValueOnce(
        jsonResponse({
          response: '{"onTask": true, "confidence": 0.5, "reason": "ok"}',
        })
      );

    await analyzeScreenshot("img", "coding", {});
    const firstCallCount = fetchMock.mock.calls.length; // should be 2

    // Less than 60s elapses (Date.now() barely changes in-process)
    // Second analyzeScreenshot should NOT call /api/tags again
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        response: '{"onTask": true, "confidence": 0.5, "reason": "ok"}',
      })
    );

    await analyzeScreenshot("img", "coding", {});
    const secondCallCount = fetchMock.mock.calls.length;

    // Only 1 additional call (the generate call), no tags re-check
    expect(secondCallCount - firstCallCount).toBe(1);
  });

  // 12. Cache expires after 60s
  it("re-checks Ollama after 60s TTL expires", async () => {
    const { analyzeScreenshot } = await freshImport();

    // Spy on Date.now to control time
    const realNow = Date.now();
    const dateNowSpy = vi.spyOn(Date, "now");

    // First call at time T
    dateNowSpy.mockReturnValue(realNow);

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ models: [] })) // tags
      .mockResolvedValueOnce(
        jsonResponse({
          response: '{"onTask": true, "confidence": 0.5, "reason": "ok"}',
        })
      );

    await analyzeScreenshot("img", "coding", {});
    const afterFirstCount = fetchMock.mock.calls.length;

    // Advance past TTL (61 seconds later)
    dateNowSpy.mockReturnValue(realNow + 61_000);

    // Second call should re-check /api/tags
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ models: [] })) // tags again
      .mockResolvedValueOnce(
        jsonResponse({
          response: '{"onTask": true, "confidence": 0.5, "reason": "ok"}',
        })
      );

    await analyzeScreenshot("img", "coding", {});
    const afterSecondCount = fetchMock.mock.calls.length;

    // 2 additional calls: tags + generate
    expect(afterSecondCount - afterFirstCount).toBe(2);

    dateNowSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// 13. Gemini security: uses x-goog-api-key header
// ---------------------------------------------------------------------------
describe("Gemini provider security", () => {
  it("sends API key via x-goog-api-key header, not as URL query param", async () => {
    const { analyzeScreenshot } = await freshImport();
    const geminiKey = "super-secret-gemini-key";

    // Make Ollama unavailable so Gemini is the first provider tried
    fetchMock
      .mockRejectedValueOnce(new Error("ECONNREFUSED")) // Ollama tags fails
      .mockResolvedValueOnce(
        jsonResponse({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: '{"onTask": true, "confidence": 0.8, "reason": "Coding"}',
                  },
                ],
              },
            },
          ],
        })
      ); // Gemini succeeds

    await analyzeScreenshot("img", "coding", { gemini: geminiKey });

    // Find the Gemini call (second fetch call)
    const geminiCall = fetchMock.mock.calls[1];
    const [url, options] = geminiCall;

    // URL must NOT contain the API key as a query parameter
    expect(String(url)).not.toContain(geminiKey);
    expect(String(url)).not.toContain("key=");

    // API key must be in the x-goog-api-key header
    const headers = (options as RequestInit).headers as Record<string, string>;
    expect(headers["x-goog-api-key"]).toBe(geminiKey);
  });
});
