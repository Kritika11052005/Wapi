"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CookieConsent from "@/components/CookieConsent";

export default function Home() {
  const [activeMessage, setActiveMessage] = useState(0);

  // Simple typing simulation for the chat mockup
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveMessage((prev) => (prev < 2 ? prev + 1 : 0));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#021820] text-slate-100 overflow-hidden font-sans">
      {/* ── BACKGROUND GRID & GLOW EFFECTS ── */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.04)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Glowing atmospheric circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] rounded-full bg-emerald-600/15 blur-[150px] pointer-events-none" />
      <div className="absolute top-[30%] right-[15%] w-[450px] h-[450px] rounded-full bg-teal-600/10 blur-[100px] pointer-events-none" />

      {/* ── PERSISTENT TOP NAVIGATION ── */}
      <header className="relative z-50 flex items-center justify-between px-6 py-6 md:px-12">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-xs tracking-widest text-emerald-400 uppercase font-bold">WAPI // NODE-A</span>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/demo" className="text-xs font-mono uppercase tracking-wider text-slate-300 hover:text-white transition duration-200">
            Sandbox
          </Link>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
          <Link href="/auth/signin" className="text-xs font-mono uppercase tracking-wider text-slate-300 hover:text-white transition duration-200">
            Sign In
          </Link>
        </nav>
      </header>

      {/* ── HERO / SPLIT GRID LAYOUT ── */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8 md:px-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

        {/* LEFT COLUMN: TITLE & ACTIONS */}
        <div className="lg:col-span-7 flex flex-col gap-6 text-left">

          {/* AI CRM Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-950/20 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="font-mono text-[10px] md:text-xs font-bold text-cyan-400 tracking-wider uppercase">
              AI-POWERED WHATSAPP CRM
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-white">
            Your inbox, <br />
            but it <span className="text-emerald-400">thinks</span> <br />
            like <span className="text-cyan-400">you.</span>
          </h1>

          {/* Subheading */}
          <p className="text-base md:text-lg text-slate-400 max-w-xl leading-relaxed">
            Auto-answer every enquiry. Rank leads by value. Never miss a ₹8,000 booking again.
          </p>

          {/* Call-to-action buttons */}
          <div className="flex flex-wrap gap-4 mt-2">
            <Link
              href="/auth/signup"
              className="px-6 py-3 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 text-sm font-semibold tracking-wide text-white transition duration-200 shadow-lg shadow-cyan-950/20"
            >
              Get started free
            </Link>
            <Link
              href="/demo"
              className="px-6 py-3 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 text-sm font-semibold tracking-wide text-white transition duration-200 flex items-center gap-2"
            >
              Watch demo <span className="text-[10px]">▶</span>
            </Link>
          </div>

          {/* Stats section */}
          <div className="grid grid-cols-3 gap-6 pt-10 mt-6 border-t border-cyan-500/10 max-w-md">
            <div>
              <div className="text-2xl md:text-3xl font-extrabold text-emerald-400">80%</div>
              <div className="text-xs text-slate-500 font-mono mt-1">auto-handled</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-extrabold text-cyan-400">&lt;2s</div>
              <div className="text-xs text-slate-500 font-mono mt-1">response time</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-extrabold text-white">0</div>
              <div className="text-xs text-slate-500 font-mono mt-1">missed leads</div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: SIMULATORS & MOCKUPS */}
        <div className="lg:col-span-5 flex flex-col gap-6 w-full max-w-md mx-auto lg:mx-0">

          {/* Mockup Card 1: WhatsApp Chat */}
          <div className="bg-[#0b1013] border border-white/10 rounded-2xl p-5 shadow-2xl shadow-cyan-950/40 relative overflow-hidden">
            {/* Header info */}
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <div className="w-10 h-10 rounded-full bg-cyan-950 flex items-center justify-center border border-cyan-500/20">
                <span className="font-mono text-xs font-bold text-emerald-400">PS</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-none">Priya&apos;s Salon</h3>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-mono">online</span>
                </div>
              </div>
            </div>

            {/* Chat Body messages */}
            <div className="flex flex-col gap-4 py-4 min-h-[190px] justify-end">
              {/* Message 1: Customer */}
              <div className="bg-[#1e2528] rounded-xl rounded-tl-none p-3 max-w-[85%] self-start border border-white/5 transition duration-500">
                <p className="text-xs md:text-sm text-slate-200">
                  hi, what&apos;s the price for a bridal package?
                </p>
              </div>

              {/* Message 2: AI reply */}
              {activeMessage >= 1 && (
                <div className="flex flex-col gap-1.5 self-end items-end max-w-[85%] animate-in fade-in slide-in-from-bottom-3 duration-500">
                  <div className="bg-[#084f64] text-white rounded-xl rounded-tr-none p-3 border border-cyan-500/20">
                    <p className="text-xs md:text-sm">
                      Our bridal package starts at ₹8,500 — includes makeup, hair styling & draping. Want to book a slot?
                    </p>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                    ✦ AI replied - 1.2s
                  </span>
                </div>
              )}

              {/* Message 3: Customer response */}
              {activeMessage >= 2 && (
                <div className="bg-[#1e2528] rounded-xl rounded-tl-none p-3 max-w-[85%] self-start border border-white/5 animate-in fade-in slide-in-from-bottom-3 duration-500">
                  <p className="text-xs md:text-sm text-slate-200">
                    yes Saturday works!
                  </p>
                </div>
              )}
            </div>

            {/* Simulated chat bottom input */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              </div>
              <span className="text-[10px] text-slate-600 font-mono">Simulating thread...</span>
            </div>
          </div>

          {/* Mockup Card 2: Priority Queue Dashboard */}
          <div className="bg-[#0b1013] border border-white/10 rounded-2xl p-5 shadow-2xl shadow-cyan-950/40 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-mono tracking-widest text-slate-400 font-bold uppercase">
                PRIORITY QUEUE
              </h4>
              <span className="text-[9px] font-mono bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20">
                LIVE
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {/* Row 1 */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition duration-200">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <div>
                    <div className="text-xs font-mono text-white font-bold">+91 98765 *****</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">bridal package Saturday...</div>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-400">₹8.5k</span>
              </div>

              {/* Row 2 */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition duration-200">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div>
                    <div className="text-xs font-mono text-white font-bold">+91 87654 *****</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">keratin or hair spa?</div>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-400">₹4.5k</span>
              </div>

              {/* Row 3 */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition duration-200">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <div>
                    <div className="text-xs font-mono text-white font-bold">+91 76543 *****</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">slot for cleanup tmrw</div>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-400">₹500</span>
              </div>
            </div>

            {/* Red Alert Banner Box */}
            <div className="border border-red-500/20 bg-red-950/10 rounded-lg p-3 flex items-center gap-2.5">
              <span className="text-red-400 text-xs flex-shrink-0">⚠️</span>
              <p className="text-[11px] md:text-xs text-red-400 leading-normal font-medium">
                Lead gone quiet 2h — draft follow-up ready
              </p>
            </div>
          </div>

        </div>

      </main>

      {/* ── Cookie Consent overlay ── */}
      <CookieConsent />
    </div>
  );
}
