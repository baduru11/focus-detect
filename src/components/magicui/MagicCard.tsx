import React, { useCallback, useEffect, useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
} from "framer-motion";

import { cn } from "@/lib/utils";

interface MagicCardProps {
  /**
   * The content to render inside the card.
   */
  children?: React.ReactNode;
  /**
   * Additional class names for the card container.
   */
  className?: string;
  /**
   * The radius of the spotlight gradient in pixels.
   * @default 200
   */
  gradientSize?: number;
  /**
   * The starting color of the animated border gradient.
   * @default "#00f0ff"
   */
  gradientFrom?: string;
  /**
   * The ending color of the animated border gradient.
   * @default "#bf00ff"
   */
  gradientTo?: string;
  /**
   * The color of the spotlight overlay gradient.
   * @default "#0f0f23"
   */
  gradientColor?: string;
  /**
   * The opacity of the spotlight overlay.
   * @default 0.8
   */
  gradientOpacity?: number;
}

export function MagicCard({
  children,
  className,
  gradientSize = 200,
  gradientFrom = "#00f0ff",
  gradientTo = "#bf00ff",
  gradientColor = "#0f0f23",
  gradientOpacity = 0.8,
}: MagicCardProps) {
  const mouseX = useMotionValue(-gradientSize);
  const mouseY = useMotionValue(-gradientSize);

  const gradientSizeRef = useRef(gradientSize);

  useEffect(() => {
    gradientSizeRef.current = gradientSize;
  }, [gradientSize]);

  const reset = useCallback(() => {
    const off = -gradientSizeRef.current;
    mouseX.set(off);
    mouseY.set(off);
  }, [mouseX, mouseY]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    },
    [mouseX, mouseY]
  );

  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    const handleGlobalPointerOut = (e: PointerEvent) => {
      if (!e.relatedTarget) reset();
    };
    const handleBlur = () => reset();
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") reset();
    };

    window.addEventListener("pointerout", handleGlobalPointerOut);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("pointerout", handleGlobalPointerOut);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [reset]);

  // Animated border: radial gradient follows mouse
  const borderBackground = useMotionTemplate`
    linear-gradient(#0f0f23 0 0) padding-box,
    radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px,
      ${gradientFrom},
      ${gradientTo},
      rgba(0, 240, 255, 0.15) 100%
    ) border-box
  `;

  // Spotlight overlay: soft glow at mouse position
  const spotlightBackground = useMotionTemplate`
    radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px,
      ${gradientColor},
      transparent 100%
    )
  `;

  return (
    <motion.div
      className={cn(
        "group relative isolate overflow-hidden rounded-2xl border border-transparent",
        className
      )}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      style={{
        background: borderBackground,
      }}
    >
      {/* Solid background layer */}
      <div className="absolute inset-px z-20 rounded-[inherit] bg-[#0f0f23]" />

      {/* Mouse-following spotlight */}
      <motion.div
        className="pointer-events-none absolute inset-px z-30 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: spotlightBackground,
          opacity: gradientOpacity,
        }}
      />

      {/* Content */}
      <div className="relative z-40">{children}</div>
    </motion.div>
  );
}
