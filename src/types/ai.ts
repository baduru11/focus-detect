export interface VisionProvider {
  name: string;
  type: "local" | "cloud";
  analyze(screenshot: string, profileContext: string): Promise<VisionResult>;
}

export interface VisionResult {
  onTask: boolean;
  confidence: number;
  reason: string;
}
