"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/client";
import { Sparkles, Loader2, AlertCircle, AlertTriangle } from "lucide-react";

export default function SignUp() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !password || !confirmPassword) {
      setErrorMsg("All fields are required.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccess(true);
        // Delay redirect to allow user to see confirmation message
        setTimeout(() => {
          router.push("/onboarding/profile");
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during signup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-950/20 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Branding header */}
        <div className="flex flex-col items-center gap-2 mb-8 text-center">
          <div className="relative group mb-2">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg blur opacity-70 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative bg-slate-950 p-2.5 rounded-lg">
              <Image 
                src="/logo.png" 
                alt="Wapi Logo" 
                width={40} 
                height={40} 
                className="rounded-md"
              />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
            Create your Wapi account
          </h1>
          <p className="text-sm text-slate-400">
            Automate WhatsApp CRM for your business in 5 minutes
          </p>
        </div>

        {/* Form panel */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-900 rounded-2xl p-8 shadow-2xl">
          {/* Phase 2 Under Construction Banner */}
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col gap-1.5 text-amber-300 text-sm">
            <div className="flex items-center gap-2 font-semibold text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse" />
              <span>Phase 2 Under Construction</span>
            </div>
            <p className="text-xs text-slate-400 pl-7 leading-relaxed">
              Authentication services are undergoing maintenance for Phase 2. Access might be restricted or display placeholder data.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-400 text-sm">
              <Sparkles className="w-5 h-5 shrink-0" />
              <span>Account created successfully! Redirecting...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                disabled={loading || success}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-900 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                disabled={loading || success}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-900 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                disabled={loading || success}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retype password"
                className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-900 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="mt-2 w-full h-12 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Get Started Free <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Redirect toggle */}
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/auth/signin" className="font-semibold text-emerald-400 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
