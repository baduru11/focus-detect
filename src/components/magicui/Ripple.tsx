import React, { type ComponentPropsWithoutRef, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

interface RippleProps extends ComponentPropsWithoutRef<"div"> {
  /**
   * The diameter of the innermost circle in pixels.
   * @default 210
   */
  mainCircleSize?: number;
  /**
   * The opacity of the innermost circle (0-1).
   * @default 0.24
   */
  mainCircleOpacity?: number;
  /**
   * Total number of concentric ripple circles.
   * @default 8
   */
  numCircles?: number;
}

export const Ripple = React.memo(function Ripple({
  mainCircleSize = 210,
  mainCircleOpacity = 0.24,
  numCircles = 8,
  className,
  ...props
}: RippleProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 select-none",
        className
      )}
      style={{
        maskImage: "linear-gradient(to bottom, white, transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, white, transparent)",
      }}
      {...props}
    >
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 70;
        const opacity = mainCircleOpacity - i * 0.03;
        const animationDelay = `${i * 0.06}s`;

        return (
          <div
            key={i}
            className="animate-ripple absolute rounded-full border border-solid shadow-xl"
            style={
              {
                "--opacity": opacity,
                width: `${size}px`,
                height: `${size}px`,
                opacity,
                animationDelay,
                borderColor: "rgba(0, 240, 255, 0.3)",
                backgroundColor: "rgba(0, 240, 255, 0.06)",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%) scale(1)",
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
});

Ripple.displayName = "Ripple";
