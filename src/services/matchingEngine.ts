import type { ActiveWindowInfo } from "@/services/detectionService";
import type { Profile, AppRule } from "@/types/profile";

export type MatchResult = "on_task" | "off_task" | "ambiguous";

const BROWSER_PROCESSES = [
  "chrome.exe",
  "msedge.exe",
  "firefox.exe",
  "brave.exe",
  "opera.exe",
  "arc.exe",
];

function isBrowser(processName: string): boolean {
  return BROWSER_PROCESSES.includes(processName.toLowerCase());
}

function matchesSitePattern(title: string, pattern: string): boolean {
  const lowerTitle = title.toLowerCase();
  const lowerPattern = pattern.toLowerCase();
  return lowerTitle.includes(lowerPattern);
}

function findMatchingRule(
  processName: string,
  rules: AppRule[]
): AppRule | null {
  const lowerProcess = processName.toLowerCase();
  for (const rule of rules) {
    if (rule.process.toLowerCase() === lowerProcess) {
      return rule;
    }
  }
  return null;
}

export function matchWindowAgainstProfile(
  window: ActiveWindowInfo,
  profile: Profile
): MatchResult {
  const rule = findMatchingRule(window.process_name, profile.apps);

  if (rule) {
    // Check if the process is a browser with site-level rules
    if (isBrowser(window.process_name) && rule.sites && rule.sites.length > 0) {
      const siteMatch = rule.sites.some((site) =>
        matchesSitePattern(window.title, site)
      );

      if (siteMatch) {
        // A site rule matched
        if (profile.mode === "whitelist") {
          return rule.allowed ? "on_task" : "off_task";
        }
        // blacklist mode
        return rule.allowed ? "on_task" : "off_task";
      }

      // Browser matched but no site rule matched — ambiguous
      return "ambiguous";
    }

    // Non-browser app or browser without site rules
    if (profile.mode === "whitelist") {
      return rule.allowed ? "on_task" : "off_task";
    }
    // blacklist mode
    return rule.allowed ? "on_task" : "off_task";
  }

  // No matching rule found
  if (profile.mode === "whitelist") {
    // Whitelist: anything not explicitly listed is off-task
    return "off_task";
  }
  // Blacklist: anything not explicitly listed is on-task
  return "on_task";
}
