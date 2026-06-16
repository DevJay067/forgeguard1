"use client";

import { Component as GridBackground } from "@/components/ui/grid-background";
import { ArrowLeft, BookOpen, Code2, Terminal, Layers, Shield, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function DocsPage() {
  return (
    <GridBackground variant="dots" className="flex w-full flex-col font-sans min-h-screen">
      <main className="grow flex flex-col items-center pt-12 pb-24 px-4 relative z-10 w-full max-w-4xl mx-auto">
        
        {/* Navigation */}
        <div className="w-full flex justify-between items-center mb-12">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-left w-full mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
            <BookOpen className="w-3.5 h-3.5" /> Documentation
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            ForgeGuard Platform
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Autonomous Firebase Security Engineering. Generate, audit, and deploy cloud security protocols with zero blind spots using our AI swarm.
          </p>
        </div>

        {/* Content Body */}
        <div className="w-full space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* Features Section */}
          <section className="bg-card/95 backdrop-blur-xl border-2 border-border/80 p-8 rounded-3xl shadow-2xl">
            <h2 className="text-2xl font-bold flex items-center gap-3 mb-6 text-foreground">
              <Sparkles className="w-6 h-6 text-chart-1" /> Core Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-primary" /> AI Orchestration Engine
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Describe your project's architecture in plain English. ForgeGuard autonomously analyzes the requirements and streams the generation process in real-time.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-chart-2" /> Security Auditing
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every generated rule set is immediately audited. ForgeGuard calculates a Risk Score and verifies that critical flaws (like <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">if true</code>) are absent.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-chart-3" /> Syntax Generation
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Automatically outputs precise, structured <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">firestore.rules</code> blocks ready for immediate deployment.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Layers className="w-4 h-4 text-chart-4" /> Canvas Physics UI
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The platform features an advanced Anti-Gravity particle background using HTML5 Canvas and spring physics for a premium tactile experience.
                </p>
              </div>
            </div>
          </section>

          {/* Usage Guide */}
          <section className="bg-card/95 backdrop-blur-xl border-2 border-border/80 p-8 rounded-3xl shadow-2xl">
            <div className="mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground font-display">How to Use ForgeGuard</h2>
              <p className="text-muted-foreground mt-2 max-w-2xl text-balance">Follow these three simple steps to securely orchestrate your backend architecture.</p>
            </div>
            <AnimatedUsageGuide />
          </section>

          {/* Tech Stack */}
          <section className="bg-card/95 backdrop-blur-xl border-2 border-border/80 p-8 rounded-3xl shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Technology Stack</h2>
            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium text-foreground">Next.js 15 App Router</span>
              <span className="px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium text-foreground">React 19</span>
              <span className="px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium text-foreground">Tailwind CSS v4</span>
              <span className="px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium text-foreground">Turborepo</span>
              <span className="px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium text-foreground">Shadcn UI</span>
              <span className="px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium text-foreground">HTML5 Canvas Physics</span>
            </div>
          </section>

        </div>
      </main>
    </GridBackground>
  );
}

function AnimatedUsageGuide() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end 80%"],
  });
  const height = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div ref={containerRef} className="space-y-8 relative pl-2 md:pl-4">
      {/* Background Track */}
      <div className="absolute top-0 bottom-0 left-[1.65rem] md:left-[2.15rem] w-0.5 bg-border z-0" />
      
      {/* Animated Gradient Track - Monochrome */}
      <motion.div 
        style={{ height }}
        className="absolute top-0 left-[1.65rem] md:left-[2.15rem] w-0.5 bg-foreground origin-top z-0 shadow-[0_0_10px_rgba(255,255,255,0.3)] dark:shadow-[0_0_10px_rgba(0,0,0,0.3)]" 
      />

      {/* Step 1 */}
      <AnimatedStep 
        num="1" 
        title="Start Orchestrator" 
        desc="Navigate to the Orchestration Center. Define your goal by typing your app's architecture and required data models." 
      />
      
      {/* Step 2 */}
      <AnimatedStep 
        num="2" 
        title="Generate & Trace" 
        desc="Click generate and watch the Server-Sent Events (SSE) stream trace the AI's internal reasoning and process steps in real-time." 
      />

      {/* Step 3 */}
      <AnimatedStep 
        num="3" 
        title="Audit & Deploy" 
        desc="Review the generated syntax, verify the automated security audit score, and follow the Deployment Plan to push to Firebase." 
      />
    </div>
  );
}

function AnimatedStep({ num, title, desc }: { num: string; title: string; desc: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 80%", "start 40%"],
  });
  
  const scale = useTransform(scrollYProgress, [0, 1], [0.5, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.2, 1, 1]);

  return (
    <div ref={ref} className="relative flex items-start gap-6 group z-10">
      {/* Node */}
      <div className="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 shrink-0 z-10 mt-1">
        <div className="absolute inset-0 rounded-full border-2 border-border bg-background" />
        <motion.div 
          style={{ scale, opacity }}
          className="absolute inset-0 rounded-full border-2 border-foreground bg-foreground flex items-center justify-center"
        >
          <span className="font-bold font-mono text-background">{num}</span>
        </motion.div>
        {/* Default number (hidden when active dot covers it) */}
        <span className="absolute font-bold font-mono text-muted-foreground">{num}</span>
      </div>
      
      {/* Card */}
      <div className="flex-1 bg-card/20 border border-border/60 p-5 rounded-lg z-10 relative">
        <h3 className="font-bold text-xl text-foreground mb-2 font-display">{title}</h3>
        <p className="text-sm md:text-base text-muted-foreground font-sans leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
