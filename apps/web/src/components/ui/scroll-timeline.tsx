"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TimelineItem {
  id: string;
  stepNumber: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface ScrollTimelineProps {
  items: TimelineItem[];
}

export function ScrollTimeline({ items }: ScrollTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end 80%"],
  });

  const height = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div ref={containerRef} className="relative w-full max-w-5xl mx-auto py-10 md:py-20 px-4">
      {/* Central Background Line */}
      <div className="absolute top-0 bottom-0 left-[2.25rem] md:left-1/2 w-1 bg-border/40 -translate-x-1/2 rounded-full" />

      {/* Animated Gradient Progress Line */}
      <motion.div
        style={{ height }}
        className="absolute top-0 left-[2.25rem] md:left-1/2 w-1 bg-foreground -translate-x-1/2 origin-top rounded-full z-10 shadow-[0_0_15px_rgba(255,255,255,0.15)] dark:shadow-[0_0_15px_rgba(0,0,0,0.15)]"
      />

      <div className="relative z-20 space-y-12 md:space-y-24">
        {items.map((item, index) => {
          const isEven = index % 2 === 0;

          return (
            <TimelineStep
              key={item.id}
              item={item}
              isEven={isEven}
            />
          );
        })}
      </div>
    </div>
  );
}

function TimelineStep({ item, isEven }: { item: TimelineItem; isEven: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  
  // Track scroll specifically for this step to light up the node
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 70%", "start 40%"],
  });

  // When scroll passes this node, scale the inner dot
  const nodeScale = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const nodeGlow = useTransform(scrollYProgress, [0, 1], [0, 0.3]);
  const borderColor = useTransform(scrollYProgress, [0, 1], ["#3f3f46", "#ffffff"]);

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex items-center md:justify-between w-full flex-col md:flex-row gap-8 md:gap-0",
        isEven ? "md:flex-row-reverse" : ""
      )}
    >
      {/* Mobile spacer / Desktop empty half */}
      <div className="hidden md:block md:w-1/2" />

      {/* Center Node */}
      <motion.div 
        style={{ borderColor }}
        className="absolute left-[2.25rem] md:left-1/2 top-8 md:top-1/2 -translate-x-1/2 md:-translate-y-1/2 w-5 h-5 rounded-full border-[3px] bg-background z-30 flex items-center justify-center shadow-md transition-colors duration-200"
      >
        {/* Animated Inner Dot */}
        <motion.div
          style={{ scale: nodeScale, opacity: nodeScale }}
          className="w-full h-full rounded-full bg-foreground"
        />
        {/* Subtle glow ring */}
        <motion.div
          style={{ opacity: nodeGlow }}
          className="absolute inset-0 rounded-full bg-foreground blur-[8px] -z-10"
        />
      </motion.div>

      {/* Content Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, filter: "blur(4px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={cn(
          "w-full pl-20 md:pl-0 md:w-[calc(50%-3.5rem)]",
          isEven ? "md:mr-auto md:pr-4 text-left md:text-right" : "md:ml-auto md:pl-4 text-left"
        )}
      >
        <div className={cn(
          "bg-card/40 backdrop-blur-xl border border-border/60 p-6 sm:p-8 rounded-3xl shadow-xl hover:shadow-2xl hover:border-primary/30 transition-all duration-500 flex flex-col gap-4 group relative overflow-hidden",
          isEven ? "md:items-end" : "md:items-start"
        )}>
          {/* Subtle hover gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          {/* Icon Header */}
          <div className={cn(
            "flex items-center gap-4 w-full relative z-10",
            isEven ? "md:flex-row-reverse" : "flex-row"
          )}>
            <div className="flex shrink-0 items-center justify-center w-12 h-12 rounded-2xl bg-zinc-950 border border-white/10 text-white group-hover:scale-110 transition-transform duration-500 shadow-inner">
              {item.icon}
            </div>
            <div className={cn("text-xs font-mono font-bold tracking-widest text-primary/80 uppercase", isEven ? "md:text-right" : "text-left")}>
              Step {item.stepNumber}
            </div>
          </div>

          <h3 className="font-display text-2xl md:text-3xl font-extrabold text-foreground relative z-10">
            {item.title}
          </h3>
          <p className="text-muted-foreground leading-relaxed text-sm sm:text-base max-w-sm relative z-10">
            {item.description}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
