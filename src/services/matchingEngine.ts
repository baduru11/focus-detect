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
  "whale.exe",
  "vivaldi.exe",
  "thorium.exe",
  "ungoogled-chromium.exe",
  "chromium.exe",
];

function isBrowser(processName: string): boolean {
  return BROWSER_PROCESSES.includes(processName.toLowerCase());
}

function matchesSitePattern(title: string, pattern: string): boolean {
  const lowerTitle = title.toLowerCase();
  const lowerPattern = pattern.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
  // Match against both the domain and common title patterns
  // e.g. "youtube.com" matches title "Some Video - YouTube" (strip .com and check)
  const domainBase = lowerPattern.replace(/\.\w+$/, ""); // "youtube.com" -> "youtube"
  return lowerTitle.includes(lowerPattern) || lowerTitle.includes(domainBase);
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

/**
 * Collect ALL site rules across all browser rules in the profile.
 * This way if "youtube.com" is blocked on chrome.exe, it's also blocked on whale.exe.
 */
function getAllBlockedSites(profile: Profile): string[] {
  const sites: string[] = [];
  for (const rule of profile.apps) {
    if (!rule.allowed && rule.sites) {
      sites.push(...rule.sites);
    }
  }
  return [...new Set(sites)];
}

function getAllAllowedSites(profile: Profile): string[] {
  const sites: string[] = [];
  for (const rule of profile.apps) {
    if (rule.allowed && rule.sites) {
      sites.push(...rule.sites);
    }
  }
  return [...new Set(sites)];
}

export function matchWindowAgainstProfile(
  window: ActiveWindowInfo,
  profile: Profile
): MatchResult {
  const rule = findMatchingRule(window.process_name, profile.apps);

  console.log(`[Match] process="${window.process_name}" title="${window.title.slice(0,50)}" rule=${rule ? `found(allowed=${rule.allowed})` : "none"} mode=${profile.mode} apps=${profile.apps.map(a=>a.process).join(",")}`);


  // If the current process is a browser (even if not explicitly in rules),
  // check window title against ALL site rules from the profile
  if (isBrowser(window.process_name)) {
    if (profile.mode === "blacklist") {
      const blockedSites = getAllBlockedSites(profile);
      if (blockedSites.length > 0) {
        const siteMatch = blockedSites.some((site) =>
          matchesSitePattern(window.title, site)
        );
        if (siteMatch) return "off_task";
      }
    } else {
      // whitelist mode — only allowed sites are OK
      const allowedSites = getAllAllowedSites(profile);
      if (allowedSites.length > 0) {
        const siteMatch = allowedSites.some((site) =>
          matchesSitePattern(window.title, site)
        );
        if (siteMatch) return "on_task";
        return "off_task";
      }
    }

    // Browser with no matching site rules — ambiguous
    if (rule) {
      return rule.allowed ? "on_task" : "off_task";
    }
    return "ambiguous";
  }

  // Non-browser app
  if (rule) {
    return rule.allowed ? "on_task" : "off_task";
  }

  // No matching rule found
  return profile.mode === "whitelist" ? "off_task" : "on_task";
}
