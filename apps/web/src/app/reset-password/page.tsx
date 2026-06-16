"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Lock, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Component as GridBackground } from "@/components/ui/grid-background";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "@/lib/firebase/config";

function ResetPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!oobCode) {
      setError("Invalid or missing password reset code. Please request a new link.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-action-code" || err.code === "auth/expired-action-code") {
        setError("This reset link has expired or been used. Please request a new one.");
      } else {
        setError("Failed to reset password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!oobCode && !error) {
    // We can show an immediate error if there's no code in the URL
    return (
      <div className="text-center">
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex flex-col items-center gap-3">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <h2 className="text-lg font-bold text-red-600 dark:text-red-400">Invalid Link</h2>
          <p className="text-sm text-red-600/80 dark:text-red-400/80 font-medium">This password reset link is invalid or missing the verification code. Please request a new link from the sign in page.</p>
        </div>
        <Link 
          href="/forgot-password"
          className="inline-flex items-center justify-center h-12 px-6 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold transition-transform hover:scale-105"
        >
          Request New Link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-emerald-500/10 mb-6">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Password Reset Complete!</h2>
        <p className="text-zinc-500 dark:text-white/60 mb-8">Your password has been successfully updated. You can now sign in with your new password.</p>
        <Link 
          href="/sign-in"
          className="inline-flex items-center justify-center w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 text-white font-bold tracking-wide shadow-[0_10px_20px_-10px_rgba(16,185,129,0.5)] hover:shadow-[0_15px_25px_-10px_rgba(16,185,129,0.6)] hover:scale-[1.02] transition-all duration-300"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-zinc-100/50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 mb-6 shadow-inner relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-indigo-500/10 dark:from-emerald-500/20 dark:to-indigo-500/20 opacity-50" />
          <Lock className="w-6 h-6 text-zinc-700 dark:text-white relative z-10" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tighter text-zinc-900 dark:text-white mb-2 drop-shadow-sm">Choose a New Password</h1>
        <p className="text-sm text-zinc-500 dark:text-white/50 font-medium">Create a new, strong password for your account.</p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-in fade-in zoom-in-95 duration-300">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2 relative group/input">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 rounded-2xl blur-md opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500" />
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-white/30 group-focus-within/input:text-zinc-700 dark:group-focus-within/input:text-white/70 transition-colors" />
            <input 
              type="password" 
              required
              placeholder="New password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-2xl bg-zinc-50/80 dark:bg-black/40 border border-zinc-200/80 dark:border-white/10 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-1 dark:focus:ring-white/30 focus:border-emerald-500/30 dark:focus:border-white/30 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] placeholder:text-zinc-400 dark:placeholder:text-white/20 relative z-10"
            />
          </div>
        </div>

        <div className="space-y-2 relative group/input">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 rounded-2xl blur-md opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500" />
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-white/30 group-focus-within/input:text-zinc-700 dark:group-focus-within/input:text-white/70 transition-colors" />
            <input 
              type="password" 
              required
              placeholder="Confirm new password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-2xl bg-zinc-50/80 dark:bg-black/40 border border-zinc-200/80 dark:border-white/10 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-1 dark:focus:ring-white/30 focus:border-emerald-500/30 dark:focus:border-white/30 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] placeholder:text-zinc-400 dark:placeholder:text-white/20 relative z-10"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full h-12 mt-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 text-white font-bold tracking-wide shadow-[0_10px_20px_-10px_rgba(16,185,129,0.5)] dark:shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_25px_-10px_rgba(16,185,129,0.6)] dark:hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] hover:scale-[1.02] transition-all duration-300 group overflow-hidden relative flex items-center justify-center border border-white/20 disabled:opacity-50 disabled:hover:scale-100"
        >
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]" />
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reset Password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <GridBackground variant="dots" className="flex min-h-screen w-full flex-col font-sans selection:bg-rose-500/30">
      {/* Intense Premium Glows */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-500/10 dark:bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
      <div className="absolute bottom-[10%] left-[20%] w-[500px] h-[300px] bg-emerald-500/10 dark:bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
      
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 w-full max-w-7xl mx-auto">
        <Link href="/sign-in" className="absolute top-8 left-8 flex items-center gap-2 text-zinc-500 dark:text-white/50 hover:text-zinc-900 dark:hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>

        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* Outer Gradient Border Wrapper */}
          <div className="relative p-[1px] rounded-[2.5rem] bg-gradient-to-b from-black/5 via-black/5 to-transparent dark:from-white/20 dark:via-white/5 dark:to-transparent shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] group overflow-visible">
            
            {/* Animated Hover Glow behind the card */}
            <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 blur-2xl transition-opacity duration-1000 pointer-events-none rounded-[3rem]" />

            <div className="bg-white/70 dark:bg-zinc-950/80 backdrop-blur-3xl rounded-[calc(2.5rem-1px)] p-8 md:p-10 relative overflow-hidden h-full border-t border-white dark:border-white/5">
              
              {/* Internal Noise Texture */}
              <div 
                className="absolute inset-0 z-0 pointer-events-none opacity-[0.02] dark:opacity-[0.03] mix-blend-overlay"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
              />
              
              <div className="relative z-10">
                <Suspense fallback={
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
                    <p className="text-zinc-500 dark:text-white/50 font-medium">Verifying reset link...</p>
                  </div>
                }>
                  <ResetPasswordForm />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </main>
    </GridBackground>
  );
}
