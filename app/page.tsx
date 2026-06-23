import Image from "next/image";
import { 
  CheckCircle2, 
  MessageSquare, 
  Bot, 
  Layers, 
  Sparkles, 
  Clock, 
  TrendingUp, 
  ShieldAlert,
  ArrowRight,
  Database,
  KeyRound,
  Server,
  Smartphone
} from "lucide-react";

export default function Home() {
  // Check loaded configurations (Server-side rendering check)
  const configs = [
    {
      name: "Supabase Database & Auth",
      key: "NEXT_PUBLIC_SUPABASE_URL",
      value: process.env.NEXT_PUBLIC_SUPABASE_URL || "Not Configured",
      status: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      icon: Database,
      desc: "Handles user authentication, real-time message streams, and vector store chunks."
    },
    {
      name: "Supabase Publishable Key",
      key: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      value: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 
        ? `${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.substring(0, 18)}...` 
        : "Not Configured",
      status: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      icon: KeyRound,
      desc: "Authenticated client-side publishable key for real-time WebSocket connections."
    },
    {
      name: "Gemini 3.5 Reasoning Engine",
      key: "GEMINI_API_KEY",
      value: process.env.GEMINI_API_KEY 
        ? `${process.env.GEMINI_API_KEY.substring(0, 8)}...` 
        : "Not Configured",
      status: !!process.env.GEMINI_API_KEY,
      icon: Bot,
      desc: "Powers document chunk embeddings (gemini-embedding-001) and contextual reasoning (gemini-3.5-flash)."
    },
    {
      name: "WhatsApp Cloud Integration",
      key: "WHATSAPP_PHONE_NUMBER_ID",
      value: process.env.WHATSAPP_PHONE_NUMBER_ID || "Not Configured",
      status: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
      icon: Smartphone,
      desc: "Meta Cloud API node connecting customer chats with the Lemma workflow pipeline."
    },
    {
      name: "Upstash Redis Rate-Limiter",
      key: "UPSTASH_REDIS_REST_URL",
      value: process.env.UPSTASH_REDIS_REST_URL 
        ? `${process.env.UPSTASH_REDIS_REST_URL.substring(0, 30)}...` 
        : "Not Configured",
      status: !!process.env.UPSTASH_REDIS_REST_URL,
      icon: Server,
      desc: "Ensures sliding-window rate limits across all public API routes to avoid spam and abuse."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-black">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-950/20 via-slate-950 to-slate-950 pointer-events-none" />

      <header className="relative border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative bg-slate-950 p-1.5 rounded-lg">
                <Image 
                  src="/logo.png" 
                  alt="Wapi Logo" 
                  width={32} 
                  height={32} 
                  className="rounded-md object-cover"
                />
              </div>
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">WAPI</span>
              <span className="text-[10px] block font-mono text-emerald-500 tracking-widest leading-none">AI CRM LAYER</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <a href="/demo" className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Try Interactive Demo
            </a>
            <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
            <a href="#config" className="hover:text-emerald-400 transition-colors">Environment Status</a>
            <a href="#architecture" className="hover:text-emerald-400 transition-colors">Architecture</a>
          </nav>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Hackathon Ready
            </span>
            <div className="flex items-center gap-2">
              <a 
                href="/auth/signin" 
                className="px-3.5 py-1.5 rounded-lg border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-900 transition-colors"
              >
                Sign In
              </a>
              <a 
                href="/auth/signup" 
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              >
                Sign Up
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 py-12 md:py-20">
        {/* Hero Section */}
        <section className="text-center md:text-left grid md:grid-cols-12 gap-12 items-center mb-24">
          <div className="md:col-span-7 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-slate-900 border border-slate-800 w-fit mx-auto md:mx-0">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300">WhatsApp AI CRM for Indian SMBs</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white">
              Your WhatsApp inbox,<br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
                but with business intelligence.
              </span>
            </h1>

            <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
              Wapi answers customer questions using your uploaded price lists, policies, and files, escalation-gates when unsure, and organizes your conversations by actual lead value.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-2 justify-center md:justify-start">
              <a 
                href="/demo" 
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                Try Interactive Demo <Sparkles className="w-4 h-4" />
              </a>
              <a 
                href="/auth/signup" 
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-850 transition-colors"
              >
                Launch Portal <ArrowRight className="w-4 h-4" />
              </a>
              <a 
                href="#config" 
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-slate-950 border border-slate-900 hover:bg-slate-900 transition-colors text-slate-400 hover:text-slate-200"
              >
                Inspect Envs
              </a>
            </div>
          </div>

          <div className="md:col-span-5 flex justify-center">
            <div className="relative group w-72 h-72 sm:w-80 sm:h-80 lg:w-96 lg:h-96">
              {/* Outer double glowing animation */}
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-500 rounded-3xl blur-3xl opacity-30 group-hover:opacity-40 transition-all duration-500"></div>
              <div className="absolute -inset-1 bg-gradient-to-tr from-emerald-400 to-indigo-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 animate-pulse"></div>
              
              <div className="relative w-full h-full bg-slate-950 border border-slate-905 rounded-3xl p-6 flex flex-col items-center justify-center shadow-2xl">
                <Image 
                  src="/logo.png" 
                  alt="Wapi Designer Logo" 
                  width={280} 
                  height={280}
                  className="rounded-2xl object-cover shadow-2xl w-full h-full aspect-square"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Environment Status Grid */}
        <section id="config" className="scroll-mt-24 mb-24">
          <div className="flex flex-col gap-3 mb-10 text-center md:text-left">
            <h2 className="text-3xl font-bold text-white tracking-tight">System Environment Check</h2>
            <p className="text-slate-400">Status of API integrations and database systems configured in `.env.local`</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {configs.map((cfg) => {
              const Icon = cfg.icon;
              return (
                <div 
                  key={cfg.key} 
                  className={`relative p-6 rounded-xl border bg-slate-900/50 backdrop-blur-sm transition-all hover:scale-[1.01] ${
                    cfg.status 
                      ? 'border-emerald-500/20 hover:border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.02)]' 
                      : 'border-rose-500/20 hover:border-rose-500/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className={`p-2.5 rounded-lg ${cfg.status ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {cfg.status ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Loaded
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                        <ShieldAlert className="w-3 h-3" /> Unset
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{cfg.name}</h3>
                  <code className="text-[11px] block text-emerald-400/80 font-mono mb-3">{cfg.key}</code>
                  
                  <p className="text-sm text-slate-400 leading-relaxed mb-4">{cfg.desc}</p>
                  
                  <div className="pt-3 border-t border-slate-900">
                    <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">Current Value</span>
                    <span className="text-xs font-mono text-slate-300 break-all select-all">{cfg.value}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Feature Demonstration Blocks */}
        <section id="features" className="scroll-mt-24 mb-24">
          <div className="flex flex-col gap-3 mb-10 text-center">
            <h2 className="text-3xl font-bold text-white tracking-tight">Core System Pipelines</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Wapi combines generative AI embeddings and custom business workflows to manage inbound WhatsApp messages.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 hover:bg-slate-900/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">1. Document Embedding</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Pasted services lists and pricing guidelines are automatically split into overlapping 400-token chunks and vectorized using Gemini's `gemini-embedding-001` model into a pgvector store.
              </p>
              <span className="text-xs font-mono text-emerald-500 bg-emerald-500/5 border border-emerald-500/10 px-2 py-1 rounded">
                pgvector similarity check
              </span>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 hover:bg-slate-900/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-6">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">2. Intent & Value Gating</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Gemini 3.5 Flash evaluates messages on a 0-1 intent scale and guesses Indian Rupee (₹) value. High intent is kept auto-handled, while low-confidence inquiries trigger escalation alerts.
              </p>
              <span className="text-xs font-mono text-teal-500 bg-teal-500/5 border border-teal-500/10 px-2 py-1 rounded">
                gemini-3.5-flash confidence
              </span>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 hover:bg-slate-900/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">3. Stale Lead Detector</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Every 30 minutes, pg_cron checks for open conversations that have gone quiet for 2+ hours. When found, it signals Gemini to draft a custom follow-up message ready to send in one-click.
              </p>
              <span className="text-xs font-mono text-indigo-500 bg-indigo-500/5 border border-indigo-500/10 px-2 py-1 rounded">
                pg_cron + Realtime websockets
              </span>
            </div>
          </div>
        </section>

        {/* Priority Queue Simulator Preview */}
        <section id="architecture" className="scroll-mt-24 p-8 rounded-3xl bg-slate-900/20 border border-slate-900/80 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl -z-10" />
          
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 flex flex-col gap-4">
              <span className="text-xs uppercase font-semibold text-emerald-400 tracking-wider">Live Priority Queue Dashboard</span>
              <h2 className="text-3xl font-bold text-white leading-tight">No Chronological Mess. Priority Ranking.</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Wapi re-orders the inbox based on <code className="text-slate-200">intent_score × estimated_value</code>. An enquiry for an ₹8,000 bridal package gets pushed above general location queries.
              </p>
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Real-time DB mutations using Supabase WebSockets</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Manual agent override with text suggestions</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-900 p-6 shadow-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <span className="text-xs font-mono text-slate-500">PRIORITY QUEUE LIST (SIMULATION)</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">LIVE UPDATE FEED</span>
              </div>

              {/* Sample Card 1 */}
              <div className="p-4 rounded-xl bg-slate-900/40 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">+91 98765 43210</span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-mono">HIGH INTENT</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">"I want to book the VIP Bridal Package for Saturday afternoon. Is Priya available?"</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className="text-sm font-bold text-emerald-400">₹8,500</span>
                  <span className="text-[9px] text-slate-500">Urgency: High</span>
                </div>
              </div>

              {/* Sample Card 2 */}
              <div className="p-4 rounded-xl bg-slate-900/40 border border-indigo-500/20 hover:border-indigo-500/40 transition-colors flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">+91 99887 76655</span>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.2 rounded font-mono">STALE LEAD</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">"What are the rates for hair styling and massage sessions?" (Quiet for 2.5 hours)</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className="text-sm font-bold text-indigo-400">₹2,400</span>
                  <span className="text-[9px] text-indigo-400 font-mono">Nudge Ready</span>
                </div>
              </div>

              {/* Sample Card 3 */}
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-850 hover:border-slate-800 transition-colors flex items-center justify-between gap-4 opacity-50">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-300">+91 91234 56789</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.2 rounded font-mono">AUTO-HANDLED</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">"Where is your salon located?" - Auto-replied: "We are at MG Road, Pune..."</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className="text-sm font-bold text-slate-400">₹0</span>
                  <span className="text-[9px] text-slate-600">Resolved</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-12 text-center text-sm text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image 
              src="/logo.png" 
              alt="Wapi Logo" 
              width={20} 
              height={20}
              className="rounded"
            />
            <span className="font-bold text-slate-400 font-mono tracking-wider">WAPI © 2026</span>
          </div>
          <p className="text-xs text-slate-600">Made for the Indian SMB Hackathon. All backend services initialized.</p>
        </div>
      </footer>
    </div>
  );
}
