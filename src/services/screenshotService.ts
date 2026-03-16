import { invoke } from "@tauri-apps/api/core";

/**
 * Capture a screenshot of the primary monitor via the Rust backend.
 * Returns the screenshot as a base64-encoded PNG string (no data URI prefix).
 */
export async function captureScreenshot(): Promise<string> {
  return invoke<string>("capture_screenshot");
}
