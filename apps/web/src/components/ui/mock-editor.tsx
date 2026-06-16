"use client";

import React, { useState, useEffect } from "react";
import { Terminal, Shield, CheckCircle2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const codeLines = [
  "// ForgeGuard Autonomous Security Agent",
  "// Analyzing architecture: SaaS with multi-tenant teams",
  "rules_version = '2';",
  "service cloud.firestore {",
  "  match /databases/{database}/documents {",
  "    ",
  "    // Validates team membership",
  "    function isTeamMember(teamId) {",
  "      return request.auth != null && ",
  "        exists(/databases/$(database)/documents/teams/$(teamId)/members/$(request.auth.uid));",
  "    }",
  "",
  "    match /teams/{teamId} {",
  "      allow read: if isTeamMember(teamId);",
  "      allow write: if false; // Only via secure cloud functions",
  "    }",
  "  }",
  "}",
];

export function MockEditor() {
  const [displayedCode, setDisplayedCode] = useState("");
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (lineIndex < codeLines.length) {
      const currentLine = codeLines[lineIndex];
      
      if (charIndex < currentLine.length) {
        const timeout = setTimeout(() => {
          setDisplayedCode((prev) => prev + currentLine[charIndex]);
          setCharIndex((prev) => prev + 1);
        }, Math.random() * 30 + 10); // Random typing speed
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => {
          setDisplayedCode((prev) => prev + "\n");
          setLineIndex((prev) => prev + 1);
          setCharIndex(0);
        }, 150); // Pause at end of line
        return () => clearTimeout(timeout);
      }
    } else {
      // Loop it after a few seconds
      const timeout = setTimeout(() => {
        setDisplayedCode("");
        setLineIndex(0);
        setCharIndex(0);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [lineIndex, charIndex]);

  return (
    <div className="relative w-full max-w-5xl mx-auto mt-16 mb-24 group perspective-[2500px]">
      
      {/* Intense Glowing Auras */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#f97316] via-[#f43f5e] to-[#6366f1] opacity-20 blur-3xl transition duration-1000 group-hover:opacity-50" />

      {/* Holographic Container Wrapper for Gradient Border */}
      <div className="relative rounded-3xl overflow-visible transform-gpu transition-all duration-700 hover:rotate-0 rotate-x-[8deg] rotate-y-[-4deg] scale-[0.97] hover:scale-100 z-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)]">
        
        {/* Inner Window */}
        <div className="relative bg-zinc-950/80 backdrop-blur-3xl rounded-[23px] overflow-hidden flex flex-col h-full border border-white/10">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-transparent border-b border-white/10 relative z-20">
          <div className="flex items-center gap-4">
            <div className="flex gap-2 mr-2">
              <div className="w-3 h-3 rounded-full bg-white/20 shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
              <div className="w-3 h-3 rounded-full bg-white/20 shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
              <div className="w-3 h-3 rounded-full bg-white/20 shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/20 rounded-md border border-white/5 shadow-inner">
              <Lock className="w-3 h-3 text-white/50" />
              <span className="text-xs font-mono text-white/70">firestore.rules</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#f97316]/20 to-[#f43f5e]/20 text-[#fb923c] rounded text-[10px] font-bold uppercase tracking-widest border border-[#f97316]/20 shadow-[0_0_15px_rgba(234,88,12,0.2)]">
              <CheckCircle2 className="w-3 h-3" /> Zero Blind Spots
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex h-[400px] relative z-20">
          {/* Sidebar */}
          <div className="hidden md:flex flex-col gap-5 p-5 border-r border-white/10 bg-black/40 w-56 shrink-0">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Agents Active</p>
              <div className="flex items-center gap-3 text-xs text-white/80 bg-white/5 p-3 rounded-xl border border-white/5 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                <Shield className="w-4 h-4 text-[#f97316] drop-shadow-[0_0_8px_rgba(234,88,12,0.8)]" /> Architect
              </div>
              <div className="flex items-center gap-3 text-xs text-white/80 bg-white/5 p-3 rounded-xl border border-white/5 backdrop-blur-md mt-2 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                <Terminal className="w-4 h-4 text-[#818cf8] drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" /> Auditor
              </div>
            </div>
          </div>

          {/* Code Area */}
          <div className="flex-1 p-6 overflow-auto custom-scrollbar relative">
            <pre className="font-mono text-sm md:text-base leading-relaxed text-white/90 w-full relative z-10 drop-shadow-md">
              {displayedCode}
              <span className="inline-block w-2 h-4 bg-[#f97316] ml-1 animate-pulse shadow-[0_0_8px_rgba(234,88,12,0.8)]" />
            </pre>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
