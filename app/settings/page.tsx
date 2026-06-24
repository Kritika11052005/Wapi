/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/client";
import {
  ArrowLeft,
  Settings,
  FileText,
  Sliders,
  Bell,
  User,
  Trash2,
  Plus,
  Loader2,
  Check,
  AlertCircle
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState("documents");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [business, setBusiness] = useState<any>(null);

  // Tab 1: Documents state
  const [documents, setDocuments] = useState<any[]>([]);
  const [pastedText, setPastedText] = useState("");
  const [indexing, setIndexing] = useState(false);

  // Tab 2: AI Settings state
  const [threshold, setThreshold] = useState(0.75);
  const [staleHours, setStaleHours] = useState(2);

  // Tab 3: Notifications state
  const [summaryEnabled, setSummaryEnabled] = useState(true);

  // Tab 4: Account state
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    async function loadSettings() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/signin");
        return;
      }

      setUserEmail(user.email || "");

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
      setThreshold(parseFloat(biz.confidence_threshold || "0.75"));
      setStaleHours(biz.stale_window_hours || 2);
      setSummaryEnabled(biz.daily_summary_enabled ?? true);

      // Fetch documents list
      await fetchDocuments(biz.id);
      setLoading(false);
    }
    loadSettings();
  }, [router, supabase]);

  const fetchDocuments = async (bizId: string) => {
    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("business_id", bizId)
      .order("created_at", { ascending: false });

    setDocuments(data || []);
  };

  // Upload/Index new document paste
  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim() || !business) return;

    setIndexing(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: `Manual Paste (${new Date().toLocaleDateString()})`,
          content: pastedText,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process text");

      setPastedText("");
      setSuccessMsg("✓ Document chunked and indexed successfully!");
      await fetchDocuments(business.id);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload document.");
    } finally {
      setIndexing(false);
    }
  };

  // Delete document (cascading delete removes chunks too)
  const handleDeleteDocument = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document? All associated AI context search chunks will be permanently removed.") || !business) {
      return;
    }

    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", docId);

      if (error) throw error;
      setSuccessMsg("Document deleted.");
      await fetchDocuments(business.id);
    } catch (err: any) {
      setErrorMsg("Failed to delete document: " + err.message);
    }
  };

  // Save AI and Notification Settings
  const handleSaveSettings = async () => {
    if (!business) return;
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error } = await supabase
        .from("businesses")
        .update({
          confidence_threshold: threshold,
          stale_window_hours: staleHours,
          daily_summary_enabled: summaryEnabled,
        })
        .eq("id", business.id);

      if (error) throw error;
      setSuccessMsg("Settings updated successfully!");
    } catch (err: any) {
      setErrorMsg("Failed to update settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-950/10 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Settings Header */}
      <header className="relative border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg border border-slate-900 hover:bg-slate-900 text-slate-400 hover:text-white transition-all mr-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <h1 className="text-lg font-bold text-white tracking-tight">System Settings</h1>
          </div>
        </div>
      </header>

      {/* Main Settings Panel */}
      <main className="relative flex-1 max-w-5xl w-full mx-auto px-6 py-10 flex flex-col md:flex-row gap-8 z-10">

        {/* Tab Selector Links */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col gap-1.5">
          {[
            { id: "documents", label: "Documents Store", icon: FileText },
            { id: "ai", label: "AI Settings", icon: Sliders },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "account", label: "Account Profile", icon: User },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-semibold transition-all border text-left cursor-pointer ${isActive
                    ? "bg-slate-900 border-slate-800 text-emerald-400 shadow-lg"
                    : "bg-transparent border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-white"
                  }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </aside>

        {/* Tab Panels content */}
        <section className="flex-1 bg-slate-900/30 border border-slate-900/60 rounded-3xl p-8 backdrop-blur-md">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-400 text-sm animate-pulse">
              <Check className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: DOCUMENTS MANAGEMENT */}
          {activeTab === "documents" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Knowledge Documents Store</h2>
                <p className="text-xs text-slate-400">View and update pricing files, guides, or rules indexed in vector space.</p>
              </div>

              {/* Paste document form */}
              <form onSubmit={handleAddDocument} className="p-5 rounded-2xl bg-slate-950/80 border border-slate-900 flex flex-col gap-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><Plus className="w-4 h-4" /> Paste new content</span>
                <textarea
                  rows={4}
                  required
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste details here..."
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-850 text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="submit"
                  disabled={indexing}
                  className="ml-auto px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {indexing ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : "Index Document"}
                </button>
              </form>

              {/* Document List */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Indexed Files ({documents.length})</span>
                {documents.length === 0 ? (
                  <p className="text-xs text-slate-600 font-mono py-4">No documents uploaded yet.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-4 rounded-xl border border-slate-900/60 bg-slate-950/30 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-200">{doc.filename}</span>
                            <span className="text-[10px] text-slate-500 font-mono uppercase">
                              {doc.status} · {doc.chunk_count} chunks · {Math.round(doc.file_size / 1024)} KB
                            </span>
                          </div>
                        </div>

                        <button
                          aria-label="button"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-2 rounded-lg hover:bg-rose-950/20 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: AI SETTINGS */}
          {activeTab === "ai" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">AI Parameters Tuning</h2>
                <p className="text-xs text-slate-400">Adjust the confidence gating thresholds for the RAG search and model responses.</p>
              </div>

              <div className="flex flex-col gap-5 py-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <span>Confidence Threshold</span>
                    <span className="font-mono text-emerald-400 font-bold">{threshold}</span>
                  </div>
                  <input
                    aria-label="input"
                    type="range"
                    min="0.50"
                    max="0.95"
                    step="0.05"
                    value={threshold}
                    onChange={(e) => setThreshold(parseFloat(e.target.value))}
                    className="w-full accent-emerald-400 bg-slate-950"
                  />
                  <span className="text-[10px] text-slate-500 leading-normal">
                    AI responses scoring below this score are automatically redirected to owner escalation alerts rather than being dispatched to the customer.
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <span>Stale Conversation Threshold</span>
                    <span className="font-mono text-emerald-400 font-bold">{staleHours} Hours</span>
                  </div>
                  <select
                    aria-label="select"
                    value={staleHours}
                    onChange={(e) => setStaleHours(parseInt(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-900 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value={1}>1 Hour</option>
                    <option value={2}>2 Hours (Recommended)</option>
                    <option value={4}>4 Hours</option>
                    <option value={8}>8 Hours</option>
                  </select>
                  <span className="text-[10px] text-slate-500 leading-normal">
                    Duration of customer silence before the conversation is tagged as a &quot;Stale Lead&quot; triggering follow-up nudge draft generation.
                  </span>
                </div>
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="mt-4 ml-auto px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </button>
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Owner Notifications</h2>
                <p className="text-xs text-slate-400">Manage daily business report delivery preferences.</p>
              </div>

              <div className="py-4 flex items-center justify-between gap-4 p-5 rounded-2xl bg-slate-950/80 border border-slate-900">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-white">Daily WhatsApp summary reports</span>
                  <span className="text-[10px] text-slate-500 max-w-md">
                    Deliver a morning digest summarizing open items, auto-replied statistics, and highest value leads directly to {business?.owner_phone}.
                  </span>
                </div>

                <input
                  aria-label="input"
                  type="checkbox"
                  checked={summaryEnabled}
                  onChange={(e) => setSummaryEnabled(e.target.checked)}
                  className="w-5 h-5 accent-emerald-400"
                />
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="mt-4 ml-auto px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </button>
            </div>
          )}

          {/* TAB 4: ACCOUNT MANAGEMENT */}
          {activeTab === "account" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Account details</h2>
                <p className="text-xs text-slate-400">View profile credentials.</p>
              </div>

              <div className="flex flex-col gap-1.5 py-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Authenticated Email</label>
                <input
                  aria-label="input"
                  type="text"
                  readOnly
                  value={userEmail}
                  className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-900 text-slate-400 text-xs focus:outline-none select-all"
                />
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
