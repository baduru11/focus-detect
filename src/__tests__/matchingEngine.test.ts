import { describe, it, expect } from "vitest";
import {
  matchWindowAgainstProfile,
  type MatchResult,
} from "@/services/matchingEngine";
import type { ActiveWindowInfo } from "@/services/detectionService";
import type { Profile, AppRule } from "@/types/profile";

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

function makeWindow(
  overrides: Partial<ActiveWindowInfo> = {}
): ActiveWindowInfo {
  return {
    title: "Untitled",
    process_name: "unknown.exe",
    app_name: "Unknown",
    ...overrides,
  };
}

function makeRule(overrides: Partial<AppRule> = {}): AppRule {
  return {
    name: "App",
    process: "app.exe",
    allowed: true,
    ...overrides,
  };
}

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "test-profile",
    name: "Test Profile",
    icon: "shield",
    mode: "blacklist",
    apps: [],
    pomodoro: { work: 25, shortBreak: 5, longBreak: 15, cyclesBeforeLong: 4 },
    detection: {
      checkInterval: 30,
      graceCountdown: 5,
      alarmLockDuration: 60,
      alarmLevel: 1,
    },
    monitors: { detection: "primary", alarm: "primary" },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("matchWindowAgainstProfile", () => {
  // -----------------------------------------------------------------------
  // 1. Browser + blacklist mode + blocked site matches title -> off_task
  // -----------------------------------------------------------------------
  describe("browser in blacklist mode with blocked site matching title", () => {
    it("returns off_task when blocked site matches the window title", () => {
      const window = makeWindow({
        process_name: "chrome.exe",
        title: "Funny Cat Compilation - YouTube",
      });
      const profile = makeProfile({
        mode: "blacklist",
        apps: [
          makeRule({
            name: "Chrome",
            process: "chrome.exe",
            allowed: false,
            sites: ["youtube.com"],
          }),
        ],
      });

      expect(matchWindowAgainstProfile(window, profile)).toBe("off_task");
    });

    it("returns off_task when blocked site is on a different browser rule", () => {
      // Site blocked under chrome.exe rule, but window is msedge.exe.
      // getAllBlockedSites collects across ALL rules.
      const window = makeWindow({
        process_name: "msedge.exe",
        title: "Reddit - Pair programming tips",
      });
      const profile = makeProfile({
        mode: "blacklist",
        apps: [
          makeRule({
            name: "Chrome",
            process: "chrome.exe",
            allowed: false,
            sites: ["reddit.com"],
          }),
        ],
      });

      expect(matchWindowAgainstProfile(window, profile)).toBe("off_task");
    });
  });

  // -----------------------------------------------------------------------
  // 2. Browser + blacklist mode + no blocked sites match -> ambiguous
  // -----------------------------------------------------------------------
  describe("browser in blacklist mode with no blocked sites matching", () => {
    it("returns ambiguous when no site rules match and no explicit rule", () => {
      const window = makeWindow({
        process_name: "firefox.exe",
        title: "Stack Overflow - How to center a div",
      });
      const profile = makeProfile({
        mode: "blacklist",
        apps: [
          makeRule({
            name: "Chrome",
            process: "chrome.exe",
            allowed: false,
            sites: ["youtube.com"],
          }),
        ],
      });

      expect(matchWindowAgainstProfile(window, profile)).toBe("ambiguous");
    });

    it("returns on_task when no site matches but browser has allowed rule", () => {
      const window = makeWindow({
        process_name: "chrome.exe",
        title: "Google Docs - My Document",
      });
      const profile = makeProfile({
        mode: "blacklist",
        apps: [
          makeRule({
            name: "Chrome",
            process: "chrome.exe",
            allowed: true,
            sites: ["youtube.com"], // blocked sites only come from !allowed rules
          }),
        ],
      });

      // The rule is allowed, so sites are "allowed sites" not "blocked sites".
      // In blacklist mode, getAllBlockedSites skips allowed rules.
      // Falls through to rule check: rule.allowed => on_task.
      expect(matchWindowAgainstProfile(window, profile)).toBe("on_task");
    });
  });

  // -----------------------------------------------------------------------
  // 3. Browser + whitelist mode + allowed site matches -> on_task
  // -----------------------------------------------------------------------
  describe("browser in whitelist mode with allowed site matching", () => {
    it("returns on_task when an allowed site matches the window title", () => {
      const window = makeWindow({
        process_name: "chrome.exe",
        title: "GitHub - My Repo",
      });
      const profile = makeProfile({
        mode: "whitelist",
        apps: [
          makeRule({
            name: "Chrome",
            process: "chrome.exe",
            allowed: true,
            sites: ["github.com"],
          }),
        ],
      });

      expect(matchWindowAgainstProfile(window, profile)).toBe("on_task");
    });
  });

  // -----------------------------------------------------------------------
  // 4. Browser + whitelist mode + no allowed sites match -> off_task
  // -----------------------------------------------------------------------
  describe("browser in whitelist mode with no allowed sites matching", () => {
    it("returns off_task when allowed sites exist but none match", () => {
      const window = makeWindow({
        process_name: "chrome.exe",
        title: "Reddit - Front page of the internet",
      });
      const profile = makeProfile({
        mode: "whitelist",
        apps: [
          makeRule({
            name: "Chrome",
            process: "chrome.exe",
            allowed: true,
            sites: ["github.com", "stackoverflow.com"],
          }),
        ],
      });

      expect(matchWindowAgainstProfile(window, profile)).toBe("off_task");
    });
  });

  // -----------------------------------------------------------------------
  // 5. Browser + whitelist mode + no allowed sites defined + has rule -> use rule
  // -----------------------------------------------------------------------
  describe("browser in whitelist mode with rule but no sites", () => {
    it("returns on_task when rule is allowed and no sites are defined", () => {
      const window = makeWindow({
        process_name: "brave.exe",
        title: "Some random page",
      });
      const profile = makeProfile({
        mode: "whitelist",
        apps: [
          makeRule({
            name: "Brave",
            process: "brave.exe",
            allowed: true,
            // no sites
          }),
        ],
      });

      // getAllAllowedSites returns [] -> falls through to rule check
      expect(matchWindowAgainstProfile(window, profile)).toBe("on_task");
    });

    it("returns off_task when rule is blocked and no sites are defined", () => {
      const window = makeWindow({
        process_name: "brave.exe",
        title: "Some random page",
      });
      const profile = makeProfile({
        mode: "whitelist",
        apps: [
          makeRule({
            name: "Brave",
            process: "brave.exe",
            allowed: false,
            // no sites
          }),
        ],
      });

      expect(matchWindowAgainstProfile(window, profile)).toBe("off_task");
    });
  });

  // -----------------------------------------------------------------------
  // 6. Browser + no site rules + has explicit rule -> use rule
  // -----------------------------------------------------------------------
  describe("browser with explicit rule and no site rules anywhere", () => {
    it("returns on_task when the browser rule is allowed", () => {
      const window = makeWindow({
        process_name: "vivaldi.exe",
        title: "Documentation - MDN",
      });
      const profile = makeProfile({
        mode: "blacklist",
        apps: [
          makeRule({
            name: "Vivaldi",
            process: "vivaldi.exe",
            allowed: true,
          }),
        ],
      });

      expect(matchWindowAgainstProfile(window, profile)).toBe("on_task");
    });

    it("returns off_task when the browser rule is blocked", () => {
      const window = makeWindow({
        process_name: "vivaldi.exe",
        title: "Netflix - Watching Something",
      });
      const profile = makeProfile({
        mode: "blacklist",
        apps: [
          makeRule({
            name: "Vivaldi",
            process: "vivaldi.exe",
            allowed: false,
          }),
        ],
      });

      expect(matchWindowAgainstProfile(window, profile)).toBe("off_task");
    });
  });

  // -----------------------------------------------------------------------
  // 7. Browser + no site rules + no rule -> ambiguous
  // -----------------------------------------------------------------------
  describe("browser with no matching rule and no site rules", () => {
    it("returns ambiguous in blacklist mode", () => {
      const window = makeWindow({
        process_name: "chrome.exe",
        title: "New Tab",
      });
      const profile = makeProfile({
        mode: "blacklist",
        apps: [], // no rules at all
      });

      expect(matchWindowAgainstProfile(window, profile)).toBe("ambiguous");
    });

    it("returns ambiguous in whitelist mode when no allowed sites exist", () => {
      const window = makeWindow({
        process_name: "chrome.exe",
        title: "New Tab",
      });
      const profile = makeProfile({
        mode: "whitelist",
        apps: [], // no rules, no sites
      });

      // getAllAllowedSites returns [] -> falls through -> no rule -> ambiguous
      expect(matchWindowAgainstProfile(window, profile)).toBe("ambiguous");
    });
  });

  // -----------------------------------------------------------------------
  // 8. Non-browser + has explicit allowed rule -> on_task
  // -----------------------------------------------------------------------
  describe("non-browser with explicit allowed rule", () => {
    it("returns on_task for an allowed application", () => {
      const window = makeWindow({
        process_name: "code.exe",
        title: "matchingEngine.ts - Visual Studio Code",
      });
      const profile = makeProfile({
        mode: "blacklist",
        apps: [
          makeRule({
            name: "VS Code",
            process: "code.exe",
            allowed: true,
          }),
        ],
      });

      expect(matchWindowAgainstProfile(window, profile)).toBe("on_task");
    });

    it("returns on_task even in whitelist mode when rule says allowed", () => {
      const window = makeWindow({
        process_name: "code.exe",
        title: "index.ts - Visual Studio Code",
      });
      const profile = makeProfile({
        mode: "whitelist",
        apps: [
          makeRule({
            name: "VS Code",
            process: "code.exe",
            allowed: true,
          }),
        ],
      });

      expect(matchWindowAgainstProfile(window, profile)).toBe("on_task");
    });
  });

  // -----------------------------------------------------------------------
  // 9. Non-browser + has explicit blocked rule -> off_task
  // -----------------------------------------------------------------------
  describe("non-browser with explicit blocked rule", () => {
    it("returns off_task for a blocked application", () => {
      const window = makeWindow({
        process_name: "discord.exe",
        title: "Discord - #general",
      });
      const profile = makeProfile({
        mode: "blacklist",
        apps: [
          makeRule({
            name: "Discord",
            process: "discord.exe",
            allowed: false,
          }),
        ],
      });

      expect(matchWindowAgainstProfile(window, profile)).toBe("off_task");
    });

    it("returns off_task even in whitelist mode when rule says blocked", () => {
      const window = makeWindow({
        process_name: "slack.exe",
        title: "Slack - Team Chat",
      });
      const profile = makeProfile({
        mode: "whitelist",
        apps: [
          makeRule({
            name: "Slack",
            process: "slack.exe",
            allowed: false,
          }),
        ],
      });

      expect(matchWindowAgainstProfile(window, profile)).toBe("off_task");
    });
  });

  // -----------------------------------------------------------------------
  // 10. Non-browser + no rule + whitelist mode -> off_task
  // -----------------------------------------------------------------------
  describe("non-browser with no rule in whitelist mode", () => {
    it("returns off_task for an unknown app in whitelist mode", () => {
      const window = makeWindow({
        process_name: "spotify.exe",
        title: "Spotify - Now Playing",
      });
      const profile = makeProfile({
        mode: "whitelist",
        apps: [
          makeRule({
            name: "VS Code",
            process: "code.exe",
            allowed: true,
          }),
        ],
      });

      expect(matchWindowAgainstProfile(window, profile)).toBe("off_task");
    });

    it("returns off_task with empty app rules in whitelist mode", () => {
      const window = makeWindow({
        process_name: "notepad.exe",
        title: "Untitled - Notepad",
      });
      const profile = makeProfile({
        mode: "whitelist",
        apps: [],
      });

      expect(matchWindowAgainstProfile(window, profile)).toBe("off_task");
    });
  });

  // -----------------------------------------------------------------------
  // 11. Non-browser + no rule + blacklist mode -> on_task
  // -----------------------------------------------------------------------
  describe("non-browser with no rule in blacklist mode", () => {
    it("returns on_task for an unknown app in blacklist mode", () => {
      const window = makeWindow({
        process_name: "notepad.exe",
        title: "notes.txt - Notepad",
      });
      const profile = makeProfile({
        mode: "blacklist",
        apps: [
          makeRule({
            name: "Discord",
            process: "discord.exe",
            allowed: false,
          }),
        ],
      });

      expect(matchWindowAgainstProfile(window, profile)).toBe("on_task");
    });

    it("returns on_task with empty app rules in blacklist mode", () => {
      const window = makeWindow({
        process_name: "explorer.exe",
        title: "File Explorer",
      });
      const profile = makeProfile({
        mode: "blacklist",
        apps: [],
      });

      expect(matchWindowAgainstProfile(window, profile)).toBe("on_task");
    });
  });

  // -----------------------------------------------------------------------
  // 12. Site pattern matching
  // -----------------------------------------------------------------------
  describe("site pattern matching", () => {
    it("matches exact domain in title", () => {
      const window = makeWindow({
        process_name: "chrome.exe",
        title: "youtube.com - Watch Videos",
      });
      const profile = makeProfile({
        mode: "blacklist",
        apps: [
          makeRule({
            process: "chrome.exe",
            allowed: false,
            sites: ["youtube.com"],
          }),
        ],
      });

      expect(matchWindowAgainstProfile(window, profile)).toBe("off_task");
    });

    it("matches base domain name stripped of TLD (youtube.com -> youtube)", () => {
      const window = makeWindow({
        process_name: "chrome.exe",
        title: "Funny Cat Compilation - YouTube",
      });
      const profile = makeProfile({
        mode: "blacklist",
        apps: [
          makeRule({
            process: "chrome.exe",
            allowed: false,
            sites: ["youtube.com"],
          }),
        ],
      });

      // "youtube.com" -> domainBase "youtube" -> title includes "youtube" (case-insensitive)
      expect(matchWindowAgainstProfile(window, profile)).toBe("off_task");
    });

    it("matches case-insensitively", () => {
      const window = makeWindow({
        process_name: "chrome.exe",
        title: "REDDIT - The Front Page Of The Internet",
      });
      const profile = makeProfile({
        mode: "blacklist",
        apps: [
          makeRule({
            process: "chrome.exe",
            allowed: false,
            sites: ["Reddit.com"],
          }),
        ],
      });

      expect(matchWindowAgainstProfile(window, profile)).toBe("off_task");
    });

    it("strips http:// prefix from pattern before matching", () => {
      const window = makeWindow({
        process_name: "chrome.exe",
        title: "GitHub - My Repository",
      });
      const profile = makeProfile({
        mode: "whitelist",
        apps: [
          makeRule({
            process: "chrome.exe",
            allowed: true,
            sites: ["http://github.com"],
          }),
        ],
      });

      expect(matchWindowAgainstProfile(window, profile)).toBe("on_task");
    });

    it("strips https:// prefix from pattern before matching", () => {
      const window = makeWindow({
        process_name: "chrome.exe",
        title: "Issues - github.com/my-repo",
      });
      const profile = makeProfile({
        mode: "whitelist",
        apps: [
          makeRule({
            process: "chrome.exe",
            allowed: true,
            sites: ["https://github.com"],
          }),
        ],
      });

      expect(matchWindowAgainstProfile(window, profile)).toBe("on_task");
    });

    it("strips www. prefix from pattern before matching", () => {
      const window = makeWindow({
        process_name: "chrome.exe",
        title: "GitHub - Code Review",
      });
      const profile = makeProfile({
        mode: "whitelist",
        apps: [
          makeRule({
            process: "chrome.exe",
            allowed: true,
            sites: ["www.github.com"],
          }),
        ],
      });

      expect(matchWindowAgainstProfile(window, profile)).toBe("on_task");
    });

    it("strips trailing slash from pattern before matching", () => {
      const window = makeWindow({
        process_name: "chrome.exe",
        title: "GitHub - Pull Requests",
      });
      const profile = makeProfile({
        mode: "whitelist",
        apps: [
          makeRule({
            process: "chrome.exe",
            allowed: true,
            sites: ["github.com/"],
          }),
        ],
      });

      expect(matchWindowAgainstProfile(window, profile)).toBe("on_task");
    });

    it("does not match unrelated domain bases", () => {
      const window = makeWindow({
        process_name: "chrome.exe",
        title: "Google Docs - Spreadsheet",
      });
      const profile = makeProfile({
        mode: "blacklist",
        apps: [
          makeRule({
            process: "chrome.exe",
            allowed: false,
            sites: ["youtube.com"],
          }),
        ],
      });

      // "youtube" does not appear in "Google Docs - Spreadsheet"
      // Falls through to ambiguous (no matching rule for chrome.exe since
      // the rule is not allowed, and site didn't match)
      // Actually: the rule IS for chrome.exe and allowed=false, so after
      // site check falls through, rule check returns off_task.
      expect(matchWindowAgainstProfile(window, profile)).toBe("off_task");
    });

    it("does not match unrelated sites when no rule matches the process", () => {
      const window = makeWindow({
        process_name: "firefox.exe",
        title: "Google Docs - Spreadsheet",
      });
      const profile = makeProfile({
        mode: "blacklist",
        apps: [
          makeRule({
            process: "chrome.exe",
            allowed: false,
            sites: ["youtube.com"],
          }),
        ],
      });

      // Sites are collected across all rules, but "youtube" not in title.
      // No rule for firefox.exe -> ambiguous
      expect(matchWindowAgainstProfile(window, profile)).toBe("ambiguous");
    });
  });

  // -----------------------------------------------------------------------
  // 13. isBrowser identification
  // -----------------------------------------------------------------------
  describe("browser process identification", () => {
    const knownBrowsers = [
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

    it.each(knownBrowsers)(
      "recognizes %s as a browser (returns ambiguous with no rules in blacklist)",
      (browser) => {
        const window = makeWindow({
          process_name: browser,
          title: "Some page",
        });
        const profile = makeProfile({ mode: "blacklist", apps: [] });

        // Browsers with no rules and no sites -> ambiguous
        expect(matchWindowAgainstProfile(window, profile)).toBe("ambiguous");
      }
    );

    it("recognizes browsers case-insensitively", () => {
      const window = makeWindow({
        process_name: "Chrome.EXE",
        title: "Some page",
      });
      const profile = makeProfile({ mode: "blacklist", apps: [] });

      expect(matchWindowAgainstProfile(window, profile)).toBe("ambiguous");
    });

    const nonBrowsers = [
      "code.exe",
      "discord.exe",
      "slack.exe",
      "spotify.exe",
      "explorer.exe",
      "notepad.exe",
    ];

    it.each(nonBrowsers)(
      "does not treat %s as a browser (returns on_task with no rules in blacklist)",
      (process) => {
        const window = makeWindow({
          process_name: process,
          title: "Some window",
        });
        const profile = makeProfile({ mode: "blacklist", apps: [] });

        // Non-browsers with no rules in blacklist -> on_task
        expect(matchWindowAgainstProfile(window, profile)).toBe("on_task");
      }
    );
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------
  describe("edge cases", () => {
    it("process name matching is case-insensitive", () => {
      const window = makeWindow({
        process_name: "Code.EXE",
        title: "Some file - VS Code",
      });
      const profile = makeProfile({
        mode: "blacklist",
        apps: [
          makeRule({
            name: "VS Code",
            process: "code.exe",
            allowed: true,
          }),
        ],
      });

      expect(matchWindowAgainstProfile(window, profile)).toBe("on_task");
    });

    it("collects blocked sites from multiple rules", () => {
      const window = makeWindow({
        process_name: "chrome.exe",
        title: "Watching Twitch stream",
      });
      const profile = makeProfile({
        mode: "blacklist",
        apps: [
          makeRule({
            name: "Chrome",
            process: "chrome.exe",
            allowed: false,
            sites: ["youtube.com"],
          }),
          makeRule({
            name: "Edge",
            process: "msedge.exe",
            allowed: false,
            sites: ["twitch.tv"],
          }),
        ],
      });

      // "twitch" (domainBase of twitch.tv) appears in title
      expect(matchWindowAgainstProfile(window, profile)).toBe("off_task");
    });

    it("collects allowed sites from multiple rules in whitelist mode", () => {
      const window = makeWindow({
        process_name: "firefox.exe",
        title: "My Repository - GitHub",
      });
      const profile = makeProfile({
        mode: "whitelist",
        apps: [
          makeRule({
            name: "Chrome",
            process: "chrome.exe",
            allowed: true,
            sites: ["docs.google.com"],
          }),
          makeRule({
            name: "Edge",
            process: "msedge.exe",
            allowed: true,
            sites: ["github.com"],
          }),
        ],
      });

      // github.com collected from Edge rule, "github" matches in Firefox window title
      expect(matchWindowAgainstProfile(window, profile)).toBe("on_task");
    });

    it("deduplicates site entries", () => {
      // Same site in multiple rules should not cause double-matching issues
      const window = makeWindow({
        process_name: "chrome.exe",
        title: "GitHub - Repository",
      });
      const profile = makeProfile({
        mode: "whitelist",
        apps: [
          makeRule({
            process: "chrome.exe",
            allowed: true,
            sites: ["github.com"],
          }),
          makeRule({
            process: "msedge.exe",
            allowed: true,
            sites: ["github.com"],
          }),
        ],
      });

      expect(matchWindowAgainstProfile(window, profile)).toBe("on_task");
    });

    it("handles empty title gracefully", () => {
      const window = makeWindow({
        process_name: "chrome.exe",
        title: "",
      });
      const profile = makeProfile({
        mode: "blacklist",
        apps: [
          makeRule({
            process: "chrome.exe",
            allowed: false,
            sites: ["youtube.com"],
          }),
        ],
      });

      // Empty title won't match any site pattern
      // Falls through to rule check: rule not allowed -> off_task
      expect(matchWindowAgainstProfile(window, profile)).toBe("off_task");
    });

    it("handles empty process name gracefully", () => {
      const window = makeWindow({
        process_name: "",
        title: "Some window",
      });
      const profile = makeProfile({
        mode: "blacklist",
        apps: [],
      });

      // Empty string is not a browser, no rule match -> blacklist default -> on_task
      expect(matchWindowAgainstProfile(window, profile)).toBe("on_task");
    });

    it("whitelist mode with only blocked rules and sites returns ambiguous for browser", () => {
      const window = makeWindow({
        process_name: "opera.exe",
        title: "Some Page",
      });
      const profile = makeProfile({
        mode: "whitelist",
        apps: [
          makeRule({
            process: "chrome.exe",
            allowed: false,
            sites: ["youtube.com"],
          }),
        ],
      });

      // getAllAllowedSites returns [] (only blocked rules exist) -> falls through
      // No rule for opera.exe -> ambiguous
      expect(matchWindowAgainstProfile(window, profile)).toBe("ambiguous");
    });
  });
});
