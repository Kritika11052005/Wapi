/* eslint-disable react-hooks/purity */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/client";
import {
  MessageSquare,
  Bot,
  Layers,
  Sparkles,
  Clock,
  Database,
  Send,
  Smartphone,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  FileText,
  User,
  CheckCircle,
  HelpCircle,
  Eye,
  Sliders,
  Building,
  RefreshCw,
  Calendar
} from "lucide-react";

interface Message {
  sender: "customer" | "agent" | "owner" | "system";
  text: string;
  timestamp: string;
  isVoiceNote?: boolean;
  transcribing?: boolean;
  transcriptionText?: string;
  duration?: string;
  transaction?: {
    type: "appointment" | "order" | "subscription";
    status: "collecting" | "confirmed";
    details: any;
    value: number;
  };
}

interface Conversation {
  id: string;
  phone: string;
  lastMessage: string;
  time: string;
  value: number;
  intent: number;
  status: "open" | "auto-handled" | "escalated" | "stale" | "blocked";
  chatHistory?: Message[];
  sandboxTransaction?: any;
  pipelineLogs?: any;
  guardHarassmentCount?: number;
  guardIsBlocked?: boolean;
  guardLastMessageHash?: string | null;
  guardRepeatCount?: number;
  guardLastRepeatAt?: string | null;
  isStale?: boolean;
}

interface PresetQuery {
  text: string;
  label: string;
}

const TEMPLATES = [
  {
    id: "salon",
    name: "Kritika's Beauty Studio",
    type: "Beauty Salon",
    label: "💇‍♀️ Beauty Salon & Spa",
    knowledge: `Kritika's Beauty Studio Pricing & Policies:

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
- Cancellations: Full refund of advance booking if canceled 24 hours prior.`,
    presets: [
      { text: "kaha hai tumhara shop?", label: "🇮🇳 Hinglish" },
      { text: "haircut cha rate kay aahe?", label: "🇮🇳 Marathi" },
      { text: "what the price of women haircut", label: "🇬🇧 Typos" },
      { text: "donde esta su tienda?", label: "🇪🇸 Spanish" },
      { text: "asdfghjklzxcvbnm", label: "⚠️ Gibberish" },
      { text: "i want to book the VIP Bridal Package for ₹8500 this Sunday", label: "💰 High Value" }
    ]
  },
  {
    id: "bakery",
    name: "The Sweet Tooth Bakery",
    type: "Bakery & Cafe",
    label: "🍰 Gourmet Bakery & Cafe",
    knowledge: `The Sweet Tooth Bakery Menu & Delivery Policies:

1. Menu & Pricing:
- Chocolate Truffle Cake: ₹600 for 1/2 kg, ₹1,100 for 1 kg.
- Red Velvet Cupcake: ₹80 each, box of 6 for ₹450.
- Sourdough Bread: ₹200 per loaf (freshly baked daily at 8 AM).
- Butter Croissant: ₹150 each.
- Custom Cake: Starts at ₹1,500 per kg (requires 24 hours pre-order).

2. Operations & Location:
- Address: FC Road, Shivajinagar, Pune (next to Star Cafe).
- Timings: 8:00 AM to 9:00 PM (Open all days).
- Delivery: Free home delivery within 3 km for orders above ₹500. For other areas, standard charge of ₹50 applies.

3. Special Orders:
- All custom cakes require 50% advance payment.
- Eggless options are available for all cakes at no extra cost.`,
    presets: [
      { text: "kya cake order pe banate ho?", label: "🇮🇳 Hinglish" },
      { text: "cake cha rate sanga", label: "🇮🇳 Marathi" },
      { text: "diliver to my home?", label: "🇬🇧 Typos" },
      { text: "¿dónde está la panadería?", label: "🇪🇸 Spanish" },
      { text: "qwertyuiopasdfghjkl", label: "⚠️ Gibberish" },
      { text: "i want to order 3 tier Chocolate Truffle Cake for ₹5000", label: "💰 High Value" }
    ]
  },
  {
    id: "dental",
    name: "Smile Dental Care",
    type: "Dental Clinic",
    label: "🦷 Dental Clinic",
    knowledge: `Smile Dental Care Services & Appointments:

1. Services & Treatment Fees:
- Dental Consultation: ₹300 (includes digital X-ray if needed).
- Teeth Cleaning & Scaling: ₹1,200.
- Root Canal Treatment (RCT): ₹4,500 per tooth.
- Ceramic Crown / Cap: ₹6,000 onwards.
- Dental Implant: ₹25,000 (standard titanium implant).

2. Practice Info & Address:
- Address: 2nd Floor, Apex Heights, Kothrud, Pune.
- Operating Hours: Mon-Sat 9:30 AM to 1:30 PM, 5:00 PM to 8:30 PM. Closed on Sundays.
- Bookings: Prior appointment is highly recommended to avoid wait times. Emergency walk-ins are handled based on dentist availability.

3. Policies:
- We accept cash, UPI, and credit cards.
- Follow-up checkup within 7 days of treatment is free.`,
    presets: [
      { text: "teeth whitening cost kitna hai?", label: "🇮🇳 Hinglish" },
      { text: "root canal treatment cha kharch kiti aahe?", label: "🇮🇳 Marathi" },
      { text: "cleaning teeth charge", label: "🇬🇧 Typos" },
      { text: "¿tienen citas hoy?", label: "🇪🇸 Spanish" },
      { text: "zxcvbnmpoiuytrewq", label: "⚠️ Gibberish" },
      { text: "i want to book a Dental Implant session for ₹25000", label: "💰 High Value" }
    ]
  },
  {
    id: "gym",
    name: "Iron Paradise Gym",
    type: "Fitness Center",
    label: "💪 Fitness Gym",
    knowledge: `Iron Paradise Gym Memberships & Rules:

1. Membership Plans:
- Monthly Pass: ₹1,500 (gym access only).
- 3-Month Plan: ₹4,000 (includes basic body composition assessment).
- Annual Membership: ₹12,000 (best value, includes 10 personal trainer trial sessions).
- Personal Training: ₹5,000 per month (one-on-one coaching, 12 sessions).

2. Facility Info & Timings:
- Location: 3rd Floor, Platinum Plaza, Baner Road, Pune.
- Hours: Mon-Sat: 5:00 AM to 10:00 PM. Sun: 7:00 AM to 12:00 PM.
- Facilities: Cardio section, free weights area, steam room, and lockers.

3. Gym Rules:
- Clean sports shoes must be worn on the gym floor.
- Towel is mandatory during workouts.
- Lockers are for daily use only; overnight storage is not allowed.`,
    presets: [
      { text: "trial batch milega kya?", label: "🇮🇳 Hinglish" },
      { text: "gym timing kay aahe?", label: "🇮🇳 Marathi" },
      { text: "personal training price", label: "🇬🇧 Typos" },
      { text: "¿cuánto cuesta la mensualidad?", label: "🇪🇸 Spanish" },
      { text: "mnbvcxzlkjhgfdsa", label: "⚠️ Gibberish" },
      { text: "i want to sign up for the Yearly Membership with Personal Trainer for ₹17000", label: "💰 High Value" }
    ]
  },
  {
    id: "custom",
    name: "",
    type: "",
    label: "✨ Custom Business",
    knowledge: `[Enter your business details, products, prices, address, and timings here...]`,
    presets: []
  }
];

function generateRandomPhone(): string {
  const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join("");
  return `+91 9${digits}`;
}

function getBusinessStorageKey(name: string, description: string): string {
  let hash = 0;
  const descStr = (description || "").trim().toLowerCase();
  for (let i = 0; i < descStr.length; i++) {
    const char = descStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `wapi_demo_state_${name.trim().toLowerCase()}_desc_${Math.abs(hash)}`;
}

function getInitialInboxForTemplate(
  templateId: string,
  businessName: string,
  businessType: string,
  presets: PresetQuery[]
): Conversation[] {
  // Card 1: The active simulator card
  const card1: Conversation = {
    id: "conv-1",
    phone: generateRandomPhone(),
    lastMessage: `Hello! Welcome to ${businessName}...`,
    time: "Just now",
    value: 0,
    intent: 0.2,
    status: "auto-handled",
    chatHistory: [
      {
        sender: "system",
        text: `WhatsApp chat session initialized with ${businessName}.`,
        timestamp: "10:00 AM"
      },
      {
        sender: "agent",
        text: `Hello! Welcome to ${businessName}. How can we help you today?`,
        timestamp: "10:00 AM"
      }
    ],
    sandboxTransaction: null,
    pipelineLogs: null,
    guardHarassmentCount: 0,
    guardIsBlocked: false,
    guardLastMessageHash: null,
    guardRepeatCount: 0,
    guardLastRepeatAt: null,
    isStale: false,
  };

  // Card 2: An open lead with high/medium intent
  const card2Phone = generateRandomPhone();
  let card2Message = "";
  let card2Value = 1500;
  let card2Intent = 0.75;

  // Card 3: An auto-handled lead with low value/intent
  const card3Phone = generateRandomPhone();
  let card3Message = "";
  let card3Value = 0;
  let card3Intent = 0.4;

  if (templateId === "salon") {
    card2Message = presets[2]?.text || "what the price of women haircut";
    card2Value = 2000;
    card2Intent = 0.75;

    card3Message = presets[0]?.text || "kaha hai tumhara shop?";
    card3Value = 0;
    card3Intent = 0.4;
  } else if (templateId === "bakery") {
    card2Message = presets[2]?.text || "diliver to my home?";
    card2Value = 1100;
    card2Intent = 0.70;

    card3Message = presets[3]?.text || "¿dónde está la panadería?";
    card3Value = 0;
    card3Intent = 0.35;
  } else if (templateId === "dental") {
    card2Message = presets[1]?.text || "root canal treatment cha kharch kiti aahe?";
    card2Value = 4500;
    card2Intent = 0.85;

    card3Message = presets[0]?.text || "teeth whitening cost kitna hai?";
    card3Value = 1200;
    card3Intent = 0.50;
  } else if (templateId === "gym") {
    card2Message = presets[2]?.text || "personal training price";
    card2Value = 5000;
    card2Intent = 0.80;

    card3Message = presets[1]?.text || "gym timing kay aahe?";
    card3Value = 1500;
    card3Intent = 0.45;
  } else {
    // Custom business or customized templates
    card2Message = presets[2]?.text || presets[1]?.text || `I want to check rates for ${businessType}`;

    // Try to extract value from dynamic presets
    let extractedVal = 1500;
    presets.forEach(p => {
      const match = p.text.match(/₹\s*(\d+)/);
      if (match) {
        extractedVal = Math.round(parseInt(match[1]) * 0.4); // standard service is ~40% of VIP package
      }
    });
    card2Value = extractedVal;
    card2Intent = 0.70;

    card3Message = presets[0]?.text || `Where is ${businessName} located?`;
    card3Value = 0;
    card3Intent = 0.40;
  }

  const card2: Conversation = {
    id: "conv-2",
    phone: card2Phone,
    lastMessage: card2Message,
    time: "10m ago",
    value: card2Value,
    intent: card2Intent,
    status: "open",
    chatHistory: [
      {
        sender: "system",
        text: `WhatsApp chat session initialized with ${businessName}.`,
        timestamp: "09:50 AM"
      },
      {
        sender: "agent",
        text: `Hello! Welcome to ${businessName}. How can we help you today?`,
        timestamp: "09:50 AM"
      },
      {
        sender: "customer",
        text: card2Message,
        timestamp: "10m ago"
      }
    ],
    sandboxTransaction: null,
    pipelineLogs: null,
    guardHarassmentCount: 0,
    guardIsBlocked: false,
    guardLastMessageHash: null,
    guardRepeatCount: 0,
    guardLastRepeatAt: null,
    isStale: false,
  };

  const card3: Conversation = {
    id: "conv-3",
    phone: card3Phone,
    lastMessage: card3Message,
    time: "1h ago",
    value: card3Value,
    intent: card3Intent,
    status: "auto-handled",
    chatHistory: [
      {
        sender: "system",
        text: `WhatsApp chat session initialized with ${businessName}.`,
        timestamp: "09:00 AM"
      },
      {
        sender: "agent",
        text: `Hello! Welcome to ${businessName}. How can we help you today?`,
        timestamp: "09:00 AM"
      },
      {
        sender: "customer",
        text: card3Message,
        timestamp: "1h ago"
      }
    ],
    sandboxTransaction: null,
    pipelineLogs: null,
    guardHarassmentCount: 0,
    guardIsBlocked: false,
    guardLastMessageHash: null,
    guardRepeatCount: 0,
    guardLastRepeatAt: null,
    isStale: false,
  };

  return [card1, card2, card3];
}

export default function DemoPage() {
  const supabase = createClient();
  const [dbBusiness, setDbBusiness] = useState<any>(null);
  const [dbConversations, setDbConversations] = useState<Conversation[]>([]);
  const [dbTransactions, setDbTransactions] = useState<any[]>([]);

  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [setupTemplate, setSetupTemplate] = useState("salon");
  const [setupBusinessName, setSetupBusinessName] = useState("Kritika's Beauty Studio");
  const [setupBusinessType, setSetupBusinessType] = useState("Beauty Salon");
  const [setupKnowledgeText, setSetupKnowledgeText] = useState(TEMPLATES[0].knowledge);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingStepText, setLoadingStepText] = useState("");

  const [presets, setPresets] = useState<PresetQuery[]>(TEMPLATES[0].presets);

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
  const [knowledgeText, setKnowledgeText] = useState(TEMPLATES[0].knowledge);

  // ── Guard Pipeline State (in-memory, mirrors DB columns) ──
  const [guardHarassmentCount, setGuardHarassmentCount] = useState(0);
  const [guardIsBlocked, setGuardIsBlocked] = useState(false);
  const [guardLastMessageHash, setGuardLastMessageHash] = useState<string | null>(null);
  const [guardRepeatCount, setGuardRepeatCount] = useState(0);
  const [guardLastRepeatAt, setGuardLastRepeatAt] = useState<string | null>(null);

  // Speech Recognition / MediaRecorder States
  const [isListening, setIsListening] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasMedia = !!(navigator.mediaDevices && (window as any).MediaRecorder);
      setRecognitionSupported(hasMedia);
    }
  }, []);

  const startTimeRef = useRef<number>(0);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());

        const durationMs = Date.now() - startTimeRef.current;
        const durationSeconds = Math.round(durationMs / 1000);
        const m = Math.floor(durationSeconds / 60);
        const s = durationSeconds % 60;
        const durationStr = `${m}:${s < 10 ? '0' : ''}${s}`;

        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });

        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Data = (reader.result as string).split(",")[1];

          try {
            await handleSendMessage(undefined, { base64: base64Data, mimeType: mediaRecorder.mimeType }, durationStr);
          } catch (err) {
            console.error("Failed to send voice message:", err);
          }
        };
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      console.error("Failed to start voice capture:", err);
      alert("Microphone access denied or unsupported format.");
      setIsListening(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Active sandbox inbox
  const [inboxList, setInboxList] = useState<Conversation[]>(() => {
    return getInitialInboxForTemplate("salon", "Kritika's Beauty Studio", "Beauty Salon", TEMPLATES[0].presets);
  });

  const [activeConversationId, setActiveConversationId] = useState<string>("conv-1");

  const selectConversation = (id: string) => {
    if (id === activeConversationId) return;

    setInboxList((prev) => {
      const nextConv = prev.find((c) => c.id === id);
      if (nextConv) {
        setChatHistory(nextConv.chatHistory || []);
        setSandboxTransaction(nextConv.sandboxTransaction || null);
        setPipelineLogs(nextConv.pipelineLogs || null);
        setGuardHarassmentCount(nextConv.guardHarassmentCount || 0);
        setGuardIsBlocked(nextConv.guardIsBlocked || false);
        setGuardLastMessageHash(nextConv.guardLastMessageHash || null);
        setGuardRepeatCount(nextConv.guardRepeatCount || 0);
        setGuardLastRepeatAt(nextConv.guardLastRepeatAt || null);
        setIsStale(nextConv.isStale || false);
      }

      return prev.map((c) => {
        if (c.id === activeConversationId) {
          return {
            ...c,
            chatHistory,
            sandboxTransaction,
            pipelineLogs,
            guardHarassmentCount,
            guardIsBlocked,
            guardLastMessageHash,
            guardRepeatCount,
            guardLastRepeatAt,
            isStale,
          };
        }
        return c;
      });
    });

    setActiveConversationId(id);
  };

  const [activeTab, setActiveTab] = useState<"inbox" | "knowledge" | "pipeline" | "bookings">("bookings");
  const [sandboxTransaction, setSandboxTransaction] = useState<any>(null);
  const [completedTransactions, setCompletedTransactions] = useState<any[]>([]);
  const [pipelineLogs, setPipelineLogs] = useState<any>(null);
  const [isStale, setIsStale] = useState(false);
  const [nudgeDraft, setNudgeDraft] = useState("");
  const [isGeneratingNudge, setIsGeneratingNudge] = useState(false);
  const [crmReplyMessage, setCrmReplyMessage] = useState("");
  const [staleTimeLimit, setStaleTimeLimit] = useState(5);
  const [enableStaleNudge, setEnableStaleNudge] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load database settings if logged in
  useEffect(() => {
    async function loadDbConfig() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: biz } = await supabase
            .from("businesses")
            .select("*")
            .eq("user_id", user.id)
            .single();

          if (biz) {
            setDbBusiness(biz);
            setSetupBusinessName(biz.name);
            setSetupBusinessType(biz.vertical || "Business");
            setSetupKnowledgeText(biz.knowledge || "");

            // Fetch transactions
            const { data: txs } = await supabase
              .from("transactions")
              .select("*, customers(*)")
              .eq("business_id", biz.id)
              .order("updated_at", { ascending: false });

            if (txs) {
              const mappedTxs = txs.map(t => ({
                type: t.type,
                status: t.status,
                details: t.details || {},
                value: Number(t.value || 0),
                timestamp: new Date(t.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                customerPhone: t.customers?.phone,
                customerName: t.customers?.display_name
              }));
              setDbTransactions(mappedTxs);
              setCompletedTransactions(mappedTxs);
            }

            // Fetch conversations
            // Fetch conversations
            let { data: convs } = await supabase
              .from("conversations")
              .select("*, customers(*)")
              .eq("business_id", biz.id)
              .order("last_message_at", { ascending: false });

            if (!convs || convs.length === 0) {
              const mockPresets = [
                { phone: generateRandomPhone(), msg: `Hello! Welcome to ${biz.name}...`, val: 0, intent: 0.2, status: "auto-handled" },
                { phone: generateRandomPhone(), msg: "what is the price of services?", val: 1500, intent: 0.75, status: "open" },
                { phone: generateRandomPhone(), msg: `where is ${biz.name} located?`, val: 0, intent: 0.4, status: "auto-handled" }
              ];

              for (const item of mockPresets) {
                // 1. Insert customer
                const { data: customer } = await supabase
                  .from("customers")
                  .insert({
                    business_id: biz.id,
                    phone: item.phone,
                    display_name: `Customer ${item.phone.slice(-4)}`
                  })
                  .select()
                  .single();

                if (customer) {
                  // 2. Insert conversation
                  const { data: conv } = await supabase
                    .from("conversations")
                    .insert({
                      business_id: biz.id,
                      customer_id: customer.id,
                      status: item.status,
                      intent_score: item.intent,
                      estimated_value: item.val,
                      last_message_content: item.msg,
                      last_message_at: new Date().toISOString()
                    })
                    .select()
                    .single();

                  if (conv) {
                    // 3. Insert messages
                    await supabase.from("messages").insert([
                      {
                        conversation_id: conv.id,
                        business_id: biz.id,
                        role: "system",
                        content: `WhatsApp chat session initialized with ${biz.name}.`
                      },
                      {
                        conversation_id: conv.id,
                        business_id: biz.id,
                        role: "agent",
                        content: `Hello! Welcome to ${biz.name}. How can we help you today?`
                      }
                    ]);
                    if (item.status === "open" || item.val > 0) {
                      await supabase.from("messages").insert({
                        conversation_id: conv.id,
                        business_id: biz.id,
                        role: "customer",
                        content: item.msg
                      });
                    }
                  }
                }
              }

              // Re-fetch
              const { data: refetched } = await supabase
                .from("conversations")
                .select("*, customers(*)")
                .eq("business_id", biz.id)
                .order("last_message_at", { ascending: false });
              convs = refetched;
            }

            if (convs && convs.length > 0) {
              // Fetch messages in batch
              const { data: allMsgs } = await supabase
                .from("messages")
                .select("*")
                .in("conversation_id", convs.map(c => c.id))
                .order("created_at", { ascending: true });

              const mappedConvs = convs.map((c: any) => {
                const convMsgs = (allMsgs || []).filter((m: any) => m.conversation_id === c.id);
                const chatHistory: Message[] = convMsgs.map((m: any) => {
                  let sender: "customer" | "agent" | "owner" | "system" = "agent";
                  if (m.role === "customer") sender = "customer";
                  else if (m.role === "owner") sender = "owner";
                  else if (m.role === "escalation") sender = "owner";

                  return {
                    sender,
                    text: m.content || "",
                    timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  };
                });

                if (chatHistory.length === 0) {
                  chatHistory.push(
                    {
                      sender: "system",
                      text: `WhatsApp chat session initialized with ${biz.name}.`,
                      timestamp: "10:00 AM"
                    },
                    {
                      sender: "agent",
                      text: `Hello! Welcome to ${biz.name}. How can we help you today?`,
                      timestamp: "10:00 AM"
                    }
                  );
                }

                return {
                  id: c.id,
                  phone: c.customers?.phone || "Unknown Customer",
                  lastMessage: c.last_message_content || (chatHistory[chatHistory.length - 1]?.text || ""),
                  time: new Date(c.last_message_at || c.created_at).toLocaleDateString() + " " + new Date(c.last_message_at || c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  value: Number(c.estimated_value || 0),
                  intent: Number(c.intent_score || 0),
                  status: (c.status === "escalated" ? "escalated" : c.status === "blocked" ? "blocked" : c.is_stale ? "stale" : "auto-handled") as "open" | "auto-handled" | "escalated" | "stale" | "blocked",
                  chatHistory,
                  guardHarassmentCount: c.harassment_count || 0,
                  guardIsBlocked: c.status === "blocked",
                  guardLastMessageHash: c.last_message_hash || null,
                  guardRepeatCount: c.repeat_count || 0,
                  guardLastRepeatAt: c.last_repeat_at || null,
                  isStale: c.is_stale || false
                };
              });

              setDbConversations(mappedConvs);
            }
          }
        }
      } catch (err) {
        console.warn("Could not load database configurations:", err);
      }
    }
    loadDbConfig();
  }, [supabase]);

  // Auto-scroll chat window
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isTyping]);

  // Synchronize sandbox state (chats, inbox, bookings) to localStorage to persist across navigation/reload
  useEffect(() => {
    if (isSetupComplete && setupBusinessName) {
      try {
        const storageKey = getBusinessStorageKey(setupBusinessName, setupKnowledgeText);
        localStorage.setItem(storageKey, JSON.stringify({
          inboxList,
          completedTransactions,
          staleTimeLimit,
          enableStaleNudge
        }));
      } catch (err) {
        console.warn("Failed to persist sandbox state to localStorage:", err);
      }
    }
  }, [inboxList, completedTransactions, staleTimeLimit, enableStaleNudge, isSetupComplete, setupBusinessName, setupKnowledgeText]);

  // Handle Preset Clicks
  const handlePresetClick = (presetText: string) => {
    setInputMessage(presetText);
  };

  const handleLaunchSandbox = async () => {
    setIsLoading(true);
    setLoadingStep(0);
    setLoadingStepText("Parsing business profile & vertical...");

    const selectedTpl = TEMPLATES.find(t => t.id === setupTemplate);
    const isModified = !selectedTpl ||
      setupBusinessName !== selectedTpl.name ||
      setupBusinessType !== selectedTpl.type ||
      setupKnowledgeText !== selectedTpl.knowledge;

    let finalPresets = selectedTpl ? [...selectedTpl.presets] : [];

    // Step 1: Parsing profile (800ms)
    await new Promise(resolve => setTimeout(resolve, 800));
    setLoadingStep(1);
    setLoadingStepText("Splitting knowledge document and generating vector embeddings (gemini-embedding-001)...");

    // Step 2: Generating embeddings (1000ms)
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoadingStep(2);
    setLoadingStepText("Indexing pgvector database node & setting confidence thresholds...");

    // Step 3: Indexing database (1000ms)
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoadingStep(3);
    setLoadingStepText("Querying Gemini 3.5 Flash to compile custom preset queries...");

    // Trigger API call in parallel if modified or custom
    let apiPromise = Promise.resolve<PresetQuery[] | null>(null);
    if (isModified || setupTemplate === "custom") {
      apiPromise = fetch("/api/demo-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "GENERATE_PRESETS",
          businessName: setupBusinessName,
          businessType: setupBusinessType,
          documentText: setupKnowledgeText
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.presets && Array.isArray(data.presets)) {
            const labels = ["🇮🇳 Hinglish", "🇮🇳 Marathi", "🇬🇧 Typos", "🇪🇸 Spanish", "💰 High Value"];
            const newPresets = data.presets.slice(0, 5).map((q: string, idx: number) => ({
              text: q,
              label: labels[idx] || "Simulated Query"
            }));
            // Add a default gibberish query
            newPresets.push({ text: "asdfghjklzxcvbnm", label: "⚠️ Gibberish" });
            return newPresets;
          }
          return null;
        })
        .catch(err => {
          console.error("Failed to generate dynamic presets:", err);
          return null;
        });
    }

    const [apiPresetsResult] = await Promise.all([
      apiPromise,
      new Promise(resolve => setTimeout(resolve, 1200)) // Wait at least 1.2s for Step 4
    ]);

    if (apiPresetsResult) {
      finalPresets = apiPresetsResult;
    } else if (isModified || setupTemplate === "custom") {
      // Fallback presets if API fails or isn't configured
      finalPresets = [
        { text: `kya ${setupBusinessName} open hai?`, label: "🇮🇳 Hinglish" },
        { text: `${setupBusinessType} timing kay aahe?`, label: "🇮🇳 Marathi" },
        { text: `what price of standard services in ${setupBusinessName}`, label: "🇬🇧 Typos" },
        { text: `¿dónde está la tienda de ${setupBusinessName}?`, label: "🇪🇸 Spanish" },
        { text: "asdfghjklzxcvbnm", label: "⚠️ Gibberish" },
        { text: `i want to book a VIP package for ₹9500`, label: "💰 High Value" }
      ];
    }

    setLoadingStep(4);
    setLoadingStepText("Initializing real-time simulation node...");

    // Step 5: Initialize node (600ms)
    await new Promise(resolve => setTimeout(resolve, 600));

    // Commit onboarding details to main state
    setBusinessName(setupBusinessName);
    setBusinessType(setupBusinessType);
    setKnowledgeText(setupKnowledgeText);
    setPresets(finalPresets);

    const isDbTemplate = setupTemplate === "custom" && dbBusiness;
    if (isDbTemplate) {
      let dbConvId = null;
      const randomPhone = generateRandomPhone();
      try {
        const { data: customer } = await supabase
          .from("customers")
          .insert({
            business_id: dbBusiness.id,
            phone: randomPhone,
            display_name: `Customer ${randomPhone.slice(-4)}`
          })
          .select()
          .single();

        if (customer) {
          const { data: conv } = await supabase
            .from("conversations")
            .insert({
              business_id: dbBusiness.id,
              customer_id: customer.id,
              status: "open",
              intent_score: 0.2,
              estimated_value: 0,
              last_message_content: "WhatsApp session started.",
              last_message_at: new Date().toISOString()
            })
            .select()
            .single();

          if (conv) {
            dbConvId = conv.id;
            await supabase.from("messages").insert([
              {
                conversation_id: conv.id,
                business_id: dbBusiness.id,
                role: "system",
                content: `WhatsApp chat session initialized with ${setupBusinessName}.`
              },
              {
                conversation_id: conv.id,
                business_id: dbBusiness.id,
                role: "agent",
                content: `Hello! Welcome to ${setupBusinessName}. How can we help you today?`
              }
            ]);
          }
        }
      } catch (dbErr) {
        console.error("Failed to start new chat in DB during launch:", dbErr);
      }

      const freshConvId = dbConvId || `conv-${Date.now()}`;
      const newHistory: Message[] = [
        {
          sender: "system",
          text: `WhatsApp chat session initialized with ${setupBusinessName}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        },
        {
          sender: "agent",
          text: `Hello! Welcome to ${setupBusinessName}. How can we help you today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ];

      const freshConv: Conversation = {
        id: freshConvId,
        phone: randomPhone,
        lastMessage: "Session started.",
        time: "Just now",
        value: 0,
        intent: 0.2,
        status: "open",
        chatHistory: newHistory,
        sandboxTransaction: null,
        pipelineLogs: null,
        guardHarassmentCount: 0,
        guardIsBlocked: false,
        guardLastMessageHash: null,
        guardRepeatCount: 0,
        guardLastRepeatAt: null,
        isStale: false
      };

      setInboxList([freshConv, ...dbConversations]);
      setActiveConversationId(freshConvId);
      setChatHistory(newHistory);
      setGuardHarassmentCount(0);
      setGuardIsBlocked(false);
      setGuardLastMessageHash(null);
      setGuardRepeatCount(0);
      setGuardLastRepeatAt(null);
      setIsStale(false);
      setCompletedTransactions(dbTransactions);
    } else {
      // Check if we have cached data in localStorage for this business name
      const storageKey = getBusinessStorageKey(setupBusinessName, setupKnowledgeText);
      const cached = localStorage.getItem(storageKey);
      let loadedFromCache = false;
      if (cached) {
        try {
          const { inboxList: cachedInbox, completedTransactions: cachedTxs, staleTimeLimit: cachedStale, enableStaleNudge: cachedEnable } = JSON.parse(cached);
          if (cachedStale !== undefined) {
            setStaleTimeLimit(cachedStale);
          }
          if (cachedEnable !== undefined) {
            setEnableStaleNudge(cachedEnable);
          }
          if (cachedInbox && cachedInbox.length > 0) {
            const randomPhone = generateRandomPhone();
            const freshConvId = `conv-${Date.now()}`;
            const newHistory: Message[] = [
              {
                sender: "system",
                text: `WhatsApp chat session initialized with ${setupBusinessName}.`,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              },
              {
                sender: "agent",
                text: `Hello! Welcome to ${setupBusinessName}. How can we help you today?`,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              }
            ];

            const freshConv: Conversation = {
              id: freshConvId,
              phone: randomPhone,
              lastMessage: "Session started.",
              time: "Just now",
              value: 0,
              intent: 0.2,
              status: "open",
              chatHistory: newHistory,
              sandboxTransaction: null,
              pipelineLogs: null,
              guardHarassmentCount: 0,
              guardIsBlocked: false,
              guardLastMessageHash: null,
              guardRepeatCount: 0,
              guardLastRepeatAt: null,
              isStale: false
            };

            setInboxList([freshConv, ...cachedInbox]);
            setActiveConversationId(freshConvId);
            setChatHistory(newHistory);
            setGuardHarassmentCount(0);
            setGuardIsBlocked(false);
            setGuardLastMessageHash(null);
            setGuardRepeatCount(0);
            setGuardLastRepeatAt(null);
            setIsStale(false);
            setCompletedTransactions(cachedTxs || []);
            loadedFromCache = true;
          }
        } catch (e) {
          console.warn("Failed to load cached demo state:", e);
        }
      }

      if (!loadedFromCache) {
        // Re-initialize fresh template state
        setChatHistory([
          {
            sender: "system",
            text: `WhatsApp chat session initialized with ${setupBusinessName}.`,
            timestamp: "10:00 AM"
          },
          {
            sender: "agent",
            text: `Hello! Welcome to ${setupBusinessName}. How can we help you today?`,
            timestamp: "10:00 AM"
          }
        ]);
        setInboxList(getInitialInboxForTemplate(setupTemplate, setupBusinessName, setupBusinessType, finalPresets));
        setActiveConversationId("conv-1");
        setGuardHarassmentCount(0);
        setGuardIsBlocked(false);
        setGuardLastMessageHash(null);
        setGuardRepeatCount(0);
        setGuardLastRepeatAt(null);
        setIsStale(false);
        setCompletedTransactions([]);
      }
    }
    setPipelineLogs(null);
    setActiveTab("bookings");
    setSandboxTransaction(null);

    setIsLoading(false);
    setIsSetupComplete(true);
  };

  // Submit message to the API
  const handleSendMessage = async (
    textToSend?: string,
    audioData?: { base64: string; mimeType: string },
    voiceDuration?: string
  ) => {
    const text = (textToSend || inputMessage).trim();
    const isVoice = !!audioData;
    if (!text && !isVoice) return;

    if (!textToSend && !isVoice) setInputMessage("");

    // Add customer message (voice note or text message)
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsg: Message = isVoice ? {
      sender: "customer" as const,
      text: "[Voice Note]",
      timestamp,
      isVoiceNote: true,
      transcribing: true,
      duration: voiceDuration || "0:05"
    } : {
      sender: "customer" as const,
      text,
      timestamp
    };

    const newHistory = [...chatHistory, newMsg];
    setChatHistory(newHistory);
    setIsTyping(true);

    // Sync customer message into inbox list
    setInboxList((prev) =>
      prev.map((conv) => {
        if (conv.id === activeConversationId) {
          return {
            ...conv,
            lastMessage: isVoice ? "[Voice Note]" : text,
            time: "Just now",
            chatHistory: newHistory
          };
        }
        return conv;
      })
    );

    try {
      const payload: any = {
        chatHistory: newHistory.filter((m) => m.sender !== "system").map((m) => ({
          sender: m.sender,
          text: m.isVoiceNote && m.transcriptionText ? m.transcriptionText : m.text,
          timestamp: m.timestamp
        })),
        documentText: knowledgeText,
        businessName,
        businessType,
        // Pass guard state to API
        harassmentCount: guardHarassmentCount,
        isBlocked: guardIsBlocked,
        lastMessageHash: guardLastMessageHash,
        repeatCount: guardRepeatCount,
        lastRepeatAt: guardLastRepeatAt,
      };

      if (isVoice && audioData) {
        payload.audio = audioData.base64;
        payload.mimeType = audioData.mimeType;
      } else {
        payload.message = text;
      }

      const response = await fetch("/api/demo-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      setIsTyping(false);

      if (data.error) {
        let errorHistory = [...newHistory];
        if (isVoice) {
          errorHistory = errorHistory.map((msg) => {
            if (msg.isVoiceNote && msg.transcribing) {
              return {
                ...msg,
                transcribing: false,
                text: `[Voice Note Error: ${data.error}]`,
                transcriptionText: `Failed to transcribe: ${data.error}`
              };
            }
            return msg;
          });
        }
        errorHistory = [
          ...errorHistory,
          {
            sender: "system" as const,
            text: `Error: ${data.error}`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ];
        setChatHistory(errorHistory);
        setInboxList((prev) =>
          prev.map((conv) => (conv.id === activeConversationId ? { ...conv, chatHistory: errorHistory } : conv))
        );
        return;
      }

      // We start with newHistory (with customer message)
      let finalHistory = [...newHistory];

      // If voice note succeeded, update its transcription
      if (isVoice && data.transcription) {
        finalHistory = finalHistory.map((msg) => {
          if (msg.isVoiceNote && msg.transcribing) {
            return {
              ...msg,
              transcribing: false,
              transcriptionText: data.transcription,
              text: `🎤 Voice Note: "${data.transcription}"`
            };
          }
          return msg;
        });
      }

      // ── Update guard state from API response ──
      if (data.newHarassmentCount !== undefined) setGuardHarassmentCount(data.newHarassmentCount);
      if (data.newIsBlocked !== undefined) setGuardIsBlocked(data.newIsBlocked);
      if (data.newLastMessageHash !== undefined) setGuardLastMessageHash(data.newLastMessageHash);
      if (data.newRepeatCount !== undefined) setGuardRepeatCount(data.newRepeatCount);
      if (data.newLastRepeatAt !== undefined) setGuardLastRepeatAt(data.newLastRepeatAt);

      // Handle blocked (Guard 1) — no response, just a system banner
      if (data.guardAction === 'blocked') {
        finalHistory.push({
          sender: "system",
          text: "🚫 This customer is blocked. Message ignored — no reply sent.",
          timestamp
        });
      }
      // Handle repeat detection (Guard 2)
      else if (data.guardAction?.startsWith('repeat_')) {
        if (data.guardAction === 'repeat_ignore') {
          finalHistory.push({
            sender: "system",
            text: "🔇 Repeat spam detected (4th+ time). Complete silence — no reply sent.",
            timestamp
          });
        } else if (data.response) {
          finalHistory.push({
            sender: "agent",
            text: data.response,
            timestamp
          });
        }
      }
      // Handle emoji abuse (Guard 3)
      else if (data.guardAction === 'emoji_abuse') {
        if (data.response) {
          finalHistory.push({
            sender: "agent",
            text: data.response,
            timestamp
          });
        }
        if (data.newIsBlocked) {
          finalHistory.push({
            sender: "system",
            text: "🚫 Customer blocked after repeated emoji abuse.",
            timestamp
          });
        }
      }
      // Handle Gemini-detected abuse
      else if (data.guardAction === 'gemini_abuse') {
        if (data.response) {
          finalHistory.push({
            sender: "agent",
            text: data.response,
            timestamp
          });
        }
        if (data.newIsBlocked) {
          finalHistory.push({
            sender: "system",
            text: "🚫 Customer blocked after repeated harassment. All future messages will be silently ignored.",
            timestamp
          });
        }
      }
      // Handle safety block (PROHIBITED_CONTENT)
      else if (data.guardAction === 'safety_block') {
        if (data.response) {
          finalHistory.push({
            sender: "system",
            text: data.response,
            timestamp
          });
        }
        if (data.newIsBlocked) {
          finalHistory.push({
            sender: "system",
            text: "🚫 Customer blocked after repeated safety policy violations.",
            timestamp
          });
        }
      }
      // Normal AI response
      else if (data.response && data.response !== "ESCALATE") {
        finalHistory.push({
          sender: "agent",
          text: data.response,
          timestamp,
          transaction: data.transaction_detected ? {
            type: data.transaction_type,
            status: data.transaction_status,
            details: data.transaction_details,
            value: data.evaluation?.estimatedValue ?? 0
          } : undefined
        });
      }

      // Update sandbox transaction state
      if (data.transaction_detected && data.transaction_type && data.transaction_status) {
        const txObj = {
          type: data.transaction_type,
          status: data.transaction_status,
          details: data.transaction_details,
          value: data.evaluation?.estimatedValue ?? 0,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setSandboxTransaction(txObj);
        if (data.transaction_status === 'confirmed') {
          setCompletedTransactions(prev => {
            if (prev.some(t => t.type === txObj.type && JSON.stringify(t.details) === JSON.stringify(txObj.details))) {
              return prev;
            }
            return [...prev, txObj];
          });
        }
      }

      // Add Escalation banner if escalated
      if (data.status === "escalated" && !data.guardAction) {
        finalHistory.push({
          sender: "system",
          text: "⚠️ Conversation escalated to business owner.",
          timestamp
        });
      }

      // Update Pipeline Inspector Logs
      setPipelineLogs(data);

      // Commit to active state
      setChatHistory(finalHistory);

      // Update CRM sandbox inbox card
      setInboxList((prev) => {
        const updated = prev.map((conv) => {
          if (conv.id === activeConversationId) {
            return {
              ...conv,
              chatHistory: finalHistory,
              sandboxTransaction: (data.transaction_detected && data.transaction_type && data.transaction_status) ? {
                type: data.transaction_type,
                status: data.transaction_status,
                details: data.transaction_details,
                value: data.evaluation?.estimatedValue ?? 0,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              } : conv.sandboxTransaction,
              pipelineLogs: data,
              guardHarassmentCount: data.newHarassmentCount !== undefined ? data.newHarassmentCount : conv.guardHarassmentCount,
              guardIsBlocked: data.newIsBlocked !== undefined ? data.newIsBlocked : conv.guardIsBlocked,
              guardLastMessageHash: data.newLastMessageHash !== undefined ? data.newLastMessageHash : conv.guardLastMessageHash,
              guardRepeatCount: data.newRepeatCount !== undefined ? data.newRepeatCount : conv.guardRepeatCount,
              guardLastRepeatAt: data.newLastRepeatAt !== undefined ? data.newLastRepeatAt : conv.guardLastRepeatAt,
              isStale: false,
              lastMessage: data.status === "blocked"
                ? "🚫 Blocked"
                : data.response === "ESCALATE"
                  ? "Escalated to owner"
                  : (isVoice ? `🎤 ${data.transcription}` : (data.response || conv.lastMessage)),
              time: "Just now",
              value: data.evaluation?.estimatedValue ?? conv.value,
              intent: data.evaluation?.intentScore ?? conv.intent,
              status: data.status === "blocked" ? "blocked" : data.status
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

      // Sync to database if conversation is db-backed
      if (!activeConversationId.startsWith("conv-") && dbBusiness) {
        try {
          let customerContent = text;
          if (isVoice && data.transcription) {
            customerContent = `🎤 Voice Note: "${data.transcription}"`;
          }
          await supabase.from("messages").insert({
            conversation_id: activeConversationId,
            business_id: dbBusiness.id,
            role: "customer",
            content: customerContent
          });

          let agentRole = "agent";
          if (data.status === "escalated" || data.response === "ESCALATE") {
            agentRole = "escalation";
          }

          let replyText = data.response;
          if (data.guardAction === 'blocked') {
            replyText = "🚫 This customer is blocked. Message ignored — no reply sent.";
            agentRole = "agent";
          } else if (data.guardAction === 'repeat_ignore') {
            replyText = "🔇 Repeat spam detected. Silence — no reply sent.";
            agentRole = "agent";
          } else if (data.newIsBlocked && data.guardAction === 'emoji_abuse') {
            replyText = "🚫 Customer blocked after repeated emoji abuse.";
            agentRole = "agent";
          } else if (data.newIsBlocked && data.guardAction === 'gemini_abuse') {
            replyText = "🚫 Customer blocked after repeated harassment.";
            agentRole = "agent";
          } else if (data.newIsBlocked && data.guardAction === 'safety_block') {
            replyText = "🚫 Customer blocked after repeated safety policy violations.";
            agentRole = "agent";
          }

          if (replyText) {
            await supabase.from("messages").insert({
              conversation_id: activeConversationId,
              business_id: dbBusiness.id,
              role: agentRole,
              content: replyText,
              confidence_score: data.evaluation?.confidenceScore ?? null,
              intent_score: data.evaluation?.intentScore ?? null,
              estimated_value: data.evaluation?.estimatedValue ?? null
            });
          }

          const updateFields: any = {
            last_message_at: new Date().toISOString(),
            intent_score: data.evaluation?.intentScore ?? 0,
            estimated_value: data.evaluation?.estimatedValue ?? 0,
          };

          if (data.status) {
            updateFields.status = data.status;
          }
          if (data.newIsBlocked) {
            updateFields.status = "blocked";
          }

          await supabase
            .from("conversations")
            .update(updateFields)
            .eq("id", activeConversationId);

          if (data.transaction_detected && data.transaction_type && data.transaction_status) {
            const { data: convData } = await supabase
              .from("conversations")
              .select("customer_id")
              .eq("id", activeConversationId)
              .single();

            if (convData?.customer_id) {
              const { error: txErr } = await supabase
                .from("transactions")
                .upsert({
                  business_id: dbBusiness.id,
                  customer_id: convData.customer_id,
                  conversation_id: activeConversationId,
                  type: data.transaction_type,
                  status: data.transaction_status,
                  details: data.transaction_details || {},
                  value: data.evaluation?.estimatedValue ?? 0,
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: "conversation_id,type"
                });

              if (!txErr) {
                const { data: latestTxs } = await supabase
                  .from("transactions")
                  .select("*, customers(*)")
                  .eq("business_id", dbBusiness.id)
                  .order("updated_at", { ascending: false });

                if (latestTxs) {
                  const mappedTxs = latestTxs.map(t => ({
                    type: t.type,
                    status: t.status,
                    details: t.details || {},
                    value: Number(t.value || 0),
                    timestamp: new Date(t.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    customerPhone: t.customers?.phone,
                    customerName: t.customers?.display_name
                  }));
                  setDbTransactions(mappedTxs);
                  setCompletedTransactions(mappedTxs);
                }
              }
            }
          }
        } catch (dbErr) {
          console.error("Failed to sync message/transaction with DB:", dbErr);
        }
      }

      // Clear stale state if customer replies
      setIsStale(false);
    } catch (e: any) {
      setIsTyping(false);
      console.error(e);
      const errorHistory = [
        ...newHistory,
        {
          sender: "system" as const,
          text: `Failed to connect to the backend agent: ${e.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ];
      setChatHistory(errorHistory);
      setInboxList((prev) =>
        prev.map((conv) => (conv.id === activeConversationId ? { ...conv, chatHistory: errorHistory } : conv))
      );
    }
  };

  // Simulate stale passing
  const triggerStaleSimulation = async () => {
    const hasCustomerMsg = chatHistory.some(m => m.sender === "customer");
    if (!hasCustomerMsg) {
      alert("Please send a message from the customer first to start the conversation before simulating a stale lead.");
      return;
    }

    setIsStale(true);
    setIsGeneratingNudge(true);
    setActiveTab("inbox"); // Focus inbox tab

    // Update active inbox card to stale
    setInboxList((prev) => {
      const updated = prev.map((conv) => {
        if (conv.id === activeConversationId) {
          return {
            ...conv,
            status: "stale" as const,
            time: `${staleTimeLimit}m ago`,
            isStale: true
          };
        }
        return conv;
      });
      return [...updated];
    });

    if (!activeConversationId.startsWith("conv-") && dbBusiness) {
      try {
        await supabase
          .from("conversations")
          .update({
            is_stale: true,
            stale_detected_at: new Date().toISOString(),
            status: "stale"
          })
          .eq("id", activeConversationId);
      } catch (dbErr) {
        console.error("Failed to mark conversation stale in database:", dbErr);
      }
    }

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
  const sendNudge = async () => {
    if (!nudgeDraft.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const updatedHistory: Message[] = [
      ...chatHistory,
      {
        sender: "owner",
        text: nudgeDraft,
        timestamp
      }
    ];
    setChatHistory(updatedHistory);

    setIsStale(false);

    setInboxList((prev) => {
      return prev.map((conv) => {
        if (conv.id === activeConversationId) {
          return {
            ...conv,
            chatHistory: updatedHistory,
            lastMessage: `Nudge Sent: "${nudgeDraft.substring(0, 30)}..."`,
            status: "open",
            time: "Just now",
            isStale: false
          };
        }
        return conv;
      });
    });

    if (!activeConversationId.startsWith("conv-") && dbBusiness) {
      try {
        // Insert nudge message from owner
        await supabase.from("messages").insert({
          conversation_id: activeConversationId,
          business_id: dbBusiness.id,
          role: "owner",
          content: nudgeDraft
        });

        // Reset stale in conversations
        await supabase
          .from("conversations")
          .update({
            is_stale: false,
            stale_detected_at: null,
            status: "open"
          })
          .eq("id", activeConversationId);
      } catch (dbErr) {
        console.error("Failed to persist nudge to database:", dbErr);
      }
    }
  };

  // Send manual reply from CRM portal
  const handleCrmSendReply = async () => {
    if (!crmReplyMessage.trim()) return;

    const replyText = crmReplyMessage.trim();
    setCrmReplyMessage("");

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsg: Message = {
      sender: "owner",
      text: replyText,
      timestamp
    };

    const newHistory = [...chatHistory, newMsg];
    setChatHistory(newHistory);

    setInboxList((prev) =>
      prev.map((conv) => {
        if (conv.id === activeConversationId) {
          return {
            ...conv,
            lastMessage: replyText,
            time: "Just now",
            chatHistory: newHistory,
            status: "open",
            isStale: false
          };
        }
        return conv;
      })
    );

    setIsStale(false);

    // Sync to database if conversation is db-backed
    if (!activeConversationId.startsWith("conv-") && dbBusiness) {
      try {
        await supabase.from("messages").insert({
          conversation_id: activeConversationId,
          business_id: dbBusiness.id,
          role: "owner",
          content: replyText
        });

        await supabase
          .from("conversations")
          .update({
            last_message_at: new Date().toISOString(),
            is_stale: false,
            stale_detected_at: null,
            status: "open"
          })
          .eq("id", activeConversationId);
      } catch (dbErr) {
        console.error("Failed to persist manual CRM reply to database:", dbErr);
      }
    }
  };

  // Start new chat with a random phone number
  const startNewChat = async () => {
    const randomPhone = generateRandomPhone();
    const newConvId = `conv-${Date.now()}`;

    let dbConvId = null;
    if (dbBusiness) {
      try {
        // 1. Create Customer
        const { data: customer } = await supabase
          .from("customers")
          .insert({
            business_id: dbBusiness.id,
            phone: randomPhone,
            display_name: `Customer ${randomPhone.slice(-4)}`
          })
          .select()
          .single();

        if (customer) {
          // 2. Create Conversation
          const { data: conv } = await supabase
            .from("conversations")
            .insert({
              business_id: dbBusiness.id,
              customer_id: customer.id,
              status: "open",
              intent_score: 0.2,
              estimated_value: 0,
              last_message_content: "WhatsApp session started.",
              last_message_at: new Date().toISOString()
            })
            .select()
            .single();

          if (conv) {
            dbConvId = conv.id;
            // 3. Create Messages
            await supabase.from("messages").insert([
              {
                conversation_id: conv.id,
                business_id: dbBusiness.id,
                role: "system",
                content: `WhatsApp chat session initialized with ${businessName}.`
              },
              {
                conversation_id: conv.id,
                business_id: dbBusiness.id,
                role: "agent",
                content: `Hello! Welcome to ${businessName}. How can we help you today?`
              }
            ]);
          }
        }
      } catch (dbErr) {
        console.error("Failed to start new chat in DB:", dbErr);
      }
    }

    const finalConvId = dbConvId || newConvId;

    const newHistory: Message[] = [
      {
        sender: "system",
        text: `WhatsApp chat session initialized with ${businessName}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      },
      {
        sender: "agent",
        text: `Hello! Welcome to ${businessName}. How can we help you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ];

    const newConv: Conversation = {
      id: finalConvId,
      phone: randomPhone,
      lastMessage: "Session started.",
      time: "Just now",
      value: 0,
      intent: 0.2,
      status: "open",
      chatHistory: newHistory,
      sandboxTransaction: null,
      pipelineLogs: null,
      guardHarassmentCount: 0,
      guardIsBlocked: false,
      guardLastMessageHash: null,
      guardRepeatCount: 0,
      guardLastRepeatAt: null,
      isStale: false
    };

    setInboxList(prev => [newConv, ...prev]);
    setActiveConversationId(finalConvId);
    setChatHistory(newHistory);
    setGuardHarassmentCount(0);
    setGuardIsBlocked(false);
    setGuardLastMessageHash(null);
    setGuardRepeatCount(0);
    setGuardLastRepeatAt(null);
    setIsStale(false);
  };

  // Manual unblock handler
  const handleUnblock = async () => {
    try {
      await fetch(`/api/conversations/${activeConversationId}/unblock`, {
        method: "PATCH"
      });
    } catch (e) {
      console.warn("API unblock failed or skipped in sandbox:", e);
    }

    if (!activeConversationId.startsWith("conv-") && dbBusiness) {
      try {
        await supabase
          .from("conversations")
          .update({
            status: "open"
          })
          .eq("id", activeConversationId);
      } catch (dbErr) {
        console.error("Failed to update conversation status after unblocking in database:", dbErr);
      }
    }

    setGuardIsBlocked(false);
    setGuardHarassmentCount(0);
    setGuardRepeatCount(0);
    setGuardLastMessageHash(null);
    setGuardLastRepeatAt(null);

    const updatedHistory: Message[] = [
      ...chatHistory,
      {
        sender: "system",
        text: "🔓 Customer was manually unblocked by the owner.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ];
    setChatHistory(updatedHistory);

    setInboxList((prev) =>
      prev.map((c) =>
        c.id === activeConversationId ? {
          ...c,
          status: "open",
          lastMessage: "Customer unblocked",
          chatHistory: updatedHistory,
          guardIsBlocked: false,
          guardHarassmentCount: 0,
          guardRepeatCount: 0,
          guardLastMessageHash: null,
          guardLastRepeatAt: null
        } : c
      )
    );
  };

  // Quick statistics
  const statActive = inboxList.filter((c) => c.status !== "auto-handled").length;
  const statAuto = inboxList.filter((c) => c.status === "auto-handled").length;
  const statEscalated = inboxList.filter((c) => c.status === "escalated").length;
  const statStale = inboxList.filter((c) => c.status === "stale").length;

  if (!isSetupComplete) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-black flex flex-col relative overflow-hidden">
        {/* Background radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-950/20 via-slate-950 to-slate-950 pointer-events-none" />

        <header className="relative border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="p-1 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-all">
                <svg width="20" height="20" className="w-5 h-5 shrink-0 fill-none stroke-current" style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </Link>
              <div>
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">WAPI SANDBOX</span>
                <span className="text-[9px] block font-mono text-emerald-500 tracking-widest leading-none">INTERACTIVE SIMULATION</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6 relative z-10">
          {isLoading ? (
            /* STUNNING INDEXING LOADER */
            <div className="max-w-md w-full bg-slate-900/40 border border-slate-900 backdrop-blur-md rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center">
              <div className="relative w-20 h-20 mb-8 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
                <div className="absolute inset-2 rounded-full border border-teal-500/10 border-b-teal-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                <Bot className="w-8 h-8 text-emerald-400 animate-pulse" />
              </div>

              <h2 className="text-xl font-bold text-white mb-2">Initializing AI Sandbox</h2>
              <p className="text-xs text-slate-400 mb-8 max-w-xs">
                Setting up custom Vector database and prompt logic for <span className="text-emerald-400 font-semibold">{setupBusinessName || "your business"}</span>...
              </p>

              <div className="w-full flex flex-col gap-3.5 text-left bg-slate-950 p-4 rounded-2xl border border-slate-900">
                {[
                  "Parse business profile & vertical",
                  "Generate vector chunks & embeddings",
                  "Index pgvector database node",
                  "Compile AI-agent custom presets",
                  "Initialize real-time simulation"
                ].map((step, idx) => {
                  let statusColor = "text-slate-650";
                  let indicator = <div className="w-1.5 h-1.5 rounded-full bg-slate-805" />;

                  if (loadingStep > idx) {
                    statusColor = "text-emerald-400/80 font-medium";
                    indicator = <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />;
                  } else if (loadingStep === idx) {
                    statusColor = "text-slate-200 font-semibold animate-pulse";
                    indicator = <div className="w-2 h-2 rounded-full bg-teal-400 animate-ping shrink-0" />;
                  }

                  return (
                    <div key={idx} className="flex items-center gap-3 text-xs">
                      <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        {indicator}
                      </div>
                      <span className={statusColor}>{step}</span>
                    </div>
                  );
                })}
              </div>

              <span className="text-[10px] text-slate-500 font-mono mt-6 block uppercase tracking-wider">
                {loadingStepText}
              </span>
            </div>
          ) : (
            /* GORGEOUS ONBOARDING FORM */
            <div className="max-w-2xl w-full bg-slate-900/40 border border-slate-900 backdrop-blur-md rounded-3xl p-8 shadow-2xl flex flex-col gap-6">
              <div className="flex flex-col gap-1.5 text-center sm:text-left">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 mx-auto sm:mx-0">
                  <Building className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
                  Configure Sandbox Business
                </h1>
                <p className="text-xs text-slate-400">
                  Wapi works dynamically based on your business specifications. Select a template below or write your own to test.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase font-mono text-slate-500">Select Business Template</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => {
                        setSetupTemplate(tpl.id);
                        setSetupBusinessName(tpl.name);
                        setSetupBusinessType(tpl.type);
                        setSetupKnowledgeText(tpl.knowledge);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold text-center border transition-all ${setupTemplate === tpl.id
                        ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-sm"
                        : "bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800 hover:text-slate-200"
                        }`}
                    >
                      {tpl.label.split(" ")[0]}
                      <span className="block text-[9px] font-normal mt-0.5 opacity-80">
                        {tpl.label.split(" ").slice(1).join(" ")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Business Name</label>
                  <input
                    type="text"
                    value={setupBusinessName}
                    onChange={(e) => {
                      setSetupBusinessName(e.target.value);
                      if (setupTemplate !== "custom") setSetupTemplate("custom");
                    }}
                    placeholder="e.g. Blue Tokai Coffee"
                    className="bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Vertical / Type</label>
                  <input
                    type="text"
                    value={setupBusinessType}
                    onChange={(e) => {
                      setSetupBusinessType(e.target.value);
                      if (setupTemplate !== "custom") setSetupTemplate("custom");
                    }}
                    placeholder="e.g. Specialty Cafe"
                    className="bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-slate-500 uppercase flex items-center justify-between">
                  <span>Business Knowledge Base & Pricing List</span>
                  {setupTemplate !== "custom" && (
                    <span className="text-[9px] text-emerald-400 font-normal">Prepopulated template loaded</span>
                  )}
                </label>
                <textarea
                  value={setupKnowledgeText}
                  onChange={(e) => {
                    setSetupKnowledgeText(e.target.value);
                    if (setupTemplate !== "custom") setSetupTemplate("custom");
                  }}
                  rows={8}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-4 text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500/50 leading-relaxed resize-y"
                  placeholder="Paste your menu, prices, address, timings, and policies here..."
                />
              </div>

              <button
                onClick={handleLaunchSandbox}
                disabled={!setupBusinessName.trim() || !setupKnowledgeText.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 rounded-xl text-slate-950 text-xs font-bold hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] mt-2"
              >
                Initialize AI Brain & Launch Sandbox
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-black">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-950/20 via-slate-950 to-slate-950 pointer-events-none" />

      <header className="relative border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-1 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-all">
              <svg width="20" height="20" className="w-5 h-5 shrink-0 fill-none stroke-current" style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </Link>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">WAPI SANDBOX</span>
              <span className="text-[9px] block font-mono text-emerald-500 tracking-widest leading-none">INTERACTIVE SIMULATION</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSetupTemplate("custom");
                setSetupBusinessName(businessName);
                setSetupBusinessType(businessType);
                setSetupKnowledgeText(knowledgeText);
                setIsSetupComplete(false);
              }}
              className="text-[10px] flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-all font-semibold"
            >
              <Sliders className="w-3 h-3 text-emerald-400" />
              Configure Business
            </button>
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Local Simulation Node
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid lg:grid-cols-12 gap-8 relative z-10">
        {/* Left Side: WhatsApp Simulator */}
        {activeTab !== "inbox" && (
          <section className="lg:col-span-5 flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  1. Customer Simulator
                  <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-450 px-2 py-0.5 rounded font-mono font-normal">
                    {inboxList.find((c) => c.id === activeConversationId)?.phone}
                  </span>
                </h2>
                <button
                  onClick={startNewChat}
                  className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-mono font-bold transition-all shrink-0 cursor-pointer"
                >
                  + NEW CHAT
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Simulate customer chats. Tap presets to test multi-lingual queries or keysmash gibberish.
              </p>
            </div>

          {/* Preset Queries panel */}
          <div className="flex flex-col gap-2 p-4 bg-slate-900/40 border border-slate-850 rounded-2xl">
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Click a preset query to load & run:</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {presets.map((preset, idx) => {
                const isGibberish = preset.label.includes("Gibberish") || preset.text === "asdfghjklzxcvbnm";
                return (
                  <button
                    key={idx}
                    onClick={() => handlePresetClick(preset.text)}
                    className={`px-2.5 py-1 text-[11px] font-medium bg-slate-950 border border-slate-805 rounded-lg hover:border-emerald-500/50 hover:text-emerald-400 transition-all text-left ${isGibberish ? "hover:border-rose-500/50 hover:text-rose-400" : ""
                      }`}
                  >
                    {preset.label} &quot;{preset.text.length > 50 ? preset.text.substring(0, 47) + '...' : preset.text}&ldquo;
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile phone container */}
          <div className="relative mx-auto w-full max-w-[370px] aspect-[9/18.5] bg-slate-950 border-[6px] border-slate-850 rounded-[40px] shadow-2xl overflow-hidden flex flex-col mt-6">
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
              {enableStaleNudge && (
                <button
                  disabled={!chatHistory.some(m => m.sender === "customer")}
                  onClick={triggerStaleSimulation}
                  title={
                    !chatHistory.some(m => m.sender === "customer")
                      ? "Send a message from the customer first to start the conversation before simulating a stale lead"
                      : `Simulate ${staleTimeLimit} minutes passing without replies to trigger stale lead warning`
                  }
                  className="text-[10px] flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-850 text-slate-400 hover:text-white transition-all hover:bg-slate-850 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Clock className="w-3 h-3 text-amber-500" />
                  +{staleTimeLimit} Mins
                </button>
              )}</div>

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

                if (msg.isVoiceNote) {
                  return (
                    <div key={index} className="flex flex-col items-end w-full">
                      <div className="bg-[#0b5c46] text-white rounded-2xl rounded-tr-none px-3.5 py-2.5 max-w-[85%] flex flex-col gap-2 shadow-sm">
                        {/* Voice Note Row */}
                        <div className="flex items-center gap-3 min-w-[200px]">
                          {/* Play/Pause Button */}
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>

                          {/* Waveform Visualization */}
                          <div className="flex-1 flex items-center gap-1 py-1">
                            <span className="w-1 h-3 bg-emerald-300/40 rounded-full"></span>
                            <span className="w-1 h-5 bg-emerald-300/60 rounded-full"></span>
                            <span className="w-1 h-4 bg-emerald-300/80 rounded-full animate-pulse"></span>
                            <span className="w-1 h-6 bg-emerald-300 rounded-full"></span>
                            <span className="w-1 h-3 bg-emerald-300/70 rounded-full"></span>
                            <span className="w-1 h-5 bg-emerald-300/50 rounded-full"></span>
                            <span className="w-1 h-4 bg-emerald-300/30 rounded-full"></span>
                          </div>

                          {/* Duration & Mic Status */}
                          <div className="flex flex-col items-end shrink-0">
                            <span className="text-[9px] text-emerald-300/80 font-mono">{msg.duration || "0:05"}</span>
                            <svg width="18" height="18" className="w-[18px] h-[18px] text-sky-400 mt-0.5 shrink-0 fill-none stroke-current" style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                              <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                              <line x1="12" x2="12" y1="19" y2="22" />
                              <line x1="8" x2="16" y1="22" y2="22" />
                            </svg>
                          </div>
                        </div>

                        {/* Transcription Status */}
                        <div className="border-t border-emerald-500/30 pt-1.5 mt-0.5">
                          {msg.transcribing ? (
                            <span className="text-[10px] text-emerald-200/70 flex items-center gap-1.5 italic">
                              <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-ping"></span>
                              Transcribing voice note...
                            </span>
                          ) : (
                            <div className="text-[10px] text-emerald-100/90 leading-relaxed font-sans">
                              <span className="font-mono text-[9px] text-emerald-300/75 uppercase tracking-wider block mb-0.5">Transcribed:</span>
                              &ldquo;{msg.transcriptionText}&ldquo;
                            </div>
                          )}
                        </div>

                        {/* Timestamp */}
                        <span className="text-[8px] text-emerald-300/65 block text-right font-mono">
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                }

                if (msg.transaction) {
                  const tx = msg.transaction;
                  const isConfirmed = tx.status === 'confirmed';

                  return (
                    <div key={index} className="flex flex-col items-start max-w-[85%] self-start my-2">
                      <div className="bg-[#1f2c34] border border-slate-800 rounded-2xl rounded-tl-none p-4 shadow-md flex flex-col gap-3 w-full">
                        {/* Header */}
                        <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {tx.type === 'appointment' ? '📅' : tx.type === 'order' ? '🛍️' : '💳'}
                            </span>
                            <div>
                              <span className="text-xs font-bold text-white block">
                                {tx.type === 'appointment' ? 'Appointment' : tx.type === 'order' ? 'Order' : 'Subscription'} {isConfirmed ? 'Confirmed' : 'in Progress'}
                              </span>
                              <span className="text-[8px] text-slate-500 font-mono tracking-wider">
                                {isConfirmed ? '✓ AUTO-VERIFIED RECEIPT' : '⏳ COLLECTING DETAILS'}
                              </span>
                            </div>
                          </div>

                          {tx.value > 0 && (
                            <span className="text-xs font-mono font-bold text-emerald-400 bg-slate-950 px-2 py-0.5 border border-slate-850 rounded">
                              ₹{tx.value}
                            </span>
                          )}
                        </div>

                        {/* Text reply */}
                        <p className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">{msg.text}</p>

                        {/* Details Table */}
                        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-900 text-xs flex flex-col gap-2">
                          {tx.type === 'appointment' && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-mono text-[9px]">SERVICE</span>
                                <span className={`font-semibold ${tx.details?.service ? "text-white" : "text-slate-700 italic"}`}>
                                  {tx.details?.service || 'missing'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-mono text-[9px]">DATE</span>
                                <span className={`font-semibold ${tx.details?.date ? "text-white" : "text-slate-700 italic"}`}>
                                  {tx.details?.date || 'missing'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-mono text-[9px]">TIME</span>
                                <span className={`font-semibold ${tx.details?.time ? "text-white" : "text-slate-700 italic"}`}>
                                  {tx.details?.time || 'missing'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-mono text-[9px]">NAME</span>
                                <span className={`font-semibold ${tx.details?.name ? "text-white" : "text-slate-700 italic"}`}>
                                  {tx.details?.name || 'missing'}
                                </span>
                              </div>
                            </>
                          )}

                          {tx.type === 'order' && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-mono text-[9px]">PRODUCT</span>
                                <span className={`font-semibold ${tx.details?.product ? "text-white" : "text-slate-700 italic"}`}>
                                  {tx.details?.product || 'missing'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-mono text-[9px]">QUANTITY</span>
                                <span className={`font-semibold ${tx.details?.quantity ? "text-white" : "text-slate-700 italic"}`}>
                                  {tx.details?.quantity || 1}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-mono text-[9px]">DELIVERY ADDRESS</span>
                                <span className={`font-semibold text-right max-w-[150px] break-words ${tx.details?.address ? "text-white" : "text-slate-700 italic"}`}>
                                  {tx.details?.address || 'missing'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-mono text-[9px]">NAME</span>
                                <span className={`font-semibold ${tx.details?.name ? "text-white" : "text-slate-700 italic"}`}>
                                  {tx.details?.name || 'missing'}
                                </span>
                              </div>
                            </>
                          )}

                          {tx.type === 'subscription' && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-mono text-[9px]">MEMBERSHIP PLAN</span>
                                <span className={`font-semibold ${tx.details?.plan ? "text-white" : "text-slate-700 italic"}`}>
                                  {tx.details?.plan || 'missing'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-mono text-[9px]">EMAIL</span>
                                <span className={`font-semibold text-right max-w-[150px] break-words ${tx.details?.email ? "text-white" : "text-slate-700 italic"}`}>
                                  {tx.details?.email || 'missing'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-mono text-[9px]">NAME</span>
                                <span className={`font-semibold ${tx.details?.name ? "text-white" : "text-slate-700 italic"}`}>
                                  {tx.details?.name || 'missing'}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Barcode Receipt Style for Confirmed Transactions */}
                        {isConfirmed && (
                          <div className="flex flex-col items-center gap-1.5 pt-2 border-t border-dashed border-slate-850 mt-1">
                            <div className="h-6 w-full bg-[repeating-linear-gradient(90deg,#475569,#475569_2px,transparent_2px,transparent_6px)] opacity-50" />
                            <span className="text-[7px] font-mono text-slate-500 tracking-[0.25em]">WAPI-TX-{(100000 + index).toString()}</span>
                          </div>
                        )}

                        <span className="text-[8px] text-slate-400 block text-right font-mono -mt-1">
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  );
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

            {/* Blocked Alert Banner inside Simulator */}
            {guardIsBlocked && (
              <div className="bg-red-500/10 border-t border-red-500/20 px-4 py-3 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-[11px] text-red-300">
                    Customer is blocked due to harassment. WhatsApp webhook is silently dropping their messages.
                  </p>
                </div>
                <button
                  onClick={handleUnblock}
                  className="px-2.5 py-1 text-[10px] font-bold bg-red-600 text-white rounded hover:bg-red-500 transition-all cursor-pointer shrink-0"
                >
                  Unblock
                </button>
              </div>
            )}

            {/* Input Footer */}
            <div className="bg-[#111b21] p-3 border-t border-slate-900 flex items-center gap-2 shrink-0">
              {recognitionSupported && (
                <button
                  onClick={toggleListening}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${isListening
                    ? "bg-rose-500 text-white animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                    : "bg-[#2a3942] text-slate-400 hover:text-white"
                    }`}
                  title={isListening ? "Stop listening" : "Start voice command"}
                >
                  <svg width="20" height="20" className="w-5 h-5 shrink-0 fill-none stroke-current" style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                    <line x1="8" x2="16" y1="22" y2="22" />
                  </svg>
                </button>
              )}

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={isListening ? "Listening..." : "Type a WhatsApp message..."}
                className="flex-1 bg-[#2a3942] border border-transparent rounded-lg px-3.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                disabled={isListening}
              />
              <button
                aria-label="button"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isListening}
                className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Right Side: Wapi Portal & Workflow Logs */}
      <section className={`${activeTab === "inbox" ? "lg:col-span-12" : "lg:col-span-7"} flex flex-col gap-6`}>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-400" />
              2. Wapi AI Operator Portal
            </h2>
            <p className="text-xs text-slate-400">
              Monitor the AI&apos;s internal reasoning, prioritize leads, and view the live vector retrieval outputs.
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
                      This customer has gone quiet for {staleTimeLimit} minutes. Wapi generated a custom nudge follow-up.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/25 px-2 py-0.5 rounded">
                  ₹{inboxList.find((c) => c.id === activeConversationId)?.value || 0} Lead
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
                    aria-label="text"
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
              onClick={() => setActiveTab("bookings")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${activeTab === "bookings"
                ? "bg-slate-900 text-emerald-400 border border-slate-800 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
                }`}
            >
              <Calendar className="w-4 h-4" /> Bookings & Orders
            </button>
            <button
              onClick={() => setActiveTab("inbox")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${activeTab === "inbox"
                ? "bg-slate-900 text-emerald-400 border border-slate-800 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
                }`}
            >
              <MessageSquare className="w-4 h-4" /> CRM Queue Inbox
            </button>
            <button
              onClick={() => setActiveTab("knowledge")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${activeTab === "knowledge"
                ? "bg-slate-900 text-emerald-400 border border-slate-800 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
                }`}
            >
              <Database className="w-4 h-4" /> Custom Knowledge
            </button>
            <button
              onClick={() => setActiveTab("pipeline")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${activeTab === "pipeline"
                ? "bg-slate-900 text-emerald-400 border border-slate-800 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
                }`}
            >
              <Bot className="w-4 h-4" /> Pipeline Inspector (Demo Purposes)
            </button>
          </div>

          {/* Active Tab Contents */}
          <div className="flex-1 min-h-[460px]">
            {activeTab === "pipeline" && (
              <div className="flex flex-col gap-4">
                {/* Live Slot-Filling Tracker Card */}
                {sandboxTransaction && (
                  <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-xl flex flex-col gap-2 shadow-[0_0_15px_rgba(99,102,241,0.02)]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-400 font-mono flex items-center gap-1.5">
                        ⚡ LIVE TRANSACTION SLOT-FILLING
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono ${sandboxTransaction.status === 'confirmed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse'
                        }`}>
                        {sandboxTransaction.status}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Transaction Type:</span>
                        <span className="text-white font-bold capitalize font-mono text-[10px]">
                          {sandboxTransaction.type === 'appointment' ? '📅 Appointment' : sandboxTransaction.type === 'order' ? '🛍️ Order' : '💳 Subscription'}
                        </span>
                      </div>

                      {/* Collected slots progress grid */}
                      <div className="grid grid-cols-2 gap-2 mt-1.5 pt-2 border-t border-slate-900 text-xs">
                        {sandboxTransaction.type === 'appointment' && (
                          <>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={sandboxTransaction.details?.service ? "text-emerald-400" : "text-slate-600"}>
                                {sandboxTransaction.details?.service ? "✓" : "✗"}
                              </span>
                              <span className="text-slate-500 font-mono text-[9px]">Service:</span>
                              <span className="text-white font-medium truncate max-w-[80px]" title={sandboxTransaction.details?.service}>
                                {sandboxTransaction.details?.service || 'missing'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={sandboxTransaction.details?.date ? "text-emerald-400" : "text-slate-600"}>
                                {sandboxTransaction.details?.date ? "✓" : "✗"}
                              </span>
                              <span className="text-slate-500 font-mono text-[9px]">Date:</span>
                              <span className="text-white font-medium truncate max-w-[80px]" title={sandboxTransaction.details?.date}>
                                {sandboxTransaction.details?.date || 'missing'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={sandboxTransaction.details?.time ? "text-emerald-400" : "text-slate-600"}>
                                {sandboxTransaction.details?.time ? "✓" : "✗"}
                              </span>
                              <span className="text-slate-500 font-mono text-[9px]">Time:</span>
                              <span className="text-white font-medium truncate max-w-[80px]" title={sandboxTransaction.details?.time}>
                                {sandboxTransaction.details?.time || 'missing'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={sandboxTransaction.details?.name ? "text-emerald-400" : "text-slate-600"}>
                                {sandboxTransaction.details?.name ? "✓" : "✗"}
                              </span>
                              <span className="text-slate-500 font-mono text-[9px]">Name:</span>
                              <span className="text-white font-medium truncate max-w-[80px]" title={sandboxTransaction.details?.name}>
                                {sandboxTransaction.details?.name || 'missing'}
                              </span>
                            </div>
                          </>
                        )}

                        {sandboxTransaction.type === 'order' && (
                          <>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={sandboxTransaction.details?.product ? "text-emerald-400" : "text-slate-600"}>
                                {sandboxTransaction.details?.product ? "✓" : "✗"}
                              </span>
                              <span className="text-slate-500 font-mono text-[9px]">Product:</span>
                              <span className="text-white font-medium truncate max-w-[80px]" title={sandboxTransaction.details?.product}>
                                {sandboxTransaction.details?.product || 'missing'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={sandboxTransaction.details?.quantity ? "text-emerald-400" : "text-slate-600"}>
                                {sandboxTransaction.details?.quantity ? "✓" : "✗"}
                              </span>
                              <span className="text-slate-500 font-mono text-[9px]">Qty:</span>
                              <span className="text-white font-medium">
                                {sandboxTransaction.details?.quantity || 'missing'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={sandboxTransaction.details?.address ? "text-emerald-400" : "text-slate-600"}>
                                {sandboxTransaction.details?.address ? "✓" : "✗"}
                              </span>
                              <span className="text-slate-500 font-mono text-[9px]">Address:</span>
                              <span className="text-white font-medium truncate max-w-[80px]" title={sandboxTransaction.details?.address}>
                                {sandboxTransaction.details?.address || 'missing'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={sandboxTransaction.details?.name ? "text-emerald-400" : "text-slate-600"}>
                                {sandboxTransaction.details?.name ? "✓" : "✗"}
                              </span>
                              <span className="text-slate-500 font-mono text-[9px]">Name:</span>
                              <span className="text-white font-medium truncate max-w-[80px]" title={sandboxTransaction.details?.name}>
                                {sandboxTransaction.details?.name || 'missing'}
                              </span>
                            </div>
                          </>
                        )}

                        {sandboxTransaction.type === 'subscription' && (
                          <>
                            <div className="flex items-center gap-1.5 min-w-0 col-span-2">
                              <span className={sandboxTransaction.details?.plan ? "text-emerald-400" : "text-slate-600"}>
                                {sandboxTransaction.details?.plan ? "✓" : "✗"}
                              </span>
                              <span className="text-slate-500 font-mono text-[9px]">Plan:</span>
                              <span className="text-white font-medium truncate max-w-[150px]" title={sandboxTransaction.details?.plan}>
                                {sandboxTransaction.details?.plan || 'missing'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 min-w-0 col-span-2">
                              <span className={sandboxTransaction.details?.email ? "text-emerald-400" : "text-slate-600"}>
                                {sandboxTransaction.details?.email ? "✓" : "✗"}
                              </span>
                              <span className="text-slate-500 font-mono text-[9px]">Email:</span>
                              <span className="text-white font-medium truncate max-w-[150px]" title={sandboxTransaction.details?.email}>
                                {sandboxTransaction.details?.email || 'missing'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 min-w-0 col-span-2">
                              <span className={sandboxTransaction.details?.name ? "text-emerald-400" : "text-slate-600"}>
                                {sandboxTransaction.details?.name ? "✓" : "✗"}
                              </span>
                              <span className="text-slate-500 font-mono text-[9px]">Name:</span>
                              <span className="text-white font-medium truncate max-w-[150px]" title={sandboxTransaction.details?.name}>
                                {sandboxTransaction.details?.name || 'missing'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {sandboxTransaction.value > 0 && (
                        <div className="flex justify-between items-center text-xs mt-1.5 pt-2 border-t border-slate-900 font-mono">
                          <span className="text-slate-500">Inferred Value:</span>
                          <span className="text-emerald-400 font-bold">₹{sandboxTransaction.value}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                          {Math.round((pipelineLogs.evaluation?.confidence ?? 0) * 100)}%
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
                          No matching context chunks found in knowledge base (similarity threshold &lt; 0.15).
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
                              <p className="text-slate-300 italic leading-relaxed">&quot;{chunk.text}&qout;</p>
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
                              <span className="font-bold text-slate-200 font-mono">{pipelineLogs.evaluation?.intentScore ?? 0}</span>
                              <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden max-w-[80px]">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${(pipelineLogs.evaluation?.intentScore ?? 0) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 block uppercase font-mono">Estimated Lead Value</span>
                            <span className="font-bold text-emerald-400 text-sm mt-0.5 block">
                              ₹{pipelineLogs.evaluation?.estimatedValue ?? 0}
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
                  <span className="text-xs font-mono text-slate-500">REAL-TIME PRIORITY INBOX QUEUE & OPERATOR CONSOLE</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={startNewChat}
                      className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-mono font-bold transition-all shrink-0 cursor-pointer"
                    >
                      + NEW CHAT
                    </button>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono animate-pulse">
                      LIVE UPDATE FEED
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[550px]">
                  {/* Left Column: Conversation List */}
                  <div className="lg:col-span-5 flex flex-col gap-3 overflow-y-auto pr-1 h-full max-h-[550px]">
                    {inboxList.map((conv) => {
                      const isActive = conv.id === activeConversationId;

                      let cardBorder = "border-slate-900 hover:border-slate-800 bg-slate-900/20";
                      let statusBadge = "";

                      if (conv.status === "blocked") {
                        cardBorder = "border-red-500/30 hover:border-red-500/50 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.05)]";
                        statusBadge = "bg-red-500/10 text-red-400 border border-red-500/20";
                      } else if (conv.status === "escalated") {
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
                          onClick={() => selectConversation(conv.id)}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all hover:scale-[1.01] cursor-pointer ${cardBorder} ${isActive ? "ring-2 ring-emerald-500/30" : ""
                            }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className="text-[11px] font-bold text-white font-mono">{conv.phone}</span>
                              {isActive && (
                                <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1 rounded font-mono">
                                  active chat
                                </span>
                              )}
                              <span className={`text-[8px] font-mono uppercase px-1.5 py-0.2 rounded ${statusBadge}`}>
                                {conv.status === "blocked" ? "🚫 BLOCKED" : conv.status === "stale" ? "STALE LEAD" : conv.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate max-w-[200px]">&quot;{conv.lastMessage}&#34;</p>

                            {/* Intent indicator */}
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[8px] text-slate-500 uppercase font-mono">Intent:</span>
                              <div className="w-16 h-1 bg-slate-950 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-400 rounded-full"
                                  style={{ width: `${conv.intent * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-[8px] font-mono text-slate-400">{Math.round(conv.intent * 100)}%</span>
                            </div>
                          </div>

                          <div className="text-right flex flex-col items-end gap-0.5 shrink-0">
                            <span className={`text-xs font-bold ${conv.value > 0 ? "text-emerald-400" : "text-slate-500"}`}>
                              ₹{conv.value}
                            </span>
                            <span className="text-[8px] text-slate-500 font-mono mb-0.5">{conv.time}</span>
                            {conv.status === "blocked" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnblock();
                                }}
                                className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[8px] font-bold transition-all cursor-pointer"
                              >
                                Unblock
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Column: Active Conversation Chat Thread */}
                  <div className="lg:col-span-7 bg-slate-950/40 border border-slate-900 rounded-2xl flex flex-col h-full overflow-hidden">
                    {activeConversationId ? (
                      (() => {
                        const activeConv = inboxList.find(c => c.id === activeConversationId);
                        if (!activeConv) return (
                          <div className="flex-1 flex items-center justify-center text-xs text-slate-500 font-mono">
                            Select a conversation to view chat history
                          </div>
                        );

                        return (
                          <div className="flex flex-col h-full">
                            {/* Chat Header */}
                            <div className="px-4 py-3 border-b border-slate-900 bg-slate-900/10 flex items-center justify-between shrink-0">
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-white font-mono truncate">{activeConv.phone}</h4>
                                <p className="text-[10px] text-slate-500 truncate">operator viewing mode</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {enableStaleNudge && (
                                  <button
                                    disabled={!activeConv.chatHistory?.some(m => m.sender === "customer")}
                                    onClick={triggerStaleSimulation}
                                    title={
                                      !activeConv.chatHistory?.some(m => m.sender === "customer")
                                        ? "Send a message from the customer first to start the conversation before simulating a stale lead"
                                        : `Simulate ${staleTimeLimit} minutes passing without replies to trigger stale lead warning`
                                    }
                                    className="text-[10px] flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-850 text-slate-400 hover:text-white transition-all hover:bg-slate-850 disabled:opacity-40 disabled:pointer-events-none"
                                  >
                                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                                    +{staleTimeLimit} Mins
                                  </button>
                                )}
                                <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded ${activeConv.status === "blocked"
                                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                    : activeConv.status === "escalated"
                                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                      : activeConv.status === "stale"
                                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  }`}>
                                  {activeConv.status}
                                </span>
                                {activeConv.value > 0 && (
                                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded font-mono">
                                    ₹{activeConv.value}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 flex flex-col">
                              {activeConv.chatHistory && activeConv.chatHistory.length > 0 ? (
                                activeConv.chatHistory.map((m, idx) => {
                                  const isCustomer = m.sender === "customer";
                                  const isOwner = m.sender === "owner";
                                  const isSystem = m.sender === "system";

                                  if (isSystem) {
                                    return (
                                      <div key={idx} className="self-center my-1 bg-slate-900/60 border border-slate-850 px-3 py-1 rounded text-[10px] text-slate-400 font-mono text-center max-w-[90%]">
                                        {m.text}
                                      </div>
                                    );
                                  }

                                  return (
                                    <div
                                      key={idx}
                                      className={`flex flex-col max-w-[80%] ${isCustomer ? "self-start items-start" : "self-end items-end"
                                        }`}
                                    >
                                      <div
                                        className={`p-2.5 rounded-xl text-xs leading-relaxed ${isCustomer
                                            ? "bg-slate-900 border border-slate-850 text-slate-105 text-left rounded-tl-none"
                                            : isOwner
                                              ? "bg-emerald-600 text-slate-950 font-medium text-right rounded-tr-none"
                                              : "bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-right rounded-tr-none"
                                          }`}
                                      >
                                        <p>{m.text}</p>
                                      </div>
                                      <span className="text-[8px] font-mono text-slate-600 mt-1 uppercase">
                                        {isCustomer ? "Customer" : isOwner ? "You (Owner)" : "Wapi Agent"} • {m.timestamp}
                                      </span>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="flex-1 flex items-center justify-center text-[11px] text-slate-500 font-mono">
                                  No message history available
                                </div>
                              )}
                              <div ref={chatEndRef} />
                            </div>

                            {/* Reply Input Box */}
                            <div className="p-3 border-t border-slate-900 bg-slate-950 flex gap-2 shrink-0">
                              <input
                                aria-label="Reply message"
                                type="text"
                                placeholder="Type a manual reply as business owner..."
                                className="flex-1 bg-slate-900 border border-slate-850 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                                value={crmReplyMessage}
                                onChange={(e) => setCrmReplyMessage(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleCrmSendReply();
                                  }
                                }}
                              />
                              <button
                                onClick={handleCrmSendReply}
                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded transition-colors"
                              >
                                Send
                              </button>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-xs text-slate-500 font-mono">
                        Select a conversation to view chat history
                      </div>
                    )}
                  </div>
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
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">Business Name</label>
                      <input
                        aria-label="input"
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">Vertical / Type</label>
                      <input
                        aria-label="input"
                        type="text"
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">Stale Threshold</label>
                      <div className="flex items-center gap-2">
                        <input
                          aria-label="stale lead threshold"
                          type="number"
                          min={1}
                          max={120}
                          value={staleTimeLimit}
                          onChange={(e) => setStaleTimeLimit(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50"
                        />
                        <span className="text-[10px] text-slate-500 font-mono">Mins</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">Stale Warnings</label>
                      <button
                        onClick={() => setEnableStaleNudge(!enableStaleNudge)}
                        className={`w-full py-1 text-xs rounded font-bold border transition-all ${enableStaleNudge
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-slate-950 border-slate-850 text-slate-500"
                          }`}
                      >
                        {enableStaleNudge ? "🟢 Enabled" : "🔴 Disabled"}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-slate-500 uppercase flex items-center justify-between">
                      <span>Document Text (split on double newlines)</span>
                      <span className="text-[9px] text-emerald-400 font-normal">Supports markdown lists and prices</span>
                    </label>
                    <textarea
                      aria-label="text"
                      value={knowledgeText}
                      onChange={(e) => setKnowledgeText(e.target.value)}
                      rows={12}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500/50 leading-relaxed resize-y"
                    />
                  </div>

                  <div className="flex gap-2">
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
                      className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg text-slate-950 text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    >
                      Index Documents & Update AI Brain
                    </button>
                    <button
                      onClick={() => {
                        setSetupTemplate("custom");
                        setSetupBusinessName(businessName);
                        setSetupBusinessType(businessType);
                        setSetupKnowledgeText(knowledgeText);
                        setIsSetupComplete(false);
                      }}
                      className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-all rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Sliders className="w-3.5 h-3.5" /> Reconfigure
                    </button>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "bookings" && (
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-xl flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm">Simulated Transactions</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      View all transactions processed during the simulation session.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-880 text-[10px] text-slate-400 font-mono">
                    Total: {completedTransactions.length}
                  </span>
                </div>

                {completedTransactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-slate-900 rounded-2xl bg-slate-900/10 min-h-[300px]">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-slate-500 mb-4 border border-slate-850">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-white text-sm">No bookings or orders yet</h3>
                    <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
                      Try ordering a product or booking an appointment in the simulator chat. Once the AI agent collects all details, it will confirm and list it here!
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
                    {completedTransactions.map((tx, i) => (
                      <div key={i} className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl flex flex-col gap-2.5 relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 right-0 h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                        <div className="flex justify-between items-start pt-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base">
                              {tx.type === 'appointment' ? '📅' : tx.type === 'order' ? '🛍️' : '💳'}
                            </span>
                            <div>
                              <span className="text-xs font-bold text-white capitalize">{tx.type} Confirmed</span>
                              <span className="text-[9px] text-slate-500 block font-mono">{tx.timestamp}</span>
                            </div>
                          </div>
                          {tx.value > 0 && (
                            <span className="text-xs font-mono font-bold text-emerald-400 bg-slate-950 px-2 py-0.5 border border-slate-850 rounded">
                              ₹{tx.value}
                            </span>
                          )}
                        </div>

                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 text-xs flex flex-col gap-1.5">
                          {tx.type === 'appointment' && (
                            <>
                              <div className="flex justify-between"><span className="text-slate-500 font-mono text-[9px]">Service:</span> <span className="text-white font-medium">{tx.details?.service || "N/A"}</span></div>
                              <div className="flex justify-between"><span className="text-slate-500 font-mono text-[9px]">Date:</span> <span className="text-white font-medium">{tx.details?.date || "N/A"}</span></div>
                              <div className="flex justify-between"><span className="text-slate-500 font-mono text-[9px]">Time Slot:</span> <span className="text-white font-medium">{tx.details?.time || "N/A"}</span></div>
                              <div className="flex justify-between"><span className="text-slate-500 font-mono text-[9px]">Customer Name:</span> <span className="text-white font-medium">{tx.details?.name || tx.customerName || "Valued Customer"}</span></div>
                              {(tx.details?.phone || tx.customerPhone) && (
                                <div className="flex justify-between"><span className="text-slate-500 font-mono text-[9px]">Phone:</span> <span className="text-white font-medium font-mono">{tx.details?.phone || tx.customerPhone}</span></div>
                              )}
                            </>
                          )}

                          {tx.type === 'order' && (
                            <>
                              <div className="flex justify-between"><span className="text-slate-500 font-mono text-[9px]">Product:</span> <span className="text-white font-medium">{tx.details?.product || "N/A"}</span></div>
                              <div className="flex justify-between"><span className="text-slate-500 font-mono text-[9px]">Quantity:</span> <span className="text-white font-medium">{tx.details?.quantity || 1}</span></div>
                              <div className="flex justify-between"><span className="text-slate-500 font-mono text-[9px]">Delivery Address:</span> <span className="text-white font-medium break-all text-right max-w-[150px]">{tx.details?.address || "N/A"}</span></div>
                              <div className="flex justify-between"><span className="text-slate-500 font-mono text-[9px]">Customer Name:</span> <span className="text-white font-medium">{tx.details?.name || tx.customerName || "Valued Customer"}</span></div>
                              {(tx.details?.phone || tx.customerPhone) && (
                                <div className="flex justify-between"><span className="text-slate-500 font-mono text-[9px]">Phone:</span> <span className="text-white font-medium font-mono">{tx.details?.phone || tx.customerPhone}</span></div>
                              )}
                            </>
                          )}

                          {tx.type === 'subscription' && (
                            <>
                              <div className="flex justify-between"><span className="text-slate-500 font-mono text-[9px]">Plan Name:</span> <span className="text-white font-medium">{tx.details?.plan || "N/A"}</span></div>
                              <div className="flex justify-between"><span className="text-slate-500 font-mono text-[9px]">Customer Email:</span> <span className="text-white font-medium break-all text-right max-w-[150px]">{tx.details?.email || "N/A"}</span></div>
                              <div className="flex justify-between"><span className="text-slate-500 font-mono text-[9px]">Customer Name:</span> <span className="text-white font-medium">{tx.details?.name || tx.customerName || "Valued Customer"}</span></div>
                              {(tx.details?.phone || tx.customerPhone) && (
                                <div className="flex justify-between"><span className="text-slate-500 font-mono text-[9px]">Phone:</span> <span className="text-white font-medium font-mono">{tx.details?.phone || tx.customerPhone}</span></div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
