import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import "./glitch.css";

interface GlitchEffectProps {
  children: ReactNode;
  intensity?: 1 | 2 | 3;
  className?: string;
}

export function GlitchEffect({
  children,
  intensity = 1,
  className,
}: GlitchEffectProps) {
  return (
    <div className={cn("glitch-container relative", className)}>
      {/* Base layer */}
      <div className="relative z-10">{children}</div>

      {/* Red channel offset */}
      <div
        className={cn(
          "glitch-layer glitch-red absolute inset-0 z-20 pointer-events-none mix-blend-screen opacity-0",
          intensity >= 1 && "glitch-active",
          intensity === 1 && "glitch-intensity-1",
          intensity === 2 && "glitch-intensity-2",
          intensity === 3 && "glitch-intensity-3"
        )}
        aria-hidden
      >
        {children}
      </div>

      {/* Green channel offset */}
      <div
        className={cn(
          "glitch-layer glitch-green absolute inset-0 z-20 pointer-events-none mix-blend-screen opacity-0",
          intensity >= 1 && "glitch-active",
          intensity === 1 && "glitch-intensity-1",
          intensity === 2 && "glitch-intensity-2",
          intensity === 3 && "glitch-intensity-3"
        )}
        aria-hidden
      >
        {children}
      </div>

      {/* Blue channel offset */}
      <div
        className={cn(
          "glitch-layer glitch-blue absolute inset-0 z-20 pointer-events-none mix-blend-screen opacity-0",
          intensity >= 1 && "glitch-active",
          intensity === 1 && "glitch-intensity-1",
          intensity === 2 && "glitch-intensity-2",
          intensity === 3 && "glitch-intensity-3"
        )}
        aria-hidden
      >
        {children}
      </div>

      {/* Scanline overlay */}
      <div
        className={cn(
          "absolute inset-0 z-30 pointer-events-none glitch-scanlines",
          intensity === 1 && "opacity-10",
          intensity === 2 && "opacity-20",
          intensity === 3 && "opacity-40"
        )}
        aria-hidden
      />
    </div>
  );
}
