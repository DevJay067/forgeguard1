"use client";

import { cn } from "@/lib/utils";
import { ReactNode, useEffect, useState, useRef } from "react";

interface GridBackgroundProps {
  children?: ReactNode;
  className?: string;
  variant?: "grid" | "dots";
}

const DotMatrixCanvas = ({ mouseRef }: { mouseRef: React.MutableRefObject<{ x: number, y: number }> }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let particles: Dot[] = [];
    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    class Dot {
      x: number;
      y: number;
      baseX: number;
      baseY: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.baseX = x;
        this.baseY = y;
      }

      update(mx: number, my: number) {
        const dx = mx - this.x;
        const dy = my - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Repulsion physics
        const repelRadius = 120;
        if (dist < repelRadius) {
          const force = (repelRadius - dist) / repelRadius;
          this.x -= (dx / dist) * force * 6; // Push strength
          this.y -= (dy / dist) * force * 6;
        }

        // Spring back to base position
        this.x += (this.baseX - this.x) * 0.15; // Spring strength
        this.y += (this.baseY - this.y) * 0.15;
      }

      draw(ctx: CanvasRenderingContext2D) {
        // Draw the dot (color matches the original CSS #80808090)
        ctx.fillStyle = "rgba(128, 128, 128, 0.55)"; 
        ctx.beginPath();
        ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const init = () => {
      particles = [];
      const spacing = 30;
      // Overshoot dimensions slightly to cover edges smoothly
      for (let x = -spacing; x < width + spacing; x += spacing) {
        for (let y = -spacing; y < height + spacing; y += spacing) {
          particles.push(new Dot(x, y));
        }
      }
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      init();
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial setup

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (let i = 0; i < particles.length; i++) {
        particles[i].update(mx, my);
        particles[i].draw(ctx);
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-100 dark:opacity-80 block" />;
};

export const Component = ({ children, className, variant = "grid" }: GridBackgroundProps) => {
  const [mousePosition, setMousePosition] = useState({ x: -1000, y: -1000 });
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      // Keep state for CSS gradient updates
      requestAnimationFrame(() => {
        setMousePosition({ x: e.clientX, y: e.clientY });
      });
      // Keep ref updated instantly for the Canvas loop
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className={cn("min-h-screen w-full relative overflow-hidden bg-background text-foreground", className)}>
      
      {/* 0. Premium Noise Overlay */}
      <div 
        className="fixed inset-0 z-50 pointer-events-none opacity-[0.03] mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      {/* 1. Base Background (Grid CSS or Dots Canvas) */}
      {variant === "grid" ? (
        <div
          className="fixed inset-0 z-0 pointer-events-none opacity-80 dark:opacity-50"
          style={{
            backgroundImage: `
              linear-gradient(to right, #80808050 1px, transparent 1px),
              linear-gradient(to bottom, #80808050 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
      ) : (
        isMounted && <DotMatrixCanvas mouseRef={mouseRef} />
      )}

      {/* 2. Moving Balloon / Orb Glow */}
      {isMounted && (
        <div
          className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-300 mix-blend-normal dark:mix-blend-screen"
          style={{
            background: variant === "grid" 
              ? `radial-gradient(circle 600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(236,72,153,0.3) 0%, rgba(168,85,247,0.15) 40%, transparent 70%)`
              : `radial-gradient(circle 600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(160, 180, 255, 0.35) 0%, rgba(120, 120, 200, 0.1) 40%, transparent 80%)`,
          }}
        />
      )}

      {/* 3. Content Area */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default Component;
