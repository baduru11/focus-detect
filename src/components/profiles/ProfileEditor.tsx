import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, ChevronDown, ChevronUp, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonInput } from "@/components/ui/NeonInput";
import { NeonSlider } from "@/components/ui/NeonSlider";
import { NeonToggle } from "@/components/ui/NeonToggle";
import type { Profile, AppRule } from "@/types/profile";

const ICON_OPTIONS = [
  "\uD83C\uDFAF",
  "\uD83D\uDCDA",
  "\uD83D\uDCBB",
  "\uD83C\uDFAE",
  "\uD83C\uDFCB\uFE0F",
  "\uD83D\uDCDD",
  "\uD83C\uDFA8",
  "\uD83D\uDD2C",
  "\uD83D\uDCBC",
  "\uD83C\uDFB5",
];

interface ProfileEditorProps {
  profile: Profile | null;
  onSave: (profile: Omit<Profile, "id"> | Profile) => void;
  onCancel: () => void;
}

interface NewAppForm {
  name: string;
  process: string;
}

export function ProfileEditor({
  profile,
  onSave,
  onCancel,
}: ProfileEditorProps) {
  const isNew = !profile;

  const [name, setName] = useState(profile?.name ?? "New Profile");
  const [icon, setIcon] = useState(profile?.icon ?? "\uD83C\uDFAF");
  const [mode, setMode] = useState<"whitelist" | "blacklist">(
    profile?.mode ?? "blacklist"
  );
  const [apps, setApps] = useState<AppRule[]>(profile?.apps ?? []);
  const [pomodoroWork, setPomodoroWork] = useState(profile?.pomodoro.work ?? 25);
  const [pomodoroShortBreak, setPomodoroShortBreak] = useState(
    profile?.pomodoro.shortBreak ?? 5
  );
  const [pomodoroLongBreak, setPomodoroLongBreak] = useState(
    profile?.pomodoro.longBreak ?? 15
  );
  const [pomodoroCycles, setPomodoroCycles] = useState(
    profile?.pomodoro.cyclesBeforeLong ?? 4
  );
  const [checkInterval, setCheckInterval] = useState(
    profile?.detection.checkInterval ?? 30
  );
  const [graceCountdown, setGraceCountdown] = useState(
    profile?.detection.graceCountdown ?? 10
  );
  const [alarmLockDuration, setAlarmLockDuration] = useState(
    profile?.detection.alarmLockDuration ?? 15
  );

  const [showNewAppForm, setShowNewAppForm] = useState(false);
  const [newApp, setNewApp] = useState<NewAppForm>({ name: "", process: "" });
  const [expandedApps, setExpandedApps] = useState<Set<number>>(new Set());

  const toggleAppExpanded = (index: number) => {
    setExpandedApps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleAddApp = useCallback(() => {
    if (!newApp.name.trim() || !newApp.process.trim()) return;
    setApps((prev) => [
      ...prev,
      { name: newApp.name.trim(), process: newApp.process.trim(), allowed: true },
    ]);
    setNewApp({ name: "", process: "" });
    setShowNewAppForm(false);
  }, [newApp]);

  const handleRemoveApp = useCallback((index: number) => {
    setApps((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleToggleApp = useCallback((index: number) => {
    setApps((prev) =>
      prev.map((app, i) =>
        i === index ? { ...app, allowed: !app.allowed } : app
      )
    );
  }, []);

  const handleAddSite = useCallback((appIndex: number, url: string) => {
    if (!url.trim()) return;
    setApps((prev) =>
      prev.map((app, i) =>
        i === appIndex
          ? { ...app, sites: [...(app.sites ?? []), url.trim()] }
          : app
      )
    );
  }, []);

  const handleRemoveSite = useCallback(
    (appIndex: number, siteIndex: number) => {
      setApps((prev) =>
        prev.map((app, i) =>
          i === appIndex
            ? {
                ...app,
                sites: (app.sites ?? []).filter((_, si) => si !== siteIndex),
              }
            : app
        )
      );
    },
    []
  );

  const handleSave = () => {
    const profileData = {
      name,
      icon,
      mode,
      apps,
      pomodoro: {
        work: pomodoroWork,
        shortBreak: pomodoroShortBreak,
        longBreak: pomodoroLongBreak,
        cyclesBeforeLong: pomodoroCycles,
      },
      detection: {
        checkInterval,
        graceCountdown,
        alarmLockDuration,
      },
      monitors: profile?.monitors ?? {
        detection: "all" as const,
        alarm: "all" as const,
      },
    };

    if (isNew) {
      onSave(profileData);
    } else {
      onSave({ ...profileData, id: profile.id });
    }
  };

  // Pomodoro timeline preview
  const timelineSegments: { type: "work" | "shortBreak" | "longBreak"; duration: number }[] = [];
  for (let c = 0; c < pomodoroCycles; c++) {
    timelineSegments.push({ type: "work", duration: pomodoroWork });
    if (c < pomodoroCycles - 1) {
      timelineSegments.push({ type: "shortBreak", duration: pomodoroShortBreak });
    }
  }
  timelineSegments.push({ type: "longBreak", duration: pomodoroLongBreak });

  const totalTime = timelineSegments.reduce((s, seg) => s + seg.duration, 0);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-base/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      />

      {/* Panel */}
      <motion.div
        className="relative w-full max-w-2xl h-full bg-surface-solid/95 backdrop-blur-xl border-l border-white/[0.08] overflow-y-auto"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 pb-4 bg-surface-solid/90 backdrop-blur-md border-b border-white/[0.06]">
          <h2 className="text-xl font-semibold text-text-primary">
            {isNew ? "Create Profile" : "Edit Profile"}
          </h2>
          <motion.button
            className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-text-secondary hover:text-danger hover:border-danger/30 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onCancel}
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* Basic Info Section */}
          <GlassCard>
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
              Basic Info
            </h3>
            <div className="flex flex-col gap-4">
              <NeonInput
                label="Profile Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter profile name..."
              />

              {/* Icon Picker */}
              <div className="flex flex-col gap-2">
                <span className="text-sm text-text-secondary font-light">Icon</span>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((emoji) => (
                    <motion.button
                      key={emoji}
                      type="button"
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-lg border transition-colors",
                        icon === emoji
                          ? "border-accent/50 bg-accent/10"
                          : "border-white/[0.06] bg-white/[0.03] hover:border-accent/25"
                      )}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIcon(emoji)}
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="flex flex-col gap-2">
                <span className="text-sm text-text-secondary font-light">Mode</span>
                <div className="flex gap-2">
                  <NeonButton
                    variant={mode === "whitelist" ? "success" : "ghost"}
                    size="sm"
                    onClick={() => setMode("whitelist")}
                  >
                    Whitelist
                  </NeonButton>
                  <NeonButton
                    variant={mode === "blacklist" ? "danger" : "ghost"}
                    size="sm"
                    onClick={() => setMode("blacklist")}
                  >
                    Blacklist
                  </NeonButton>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Apps Section */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                Apps
              </h3>
              <NeonButton
                variant="ghost"
                size="sm"
                onClick={() => setShowNewAppForm(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5 inline" />
                Add App
              </NeonButton>
            </div>

            <div className="flex flex-col gap-2">
              <AnimatePresence mode="popLayout">
                {apps.map((app, index) => (
                  <motion.div
                    key={`${app.process}-${index}`}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <div className="glass-panel rounded-xl p-3 border border-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-text-primary font-medium truncate">
                            {app.name}
                          </div>
                          <div className="text-xs text-text-muted font-mono truncate">
                            {app.process}
                          </div>
                        </div>

                        {/* Toggle allowed/blocked */}
                        <NeonToggle
                          checked={app.allowed}
                          onChange={() => handleToggleApp(index)}
                        />

                        {/* Expand for sites */}
                        {app.sites !== undefined && (
                          <motion.button
                            className="w-6 h-6 rounded flex items-center justify-center text-text-muted hover:text-accent-light transition-colors"
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleAppExpanded(index)}
                          >
                            {expandedApps.has(index) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </motion.button>
                        )}

                        {/* Remove */}
                        <motion.button
                          className="w-6 h-6 rounded flex items-center justify-center text-text-muted hover:text-danger transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRemoveApp(index)}
                        >
                          <X className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>

                      {/* Expanded Sites */}
                      <AnimatePresence>
                        {expandedApps.has(index) && app.sites !== undefined && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-white/[0.06]"
                          >
                            <SiteRules
                              sites={app.sites}
                              onAdd={(url) => handleAddSite(index, url)}
                              onRemove={(siteIndex) =>
                                handleRemoveSite(index, siteIndex)
                              }
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* New App Form */}
              <AnimatePresence>
                {showNewAppForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="glass-panel rounded-xl p-3 border border-accent/20"
                  >
                    <div className="flex flex-col gap-2">
                      <NeonInput
                        placeholder="App name (e.g. Chrome)"
                        value={newApp.name}
                        onChange={(e) =>
                          setNewApp((p) => ({ ...p, name: e.target.value }))
                        }
                      />
                      <NeonInput
                        placeholder="Process name (e.g. chrome.exe)"
                        value={newApp.process}
                        onChange={(e) =>
                          setNewApp((p) => ({ ...p, process: e.target.value }))
                        }
                      />
                      <div className="flex gap-2 justify-end">
                        <NeonButton
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowNewAppForm(false);
                            setNewApp({ name: "", process: "" });
                          }}
                        >
                          Cancel
                        </NeonButton>
                        <NeonButton size="sm" onClick={handleAddApp}>
                          Add
                        </NeonButton>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {apps.length === 0 && !showNewAppForm && (
                <div className="text-center py-6 text-text-muted text-sm">
                  No apps configured. Click "Add App" to get started.
                </div>
              )}
            </div>
          </GlassCard>

          {/* Pomodoro Settings */}
          <GlassCard>
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
              Pomodoro Settings
            </h3>
            <div className="flex flex-col gap-5">
              <NeonSlider
                label="Work Duration"
                min={1}
                max={60}
                value={pomodoroWork}
                onChange={setPomodoroWork}
                unit=" min"
              />
              <NeonSlider
                label="Short Break"
                min={1}
                max={30}
                value={pomodoroShortBreak}
                onChange={setPomodoroShortBreak}
                unit=" min"
              />
              <NeonSlider
                label="Long Break"
                min={1}
                max={60}
                value={pomodoroLongBreak}
                onChange={setPomodoroLongBreak}
                unit=" min"
              />
              <NeonSlider
                label="Cycles Before Long Break"
                min={1}
                max={10}
                value={pomodoroCycles}
                onChange={setPomodoroCycles}
              />

              {/* Timeline Preview */}
              <div className="flex flex-col gap-2">
                <span className="text-xs text-text-muted font-light">Cycle Preview</span>
                <div className="flex h-6 rounded-lg overflow-hidden border border-white/[0.06]">
                  {timelineSegments.map((seg, i) => {
                    const widthPercent = (seg.duration / totalTime) * 100;
                    const colors = {
                      work: "bg-accent/40 border-r border-accent/20",
                      shortBreak:
                        "bg-success/30 border-r border-success/20",
                      longBreak:
                        "bg-[#a855f7]/30 border-r border-[#a855f7]/20",
                    };
                    return (
                      <motion.div
                        key={i}
                        className={cn(
                          "h-full flex items-center justify-center text-[9px] font-mono text-text-primary/70",
                          colors[seg.type]
                        )}
                        style={{ width: `${widthPercent}%` }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        title={`${seg.type}: ${seg.duration}m`}
                      >
                        {widthPercent > 8 ? `${seg.duration}m` : ""}
                      </motion.div>
                    );
                  })}
                </div>
                <div className="flex gap-4 text-[10px] text-text-muted">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-accent/40" />
                    Work
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-success/30" />
                    Short Break
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-[#a855f7]/30" />
                    Long Break
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Detection Settings */}
          <GlassCard>
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
              Detection Settings
            </h3>
            <div className="flex flex-col gap-5">
              <NeonSlider
                label="Check Interval"
                min={5}
                max={120}
                value={checkInterval}
                onChange={setCheckInterval}
                unit="s"
              />
              <NeonSlider
                label="Grace Countdown"
                min={3}
                max={30}
                value={graceCountdown}
                onChange={setGraceCountdown}
                unit="s"
              />
              <NeonSlider
                label="Alarm Lock Duration"
                min={5}
                max={60}
                value={alarmLockDuration}
                onChange={setAlarmLockDuration}
                unit="s"
              />
            </div>
          </GlassCard>

          {/* Save / Cancel */}
          <div className="flex gap-3 justify-end pb-6">
            <NeonButton variant="ghost" onClick={onCancel}>
              Cancel
            </NeonButton>
            <NeonButton variant="primary" onClick={handleSave}>
              {isNew ? "Create Profile" : "Save Changes"}
            </NeonButton>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ---- Site Rules Sub-Component ---- */

interface SiteRulesProps {
  sites: string[];
  onAdd: (url: string) => void;
  onRemove: (index: number) => void;
}

function SiteRules({ sites, onAdd, onRemove }: SiteRulesProps) {
  const [newUrl, setNewUrl] = useState("");

  const handleAdd = () => {
    if (!newUrl.trim()) return;
    onAdd(newUrl.trim());
    setNewUrl("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-xs text-text-muted">
        <Globe className="w-3 h-3" />
        Site Rules
      </div>

      <AnimatePresence mode="popLayout">
        {sites.map((site, index) => (
          <motion.div
            key={`${site}-${index}`}
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]"
          >
            <span className="flex-1 text-xs text-text-primary font-mono truncate">
              {site}
            </span>
            <motion.button
              className="text-text-muted hover:text-danger transition-colors"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.8 }}
              onClick={() => onRemove(index)}
            >
              <X className="w-3 h-3" />
            </motion.button>
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="flex gap-2">
        <div className="flex-1">
          <NeonInput
            placeholder="https://example.com"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <NeonButton variant="ghost" size="sm" onClick={handleAdd}>
          <Plus className="w-3.5 h-3.5" />
        </NeonButton>
      </div>
    </div>
  );
}
