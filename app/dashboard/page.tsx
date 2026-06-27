/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/client";
import {
  MessageSquare,
  Bot,
  Clock,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  Send,
  Settings,
  LogOut,
  Loader2,
  Search,
  AlertCircle,
  HelpCircle
} from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<any>(null);

  // Conversations and messages state
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeTx, setActiveTx] = useState<any>(null);

  // Message composition & nudge state
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [activeNudge, setActiveNudge] = useState<any>(null);
  const [nudgeDraft, setNudgeDraft] = useState("");
  const [loadingNudge, setLoadingNudge] = useState(false);

  // Lead intelligence state
  const [intel, setIntel] = useState<any>(null);
  const [loadingIntel, setLoadingIntel] = useState(false);

  const fetchLeadIntel = useCallback(async (convId: string) => {
    setLoadingIntel(true);
    try {
      const res = await fetch("/api/lead-intel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId }),
      });
      if (res.ok) {
        const data = await res.json();
        setIntel(data);
      }
    } catch (err) {
      console.error("Error fetching lead intel:", err);
    } finally {
      setLoadingIntel(false);
    }
  }, []);

  // UI filter & search states
  const [filter, setFilter] = useState("all"); // 'all' | 'open' | 'escalated' | 'stale' | 'resolved'
  const [search, setSearch] = useState("");

  // Metrics
  const [metrics, setMetrics] = useState({
    active: 0,
    autoHandled: 0,
    escalated: 0,
    stale: 0,
    blocked: 0,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of message thread
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Authenticate user & load initial dataset
  useEffect(() => {
    async function loadDashboard() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/signin");
        return;
      }

      // Fetch business profile
      const { data: biz } = await supabase
        .from("businesses")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!biz) {
        router.push("/onboarding");
        return;
      }

      setBusiness(biz);
      await fetchConversations(biz.id);
      setLoading(false);
    }
    loadDashboard();
  }, [router, supabase]);

  // Polling fallback to keep data fresh (runs every 8 seconds)
  useEffect(() => {
    if (!business) return;
    const interval = setInterval(() => {
      fetchConversations(business.id, false);
    }, 8000);
    return () => clearInterval(interval);
  }, [business, filter]);

  // Real-time Supabase listeners
  useEffect(() => {
    if (!business) return;

    // Subscribe to conversations table updates
    const convChannel = supabase
      .channel("realtime-conversations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations", filter: `business_id=eq.${business.id}` },
        () => {
          fetchConversations(business.id, false);
        }
      )
      .subscribe();

    // Subscribe to messages table updates
    const msgChannel = supabase
      .channel("realtime-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `business_id=eq.${business.id}` },
        (payload) => {
          // If the message belongs to the currently active conversation, append it
          if (selectedConv && payload.new.conversation_id === selectedConv.id) {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
            fetchLeadIntel(selectedConv.id);
          }
          fetchConversations(business.id, false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(convChannel);
      supabase.removeChannel(msgChannel);
    };
  }, [business, selectedConv, fetchLeadIntel]);

  // Fetch all conversations and calculate live metrics
  const fetchConversations = async (bizId: string, showSpinner = true) => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*, customers(*)")
        .eq("business_id", bizId);

      if (error) throw error;

      const convs = data || [];

      // Calculate metrics from all conversations
      const active = convs.filter(c => c.status !== "resolved" && c.status !== "blocked").length;
      const autoHandled = convs.filter(c => c.status === "open" && !c.is_stale).length;
      const escalated = convs.filter(c => c.status === "escalated").length;
      const stale = convs.filter(c => c.is_stale && c.status !== "resolved" && c.status !== "blocked").length;
      const blocked = convs.filter(c => c.status === "blocked").length;

      setMetrics({ active, autoHandled, escalated, stale, blocked });

      // Sort priority: intent_score * estimated_value DESC, last_message_at DESC
      const sortedConvs = [...convs].sort((a, b) => {
        const valA = parseFloat(a.intent_score || "0") * parseFloat(a.estimated_value || "0");
        const valB = parseFloat(b.intent_score || "0") * parseFloat(b.estimated_value || "0");
        if (valA !== valB) return valB - valA;
        return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
      });

      setConversations(sortedConvs);

      // Keep selected conversation up to date
      if (selectedConv) {
        const updatedSelected = sortedConvs.find(c => c.id === selectedConv.id);
        if (updatedSelected) {
          setSelectedConv(updatedSelected);
        }
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  };

  // Fetch messages for selected conversation
  const selectConversation = async (conv: any) => {
    setSelectedConv(conv);
    setMessages([]);
    setActiveNudge(null);
    setNudgeDraft("");
    setActiveTx(null);

    // Fetch active transaction if any
    try {
      const { data: txs } = await supabase
        .from("transactions")
        .select("*")
        .eq("conversation_id", conv.id)
        .order("updated_at", { ascending: false });
      if (txs && txs.length > 0) {
        setActiveTx(txs[0]);
      }
    } catch (txErr) {
      console.warn("Could not fetch transactions:", txErr);
    }

    // Fetch message history
    const { data: msgs, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });

    if (!error) {
      setMessages(msgs || []);
    }

    // Fetch active nudge if the conversation is stale
    if (conv.is_stale) {
      fetchNudge(conv.id);
    }

    // Fetch lead intelligence
    fetchLeadIntel(conv.id);
  };

  // Update transaction status manually
  const handleUpdateTxStatus = async (status: 'confirmed' | 'cancelled') => {
    if (!activeTx) return;
    try {
      const { data, error } = await supabase
        .from("transactions")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", activeTx.id)
        .select()
        .single();
      if (error) throw error;
      setActiveTx(data);
      alert(`Transaction marked as ${status}!`);
    } catch (err: any) {
      alert("Failed to update transaction: " + err.message);
    }
  };

  // Fetch or generate an AI nudge draft
  const fetchNudge = async (convId: string) => {
    setLoadingNudge(true);
    try {
      // Try to find pending nudge first
      const { data: existingNudge } = await supabase
        .from("nudges")
        .select("*")
        .eq("conversation_id", convId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (existingNudge) {
        setActiveNudge(existingNudge);
        setNudgeDraft(existingNudge.draft_content);
      } else {
        // Trigger a new draft generation from route
        const res = await fetch("/api/nudge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: convId, action: "draft" }),
        });
        const data = await res.json();
        if (data.nudge) {
          setNudgeDraft(data.nudge);
          // Query again to get the inserted nudge ID
          const { data: freshNudge } = await supabase
            .from("nudges")
            .select("*")
            .eq("conversation_id", convId)
            .eq("status", "pending")
            .single();
          setActiveNudge(freshNudge);
        }
      }
    } catch (err) {
      console.error("Error loading nudge:", err);
    } finally {
      setLoadingNudge(false);
    }
  };

  // Send manual reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConv || sendingReply) return;

    setSendingReply(true);
    const content = replyText.trim();
    setReplyText("");

    try {
      const response = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          message: content,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to send message");

      // Optimistically append owner message
      setMessages((prev) => [...prev, data.message]);
      fetchConversations(business.id, false);
      fetchLeadIntel(selectedConv.id);
    } catch (err: any) {
      alert(err.message || "Failed to send manual reply.");
    } finally {
      setSendingReply(false);
    }
  };

  // Mark conversation as resolved
  const resolveConversation = async () => {
    if (!selectedConv || !business) return;

    try {
      const { error } = await supabase
        .from("conversations")
        .update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("id", selectedConv.id);

      if (error) throw error;

      // Unselect and refresh
      setSelectedConv(null);
      setMessages([]);
      fetchConversations(business.id, false);
    } catch (err: any) {
      alert("Failed to resolve conversation: " + err.message);
    }
  };

  // Unblock customer
  const unblockCustomer = async () => {
    if (!selectedConv || !business) return;

    try {
      const response = await fetch(`/api/conversations/${selectedConv.id}/unblock`, {
        method: "PATCH",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to unblock customer");

      // Unselect and refresh
      setSelectedConv(null);
      setMessages([]);
      await fetchConversations(business.id, false);
      alert("Customer successfully unblocked!");
    } catch (err: any) {
      alert(err.message || "Failed to unblock customer.");
    }
  };

  // Submit/Send Stale Lead Nudge
  const handleSendNudge = async () => {
    if (!selectedConv || !nudgeDraft.trim()) return;

    setLoadingNudge(true);
    try {
      const res = await fetch("/api/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          action: "send",
          content: nudgeDraft.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to dispatch nudge");

      // Reset nudge state
      setActiveNudge(null);
      setNudgeDraft("");
      // Refresh message thread and list
      selectConversation(selectedConv);
      fetchConversations(business.id, false);
      fetchLeadIntel(selectedConv.id);
    } catch (err: any) {
      alert("Error sending nudge follow-up.");
    } finally {
      setLoadingNudge(false);
    }
  };

  // Dismiss Stale Lead Nudge
  const handleDismissNudge = async () => {
    if (!selectedConv) return;

    setLoadingNudge(true);
    try {
      const res = await fetch("/api/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          action: "dismiss",
        }),
      });

      if (!res.ok) throw new Error("Failed to dismiss nudge");

      // Reset nudge state
      setActiveNudge(null);
      setNudgeDraft("");
      // Refresh list
      fetchConversations(business.id, false);
    } catch (err) {
      console.error("Error dismissing nudge:", err);
    } finally {
      setLoadingNudge(false);
    }
  };

  // Handle Logout
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/signin");
  };

  // Filter and search computation
  const filteredConversations = conversations.filter((c) => {
    // Search filter
    const phone = c.customers?.phone || "";
    const name = c.customers?.display_name || "";
    const matchesSearch =
      phone.toLowerCase().includes(search.toLowerCase()) ||
      name.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    // Status filter
    if (filter === "all") return c.status !== "resolved" && c.status !== "blocked";
    if (filter === "open") return c.status === "open" && !c.is_stale;
    if (filter === "escalated") return c.status === "escalated";
    if (filter === "stale") return c.is_stale && c.status !== "resolved" && c.status !== "blocked";
    if (filter === "resolved") return c.status === "resolved";
    if (filter === "blocked") return c.status === "blocked";

    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <span className="text-sm font-mono text-slate-400">Loading Wapi Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col h-screen overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-950/10 via-slate-950 to-slate-950 pointer-events-none" />

      {/* HEADER NAVBAR */}
      <header className="relative border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="relative bg-slate-900 p-1.5 rounded-lg border border-slate-850">
            <Image
              src="/logo.png"
              alt="Wapi Logo"
              width={26}
              height={26}
              className="rounded"
            />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">WAPI</span>
            <span className="text-[10px] block text-slate-500 font-mono tracking-wider -mt-1">{business?.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/settings"
            className="p-2 rounded-lg border border-slate-900 hover:bg-slate-900 text-slate-400 hover:text-white transition-all"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg border border-slate-900 hover:bg-rose-950/30 hover:border-rose-900/50 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* WORKSPACE LAYOUT */}
      <div className="flex flex-1 overflow-hidden relative z-10">

        {/* LEFT PANEL: LIST & METRICS */}
        <aside className="w-full md:w-[380px] lg:w-[420px] border-r border-slate-900 flex flex-col shrink-0 overflow-hidden bg-slate-950/50">

          {/* STAT STRIP METRICS */}
          <div className="grid grid-cols-4 gap-2 p-4 border-b border-slate-900 shrink-0">
            <button
              onClick={() => setFilter("all")}
              className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${filter === "all" ? "bg-slate-900 border-slate-800" : "bg-transparent border-transparent hover:bg-slate-900/20"
                }`}
            >
              <span className="text-xl font-bold text-white">{metrics.active}</span>
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Active</span>
            </button>
            <button
              onClick={() => setFilter("open")}
              className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${filter === "open" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-transparent border-transparent hover:bg-slate-900/20"
                }`}
            >
              <span className="text-xl font-bold">{metrics.autoHandled}</span>
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Auto</span>
            </button>
            <button
              onClick={() => setFilter("escalated")}
              className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${filter === "escalated" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-transparent border-transparent hover:bg-slate-900/20"
                }`}
            >
              <span className="text-xl font-bold">{metrics.escalated}</span>
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Alerts</span>
            </button>
            <button
              onClick={() => setFilter("stale")}
              className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${filter === "stale" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-transparent border-transparent hover:bg-slate-900/20"
                }`}
            >
              <span className="text-xl font-bold">{metrics.stale}</span>
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Stale</span>
            </button>
          </div>

          {/* SEARCH & FILTERS BAR */}
          <div className="p-4 border-b border-slate-900 flex flex-col gap-3 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search phone or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-900 text-xs text-slate-100 placeholder:text-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto text-[10px] uppercase font-bold tracking-wider text-slate-400">
              {["all", "open", "escalated", "stale", "resolved", "blocked"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full border transition-all shrink-0 cursor-pointer ${filter === f
                      ? "bg-slate-900 border-slate-800 text-white"
                      : "bg-transparent border-transparent hover:bg-slate-900/30"
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* PRIORITY QUEUE LIST */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {filteredConversations.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                <MessageSquare className="w-8 h-8 text-slate-800" />
                <p className="text-xs text-slate-500 font-mono">No active conversations found.</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id;
                const scoreValue = parseFloat(conv.intent_score || "0") * parseFloat(conv.estimated_value || "0");
                const lastMsgTime = new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <div
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 relative ${isSelected
                        ? "bg-slate-900/60 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.03)]"
                        : conv.is_stale
                          ? "bg-rose-950/10 border-rose-900/20 hover:border-rose-900/40"
                          : "bg-slate-900/20 border-slate-900 hover:border-slate-800"
                      }`}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white font-mono">
                          {conv.customers?.phone ? conv.customers.phone.replace(/(\d{5})$/, "*****") : "Unknown"}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {conv.customers?.display_name || "WhatsApp Customer"}
                        </span>
                      </div>

                      {/* Value & Status Badges */}
                      <div className="flex flex-col items-end gap-1">
                        {parseFloat(conv.estimated_value) > 0 && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${parseFloat(conv.estimated_value) >= 5000
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            }`}>
                            ₹{Math.round(conv.estimated_value)}
                          </span>
                        )}
                        <span className="text-[8px] text-slate-500 font-mono">{lastMsgTime}</span>
                      </div>
                    </div>

                    {/* Status markers */}
                    <div className="flex items-center justify-between gap-4 mt-1">
                      <div className="flex items-center gap-1.5">
                        {conv.status === "blocked" && (
                          <span className="text-[9px] font-semibold text-[#ff6b6b] bg-[#1a0a0a] px-1.5 py-0.2 rounded border border-[#ff6b6b]/30">
                            🚫 BLOCKED
                          </span>
                        )}
                        {conv.status === "escalated" && (
                          <span className="text-[9px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                            ESCALATED
                          </span>
                        )}
                        {conv.is_stale && (
                          <span className="text-[9px] font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20 animate-pulse">
                            STALE LEAD
                          </span>
                        )}
                        {conv.status === "open" && !conv.is_stale && (
                          <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                            AUTO-HANDLED
                          </span>
                        )}
                      </div>

                      {/* Intent score indicator bar */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[8px] font-mono text-slate-500">Intent: {Math.round((conv.intent_score || 0) * 100)}%</span>
                        <div className="w-12 h-1 bg-slate-900 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-400 h-full"
                            style={{ width: `${(conv.intent_score || 0) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* RIGHT PANEL: CONVERSATION PANEL */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">

          {selectedConv ? (
            <div className="flex-1 flex overflow-hidden h-full">
              {/* CHAT CONTAINER */}
              <div className="flex-1 flex flex-col overflow-hidden h-full border-r border-slate-900">
                {/* Conversation Header */}
                <div className="border-b border-slate-900 p-4 bg-slate-950/80 backdrop-blur-md flex items-center justify-between shrink-0">
                  <div className="flex flex-col">
                    <h3 className="text-base font-bold text-white font-mono">{selectedConv.customers?.phone}</h3>
                    <p className="text-xs text-slate-400">
                      Status: <span className="capitalize text-slate-300 font-semibold">{selectedConv.status}</span>
                      {selectedConv.estimated_value > 0 && ` · Est. Value: ₹${selectedConv.estimated_value}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedConv.status === "blocked" && (
                      <button
                        onClick={unblockCustomer}
                        className="px-4 py-2 rounded-lg bg-red-950/20 border border-red-900/30 hover:bg-red-900/10 text-xs font-semibold text-red-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        🚫 Unblock Customer
                      </button>
                    )}
                    {selectedConv.status !== "resolved" && selectedConv.status !== "blocked" && (
                      <button
                        onClick={resolveConversation}
                        className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Mark Resolved
                      </button>
                    )}
                  </div>
                </div>

                {/* Transaction Banner */}
                {activeTx && (
                  <div className={`px-4 py-3 border-b flex items-center justify-between z-10 text-xs shrink-0 ${
                    activeTx.status === 'confirmed'
                      ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400'
                      : activeTx.status === 'cancelled'
                        ? 'bg-red-950/20 border-red-900/30 text-red-400'
                        : 'bg-indigo-950/20 border-indigo-900/30 text-indigo-400'
                  }`}>
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {activeTx.type === 'appointment' && <span className="text-sm shrink-0">📅</span>}
                      {activeTx.type === 'order' && <span className="text-sm shrink-0">🛍️</span>}
                      {activeTx.type === 'subscription' && <span className="text-sm shrink-0">💳</span>}
                      <div className="truncate">
                        <span className="font-bold uppercase tracking-wider text-[9px] font-mono mr-1.5 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                          {activeTx.type}: {activeTx.status}
                        </span>
                        <span className="text-slate-300">
                          {activeTx.type === 'appointment' && `${activeTx.details?.service || 'Appointment'} - Date: ${activeTx.details?.date || 'N/A'}, Time: ${activeTx.details?.time || 'N/A'}`}
                          {activeTx.type === 'order' && `${activeTx.details?.product || 'Product'} (Qty: ${activeTx.details?.quantity || 1}) - Deliver: ${activeTx.details?.address || 'N/A'}`}
                          {activeTx.type === 'subscription' && `${activeTx.details?.plan || 'Plan'} membership (Email: ${activeTx.details?.email || 'N/A'})`}
                        </span>
                        {activeTx.value > 0 && (
                          <span className="ml-2 font-mono font-bold text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            ₹{activeTx.value}
                          </span>
                        )}
                      </div>
                    </div>
                    {activeTx.status === 'collecting' && (
                      <div className="flex gap-1.5 shrink-0 ml-2">
                        <button
                          onClick={() => handleUpdateTxStatus('confirmed')}
                          className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold tracking-tight cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleUpdateTxStatus('cancelled')}
                          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Chat Thread */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-600 font-mono text-xs">
                      Fetching message history...
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isCustomer = m.role === "customer";
                      const isOwner = m.role === "owner";
                      const isEscalation = m.role === "escalation";

                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col max-w-[70%] ${isCustomer ? "mr-auto items-start" : "ml-auto items-end"
                            }`}
                        >
                          {/* Bubble */}
                          <div
                            className={`p-4 rounded-2xl text-sm leading-relaxed ${isCustomer
                                ? "bg-slate-900 border border-slate-850 text-slate-100 rounded-tl-sm"
                                : isOwner
                                  ? "bg-slate-100 text-slate-950 font-medium rounded-tr-sm"
                                  : isEscalation
                                    ? "bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-tr-sm"
                                    : "bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 rounded-tr-sm"
                              }`}
                          >
                            <p>{m.content}</p>
                          </div>

                          {/* Meta */}
                          <span className="text-[9px] font-mono text-slate-600 mt-1 uppercase tracking-wider">
                            {isCustomer ? "Customer" : isOwner ? "You" : isEscalation ? "Escalation Alert" : "Wapi Agent"}
                            {parseFloat(m.confidence_score) > 0 && ` (Conf: ${Math.round(m.confidence_score * 100)}%)`}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* STALE LEAD NUDGE PANEL */}
                {selectedConv.is_stale && selectedConv.status !== "resolved" && (
                  <div className="border-t border-slate-900 bg-slate-900/40 p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-rose-400 animate-pulse shrink-0" />
                        <span className="text-xs font-bold text-rose-400">⚠️ Stale Lead Warning (Went quiet for 2+ hours)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleDismissNudge}
                          className="text-[10px] uppercase font-bold text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">AI-Drafted Response suggestion</span>
                      {loadingNudge ? (
                        <div className="h-14 bg-slate-950 rounded-lg flex items-center justify-center">
                          <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <textarea
                            aria-label="text"
                            rows={2}
                            value={nudgeDraft}
                            onChange={(e) => setNudgeDraft(e.target.value)}
                            className="flex-1 px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-900 text-slate-300 focus:outline-none focus:border-rose-500 font-sans"
                          />
                          <button
                            onClick={handleSendNudge}
                            disabled={!nudgeDraft.trim()}
                            className="px-4 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" /> Send Nudge
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* MANUAL REPLY COMPOSER */}
                {selectedConv.status !== "resolved" && (
                  <form
                    onSubmit={handleSendReply}
                    className="border-t border-slate-900 p-4 bg-slate-950/80 backdrop-blur-md flex items-center gap-3 shrink-0"
                  >
                    <textarea
                      rows={1}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type a manual response... (Bypasses AI)"
                      className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-850 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none font-sans"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply(e);
                        }
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim() || sendingReply}
                      className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 flex items-center justify-center hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 cursor-pointer"
                    >
                      {sendingReply ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* LEAD INTELLIGENCE PANEL (Right Sidebar) */}
              <aside className="hidden lg:flex w-80 bg-slate-950/40 p-5 flex-col gap-5 overflow-y-auto shrink-0 z-10 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/90 to-slate-950 pointer-events-none" />
                <div className="relative z-10 flex flex-col gap-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-900">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-emerald-400" />
                      <span className="font-mono text-xs uppercase tracking-wider text-slate-400 font-bold">Lead Intelligence</span>
                    </div>
                    {intel?.leadWarmth && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider font-mono ${
                        intel.leadWarmth === 'Hot'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : intel.leadWarmth === 'Warm'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {intel.leadWarmth} Lead
                      </span>
                    )}
                  </div>

                  {loadingIntel ? (
                    <div className="flex flex-col gap-4 py-8">
                      <div className="h-4 bg-slate-900/60 rounded animate-pulse w-3/4" />
                      <div className="h-16 bg-slate-900/60 rounded animate-pulse" />
                      <div className="h-4 bg-slate-900/60 rounded animate-pulse w-1/2" />
                      <div className="h-20 bg-slate-900/60 rounded animate-pulse" />
                    </div>
                  ) : intel ? (
                    <>
                      <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-4 flex flex-col gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Conversation Summary</span>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">{intel.summary}</p>
                      </div>

                      <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-4 flex flex-col gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Promised / Agreed</span>
                        <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-950 p-2 rounded border border-slate-900/80">
                          {intel.promised || "Nothing promised yet."}
                        </p>
                      </div>

                      <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-4 flex flex-col gap-3">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Suggested Next Actions</span>
                        <div className="flex flex-col gap-2.5">
                          {intel.nextActions?.map((action: string, idx: number) => (
                            <div key={idx} className="flex gap-2.5 items-start">
                              <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 text-[10px] font-mono font-bold">
                                {idx + 1}
                              </span>
                              <span className="text-xs text-slate-300 leading-normal font-sans">{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
                      <HelpCircle className="w-8 h-8 text-slate-800" />
                      <p className="text-xs text-slate-600 font-mono">No intelligence compiled for this lead yet.</p>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <div className="relative mb-4">
                <div className="absolute -inset-2 bg-emerald-500/5 rounded-full blur-xl animate-pulse" />
                <MessageSquare className="w-12 h-12 text-slate-800 relative" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Select a conversation</h3>
              <p className="text-xs text-slate-500 max-w-xs font-mono">
                Click on any card in the priority queue to view message history, take manual control, or send follow-ups.
              </p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
