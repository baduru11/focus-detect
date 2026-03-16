import { motion, type Transition } from "framer-motion";

import { cn } from "@/lib/utils";

interface BorderBeamProps {
  /**
   * The size of the border beam.
   */
  size?: number;
  /**
   * The duration of the border beam animation in seconds.
   */
  duration?: number;
  /**
   * The delay before the animation starts in seconds.
   */
  delay?: number;
  /**
   * The starting color of the beam gradient.
   */
  colorFrom?: string;
  /**
   * The ending color of the beam gradient.
   */
  colorTo?: string;
  /**
   * Custom framer-motion transition overrides.
   */
  transition?: Transition;
  /**
   * Additional class names for the beam element.
   */
  className?: string;
  /**
   * Additional inline styles for the beam element.
   */
  style?: React.CSSProperties;
  /**
   * Whether to reverse the animation direction.
   */
  reverse?: boolean;
  /**
   * The initial offset position (0-100).
   */
  initialOffset?: number;
  /**
   * The border width of the container mask in pixels.
   */
  borderWidth?: number;
}

export function BorderBeam({
  className,
  size = 50,
  delay = 0,
  duration = 6,
  colorFrom = "#00f0ff",
  colorTo = "#bf00ff",
  transition,
  style,
  reverse = false,
  initialOffset = 0,
  borderWidth = 1.5,
}: BorderBeamProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-[inherit]"
      style={
        {
          "--border-beam-width": `${borderWidth}px`,
          border: "var(--border-beam-width) solid transparent",
          maskImage:
            "linear-gradient(transparent, transparent), linear-gradient(#000, #000)",
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
          maskClip: "padding-box, border-box",
          WebkitMaskClip: "padding-box, border-box",
        } as React.CSSProperties
      }
    >
      <motion.div
        className={cn(
          "absolute aspect-square",
          className
        )}
        style={
          {
            width: size,
            offsetPath: `rect(0 auto auto 0 round ${size}px)`,
            background: `linear-gradient(to left, ${colorFrom}, ${colorTo}, transparent)`,
            ...style,
          } as React.CSSProperties
        }
        initial={{ offsetDistance: `${initialOffset}%` }}
        animate={{
          offsetDistance: reverse
            ? [`${100 - initialOffset}%`, `${-initialOffset}%`]
            : [`${initialOffset}%`, `${100 + initialOffset}%`],
        }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration,
          delay: -delay,
          ...transition,
        }}
      />
    </div>
  );
}
