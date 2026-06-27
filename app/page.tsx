"use client";

import { useEffect, useState, useRef, ReactNode } from "react";
import Link from "next/link";
import CookieConsent from "@/components/CookieConsent";
import Lightfall from "@/components/Lightfall";
import SplitText from "@/components/SplitText";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { FocusCards } from "@/components/ui/focus-cards";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import SoftAurora from "@/components/ui/SoftAurora";
import Loader from "@/components/ui/Loader";


// A custom lightweight scroll reveal component for section animations
interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

function ScrollReveal({ children, className = "", delay = 0, duration = 600 }: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1, // Trigger when 10% is visible
        rootMargin: "0px 0px -50px 0px", // Trigger slightly before it fully hits the viewport
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all ease-out ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(25px)",
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
}

// Speed to Lead / Lead Leakage Stat Card
function LeadLeakageCard() {
  const [useWapi, setUseWapi] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const active = useWapi || isHovered;
  const strokeDashoffset = active ? 0 : 251.2 * 0.62; // 62% lead leakage

  return (
    <div
      className="bg-[#0c1c28]/80 backdrop-blur-sm rounded-2xl p-7 border border-[#1a2936] shadow-xl flex flex-col justify-between h-full min-h-[400px] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,180,216,0.05)] hover:border-wapi-cyan/30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">⚡</span>
          <div>
            <h4 className="text-base font-bold text-white leading-tight">Speed to Lead</h4>
            <p className="text-xs text-wapi-cyan font-semibold font-space uppercase tracking-wider mt-1">Lead Leakage Rate</p>
          </div>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed mb-6 font-inter font-normal">
          78% of customers buy from the first business that responds. Yet, 62% of manual SMB leads go unanswered or are delayed past the golden 5-minute window.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 mt-auto pt-4">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              className="stroke-slate-800"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              className="stroke-wapi-teal transition-all duration-700 ease-out"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray="251.2"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
            {!active && (
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-wapi-coral transition-all duration-700 ease-out"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 * 0.38}
                strokeLinecap="round"
                transform="rotate(136.8 50 50)"
              />
            )}
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className={`text-xl font-bold font-space transition-colors duration-300 ${active ? 'text-wapi-teal' : 'text-wapi-coral'}`}>
              {active ? "0%" : "62%"}
            </span>
            <span className="text-[9.5px] font-space uppercase text-slate-400 font-bold tracking-wider leading-none">
              {active ? "Leakage" : "Lost Leads"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#081118] p-1 rounded-lg border border-[#1a2936] w-full justify-between mt-2">
          <span className="text-[10px] font-space text-slate-400 uppercase tracking-wider pl-2 font-semibold">Setup</span>
          <div className="flex gap-1">
            <button
              onClick={() => setUseWapi(false)}
              className={`px-2.5 py-1 rounded text-[9px] font-space font-bold uppercase transition ${!active ? 'bg-wapi-coral text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Manual Chat
            </button>
            <button
              onClick={() => setUseWapi(true)}
              className={`px-2.5 py-1 rounded text-[9px] font-space font-bold uppercase transition ${active ? 'bg-wapi-teal text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Wapi Agent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// FAQ / Repetitive Questions overhead card
function FaqOverheadCard() {
  const [useWapi, setUseWapi] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const active = useWapi || isHovered;

  return (
    <div
      className="bg-[#0c1c28]/80 backdrop-blur-sm rounded-2xl p-7 border border-[#1a2936] shadow-xl flex flex-col justify-between h-full min-h-[400px] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,180,216,0.05)] hover:border-wapi-cyan/30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">⏱️</span>
          <div>
            <h4 className="text-base font-bold text-white leading-tight">Admin Overhead</h4>
            <p className="text-xs text-wapi-cyan font-semibold font-space uppercase tracking-wider mt-1">Weekly Time Wasted on FAQs</p>
          </div>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed mb-6 font-inter font-normal">
          Over 70% of inbound customer inquiries are simple repetitive FAQs (pricing, location, hours). Answering these manually wastes hours of core business time.
        </p>
      </div>

      <div className="flex flex-col gap-4 mt-auto pt-6">
        <div className="flex items-end justify-around h-28 pb-2 pt-4 relative border-b border-slate-800">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
            <div className="border-t border-dashed border-slate-700 w-full" />
            <div className="border-t border-dashed border-slate-700 w-full" />
            <div className="border-t border-dashed border-slate-700 w-full" />
          </div>

          <div className="flex flex-col items-center gap-2 z-10 w-16">
            <div className="text-[10px] font-space font-bold text-slate-400">14 hrs</div>
            <div
              style={{ height: active ? '30px' : '90px' }}
              className="w-8 rounded-t-lg bg-slate-600 transition-all duration-500 ease-out"
            />
            <div className="text-[9px] font-space uppercase tracking-wider text-slate-500 font-bold">Manual</div>
          </div>

          <div className="flex flex-col items-center gap-2 z-10 w-16">
            <div className="text-[10px] font-space font-bold text-wapi-teal">
              {active ? "0.5 hrs" : "14 hrs"}
            </div>
            <div
              style={{ height: active ? '4px' : '90px' }}
              className="w-8 rounded-t-lg bg-wapi-teal transition-all duration-500 ease-out"
            />
            <div className="text-[9px] font-space uppercase tracking-wider text-slate-500 font-bold">Wapi</div>
          </div>
        </div>

        <div className="text-center h-5">
          {active && (
            <span className="text-[11px] font-space font-bold text-wapi-teal bg-wapi-mint/20 px-2.5 py-0.5 rounded-full animate-in fade-in zoom-in duration-300">
              ✦ Saves 10-16 hours per week
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 bg-[#081118] p-1 rounded-lg border border-[#1a2936] w-full justify-between mt-2">
          <span className="text-[10px] font-space text-slate-400 uppercase tracking-wider pl-2 font-semibold">Setup</span>
          <div className="flex gap-1">
            <button
              onClick={() => setUseWapi(false)}
              className={`px-2.5 py-1 rounded text-[9px] font-space font-bold uppercase transition ${!active ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Manual Chat
            </button>
            <button
              onClick={() => setUseWapi(true)}
              className={`px-2.5 py-1 rounded text-[9px] font-space font-bold uppercase transition ${active ? 'bg-wapi-teal text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Wapi Agent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Lead conversion and pipeline status card
function PipelineConversionCard() {
  const [useWapi, setUseWapi] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const active = useWapi || isHovered;

  return (
    <div
      className="bg-[#0c1c28]/80 backdrop-blur-sm rounded-2xl p-7 border border-[#1a2936] shadow-xl flex flex-col justify-between h-full min-h-[400px] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,180,216,0.05)] hover:border-wapi-cyan/30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">📈</span>
          <div>
            <h4 className="text-base font-bold text-white leading-tight">Funnel Conversion</h4>
            <p className="text-xs text-wapi-cyan font-semibold font-space uppercase tracking-wider mt-1">Lead Conversion Rate</p>
          </div>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed mb-6 font-inter font-normal">
          In a manual, flat chat inbox, follow-ups get buried and leads drop off. Centralized status tracking and follow-up automation boost conversions.
        </p>
      </div>

      <div className="flex flex-col gap-4 mt-auto pt-4">
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[10px] font-space font-bold text-slate-400">
              <span>MANUAL FLAT INBOX CONVERSION</span>
              <span>25%</span>
            </div>
            <div className="h-2 w-full bg-[#081118] rounded-full overflow-hidden">
              <div
                style={{ width: '25%' }}
                className="h-full bg-slate-600 rounded-full transition-all duration-500 ease-out"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[10px] font-space font-bold text-wapi-teal">
              <span>WAPI AUTOMATED PIPELINE</span>
              <span>{active ? "82%" : "25%"}</span>
            </div>
            <div className="h-2 w-full bg-[#081118] rounded-full overflow-hidden">
              <div
                style={{ width: active ? '82%' : '25%' }}
                className="h-full bg-wapi-teal rounded-full transition-all duration-700 ease-out"
              />
            </div>
          </div>
        </div>

        <div className="text-center h-5">
          {active && (
            <span className="text-[11px] font-space font-bold text-wapi-teal bg-wapi-mint/20 px-2.5 py-0.5 rounded-full animate-in fade-in zoom-in duration-300">
              ✦ 3.2x Higher Sales Conversion
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 bg-[#081118] p-1 rounded-lg border border-[#1a2936] w-full justify-between mt-2">
          <span className="text-[10px] font-space text-slate-400 uppercase tracking-wider pl-2 font-semibold">Setup</span>
          <div className="flex gap-1">
            <button
              onClick={() => setUseWapi(false)}
              className={`px-2.5 py-1 rounded text-[9px] font-space font-bold uppercase transition ${!active ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Manual Chat
            </button>
            <button
              onClick={() => setUseWapi(true)}
              className={`px-2.5 py-1 rounded text-[9px] font-space font-bold uppercase transition ${active ? 'bg-wapi-teal text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Wapi Agent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  // Scroll detection state
  const [isLoading, setIsLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start end", "end center"]
  });
  const scaleY = useTransform(scrollYProgress, [0, 0.8], [0, 1]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(interval);
      clearTimeout(loadingTimer);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-wapi-canvas text-slate-100 overflow-hidden font-inter select-none">
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="z-50"
          >
            <Loader />
          </motion.div>
        )}
      </AnimatePresence>

          {/* ── BACKGROUND GRID & GLOW EFFECTS ── */}
          <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,rgba(0,180,216,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,180,216,0.07)_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none" />

          {/* Atmospheric blurred glow orbs */}
          <div className="absolute top-[-10%] right-[-10%] w-[650px] h-[650px] rounded-full bg-wapi-cyan/15 blur-[120px] pointer-events-none animate-orb-pulse" />
          <div className="absolute top-[750px] right-[-10%] w-[750px] h-[750px] rounded-full bg-wapi-lime/12 blur-[150px] pointer-events-none animate-orb-pulse" style={{ animationDelay: "2s" }} />
          <div className="absolute top-[25%] left-[-15%] w-[550px] h-[550px] rounded-full bg-wapi-teal/12 blur-[130px] pointer-events-none animate-orb-pulse" style={{ animationDelay: "1s" }} />

          {/* ── SECTION 1: HEADER NAVIGATION ── */}
          <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 md:px-6 pointer-events-none transition-all duration-300">
            <div className={`w-full flex items-center justify-between pointer-events-auto transition-all duration-500 ${isScrolled
                ? "max-w-4xl mt-4 px-8 py-3 rounded-full border border-slate-800/40 bg-wapi-canvas/60 backdrop-blur-md shadow-lg shadow-black/45"
                : "max-w-7xl px-6 py-6 md:px-16 mx-auto bg-transparent border-transparent"
              }`}>
              {/* Brand Logo */}
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative bg-wapi-cyan w-11 h-9 rounded-xl flex items-center justify-center transition-all group-hover:scale-105 duration-200 shadow-md shadow-wapi-cyan/20">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-wapi-canvas">
                    <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.378.202 2.448 1.347 2.448 2.777v10.9c0 1.43-1.07 2.575-2.448 2.777A48.544 48.544 0 0 1 12 19.75c-1.378 0-2.738-.057-4.078-.166L4.03 22.75a.75.75 0 0 1-1.218-.582V18.15c-1.282-.952-2.062-2.42-2.062-4.05V5.548c0-1.43 1.07-2.575 2.448-2.777ZM9 10.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Zm3.75 1.25a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm2.5-1.25a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Z" clipRule="evenodd" />
                  </svg>
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
                  href="/demo"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-wapi-cyan to-wapi-teal text-xs font-space font-bold uppercase tracking-wider text-wapi-canvas hover:scale-102 hover:brightness-110 transition duration-150"
                >
                  Watch Demo
                </Link>
              </nav>
            </div>
          </header>

          {/* ── MAIN MARKETING SURFACE ── */}
          <main className="relative z-10">

            {/* ── HERO SECTION WITH LIGHTFALL BACKGROUND ── */}
            <div className="relative w-full overflow-hidden">
              {/* Lightfall background canvas */}
              <div className="absolute inset-0 z-0 pointer-events-none">
                <Lightfall
                  colors={['#00B4D8', '#2A9D8F', '#57CC99', '#90E0EF']}
                  backgroundColor="#0B3D52"
                  speed={0.65}
                  streakCount={7}
                  streakWidth={1.3}
                  streakLength={1.4}
                  glow={1.2}
                  density={0.75}
                  twinkle={0.8}
                  zoom={2.4}
                  backgroundGlow={0.6}
                  opacity={0.5}
                  mouseInteraction={true}
                  mouseStrength={0.8}
                  mouseRadius={0.5}
                />
                {/* Dark overlay to dim the streaks and ensure high text contrast */}
                <div className="absolute inset-0 bg-wapi-canvas/50 pointer-events-none" />
                {/* Smooth transition gradient to blend the background with standard canvas bottom section */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-wapi-canvas to-transparent pointer-events-none" />
              </div>

              {/* ── HERO SECTION ── */}
              <section className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-12 md:px-16 md:pt-36 md:pb-24 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-center min-h-[calc(100vh-80px)]">
                {/* Left Hero text and specs */}
                <div className="lg:col-span-7 flex flex-col gap-6 text-left">
                  <ScrollReveal delay={0}>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-wapi-cyan/20 bg-wapi-cyan/5 w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-wapi-lime animate-pulse" />
                      <span className="font-space text-[10px] md:text-xs text-wapi-mint tracking-wider">
                        ✦ AI-Powered WhatsApp CRM
                      </span>
                    </div>
                  </ScrollReveal>

                  <SplitText
                    text={"Your inbox,\nbut it thinks\nlike you."}
                    tag="h1"
                    className="text-5xl md:text-7xl font-clash tracking-tight leading-[1.08] text-white"
                    delay={40}
                    duration={0.7}
                    ease="power3.out"
                    splitType="chars"
                    from={{ opacity: 0, y: 30 }}
                    to={{ opacity: 1, y: 0 }}
                    threshold={0.1}
                    rootMargin="-20px"
                    textAlign="left"
                    wordClassName={(word) => {
                      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
                      if (cleanWord === 'thinks') return 'text-wapi-lime';
                      if (cleanWord === 'you') return 'text-wapi-cyan';
                      return '';
                    }}
                  />

                  <ScrollReveal delay={200}>
                    <p className="text-lg md:text-xl text-wapi-mint max-w-xl leading-relaxed font-inter font-normal">
                      Auto-answer every enquiry. Rank leads by value. <br />
                      Never miss a ₹8,000 booking again.
                    </p>
                  </ScrollReveal>

                  <ScrollReveal delay={300}>
                    <div className="flex flex-wrap gap-4 mt-2">
                      <Link
                        href="/demo"
                        className="px-7 py-3.5 rounded-lg bg-gradient-to-r from-wapi-cyan to-wapi-teal text-sm font-space font-bold uppercase tracking-wider text-wapi-canvas shadow-lg shadow-wapi-cyan/10 hover:scale-102 hover:brightness-110 transition duration-150"
                      >
                        Watch Demo ▶
                      </Link>
                    </div>
                  </ScrollReveal>

                  {/* Stats section */}
                  <ScrollReveal delay={400}>
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
                  </ScrollReveal>
                </div>

                {/* Right Hero mockup and priority queue — floating layered composition */}
                <ScrollReveal delay={200} duration={800} className="lg:col-span-5 w-full max-w-md mx-auto lg:mx-0 relative min-h-[580px] md:min-h-[640px] flex items-center justify-center">
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
                </ScrollReveal>
              </section>
            </div>

            {/* Smooth transition from dark canvas to dark About section */}
            <div className="h-24 bg-gradient-to-b from-wapi-canvas to-[#0a141d] w-full" />

            {/* ── SECTION 2: ABOUT ── */}
            <section id="about" className="bg-[#0a141d] text-slate-100 pb-24 pt-4 px-6 md:px-16 transition-colors duration-200">
              <div className="max-w-7xl mx-auto flex flex-col gap-20">

                {/* 2A: About the Project */}
                <ScrollReveal>
                  <div className="max-w-3xl">
                    <span className="text-[11px] font-space uppercase tracking-wider text-wapi-cyan font-bold block mb-3">About Wapi</span>
                    <h2 className="text-4xl md:text-5xl font-clash tracking-tight text-white mb-6 leading-tight">
                      Built for the businesses WhatsApp forgot
                    </h2>
                    <p className="text-lg text-slate-300 leading-relaxed font-inter font-normal">
                      Indian SMBs handle thousands of WhatsApp conversations every week with zero infrastructure. No ranking, no memory, no AI. Just a flat inbox where every message looks the same. Wapi is the intelligence layer that should have always been there.
                    </p>
                  </div>
                </ScrollReveal>

                {/* 2B: Why This Project / The Problem */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Card 1 */}
                  <ScrollReveal delay={0}>
                    <div className="wapi-flip-card">
                      <div className="wapi-flip-card-inner">
                        {/* Front */}
                        <div className="wapi-flip-card-front">
                          <span className="text-2xl mb-4 block">🚨</span>
                          <h3 className="text-lg font-clash text-white mb-2">Missed leads</h3>
                          <div className="mt-auto text-[10px] text-wapi-cyan font-space tracking-wider uppercase flex items-center gap-1 font-bold">
                            Hover to reveal <span className="animate-pulse">→</span>
                          </div>
                        </div>
                        {/* Back */}
                        <div className="wapi-flip-card-back">
                          <h3 className="text-xs font-space uppercase tracking-wider text-wapi-lime mb-3">The Impact</h3>
                          <p className="text-sm text-slate-100 leading-relaxed font-inter font-normal text-left">
                            A ₹8,000 bridal enquiry arrives at 11 PM. By morning it&apos;s buried under 40 messages. The customer already booked elsewhere.
                          </p>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>

                  {/* Card 2 */}
                  <ScrollReveal delay={100}>
                    <div className="wapi-flip-card">
                      <div className="wapi-flip-card-inner">
                        {/* Front */}
                        <div className="wapi-flip-card-front">
                          <span className="text-2xl mb-4 block">🔄</span>
                          <h3 className="text-lg font-clash text-white mb-2">Repetitive answers</h3>
                          <div className="mt-auto text-[10px] text-wapi-cyan font-space tracking-wider uppercase flex items-center gap-1 font-bold">
                            Hover to reveal <span className="animate-pulse">→</span>
                          </div>
                        </div>
                        {/* Back */}
                        <div className="wapi-flip-card-back">
                          <h3 className="text-xs font-space uppercase tracking-wider text-wapi-lime mb-3">The Impact</h3>
                          <p className="text-sm text-slate-100 leading-relaxed font-inter font-normal text-left">
                            The owner types &quot;our haircut starts at ₹500&quot; 20 times a day. Every single day.
                          </p>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>

                  {/* Card 3 */}
                  <ScrollReveal delay={200}>
                    <div className="wapi-flip-card">
                      <div className="wapi-flip-card-inner">
                        {/* Front */}
                        <div className="wapi-flip-card-front">
                          <span className="text-2xl mb-4 block">⚖️</span>
                          <h3 className="text-lg font-clash text-white mb-2">No prioritisation</h3>
                          <div className="mt-auto text-[10px] text-wapi-cyan font-space tracking-wider uppercase flex items-center gap-1 font-bold">
                            Hover to reveal <span className="animate-pulse">→</span>
                          </div>
                        </div>
                        {/* Back */}
                        <div className="wapi-flip-card-back">
                          <h3 className="text-xs font-space uppercase tracking-wider text-wapi-lime mb-3">The Impact</h3>
                          <p className="text-sm text-slate-100 leading-relaxed font-inter font-normal text-left">
                            A ₹200 enquiry and a ₹10,000 booking look identical in the inbox. There is no way to know who to reply to first.
                          </p>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                </div>

                {/* 2C: Market Reality & Stats */}
                <div>
                  <ScrollReveal>
                    <span className="text-[11px] font-space uppercase tracking-wider text-wapi-cyan font-bold block mb-3">Market Reality</span>
                    <h2 className="text-3xl font-clash text-white mb-10">Why Manual Chat Support Fails</h2>
                  </ScrollReveal>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Stat 1 */}
                    <ScrollReveal delay={0}>
                      <LeadLeakageCard />
                    </ScrollReveal>

                    {/* Stat 2 */}
                    <ScrollReveal delay={100}>
                      <FaqOverheadCard />
                    </ScrollReveal>

                    {/* Stat 3 */}
                    <ScrollReveal delay={200}>
                      <PipelineConversionCard />
                    </ScrollReveal>
                  </div>
                </div>

                {/* 2D: Competitor Comparison Table */}
                <div className="-mt-16 -mb-16">
                  <ContainerScroll
                    titleComponent={
                      <div className="px-4">
                        <span className="text-[11.5px] font-space uppercase tracking-wider text-wapi-cyan font-bold block mb-4">Why Better Than Competitors</span>
                        <h2 className="text-3xl md:text-5xl font-clash text-white mb-12 leading-tight">
                          WATI gives you a chatbot.<br className="hidden md:inline" /> Wapi gives you a brain.
                        </h2>
                      </div>
                    }
                  >
                    <div className="w-full h-full overflow-x-auto">
                      <table className="w-full text-left border-collapse bg-transparent text-slate-100 text-xs md:text-sm">
                        <thead>
                          <tr className="border-b border-wapi-cyan/25 bg-wapi-canvas/70">
                            <th className="p-4 md:p-5 text-[10px] md:text-xs font-space uppercase tracking-wider text-slate-400">Capability</th>
                            <th className="p-4 md:p-5 text-[10px] md:text-xs font-space uppercase tracking-wider text-slate-400 text-center">WATI / AiSensy / Gallabox</th>
                            <th className="p-4 md:p-5 text-[10px] md:text-xs font-space uppercase tracking-wider text-wapi-cyan text-center">Wapi</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-wapi-canvas/30 hover:bg-wapi-canvas/20 transition-colors">
                            <td className="p-4 md:p-5 font-medium font-inter">Reads your actual documents</td>
                            <td className="p-4 md:p-5 text-center text-rose-500 font-bold">❌</td>
                            <td className="p-4 md:p-5 text-center text-wapi-lime font-bold">✅</td>
                          </tr>
                          <tr className="border-b border-wapi-canvas/30 hover:bg-wapi-canvas/20 transition-colors">
                            <td className="p-4 md:p-5 font-medium font-inter">Reasons over real questions</td>
                            <td className="p-4 md:p-5 text-center text-rose-500 font-bold">❌</td>
                            <td className="p-4 md:p-5 text-center text-wapi-lime font-bold">✅</td>
                          </tr>
                          <tr className="border-b border-wapi-canvas/30 hover:bg-wapi-canvas/20 transition-colors">
                            <td className="p-4 md:p-5 font-medium font-inter">Priority queue by lead value</td>
                            <td className="p-4 md:p-5 text-center text-rose-500 font-bold">❌</td>
                            <td className="p-4 md:p-5 text-center text-wapi-lime font-bold">✅</td>
                          </tr>
                          <tr className="border-b border-wapi-canvas/30 hover:bg-wapi-canvas/20 transition-colors">
                            <td className="p-4 md:p-5 font-medium font-inter">Stale lead auto-nudge</td>
                            <td className="p-4 md:p-5 text-center text-rose-500 font-bold">❌</td>
                            <td className="p-4 md:p-5 text-center text-wapi-lime font-bold">✅</td>
                          </tr>
                          <tr className="border-b border-wapi-canvas/30 hover:bg-wapi-canvas/20 transition-colors">
                            <td className="p-4 md:p-5 font-medium font-inter">Multilingual abuse protection</td>
                            <td className="p-4 md:p-5 text-center text-rose-500 font-bold">❌</td>
                            <td className="p-4 md:p-5 text-center text-wapi-lime font-bold">✅</td>
                          </tr>
                          <tr className="hover:bg-wapi-canvas/20 transition-colors">
                            <td className="p-4 md:p-5 font-medium font-inter">Owner disturbed by trolls</td>
                            <td className="p-4 md:p-5 text-center text-rose-500 font-bold">❌ Always</td>
                            <td className="p-4 md:p-5 text-center text-wapi-lime font-bold">✅ Never</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </ContainerScroll>
                </div>
              </div>
            </section>

            {/* Smooth transition from dark About section back to dark canvas */}
            <div className="h-24 bg-gradient-to-b from-[#0a141d] to-wapi-canvas w-full" />

            {/* ── SECTION 3: FEATURES ── */}
            <section id="features" className="pb-24 pt-4 px-6 md:px-16 bg-wapi-canvas">
              <div className="max-w-7xl mx-auto flex flex-col gap-16">
                <ScrollReveal>
                  <div className="max-w-2xl">
                    <span className="text-[11px] font-space uppercase tracking-wider text-wapi-cyan font-bold block mb-3">Features</span>
                    <h2 className="text-4xl font-clash tracking-tight text-white mb-4">
                      Engineered for maximum lead conversion
                    </h2>
                    <p className="text-base text-wapi-mint leading-relaxed">
                      Wapi connects directly to your WhatsApp Business number and integrates live RAG and scoring rules to deliver full-scale business automation.
                    </p>
                  </div>
                </ScrollReveal>

                {/* FocusCards of Feature Cards */}
                <div className="w-full">
                  <FocusCards
                    cards={[
                      {
                        title: "Document Intelligence",
                        icon: "📄",
                        description: "Upload your services and pricing once. The AI reads, understands, and reasons over them — not pre-programmed responses."
                      },
                      {
                        title: "Priority Queue",
                        icon: "🎯",
                        description: "Every conversation ranked by inferred ₹ value and intent. The ₹8,000 bridal enquiry always sits at the top. Chronological inboxes are dead."
                      },
                      {
                        title: "Stale Lead Nudge",
                        icon: "⚡",
                        description: "When a high-value conversation goes cold, the system drafts a personalised follow-up. Owner clicks send. Done. No lead left behind."
                      },
                      {
                        title: "Multilingual Guard",
                        icon: "🛡️",
                        description: "Abuse detection across 14 Indian languages including Hindi, Tamil, Telugu, Marathi and Hinglish. Trolls get blocked. Owner never sees it."
                      },
                      {
                        title: "Live Dashboard",
                        icon: "📊",
                        description: "Real-time updates via WebSocket. Every new message, every status change, every stale lead — the dashboard reflects it in under 200ms."
                      },
                      {
                        title: "Morning Summary",
                        icon: "🌅",
                        description: "Every day at 9 AM, a WhatsApp message lands on the owner's phone: open leads, auto-handled count, who needs attention. Before they open their laptop."
                      }
                    ]}
                  />
                </div>
              </div>
            </section>

            {/* ── SECTION 4: FUTURE WORKS ── */}
            <section id="roadmap" className="py-24 px-6 md:px-16 bg-[#060f17]">
              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">

                {/* Left Column: Heading and Visual Card */}
                <div className="flex flex-col gap-8 lg:col-span-5 text-left">
                  <div>
                    <span className="text-[11px] font-space uppercase tracking-wider text-wapi-cyan font-bold block mb-3">Roadmap</span>
                    <h2 className="text-4xl font-clash tracking-tight text-white mb-4 leading-tight">
                      What&apos;s coming next
                    </h2>
                    <p className="text-base text-wapi-mint/80 leading-relaxed max-w-md">
                      Wapi is just getting started. Here&apos;s a glimpse of the features currently in development as we scale our agentic capabilities.
                    </p>
                  </div>

                  {/* Release Cadence visual card */}
                  <ScrollReveal delay={200}>
                    <div className="relative overflow-hidden bg-gradient-to-br from-[#0c1c28] to-[#08131c] border border-wapi-cyan/15 rounded-3xl p-8 shadow-[0_15px_35px_rgba(0,0,0,0.3)]">
                      {/* Glowing background details */}
                      <div className="absolute top-0 right-0 w-36 h-36 bg-wapi-cyan/10 rounded-full blur-2xl" />
                      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-wapi-lime/10 rounded-full blur-xl" />

                      <h4 className="font-space text-xs font-bold text-wapi-cyan uppercase tracking-wider mb-4">
                        Release Cadence
                      </h4>

                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                          <span className="text-sm text-slate-350 font-inter">Q3 2026</span>
                          <span className="text-xs font-space bg-wapi-cyan/10 text-wapi-cyan px-2 py-0.5 rounded font-medium">In Progress</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                          <span className="text-sm text-slate-350 font-inter">Q4 2026</span>
                          <span className="text-xs font-space bg-wapi-lime/10 text-wapi-lime px-2 py-0.5 rounded font-medium">Planning</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-350 font-inter">Q1 2027</span>
                          <span className="text-xs font-space bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-medium">Backlog</span>
                        </div>
                      </div>

                      {/* Pulsing indicator block */}
                      <div className="mt-8 pt-6 border-t border-slate-800/60 flex items-center gap-4">
                        <div className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-wapi-lime opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-wapi-lime"></span>
                        </div>
                        <span className="text-xs text-wapi-mint font-space uppercase tracking-wider">
                          Continuous deployment active
                        </span>
                      </div>
                    </div>
                  </ScrollReveal>
                </div>

                {/* Right Column: Timeline */}
                <div ref={timelineRef} className="relative pl-8 ml-4 flex flex-col gap-12 lg:col-span-7">
                  {/* Background Line */}
                  <div className="absolute left-0 top-2 bottom-2 w-[1.5px] bg-wapi-cyan/10 pointer-events-none" />

                  {/* Animated Glowing Fill Line */}
                  <motion.div
                    style={{ scaleY, originY: 0 }}
                    className="absolute left-0 top-2 bottom-2 w-[1.5px] bg-gradient-to-b from-wapi-cyan via-wapi-teal to-wapi-mint pointer-events-none"
                  />

                  {/* Item 1 */}
                  <ScrollReveal delay={0}>
                    <div className="relative group">
                      <span className="absolute -left-[37px] top-1.5 w-4.5 h-4.5 rounded-full bg-[#060f17] border-2 border-wapi-cyan shadow-[0_0_10px_rgba(0,180,216,0.3)] transition-transform duration-300 group-hover:scale-120 group-hover:shadow-[0_0_15px_rgba(0,180,216,0.6)]" />
                      <h3 className="text-lg font-clash text-white mb-2 group-hover:text-wapi-cyan transition-colors duration-300">Multi-channel expansion</h3>
                      <p className="text-sm text-wapi-mint max-w-xl leading-relaxed group-hover:text-slate-200 transition-colors duration-300">
                        Instagram DMs, SMS, and email support. One inbox for all channels.
                      </p>
                    </div>
                  </ScrollReveal>

                  {/* Item 2 */}
                  <ScrollReveal delay={100}>
                    <div className="relative group">
                      <span className="absolute -left-[37px] top-1.5 w-4.5 h-4.5 rounded-full bg-[#060f17] border-2 border-wapi-cyan shadow-[0_0_10px_rgba(0,180,216,0.3)] transition-transform duration-300 group-hover:scale-120 group-hover:shadow-[0_0_15px_rgba(0,180,216,0.6)]" />
                      <h3 className="text-lg font-clash text-white mb-2 group-hover:text-wapi-cyan transition-colors duration-300">Appointment booking</h3>
                      <p className="text-sm text-wapi-mint max-w-xl leading-relaxed group-hover:text-slate-200 transition-colors duration-300">
                        Customer says &quot;book Saturday 3 PM&quot; → agent checks availability → confirms and adds to calendar. No back-and-forth.
                      </p>
                    </div>
                  </ScrollReveal>

                  {/* Item 3 */}
                  <ScrollReveal delay={200}>
                    <div className="relative group">
                      <span className="absolute -left-[37px] top-1.5 w-4.5 h-4.5 rounded-full bg-[#060f17] border-2 border-wapi-cyan shadow-[0_0_10px_rgba(0,180,216,0.3)] transition-transform duration-300 group-hover:scale-120 group-hover:shadow-[0_0_15px_rgba(0,180,216,0.6)]" />
                      <h3 className="text-lg font-clash text-white mb-2 group-hover:text-wapi-cyan transition-colors duration-300">Payment collection</h3>
                      <p className="text-sm text-wapi-mint max-w-xl leading-relaxed group-hover:text-slate-200 transition-colors duration-300">
                        Send UPI payment links directly inside WhatsApp. Customer pays without leaving the chat.
                      </p>
                    </div>
                  </ScrollReveal>

                  {/* Item 4 */}
                  <ScrollReveal delay={300}>
                    <div className="relative group">
                      <span className="absolute -left-[37px] top-1.5 w-4.5 h-4.5 rounded-full bg-[#060f17] border-2 border-wapi-teal shadow-[0_0_10px_rgba(42,157,143,0.3)] transition-transform duration-300 group-hover:scale-120 group-hover:shadow-[0_0_15px_rgba(42,157,143,0.6)]" />
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <h3 className="text-lg font-clash text-white group-hover:text-wapi-teal transition-colors duration-300">Analytics dashboard</h3>
                        <span className="text-[9px] font-space bg-wapi-cyan/15 text-wapi-cyan px-2 py-0.5 rounded font-bold tracking-wider uppercase animate-pulse">
                          Coming Soon
                        </span>
                      </div>
                      <p className="text-sm text-wapi-mint max-w-xl leading-relaxed group-hover:text-slate-200 transition-colors duration-300">
                        Conversion rates, average response time, top enquiry types, revenue attribution per channel. Real business intelligence.
                      </p>
                    </div>
                  </ScrollReveal>
                </div>
              </div>
            </section>

            {/* Smooth transition from dark canvas to dark tech stack */}
            <div className="h-24 bg-gradient-to-b from-wapi-canvas to-[#08151f] w-full" />

            {/* ── SECTION 4.5: TECH STACK ── */}
            <section className="pb-24 pt-4 px-6 md:px-16 bg-[#08151f] relative overflow-hidden">
              {/* Subtle grid pattern background */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,180,216,0.03),transparent)] pointer-events-none" />

              <div className="max-w-7xl mx-auto flex flex-col gap-16 relative z-10">
                <ScrollReveal>
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
                </ScrollReveal>

                {/* Grid layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                  {/* Highlighted Lemma SDK card — taking 2 columns */}
                  <ScrollReveal className="lg:col-span-2" delay={0}>
                    <div className="bg-[#0c1c28] border border-wapi-cyan/30 rounded-3xl p-8 relative overflow-hidden shadow-[0_0_50px_rgba(0,180,216,0.08)] flex flex-col justify-between group hover:border-wapi-cyan/50 transition duration-300 h-full">
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
                  </ScrollReveal>

                  {/* Stack items - Col 3 */}
                  <div className="flex flex-col gap-6">

                    {/* Next.js */}
                    <ScrollReveal delay={100}>
                      <div className="bg-[#0a141c] border border-slate-800/80 rounded-2xl p-6 hover:border-wapi-cyan/30 transition duration-200">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-xl">⚡</span>
                          <h3 className="text-xs font-space font-bold uppercase tracking-wider text-white">Next.js 15</h3>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed font-inter">
                          Used for lightning-fast server-side rendering (SSR), dynamic edge endpoints, and secure webhook routing. Next.js Route Handlers ingest incoming WhatsApp webhooks in under 50ms.
                        </p>
                      </div>
                    </ScrollReveal>

                    {/* Supabase */}
                    <ScrollReveal delay={200}>
                      <div className="bg-[#0a141c] border border-[#1e2d3d] rounded-2xl p-6 hover:border-wapi-cyan/30 transition duration-200">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-xl">🔥</span>
                          <h3 className="text-xs font-space font-bold uppercase tracking-wider text-white">Supabase</h3>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed font-inter">
                          Provides Postgres database storage, pgvector for semantic RAG document embeddings, real-time WebSockets to sync the dashboard instantly, and RLS policies for strict business separation.
                        </p>
                      </div>
                    </ScrollReveal>

                    {/* Google Gemini */}
                    <ScrollReveal delay={300}>
                      <div className="bg-[#0a141c] border border-[#1e2d3d] rounded-2xl p-6 hover:border-wapi-cyan/30 transition duration-200">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-xl">♊</span>
                          <h3 className="text-xs font-space font-bold uppercase tracking-wider text-white">Google Gemini</h3>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed font-inter">
                          Gemini 3.5 Flash powers our reasoning loops. Selected for its combination of long context efficiency, structured JSON outputs, and fast execution speeds.
                        </p>
                      </div>
                    </ScrollReveal>

                  </div>

                </div>
              </div>
            </section>

            {/* Smooth transition from dark tech stack back to dark canvas */}
            <div className="h-24 bg-gradient-to-b from-[#08151f] to-wapi-canvas w-full" />

            {/* ── SECTION 5: CTA ── */}
            <section className="relative pb-24 pt-4 px-6 md:px-16 bg-gradient-to-b from-wapi-canvas via-[#0a3144] to-[#082230] text-center overflow-hidden">
              {/* SoftAurora Background Shader */}
              <div className="absolute inset-0 z-0 pointer-events-none opacity-55">
                <SoftAurora
                  speed={0.5}
                  scale={1.3}
                  brightness={1.1}
                  color1="#00B4D8"
                  color2="#2A9D8F"
                  noiseFrequency={2.2}
                  noiseAmplitude={0.9}
                  bandHeight={0.5}
                  bandSpread={1.1}
                  octaveDecay={0.12}
                  layerOffset={0.25}
                  colorSpeed={0.8}
                  enableMouseInteraction={true}
                  mouseInfluence={0.15}
                />
              </div>

              {/* Abstract W Background element */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03] z-5">
                <span className="text-[550px] font-clash font-extrabold text-white leading-none">W</span>
              </div>

              <ScrollReveal duration={850} className="relative z-10 max-w-4xl mx-auto flex flex-col gap-6 items-center">
                <h2 className="text-5xl md:text-6xl font-clash tracking-tight text-white leading-tight">
                  Stop losing leads <br className="sm:hidden" /> to a flat inbox.
                </h2>

                <p className="text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed">
                  Set up in 5 minutes. No coding. No installation. <br className="hidden sm:inline" />
                  Your customers just message you — like always.
                </p>

                <Link
                  href="/demo"
                  className="mt-6 px-10 py-4.5 rounded-xl bg-white text-base font-space font-bold uppercase tracking-wider text-wapi-canvas hover:scale-103 transition duration-150 shadow-2xl"
                >
                  Watch Demo ▶
                </Link>

                <span className="text-xs text-white/70 font-space tracking-wide mt-2 block">
                  Interactive demo · See Wapi in action · Built for Indian SMBs
                </span>
              </ScrollReveal>
            </section>

          </main>

          {/* Smooth transition from main surface to footer */}
          <div className="h-24 bg-gradient-to-b from-[#082230] to-[#060f17] w-full" />

          {/* ── SECTION 6: FOOTER ── */}
          <footer className="bg-[#060f17] py-16 px-6 md:px-16 text-slate-400">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">

              {/* Column 1: Brand & Team */}
              <div className="flex flex-col items-center md:items-start gap-4">
                <Link href="/" className="flex items-center gap-3">
                  <div className="relative bg-wapi-cyan w-11 h-9 rounded-xl flex items-center justify-center shadow-md shadow-wapi-cyan/20">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-wapi-canvas">
                      <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.378.202 2.448 1.347 2.448 2.777v10.9c0 1.43-1.07 2.575-2.448 2.777A48.544 48.544 0 0 1 12 19.75c-1.378 0-2.738-.057-4.078-.166L4.03 22.75a.75.75 0 0 1-1.218-.582V18.15c-1.282-.952-2.062-2.42-2.062-4.05V5.548c0-1.43 1.07-2.575 2.448-2.777ZM9 10.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Zm3.75 1.25a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm2.5-1.25a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-space text-lg font-bold text-white tracking-widest uppercase">wapi</span>
                </Link>
                <div className="flex flex-col items-center md:items-start gap-1">
                  <p className="text-sm text-slate-450 font-space uppercase tracking-widest">
                    Team: <span className="text-wapi-cyan font-bold">Byte Me</span>
                  </p>
                  <p className="text-xs text-slate-500 font-inter">
                    Built at Gappy AI Hackathon 2026
                  </p>
                </div>
              </div>

              {/* Column 2: Authors & Socials */}
              <div className="flex flex-col sm:flex-row gap-8 sm:gap-16 items-center sm:items-start text-center sm:text-left">
                {/* Kritika Benjwal */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-white font-space">Kritika Benjwal</span>
                  <div className="flex items-center gap-4 justify-center sm:justify-start">
                    <a
                      href="https://github.com/Kritika11052005"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-wapi-cyan transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-github"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
                    </a>
                    <a
                      href="https://www.linkedin.com/in/kritika-benjwal"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-wapi-cyan transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-linkedin"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
                    </a>
                    <a
                      href="mailto:ananaya.benjwal@gmail.com"
                      className="text-slate-400 hover:text-wapi-cyan transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                    </a>
                  </div>
                </div>

                {/* Sarthak Gupta */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-white font-space">Sarthak Gupta</span>
                  <div className="flex items-center gap-4 justify-center sm:justify-start">
                    <a
                      href="https://github.com/SarthakG1801"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-wapi-cyan transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-github"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
                    </a>
                    <a
                      href="https://www.linkedin.com/in/sarthakgupta1801"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-wapi-cyan transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-linkedin"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
                    </a>
                    <a
                      href="mailto:sarthakgupta1971@gmail.com"
                      className="text-slate-400 hover:text-wapi-cyan transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                    </a>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom footer strip */}
            <div className="max-w-7xl mx-auto pt-8 mt-12 border-t border-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-500 font-inter">
                Made by Kritika Benjwal and Sarthak Gupta
              </span>
              <span className="text-[10px] text-slate-655 font-space tracking-wider uppercase">
                © 2026 Wapi. All rights reserved.
              </span>
            </div>
          </footer>

          {/* ── Cookie Consent overlay ── */}
          <CookieConsent />
    </div>
  );
}
