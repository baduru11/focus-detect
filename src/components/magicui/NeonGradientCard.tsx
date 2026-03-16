import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

interface NeonColorsProps {
  firstColor: string;
  secondColor: string;
}

interface NeonGradientCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The content to render inside the card.
   */
  children?: ReactNode;
  /**
   * Additional class names for the outer container.
   */
  className?: string;
  /**
   * The size of the neon border in pixels.
   * @default 2
   */
  borderSize?: number;
  /**
   * The border radius in pixels.
   * @default 20
   */
  borderRadius?: number;
  /**
   * The two neon gradient colors.
   * @default { firstColor: "#00f0ff", secondColor: "#bf00ff" }
   */
  neonColors?: NeonColorsProps;
}

export function NeonGradientCard({
  className,
  children,
  borderSize = 2,
  borderRadius = 20,
  neonColors = {
    firstColor: "#00f0ff",
    secondColor: "#bf00ff",
  },
  ...props
}: NeonGradientCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        setDimensions({ width: offsetWidth, height: offsetHeight });
      }
    };

    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const { offsetWidth, offsetHeight } = containerRef.current;
      setDimensions({ width: offsetWidth, height: offsetHeight });
    }
  }, [children]);

  return (
    <div
      ref={containerRef}
      style={
        {
          "--border-size": `${borderSize}px`,
          "--border-radius": `${borderRadius}px`,
          "--neon-first-color": neonColors.firstColor,
          "--neon-second-color": neonColors.secondColor,
          "--card-width": `${dimensions.width}px`,
          "--card-height": `${dimensions.height}px`,
          "--card-content-radius": `${borderRadius - borderSize}px`,
          "--pseudo-element-background-image": `linear-gradient(0deg, ${neonColors.firstColor}, ${neonColors.secondColor})`,
          "--pseudo-element-width": `${dimensions.width + borderSize * 2}px`,
          "--pseudo-element-height": `${dimensions.height + borderSize * 2}px`,
          "--after-blur": `${dimensions.width / 3}px`,
          borderRadius: `${borderRadius}px`,
        } as CSSProperties
      }
      className={cn(
        "relative z-10 size-full",
        className
      )}
      {...props}
    >
      <div
        className="relative size-full min-h-[inherit] bg-[#0f0f23] p-6"
        style={{
          borderRadius: `${borderRadius - borderSize}px`,
        }}
      >
        {/* Rotating gradient border */}
        <div
          className="absolute -z-10 block animate-background-position-spin"
          style={{
            top: `-${borderSize}px`,
            left: `-${borderSize}px`,
            width: `${dimensions.width + borderSize * 2}px`,
            height: `${dimensions.height + borderSize * 2}px`,
            borderRadius: `${borderRadius}px`,
            backgroundImage: `linear-gradient(0deg, ${neonColors.firstColor}, ${neonColors.secondColor})`,
            backgroundSize: "100% 200%",
          }}
        />
        {/* Glow effect (blurred copy) */}
        <div
          className="absolute -z-10 block opacity-80 animate-background-position-spin"
          style={{
            top: `-${borderSize}px`,
            left: `-${borderSize}px`,
            width: `${dimensions.width + borderSize * 2}px`,
            height: `${dimensions.height + borderSize * 2}px`,
            borderRadius: `${borderRadius}px`,
            backgroundImage: `linear-gradient(0deg, ${neonColors.firstColor}, ${neonColors.secondColor})`,
            backgroundSize: "100% 200%",
            filter: `blur(${dimensions.width / 3}px)`,
          }}
        />
        {children}
      </div>
    </div>
  );
}
