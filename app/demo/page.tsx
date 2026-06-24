/* eslint-disable @typescript-eslint/no-explicit-any */
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
  RefreshCw
} from "lucide-react";

interface Message {
  sender: "customer" | "agent" | "owner" | "system";
  text: string;
  timestamp: string;
  isVoiceNote?: boolean;
  transcribing?: boolean;
  transcriptionText?: string;
  duration?: string;
}

interface Conversation {
  id: string;
  phone: string;
  lastMessage: string;
  time: string;
  value: number;
  intent: number;
  status: "open" | "auto-handled" | "escalated" | "stale" | "blocked";
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

function getInitialInboxForTemplate(
  templateId: string,
  businessName: string,
  businessType: string,
  presets: PresetQuery[]
): Conversation[] {
  // Card 1: The active simulator card
  const card1: Conversation = {
    id: "conv-1",
    phone: "+91 98765 43210",
    lastMessage: `Hello! Welcome to ${businessName}...`,
    time: "Just now",
    value: 0,
    intent: 0.2,
    status: "auto-handled"
  };

  // Card 2: An open lead with high/medium intent
  let card2Phone = "+91 99887 76655";
  let card2Message = "";
  let card2Value = 1500;
  let card2Intent = 0.75;

  // Card 3: An auto-handled lead with low value/intent
  let card3Phone = "+91 91234 56789";
  let card3Message = "";
  let card3Value = 0;
  let card3Intent = 0.4;

  if (templateId === "salon") {
    card2Phone = "+91 99887 76655";
    card2Message = presets[2]?.text || "what the price of women haircut";
    card2Value = 2000;
    card2Intent = 0.75;

    card3Phone = "+91 91234 56789";
    card3Message = presets[0]?.text || "kaha hai tumhara shop?";
    card3Value = 0;
    card3Intent = 0.4;
  } else if (templateId === "bakery") {
    card2Phone = "+91 99887 76655";
    card2Message = presets[2]?.text || "diliver to my home?";
    card2Value = 1100;
    card2Intent = 0.70;

    card3Phone = "+91 91234 56789";
    card3Message = presets[3]?.text || "¿dónde está la panadería?";
    card3Value = 0;
    card3Intent = 0.35;
  } else if (templateId === "dental") {
    card2Phone = "+91 88888 77777";
    card2Message = presets[1]?.text || "root canal treatment cha kharch kiti aahe?";
    card2Value = 4500;
    card2Intent = 0.85;

    card3Phone = "+91 91234 56789";
    card3Message = presets[0]?.text || "teeth whitening cost kitna hai?";
    card3Value = 1200;
    card3Intent = 0.50;
  } else if (templateId === "gym") {
    card2Phone = "+91 77777 66666";
    card2Message = presets[2]?.text || "personal training price";
    card2Value = 5000;
    card2Intent = 0.80;

    card3Phone = "+91 91234 56789";
    card3Message = presets[1]?.text || "gym timing kay aahe?";
    card3Value = 1500;
    card3Intent = 0.45;
  } else {
    // Custom business or customized templates
    card2Phone = "+91 99000 88000";
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

    card3Phone = "+91 91234 56789";
    card3Message = presets[0]?.text || `Where is ${businessName} located?`;
    card3Value = 0;
    card3Intent = 0.40;
  }

  return [
    card1,
    {
      id: "conv-2",
      phone: card2Phone,
      lastMessage: card2Message,
      time: "10m ago",
      value: card2Value,
      intent: card2Intent,
      status: "open"
    },
    {
      id: "conv-3",
      phone: card3Phone,
      lastMessage: card3Message,
      time: "1h ago",
      value: card3Value,
      intent: card3Intent,
      status: "auto-handled"
    }
  ];
}

export default function DemoPage() {
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

    // Re-initialize chat history
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

    // Re-initialize inbox queue dynamically
    setInboxList(getInitialInboxForTemplate(setupTemplate, setupBusinessName, setupBusinessType, finalPresets));

    setIsStale(false);
    setPipelineLogs(null);
    setActiveTab("pipeline");

    // Reset guard state on new sandbox
    setGuardHarassmentCount(0);
    setGuardIsBlocked(false);
    setGuardLastMessageHash(null);
    setGuardRepeatCount(0);
    setGuardLastRepeatAt(null);

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
        if (isVoice) {
          setChatHistory((prev) =>
            prev.map((msg) => {
              if (msg.isVoiceNote && msg.transcribing) {
                return {
                  ...msg,
                  transcribing: false,
                  text: `[Voice Note Error: ${data.error}]`,
                  transcriptionText: `Failed to transcribe: ${data.error}`
                };
              }
              return msg;
            })
          );
        }
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

      // If voice note succeeded, update its transcription
      if (isVoice && data.transcription) {
        setChatHistory((prev) =>
          prev.map((msg) => {
            if (msg.isVoiceNote && msg.transcribing) {
              return {
                ...msg,
                transcribing: false,
                transcriptionText: data.transcription,
                text: `🎤 Voice Note: "${data.transcription}"`
              };
            }
            return msg;
          })
        );
      }

      // ── Update guard state from API response ──
      if (data.newHarassmentCount !== undefined) setGuardHarassmentCount(data.newHarassmentCount);
      if (data.newIsBlocked !== undefined) setGuardIsBlocked(data.newIsBlocked);
      if (data.newLastMessageHash !== undefined) setGuardLastMessageHash(data.newLastMessageHash);
      if (data.newRepeatCount !== undefined) setGuardRepeatCount(data.newRepeatCount);
      if (data.newLastRepeatAt !== undefined) setGuardLastRepeatAt(data.newLastRepeatAt);

      // Handle blocked (Guard 1) — no response, just a system banner
      if (data.guardAction === 'blocked') {
        setChatHistory((prev) => [
          ...prev,
          {
            sender: "system",
            text: "🚫 This customer is blocked. Message ignored — no reply sent.",
            timestamp
          }
        ]);
      }
      // Handle repeat detection (Guard 2)
      else if (data.guardAction?.startsWith('repeat_')) {
        if (data.guardAction === 'repeat_ignore') {
          setChatHistory((prev) => [
            ...prev,
            {
              sender: "system",
              text: "🔇 Repeat spam detected (4th+ time). Complete silence — no reply sent.",
              timestamp
            }
          ]);
        } else if (data.response) {
          setChatHistory((prev) => [
            ...prev,
            {
              sender: "agent",
              text: data.response,
              timestamp
            }
          ]);
        }
      }
      // Handle emoji abuse (Guard 3)
      else if (data.guardAction === 'emoji_abuse') {
        if (data.response) {
          setChatHistory((prev) => [
            ...prev,
            {
              sender: "agent",
              text: data.response,
              timestamp
            }
          ]);
        }
        if (data.newIsBlocked) {
          setChatHistory((prev) => [
            ...prev,
            {
              sender: "system",
              text: "🚫 Customer blocked after repeated emoji abuse.",
              timestamp
            }
          ]);
        }
      }
      // Handle Gemini-detected abuse
      else if (data.guardAction === 'gemini_abuse') {
        if (data.response) {
          setChatHistory((prev) => [
            ...prev,
            {
              sender: "agent",
              text: data.response,
              timestamp
            }
          ]);
        }
        if (data.newIsBlocked) {
          setChatHistory((prev) => [
            ...prev,
            {
              sender: "system",
              text: "🚫 Customer blocked after repeated harassment. All future messages will be silently ignored.",
              timestamp
            }
          ]);
        }
      }
      // Normal AI response
      else if (data.response && data.response !== "ESCALATE") {
        setChatHistory((prev) => [
          ...prev,
          {
            sender: "agent",
            text: data.response,
            timestamp
          }
        ]);
      }

      // Add Escalation banner if escalated
      if (data.status === "escalated" && !data.guardAction) {
        setChatHistory((prev) => [
          ...prev,
          {
            sender: "system",
            text: "⚠️ Conversation escalated to business owner.",
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

        {/* Right Side: Wapi Portal & Workflow Logs */}
        <section className="lg:col-span-7 flex flex-col gap-6">
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
              onClick={() => setActiveTab("pipeline")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${activeTab === "pipeline"
                  ? "bg-slate-900 text-emerald-400 border border-slate-800 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
                }`}
            >
              <Bot className="w-4 h-4" /> Pipeline Inspector
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
                        className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all hover:scale-[1.01] ${cardBorder} ${isActive ? "ring-2 ring-emerald-500/30" : ""
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
                              {conv.status === "blocked" ? "🚫 BLOCKED" : conv.status === "stale" ? "STALE LEAD" : conv.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 truncate max-w-md">&quot;{conv.lastMessage}&#34;</p>

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
          </div>
        </section>
      </main>
    </div>
  );
}
