"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, ShieldCheck, AlertTriangle, Loader2, Code2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  type?: "text" | "audit" | "code" | "plan" | "error";
  data?: any;
}

interface SecurityChatProps {
  orchestrationContext?: any;
  userPlan?: string;
}

const AVAILABLE_MODELS = [
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash (Fastest)", tier: "Free" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash (Reliable)", tier: "Free" },
  { id: "google/gemma-4-31b-it:free", name: "Gemma 4 31B (Open Source)", tier: "Free" },
  { id: "google/gemma-4-26b-a4b-it:free", name: "Gemma 4 26B (MoE Free)", tier: "Free" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro (Intelligent)", tier: "Pro" },
];

export function SecurityChat({ orchestrationContext, userPlan = "Free" }: SecurityChatProps) {
  const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am your ForgeGuard Engineering Lead. I'm connected to your orchestration context. How can I help you architect your security foundation today?",
      type: "text"
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMsg,
          model: selectedModel,
          context: orchestrationContext,
          plan: userPlan,
          userId: "test-user-01" // In production, pass auth.currentUser.uid
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to get response");
      }

      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: data.response, 
        type: "text" 
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${err.message}`, type: "text" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-card/60 backdrop-blur-xl border-2 border-border/50 rounded-[2.5rem] overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-md p-5 border-b border-border/50 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/20 rounded-xl border border-primary/30 flex items-center justify-center shadow-[inset_2px_2px_4px_rgba(255,255,255,0.1)]">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">ForgeGuard Engineering Lead</h3>
            <p className="text-[10px] text-chart-2 font-mono uppercase tracking-widest mt-0.5">Autonomous Auditor Active</p>
          </div>
        </div>

        {/* Model Selection */}
        <div className="flex items-center gap-2">
           <select 
             value={selectedModel}
             onChange={(e) => setSelectedModel(e.target.value)}
             className="bg-background border border-border/50 text-[10px] font-bold rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/40 text-muted-foreground uppercase tracking-tight shadow-sm"
           >
             {AVAILABLE_MODELS.map(m => (
               <option key={m.id} value={m.id}>
                 {m.name}
               </option>
             ))}
           </select>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative z-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`max-w-[85%] flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${msg.role === "user" ? "bg-background border border-border/50" : "bg-primary/20 border border-primary/30"}`}>
                {msg.role === "user" ? <User className="w-4 h-4 text-muted-foreground" /> : <Bot className="w-4 h-4 text-primary" />}
              </div>
              
              <div className="space-y-2">
                <div className={`p-4 rounded-2xl text-sm ${
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground shadow-[4px_4px_8px_rgba(0,0,0,0.2),-4px_-4px_8px_rgba(255,255,255,0.05)]" 
                    : "bg-card border border-border/40 text-foreground shadow-[inset_4px_4px_8px_rgba(0,0,0,0.2),inset_-4px_-4px_8px_rgba(255,255,255,0.02)]"
                }`}>
                  {msg.type === "code" ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-primary mb-1">
                        <Code2 className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Generated Rules</span>
                      </div>
                      <pre className="text-xs font-mono bg-background/50 border border-border/50 p-4 rounded-xl overflow-x-auto text-primary whitespace-pre-wrap shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)]">
                        {msg.content}
                      </pre>
                    </div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-background/50 prose-pre:border prose-pre:border-border/50">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>

                {msg.type === "audit" && msg.data && (
                  <div className={`p-5 rounded-2xl border ${msg.data.score <= 10 ? 'bg-chart-2/10 border-chart-2/20' : 'bg-destructive/10 border-destructive/20'} animate-in zoom-in-95 shadow-[4px_4px_8px_rgba(0,0,0,0.15),-4px_-4px_8px_rgba(255,255,255,0.02)]`}>
                    <div className="flex items-center gap-2 mb-2">
                      {msg.data.score <= 10 ? <ShieldCheck className="w-4 h-4 text-chart-2" /> : <AlertTriangle className="w-4 h-4 text-destructive" />}
                      <span className={`text-xs font-bold uppercase tracking-wider ${msg.data.score <= 10 ? 'text-chart-2' : 'text-destructive'}`}>
                        Audit Report: {msg.data.score}/100
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground italic mb-3">"{msg.data.critique}"</p>
                    
                    {msg.data.vulnerabilities?.length > 0 && (
                      <div className="space-y-2 mt-3 border-t border-border/50 pt-3">
                        {msg.data.vulnerabilities.map((v: any, idx: number) => (
                          <div key={idx} className="bg-background/50 border border-border/30 p-3 rounded-xl text-[10px] space-y-1 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-destructive uppercase tracking-wider">{v.severity}</span>
                              <span className="text-muted-foreground font-mono bg-card px-2 py-0.5 rounded-md border border-border/50">{v.path}</span>
                            </div>
                            <p className="text-foreground/80 leading-relaxed">{v.description}</p>
                            <p className="text-chart-2 italic mt-1 font-medium">Fix: {v.recommendation}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-card border border-border/40 p-4 rounded-2xl flex items-center gap-3 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.2),inset_-4px_-4px_8px_rgba(255,255,255,0.02)]">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground italic font-medium">Lead is thinking...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-5 bg-card/80 backdrop-blur-xl border-t border-border/50 z-10">
        <div className="relative flex items-center">
          <input
            type="text"
            className="w-full bg-background/50 border border-border/50 rounded-2xl py-4 pl-5 pr-14 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all shadow-[inset_4px_4px_8px_rgba(0,0,0,0.2),inset_-4px_-4px_8px_rgba(255,255,255,0.02)]"
            placeholder="E.g. SaaS with teams and file ownership..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-3 bg-primary text-primary-foreground rounded-xl transition-all disabled:opacity-50 hover:brightness-110 shadow-[4px_4px_8px_rgba(0,0,0,0.2),-4px_-4px_8px_rgba(255,255,255,0.05)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)]"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 text-center tracking-wide">
          Autonomous Agent verifies all code for vulnerabilities before displaying.
        </p>
      </div>
    </div>
  );
}
