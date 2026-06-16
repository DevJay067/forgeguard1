import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface RadialGlowBackgroundProps {
  children?: ReactNode;
  className?: string;
}

export const Component = ({ children, className }: RadialGlowBackgroundProps) => {
  return (
    <div className={cn("min-h-screen w-full bg-background relative text-foreground overflow-hidden", className)}>
      {/* Premium Theme-Aware Radial Glow Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen flex justify-center">
        <div className="w-[800px] h-[400px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2" />
      </div>
      <div className="relative z-10 w-full min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
};
