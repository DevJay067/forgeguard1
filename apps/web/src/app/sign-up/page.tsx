"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Lock, User, Terminal, Globe, Loader2, AlertCircle } from "lucide-react";
import { Component as GridBackground } from "@/components/ui/grid-background";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase/config";

export default function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push("/orchestration");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please sign in instead.");
      } else if (err.code === "auth/weak-password") {
        setError("Your password is too weak. Please use at least 6 characters.");
      } else {
        setError("Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSignIn = async (provider: GoogleAuthProvider | GithubAuthProvider) => {
    try {
      await signInWithPopup(auth, provider);
      router.push("/orchestration");
    } catch (err: any) {
      console.error(err);
      setError(`Failed to sign up with provider: ${err.message}`);
    }
  };

  return (
    <GridBackground variant="dots" className="flex min-h-screen w-full flex-col font-sans selection:bg-rose-500/30">
      {/* Intense Premium Glows */}
      <div className="absolute top-[10%] right-[10%] w-[600px] h-[400px] bg-rose-500/10 dark:bg-rose-500/20 blur-[120px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
      <div className="absolute bottom-[10%] left-[10%] w-[500px] h-[300px] bg-indigo-500/10 dark:bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
      
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 w-full max-w-7xl mx-auto">
        <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-zinc-500 dark:text-white/50 hover:text-zinc-900 dark:hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* Outer Gradient Border Wrapper */}
          <div className="relative p-[1px] rounded-[2.5rem] bg-gradient-to-b from-black/5 via-black/5 to-transparent dark:from-white/20 dark:via-white/5 dark:to-transparent shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] group overflow-visible">
            
            {/* Animated Hover Glow behind the card */}
            <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 via-rose-500 to-orange-500 opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 blur-2xl transition-opacity duration-1000 pointer-events-none rounded-[3rem]" />

            <div className="bg-white/70 dark:bg-zinc-950/80 backdrop-blur-3xl rounded-[calc(2.5rem-1px)] p-8 md:p-10 relative overflow-hidden h-full border-t border-white dark:border-white/5">
              
              {/* Internal Noise Texture */}
              <div 
                className="absolute inset-0 z-0 pointer-events-none opacity-[0.02] dark:opacity-[0.03] mix-blend-overlay"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
              />
              
              <div className="relative z-10">
                <div className="text-center mb-10">
                  <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-zinc-100/50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 mb-6 shadow-inner relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tl from-indigo-500/10 to-orange-500/10 dark:from-indigo-500/20 dark:to-orange-500/20 opacity-50" />
                    <User className="w-6 h-6 text-zinc-700 dark:text-white relative z-10" />
                  </div>
                  <h1 className="text-3xl font-extrabold tracking-tighter text-zinc-900 dark:text-white mb-2 drop-shadow-sm">Create account</h1>
                  <p className="text-sm text-zinc-500 dark:text-white/50 font-medium">Join ForgeGuard and secure your Firebase</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <button 
                    onClick={() => handleProviderSignIn(new GithubAuthProvider())}
                    type="button"
                    className="flex items-center justify-center h-12 rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-800 dark:text-white/80 hover:text-black dark:hover:text-white text-sm font-semibold transition-all duration-300 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-inner hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] group/btn"
                  >
                    <svg className="w-5 h-5 mr-2 text-black dark:text-white transition-transform group-hover/btn:scale-110" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                    </svg> GitHub
                  </button>
                  <button 
                    onClick={() => handleProviderSignIn(new GoogleAuthProvider())}
                    type="button"
                    className="flex items-center justify-center h-12 rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white hover:bg-zinc-50 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-white/80 hover:text-zinc-900 dark:hover:text-white text-sm font-semibold transition-all duration-300 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-inner hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_0_20px_rgba(66,133,244,0.15)] group/btn"
                  >
                    <svg className="w-5 h-5 mr-2 transition-transform group-hover/btn:scale-110" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg> Google
                  </button>
                </div>

                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-200 dark:border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                    <span className="bg-white/90 dark:bg-zinc-950 px-4 text-zinc-400 dark:text-white/30 backdrop-blur-md rounded-full py-0.5">Or register with</span>
                  </div>
                </div>

                {error && (
                  <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-in fade-in zoom-in-95 duration-300">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2 relative group/input">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-rose-500/10 dark:from-orange-500/20 dark:to-rose-500/20 rounded-2xl blur-md opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500" />
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-white/30 group-focus-within/input:text-zinc-700 dark:group-focus-within/input:text-white/70 transition-colors" />
                      <input 
                        type="text" 
                        required
                        placeholder="Full Name" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 rounded-2xl bg-zinc-50/80 dark:bg-black/40 border border-zinc-200/80 dark:border-white/10 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:focus:ring-1 dark:focus:ring-white/30 focus:border-orange-500/30 dark:focus:border-white/30 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] placeholder:text-zinc-400 dark:placeholder:text-white/20 relative z-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 relative group/input">
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-indigo-500/10 dark:from-rose-500/20 dark:to-indigo-500/20 rounded-2xl blur-md opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500" />
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-white/30 group-focus-within/input:text-zinc-700 dark:group-focus-within/input:text-white/70 transition-colors" />
                      <input 
                        type="email" 
                        required
                        placeholder="name@example.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 rounded-2xl bg-zinc-50/80 dark:bg-black/40 border border-zinc-200/80 dark:border-white/10 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:focus:ring-1 dark:focus:ring-white/30 focus:border-rose-500/30 dark:focus:border-white/30 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] placeholder:text-zinc-400 dark:placeholder:text-white/20 relative z-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 relative group/input">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-orange-500/10 dark:from-indigo-500/20 dark:to-orange-500/20 rounded-2xl blur-md opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500" />
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-white/30 group-focus-within/input:text-zinc-700 dark:group-focus-within/input:text-white/70 transition-colors" />
                      <input 
                        type="password" 
                        required
                        placeholder="Create a password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 rounded-2xl bg-zinc-50/80 dark:bg-black/40 border border-zinc-200/80 dark:border-white/10 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-1 dark:focus:ring-white/30 focus:border-indigo-500/30 dark:focus:border-white/30 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] placeholder:text-zinc-400 dark:placeholder:text-white/20 relative z-10"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-12 mt-6 rounded-2xl bg-gradient-to-r from-indigo-500 via-rose-500 to-orange-500 text-white font-bold tracking-wide shadow-[0_10px_20px_-10px_rgba(99,102,241,0.5)] dark:shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_15px_25px_-10px_rgba(99,102,241,0.6)] dark:hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] hover:scale-[1.02] transition-all duration-300 group overflow-hidden relative flex items-center justify-center border border-white/20 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]" />
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                  </button>
                </form>

                <div className="mt-8 text-center text-sm text-zinc-500 dark:text-white/40 font-medium">
                  Already have an account?{" "}
                  <Link href="/sign-in" className="text-zinc-900 dark:text-white hover:text-indigo-500 dark:hover:text-indigo-400 font-bold hover:underline decoration-zinc-300 dark:decoration-white/30 underline-offset-4 transition-colors">
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </GridBackground>
  );
}
