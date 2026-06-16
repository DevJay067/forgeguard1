"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ParticleBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

const GOOGLE_COLORS = [
  "#4285F4", // Blue
  "#EA4335", // Red
  "#FBBC05", // Yellow
  "#34A853", // Green
];

class Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  radius: number;
  color: string;
  angle: number;
  distanceFromCenter: number;
  length: number;

  constructor(x: number, y: number, cx: number, cy: number, color: string) {
    this.baseX = x;
    this.baseY = y;
    this.x = x;
    this.y = y;
    this.color = color;
    
    // Elongated dashes pointing to center
    this.radius = Math.random() * 1.5 + 0.5;
    this.length = this.radius * (Math.random() * 4 + 2); // Dash length
    
    const dx = x - cx;
    const dy = y - cy;
    this.distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
    this.angle = Math.atan2(dy, dx);
  }

  draw(ctx: CanvasRenderingContext2D, currentGlobalAngle: number, cx: number, cy: number) {
    // Calculate the current rotating home position
    const totalAngle = this.angle + currentGlobalAngle;
    const currentBaseX = cx + Math.cos(totalAngle) * this.distanceFromCenter;
    const currentBaseY = cy + Math.sin(totalAngle) * this.distanceFromCenter;

    // Update base to the rotated position for spring physics to pull toward
    this.baseX = currentBaseX;
    this.baseY = currentBaseY;

    // Draw the particle
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // The dash should point to the center of the screen
    // Since we are moving it, it should point towards its own base angle or the center
    const pointAngle = Math.atan2(cy - this.y, cx - this.x);
    ctx.rotate(pointAngle);
    
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.roundRect(-this.length / 2, -this.radius / 2, this.length, this.radius, this.radius);
    ctx.fill();
    ctx.restore();
  }

  update(mouse: { x: number; y: number }, repelRadius: number) {
    // Mouse repulsion physics
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const forceDirectionX = dx / distance;
    const forceDirectionY = dy / distance;

    // Max distance is the repel radius
    const maxDistance = repelRadius;
    let force = (maxDistance - distance) / maxDistance;
    
    // If we are outside repel radius, force is 0
    if (force < 0) force = 0;

    const directionX = forceDirectionX * force * -5; // Push away (negative)
    const directionY = forceDirectionY * force * -5;

    // Apply repulsion force
    if (distance < repelRadius) {
      this.x += directionX;
      this.y += directionY;
    }

    // Spring / Easing logic to return to base
    // Friction and easing back to home
    this.x += (this.baseX - this.x) * 0.1;
    this.y += (this.baseY - this.y) * 0.1;
  }
}

export const ParticleBackground = ({ className, children }: ParticleBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let width = window.innerWidth;
    let height = window.innerHeight;
    let cx = width / 2;
    let cy = height / 2;
    let globalAngle = 0;

    const mouse = {
      x: -1000,
      y: -1000,
    };

    const repelRadius = 150;

    const initParticles = () => {
      particles = [];
      const numParticles = 2500;
      
      // We will generate them in a golden ratio spiral for a very organic dense look
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const spacing = 12; // Controls density

      for (let i = 0; i < numParticles; i++) {
        // Calculate spiral coordinates
        const distance = Math.sqrt(i) * spacing;
        const theta = i * goldenAngle;
        
        const x = cx + Math.cos(theta) * distance;
        const y = cy + Math.sin(theta) * distance;
        
        const color = GOOGLE_COLORS[Math.floor(Math.random() * GOOGLE_COLORS.length)];
        
        particles.push(new Particle(x, y, cx, cy, color));
      }
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      cx = width / 2;
      cy = height / 2;
      initParticles();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    // Initial setup
    handleResize();

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Extremely slow rotation
      globalAngle += 0.001;

      for (let i = 0; i < particles.length; i++) {
        particles[i].update(mouse, repelRadius);
        particles[i].draw(ctx, globalAngle, cx, cy);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className={cn("relative w-full min-h-screen bg-white overflow-hidden", className)}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-0 block"
      />
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default ParticleBackground;
