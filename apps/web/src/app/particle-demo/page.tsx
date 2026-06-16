"use client";

import { ParticleBackground } from "@/components/ui/particle-background";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function ParticleDemo() {
  return (
    <ParticleBackground>
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <div className="bg-white/70 backdrop-blur-xl p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50 flex flex-col items-center max-w-md w-full animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-[#34A853]/10 text-[#34A853] rounded-full flex items-center justify-center mb-6 shadow-sm">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Authentication Successful
          </h1>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">
            You have successfully authenticated. Move your cursor around to interact with the anti-gravity particle field.
          </p>
          <Link 
            href="/"
            className="bg-[#4285F4] hover:bg-[#3367d6] text-white font-medium py-3 px-6 rounded-xl transition-all w-full shadow-md"
          >
            Continue to App
          </Link>
        </div>
      </div>
    </ParticleBackground>
  );
}
