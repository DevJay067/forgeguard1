import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, TerminalIcon } from "lucide-react";
import React from "react";
import Link from "next/link";
import { MockEditor } from "@/components/ui/mock-editor";

export function HeroSection({ children }: { children?: React.ReactNode }) {
	return (
		<section className="overflow-hidden pt-24 pb-10 relative">
			{/* Premium Cinematic Glow Behind Text */}
			<div className="absolute top-[10%] left-1/2 -translate-x-[70%] w-[600px] h-[400px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
			<div className="absolute top-[10%] left-1/2 -translate-x-[30%] w-[600px] h-[400px] bg-orange-500/15 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
			
			<div className="relative z-10 flex max-w-4xl flex-col gap-6 px-4 mx-auto text-center items-center">

				<a
					className={cn(
						"group flex w-fit items-center gap-3 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 backdrop-blur-md shadow-sm transition-all hover:bg-primary/10 hover:border-primary/30",
						"fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-500 duration-500 ease-out"
					)}
					href="#link"
				>
					<div className="rounded-full bg-primary/20 px-2 py-0.5 text-primary">
						<p className="font-semibold text-xs tracking-wide">v2.0</p>
					</div>

					<span className="text-sm font-medium text-foreground/80 tracking-tight">Now with multi-agent orchestration</span>
					<span className="block h-4 border-l border-primary/20 mx-1" />

					<div className="pr-1 text-primary">
						<ArrowRightIcon className="size-3.5 -translate-x-0.5 duration-300 ease-out group-hover:translate-x-1" />
					</div>
				</a>

				<h1
					className={cn(
						"text-balance font-extrabold text-5xl md:text-7xl lg:text-[5.5rem] tracking-tighter leading-[1.05] drop-shadow-md",
						"fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-100 duration-500 ease-out"
					)}
				>
					<span className="text-foreground">Autonomous Firebase</span>{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-rose-500 to-indigo-500">Security Engineering</span>
				</h1>

				<p
					className={cn(
						"text-muted-foreground/80 text-base md:text-xl max-w-2xl mx-auto text-balance font-medium tracking-tight",
						"fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-200 duration-500 ease-out"
					)}
				>
					Generate production-grade Firebase architecture and security rules with zero blind spots using our AI swarm.
				</p>

				<div className="fade-in slide-in-from-bottom-10 flex w-fit animate-in items-center justify-center gap-4 fill-mode-backwards pt-4 delay-300 duration-500 ease-out">
					<Link href="/docs" passHref>
						<Button variant="outline" className="rounded-full px-6 py-6 border-white/10 bg-background/50 backdrop-blur-md hover:bg-white/5 transition-all text-sm font-semibold">
							<TerminalIcon className="size-4 mr-2 text-primary" data-icon="inline-start" />{" "}
							View Docs
						</Button>
					</Link>
					<Link href="/orchestration" passHref>
						<Button className="rounded-full px-8 py-6 bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all font-semibold shadow-lg text-sm group">
							Start Orchestrator{" "}
							<ArrowRightIcon className="size-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" data-icon="inline-end" />
						</Button>
					</Link>
				</div>
			</div>
			
			<div className="relative w-full mt-12 md:mt-20">
				{/* Removed blur background block */}
				<div
					className={cn(
						"relative mx-auto w-full px-2 lg:px-0",
						"fade-in slide-in-from-bottom-5 animate-in fill-mode-backwards delay-100 duration-1000 ease-out"
					)}
				>
                    <MockEditor />
				</div>
			</div>
		</section>
	);
}
