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
  
  const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash");
  
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
    setSteps([{ title: "Initialization", content: `Connecting to ForgeGuard Orchestrator (${orchestrationMode} mode)...` }]);
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
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", tier: "Free" },
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", tier: "Free" },
    { id: "google/gemma-4-31b-it:free", name: "Gemma 4 31B (OpenRouter)", tier: "Free" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", tier: "Pro" },
  ];

  // ── Computed values for the UI ──
  const beforeScore = result?.beforeAudit?.score;
  const afterScore = result?.afterAudit?.score ?? result?.audit?.score;
  const isImproveResult = result?.mode === "improve";
  const improvements = result?.improvements || [];
  const displayRules = rulesView === "before" && result?.beforeRules 
    ? result.beforeRules 
    : (result?.afterRules || result?.rules);
  const canDeploy = result && (afterScore !== undefined && afterScore <= 20);

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
              <div className="flex-1 bg-background/40 backdrop-blur-sm rounded-[2.5rem] p-4 shadow-[8px_8px_16px_rgba(0,0,0,0.3),-8px_-8px_16px_rgba(255,255,255,0.02)] flex flex-col relative group border border-border/20">
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
                <pre className="flex-1 p-6 text-sm overflow-auto text-primary font-mono custom-scrollbar bg-card rounded-3xl shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.02)] border border-transparent">
                  {displayRules || "// The generated rules will appear here..."}
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
                          <p className={`text-3xl font-extrabold ${beforeScore <= 10 ? 'text-chart-2' : beforeScore <= 30 ? 'text-yellow-500' : 'text-destructive'}`}>
                            {beforeScore}
                          </p>
                          <p className="text-[10px] text-muted-foreground">/100</p>
                        </div>
                        
                        <ArrowRight className="w-6 h-6 text-emerald-500 shrink-0" />
                        
                        {/* After Score */}
                        <div className="text-center flex-1">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">After</p>
                          <p className={`text-3xl font-extrabold ${afterScore <= 10 ? 'text-chart-2' : afterScore <= 30 ? 'text-yellow-500' : 'text-destructive'}`}>
                            {afterScore}
                          </p>
                          <p className="text-[10px] text-muted-foreground">/100</p>
                        </div>
                      </div>
                      
                      {/* Improvement badge */}
                      {result.scoreImprovement > 0 && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2 flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold">
                          <TrendingDown className="w-3.5 h-3.5" />
                          ↓ {Math.round((result.scoreImprovement / beforeScore) * 100)}% risk reduction
                          <span className="text-muted-foreground font-normal">({result.vulnerabilitiesFixed} vulns fixed)</span>
                        </div>
                      )}
                      
                      {afterScore <= 10 && (
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
                          <span className="text-xs text-muted-foreground uppercase tracking-wider">Risk Score</span>
                          <span className={`text-2xl font-bold ${result.audit.score <= 10 ? 'text-chart-2' : 'text-destructive'}`}>
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
                          
                          {afterScore !== undefined && afterScore > 20 && (
                            <p className="text-[10px] text-destructive/80 mt-2 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Score too high ({afterScore}/100). Consider improving further before deploying to production.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
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
