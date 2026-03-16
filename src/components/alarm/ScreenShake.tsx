import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScreenShakeProps {
  children: ReactNode;
  intensity?: 1 | 2 | 3;
  className?: string;
}

const magnitudeMap = {
  1: { x: 2, y: 2, rotate: 0.5 },
  2: { x: 5, y: 5, rotate: 1.5 },
  3: { x: 10, y: 10, rotate: 3 },
} as const;

export function ScreenShake({
  children,
  intensity = 1,
  className,
}: ScreenShakeProps) {
  const mag = magnitudeMap[intensity];

  return (
    <motion.div
      className={cn("w-full h-full", className)}
      animate={{
        x: [0, mag.x, -mag.x, -mag.x / 2, mag.x / 2, 0],
        y: [0, -mag.y / 2, mag.y, -mag.y, mag.y / 2, 0],
        rotate: [0, mag.rotate, -mag.rotate, mag.rotate / 2, -mag.rotate / 2, 0],
      }}
      transition={{
        duration: intensity === 3 ? 0.3 : intensity === 2 ? 0.5 : 0.8,
        repeat: Infinity,
        repeatType: "loop",
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}
