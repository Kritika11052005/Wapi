"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/client";
import { 
  Building2, 
  Upload, 
  Smartphone, 
  CheckCircle2, 
  Loader2, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle 
} from "lucide-react";

export default function Onboarding() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Step 1: Business Profile Form State
  const [bizName, setBizName] = useState("");
  const [bizVertical, setBizVertical] = useState("salon");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [city, setCity] = useState("");

  // Step 2: Document State
  const [pastedText, setPastedText] = useState("");
  const [docIndexed, setDocIndexed] = useState(false);
  const [indexedChunksCount, setIndexedChunksCount] = useState(0);

  // Step 3: WhatsApp Verification State
  const [verified, setVerified] = useState(false);
  const [checkingVerify, setCheckingVerify] = useState(false);

  // Authenticate user and fetch current onboarding state
  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/signin");
        return;
      }
      
      // Check if business profile exists
      const { data: biz } = await supabase
        .from("businesses")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (biz) {
        setBusinessId(biz.id);
        setBizName(biz.name || "");
        setBizVertical(biz.vertical || "salon");
        setOwnerPhone(biz.owner_phone || "");
        setCity(biz.city || "");
        
        if (biz.onboarding_complete) {
          router.push("/dashboard");
        } else {
          // If they already have a business profile, move to step 2
          setStep(2);
        }
      }
    }
    checkUser();
  }, [router, supabase]);

  // Step 1 submit: Save business profile
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!bizName || !bizVertical || !ownerPhone || !city) {
      setErrorMsg("All fields are required.");
      return;
    }

    if (!ownerPhone.startsWith("+91") || ownerPhone.length < 13) {
      setErrorMsg("Phone number must start with Indian country code (e.g. +91 98765 43210).");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User session expired.");

      const payload = {
        user_id: user.id,
        name: bizName,
        vertical: bizVertical,
        owner_phone: ownerPhone.replace(/\s+/g, ""),
        city: city,
        confidence_threshold: 0.75,
        stale_window_hours: 2,
        onboarding_complete: false,
      };

      let result;
      if (businessId) {
        // Update existing profile
        result = await supabase
          .from("businesses")
          .update(payload)
          .eq("id", businessId)
          .select()
          .single();
      } else {
        // Insert new profile
        result = await supabase
          .from("businesses")
          .insert(payload)
          .select()
          .single();
      }

      if (result.error) throw result.error;
      
      setBusinessId(result.data.id);
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save business profile.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 submit: Chunk and embed pasted document
  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!pastedText.trim()) {
      setErrorMsg("Please paste pricing, policies, or guidelines for your business.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: "Onboarding paste guide",
          content: pastedText,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to index documents");

      setDocIndexed(true);
      setIndexedChunksCount(data.chunksCount);
      setTimeout(() => {
        setStep(3);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process text embeddings.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3 check: Verify if test WhatsApp conversation exists
  const checkWhatsAppConnection = async () => {
    if (!businessId) return;
    setCheckingVerify(true);
    setErrorMsg("");

    try {
      // Look up if any conversation exists for this business
      const { count, error } = await supabase
        .from("conversations")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId);

      if (error) throw error;

      if (count && count > 0) {
        setVerified(true);
      } else {
        setErrorMsg("No test messages received yet. Please send a test message to your WhatsApp number.");
      }
    } catch (err: any) {
      setErrorMsg("Failed to query verification status.");
    } finally {
      setCheckingVerify(false);
    }
  };

  // Skip verify (or force verify) for easy Hackathon walkthroughs
  const forceVerifyAndComplete = async () => {
    if (!businessId) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("businesses")
        .update({ onboarding_complete: true })
        .eq("id", businessId);

      if (error) throw error;
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg("Failed to complete onboarding.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-950/20 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        
        {/* Onboarding Steps Indicators */}
        <div className="flex justify-between items-center mb-10 max-w-md mx-auto relative">
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-900 -z-10" />
          <div className={`absolute left-0 top-1/2 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 -z-10 transition-all duration-300`} style={{ width: `${(step - 1) * 50}%` }} />

          {[
            { num: 1, label: "Business Profile", icon: Building2 },
            { num: 2, label: "Upload Rules", icon: Upload },
            { num: 3, label: "Connect WhatsApp", icon: Smartphone },
          ].map((s) => {
            const Icon = s.icon;
            const isCompleted = step > s.num;
            const isActive = step === s.num;
            return (
              <div key={s.num} className="flex flex-col items-center gap-2">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                    isCompleted 
                      ? "bg-emerald-500 border-emerald-500 text-slate-950" 
                      : isActive 
                        ? "bg-slate-900 border-emerald-400 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]" 
                        : "bg-slate-950 border-slate-800 text-slate-600"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-[10px] uppercase tracking-wider font-semibold ${isActive ? "text-emerald-400" : "text-slate-500"}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: BUSINESS PROFILE */}
        {step === 1 && (
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-900 rounded-3xl p-8 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-1">Tell us about your business</h2>
              <p className="text-sm text-slate-400">This helps Gemini set the right context for messaging replies.</p>
            </div>

            <form onSubmit={handleProfileSubmit} className="flex flex-col gap-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Business Name</label>
                  <input
                    type="text"
                    required
                    value={bizName}
                    onChange={(e) => setBizName(e.target.value)}
                    placeholder="e.g. Priya's Premium Salon"
                    className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-900 text-slate-100 placeholder:text-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Vertical Sector</label>
                  <select
                    value={bizVertical}
                    onChange={(e) => setBizVertical(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-900 text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="salon">Beauty Salon / Spa</option>
                    <option value="clinic">Medical / Dental Clinic</option>
                    <option value="tutoring">Coaching / Tutoring Centre</option>
                    <option value="gym">Gym / Fitness Studio</option>
                    <option value="other">Other Service Business</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Owner's Phone Number</label>
                  <input
                    type="text"
                    required
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-900 text-slate-100 placeholder:text-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <span className="text-[10px] text-slate-500">Include country code (+91). Used for daily summaries.</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">City Location</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Pune, Maharashtra"
                    className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-900 text-slate-100 placeholder:text-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-4 ml-auto px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold flex items-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: UPLOAD RULES */}
        {step === 2 && (
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-900 rounded-3xl p-8 shadow-2xl">
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Add your pricing & guidelines</h2>
                <p className="text-sm text-slate-400">Paste your price list, policies, FAQ, and operating hours below. Gemini uses this to reply to inquiries.</p>
              </div>
              <button 
                onClick={() => setStep(1)} 
                className="p-2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            {docIndexed ? (
              <div className="py-12 flex flex-col items-center gap-4 text-center">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce" />
                <h3 className="text-xl font-bold text-white">Documents Indexed Successfully!</h3>
                <p className="text-sm text-slate-400 font-mono">✓ Generated {indexedChunksCount} vector embeddings in pgvector.</p>
              </div>
            ) : (
              <form onSubmit={handleDocumentSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Paste Information Guide</label>
                  <textarea
                    rows={8}
                    required
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={`e.g.\nBridal Package: ₹8,500 (Includes Makeup, Hair, Draping)\nHair Cutting: ₹500 (Basic) / ₹900 (Styling)\nOpening Hours: 10 AM to 8 PM (Closed on Mondays)\nLocation: 4th Block MG Road, Pune`}
                    className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-900 text-slate-100 placeholder:text-slate-700 font-mono text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-slate-500 font-medium">Overlapping recursive 400-char splitter config active</span>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold flex items-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Index Content <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* STEP 3: CONNECT WHATSAPP */}
        {step === 3 && (
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-900 rounded-3xl p-8 shadow-2xl">
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Verify WhatsApp Webhook</h2>
                <p className="text-sm text-slate-400">Ensure the Meta cloud integration endpoint is receiving payloads.</p>
              </div>
              <button 
                onClick={() => setStep(2)} 
                className="p-2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-900 mb-6">
              <span className="text-xs uppercase font-bold text-emerald-400 block mb-2 tracking-wider">Test Instructions</span>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                1. Send any test WhatsApp message (e.g. "Hi, what are your rates?") from your phone to the business number configured.
                <br />
                2. Click the verification check below. Wapi checks if the webhook has generated a new conversation log in Supabase.
              </p>
              
              <div className="flex items-center gap-3 py-2">
                <div className={`w-3 h-3 rounded-full ${verified ? "bg-emerald-400 animate-pulse" : "bg-amber-400 animate-ping"}`} />
                <span className="text-xs font-mono text-slate-400">
                  {verified ? "✓ Webhook verified. Incoming messages synced." : "Waiting for test message..."}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
              <button
                onClick={checkWhatsAppConnection}
                disabled={checkingVerify || verified}
                className="w-full sm:w-auto px-6 py-3 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {checkingVerify ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Connection"}
              </button>

              <button
                onClick={forceVerifyAndComplete}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Onboarding"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
