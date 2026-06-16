"use client";

import { Component as GridBackground } from "@/components/ui/grid-background";
import { useState } from "react";
import { LayoutGrid, GripHorizontal } from "lucide-react";

export default function GridDemo() {
  const [variant, setVariant] = useState<"grid" | "dots">("grid");

  return (
    <GridBackground variant={variant}>
      <div className="max-w-6xl mx-auto px-4 py-16 w-full min-h-screen flex flex-col pt-24 items-center justify-center text-center">
        
        <img 
          src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=300&h=300&auto=format&fit=crop" 
          alt="Retro Setup" 
          className="w-32 h-32 rounded-3xl border border-white/10 object-cover shadow-2xl mb-8"
        />

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-4">
          Versatile Grid Backgrounds
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12">
          Toggle between the classic geometric grid layout or the subtle dotted matrix pattern. Fully responsive and adapts seamlessly to light and dark modes.
        </p>

        <div className="flex items-center gap-4 bg-background/50 backdrop-blur-md p-2 rounded-full border border-border shadow-sm">
          <button
            onClick={() => setVariant("grid")}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${variant === "grid" ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted text-muted-foreground"}`}
          >
            <LayoutGrid className="w-5 h-5" />
            Magenta Orb Grid
          </button>

          <button
            onClick={() => setVariant("dots")}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${variant === "dots" ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted text-muted-foreground"}`}
          >
            <GripHorizontal className="w-5 h-5" />
            Dotted Matrix
          </button>
        </div>

      </div>
    </GridBackground>
  );
}
