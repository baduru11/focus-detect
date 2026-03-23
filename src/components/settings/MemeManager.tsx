import { useState, useEffect } from "react";
import { Image, FolderOpen } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { getBundledMemes, getCustomMemes, refreshMemeList } from "@/services/memeService";

export function MemeManager() {
  const [bundled, setBundled] = useState<string[]>([]);
  const [custom, setCustom] = useState<string[]>([]);

  useEffect(() => {
    setBundled(getBundledMemes());
    refreshMemeList().then(() => {
      setCustom(getCustomMemes());
    });
  }, []);

  const openCustomFolder = async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      // Ensure folder exists then open it
      await invoke("list_custom_memes");
      const { open } = await import("@tauri-apps/plugin-shell");
      const { appDataDir } = await import("@tauri-apps/api/path");
      const dir = await appDataDir();
      await open(dir + "memes/custom");
    } catch (e) {
      console.warn("Failed to open custom meme folder:", e);
    }
  };

  return (
    <GlassCard>
      <div className="flex items-center gap-3 mb-4">
        <Image className="w-5 h-5 text-neon-purple" />
        <h3 className="text-sm font-semibold text-text-primary">Meme Library</h3>
      </div>

      <p className="text-xs text-text-secondary mb-4">
        Memes appear in Level 2 and Level 3 alarms. Add your own to the custom folder.
      </p>

      {/* Bundled memes preview */}
      <div className="mb-4">
        <span className="text-xs text-text-secondary mb-2 block">
          Bundled ({bundled.length})
        </span>
        <div className="flex gap-2 flex-wrap">
          {bundled.slice(0, 8).map((url) => (
            <div
              key={url}
              className="w-16 h-16 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center"
            >
              <img
                src={url}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).parentElement!.innerHTML =
                    '<span style="font-size:10px;color:#666">N/A</span>';
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Custom memes */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary">
          Custom ({custom.length})
        </span>
        <button
          onClick={openCustomFolder}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-text-secondary hover:bg-white/10 transition-colors"
        >
          <FolderOpen size={12} />
          Open Folder
        </button>
      </div>
    </GlassCard>
  );
}
