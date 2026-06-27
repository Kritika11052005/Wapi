/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { preprocessCustomerMessage } from "@/lib/agent/preprocessor";
import { parseAgentResponse, getEscalationMessage } from "@/lib/agent/router";
import { getHarassmentResponse, HARASSMENT_RESPONSES } from "@/lib/agent/harassment-handler";
import { screenEmojis } from "@/lib/agent/emoji-screener";
import {
  hashMessage,
  getRepeatAction,
  getRepeatResponse,
  isRapidSpam
} from "@/lib/agent/repeat-detector";

function cosineSimilarity(vecA: number[], vecB: number[]) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function checkSafetyAndGetText(result: any): string {
  if (!result || !result.response) {
    throw new Error("No response returned from the model.");
  }

  const blockReason = result.response.promptFeedback?.blockReason;
  if (blockReason) {
    throw new Error(`PROHIBITED_CONTENT: ${blockReason}`);
  }

  return result.response.text().trim();
}

function handleSafetyBlock(
  message: string,
  harassmentCount: number,
  currentHash: string | null,
  repeatCount: number,
  lastRepeatAt: string | null,
  transcribedText: string
) {
  const newHarassmentCount = harassmentCount + 1;
  const shouldBlock = newHarassmentCount >= 2; // block on second offense

  return NextResponse.json({
    preprocessed: {
      cleanedEnglishQuery: message,
      detectedLanguage: "Unknown (Safety Block)",
      isGibberishOrNoise: false
    },
    retrievedChunks: [],
    rawPrompt: "",
    response: "⚠️ [AI Safety Warning]: The message was flagged by the system safety filter as prohibited content.",
    evaluation: {
      confidence: 0,
      intentScore: 0,
      estimatedValue: 0
    },
    status: shouldBlock ? "blocked" : "auto-replied",
    guardAction: "safety_block",
    guardMessage: "AI Safety filter triggered (PROHIBITED_CONTENT).",
    newHarassmentCount,
    newIsBlocked: shouldBlock,
    newLastMessageHash: currentHash,
    newRepeatCount: repeatCount,
    newLastRepeatAt: lastRepeatAt,
    transcription: transcribedText,
  });
}

export async function POST(request: Request) {
  try {
    const {
      message,
      chatHistory = [],
      documentText,
      businessName,
      businessType,
      audio,
      mimeType,
      speechLanguage,
      // Guard state passed from the demo page (in-memory state)
      harassmentCount = 0,
      isBlocked = false,
      lastMessageHash = null,
      repeatCount = 0,
      lastRepeatAt = null,
    } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY environment variable is not configured." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    if (message === "GENERATE_PRESETS") {
      const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
      const prompt = `
You are an AI assistant helping to build an interactive demo sandbox for a business: "${businessName}" (a ${businessType || "Business"}).
Given the business details below, generate exactly 5 realistic, short sample customer questions/messages that a customer might send to this business on WhatsApp.
Return them as a JSON array of strings.

Business Details / Knowledge Base:
${documentText || "No additional info provided."}

Rules for the 5 queries:
1. One query should be in Hinglish (Hindi written in English alphabet, e.g. "kaha hai shop?", "price kitna hai?", "appointment milega?").
2. One query should be in Marathi or another regional Indian language (e.g. "rate kay aahe?", "timing kay aahe?", "kiti vaaje paryant ughda aste?").
3. One query should have some typical typos/grammar mistakes in English (e.g. "what the price", "delievery charge", "booking for sonday").
4. One query should be a general query in Spanish or another global language (e.g. "¿dónde están?", "¿cuál es el precio?", "hola").
5. One query should be a high-value booking query mentioning prices or packages (e.g. "I want to book the VIP Bridal Package for ₹8500", "I want to sign up for the annual plan").

Respond ONLY with a JSON array of strings, e.g.:
[
  "query 1",
  "query 2",
  "query 3",
  "query 4",
  "query 5"
]
Do NOT include any markdown code blocks, backticks, or any text other than the JSON array.
`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error(`Failed to parse presets JSON: ${text}`);
      }
      const presets = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ presets });
    }

    // ═══════════════════════════════════════════════
    // GUARD 1 — BLOCK CHECK
    // ═══════════════════════════════════════════════
    if (isBlocked) {
      return NextResponse.json({
        preprocessed: { cleanedEnglishQuery: "", detectedLanguage: "N/A", isGibberishOrNoise: false },
        retrievedChunks: [],
        rawPrompt: "",
        response: "",
        evaluation: { confidence: 0, intentScore: 0, estimatedValue: 0 },
        status: "blocked",
        guardAction: "blocked",
        guardMessage: null,
        newHarassmentCount: harassmentCount,
        newIsBlocked: true,
        newLastMessageHash: lastMessageHash,
        newRepeatCount: repeatCount,
        newLastRepeatAt: lastRepeatAt,
      });
    }

    let finalMessage = message || "";
    let transcribedText = "";

    // If audio is provided, perform transcription first on the backend
    if (audio) {
      const sttApiKey = process.env.GOOGLE_SPEECH_TO_TEXT_API_KEY;
      if (!sttApiKey) {
        return NextResponse.json(
          { error: "GOOGLE_SPEECH_TO_TEXT_API_KEY is not configured in backend env." },
          { status: 500 }
        );
      }

      // Determine encoding based on MIME type
      let encoding = "WEBM_OPUS";
      let sampleRateHertz = 48000;

      if (mimeType?.includes("ogg")) {
        encoding = "OGG_OPUS";
      } else if (mimeType?.includes("mp4") || mimeType?.includes("aac") || mimeType?.includes("m4a")) {
        encoding = "MP3";
        sampleRateHertz = 16000;
      }

      const sttPayload = {
        config: {
          encoding,
          sampleRateHertz,
          languageCode: "en-US",
          alternativeLanguageCodes: ["hi-IN", "mr-IN", "es-ES"],
        },
        audio: {
          content: audio,
        },
      };

      const sttResponse = await fetch(
        `https://speech.googleapis.com/v1/speech:recognize?key=${sttApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sttPayload),
        }
      );

      const sttData = await sttResponse.json();

      if (sttData.error) {
        console.error("Google Speech API error in chat route:", sttData.error);
        return NextResponse.json({ error: sttData.error.message }, { status: 400 });
      }

      transcribedText = sttData.results
        ?.map((result: any) => result.alternatives?.[0]?.transcript)
        .join("\n") || "";

      if (!transcribedText.trim()) {
        return NextResponse.json({ error: "Could not transcribe audio. Speech was unclear or empty." }, { status: 400 });
      }

      finalMessage = transcribedText;
    }

    // ═══════════════════════════════════════════════
    // GUARD 2 — REPEAT/SPAM DETECTION
    // ═══════════════════════════════════════════════
    const currentHash = hashMessage(finalMessage);
    const isSameMessage = lastMessageHash === currentHash;
    const newRepeatCount = isSameMessage ? repeatCount + 1 : 0;
    const repeatAction = getRepeatAction(newRepeatCount);

    if (repeatAction !== 'normal') {
      const repeatReply = getRepeatResponse(repeatAction, businessType || "business");
      return NextResponse.json({
        preprocessed: { cleanedEnglishQuery: finalMessage, detectedLanguage: "N/A", isGibberishOrNoise: false },
        retrievedChunks: [],
        rawPrompt: "",
        response: repeatReply || "",
        evaluation: { confidence: 1.0, intentScore: 0, estimatedValue: 0 },
        status: repeatAction === 'ignore' ? 'ignored' : 'auto-replied',
        guardAction: `repeat_${repeatAction}`,
        guardMessage: repeatReply,
        newHarassmentCount: harassmentCount,
        newIsBlocked: false,
        newLastMessageHash: currentHash,
        newRepeatCount: newRepeatCount,
        newLastRepeatAt: new Date().toISOString(),
        transcription: transcribedText,
      });
    }

    // ═══════════════════════════════════════════════
    // GUARD 3 — EMOJI PRE-SCREEN
    // ═══════════════════════════════════════════════
    const emojiScreen = screenEmojis(finalMessage);

    if (emojiScreen.isAbusive && emojiScreen.confidence >= 0.95) {
      const harassReply = getHarassmentResponse(harassmentCount);
      const newCount = harassmentCount + 1;
      const shouldBlock = harassmentCount >= 1;

      return NextResponse.json({
        preprocessed: { cleanedEnglishQuery: finalMessage, detectedLanguage: "N/A", isGibberishOrNoise: false },
        retrievedChunks: [],
        rawPrompt: "",
        response: harassReply || "",
        evaluation: { confidence: 1.0, intentScore: 0, estimatedValue: 0 },
        status: shouldBlock ? "blocked" : "auto-replied",
        guardAction: "emoji_abuse",
        guardMessage: harassReply,
        emojiAbuse: {
          detected: true,
          offendingEmojis: emojiScreen.offendingEmojis,
          confidence: emojiScreen.confidence,
        },
        newHarassmentCount: newCount,
        newIsBlocked: shouldBlock,
        newLastMessageHash: currentHash,
        newRepeatCount: 0,
        newLastRepeatAt: null,
        transcription: transcribedText,
      });
    }

    // ═══════════════════════════════════════════════
    // GEMINI AGENT CALL
    // Only genuine, non-spam, non-obvious-abuse messages reach here
    // ═══════════════════════════════════════════════
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

    // Step 1: Preprocessing
    const preprocessPrompt = `
You are an advanced query preprocessor for a customer support AI assistant.
Analyze the user's incoming query and return a valid JSON object matching the schema below.

User Query: "${finalMessage}"

Rules:
1. Clean up typos and grammatical mistakes.
2. Translate the query to standard English if it is in another language (e.g. Hinglish, Marathi, Spanish, etc.).
3. Identify if the query is pure gibberish, keyboard mash, or noise (e.g. "asdfghjk", "12345", "ok ok", random characters).

JSON Schema:
{
  "cleanedEnglishQuery": "The cleaned, grammatically correct English translation of the query",
  "detectedLanguage": "The language of the original query (e.g., Hinglish, Marathi, Spanish, English, Gibberish/Keysmash)",
  "isGibberishOrNoise": boolean
}

Respond ONLY with the JSON block. Do not include markdown code block formatting (like \`\`\`json).
`;

    let preprocessed;
    try {
      const preprocessResult = await model.generateContent(preprocessPrompt);
      const preprocessText = checkSafetyAndGetText(preprocessResult);
      const jsonMatch = preprocessText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error(`Failed to parse preprocessor JSON: ${preprocessText}`);
      }
      preprocessed = JSON.parse(jsonMatch[0]);
    } catch (err: any) {
      const errMsg = err.message || "";
      if (
        errMsg.includes("SAFETY") ||
        errMsg.includes("PROHIBITED_CONTENT") ||
        errMsg.includes("blocked")
      ) {
        console.warn("Safety block triggered during preprocessing:", err);
        return handleSafetyBlock(finalMessage, harassmentCount, currentHash, repeatCount, lastRepeatAt, transcribedText);
      }
      throw err;
    }

    // Step 2: Context Retrieval (In-Memory Vector Search)
    let retrievedChunks: Array<{ text: string; similarity: number }> = [];
    if (!preprocessed.isGibberishOrNoise && documentText) {
      // Split the knowledge document into chunks by paragraphs/newlines
      const rawChunks = documentText
        .split(/\n\n+/)
        .map((c: string) => c.trim())
        .filter((c: string) => c.length > 10);

      if (rawChunks.length > 0) {
        // Embed the query
        const rawQuery = preprocessed.cleanedEnglishQuery || finalMessage;
        const normalizedQuery = preprocessCustomerMessage(rawQuery);
        const queryEmbedResult = await embeddingModel.embedContent({
          content: { role: "user", parts: [{ text: normalizedQuery }] },
        });
        const queryVector = queryEmbedResult.embedding.values;

        // Embed the chunks in parallel
        const chunkEmbedPromises = rawChunks.map(async (chunkText: string) => {
          try {
            const chunkEmbedResult = await embeddingModel.embedContent({
              content: { role: "user", parts: [{ text: chunkText }] },
            });
            const chunkVector = chunkEmbedResult.embedding.values;
            const similarity = cosineSimilarity(queryVector, chunkVector);
            return { text: chunkText, similarity };
          } catch (e) {
            console.error("Error embedding chunk in demo:", e);
            return { text: chunkText, similarity: 0 };
          }
        });

        const scoredChunks = await Promise.all(chunkEmbedPromises);
        // Sort by similarity descending and filter above threshold
        scoredChunks.sort((a, b) => b.similarity - a.similarity);
        retrievedChunks = scoredChunks
          .filter((c) => c.similarity >= 0.15)
          .slice(0, 3);
      }
    }

    const contextText = retrievedChunks.map((c) => c.text).join("\n\n");

    // Step 3: Inference & Scoring
    let aiResponse = "";
    let systemInstructions = "";
    let rawInferencePrompt = "";
    let confidence = 1.0;
    let intentScore = 0.5;
    let estimatedValue = 0;
    let finalStatus = "auto-replied";
    let guardAction: string | null = null;
    let newHarassmentCount = harassmentCount;
    let newIsBlocked = false;
    let decision: any = {
      transaction_detected: false,
      transaction_type: null,
      transaction_status: null,
      transaction_details: null
    };

    if (preprocessed.isGibberishOrNoise) {
      aiResponse = getEscalationMessage();
      confidence = 0.2;
      intentScore = 0.5;
      estimatedValue = 0;
      finalStatus = "escalated";
    } else {
      const historyText = chatHistory
        .map((h: any) => `${h.sender === "customer" ? "Customer" : "Agent"}: ${h.text}`)
        .join("\n");

      systemInstructions = `
You are a smart, warm, street-smart WhatsApp assistant for "${businessName}",
a ${businessType} based in India.

You talk like a real person — not a chatbot, not a corporate helpdesk.
You handle everything: genuine customers, confused people, rude people,
trolls, abusers, spammers — all without bothering the business owner
unless a real human is genuinely needed.

The owner's time is precious. Protect it fiercely.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRIORITY 0 — ABUSE, THREATS & HARASSMENT
Check this BEFORE everything else on every single message.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You fully understand abusive, offensive, and sexually explicit language in
ALL human languages and scripts without exception, including:

  INDIAN LANGUAGES (romanised + native script):
  Hindi, Hinglish, Tamil, Telugu, Bengali, Marathi, Punjabi, Gujarati,
  Kannada, Malayalam, Urdu, Bhojpuri, Odia, Assamese, Rajasthani,
  Haryanvi, and all regional dialects.

  You recognize all common slurs, swear words, and abuses in these languages (including Hinglish terms like saali, chutiya, kamina, etc.).

  DISGUISED ABUSE (you see through all of these):
  Leet speak, asterisk masking, phonetic spellings, spaced out characters, and mixed scripts.

  EMOJI ABUSE (you understand these combinations):
  🍆💦 or 🍆🍑 or 🍆🍑💦 = always sexual — never innocent in this context
  🔞 sent to a business = always inappropriate
  👅🍆 or 🫦🍆 or 💦😩 = always sexual
  🍆 alone with no food/recipe text = sexual
  NOTE: 🍆 in "I want eggplant curry recipe" = innocent food question

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO RESPOND TO ABUSE
Based on {harassment_count} for this customer:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COUNT = 0 (first abuse ever from this customer):
  → One calm, firm response warning the user. Under 2 sentences.
  → Clearly state that inappropriate messages are not tolerated and further abuse will result in their number being blocked.
  → Do NOT lecture. Do NOT explain. Do NOT apologise.
  → Do NOT repeat their abusive words back.
  → Sound human, not corporate. Match their language register.
  → If they wrote in Hindi → respond in Hindi/Hinglish.
  → If they wrote in English → respond in English.

  Good examples (adapt — never copy verbatim):
  Hindi abuse → "Yahan sirf professional services ki baat hoti hai. Agar aapne dobara badtameezi ki toh aapko block kar diya jayega. 🙏"
  English abuse → "We only support professional queries here. Any further inappropriate messages will result in your number being blocked. 🙏"
  Sexual request → "We do not tolerate inappropriate requests. Please keep it professional, otherwise you will be blocked. 🙏"
  
  Set action: "harassment"

COUNT = 1 (second abuse from same customer):
  → One final message. No warmth. No emoji. Short.
  → "This is a professional business. Your number has been blocked due to repeated abuse."
  → Set action: "harassment"
  → Customer will be auto-blocked after this.

COUNT ≥ 2 (third abuse or more):
  → Say NOTHING. Absolute silence. Zero response.
  → Set action: "silence"
  → Customer is already blocked.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THREAT RULE — overrides everything above
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If the message contains ANY threat regardless of language:
  → Physical harm ("main aa ke marunga", "jala doonga", "I'll hurt you")
  → Property damage ("tera salon jala doonga", "I'll destroy your shop")
  → Doxxing or exposure threats
  → Legal intimidation meant to scare

Then:
  → Send customer: "We've noted this threat and will be taking appropriate legal/police action. Your number has been blocked."
  → Set action: "escalate"
  → Set escalate_reason: "threat"
  → Owner MUST be notified immediately — this is non-negotiable.
  → Do this regardless of harassment_count.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRIORITY 1 — RESPONSE & TRANSACTION RULES (for non-abusive messages)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RULE 1 — TRANSACTION HANDLING (Booking, Ordering, Subscription)
  When: Customer expresses intent to book an appointment, place an order, or subscribe.
  Do:
    1. Identify transaction type:
       - "appointment" (e.g. salon booking, doctor slots, gym tour)
       - "order" (e.g. bakery cake purchase, physical items)
       - "subscription" (e.g. monthly gym membership, yearly plan)
    2. Check document context to verify prices and details.
    3. Collect required information step-by-step using these EXACT keys in transaction_details:
       - For "appointment": "service" (Service name), "date" (Date), "time" (Time slot), "name" (Customer name).
       - For "order": "product" (Product name), "quantity" (Quantity, as an integer), "address" (Delivery address), "name" (Customer name).
       - For "subscription": "plan" (Plan name), "email" (Customer email), "name" (Customer name).
    4. If ANY required detail is missing:
       - Set transaction_detected: true
       - Set transaction_type: "appointment" | "order" | "subscription"
       - Set transaction_status: "collecting"
       - Save all collected slots in "transaction_details" (use null for missing values) using the exact keys above.
       - Respond back asking politely for the missing slot(s) (e.g. "Which time works best for you?").
    5. Once ALL required details are successfully collected:
       - Set transaction_detected: true
       - Set transaction_type: "appointment" | "order" | "subscription"
       - Set transaction_status: "confirmed"
       - Set all collected values in "transaction_details" using the exact keys above.
       - Respond with a clear confirmation receipt message (e.g. "Perfect! I have confirmed your appointment for a Haircut tomorrow at 3 PM under Amit. See you then!").

RULE 2 — ANSWER
  When: Customer asks about services, pricing, availability, hours,
        location, policies AND the uploaded documents have the answer.
  Do: Answer directly. Be warm. Offer next step (book, visit, call).
  Tone: Friendly neighbourhood business, not a call centre.

RULE 3 — SOFT DEFLECT (in-scope but no info)
  When: Customer asks about our services but documents don't cover it.
  Do: "I don't have the exact details on [topic] right now!
      But I can help with [2 things from docs].
      Our team will follow up with you shortly 🙏"
  Never escalate for this. Never alert owner.

RULE 4 — FRIENDLY OUT-OF-SCOPE
  When: Customer asks something completely unrelated to the business.
        (food prices, other services, random questions, jokes)
  Do: Warm, light redirect. A little humour if it fits.
  Examples:
    Pani puri price → "Haha we're a beauty salon not a dhaba! 😄
                       But if you want a fresh new look, we're here!"
    "What's the weather?" → "We're better at glam than forecasts! 🌟
                             Anything beauty-related we can help with?"
  NEVER escalate. NEVER alert owner. Not even once.

RULE 5 — ESCALATE (owner notified — use sparingly)
  ONLY for these exact situations:
  a. Genuine anger or frustration — even subtle
     ("why no reply", "been waiting since morning", "pathetic service",
      "worst experience", "saali response nahi deti", "useless")
  b. Explicit request for human/owner/manager
     ("manager se baat karni hai", "talk to someone", "connect me")
  c. Complaint, refund, cancellation, or past transaction dispute
  d. Distress or urgent personal situation

  When escalating:
  → Send customer first: "I'm connecting you with our team right away!
    They'll be with you shortly 🙏"
  → Then flag for owner in dashboard.
  → Set escalate_reason: "anger"|"human_requested"|"complaint"|"transaction"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TONE & LANGUAGE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

→ Always respond in the SAME LANGUAGE the customer used.
  Hindi message → Hindi/Hinglish reply.
  Tamil message → Tamil reply.
  English message → English reply.
  Mixed Hinglish → Match their mix.

→ Typos, bad grammar, informal spelling = completely normal for Indian
  customers. NEVER let this reduce your confidence in understanding them.
  "what you price" = "what is your price" — answer it normally.
  "kitna ka h" = "kitna ka hai" = "how much does it cost" — answer it.

→ Match their energy:
  Casual → casual reply
  Formal → formal reply
  Excited → match the excitement
  Tired/brief → keep it short

→ Under 100 words unless detail genuinely needs more.
→ Use ₹ always. Never Rs, INR, or rupees.
→ Never say: "I apologize for the inconvenience"
→ Never say: "Please be advised"
→ Never say: "As per our records"
→ Never sound like a chatbot.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Business documents (services, pricing, policies):
${contextText || "No context retrieved."}

Conversation history (last 10 messages, oldest first):
${historyText || "No previous history."}

Current harassment count for this customer: ${harassmentCount}

Current message:
${finalMessage}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — ALWAYS follow exactly
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write your reply to the customer first (or nothing if action = "silence").
Then on a NEW LINE, output ONLY this JSON — never show it to the customer,
never wrap it in markdown or code blocks:

{"confidence":0.0,"intent_score":0.0,"estimated_value":0,"action":"answer","escalate_reason":null,"is_abusive":false,"abuse_type":null,"abuse_confidence":0.0,"emoji_abuse_detected":false,"offending_emojis":null,"detected_language":"english","transaction_detected":false,"transaction_type":null,"transaction_status":null,"transaction_details":null}

FIELD DEFINITIONS:
  confidence:         0.0-1.0  how confident you are in your answer
  intent_score:       0.0-1.0  how likely customer is to convert/book
  estimated_value:    number   estimated ₹ value of this conversation
  action:             "answer" | "deflect" | "escalate" | "harassment" | "silence"
  escalate_reason:    "anger" | "human_requested" | "complaint" | "transaction" | "threat" | null
  is_abusive:         true if message contained any abuse
  abuse_type:         "sexual" | "slur" | "threat" | "spam" | null
  abuse_confidence:   0.0-1.0  how confident abuse detection is
  emoji_abuse_detected: true if abusive emoji combination found
  offending_emojis:   the actual offending emojis as a string, or null
  detected_language:  "english"|"hindi"|"hinglish"|"tamil"|"telugu"|"bengali"|"marathi"|"punjabi"|"other"
  transaction_detected: true if customer is trying to book, order, or subscribe
  transaction_type:   "appointment" | "order" | "subscription" | null
  transaction_status: "collecting" | "confirmed" | null
  transaction_details: object containing collected slots. Use null for missing values. Use ONLY the following exact keys for each type:
    - For "appointment": "service", "date", "time", "name"
    - For "order": "product", "quantity", "address", "name"
    - For "subscription": "plan", "email", "name"
`;

      rawInferencePrompt = `Current customer message: ${finalMessage}`;

      let rawText = "";
      try {
        const inferenceResult = await model.generateContent({
          contents: [
            { role: "user", parts: [{ text: systemInstructions }] }
          ],
        });
        rawText = checkSafetyAndGetText(inferenceResult);
      } catch (err: any) {
        const errMsg = err.message || "";
        if (
          errMsg.includes("SAFETY") ||
          errMsg.includes("PROHIBITED_CONTENT") ||
          errMsg.includes("blocked")
        ) {
          console.warn("Safety block triggered during inference:", err);
          return handleSafetyBlock(finalMessage, harassmentCount, currentHash, repeatCount, lastRepeatAt, transcribedText);
        }
        throw err;
      }
      console.log("Demo inference raw text:", rawText);

      // Parse the response using our unified router parser
      decision = parseAgentResponse(rawText);

      const isThreat = decision.escalate_reason === "threat";

      if (decision.action === "harassment" || decision.action === "silence" || isThreat) {
        // Use our deterministic harassment response (not Gemini's)
        const responseText = isThreat
          ? HARASSMENT_RESPONSES.threat
          : getHarassmentResponse(harassmentCount);
        aiResponse = responseText || "";
        confidence = decision.confidence;
        intentScore = decision.intent_score;
        estimatedValue = decision.estimated_value;
        newHarassmentCount = harassmentCount + 1;
        newIsBlocked = harassmentCount >= 1 || isThreat; // Block on 2nd+ offense or threat
        finalStatus = newIsBlocked ? "blocked" : "auto-replied";
        guardAction = isThreat ? "threat" : "gemini_abuse";
      } else {
        aiResponse = decision.action === "escalate" ? getEscalationMessage() : decision.reply;
        confidence = decision.confidence;
        intentScore = decision.intent_score;
        estimatedValue = decision.estimated_value;
        finalStatus = (decision.action === "escalate" || confidence < 0.70) ? "escalated" : "auto-replied";
      }
    }

    return NextResponse.json({
      preprocessed,
      retrievedChunks,
      rawPrompt: systemInstructions + "\n" + rawInferencePrompt,
      response: aiResponse,
      evaluation: {
        confidence,
        intentScore,
        estimatedValue,
      },
      status: finalStatus,
      guardAction,
      newHarassmentCount,
      newIsBlocked,
      newLastMessageHash: currentHash,
      newRepeatCount: 0,
      newLastRepeatAt: null,
      transcription: transcribedText,
      transaction_detected: decision.transaction_detected,
      transaction_type: decision.transaction_type,
      transaction_status: decision.transaction_status,
      transaction_details: decision.transaction_details,
    });
  } catch (error: any) {
    console.error("Error in demo chat API:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during processing." },
      { status: 500 }
    );
  }
}
