import { Minus, Square, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function Titlebar() {
  const win = getCurrentWindow();

  return (
    <div
      data-tauri-drag-region
      className="flex items-center justify-between h-8 select-none z-50 shrink-0"
    >
      {/* Drag region */}
      <div data-tauri-drag-region className="flex-1 h-full" />

      {/* Window controls */}
      <div className="flex items-center h-full">
        <button
          onClick={() => win.minimize()}
          className="h-full px-3 flex items-center justify-center text-text-muted hover:bg-white/[0.08] hover:text-text-secondary transition-colors"
        >
          <Minus size={14} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => win.toggleMaximize()}
          className="h-full px-3 flex items-center justify-center text-text-muted hover:bg-white/[0.08] hover:text-text-secondary transition-colors"
        >
          <Square size={11} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => win.close()}
          className="h-full px-3 flex items-center justify-center text-text-muted hover:bg-[#e81123]/80 hover:text-white transition-colors"
        >
          <X size={14} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
