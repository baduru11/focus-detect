import { type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export interface AnimatedGradientTextProps
  extends ComponentPropsWithoutRef<"span"> {
  /**
   * Animation speed multiplier. Higher = larger background sweep.
   * @default 1
   */
  speed?: number;
  /**
   * The starting gradient color.
   * @default "#00f0ff"
   */
  colorFrom?: string;
  /**
   * The ending gradient color.
   * @default "#bf00ff"
   */
  colorTo?: string;
}

export function AnimatedGradientText({
  children,
  className,
  speed = 1,
  colorFrom = "#00f0ff",
  colorTo = "#bf00ff",
  ...props
}: AnimatedGradientTextProps) {
  return (
    <span
      style={
        {
          "--bg-size": `${speed * 300}%`,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          backgroundImage: `linear-gradient(to right, ${colorFrom}, ${colorTo}, ${colorFrom})`,
          backgroundSize: "var(--bg-size) 100%",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          color: "transparent",
        } as React.CSSProperties
      }
      className={cn("animate-gradient inline", className)}
      {...props}
    >
      {children}
    </span>
  );
}
