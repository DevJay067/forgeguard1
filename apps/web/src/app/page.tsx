"use client";

import { Header } from "@/components/ui/header-3";
import { HeroSection } from "@/components/ui/hero-3";
import { Component as GridBackground } from "@/components/ui/grid-background";

export default function ForgeGuardDashboard() {
  return (
    <GridBackground variant="dots" className="flex w-full flex-col font-sans selection:bg-primary/30 min-h-screen">
      <Header />
      <main className="grow pb-24">
        <HeroSection />
      </main>
    </GridBackground>
  );
}
