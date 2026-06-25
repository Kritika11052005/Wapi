"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CookieConsent from "@/components/CookieConsent";

export default function Home() {
  // Stats count up animation states
  const [stats, setStats] = useState({
    autoHandled: 0,
    responseTime: 10,
    missedLeads: 25,
  });

  // Typing simulation state for the phone mockup
  const [chatStep, setChatStep] = useState(0);

  useEffect(() => {
    // Stat count up logic
    const statTimer = setInterval(() => {
      setStats((prev) => {
        const nextAuto = Math.min(80, prev.autoHandled + 2);
        const nextTime = Math.max(2, prev.responseTime - 0.4);
        const nextMissed = Math.max(0, prev.missedLeads - 1);

        if (nextAuto === 80 && nextTime === 2 && nextMissed === 0) {
          clearInterval(statTimer);
        }
        return {
          autoHandled: nextAuto,
          responseTime: parseFloat(nextTime.toFixed(1)),
          missedLeads: nextMissed,
        };
      });
    }, 45);

    return () => clearInterval(statTimer);
  }, []);

  useEffect(() => {
    // Phone mockup message simulation sequence (toggles customer message and AI reply)
    const sequence = [
      { step: 0, delay: 0 },       // Initial state (customer 1st message)
      { step: 1, delay: 1500 },    // AI replies
    ];

    let timers: NodeJS.Timeout[] = [];

    const startSequence = () => {
      sequence.forEach((item) => {
        const timer = setTimeout(() => {
          setChatStep(item.step);
        }, item.delay);
        timers.push(timer);
      });
    };

    startSequence();
    const interval = setInterval(() => {
      timers.forEach(clearTimeout);
      timers = [];
      startSequence();
    }, 6000);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-wapi-canvas text-slate-100 overflow-hidden font-inter select-none">

      {/* ── BACKGROUND GRID & GLOW EFFECTS ── */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,rgba(0,180,216,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,180,216,0.07)_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none" />

      {/* Atmospheric blurred glow orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[650px] h-[650px] rounded-full bg-wapi-cyan/15 blur-[120px] pointer-events-none animate-orb-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[750px] h-[750px] rounded-full bg-wapi-lime/12 blur-[150px] pointer-events-none animate-orb-pulse" style={{ animationDelay: "2s" }} />
      <div className="absolute top-[25%] left-[-15%] w-[550px] h-[550px] rounded-full bg-wapi-teal/12 blur-[130px] pointer-events-none animate-orb-pulse" style={{ animationDelay: "1s" }} />

      {/* ── SECTION 1: HEADER NAVIGATION ── */}
      <header className="relative z-50 flex items-center justify-between px-6 py-6 md:px-16 max-w-7xl mx-auto">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative bg-wapi-cyan w-9 h-7 rounded-lg flex items-center justify-center transition-all group-hover:scale-105 duration-200">
            <span className="font-bold text-wapi-canvas tracking-tighter text-sm font-space">···</span>
          </div>
          <span className="font-space text-lg font-bold text-white tracking-widest uppercase">wapi</span>
        </Link>

        {/* Navigation links & CTA */}
        <nav className="flex items-center gap-6 md:gap-10">
          <Link href="#features" className="text-xs font-space uppercase tracking-wider text-wapi-mint hover:text-white transition duration-150">
            Features
          </Link>
          <Link href="#about" className="text-xs font-space uppercase tracking-wider text-wapi-mint hover:text-white transition duration-150">
            About
          </Link>
          <Link href="#roadmap" className="text-xs font-space uppercase tracking-wider text-wapi-mint hover:text-white transition duration-150">
            Roadmap
          </Link>
          <span className="hidden sm:inline w-1.5 h-1.5 rounded-full bg-wapi-cyan/30" />
          <Link
            href="/auth/signin"
            className="hidden sm:inline text-xs font-space uppercase tracking-wider text-slate-300 hover:text-white transition duration-150"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-wapi-cyan to-wapi-teal text-xs font-space font-bold uppercase tracking-wider text-wapi-canvas hover:scale-102 hover:brightness-110 transition duration-150"
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* ── MAIN MARKETING SURFACE ── */}
      <main className="relative z-10">

        {/* ── HERO SECTION ── */}
        <section className="max-w-7xl mx-auto px-6 py-12 md:px-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-center min-h-[calc(100vh-80px)]">
          {/* Left Hero text and specs */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-wapi-cyan/20 bg-wapi-cyan/5 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-wapi-lime animate-pulse" />
              <span className="font-space text-[10px] md:text-xs text-wapi-mint tracking-wider">
                ✦ AI-Powered WhatsApp CRM
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-clash tracking-tight leading-[1.08] text-white">
              Your inbox, <br />
              but it <span className="text-wapi-lime">thinks</span> <br />
              like <span className="text-wapi-cyan">you.</span>
            </h1>

            <p className="text-lg md:text-xl text-wapi-mint max-w-xl leading-relaxed font-inter font-normal">
              Auto-answer every enquiry. Rank leads by value. <br />
              Never miss a ₹8,000 booking again.
            </p>

            <div className="flex flex-wrap gap-4 mt-2">
              <Link
                href="/auth/signup"
                className="px-7 py-3.5 rounded-lg bg-gradient-to-r from-wapi-cyan to-wapi-teal text-sm font-space font-bold uppercase tracking-wider text-wapi-canvas shadow-lg shadow-wapi-cyan/10 hover:scale-102 hover:brightness-110 transition duration-150"
              >
                Get Started Free →
              </Link>
              <Link
                href="/demo"
                className="px-7 py-3.5 rounded-lg border border-wapi-cyan/35 bg-transparent text-sm font-space font-bold uppercase tracking-wider text-wapi-mint hover:scale-102 hover:bg-wapi-cyan/5 transition duration-150"
              >
                Watch Demo ▶
              </Link>
            </div>

            {/* Stats section */}
            <div className="grid grid-cols-3 gap-6 pt-10 mt-6 border-t border-wapi-cyan/10 max-w-md">
              <div>
                <div className="text-3xl md:text-4xl font-clash text-white">{stats.autoHandled}%</div>
                <div className="text-xs text-wapi-mint font-space mt-1 uppercase tracking-wider">auto-handled</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-clash text-white">&lt;{stats.responseTime}s</div>
                <div className="text-xs text-wapi-mint font-space mt-1 uppercase tracking-wider">response time</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-clash text-white">{stats.missedLeads}</div>
                <div className="text-xs text-wapi-mint font-space mt-1 uppercase tracking-wider">missed leads</div>
              </div>
            </div>
          </div>

          {/* Right Hero mockup and priority queue — floating layered composition */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto lg:mx-0 relative min-h-[580px] md:min-h-[640px] flex items-center justify-center">

            {/* Phone Chassis Mockup */}
            <div className="absolute top-4 right-2 w-[280px] sm:w-[310px] aspect-[9/18.5] bg-[#121c24] rounded-[48px] p-2.5 shadow-[0_25px_60px_-12px_rgba(0,0,0,0.5),0_0_40px_rgba(0,180,216,0.08)] border border-[#233545] transform-gpu animate-hero-phone z-10" style={{ transformStyle: 'preserve-3d' }}>
              {/* Top notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-[#121c24] rounded-b-xl z-20 flex items-center justify-center">
                <div className="w-12 h-1 bg-[#1a2936] rounded-full" />
              </div>

              {/* Screen Content */}
              <div className="relative w-full h-full bg-[#0b1216] rounded-[38px] overflow-hidden border border-[#1a2936] p-4 pt-7 flex flex-col justify-between">
                {/* Phone Header */}
                <div className="flex items-center gap-3 pb-3.5 border-b border-slate-900/60">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00b4d8] to-[#57cc99] flex-shrink-0" />
                  <div>
                    <h3 className="text-xs font-bold text-white font-inter">Glow Salon</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="w-1 h-1 rounded-full bg-[#57cc99] animate-pulse" />
                      <span className="text-[9px] text-[#57cc99] font-space font-medium">online · AI assisting</span>
                    </div>
                  </div>
                </div>

                {/* Chat messages area */}
                <div className="flex flex-col gap-3.5 pt-5 pb-2 flex-grow justify-start">
                  {/* 1st message: Customer query */}
                  <div className="bg-[#182229] rounded-2xl rounded-tl-sm p-3 max-w-[85%] self-start border border-[#22313d]/30 transition-opacity duration-300">
                    <p className="text-[11px] sm:text-xs text-slate-200 font-inter leading-relaxed">
                      hi, what&apos;s the price for a bridal package?
                    </p>
                  </div>

                  {/* 2nd message: AI reply */}
                  {chatStep >= 1 && (
                    <div className="flex flex-col gap-1.5 self-end items-end max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="bg-[#1d8a7a] text-slate-100 rounded-2xl rounded-tr-sm p-3 border border-[#2da795]/20">
                        <p className="text-[11px] sm:text-xs font-inter leading-relaxed">
                          Our bridal package starts at ₹8,500 — includes makeup, hair styling &amp; draping. Want to book a slot? 😊
                        </p>
                      </div>
                      <span className="text-[9px] text-[#57cc99] font-space font-bold uppercase tracking-wider mt-0.5">
                        ✦ AI replied · 1.2s
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Live Dashboard Priority Queue card — overlapping the bottom-left */}
            <div className="absolute bottom-6 left-0 w-[270px] sm:w-[290px] z-20 bg-[#0c1c28]/95 backdrop-blur-md border border-wapi-cyan/20 rounded-2xl p-4 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.6),0_0_30px_rgba(0,180,216,0.05)] flex flex-col gap-3 transform-gpu animate-hero-queue" style={{ transformStyle: 'preserve-3d' }}>
              <div className="flex items-center justify-between">
                <h4 className="text-[9px] font-space tracking-wider text-[#94a3b8] font-bold uppercase">
                  Priority Queue
                </h4>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#57cc99] animate-pulse" />
                  <span className="text-[9px] font-space text-[#57cc99] font-bold uppercase tracking-wider">
                    live
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {/* Row 1 */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#0b1216]/60 border border-[#1a2936]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-wapi-coral" />
                    <div>
                      <div className="text-[10px] font-space font-bold text-white tracking-wide">+91 98•••3421</div>
                      <div className="text-[8px] text-[#94a3b8] mt-0.5">bridal package Saturday?</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-space font-bold text-[#57cc99]">₹8,500</span>
                </div>

                {/* Row 2 */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#0b1216]/60 border border-[#1a2936]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-wapi-amber" />
                    <div>
                      <div className="text-[10px] font-space font-bold text-white tracking-wide">+91 76•••8810</div>
                      <div className="text-[8px] text-[#94a3b8] mt-0.5">what time u open tmrw</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-space font-bold text-[#57cc99]">₹2,200</span>
                </div>

                {/* Row 3 */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#0b1216]/60 border border-[#1a2936]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#57cc99]" />
                    <div>
                      <div className="text-[10px] font-space font-bold text-white tracking-wide">+91 90•••1147</div>
                      <div className="text-[8px] text-[#94a3b8] mt-0.5">thanks done!</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-space font-bold text-[#57cc99]">₹500</span>
                </div>
              </div>

              {/* Red alert follow up strip */}
              <div className="border border-[#b45309]/30 bg-[#b45309]/5 rounded-xl p-2.5 flex items-center gap-2">
                <span className="text-xs">⚠️</span>
                <p className="text-[9px] text-[#f59e0b] font-medium leading-normal font-inter">
                  Lead gone quiet 2h — follow-up ready
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 2: ABOUT ── */}
        <section id="about" className="bg-wapi-surface-light text-wapi-canvas py-24 px-6 md:px-16 transition-colors duration-200">
          <div className="max-w-7xl mx-auto flex flex-col gap-20">

            {/* 2A: About the Project */}
            <div className="max-w-3xl">
              <span className="text-[11px] font-space uppercase tracking-wider text-wapi-teal font-bold block mb-3">About Wapi</span>
              <h2 className="text-4xl md:text-5xl font-clash tracking-tight text-wapi-canvas mb-6 leading-tight">
                Built for the businesses WhatsApp forgot
              </h2>
              <p className="text-lg text-slate-700 leading-relaxed font-inter font-normal">
                Indian SMBs handle thousands of WhatsApp conversations every week with zero infrastructure. No ranking, no memory, no AI. Just a flat inbox where every message looks the same. Wapi is the intelligence layer that should have always been there.
              </p>
            </div>

            {/* 2B: Why This Project / The Problem */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="bg-wapi-card-bg text-slate-100 rounded-2xl p-7 border border-wapi-cyan/20 hover:scale-102 hover:border-wapi-cyan/40 transition duration-200">
                <span className="text-2xl mb-4 block">🚨</span>
                <h3 className="text-lg font-clash text-white mb-3">Missed leads</h3>
                <p className="text-sm text-wapi-mint leading-relaxed">
                  A ₹8,000 bridal enquiry arrives at 11 PM. By morning it&apos;s buried under 40 messages. The customer already booked elsewhere.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-wapi-card-bg text-slate-100 rounded-2xl p-7 border border-wapi-cyan/20 hover:scale-102 hover:border-wapi-cyan/40 transition duration-200">
                <span className="text-2xl mb-4 block">🔄</span>
                <h3 className="text-lg font-clash text-white mb-3">Repetitive answers</h3>
                <p className="text-sm text-wapi-mint leading-relaxed">
                  The owner types &quot;our haircut starts at ₹500&quot; 20 times a day. Every single day.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-wapi-card-bg text-slate-100 rounded-2xl p-7 border border-wapi-cyan/20 hover:scale-102 hover:border-wapi-cyan/40 transition duration-200">
                <span className="text-2xl mb-4 block">⚖️</span>
                <h3 className="text-lg font-clash text-white mb-3">No prioritisation</h3>
                <p className="text-sm text-wapi-mint leading-relaxed">
                  A ₹200 enquiry and a ₹10,000 booking look identical in the inbox. There is no way to know who to reply to first.
                </p>
              </div>
            </div>

            {/* 2C: Target Users / Personas */}
            <div>
              <span className="text-[11px] font-space uppercase tracking-wider text-wapi-teal font-bold block mb-3">Made for the real India</span>
              <h2 className="text-3xl font-clash text-wapi-canvas mb-10">Target Users</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Persona 1 */}
                <div className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">💄</span>
                    <div>
                      <h4 className="text-base font-bold text-wapi-canvas leading-tight">Priya, 32</h4>
                      <p className="text-xs text-wapi-teal font-semibold font-space uppercase tracking-wider mt-1">Pune · Beauty salon owner</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Gets 50+ messages/day. Misses 20% of them.
                  </p>
                </div>

                {/* Persona 2 */}
                <div className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🏥</span>
                    <div>
                      <h4 className="text-base font-bold text-wapi-canvas leading-tight">Rahul, 41</h4>
                      <p className="text-xs text-wapi-teal font-semibold font-space uppercase tracking-wider mt-1">Bengaluru · Physiotherapy clinic</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Types the same prices 30 times a day.
                  </p>
                </div>

                {/* Persona 3 */}
                <div className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">📚</span>
                    <div>
                      <h4 className="text-base font-bold text-wapi-canvas leading-tight">Meena, 28</h4>
                      <p className="text-xs text-wapi-teal font-semibold font-space uppercase tracking-wider mt-1">Delhi · Home tuitions</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Loses track of which parent enquired and which enrolled.
                  </p>
                </div>
              </div>
            </div>

            {/* 2D: Competitor Comparison Table */}
            <div>
              <span className="text-[11px] font-space uppercase tracking-wider text-wapi-teal font-bold block mb-3">Why Better Than Competitors</span>
              <h2 className="text-3xl font-clash text-wapi-canvas mb-8">WATI gives you a chatbot. Wapi gives you a brain.</h2>

              <div className="overflow-x-auto rounded-2xl border border-wapi-cyan/20">
                <table className="w-full text-left border-collapse bg-wapi-card-bg text-slate-100">
                  <thead>
                    <tr className="border-b border-wapi-cyan/20 bg-wapi-canvas/60">
                      <th className="p-5 text-xs font-space uppercase tracking-wider text-slate-400">Capability</th>
                      <th className="p-5 text-xs font-space uppercase tracking-wider text-slate-400 text-center">WATI / AiSensy / Gallabox</th>
                      <th className="p-5 text-xs font-space uppercase tracking-wider text-wapi-cyan text-center">Wapi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-wapi-canvas/30 hover:bg-wapi-canvas/20">
                      <td className="p-5 text-sm font-medium font-inter">Reads your actual documents</td>
                      <td className="p-5 text-center text-rose-500 font-bold">❌</td>
                      <td className="p-5 text-center text-wapi-lime font-bold">✅</td>
                    </tr>
                    <tr className="border-b border-wapi-canvas/30 hover:bg-wapi-canvas/20">
                      <td className="p-5 text-sm font-medium font-inter">Reasons over real questions</td>
                      <td className="p-5 text-center text-rose-500 font-bold">❌</td>
                      <td className="p-5 text-center text-wapi-lime font-bold">✅</td>
                    </tr>
                    <tr className="border-b border-wapi-canvas/30 hover:bg-wapi-canvas/20">
                      <td className="p-5 text-sm font-medium font-inter">Priority queue by lead value</td>
                      <td className="p-5 text-center text-rose-500 font-bold">❌</td>
                      <td className="p-5 text-center text-wapi-lime font-bold">✅</td>
                    </tr>
                    <tr className="border-b border-wapi-canvas/30 hover:bg-wapi-canvas/20">
                      <td className="p-5 text-sm font-medium font-inter">Stale lead auto-nudge</td>
                      <td className="p-5 text-center text-rose-500 font-bold">❌</td>
                      <td className="p-5 text-center text-wapi-lime font-bold">✅</td>
                    </tr>
                    <tr className="border-b border-wapi-canvas/30 hover:bg-wapi-canvas/20">
                      <td className="p-5 text-sm font-medium font-inter">Multilingual abuse protection</td>
                      <td className="p-5 text-center text-rose-500 font-bold">❌</td>
                      <td className="p-5 text-center text-wapi-lime font-bold">✅</td>
                    </tr>
                    <tr className="hover:bg-wapi-canvas/20">
                      <td className="p-5 text-sm font-medium font-inter">Owner disturbed by trolls</td>
                      <td className="p-5 text-center text-rose-500 font-bold">❌ Always</td>
                      <td className="p-5 text-center text-wapi-lime font-bold">✅ Never</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </section>

        {/* ── SECTION 3: FEATURES ── */}
        <section id="features" className="py-24 px-6 md:px-16 bg-wapi-canvas">
          <div className="max-w-7xl mx-auto flex flex-col gap-16">
            <div className="max-w-2xl">
              <span className="text-[11px] font-space uppercase tracking-wider text-wapi-cyan font-bold block mb-3">Features</span>
              <h2 className="text-4xl font-clash tracking-tight text-white mb-4">
                Engineered for maximum lead conversion
              </h2>
              <p className="text-base text-wapi-mint leading-relaxed">
                Wapi connects directly to your WhatsApp Business number and integrates live RAG and scoring rules to deliver full-scale business automation.
              </p>
            </div>

            {/* 3x2 Grid of Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-wapi-card-bg rounded-2xl p-8 border border-wapi-cyan/20 hover:-translate-y-1 hover:border-wapi-cyan/40 hover:shadow-[0_0_20px_rgba(0,180,216,0.1)] transition duration-200">
                <span className="text-2xl mb-4 block">📄</span>
                <h3 className="text-lg font-clash text-white mb-3">Document Intelligence</h3>
                <p className="text-sm text-wapi-mint leading-relaxed">
                  Upload your services and pricing once. The AI reads, understands, and reasons over them — not pre-programmed responses.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-wapi-card-bg rounded-2xl p-8 border border-wapi-cyan/20 hover:-translate-y-1 hover:border-wapi-cyan/40 hover:shadow-[0_0_20px_rgba(0,180,216,0.1)] transition duration-200">
                <span className="text-2xl mb-4 block">🎯</span>
                <h3 className="text-lg font-clash text-white mb-3">Priority Queue</h3>
                <p className="text-sm text-wapi-mint leading-relaxed">
                  Every conversation ranked by inferred ₹ value and intent. The ₹8,000 bridal enquiry always sits at the top. Chronological inboxes are dead.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-wapi-card-bg rounded-2xl p-8 border border-wapi-cyan/20 hover:-translate-y-1 hover:border-wapi-cyan/40 hover:shadow-[0_0_20px_rgba(0,180,216,0.1)] transition duration-200">
                <span className="text-2xl mb-4 block">⚡</span>
                <h3 className="text-lg font-clash text-white mb-3">Stale Lead Nudge</h3>
                <p className="text-sm text-wapi-mint leading-relaxed">
                  When a high-value conversation goes cold, the system drafts a personalised follow-up. Owner clicks send. Done. No lead left behind.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-wapi-card-bg rounded-2xl p-8 border border-wapi-cyan/20 hover:-translate-y-1 hover:border-wapi-cyan/40 hover:shadow-[0_0_20px_rgba(0,180,216,0.1)] transition duration-200">
                <span className="text-2xl mb-4 block">🛡️</span>
                <h3 className="text-lg font-clash text-white mb-3">Multilingual Guard</h3>
                <p className="text-sm text-wapi-mint leading-relaxed">
                  Abuse detection across 14 Indian languages including Hindi, Tamil, Telugu, Marathi and Hinglish. Trolls get blocked. Owner never sees it.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-wapi-card-bg rounded-2xl p-8 border border-wapi-cyan/20 hover:-translate-y-1 hover:border-wapi-cyan/40 hover:shadow-[0_0_20px_rgba(0,180,216,0.1)] transition duration-200">
                <span className="text-2xl mb-4 block">📊</span>
                <h3 className="text-lg font-clash text-white mb-3">Live Dashboard</h3>
                <p className="text-sm text-wapi-mint leading-relaxed">
                  Real-time updates via WebSocket. Every new message, every status change, every stale lead — the dashboard reflects it in under 200ms.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-wapi-card-bg rounded-2xl p-8 border border-wapi-cyan/20 hover:-translate-y-1 hover:border-wapi-cyan/40 hover:shadow-[0_0_20px_rgba(0,180,216,0.1)] transition duration-200">
                <span className="text-2xl mb-4 block">🌅</span>
                <h3 className="text-lg font-clash text-white mb-3">Morning Summary</h3>
                <p className="text-sm text-wapi-mint leading-relaxed">
                  Every day at 9 AM, a WhatsApp message lands on the owner&apos;s phone: open leads, auto-handled count, who needs attention. Before they open their laptop.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 4: FUTURE WORKS ── */}
        <section id="roadmap" className="py-24 px-6 md:px-16 bg-[#060f17]">
          <div className="max-w-7xl mx-auto flex flex-col gap-16">
            <div className="max-w-2xl">
              <span className="text-[11px] font-space uppercase tracking-wider text-wapi-cyan font-bold block mb-3">Roadmap</span>
              <h2 className="text-4xl font-clash tracking-tight text-white mb-4">
                What&apos;s coming next
              </h2>
              <p className="text-base text-wapi-mint leading-relaxed">
                Wapi is just getting started. Here&apos;s a glimpse of the features currently in development.
              </p>
            </div>

            {/* Timeline */}
            <div className="relative border-l border-wapi-cyan/20 pl-8 ml-4 flex flex-col gap-12">
              {/* Item 1 */}
              <div className="relative">
                <span className="absolute -left-[37px] top-1.5 w-4.5 h-4.5 rounded-full bg-[#060f17] border-2 border-wapi-cyan shadow-[0_0_10px_#00B4D8]" />
                <h3 className="text-lg font-clash text-white mb-2">Multi-channel expansion</h3>
                <p className="text-sm text-wapi-mint max-w-xl leading-relaxed">
                  Instagram DMs, SMS, and email support. One inbox for all channels.
                </p>
              </div>

              {/* Item 2 */}
              <div className="relative">
                <span className="absolute -left-[37px] top-1.5 w-4.5 h-4.5 rounded-full bg-[#060f17] border-2 border-wapi-cyan shadow-[0_0_10px_#00B4D8]" />
                <h3 className="text-lg font-clash text-white mb-2">Appointment booking</h3>
                <p className="text-sm text-wapi-mint max-w-xl leading-relaxed">
                  Customer says &quot;book Saturday 3 PM&quot; → agent checks availability → confirms and adds to calendar. No back-and-forth.
                </p>
              </div>

              {/* Item 3 */}
              <div className="relative">
                <span className="absolute -left-[37px] top-1.5 w-4.5 h-4.5 rounded-full bg-[#060f17] border-2 border-wapi-cyan shadow-[0_0_10px_#00B4D8]" />
                <h3 className="text-lg font-clash text-white mb-2">Payment collection</h3>
                <p className="text-sm text-wapi-mint max-w-xl leading-relaxed">
                  Send UPI payment links directly inside WhatsApp. Customer pays without leaving the chat.
                </p>
              </div>

              {/* Item 4 */}
              <div className="relative">
                <span className="absolute -left-[37px] top-1.5 w-4.5 h-4.5 rounded-full bg-[#060f17] border-2 border-wapi-teal shadow-[0_0_10px_#2A9D8F]" />
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h3 className="text-lg font-clash text-white">Analytics dashboard</h3>
                  <span className="text-[9px] font-space bg-wapi-cyan/15 text-wapi-cyan px-2 py-0.5 rounded font-bold tracking-wider uppercase">
                    Coming Soon
                  </span>
                </div>
                <p className="text-sm text-wapi-mint max-w-xl leading-relaxed">
                  Conversion rates, average response time, top enquiry types, revenue attribution per channel. Real business intelligence.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 4.5: TECH STACK ── */}
        <section className="py-24 px-6 md:px-16 bg-[#08151f] border-t border-[#00B4D8]/10 relative overflow-hidden">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,180,216,0.03),transparent)] pointer-events-none" />

          <div className="max-w-7xl mx-auto flex flex-col gap-16 relative z-10">
            <div className="max-w-2xl">
              <span className="text-[11px] font-space uppercase tracking-wider text-wapi-cyan font-bold block mb-3">
                Tech Stack &amp; Architecture
              </span>
              <h2 className="text-4xl font-clash tracking-tight text-white mb-4">
                The engine behind the intelligence
              </h2>
              <p className="text-base text-wapi-mint/80 leading-relaxed">
                Wapi scales agentic workflows to thousands of conversations. Here is the modern architecture powering our platform.
              </p>
            </div>

            {/* Grid layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Highlighted Lemma SDK card — taking 2 columns */}
              <div className="lg:col-span-2 bg-[#0c1c28] border border-wapi-cyan/30 rounded-3xl p-8 relative overflow-hidden shadow-[0_0_50px_rgba(0,180,216,0.08)] flex flex-col justify-between group hover:border-wapi-cyan/50 transition duration-300">
                {/* Neon glow effect */}
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-wapi-cyan/10 rounded-full blur-3xl pointer-events-none group-hover:bg-wapi-cyan/20 transition duration-300" />

                <div>
                  <div className="flex items-center gap-3 mb-6 flex-wrap">
                    <span className="px-3 py-1 rounded-full text-[10px] font-space bg-gradient-to-r from-wapi-cyan to-wapi-teal text-wapi-canvas font-bold uppercase tracking-wider">
                      Core Engine
                    </span>
                    <h3 className="text-2xl font-clash text-white font-semibold">Lemma SDK</h3>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed mb-6 font-inter">
                    Lemma SDK handles agentic orchestration for Wapi. Instead of simple pattern-matching chatbots, Lemma treats business documents as dynamic knowledge and reasons over real user requests.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-left">
                    <div className="flex gap-3">
                      <span className="text-wapi-lime mt-0.5 text-xs">✦</span>
                      <div>
                        <h4 className="text-xs font-space font-bold text-white uppercase tracking-wider">Multilingual Guard</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-normal font-inter">
                          Detects spam, threats, and abuse across 14+ Indian languages (including Hinglish and regional dialects) before the database is ever hit.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-wapi-lime mt-0.5 text-xs">✦</span>
                      <div>
                        <h4 className="text-xs font-space font-bold text-white uppercase tracking-wider">Intent &amp; Value Scoring</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-normal font-inter">
                          Performs real-time sentiment analysis and intent classification to calculate exact conversion probabilities and booking values.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-wapi-lime mt-0.5 text-xs">✦</span>
                      <div>
                        <h4 className="text-xs font-space font-bold text-white uppercase tracking-wider">Slot Filling &amp; Transactions</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-normal font-inter">
                          Tracks customer appointments, cake orders, or membership plans by extracting parameters step-by-step from raw chat messages.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-wapi-lime mt-0.5 text-xs">✦</span>
                      <div>
                        <h4 className="text-xs font-space font-bold text-white uppercase tracking-wider">RAG-driven routing</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-normal font-inter">
                          Coordinates embeddings lookup and model prompts securely, keeping context window sizes small and costs low.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simple mock code implementation showcase */}
                <div className="bg-[#070e13] border border-slate-900 rounded-xl p-4 font-mono text-[10px] leading-relaxed text-[#90E0EF]/80 overflow-x-auto">
                  <span className="text-[#f4a261]">import</span> {'{ LemmaAgent }'} <span className="text-[#f4a261]">from</span> <span className="text-wapi-lime">&quot;@lemma/sdk&quot;</span>;<br />
                  <span className="text-[#f4a261]">const</span> agent = <span className="text-[#f4a261]">new</span> <span className="text-white">LemmaAgent</span>({'{'}<br />
                  &nbsp;&nbsp;name: <span className="text-wapi-lime">&quot;wapi-responder&quot;</span>,<br />
                  &nbsp;&nbsp;documentStore: {'{'} provider: <span className="text-wapi-lime">&quot;supabase&quot;</span>, table: <span className="text-wapi-lime">&quot;document_chunks&quot;</span> {'}'},<br />
                  &nbsp;&nbsp;model: {'{'} provider: <span className="text-wapi-lime">&quot;google&quot;</span>, name: <span className="text-wapi-lime">&quot;gemini-3.5-flash&quot;</span> {'}'}<br />
                  {'}'});
                </div>
              </div>

              {/* Stack items - Col 3 */}
              <div className="flex flex-col gap-6">

                {/* Next.js */}
                <div className="bg-[#0a141c] border border-slate-800/80 rounded-2xl p-6 hover:border-wapi-cyan/30 transition duration-200">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl">⚡</span>
                    <h3 className="text-xs font-space font-bold uppercase tracking-wider text-white">Next.js 15</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-inter">
                    Used for lightning-fast server-side rendering (SSR), dynamic edge endpoints, and secure webhook routing. Next.js Route Handlers ingest incoming WhatsApp webhooks in under 50ms.
                  </p>
                </div>

                {/* Supabase */}
                <div className="bg-[#0a141c] border border-[#1e2d3d] rounded-2xl p-6 hover:border-wapi-cyan/30 transition duration-200">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl">🔥</span>
                    <h3 className="text-xs font-space font-bold uppercase tracking-wider text-white">Supabase</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-inter">
                    Provides Postgres database storage, pgvector for semantic RAG document embeddings, real-time WebSockets to sync the dashboard instantly, and RLS policies for strict business separation.
                  </p>
                </div>

                {/* Google Gemini */}
                <div className="bg-[#0a141c] border border-[#1e2d3d] rounded-2xl p-6 hover:border-wapi-cyan/30 transition duration-200">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl">♊</span>
                    <h3 className="text-xs font-space font-bold uppercase tracking-wider text-white">Google Gemini</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-inter">
                    Gemini 3.5 Flash powers our reasoning loops. Selected for its combination of long context efficiency, structured JSON outputs, and fast execution speeds.
                  </p>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* ── SECTION 5: CTA ── */}
        <section className="relative py-24 px-6 md:px-16 bg-gradient-to-br from-wapi-canvas via-[#0d4f6e] to-wapi-cyan text-center overflow-hidden">
          {/* Abstract W Background element */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.02]">
            <span className="text-[550px] font-clash font-extrabold text-white leading-none">W</span>
          </div>

          <div className="relative z-10 max-w-4xl mx-auto flex flex-col gap-6 items-center">
            <h2 className="text-5xl md:text-6xl font-clash tracking-tight text-white leading-tight">
              Stop losing leads <br className="sm:hidden" /> to a flat inbox.
            </h2>

            <p className="text-lg md:text-xl text-white/80 max-w-2xl leading-relaxed">
              Set up in 5 minutes. No coding. No installation. <br className="hidden sm:inline" />
              Your customers just message you — like always.
            </p>

            <Link
              href="/auth/signup"
              className="mt-6 px-10 py-4.5 rounded-xl bg-white text-base font-space font-bold uppercase tracking-wider text-wapi-canvas hover:scale-103 transition duration-150 shadow-2xl"
            >
              Start for free →
            </Link>

            <span className="text-xs text-white/60 font-space tracking-wide mt-2 block">
              Free to start · No credit card required · Built for Indian SMBs
            </span>
          </div>
        </section>

      </main>

      {/* ── SECTION 6: FOOTER ── */}
      <footer className="bg-[#060f17] border-t border-slate-900 py-16 px-6 md:px-16 text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 pb-12 border-b border-slate-900">
          {/* Column 1 */}
          <div className="md:col-span-4 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative bg-wapi-cyan w-9 h-7 rounded-lg flex items-center justify-center">
                <span className="font-bold text-wapi-canvas tracking-tighter text-sm font-space">···</span>
              </div>
              <span className="font-space text-lg font-bold text-white tracking-widest uppercase">wapi</span>
            </Link>
            <p className="text-sm text-slate-400 max-w-xs leading-relaxed font-inter">
              WhatsApp intelligence for Indian businesses.
            </p>
            <span className="text-xs text-slate-650 font-space uppercase tracking-widest block">
              Built at Gappy AI Hackathon 2026
            </span>
          </div>

          {/* Column 2 */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <h5 className="text-xs font-space font-bold text-white uppercase tracking-widest mb-1">Product</h5>
            <Link href="#features" className="text-sm text-slate-400 hover:text-white transition">Features</Link>
            <Link href="#about" className="text-sm text-slate-400 hover:text-white transition">How it works</Link>
            <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition">Dashboard</Link>
            <Link href="#" className="text-sm text-slate-400 hover:text-white transition">Pricing</Link>
          </div>

          {/* Column 3 */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <h5 className="text-xs font-space font-bold text-white uppercase tracking-widest mb-1">Company</h5>
            <Link href="#" className="text-sm text-slate-400 hover:text-white transition">About</Link>
            <Link href="#" className="text-sm text-slate-400 hover:text-white transition">Blog</Link>
            <Link href="#" className="text-sm text-slate-400 hover:text-white transition">Careers</Link>
            <Link href="#" className="text-sm text-slate-400 hover:text-white transition">Contact</Link>
          </div>

          {/* Column 4 */}
          <div className="md:col-span-4 flex flex-col gap-3">
            <h5 className="text-xs font-space font-bold text-white uppercase tracking-widest mb-1">Legal</h5>
            <Link href="#" className="text-sm text-slate-400 hover:text-white transition">Privacy Policy</Link>
            <Link href="#" className="text-sm text-slate-400 hover:text-white transition">Terms of Service</Link>
            <Link href="#" className="text-sm text-slate-400 hover:text-white transition">Security</Link>
            <Link href="#" className="text-sm text-slate-400 hover:text-white transition">Cookie Policy</Link>
          </div>
        </div>

        {/* Bottom copyright & socials */}
        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-slate-500 font-inter">
            © 2026 Wapi. All rights reserved.
          </span>

          <div className="flex gap-6">
            <a href="#" className="text-xs font-space uppercase tracking-wider text-wapi-mint hover:text-white transition">Twitter/X</a>
            <a href="#" className="text-xs font-space uppercase tracking-wider text-wapi-mint hover:text-white transition">LinkedIn</a>
            <a href="#" className="text-xs font-space uppercase tracking-wider text-wapi-mint hover:text-white transition">GitHub</a>
          </div>
        </div>
      </footer>

      {/* ── Cookie Consent overlay ── */}
      <CookieConsent />
    </div>
  );
}
