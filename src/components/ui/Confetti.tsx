import { useEffect } from "react";
import confetti from "canvas-confetti";

interface ConfettiProps {
  trigger: boolean; // when this becomes true, fire confetti
  onComplete?: () => void;
}

export function Confetti({ trigger, onComplete }: ConfettiProps) {
  useEffect(() => {
    if (!trigger) return;
    // Don't fire if page is hidden (widget-only mode)
    if (document.visibilityState === "hidden") {
      onComplete?.();
      return;
    }

    // Fire burst from both sides
    const defaults = {
      spread: 60,
      ticks: 100,
      gravity: 0.8,
      decay: 0.94,
      startVelocity: 30,
      colors: ["#00f0ff", "#bf00ff", "#00ff88", "#e0e0ff", "#818cf8"],
    };

    confetti({ ...defaults, particleCount: 40, origin: { x: 0.3, y: 0.7 }, angle: 60 });
    confetti({ ...defaults, particleCount: 40, origin: { x: 0.7, y: 0.7 }, angle: 120 });

    const timer = setTimeout(() => {
      onComplete?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [trigger, onComplete]);

  return null; // canvas-confetti uses its own canvas
}
