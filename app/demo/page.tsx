"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MessageSquare,
  Bot,
  Layers,
  Sparkles,
  Clock,
  Database,
  ArrowLeft,
  Send,
  Smartphone,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  FileText,
  User,
  CheckCircle,
  HelpCircle,
  Eye
} from "lucide-react";

interface Message {
  sender: "customer" | "agent" | "owner" | "system";
  text: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  phone: string;
  lastMessage: string;
  time: string;
  value: number;
  intent: number;
  status: "open" | "auto-handled" | "escalated" | "stale";
}

const DEFAULT_KNOWLEDGE = `Kritika's Beauty Studio Pricing & Policies:

1. Services & Pricing:
- Haircut: ₹500 for men, ₹800 for women (includes hair wash & styling).
- Hair Spa: ₹1,500 (deep conditioning & massage).
- Facial: Standard Facial is ₹1,200, VIP Gold Glow Facial is ₹3,500.
- Bridal Styling Package: ₹8,500 (makeup, hair styling, saree draping, and trial session).
- Massage: ₹2,000 for 60 minutes (Swedish/Deep Tissue).

2. Contact & Location:
- Address: 4th Block, MG Road, Pune (opposite City Mall).
- Operating Hours: 10:00 AM to 8:00 PM (open every day except Tuesday).
- Appointment Booking: Can be booked via phone or in-person. Advance booking of ₹1,000 is required for the Bridal Package.

3. General Policies:
- We have separate sections for men and women.
- Cancellations: Full refund of advance booking if canceled 24 hours prior.`;

export default function DemoPage() {
  const [chatHistory, setChatHistory] = useState<Message[]>([
    {
      sender: "system",
      text: "WhatsApp chat session initialized with Kritika's Beauty Studio.",
      timestamp: "10:00 AM"
    },
    {
      sender: "agent",
      text: "Hello! Welcome to Kritika's Beauty Studio. How can we help you today?",
      timestamp: "10:00 AM"
    }
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [businessName, setBusinessName] = useState("Kritika's Beauty Studio");
  const [businessType, setBusinessType] = useState("Beauty Salon");
  const [knowledgeText, setKnowledgeText] = useState(DEFAULT_KNOWLEDGE);

  // Active sandbox inbox
  const [inboxList, setInboxList] = useState<Conversation[]>([
    {
      id: "conv-1",
      phone: "+91 98765 43210",
      lastMessage: "Hello! Welcome to Kritika's Beauty Studio...",
      time: "Just now",
      value: 0,
      intent: 0.2,
      status: "auto-handled"
    },
    {
      id: "conv-2",
      phone: "+91 99887 76655",
      lastMessage: "I want to know about massage rates.",
      time: "10m ago",
      value: 2000,
      intent: 0.75,
      status: "open"
    },
    {
      id: "conv-3",
      phone: "+91 91234 56789",
      lastMessage: "What is your location?",
      time: "1h ago",
      value: 0,
      intent: 0.4,
      status: "auto-handled"
    }
  ]);

  const [activeTab, setActiveTab] = useState<"inbox" | "knowledge" | "pipeline">("pipeline");
  const [pipelineLogs, setPipelineLogs] = useState<any>(null);
  const [isStale, setIsStale] = useState(false);
  const [nudgeDraft, setNudgeDraft] = useState("");
  const [isGeneratingNudge, setIsGeneratingNudge] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat window
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isTyping]);

  // Handle Preset Clicks
  const handlePresetClick = (presetText: string) => {
    setInputMessage(presetText);
  };

  // Submit message to the API
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    if (!textToSend) setInputMessage("");

    // Add customer message
    const newHistory = [
      ...chatHistory,
      {
        sender: "customer" as const,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ];
    setChatHistory(newHistory);
    setIsTyping(true);

    try {
      const response = await fetch("/api/demo-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: text,
          chatHistory: newHistory.filter((m) => m.sender !== "system"),
          documentText: knowledgeText,
          businessName,
          businessType
        })
      });

      const data = await response.json();
      setIsTyping(false);

      if (data.error) {
        setChatHistory((prev) => [
          ...prev,
          {
            sender: "system",
            text: `Error: ${data.error}`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]);
        return;
      }

      // Add AI Response or Escalation note
      const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (data.response === "ESCALATE" || data.status === "escalated") {
        setChatHistory((prev) => [
          ...prev,
          {
            sender: "system",
            text: "⚠️ Conversation escalated to business owner due to low confidence or uncertain request.",
            timestamp
          }
        ]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          {
            sender: "agent",
            text: data.response,
            timestamp
          }
        ]);
      }

      // Update Pipeline Inspector Logs
      setPipelineLogs(data);

      // Update CRM sandbox inbox card (conv-1 is our active simulator)
      setInboxList((prev) => {
        const updated = prev.map((conv) => {
          if (conv.id === "conv-1") {
            return {
              ...conv,
              lastMessage: data.response === "ESCALATE" ? "Escalated to owner" : data.response,
              time: "Just now",
              value: data.evaluation.estimatedValue,
              intent: data.evaluation.intentScore,
              status: data.status
            };
          }
          return conv;
        });

        // Re-sort: (intent * value) DESC, time desc
        return [...updated].sort((a, b) => {
          const scoreA = a.intent * (a.value || 1);
          const scoreB = b.intent * (b.value || 1);
          return scoreB - scoreA;
        });
      });

      // Clear stale state if customer replies
      setIsStale(false);
    } catch (e: any) {
      setIsTyping(false);
      console.error(e);
      setChatHistory((prev) => [
        ...prev,
        {
          sender: "system",
          text: `Failed to connect to the backend agent: ${e.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    }
  };

  // Simulate 2 Hours passing
  const triggerStaleSimulation = async () => {
    setIsStale(true);
    setIsGeneratingNudge(true);
    setActiveTab("inbox"); // Focus inbox tab

    // Update active inbox card to stale
    setInboxList((prev) => {
      const updated = prev.map((conv) => {
        if (conv.id === "conv-1") {
          return {
            ...conv,
            status: "stale" as const,
            time: "2h ago"
          };
        }
        return conv;
      });
      return [...updated];
    });

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const historyText = chatHistory
        .filter((m) => m.sender !== "system")
        .map((m) => `${m.sender === "customer" ? "Customer" : "Agent"}: ${m.text}`)
        .join("\n");

      // Generate a follow-up draft using Gemini 3.5 Flash directly
      const response = await fetch("/api/demo-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Please generate a friendly follow-up nudge draft based on this conversation. Respond in the customer's language. Respond with ONLY the follow-up copy, no JSON, no quotes.",
          chatHistory: chatHistory.filter((m) => m.sender !== "system"),
          documentText: knowledgeText,
          businessName,
          businessType
        })
      });

      const data = await response.json();
      setIsGeneratingNudge(false);
      setNudgeDraft(data.response || "Hey! Just wanted to check if you had any other questions about booking your service?");
    } catch (e) {
      console.error(e);
      setIsGeneratingNudge(false);
      setNudgeDraft("Hey! Just checking in to see if you would like to go ahead with booking the haircut/service we discussed earlier?");
    }
  };

  // Send manual follow-up nudge
  const sendNudge = () => {
    if (!nudgeDraft.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setChatHistory((prev) => [
      ...prev,
      {
        sender: "owner",
        text: nudgeDraft,
        timestamp
      }
    ]);

    setIsStale(false);

    setInboxList((prev) => {
      return prev.map((conv) => {
        if (conv.id === "conv-1") {
          return {
            ...conv,
            lastMessage: `Nudge Sent: "${nudgeDraft.substring(0, 30)}..."`,
            status: "open",
            time: "Just now"
          };
        }
        return conv;
      });
    });
  };

  // Quick statistics
  const statActive = inboxList.filter((c) => c.status !== "auto-handled").length;
  const statAuto = inboxList.filter((c) => c.status === "auto-handled").length;
  const statEscalated = inboxList.filter((c) => c.status === "escalated").length;
  const statStale = inboxList.filter((c) => c.status === "stale").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-black">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-950/20 via-slate-950 to-slate-950 pointer-events-none" />

      <header className="relative border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-1 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">WAPI SANDBOX</span>
              <span className="text-[9px] block font-mono text-emerald-500 tracking-widest leading-none">INTERACTIVE SIMULATION</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Local Simulation Node
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid lg:grid-cols-12 gap-8 relative z-10">
        {/* Left Side: WhatsApp Simulator */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-400" />
              1. Customer Simulator
            </h2>
            <p className="text-xs text-slate-400">
              Simulate customer chats. Tap presets to test multi-lingual queries or keysmash gibberish.
            </p>
          </div>

          {/* Preset Queries panel */}
          <div className="flex flex-col gap-2 p-4 bg-slate-900/40 border border-slate-850 rounded-2xl">
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Click a preset query to load & run:</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <button
                onClick={() => handlePresetClick("kaha hai tumhara shop?")}
                className="px-2.5 py-1 text-[11px] font-medium bg-slate-950 border border-slate-800 rounded-lg hover:border-emerald-500/50 hover:text-emerald-400 transition-all text-left"
              >
                🇮🇳 "kaha hai tumhara shop?" (Hinglish)
              </button>
              <button
                onClick={() => handlePresetClick("haircut cha rate kay aahe?")}
                className="px-2.5 py-1 text-[11px] font-medium bg-slate-950 border border-slate-800 rounded-lg hover:border-emerald-500/50 hover:text-emerald-400 transition-all text-left"
              >
                🇮🇳 "haircut cha rate kay aahe?" (Marathi)
              </button>
              <button
                onClick={() => handlePresetClick("what the price of women haircut")}
                className="px-2.5 py-1 text-[11px] font-medium bg-slate-950 border border-slate-800 rounded-lg hover:border-emerald-500/50 hover:text-emerald-400 transition-all text-left"
              >
                🇬🇧 "what the price of women haircut" (Typos)
              </button>
              <button
                onClick={() => handlePresetClick("donde esta su tienda?")}
                className="px-2.5 py-1 text-[11px] font-medium bg-slate-950 border border-slate-800 rounded-lg hover:border-emerald-500/50 hover:text-emerald-400 transition-all text-left"
              >
                🇪🇸 "donde esta su tienda?" (Spanish)
              </button>
              <button
                onClick={() => handlePresetClick("asdfghjklzxcvbnm")}
                className="px-2.5 py-1 text-[11px] font-medium bg-slate-950 border border-slate-800 rounded-lg hover:border-rose-500/50 hover:text-rose-400 transition-all text-left"
              >
                ⚠️ "asdfghjklzxcvbnm" (Gibberish)
              </button>
              <button
                onClick={() => handlePresetClick("i want to book the VIP Bridal Package for ₹8500 this Sunday")}
                className="px-2.5 py-1 text-[11px] font-medium bg-slate-950 border border-slate-800 rounded-lg hover:border-emerald-500/50 hover:text-emerald-400 transition-all text-left"
              >
                💰 "i want to book the VIP Bridal Package" (High Value)
              </button>
            </div>
          </div>

          {/* Mobile phone container */}
          <div className="relative mx-auto w-full max-w-[370px] aspect-[9/18.5] bg-slate-950 border-[6px] border-slate-850 rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
            {/* Phone Notch/Speaker */}
            <div className="absolute top-0 inset-x-0 h-5 bg-slate-950 flex justify-center items-center z-20">
              <div className="w-24 h-3.5 bg-black rounded-b-xl flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-slate-900 rounded-full mr-2"></span>
                <span className="w-12 h-1 bg-slate-900 rounded-full"></span>
              </div>
            </div>

            {/* Simulated WhatsApp Header */}
            <div className="bg-[#0b141a] pt-7 pb-3 px-4 flex items-center gap-3 border-b border-slate-900 shrink-0">
              <div className="w-9 h-9 rounded-full bg-slate-900 border border-emerald-500/30 flex items-center justify-center overflow-hidden shrink-0">
                <Image
                  src="/logo.png"
                  alt="Business Logo"
                  width={36}
                  height={36}
                  className="rounded-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-bold text-slate-100">{businessName}</h3>
                <span className="text-[9px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                  online
                </span>
              </div>
              <button
                onClick={triggerStaleSimulation}
                title="Simulate 2 hours passing without replies to trigger stale lead warning"
                className="text-[10px] flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-850 text-slate-400 hover:text-white transition-all hover:bg-slate-850"
              >
                <Clock className="w-3 h-3 text-amber-500" />
                +2 Hours
              </button>
            </div>

            {/* Chat Messages Body */}
            <div
              className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 bg-[#0b141a] bg-opacity-95"
              style={{
                backgroundImage: 'radial-gradient(#111b21 1px, transparent 0)',
                backgroundSize: '16px 16px',
              }}
            >
              {chatHistory.map((msg, index) => {
                if (msg.sender === "system") {
                  return (
                    <div key={index} className="w-full text-center my-1.5">
                      <span className="inline-block px-2.5 py-1 rounded bg-slate-900/80 border border-slate-905 text-[10px] text-slate-400 leading-relaxed font-mono">
                        {msg.text}
                      </span>
                    </div>
                  );
                }

                const isMe = msg.sender === "customer";
                const isOwner = msg.sender === "owner";
                
                let bubbleClass = "max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ";
                if (isMe) {
                  bubbleClass += "bg-[#0b5c46] text-white self-end rounded-tr-none";
                } else if (isOwner) {
                  bubbleClass += "bg-slate-900 border border-slate-805 text-white self-start rounded-tl-none border-l-2 border-l-emerald-500";
                } else {
                  bubbleClass += "bg-[#202c33] text-slate-100 self-start rounded-tl-none";
                }

                return (
                  <div key={index} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div className={bubbleClass}>
                      {isOwner && (
                        <span className="text-[9px] block text-emerald-400 font-mono font-bold uppercase mb-0.5">
                          You (Manual Reply)
                        </span>
                      )}
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      <span className="text-[8px] text-slate-400 block text-right mt-1 font-mono">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="self-start bg-[#202c33] rounded-2xl rounded-tl-none px-3.5 py-2.5 text-xs text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Footer */}
            <div className="bg-[#111b21] p-3 border-t border-slate-900 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Type a WhatsApp message..."
                className="flex-1 bg-[#2a3942] border border-transparent rounded-lg px-3.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim()}
                className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* Right Side: Wapi Portal & Workflow Logs */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-400" />
              2. Wapi AI Operator Portal
            </h2>
            <p className="text-xs text-slate-400">
              Monitor the AI's internal reasoning, prioritize leads, and view the live vector retrieval outputs.
            </p>
          </div>

          {/* CRM Stat Strip */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-3 bg-slate-900/50 border border-slate-900 rounded-xl text-center">
              <span className="text-[10px] font-mono text-slate-500 block uppercase">Active</span>
              <span className="text-lg font-bold text-white">{statActive}</span>
            </div>
            <div className="p-3 bg-slate-900/50 border border-emerald-500/10 rounded-xl text-center shadow-[0_0_10px_rgba(16,185,129,0.02)]">
              <span className="text-[10px] font-mono text-emerald-500 block uppercase">Auto-replies</span>
              <span className="text-lg font-bold text-emerald-400">{statAuto}</span>
            </div>
            <div className="p-3 bg-slate-900/50 border border-amber-500/10 rounded-xl text-center">
              <span className="text-[10px] font-mono text-amber-500 block uppercase">Escalated</span>
              <span className="text-lg font-bold text-amber-400">{statEscalated}</span>
            </div>
            <div className="p-3 bg-slate-900/50 border border-rose-500/10 rounded-xl text-center">
              <span className="text-[10px] font-mono text-rose-500 block uppercase">Stale</span>
              <span className="text-lg font-bold text-rose-400">{statStale}</span>
            </div>
          </div>

          {/* Live Nudge Alert Widget */}
          {isStale && (
            <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex flex-col gap-3.5 relative overflow-hidden animate-pulse">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Stale Lead Alert</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      This customer has gone quiet for 2+ hours. Wapi generated a custom nudge follow-up.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/25 px-2 py-0.5 rounded">
                  ₹{inboxList.find((c) => c.id === "conv-1")?.value || 0} Lead
                </span>
              </div>

              {isGeneratingNudge ? (
                <div className="flex items-center gap-2 py-3 justify-center text-xs text-slate-400">
                  <Clock className="w-4 h-4 text-rose-400 animate-spin" /> Drafting custom follow-up...
                </div>
              ) : (
                <div className="flex flex-col gap-2 bg-slate-950 p-3 rounded-lg border border-slate-900">
                  <label className="text-[10px] font-mono text-slate-500 uppercase">AI-Drafted Nudge message</label>
                  <textarea
                    value={nudgeDraft}
                    onChange={(e) => setNudgeDraft(e.target.value)}
                    rows={2}
                    className="w-full bg-transparent border-0 p-0 text-xs text-slate-200 placeholder-slate-600 focus:ring-0 focus:outline-none resize-none"
                  />
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-900">
                    <button
                      onClick={() => setIsStale(false)}
                      className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 hover:text-white transition-colors"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={sendNudge}
                      className="px-3 py-1 rounded bg-rose-500 text-slate-950 text-[10px] font-bold hover:bg-rose-400 transition-all flex items-center gap-1.5"
                    >
                      <Send className="w-3 h-3" /> Send Follow-up
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tabs header */}
          <div className="flex border-b border-slate-900 bg-slate-900/20 rounded-xl p-1 shrink-0">
            <button
              onClick={() => setActiveTab("pipeline")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "pipeline"
                  ? "bg-slate-900 text-emerald-400 border border-slate-800 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Bot className="w-4 h-4" /> Pipeline Inspector
            </button>
            <button
              onClick={() => setActiveTab("inbox")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "inbox"
                  ? "bg-slate-900 text-emerald-400 border border-slate-800 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <MessageSquare className="w-4 h-4" /> CRM Queue Inbox
            </button>
            <button
              onClick={() => setActiveTab("knowledge")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "knowledge"
                  ? "bg-slate-900 text-emerald-400 border border-slate-800 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Database className="w-4 h-4" /> Custom Knowledge
            </button>
          </div>

          {/* Active Tab Contents */}
          <div className="flex-1 min-h-[460px]">
            {activeTab === "pipeline" && (
              <div className="flex flex-col gap-4">
                {!pipelineLogs ? (
                  <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-slate-900 rounded-2xl bg-slate-900/10 min-h-[400px]">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-slate-500 mb-4 border border-slate-850">
                      <HelpCircle className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-white text-sm">Waiting for incoming message</h3>
                    <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
                      Type and send a message in the WhatsApp simulator on the left to inspect the execution workflow.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {/* Pipeline Summary strip */}
                    <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-xl flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">Last Status Routing</span>
                        <span className={`text-xs font-bold uppercase ${pipelineLogs.status === "escalated" ? "text-amber-400" : "text-emerald-400"}`}>
                          {pipelineLogs.status === "escalated" ? "⚠️ Escalated to Owner" : "✓ Auto-handled"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">Confidence Gating</span>
                        <span className="text-xs font-mono font-bold text-slate-300">
                          {Math.round(pipelineLogs.evaluation.confidence * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Step 1: Preprocessor */}
                    <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-400 font-mono">STEP 1: QUERY PREPROCESSOR</span>
                        <span className="text-[9px] bg-slate-950 px-2 py-0.5 border border-slate-850 rounded text-slate-400">
                          Gemini 3.5 Flash JSON
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 bg-slate-950 p-3 rounded-lg border border-slate-900 text-xs">
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase font-mono">Detected Language</span>
                          <span className="text-white font-semibold">{pipelineLogs.preprocessed.detectedLanguage}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase font-mono">Is Gibberish/Noise?</span>
                          <span className={`font-semibold ${pipelineLogs.preprocessed.isGibberishOrNoise ? "text-rose-400" : "text-emerald-400"}`}>
                            {pipelineLogs.preprocessed.isGibberishOrNoise ? "YES (Flagged)" : "No"}
                          </span>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-slate-900">
                          <span className="text-[9px] text-slate-500 block uppercase font-mono">Cleaned Search Query (English)</span>
                          <span className="text-emerald-400 font-mono break-all">{pipelineLogs.preprocessed.cleanedEnglishQuery}</span>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Vector Search */}
                    <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-400 font-mono">STEP 2: RETRIEVE CONTEXT (LOCAL RAG)</span>
                        <span className="text-[9px] bg-slate-950 px-2 py-0.5 border border-slate-850 rounded text-slate-400">
                          gemini-embedding-001 (768d)
                        </span>
                      </div>
                      
                      {pipelineLogs.preprocessed.isGibberishOrNoise ? (
                        <p className="text-xs text-rose-400 bg-rose-500/5 p-3 border border-rose-500/10 rounded-lg">
                          Vector search skipped because query was flagged as gibberish/keysmash.
                        </p>
                      ) : pipelineLogs.retrievedChunks.length === 0 ? (
                        <p className="text-xs text-amber-400 bg-amber-500/5 p-3 border border-amber-500/10 rounded-lg">
                          No matching context chunks found in knowledge base (similarity threshold &lt; 0.25).
                        </p>
                      ) : (
                        <div className="flex flex-col gap-2.5">
                          {pipelineLogs.retrievedChunks.map((chunk: any, i: number) => (
                            <div key={i} className="bg-slate-950 p-3 rounded-lg border border-slate-900 text-xs">
                              <div className="flex justify-between text-[10px] text-slate-500 border-b border-slate-900 pb-1.5 mb-1.5 font-mono">
                                <span>RETRIEVED CHUNK #{i + 1}</span>
                                <span className="text-emerald-400 font-bold">
                                  Similarity: {Math.round(chunk.similarity * 100)}%
                                </span>
                              </div>
                              <p className="text-slate-300 italic leading-relaxed">"{chunk.text}"</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Step 3: Infer & Scoring */}
                    <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-400 font-mono">STEP 3 & 4: INFER & SCORE</span>
                        <span className="text-[9px] bg-slate-950 px-2 py-0.5 border border-slate-850 rounded text-slate-400">
                          gemini-3.5-flash
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-3 bg-slate-950 p-4 rounded-lg border border-slate-900 text-xs">
                        <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-900">
                          <div>
                            <span className="text-[9px] text-slate-500 block uppercase font-mono">Intent Score</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-bold text-slate-200 font-mono">{pipelineLogs.evaluation.intentScore}</span>
                              <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden max-w-[80px]">
                                <div 
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${pipelineLogs.evaluation.intentScore * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 block uppercase font-mono">Estimated Lead Value</span>
                            <span className="font-bold text-emerald-400 text-sm mt-0.5 block">
                              ₹{pipelineLogs.evaluation.estimatedValue}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase font-mono mb-1">Raw System Prompt template</span>
                          <pre className="text-[10px] max-h-36 overflow-y-auto bg-slate-900/80 p-2.5 rounded border border-slate-805 text-slate-400 font-mono leading-relaxed whitespace-pre-wrap select-all">
                            {pipelineLogs.rawPrompt || "No prompt details."}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "inbox" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <span className="text-xs font-mono text-slate-500">REAL-TIME PRIORITY INBOX QUEUE</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono animate-pulse">
                    LIVE UPDATE FEED
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {inboxList.map((conv) => {
                    const isActive = conv.id === "conv-1";
                    
                    let cardBorder = "border-slate-900 hover:border-slate-800 bg-slate-900/20";
                    let statusBadge = "";
                    
                    if (conv.status === "escalated") {
                      cardBorder = "border-amber-500/20 hover:border-amber-500/40 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.02)]";
                      statusBadge = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                    } else if (conv.status === "stale") {
                      cardBorder = "border-rose-500/20 hover:border-rose-500/40 bg-rose-500/5 shadow-[0_0_15px_rgba(239,68,68,0.02)]";
                      statusBadge = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
                    } else if (conv.status === "auto-handled") {
                      cardBorder = "border-emerald-500/10 hover:border-emerald-500/20 bg-slate-900/20 opacity-80";
                      statusBadge = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                    } else {
                      cardBorder = "border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-500/5";
                      statusBadge = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                    }

                    return (
                      <div
                        key={conv.id}
                        className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all hover:scale-[1.01] ${cardBorder} ${
                          isActive ? "ring-2 ring-emerald-500/30" : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-xs font-bold text-white font-mono">{conv.phone}</span>
                            {isActive && (
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 rounded font-mono">
                                active chat
                              </span>
                            )}
                            <span className={`text-[9px] font-mono uppercase px-2 py-0.2 rounded ${statusBadge}`}>
                              {conv.status === "stale" ? "STALE LEAD" : conv.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 truncate max-w-md">"{conv.lastMessage}"</p>
                          
                          {/* Intent indicator */}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[9px] text-slate-500 uppercase font-mono">Intent:</span>
                            <div className="w-24 h-1 bg-slate-950 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-400 rounded-full"
                                style={{ width: `${conv.intent * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-[9px] font-mono text-slate-400">{Math.round(conv.intent * 100)}%</span>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-sm font-bold ${conv.value > 0 ? "text-emerald-400" : "text-slate-500"}`}>
                            ₹{conv.value}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">{conv.time}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "knowledge" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <h3 className="text-xs font-bold text-white uppercase font-mono">Custom Business Knowledge Base</h3>
                  <span className="text-[10px] text-slate-500 font-mono">EDIT TO RETRAIN AI</span>
                </div>

                <div className="flex flex-col gap-4 bg-slate-900/40 p-4 border border-slate-900 rounded-xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">Business Name</label>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">Vertical / Type</label>
                      <input
                        type="text"
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-slate-500 uppercase flex items-center justify-between">
                      <span>Document Text (split on double newlines)</span>
                      <span className="text-[9px] text-emerald-400 font-normal">Supports markdown lists and prices</span>
                    </label>
                    <textarea
                      value={knowledgeText}
                      onChange={(e) => setKnowledgeText(e.target.value)}
                      rows={12}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500/50 leading-relaxed resize-y"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setChatHistory((prev) => [
                        ...prev,
                        {
                          sender: "system",
                          text: "🧠 AI brain successfully re-indexed and updated with new document changes.",
                          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        }
                      ]);
                      setActiveTab("pipeline");
                    }}
                    className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg text-slate-950 text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  >
                    Index Documents & Update AI Brain
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
