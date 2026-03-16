import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
}

const NEON_COLORS = ["#00f0ff", "#bf00ff", "#ff003c", "#00ff88"];
const GRAVITY = 0.15;
const DRAG = 0.98;

interface ParticleBurstProps {
  trigger: number;
  particleCount?: number;
  onComplete?: () => void;
}

export function ParticleBurst({
  trigger,
  particleCount = 75,
  onComplete,
}: ParticleBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const spawnParticles = useCallback(
    (canvas: HTMLCanvasElement) => {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const particles: Particle[] = [];

      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 8;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 2 + Math.random() * 3,
          color: NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)],
          alpha: 1,
          decay: 0.008 + Math.random() * 0.012,
        });
      }

      particlesRef.current = particles;
    },
    [particleCount]
  );

  useEffect(() => {
    if (trigger <= 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    spawnParticles(canvas);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const alive = particlesRef.current;
      let anyAlive = false;

      for (let i = alive.length - 1; i >= 0; i--) {
        const p = alive[i];
        p.vx *= DRAG;
        p.vy *= DRAG;
        p.vy += GRAVITY;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          alive.splice(i, 1);
          continue;
        }

        anyAlive = true;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.closePath();
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      if (anyAlive) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        onCompleteRef.current?.();
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [trigger, spawnParticles]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[10000] pointer-events-none"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}
