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
  Smartphone,
  Zap,
  Target,
  ArrowUpRight,
  Users,
  Building,
  Check,
  ChevronDown,
  ChevronRight,
  TrendingDown
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
    <div className="min-h-screen bg-[#030712] text-slate-100 selection:bg-emerald-500 selection:text-black overflow-x-hidden font-sans">
      {/* Background Grid & Radial Glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[20%] right-1/4 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-10 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[90px] pointer-events-none" />

      {/* Header */}
      <header className="relative border-b border-slate-900 bg-[#030712]/80 backdrop-blur-md sticky top-0 z-50 transition-all">
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
          
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-400 font-semibold">
            <a href="#about" className="hover:text-emerald-400 transition-colors">About</a>
            <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
            <a href="#prospects" className="hover:text-emerald-400 transition-colors">Prospects & Meta API</a>
            <a href="#config" className="hover:text-emerald-400 transition-colors">Nodes</a>
          </nav>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
              <span className="w-1.5 h-1.5 mr-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Demo Ready
            </span>
            <div className="flex items-center gap-2.5">
              <a 
                href="/auth/signin" 
                className="px-4 py-2 rounded-lg border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-900 hover:border-slate-700 transition-all"
              >
                Sign In
              </a>
              <a 
                href="/auth/signup" 
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              >
                Sign Up
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col gap-32">
        {/* Hero Section */}
        <section className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 flex flex-col gap-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-slate-900 border border-slate-800 w-fit mx-auto lg:mx-0">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-semibold">The Intelligent WhatsApp Layer for SMBs</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
              Supercharge your<br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
                WhatsApp Inbox
              </span><br />
              with Business AI.
            </h1>

            <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed mx-auto lg:mx-0">
              Wapi automatically responds to multi-lingual voice and text messages using local vector RAG, dynamic intent gating, and automated follow-up cron jobs, ranking your leads by true estimated value.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-2 justify-center lg:justify-start">
              <a 
                href="/demo" 
                className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-extrabold text-sm hover:brightness-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(16,185,129,0.25)] group"
              >
                Launch Simulator Console <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a 
                href="/auth/signup" 
                className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg bg-slate-900/50 border border-slate-800 hover:bg-slate-800/80 hover:border-slate-700 transition-all text-slate-200 text-sm font-bold"
              >
                Deploy Production Portal
              </a>
            </div>
          </div>

          {/* Glowing Mockup Dashboard */}
          <div className="lg:col-span-5 flex justify-center relative">
            {/* Ambient background glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-500 rounded-3xl blur-3xl opacity-20 animate-pulse pointer-events-none"></div>
            
            <div className="relative w-full max-w-[420px] bg-slate-950/70 border border-slate-850 rounded-2xl p-5 shadow-2xl backdrop-blur-md flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">Priority Stream</span>
                </div>
                <span className="text-[9px] font-mono text-slate-500">Live Updates</span>
              </div>

              {/* Chat Card 1 */}
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-100 font-mono">+91 98765 43210</span>
                    <span className="text-[8px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1 rounded font-mono font-bold uppercase">Auto-Replied</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-1">"🎤 what are your rates for bridal makeup"</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-emerald-400 font-mono">₹8,500</span>
                  <span className="text-[8px] text-slate-500 block uppercase mt-0.5">Intent: 85%</span>
                </div>
              </div>

              {/* Chat Card 2 */}
              <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-100 font-mono">+91 88888 77777</span>
                    <span className="text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 rounded font-mono font-bold uppercase">Stale Lead</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-1">"root canal treatment cha kharch kiti aahe?"</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-amber-400 font-mono">₹4,500</span>
                  <span className="text-[8px] text-amber-500 block uppercase mt-0.5">Nudge ready</span>
                </div>
              </div>

              {/* Chat Card 3 */}
              <div className="p-3 bg-slate-900/40 border border-slate-900 rounded-xl flex items-center justify-between gap-4 opacity-50">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-300 font-mono">+91 91234 56789</span>
                    <span className="text-[8px] bg-slate-800 text-slate-500 px-1 rounded font-mono font-bold uppercase">Resolved</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-1">"What is your location?"</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-slate-500 font-mono">₹0</span>
                  <span className="text-[8px] text-slate-600 block uppercase mt-0.5">Intent: 40%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="scroll-mt-24 flex flex-col gap-10">
          <div className="text-center max-w-3xl mx-auto flex flex-col gap-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 font-mono">THE PRODUCT</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">A New Paradigm in Customer Operations</h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Standard chat responders are flat, static, and blind to customer urgency. Wapi processes inputs, queries vector models, and evaluates transaction metrics to organize raw streams into an optimized CRM.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900/20 border border-slate-900 flex flex-col gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit">
                <Building className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Who Wapi is For</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Indian SMBs—such as dental clinics, gourmet bakeries, beauty spas, and fitness centers—running high-volume stores where missing a WhatsApp message means losing a booking.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/20 border border-slate-900 flex flex-col gap-4">
              <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl w-fit">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Capturing Market Value</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Over 63 million SMBs handle customer acquisition on WhatsApp. Response latency costs up to 40% in lost deal value. Wapi recovers this leakage by sorting incoming chats by intent.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/20 border border-slate-900 flex flex-col gap-4">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl w-fit">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Our Competitive Edge</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Unlike simple trigger-word bots, Wapi provides multi-lingual audio transcription, local vector store retrieval, custom cron-based stale lead follow-ups, and intent value filters.
              </p>
            </div>
          </div>

          {/* Competitor Comparison Table */}
          <div className="mt-6 border border-slate-900 bg-slate-950/40 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-white mb-4 text-center">How Wapi Outperforms Competitors</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-500 font-mono uppercase">
                    <th className="py-3 px-4 font-semibold">Capability</th>
                    <th className="py-3 px-4 font-semibold">Basic Auto-Responders</th>
                    <th className="py-3 px-4 font-semibold text-emerald-400">Wapi AI CRM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-300">
                  <tr>
                    <td className="py-3 px-4 font-semibold">Input Formats</td>
                    <td className="py-3 px-4 text-slate-500">Text-Only queries</td>
                    <td className="py-3 px-4 text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Auto-Detect Multilingual Audio & Text
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">Contextual Reasoning</td>
                    <td className="py-3 px-4 text-slate-500">Static keyword match</td>
                    <td className="py-3 px-4 text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> pgvector RAG similarity search
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">Lead Value Scoring</td>
                    <td className="py-3 px-4 text-slate-500">None (Timestamp sorted)</td>
                    <td className="py-3 px-4 text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Intent x Value priority sorting
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">Stale Thread Gating</td>
                    <td className="py-3 px-4 text-slate-500">Manual review only</td>
                    <td className="py-3 px-4 text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Automated pg_cron custom follow-ups
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="scroll-mt-24 flex flex-col gap-10">
          <div className="text-center max-w-3xl mx-auto flex flex-col gap-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 font-mono">CAPABILITIES</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Engineered for Automated Growth</h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Wapi bundles core database workflows, deep reasoning models, and state-of-the-art client dashboards into a single, cohesive workflow node.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-900 hover:border-emerald-500/20 transition-all flex flex-col gap-3 group">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg w-fit group-hover:scale-110 transition-transform">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="text-md font-bold text-white">Local RAG Context Engine</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatically indexes uploaded documents into overlapping chunks, vectorized via `gemini-embedding-001` into a local pgvector schema.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-900 hover:border-emerald-500/20 transition-all flex flex-col gap-3 group">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg w-fit group-hover:scale-110 transition-transform">
                <Smartphone className="w-5 h-5" />
              </div>
              <h4 className="text-md font-bold text-white">Auto-Language Speech Translation</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Converts customer voice recordings to text on the fly. Auto-detects Marathi, Hinglish, Spanish, and English without upfront toggles.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-900 hover:border-emerald-500/20 transition-all flex flex-col gap-3 group">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg w-fit group-hover:scale-110 transition-transform">
                <Target className="w-5 h-5" />
              </div>
              <h4 className="text-md font-bold text-white">Intent & Financial Gating</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Applies Gemini 3.5 Flash logic to analyze incoming messages, evaluating transactional value in INR and gating alerts for priority view.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-900 hover:border-emerald-500/20 transition-all flex flex-col gap-3 group">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg w-fit group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-md font-bold text-white">Cron-Based Lead Nudger</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Uses background cron queries to identify threads that went silent for 2+ hours, generating custom templates to prompt client interaction.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-900 hover:border-emerald-500/20 transition-all flex flex-col gap-3 group">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg w-fit group-hover:scale-110 transition-transform">
                <Bot className="w-5 h-5" />
              </div>
              <h4 className="text-md font-bold text-white">Reasoning Console Pipeline</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inspect every RAG result similarity percentage, transcription feedback, safety check, and raw LLM response variables in real time.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-900 hover:border-emerald-500/20 transition-all flex flex-col gap-3 group">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg w-fit group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="text-md font-bold text-white">Supabase WebSockets Sync</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Keeps your active CRM priority inbox synced with raw database transactions. Updates occur instantly without reloading the browser view.
              </p>
            </div>
          </div>
        </section>

        {/* Future Prospects & Meta Cloud API Flowchart */}
        <section id="prospects" className="scroll-mt-24 flex flex-col gap-10">
          <div className="text-center max-w-3xl mx-auto flex flex-col gap-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 font-mono">META PLATFORMS INTEGRATION</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Meta Cloud API Production Node</h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Wapi is designed to operate beyond sandbox simulations. It hooks directly into Meta's WhatsApp Business Cloud API to receive and route real customer messages.
            </p>
          </div>

          {/* Flowchart Diagram */}
          <div className="border border-slate-900 bg-slate-950/40 rounded-3xl p-6 md:p-10 flex flex-col items-center gap-8 backdrop-blur-sm">
            <h3 className="text-base font-bold text-slate-200 uppercase font-mono tracking-wider">Production Architecture Flow</h3>
            
            <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-4xl gap-6 md:gap-4 relative">
              
              {/* Step 1 */}
              <div className="flex-1 w-full bg-slate-900/60 border border-slate-850 rounded-xl p-4 flex flex-col items-center text-center gap-2 relative">
                <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 text-[10px] text-emerald-400 font-bold flex items-center justify-center font-mono">01</div>
                <h4 className="text-xs font-bold text-white">Customer Phone</h4>
                <p className="text-[10px] text-slate-500">Sends text or voice message via WhatsApp app.</p>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-700 hidden md:block" />
              <ChevronDown className="w-5 h-5 text-slate-700 md:hidden" />

              {/* Step 2 */}
              <div className="flex-1 w-full bg-slate-900/60 border border-slate-850 rounded-xl p-4 flex flex-col items-center text-center gap-2 relative">
                <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 text-[10px] text-emerald-400 font-bold flex items-center justify-center font-mono">02</div>
                <h4 className="text-xs font-bold text-white">Meta Cloud API</h4>
                <p className="text-[10px] text-slate-500">Triggers webhook payload containing message metadata.</p>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-700 hidden md:block" />
              <ChevronDown className="w-5 h-5 text-slate-700 md:hidden" />

              {/* Step 3 */}
              <div className="flex-1 w-full bg-slate-900/60 border border-slate-850 rounded-xl p-4 flex flex-col items-center text-center gap-2 relative">
                <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 text-[10px] text-emerald-400 font-bold flex items-center justify-center font-mono">03</div>
                <h4 className="text-xs font-bold text-white">Lemma Engine</h4>
                <p className="text-[10px] text-slate-500">Transcribes voice, performs local RAG search & scores intent.</p>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-700 hidden md:block" />
              <ChevronDown className="w-5 h-5 text-slate-700 md:hidden" />

              {/* Step 4 */}
              <div className="flex-1 w-full bg-slate-900/60 border border-slate-850 rounded-xl p-4 flex flex-col items-center text-center gap-2 relative">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold flex items-center justify-center font-mono">04</div>
                <h4 className="text-xs font-bold text-emerald-400">Response / CRM Sync</h4>
                <p className="text-[10px] text-slate-500">Dispatches reply to customer and updates Wapi console.</p>
              </div>
            </div>

            <div className="max-w-2xl text-center flex flex-col gap-2">
              <h4 className="text-sm font-bold text-white">Actual WhatsApp API Integration Details</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                By setting `WHATSAPP_PHONE_NUMBER_ID` and hooking up a webhook verifying secret in Meta developer settings, Wapi processes active conversations instantly. Our route `/api/webhook` acts as the direct HTTPS handler to manage inbound data, keeping your dashboard in sync.
              </p>
            </div>
          </div>
        </section>

        {/* Environment Status Section */}
        <section id="config" className="scroll-mt-24">
          <div className="border border-slate-900 bg-slate-950/40 rounded-3xl p-6 backdrop-blur-sm">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer list-none select-none">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">System Node Configurations</h3>
                    <p className="text-slate-500 text-xs mt-0.5">Click to verify status of API credentials and keys</p>
                  </div>
                </div>
                <ChevronDown className="w-5 h-5 text-slate-400 transition-transform group-open:rotate-180" />
              </summary>
              
              <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-slate-900">
                {configs.map((cfg) => {
                  const Icon = cfg.icon;
                  return (
                    <div 
                      key={cfg.key} 
                      className={`relative p-5 rounded-xl border bg-slate-900/30 backdrop-blur-sm transition-all hover:scale-[1.01] ${
                        cfg.status 
                          ? 'border-emerald-500/10 hover:border-emerald-500/35 shadow-[0_0_15px_rgba(16,185,129,0.02)]' 
                          : 'border-rose-500/10 hover:border-rose-500/35'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className={`p-2 rounded-lg ${cfg.status ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        {cfg.status ? (
                          <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Loaded
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[9px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                            <ShieldAlert className="w-2.5 h-2.5" /> Unset
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-white mb-0.5">{cfg.name}</h4>
                      <code className="text-[9px] block text-emerald-400/80 font-mono mb-2">{cfg.key}</code>
                      
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-3">{cfg.desc}</p>
                      
                      <div className="pt-2.5 border-t border-slate-900/60">
                        <span className="text-[8px] text-slate-500 block uppercase font-mono tracking-wider">Current Value</span>
                        <span className="text-[10px] font-mono text-slate-300 break-all select-all">{cfg.value}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative rounded-3xl overflow-hidden py-14 px-6 md:px-12 text-center bg-gradient-to-r from-emerald-950/20 via-slate-900/20 to-teal-950/20 border border-slate-900 flex flex-col items-center gap-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
          
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">GET STARTED</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white max-w-2xl leading-snug">
            Ready to Convert WhatsApp Conversations Into Revenue?
          </h2>
          <p className="text-slate-400 text-sm max-w-md leading-relaxed">
            Try the fully functional priority console simulator instantly or sign up to deploy your custom agent nodes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <a 
              href="/demo" 
              className="px-8 py-3.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 text-xs font-extrabold hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              Start Interactive Demo
            </a>
            <a 
              href="/auth/signup" 
              className="px-8 py-3.5 rounded-lg border border-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-900 hover:border-slate-700 transition-all"
            >
              Sign Up Now
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/50 py-12 text-center text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Image 
              src="/logo.png" 
              alt="Wapi Logo" 
              width={20} 
              height={20}
              className="rounded"
            />
            <span className="font-bold text-slate-400 font-mono tracking-wider uppercase">Wapi CRM layer © 2026</span>
          </div>
          <p className="text-slate-600">Production-grade AI CRM workflows for SMBs. All backend services initialized.</p>
        </div>
      </footer>
    </div>
  );
}
