"use client";

import { useState, useRef, useEffect } from "react";
import { Shield, Lock, Terminal, ShieldAlert, CheckCircle2, Loader2, Sparkles, Code2, Play, MessageSquare, ArrowLeft, User as UserIcon, CreditCard, Activity, LogOut, Settings, Folder, Plus, ChevronDown, X, Trash2, Plug, Unplug, Download, Upload, ArrowRight, TrendingDown, AlertTriangle, Rocket, RefreshCw, Eye, FileCode2, Zap, Server } from "lucide-react";
import { SecurityChat } from "@/components/chat/SecurityChat";
import { Component as GridBackground } from "@/components/ui/grid-background";
import GlassSurface from "@/components/ui/GlassSurface";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User, updateProfile } from "firebase/auth";
import { doc, onSnapshot, setDoc, collection, query, where, addDoc, serverTimestamp, updateDoc, increment, deleteDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";

function ExpandableStepContent({ content }: { content: any }) {
  const [expanded, setExpanded] = useState(false);
  const textContent = typeof content === 'object' ? JSON.stringify(content, null, 2) : content;
  const isLong = textContent.length > 200 || textContent.split('\n').length > 4;
  
  return (
    <div className="bg-card rounded-xl p-4 text-sm text-foreground/80 font-mono break-words shadow-[6px_6px_12px_rgba(0,0,0,0.4),-6px_-6px_12px_rgba(255,255,255,0.03)] border border-transparent mb-2 flex flex-col">
      <div className={`whitespace-pre-wrap ${expanded ? 'overflow-y-auto custom-scrollbar max-h-[400px]' : 'line-clamp-4 overflow-hidden'}`}>
        {textContent}
      </div>
      {isLong && (
        <button 
          onClick={() => setExpanded(!expanded)} 
          className="text-[10px] uppercase tracking-wider text-primary mt-3 font-bold hover:underline flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity w-fit"
        >
          {expanded ? "Show Less" : "Show Full"}
        </button>
      )}
    </div>
  );
}

function ensureString(val: any): string {
  if (typeof val === "string") return val;
  if (!val) return "";
  if (typeof val === "object") {
    if (val.rules) {
      return ensureString(val.rules);
    }
    if (val.firestore) {
      return ensureString(val.firestore);
    }
    for (const key of Object.keys(val)) {
      const extracted = ensureString(val[key]);
      if (extracted && typeof extracted === "string" && extracted.includes("rules_version")) {
        return extracted;
      }
    }
    const values = Object.values(val);
    if (values.length > 0) {
      const extracted = ensureString(values[0]);
      if (extracted) return extracted;
    }
    return JSON.stringify(val, null, 2);
  }
  return String(val);
}

interface TypewriterCodeProps {
  code: any;
  speed?: number;
}

function TypewriterCode({ code, speed = 1 }: TypewriterCodeProps) {
  const [displayedCode, setDisplayedCode] = useState("");
  const displayedCodeRef = useRef("");

  useEffect(() => {
    const codeStr = ensureString(code);
    const currentDisplayed = displayedCodeRef.current;
    
    // Find the common prefix of currentDisplayed and new code string
    let i = 0;
    while (i < currentDisplayed.length && i < codeStr.length && currentDisplayed[i] === codeStr[i]) {
      i++;
    }
    const commonPrefix = codeStr.substring(0, i);

    setDisplayedCode(commonPrefix);
    displayedCodeRef.current = commonPrefix;
    
    let currentLength = commonPrefix.length;
    
    // Smoothly type in chunks of 5 characters for standard code block updates
    const intervalId = setInterval(() => {
      if (currentLength < codeStr.length) {
        currentLength += Math.min(5, codeStr.length - currentLength);
        const nextChunk = codeStr.substring(0, currentLength);
        setDisplayedCode(nextChunk);
        displayedCodeRef.current = nextChunk;
      } else {
        clearInterval(intervalId);
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [code, speed]);

  const renderHighlighted = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, lineIdx) => {
      // Tokenize comments, strings, variables, keywords, and operators
      const tokens = line.split(/(\/\/.*|["'].*?["']|\b(?:rules_version|service|cloud\.firestore|databases|documents|match|allow|read|write|get|list|create|update|delete|if|true|false|null|request|resource)\b|[{}();,:=<>!&|+-]|\s+)/g);
      const isLastLine = lineIdx === lines.length - 1;
      
      return (
        <div key={lineIdx} className="min-h-[1.2rem] whitespace-pre">
          {tokens.map((token, tokenIdx) => {
            if (!token) return null;
            if (token.startsWith("//")) {
              return <span key={tokenIdx} className="text-muted-foreground/60 italic">{token}</span>;
            }
            if (token.startsWith('"') || token.startsWith("'")) {
              return <span key={tokenIdx} className="text-emerald-300">{token}</span>;
            }
            if (/^\b(rules_version|service|cloud\.firestore|databases|documents)\b$/.test(token)) {
              return <span key={tokenIdx} className="text-indigo-400 font-bold">{token}</span>;
            }
            if (/^\b(match|allow)\b$/.test(token)) {
              return <span key={tokenIdx} className="text-purple-400 font-bold">{token}</span>;
            }
            if (/^\b(read|write|get|list|create|update|delete)\b$/.test(token)) {
              return <span key={tokenIdx} className="text-sky-400 font-medium">{token}</span>;
            }
            if (/^\b(if|true|false|null)\b$/.test(token)) {
              return <span key={tokenIdx} className="text-amber-400 font-bold">{token}</span>;
            }
            if (/^\b(request|resource)\b$/.test(token)) {
              return <span key={tokenIdx} className="text-pink-400">{token}</span>;
            }
            if (/^[{}();,:=<>!&|+-]$/.test(token)) {
              return <span key={tokenIdx} className="text-slate-400">{token}</span>;
            }
            return <span key={tokenIdx} className="text-slate-100">{token}</span>;
          })}
          {isLastLine && (
            <span className="inline-block w-1.5 h-3.5 bg-primary/80 ml-0.5 align-middle animate-pulse shadow-[0_0_8px_rgba(234,88,12,0.8)]" />
          )}
        </div>
      );
    });
  };

  return (
    <div className="font-mono text-xs leading-relaxed select-text">
      {renderHighlighted(displayedCode)}
    </div>
  );
}

function getRandomNum(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface DinoGameProps {
  onClose?: () => void;
}

function DinoGame({ onClose }: DinoGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover">("idle");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const gameStateRef = useRef(gameState);
  const isDuckingRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Audio synthesis helper for retro game sounds
  const playBeep = (type: "jump" | "milestone" | "crash") => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }
      const audioCtx = audioCtxRef.current;
      if (!audioCtx) return;
      
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      gainNode.gain.setValueAtTime(0.015, audioCtx.currentTime);

      if (type === "jump") {
        osc.type = "square";
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
      } else if (type === "milestone") {
        osc.type = "square";
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
        
        setTimeout(() => {
          try {
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            gain2.gain.setValueAtTime(0.015, audioCtx.currentTime);
            osc2.type = "square";
            osc2.frequency.setValueAtTime(880, audioCtx.currentTime);
            osc2.start();
            osc2.stop(audioCtx.currentTime + 0.08);
          } catch {}
        }, 120);
      } else if (type === "crash") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(120, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(30, audioCtx.currentTime + 0.22);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      }
    } catch (e) {
      console.warn("Web Audio failed:", e);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // OG Chromium Dino Configuration
    const dinoX = 50;
    const groundY = 135;
    const dinoWidth = 44;
    const dinoHeight = 47;
    const crouchWidth = 59;
    const crouchHeight = 25;
    
    // Position when on the ground
    const groundYPos = groundY - dinoHeight;
    const groundYPosCrouch = groundY - crouchHeight;
    
    // Physics constants
    const gravity = 0.6;
    const initialJumpVelocity = -10.0;
    const dropVelocity = -5.0; // velocity cap if jump key released or max height hit
    const speedDropCoefficient = 3.0; // falls faster when holding down arrow
    
    let dinoY = groundYPos;
    let dinoVy = 0;
    let jumping = false;
    let reachedMinHeight = false;
    let speedDrop = false;

    let obstacles: { 
      type: "cactus_s" | "cactus_d" | "cactus_t" | "cactus_l" | "bird"; 
      x: number; 
      y: number;
      width: number; 
      height: number; 
      speed: number;
      gap: number;
      birdFrame?: number;
    }[] = [];
    
    let clouds: { x: number; y: number; speed: number; width: number }[] = [];
    let localScore = 0;
    let frameCount = 0;
    
    // OG Speed parameters
    let gameSpeed = 6.0;
    const maxSpeed = 12.0;
    const acceleration = 0.00015; // acceleration per frame

    let animationId: number;
    let milestoneCount = 0;
    let colorSchemeAlpha = 0; // Day (0) vs Night (1)

    // Initialize clouds
    for (let j = 0; j < 3; j++) {
      clouds.push({
        x: Math.random() * 200 + 100,
        y: Math.random() * 40 + 15,
        speed: Math.random() * 0.3 + 0.1,
        width: Math.random() * 22 + 12
      });
    }

    const handleJump = () => {
      if (gameStateRef.current === "idle") {
        setGameState("playing");
        localScore = 0;
        setScore(0);
        obstacles = [];
        dinoY = groundYPos;
        dinoVy = 0;
        jumping = false;
        gameSpeed = 6.0;
        milestoneCount = 0;
      } else if (gameStateRef.current === "playing" && !isDuckingRef.current && !jumping && dinoY === groundYPos) {
        dinoVy = initialJumpVelocity;
        jumping = true;
        reachedMinHeight = false;
        speedDrop = false;
        playBeep("jump");
      } else if (gameStateRef.current === "gameover") {
        setGameState("playing");
        localScore = 0;
        setScore(0);
        obstacles = [];
        dinoY = groundYPos;
        dinoVy = 0;
        jumping = false;
        gameSpeed = 6.0;
        milestoneCount = 0;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
        return;
      }

      if (e.code === "ArrowDown") {
        e.preventDefault();
        isDuckingRef.current = true;
        if (jumping) {
          speedDrop = true;
          dinoVy = 1;
        }
      } else if (e.code === "Space" || e.code === "ArrowUp") {
        if (gameStateRef.current === "playing") {
          e.preventDefault();
          handleJump();
        } else if (e.code === "Space") {
          e.preventDefault();
          handleJump();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowDown") {
        isDuckingRef.current = false;
        speedDrop = false;
      } else if (e.code === "Space" || e.code === "ArrowUp") {
        // Variable jump height: release key to drop velocity
        if (jumping && dinoVy < dropVelocity) {
          dinoVy = dropVelocity;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("click", handleJump);

    const gameLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frameCount++;

      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }

      // Day & Night transitions every 700 score points
      const cycle = Math.floor(localScore / 700) % 2;
      if (cycle === 1 && colorSchemeAlpha < 1) {
        colorSchemeAlpha = Math.min(1, colorSchemeAlpha + 0.02);
      } else if (cycle === 0 && colorSchemeAlpha > 0) {
        colorSchemeAlpha = Math.max(0, colorSchemeAlpha - 0.02);
      }

      if (colorSchemeAlpha > 0) {
        ctx.fillStyle = `rgba(18, 18, 18, ${colorSchemeAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const mainThemeColor = colorSchemeAlpha > 0.5 
        ? `rgb(${Math.floor(255 - 121 * (1 - colorSchemeAlpha))}, ${Math.floor(255 - 197 * (1 - colorSchemeAlpha))}, ${Math.floor(255 - 243 * (1 - colorSchemeAlpha))})`
        : "#ea580c";
      
      const hazardColor = colorSchemeAlpha > 0.5 ? "#fca5a5" : "#ef4444";

      // Draw horizon ground line
      ctx.strokeStyle = colorSchemeAlpha > 0.5 ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(canvas.width, groundY);
      ctx.stroke();

      // Update & Draw Clouds
      ctx.fillStyle = colorSchemeAlpha > 0.5 ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.08)";
      clouds.forEach(cloud => {
        if (gameStateRef.current === "playing") {
          cloud.x -= cloud.speed;
        }
        if (cloud.x + cloud.width < 0) {
          cloud.x = canvas.width + Math.random() * 80;
          cloud.y = Math.random() * 40 + 15;
        }
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, 6, 0, Math.PI * 2);
        ctx.arc(cloud.x + 6, cloud.y - 3, 8, 0, Math.PI * 2);
        ctx.arc(cloud.x + 12, cloud.y, 6, 0, Math.PI * 2);
        ctx.fill();
      });

      const isCrouching = isDuckingRef.current && dinoY === groundYPos;
      const currentDinoHeight = isCrouching ? crouchHeight : dinoHeight;
      const currentDinoWidth = isCrouching ? crouchWidth : dinoWidth;
      const currentDinoY = isCrouching ? groundYPosCrouch : dinoY;

      // Dino physics
      if (gameStateRef.current === "playing") {
        if (jumping) {
          if (speedDrop) {
            dinoY += dinoVy * speedDropCoefficient;
          } else {
            dinoY += dinoVy;
          }
          dinoVy += gravity;
          
          // Reached min height threshold
          if (dinoY < groundYPos - 30) {
            reachedMinHeight = true;
          }
          // Cap jump peak at 30 pixels absolute height from top
          if (dinoY < 30) {
            if (dinoVy < dropVelocity) {
              dinoVy = dropVelocity;
            }
          }
          
          // Landed back on ground
          if (dinoY >= groundYPos) {
            dinoY = groundYPos;
            dinoVy = 0;
            jumping = false;
            speedDrop = false;
          }
        }

        // Increment Score
        localScore += 0.15;
        setScore(Math.floor(localScore));

        // Score Milestone sound
        const scoreMilestone = Math.floor(localScore / 100);
        if (scoreMilestone > milestoneCount) {
          milestoneCount = scoreMilestone;
          playBeep("milestone");
        }

        // Slowly accelerate game speed up to max speed
        if (gameSpeed < maxSpeed) {
          gameSpeed += acceleration;
        }
      }

      // Draw Dino Silhouette
      ctx.fillStyle = mainThemeColor;
      if (isCrouching) {
        // crouching shape (accurate silhouette details)
        ctx.fillRect(dinoX + 16, currentDinoY + 2, 22, 14); // main head block
        ctx.fillRect(dinoX + 38, currentDinoY + 6, 16, 8);  // snout
        ctx.fillRect(dinoX + 8, currentDinoY + 8, 24, 14);  // body
        ctx.fillRect(dinoX, currentDinoY + 6, 8, 6);       // tail tip
        ctx.fillRect(dinoX + 6, currentDinoY + 10, 8, 6);   // tail center
        ctx.fillRect(dinoX + 30, currentDinoY + 16, 6, 3);   // arm
        // Eye
        ctx.fillStyle = colorSchemeAlpha > 0.5 ? "#121212" : "#10b981";
        ctx.fillRect(dinoX + 26, currentDinoY + 4, 3, 3);
      } else {
        // standing shape (accurate silhouette details)
        ctx.fillRect(dinoX + 20, currentDinoY, 20, 16);     // head main block
        ctx.fillRect(dinoX + 20, currentDinoY + 16, 12, 4);  // lower jaw
        ctx.fillRect(dinoX + 20, currentDinoY + 16, 6, 10);  // neck
        ctx.fillRect(dinoX + 10, currentDinoY + 20, 16, 20); // main body block
        ctx.fillRect(dinoX, currentDinoY + 16, 4, 12);       // tail top
        ctx.fillRect(dinoX + 4, currentDinoY + 22, 6, 12);   // tail middle
        ctx.fillRect(dinoX + 8, currentDinoY + 28, 4, 8);    // tail bottom
        ctx.fillRect(dinoX + 26, currentDinoY + 22, 6, 3);   // arm
        // Eye
        ctx.fillStyle = colorSchemeAlpha > 0.5 ? "#121212" : "#10b981";
        ctx.fillRect(dinoX + 26, currentDinoY + 4, 3, 3);
      }

      // Feet running animation cycle
      ctx.fillStyle = mainThemeColor;
      const footCycle = Math.floor(frameCount / 6) % 2;
      if (gameStateRef.current === "playing" && dinoY === groundYPos) {
        if (isCrouching) {
          ctx.fillRect(dinoX + 14, currentDinoY + crouchHeight, 5, 2);
          ctx.fillRect(dinoX + 26, currentDinoY + crouchHeight, 5, 2);
          ctx.fillStyle = colorSchemeAlpha > 0.5 ? "#121212" : "#000";
          if (footCycle === 0) {
            ctx.fillRect(dinoX + 14, currentDinoY + crouchHeight, 5, 1);
          } else {
            ctx.fillRect(dinoX + 26, currentDinoY + crouchHeight, 5, 1);
          }
        } else {
          ctx.fillRect(dinoX + 12, currentDinoY + dinoHeight - 4, 5, 4);
          ctx.fillRect(dinoX + 22, currentDinoY + dinoHeight - 4, 5, 4);
          ctx.fillStyle = colorSchemeAlpha > 0.5 ? "#121212" : "#000";
          if (footCycle === 0) {
            ctx.fillRect(dinoX + 12, currentDinoY + dinoHeight - 2, 5, 2);
          } else {
            ctx.fillRect(dinoX + 22, currentDinoY + dinoHeight - 2, 5, 2);
          }
        }
      } else if (gameStateRef.current === "playing") {
        // Air feet
        if (isCrouching) {
          ctx.fillRect(dinoX + 16, currentDinoY + crouchHeight, 5, 2);
        } else {
          ctx.fillRect(dinoX + 14, currentDinoY + dinoHeight - 4, 5, 4);
          ctx.fillRect(dinoX + 20, currentDinoY + dinoHeight - 4, 5, 4);
        }
      } else {
        // Idle feet
        ctx.fillRect(dinoX + 12, currentDinoY + dinoHeight - 4, 5, 4);
        ctx.fillRect(dinoX + 22, currentDinoY + dinoHeight - 4, 5, 4);
      }

      // Obstacle physics and rendering
      if (gameStateRef.current === "playing") {
        const lastObs = obstacles[obstacles.length - 1];
        
        // Spawn checks matching Chromium's gap factor
        if (obstacles.length === 0 || (canvas.width - lastObs.x >= lastObs.gap)) {
          const spawnBird = localScore > 350 && Math.random() < 0.22;
          
          if (spawnBird) {
            const birdHeights = [groundY - 38, groundY - 24, groundY - 14];
            const yPos = birdHeights[Math.floor(Math.random() * birdHeights.length)];
            
            // Bird width: 22, height: 12
            const width = 22;
            const minGap = 130;
            const gapFactor = 0.6;
            const gap = Math.round(width * gameSpeed + minGap * gapFactor);
            
            obstacles.push({
              type: "bird",
              x: canvas.width,
              y: yPos,
              width,
              height: 12,
              speed: gameSpeed,
              gap: getRandomNum(gap, Math.round(gap * 1.5)),
              birdFrame: 0
            });
          } else {
            const randType = Math.random();
            let type: "cactus_s" | "cactus_d" | "cactus_t" | "cactus_l" = "cactus_s";
            let width = 17;
            let height = 35;
            let minGap = 120;
            let yPos = groundY - height;

            if (randType > 0.85) {
              type = "cactus_t";
              width = 45; // triple small cactus
              height = 35;
              minGap = 120;
              yPos = groundY - height;
            } else if (randType > 0.60) {
              type = "cactus_d";
              width = 30; // double large/small cactus
              height = 38;
              minGap = 120;
              yPos = groundY - height;
            } else if (randType > 0.35) {
              type = "cactus_l";
              width = 25; // single large cactus
              height = 50;
              minGap = 150;
              yPos = groundY - height;
            }

            const gapFactor = 0.6;
            const gap = Math.round(width * gameSpeed + minGap * gapFactor);

            obstacles.push({
              type,
              x: canvas.width,
              y: yPos,
              width,
              height,
              speed: gameSpeed,
              gap: getRandomNum(gap, Math.round(gap * 1.5))
            });
          }
        }

        // Draw and update obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
          const obs = obstacles[i];
          obs.x -= obs.speed;

          if (obs.type === "bird") {
            ctx.fillStyle = mainThemeColor;
            obs.birdFrame = obs.birdFrame !== undefined ? obs.birdFrame + 1 : 0;
            ctx.fillRect(obs.x + 4, obs.y + 3, 14, 6);
            ctx.fillRect(obs.x, obs.y + 4, 4, 3);
            
            const isWingUp = Math.floor(obs.birdFrame / 10) % 2 === 0;
            if (isWingUp) {
              ctx.fillRect(obs.x + 8, obs.y - 4, 4, 7);
            } else {
              ctx.fillRect(obs.x + 8, obs.y + 8, 4, 7);
            }
          } else {
            ctx.fillStyle = hazardColor;
            
            if (obs.type === "cactus_s") {
              // single small cactus: trunk + branches
              ctx.fillRect(obs.x + 6, obs.y, 5, obs.height);
              ctx.fillRect(obs.x + 2, obs.y + 10, 4, 4);
              ctx.fillRect(obs.x + 2, obs.y + 6, 2, 8);
              ctx.fillRect(obs.x + 11, obs.y + 14, 4, 4);
              ctx.fillRect(obs.x + 13, obs.y + 10, 2, 8);
            } else if (obs.type === "cactus_d") {
              // double cactus: Cactus 1 (small) + Cactus 2 (medium/tall)
              // Cactus 1 (left)
              ctx.fillRect(obs.x + 4, obs.y + 3, 4, obs.height - 3);
              ctx.fillRect(obs.x + 1, obs.y + 12, 3, 3);
              ctx.fillRect(obs.x + 1, obs.y + 9, 2, 6);
              ctx.fillRect(obs.x + 8, obs.y + 15, 3, 3);
              ctx.fillRect(obs.x + 9, obs.y + 11, 2, 6);
              // Cactus 2 (right)
              ctx.fillRect(obs.x + 18, obs.y, 5, obs.height);
              ctx.fillRect(obs.x + 13, obs.y + 10, 5, 4);
              ctx.fillRect(obs.x + 13, obs.y + 6, 2, 8);
              ctx.fillRect(obs.x + 23, obs.y + 14, 5, 4);
              ctx.fillRect(obs.x + 25, obs.y + 10, 3, 8);
            } else if (obs.type === "cactus_t") {
              // triple cactus: Cactus 1 + Cactus 2 + Cactus 3
              // Cactus 1 (left)
              ctx.fillRect(obs.x + 3, obs.y + 5, 4, obs.height - 5);
              // Cactus 2 (middle)
              ctx.fillRect(obs.x + 18, obs.y, 5, obs.height);
              ctx.fillRect(obs.x + 13, obs.y + 10, 5, 4);
              ctx.fillRect(obs.x + 13, obs.y + 6, 2, 8);
              ctx.fillRect(obs.x + 23, obs.y + 13, 5, 4);
              ctx.fillRect(obs.x + 25, obs.y + 9, 3, 8);
              // Cactus 3 (right)
              ctx.fillRect(obs.x + 36, obs.y + 3, 4, obs.height - 3);
            } else if (obs.type === "cactus_l") {
              // single large cactus: trunk + branches
              ctx.fillRect(obs.x + 9, obs.y, 7, obs.height);
              ctx.fillRect(obs.x + 2, obs.y + 14, 7, 5);
              ctx.fillRect(obs.x + 2, obs.y + 9, 3, 10);
              ctx.fillRect(obs.x + 16, obs.y + 18, 7, 5);
              ctx.fillRect(obs.x + 20, obs.y + 13, 3, 10);
            }
          }

          // Forgiving hitboxes with 3.5px padding
          const dPadW = 3.5;
          const dPadH = 3.5;
          const oPadW = 3.5;
          const oPadH = 3.5;
          
          const collided = (dinoX + dPadW) < (obs.x + obs.width - oPadW) &&
            (dinoX + currentDinoWidth - dPadW) > (obs.x + oPadW) &&
            (currentDinoY + dPadH) < (obs.y + obs.height - oPadH) &&
            (currentDinoY + currentDinoHeight - dPadH) > (obs.y + oPadH);

          if (collided) {
            setGameState("gameover");
            playBeep("crash");
            setHighScore(prev => Math.max(prev, Math.floor(localScore)));
          }

          if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
          }
        }
      }

      // Overlay text rendering
      if (gameStateRef.current === "idle") {
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.font = "bold 13px monospace";
        ctx.textAlign = "center";
        ctx.fillText("PRESS SPACE OR CLICK TO PLAY 🦖", canvas.width / 2, canvas.height / 2 - 10);
        ctx.font = "9px monospace";
        ctx.fillStyle = colorSchemeAlpha > 0.5 ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.45)";
        ctx.fillText("Up/Down to jump/duck (Variable Jump height enabled!)", canvas.width / 2, canvas.height / 2 + 10);
      } else if (gameStateRef.current === "gameover") {
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 16px monospace";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 15);
        ctx.fillStyle = colorSchemeAlpha > 0.5 ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.85)";
        ctx.font = "11px monospace";
        ctx.fillText("PRESS SPACE OR CLICK TO RESTART", canvas.width / 2, canvas.height / 2 + 10);
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("click", handleJump);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="w-full bg-background/60 backdrop-blur-lg rounded-3xl p-5 shadow-xl flex flex-col justify-center border-2 border-border/50 relative overflow-hidden group select-none animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Background radial highlight */}
      <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/5 via-rose-500/5 to-indigo-500/5 opacity-40 blur-xl group-hover:opacity-60 transition-opacity pointer-events-none" />

      <div className="flex justify-between items-center mb-2.5 relative z-10">
        <h3 className="text-xs font-bold text-muted-foreground/80 tracking-widest uppercase flex items-center gap-1.5">
          🦖 OG Chrome Dino Clone
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex gap-4 font-mono text-[10px] font-bold">
            <span className="text-primary">SCORE: {score}</span>
            <span className="text-muted-foreground">HI: {highScore}</span>
          </div>
          {onClose && (
            <button 
              onClick={onClose} 
              className="text-muted-foreground/60 hover:text-foreground/80 transition-colors p-0.5 rounded-lg hover:bg-white/5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      
      <div className="relative bg-black/45 rounded-2xl border border-white/5 h-[150px] overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full cursor-pointer" />
      </div>
    </div>
  );
}

const DEFAULT_FIRESTORE_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Describe your requirements on the left, then click Generate.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}`;

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
}

function computeDiff(oldStr: string, newStr: string): DiffLine[] {
  if (!oldStr) return newStr.split('\n').map(line => ({ type: 'added' as const, text: line }));
  if (!newStr) return oldStr.split('\n').map(line => ({ type: 'removed' as const, text: line }));
  
  const oldLines = oldStr.split('\n');
  const newLines = newStr.split('\n');
  
  const dp: number[][] = Array(oldLines.length + 1).fill(null).map(() => Array(newLines.length + 1).fill(0));
  
  for (let i = 1; i <= oldLines.length; i++) {
    for (let j = 1; j <= newLines.length; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  const diff: DiffLine[] = [];
  let i = oldLines.length;
  let j = newLines.length;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      diff.unshift({ type: 'unchanged', text: oldLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.unshift({ type: 'added', text: newLines[j - 1] });
      j--;
    } else {
      diff.unshift({ type: 'removed', text: oldLines[i - 1] });
      i--;
    }
  }
  return diff;
}

export default function OrchestrationPage() {
  const [viewMode, setViewMode] = useState<"dashboard" | "chat" | "profile" | "settings">("dashboard");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [steps, setSteps] = useState<{ title: string; content: any }[]>([]);
  const [deployPlan, setDeployPlan] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // ── NEW STATE: Mode & Rules ──
  const [orchestrationMode, setOrchestrationMode] = useState<"generate" | "improve">("generate");
  const [existingRules, setExistingRules] = useState("");
  
  // ── NEW STATE: Copy Status ──
  const [hasCopied, setHasCopied] = useState(false);

  // ── NEW STATE: View Toggle for rules ──
  const [rulesView, setRulesView] = useState<"after" | "before">("after");

  // ── NEW STATE: Streaming Rules & Diffing ──
  const [streamingRules, setStreamingRules] = useState("");
  
  // ── NEW STATE: Dino Game Close Control ──
  const [showGame, setShowGame] = useState(true);
  
  const router = useRouter();
  const endOfStepsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfStepsRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [steps]);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;
    let unsubscribeProjects: (() => void) | undefined;
    
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setNewDisplayName(currentUser.displayName || "");
        
        const userDocRef = doc(db, "users", currentUser.uid);
        unsubscribeSnapshot = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            const defaultData = {
              activeProjects: 0,
              totalAudits: 0,
              apiCalls: 0,
              subscriptionPlan: "Free",
              nextBillingDate: "N/A"
            };
            await setDoc(userDocRef, defaultData);
            setUserData(defaultData);
          }
        });

        const q = query(collection(db, "projects"), where("userId", "==", currentUser.uid));
        unsubscribeProjects = onSnapshot(q, (querySnapshot) => {
          const projData = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setProjects(projData);
          if (projData.length > 0) {
             setSelectedProjectId(prev => prev || projData[0].id);
          }
        });

        // Removed checkFirebaseConnection because OAuth tokens are short-lived and should be re-acquired
      } else {
        router.push("/sign-in");
      }
    });
    
    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      if (unsubscribeProjects) unsubscribeProjects();
    };
  }, [router]);

  // ── Local File Operations ──

  const handleDownloadRules = () => {
    const rulesToDownload = displayRules;
    if (!rulesToDownload) return;
    const blob = new Blob([rulesToDownload], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "firestore.rules";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyRules = () => {
    const rulesToCopy = displayRules;
    if (!rulesToCopy) return;
    navigator.clipboard.writeText(rulesToCopy).then(() => {
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    });
  };

  // ── Existing Handlers ──

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUpdatingProfile(true);
    try {
      await updateProfile(user, { displayName: newDisplayName });
      setUser({ ...user, displayName: newDisplayName } as User);
      setViewMode("profile");
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !user) return;
    
    setIsCreatingProject(true);
    try {
      const docRef = await addDoc(collection(db, "projects"), {
        name: newProjectName.trim(),
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      setSelectedProjectId(docRef.id);
      
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        activeProjects: increment(1)
      });
      
      setNewProjectName("");
      setShowCreateProject(false);
    } catch (err) {
      console.error("Failed to create project", err);
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;

    try {
      await deleteDoc(doc(db, "projects", projectId));
      
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        activeProjects: increment(-1)
      });

      if (selectedProjectId === projectId) {
        setSelectedProjectId("");
      }
    } catch (err) {
      console.error("Failed to delete project", err);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && orchestrationMode === "generate") return;
    if (orchestrationMode === "improve" && !existingRules.trim()) return;
    
    console.log(`[Client] Starting ${orchestrationMode} orchestration`);
    setLoading(true);
    setResult(null);
    setStreamingRules("");
    setShowGame(true);
    setSteps([{ title: "Initialization", content: `Connecting to ForgeGuard Orchestrator (${orchestrationMode} mode)...` }]);

    try {
      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: prompt || "Analyze and improve these Firebase security rules",
          model: selectedModel,
          userId: user?.uid || "anonymous",
          mode: orchestrationMode,
          existingRules: orchestrationMode === "improve" ? existingRules : undefined
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || errData.error || "Failed to start orchestration");
      }

      if (!res.body) throw new Error("No body in response");
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          
          buffer = lines.pop() || "";
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;
            
            const dataStr = trimmedLine.replace("data: ", "");
            
            try {
               if (dataStr === "[DONE]") continue;
               
              const event = JSON.parse(dataStr);
              console.log("[Client] Event:", event.type, event.step || "");
              
              if (event.type === "step") {
                setSteps((s) => [...s, { title: event.step, content: event.data }]);
                
                // Live capture streaming rules to show live corrections in the editor
                if (event.step.startsWith("Rules Refined")) {
                  setStreamingRules(event.data);
                } else if (event.step.startsWith("Rules Improved")) {
                  setStreamingRules(event.data.rules);
                }
              } else if (event.type === "done") {
                console.log("[Client] Orchestration complete");
                setResult(event.result);
                const rulesContent = event.result?.afterRules || event.result?.rules;
                if (rulesContent) {
                  setDeployPlan({
                    service: "firestore",
                    ruleCount: (rulesContent.match(/allow/g) || []).length,
                    safetyChecks: ["Auth validation present", "No 'if true' detected", "Owner checks verified"]
                  });
                }
              } else if (event.type === "error") {
                setSteps((s) => [...s, { title: "Error", content: event.error }]);
              }
            } catch (err) {
              console.warn("Parse error for dataStr:", dataStr);
            }
          }
        }
      }
    } catch (e: any) {
      console.error("[Client] Error:", e);
      setSteps((s) => [...s, { title: "Connection Failure", content: e.message }]);
    } finally {
      setLoading(false);
    }
  };

  const AVAILABLE_MODELS = [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", tier: "Free" },
    { id: "google/gemma-4-31b-it:free", name: "Gemma 4 31B (OpenRouter)", tier: "Free" },
  ];

  // ── Computed values for the UI ──
  const beforeScore = result?.beforeAudit?.score;
  const afterScore = result?.afterAudit?.score ?? result?.audit?.score;
  const isImproveResult = result?.mode === "improve";
  const improvements = result?.improvements || [];
  
  const currentActiveRules = ensureString(result?.afterRules || result?.rules || streamingRules);
  const displayRules = rulesView === "before" && result?.beforeRules 
    ? ensureString(result.beforeRules) 
    : (currentActiveRules || ensureString(orchestrationMode === "improve" ? existingRules : DEFAULT_FIRESTORE_RULES));
  const canDeploy = result && (afterScore !== undefined && afterScore >= 90);
  const showDiff = orchestrationMode === "improve" && existingRules && currentActiveRules && rulesView === "after";

  return (
    <GridBackground variant="dots" className="flex w-full flex-col font-sans selection:bg-primary/30 min-h-screen">
      
      <main className="grow flex flex-col items-center pt-10 pb-24 px-4 relative z-10 w-full max-w-7xl mx-auto">
        
        {/* Navigation & Toggle Header */}
        <div className="w-full flex justify-between items-center mb-12">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium w-[120px]">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          
          <div className="flex items-center gap-4">
            {/* Model Selector Dropdown */}
            <div className="relative group/model z-50">
               <GlassSurface 
                 width="max-content" 
                 height={42} 
                 borderRadius={24} 
                 borderWidth={0.15} 
                 distortionScale={-200}
                 redOffset={10}
                 greenOffset={20}
                 blueOffset={30}
                 opacity={0.1}
                 displace={5}
                 className="cursor-pointer hover:border-primary/50 transition-all rounded-full"
               >
                 <div className="flex items-center gap-2 px-4 py-2 w-full h-full">
                    <Sparkles className="w-4 h-4 text-chart-1" />
                    <span className="text-sm font-bold text-foreground/80">
                      {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                 </div>
               </GlassSurface>
               
               <div className="absolute top-full mt-2 left-0 w-64 bg-card/95 backdrop-blur-xl border border-border/80 rounded-2xl shadow-xl opacity-0 invisible group-hover/model:opacity-100 group-hover/model:visible transition-all flex flex-col overflow-hidden">
                  <div className="p-2 space-y-1">
                    {AVAILABLE_MODELS.map(m => (
                      <button 
                        key={m.id}
                        onClick={() => setSelectedModel(m.id)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors flex items-center justify-between ${selectedModel === m.id ? "bg-primary/10 text-primary/90 font-bold" : "text-foreground/80 hover:bg-muted/80"}`}
                      >
                        {m.name}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${m.tier === 'Pro' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {m.tier}
                        </span>
                      </button>
                    ))}
                  </div>
               </div>
            </div>

            {/* Removed Firebase Connection Button */}

            {/* Project Selector */}
            <div className="relative group/dropdown z-50">
              <GlassSurface 
                width="max-content" 
                height={42} 
                borderRadius={24} 
                borderWidth={0.15} 
                distortionScale={-200}
                redOffset={10}
                greenOffset={20}
                blueOffset={30}
                opacity={0.1}
                displace={5}
                className="cursor-pointer hover:border-primary/50 transition-all rounded-full"
              >
                <div className="flex items-center gap-2 px-4 py-2 w-full h-full">
                  <Folder className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-foreground/80 max-w-[150px] truncate">
                    {projects.find(p => p.id === selectedProjectId)?.name || "Select Project"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </div>
              </GlassSurface>
              
              <div className="absolute top-full mt-2 left-0 w-64 bg-card/95 backdrop-blur-xl border border-border/80 rounded-2xl shadow-xl opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all flex flex-col overflow-hidden">
                <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
                  {projects.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-3 text-center">No projects found</p>
                  ) : (
                    projects.map(p => (
                      <div key={p.id} className="group/item relative">
                        <button 
                          onClick={() => setSelectedProjectId(p.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors pr-10 ${selectedProjectId === p.id ? "bg-primary/10 text-primary/90 font-bold" : "text-foreground/80 hover:bg-muted/80"}`}
                        >
                          {p.name}
                        </button>
                        <button
                          onClick={(e) => handleDeleteProject(p.id, e)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover/item:opacity-100 transition-all"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-border/50 bg-background/50">
                  <button 
                    onClick={() => setShowCreateProject(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary/10 text-primary/90 hover:bg-primary/90 hover:text-primary-foreground/90 rounded-xl text-sm font-bold transition-all"
                  >
                    <Plus className="w-4 h-4" /> Create New Project
                  </button>
                </div>
              </div>
            </div>

            <GlassSurface 
              width="max-content" 
              height={46} 
              borderRadius={24} 
              borderWidth={0.15} 
              distortionScale={-200}
              redOffset={10}
              greenOffset={20}
              blueOffset={30}
              opacity={0.1}
              displace={5}
              className="rounded-full"
            >
              <div className="inline-flex p-1 h-full w-full">
                <button 
                  onClick={() => setViewMode("dashboard")}
                  className={`flex items-center gap-2 px-6 h-full rounded-lg text-sm font-bold transition-all ${viewMode === "dashboard" ? "bg-primary/90 text-primary-foreground/90 shadow-md" : "text-muted-foreground hover:text-foreground/80"}`}
                >
                  <Shield className="w-4 h-4" /> Orchestrator
                </button>
                <button 
                  onClick={() => setViewMode("chat")}
                  className={`flex items-center gap-2 px-6 h-full rounded-lg text-sm font-bold transition-all ${viewMode === "chat" ? "bg-primary/90 text-primary-foreground/90 shadow-md" : "text-muted-foreground hover:text-foreground/80"}`}
                >
                  <MessageSquare className="w-4 h-4" /> Security Chat
                </button>
              </div>
            </GlassSurface>
          </div>
          
          <div className="w-[120px] flex justify-end">
            <button 
              onClick={() => setViewMode(viewMode === "profile" ? "dashboard" : "profile")}
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all shadow-sm overflow-hidden ${viewMode === "profile" ? "border-primary bg-primary/10 scale-110" : "border-border/50 bg-card hover:border-primary/50"}`}
            >
              {user?.photoURL && !avatarError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" onError={() => setAvatarError(true)} referrerPolicy="no-referrer" />
              ) : (
                <UserIcon className={`w-5 h-5 ${viewMode === "profile" ? "text-primary" : "text-muted-foreground"}`} />
              )}
            </button>
          </div>
        </div>

        {viewMode === "settings" ? (
          <div className="w-full max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <button onClick={() => setViewMode("profile")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium mb-4">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </button>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Account Settings</h1>
              <p className="text-muted-foreground mt-2">Update your personal information and preferences.</p>
            </div>
            
            <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-xl">
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Display Name</label>
                  <input 
                    type="text" 
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Email Address</label>
                  <input 
                    type="email" 
                    value={user?.email || ""}
                    disabled
                    className="w-full h-12 px-4 rounded-xl bg-muted/50 border border-border/50 text-muted-foreground cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-2">Email address cannot be changed currently.</p>
                </div>
                
                <button 
                  type="submit" 
                  disabled={isUpdatingProfile}
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {isUpdatingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
                </button>
              </form>
            </div>
          </div>
        ) : viewMode === "profile" ? (
          <div className="w-full max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-500">
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">User Dashboard</h1>
              <p className="text-muted-foreground mt-2">Manage your account, view analytics, and update your subscription.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Account Details */}
              <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-xl flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full border-4 border-background bg-muted mb-4 flex items-center justify-center shadow-inner overflow-hidden">
                  {user?.photoURL && !avatarError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" onError={() => setAvatarError(true)} referrerPolicy="no-referrer" />
                  ) : (
                    <UserIcon className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                <h2 className="text-xl font-bold text-foreground mb-1">{user?.displayName || "ForgeGuard User"}</h2>
                <p className="text-sm text-muted-foreground mb-6 bg-muted px-3 py-1 rounded-full">{user?.email}</p>
                
                <div className="w-full space-y-3 mt-auto">
                  <button onClick={() => setViewMode("settings")} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border bg-background hover:bg-muted text-sm font-semibold transition-colors">
                    <Settings className="w-4 h-4" /> Account Settings
                  </button>
                  <button 
                    onClick={async () => { await signOut(auth); router.push("/sign-in"); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 text-sm font-semibold transition-colors border border-destructive/20"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>

              {/* Analytics */}
              <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-xl md:col-span-2 flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                    <Activity className="w-5 h-5 text-emerald-500" /> Usage Analytics
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-background/50 border border-border/50 rounded-2xl p-4 shadow-sm flex flex-col justify-center">
                      <p className="text-sm text-muted-foreground mb-1">Active Projects</p>
                      <p className="text-3xl font-extrabold text-foreground">{userData?.activeProjects ?? "-"}</p>
                    </div>
                    <div className="bg-background/50 border border-border/50 rounded-2xl p-4 shadow-sm flex flex-col justify-center">
                      <p className="text-sm text-muted-foreground mb-1">Total AI Audits</p>
                      <p className="text-3xl font-extrabold text-foreground">{userData?.totalAudits ?? "-"}</p>
                    </div>
                    <div className="bg-background/50 border border-border/50 rounded-2xl p-4 shadow-sm flex flex-col justify-center">
                      <p className="text-sm text-muted-foreground mb-1">API Calls</p>
                      <p className="text-3xl font-extrabold text-foreground">{userData?.apiCalls ?? "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t border-border/50 pt-6">
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                    <CreditCard className="w-5 h-5 text-indigo-500" /> Subscription Plan
                  </h2>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-extrabold text-lg text-foreground">ForgeGuard {userData?.subscriptionPlan || "Free"}</span>
                        <span className="bg-indigo-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Active</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Next billing date: {userData?.nextBillingDate || "N/A"}</p>
                    </div>
                    <div className="mt-4 sm:mt-0 text-right">
                      <p className="text-2xl font-bold text-foreground">{userData?.subscriptionPlan === "Pro" ? "$49" : "$0"}<span className="text-sm text-muted-foreground font-medium">/mo</span></p>
                      <button className="text-sm text-indigo-500 hover:text-indigo-400 font-semibold underline-offset-4 hover:underline mt-1">Manage Billing</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : viewMode === "chat" ? (
          <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SecurityChat 
              orchestrationContext={result} 
              userPlan={userData?.subscriptionPlan || "Free"} 
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full text-left relative overflow-hidden rounded-[2.5rem] bg-card/90 backdrop-blur-xl border-2 border-border/60 p-4 md:p-8 shadow-2xl">
            
            {/* Left Column: Input & Process Stream */}
            <section className="lg:col-span-5 space-y-6 flex flex-col h-[700px] min-w-0">
              
              {/* Mode Toggle + Input Area */}
              <div className="bg-background/40 backdrop-blur-sm p-6 rounded-[2rem] shadow-[inset_4px_4px_8px_rgba(0,0,0,0.2),inset_-4px_-4px_8px_rgba(255,255,255,0.02)] shrink-0 flex flex-col border border-border/20">
                
                {/* Mode Toggle */}
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => setOrchestrationMode("generate")}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${orchestrationMode === "generate" ? "bg-primary text-primary-foreground shadow-md" : "bg-card text-muted-foreground hover:text-foreground border border-border/50"}`}
                  >
                    <Zap className="w-3 h-3" /> Generate New
                  </button>
                  <button
                    onClick={() => setOrchestrationMode("improve")}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${orchestrationMode === "improve" ? "bg-emerald-500 text-white shadow-md" : "bg-card text-muted-foreground hover:text-foreground border border-border/50"}`}
                  >
                    <RefreshCw className="w-3 h-3" /> Improve Existing
                  </button>
                </div>

                {orchestrationMode === "improve" ? (
                  <>
                    <h2 className="text-sm font-semibold mb-2 flex items-center gap-2 text-foreground/80">
                      <FileCode2 className="w-4 h-4 text-emerald-500" /> Existing Rules
                    </h2>
                    <textarea
                      className="w-full h-24 bg-card rounded-2xl p-4 text-foreground placeholder:text-muted-foreground focus:outline-none transition-all resize-none text-xs font-mono custom-scrollbar shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.02)] border border-transparent focus:border-primary/20"
                      placeholder="Paste your existing Firebase rules here to analyze and improve them..."
                      value={existingRules}
                      onChange={(e) => setExistingRules(e.target.value)}
                    />
                    <h2 className="text-sm font-semibold mt-3 mb-2 flex items-center gap-2 text-foreground/80">
                      <Sparkles className="w-4 h-4 text-chart-1" /> Improvement Context <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                    </h2>
                    <textarea
                      className="w-full h-16 bg-card rounded-2xl p-4 text-foreground placeholder:text-muted-foreground focus:outline-none transition-all resize-none text-sm custom-scrollbar shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.02)] border border-transparent focus:border-primary/20"
                      placeholder="Additional context (e.g. 'Add admin role support', 'Users should only read their own data')..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                  </>
                ) : (
                  <>
                    <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground/80">
                      <Sparkles className="w-4 h-4 text-chart-1" /> Goal Definition
                    </h2>
                    <textarea
                      className="w-full h-32 bg-card rounded-2xl p-5 text-foreground placeholder:text-muted-foreground focus:outline-none transition-all resize-none text-sm custom-scrollbar shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.02)] border border-transparent focus:border-primary/20"
                      placeholder="Describe your project architecture (e.g. 'SaaS with teams, tasks, file uploads, and admin roles')..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                  </>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={loading || (orchestrationMode === "generate" ? !prompt.trim() : !existingRules.trim())}
                  className={`mt-4 w-full font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[4px_4px_8px_rgba(0,0,0,0.2),-4px_-4px_8px_rgba(255,255,255,0.05)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed ${
                    orchestrationMode === "improve" 
                      ? "bg-emerald-500 text-white" 
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Orchestrating...</>
                  ) : orchestrationMode === "improve" ? (
                    <><RefreshCw className="w-4 h-4" /> Improve Security Rules</>
                  ) : (
                    <><Play className="w-4 h-4" /> Generate Security Rules</>
                  )}
                </button>
              </div>

              {/* Streaming Steps */}
              <div className="flex-1 bg-background/40 backdrop-blur-sm p-6 overflow-hidden flex flex-col rounded-[2rem] shadow-[inset_4px_4px_8px_rgba(0,0,0,0.2),inset_-4px_-4px_8px_rgba(255,255,255,0.02)] border border-border/20">
                <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 text-muted-foreground shrink-0 border-b border-border pb-3">
                  <Terminal className="w-4 h-4" /> Process Trace
                </h2>
                <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                  {steps.length === 0 && !loading && (
                    <p className="text-muted-foreground text-sm italic text-center mt-12">Waiting for input...</p>
                  )}
                  {steps.map((step, idx) => (
                    <div key={idx} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center gap-2 mb-1.5">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${step.title === 'Error' ? 'text-destructive' : 'text-chart-2'}`} />
                        <span className={`text-xs font-bold uppercase tracking-wider ${step.title === 'Error' ? 'text-destructive' : 'text-chart-2'}`}>{step.title}</span>
                      </div>
                      <ExpandableStepContent content={step.content} />
                    </div>
                  ))}
                  {loading && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm p-2 animate-pulse mt-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing next step...
                    </div>
                  )}
                  <div ref={endOfStepsRef} />
                </div>
              </div>
            </section>

            {/* Right Column: Output & Results */}
            <section className="lg:col-span-7 flex flex-col gap-6 h-[700px] min-w-0">
              
              {/* Output Code Window */}
              <div className="flex-1 min-h-0 bg-background/40 backdrop-blur-sm rounded-[2.5rem] p-4 shadow-[8px_8px_16px_rgba(0,0,0,0.3),-8px_-8px_16px_rgba(255,255,255,0.02)] flex flex-col relative group border border-border/20">
                <div className="bg-card px-5 py-4 flex justify-between items-center shrink-0 rounded-2xl shadow-[4px_4px_8px_rgba(0,0,0,0.2),-4px_-4px_8px_rgba(255,255,255,0.01)] mb-4 border border-transparent">
                  <div className="flex items-center gap-3">
                    <Code2 className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-bold text-foreground tracking-wide">firestore.rules</span>
                    {/* Before/After toggle for improve mode */}
                    {isImproveResult && result?.beforeRules && (
                      <div className="inline-flex p-0.5 bg-background/50 rounded-lg ml-3">
                        <button 
                          onClick={() => setRulesView("after")} 
                          className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${rulesView === "after" ? "bg-emerald-500 text-white" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          IMPROVED
                        </button>
                        <button 
                          onClick={() => setRulesView("before")} 
                          className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${rulesView === "before" ? "bg-red-500/80 text-white" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          ORIGINAL
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-red-500/80 shadow-inner"></div>
                    <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/80 shadow-inner"></div>
                    <div className="w-3.5 h-3.5 rounded-full bg-green-500/80 shadow-inner"></div>
                  </div>
                </div>
                <pre className="flex-1 min-h-0 p-6 text-xs overflow-auto text-primary font-mono custom-scrollbar bg-card rounded-3xl shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.02)] border border-transparent">
                  {showDiff ? (
                    <div className="flex flex-col min-w-max">
                      {computeDiff(existingRules, currentActiveRules).map((line, idx) => {
                        let bgColor = "transparent";
                        let textColor = "text-muted-foreground";
                        let prefix = "  ";
                        if (line.type === "added") {
                          bgColor = "bg-emerald-500/10 border-l-2 border-emerald-500 px-1";
                          textColor = "text-emerald-400 font-bold";
                          prefix = "+ ";
                        } else if (line.type === "removed") {
                          bgColor = "bg-destructive/10 border-l-2 border-destructive px-1";
                          textColor = "text-destructive/80 font-bold line-through";
                          prefix = "- ";
                        }
                        return (
                          <div key={idx} className={`py-0.5 ${bgColor} ${textColor} whitespace-pre`}>
                            {prefix}{line.text}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    displayRules ? <TypewriterCode code={displayRules} /> : "// The generated rules will appear here..."
                  )}
                </pre>
              </div>

              {/* Audit, Score Comparison & Deploy Panels */}
              {result && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  
                  {/* Before/After Score Comparison (for improve mode) OR Standard Audit */}
                  {isImproveResult && beforeScore !== undefined ? (
                    <div className="bg-background/60 backdrop-blur-lg rounded-3xl p-6 shadow-xl flex flex-col justify-center border-2 border-border/50">
                      <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 text-foreground/80">
                        <TrendingDown className="w-4 h-4 text-emerald-500" /> Security Score Improvement
                      </h2>
                      <div className="flex items-center justify-between gap-4 mb-4">
                        {/* Before Score */}
                        <div className="text-center flex-1">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Before</p>
                          <p className={`text-3xl font-extrabold ${beforeScore >= 90 ? 'text-chart-2' : beforeScore >= 70 ? 'text-yellow-500' : 'text-destructive'}`}>
                            {beforeScore}
                          </p>
                          <p className="text-[10px] text-muted-foreground">/100</p>
                        </div>
                        
                        <ArrowRight className="w-6 h-6 text-emerald-500 shrink-0" />
                        
                        {/* After Score */}
                        <div className="text-center flex-1">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">After</p>
                          <p className={`text-3xl font-extrabold ${afterScore >= 90 ? 'text-chart-2' : afterScore >= 70 ? 'text-yellow-500' : 'text-destructive'}`}>
                            {afterScore}
                          </p>
                          <p className="text-[10px] text-muted-foreground">/100</p>
                        </div>
                      </div>
                      
                      {/* Improvement badge */}
                      {result.scoreImprovement > 0 && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2 flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold">
                          <Rocket className="w-3.5 h-3.5" />
                          ↑ +{result.scoreImprovement} points security improvement
                          <span className="text-muted-foreground font-normal">({result.vulnerabilitiesFixed} vulns fixed)</span>
                        </div>
                      )}
                      
                      {afterScore >= 90 && (
                        <div className="bg-chart-2/10 border border-chart-2/20 rounded-lg p-2 flex items-center gap-2 text-chart-2 text-xs font-medium mt-2">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Production Ready
                        </div>
                      )}
                    </div>
                  ) : result.audit && (
                    <div className="bg-background/60 backdrop-blur-lg rounded-3xl p-6 shadow-xl flex flex-col justify-center border-2 border-border/50">
                      <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground/80">
                        <ShieldAlert className="w-4 h-4 text-chart-2" /> Security Audit
                      </h2>
                      <div className="space-y-3">
                        <div className="flex justify-between items-baseline border-b border-border pb-2">
                          <span className="text-xs text-muted-foreground uppercase tracking-wider">Security Score</span>
                          <span className={`text-2xl font-bold ${result.audit.score >= 90 ? 'text-chart-2' : 'text-destructive'}`}>
                            {result.audit.score}/100
                          </span>
                        </div>
                        <p className="text-xs text-white/90 leading-relaxed italic">
                          &quot;{result.audit.critique}&quot;
                        </p>
                        {result.audit.isSecure && (
                          <div className="bg-chart-2/10 border border-chart-2/20 rounded-lg p-2 flex items-center gap-2 text-chart-2 text-xs font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified Secure
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Right panel: Improvements Summary OR Deploy Plan */}
                  <div className="flex flex-col gap-4">
                    {/* Improvements list (improve mode) */}
                    {isImproveResult && improvements.length > 0 && (
                      <div className="bg-background/60 backdrop-blur-lg rounded-3xl p-5 shadow-xl border-2 border-emerald-500/20 max-h-[180px] overflow-y-auto custom-scrollbar">
                        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-emerald-400">
                          <Sparkles className="w-4 h-4" /> Improvements Made ({improvements.length})
                        </h2>
                        <ul className="space-y-1.5">
                          {improvements.map((imp: string, i: number) => (
                            <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                              <span className={`shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full ${
                                imp.toLowerCase().startsWith("fixed") || imp.toLowerCase().startsWith("removed") 
                                  ? "bg-red-400" 
                                  : imp.toLowerCase().startsWith("added") 
                                  ? "bg-emerald-400" 
                                  : "bg-yellow-400"
                              }`} />
                              {imp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Deploy Instructions */}
                    {deployPlan && (
                      <div className="backdrop-blur-lg rounded-3xl p-5 shadow-xl flex flex-col justify-center border-2 border-border/50 bg-background/60">
                        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                          <Terminal className="w-4 h-4" /> Local Deployment
                        </h2>
                        
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <button
                              onClick={handleDownloadRules}
                              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                            >
                              <Download className="w-4 h-4" /> Download File
                            </button>
                            <button
                              onClick={handleCopyRules}
                              className="flex-1 py-2.5 rounded-xl bg-card border border-border text-foreground font-bold text-sm flex items-center justify-center gap-2 hover:bg-muted transition-all"
                            >
                              {hasCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Code2 className="w-4 h-4" />}
                              {hasCopied ? "Copied!" : "Copy Rules"}
                            </button>
                          </div>
                          
                          <div className="bg-card border border-border/50 rounded-xl p-3">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Deploy via Firebase CLI</p>
                            <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-lg border border-white/5">
                              <code className="text-emerald-400 text-xs font-mono select-all">firebase deploy --only firestore:rules</code>
                            </div>
                          </div>
                          
                          {afterScore !== undefined && afterScore < 90 && (
                            <p className="text-[10px] text-destructive/80 mt-2 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Score too low ({afterScore}/100). Consider improving further before deploying to production.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {loading && !streamingRules && !result && showGame && (
                <div className="shrink-0">
                  <DinoGame onClose={() => setShowGame(false)} />
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* ══════ MODALS ══════ */}

      {/* Create Project Modal */}
      {showCreateProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowCreateProject(false)} />
          <div className="bg-card border border-border/50 shadow-2xl rounded-3xl w-full max-w-md p-6 relative z-10 animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowCreateProject(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <Folder className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">New Project</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">Create a new workspace to organize your security rules and audits.</p>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Project Name</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  placeholder="e.g. E-commerce App"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                />
              </div>
              <button 
                type="submit" 
                disabled={isCreatingProject || !newProjectName.trim()}
                className="w-full h-12 mt-4 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
              >
                {isCreatingProject ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Project"}
              </button>
            </form>
          </div>
        </div>
      )}



      {/* Global styles for custom scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--muted-foreground); }
      `}} />
    </GridBackground>
  );
}
