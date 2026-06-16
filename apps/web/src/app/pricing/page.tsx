import { PricingInteraction } from "@/components/ui/pricing-interaction";
import { Component as GridBackground } from "@/components/ui/grid-background";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  return (
    <GridBackground variant="dots" className="flex w-full flex-col font-sans min-h-screen">
      <main className="grow flex flex-col items-center pt-12 pb-24 px-4 relative z-10 w-full max-w-6xl mx-auto">
        
        {/* Navigation */}
        <div className="w-full flex justify-between items-center mb-12">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center w-full mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan for your project. No hidden fees. Switch or cancel anytime.
          </p>
        </div>

        {/* Pricing Component & Features Grid */}
        <div className="w-full bg-card/95 backdrop-blur-xl border-2 border-border/80 rounded-[3rem] p-8 md:p-12 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="flex justify-center lg:justify-end">
            <PricingInteraction
              starterMonth={19}
              starterAnnual={15}
              proMonth={49}
              proAnnual={39}
            />
          </div>

          <div className="space-y-8 flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-foreground">Why upgrade?</h2>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-chart-1/10 flex items-center justify-center shrink-0 border border-chart-1/20">
                  <CheckCircle2 className="w-5 h-5 text-chart-1" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Unlimited AI Generation</h3>
                  <p className="text-sm text-muted-foreground mt-1">Free users are capped at 5 rule generations per day. Upgrade to remove all limits on the Orchestrator.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-chart-2/10 flex items-center justify-center shrink-0 border border-chart-2/20">
                  <CheckCircle2 className="w-5 h-5 text-chart-2" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Continuous Security Audits</h3>
                  <p className="text-sm text-muted-foreground mt-1">Get automated, daily security scans of your live Firebase environments to detect new vulnerabilities.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Priority Support</h3>
                  <p className="text-sm text-muted-foreground mt-1">Direct access to our security engineering team for custom rule analysis and architecture consulting.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

      </main>
    </GridBackground>
  );
}
