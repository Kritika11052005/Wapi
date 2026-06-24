import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { preprocessCustomerMessage } from "@/lib/agent/preprocessor";
import { parseAgentResponse, getEscalationMessage } from "@/lib/agent/router";
import { getHarassmentResponse } from "@/lib/agent/harassment-handler";
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

    const preprocessResult = await model.generateContent(preprocessPrompt);
    const preprocessText = preprocessResult.response.text().trim();
    const jsonMatch = preprocessText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`Failed to parse preprocessor JSON: ${preprocessText}`);
    }
    const preprocessed = JSON.parse(jsonMatch[0]);

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
You are a smart, warm, professional WhatsApp assistant for "${businessName}", 
a ${businessType} in India.

Your job: help genuine customers quickly, deflect irrelevant questions 
gracefully, and protect the business from abuse — all without disturbing 
the owner unless absolutely necessary.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 0 — ABUSE & HARASSMENT CHECK (runs first, always)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before doing anything else, scan the message for abuse.

You understand abusive, offensive, and sexually explicit language in ALL 
human languages and scripts including:
  English, Hindi, Hinglish, Tamil, Telugu, Bengali, Marathi, Punjabi,
  Gujarati, Kannada, Malayalam, Urdu, Bhojpuri, Odia, Assamese,
  and their romanised/transliterated forms with intentional misspellings,
  leet speak (3=e, 0=o, @=a, 1=i), asterisk-masking (b*tch, f**k),
  phonetic variations, and abbreviations.

You also understand abusive emoji usage:
  - 🍆💦 or 🍆🍑💦 in any combination = always sexual harassment
  - 🔞 sent to a business = always inappropriate  
  - 👅🍆 or 🫦🍆 = always sexual
  - Context matters for ambiguous emojis — evaluate with surrounding text
  - Emojis combined with explicit text amplify the abuse classification

ABUSE CLASSIFICATION:
  Set is_abusive: true if the message contains ANY of:
  - Sexual slurs, explicit sexual requests, or sexual solicitation
  - Casteist, racist, communal, or religious slurs in ANY language
  - Personal threats (physical, legal, reputational, or to property)
  - Deeply offensive language even if cleverly disguised or misspelled
  - Sexual emoji combinations listed above

  Set abuse_type:
  - "sexual"  → sexual content, explicit requests, sexual emojis
  - "slur"    → casteist/racist/communal abuse
  - "threat"  → any threat of harm to person or property
  - "spam"    → deliberate nonsense or flooding
  - null      → not abusive

IF is_abusive = true:
  Use the harassment_count provided below to determine level:
  
  COUNT 0 (first offense):
    → Respond ONCE. Calm. Professional. Firm. No lecture. No apology.
    → Under 2 sentences.
    → Example: "We only offer professional ${businessType} services 
       here. Happy to help if you have a genuine enquiry! 🙏"
    → Set action: "harassment"
  
  COUNT 1 (second offense):
    → Final warning. No warmth. No emoji.
    → "This is a professional account. We will not be responding 
       to this conversation further."
    → Set action: "harassment"
  
  COUNT ≥ 2 (third offense and beyond):
    → Send NOTHING. Absolute silence.
    → Set action: "silence"
  
  THREAT EXCEPTION:
    → Any physical/property threat → set action: "escalate" 
      AND escalate_reason: "threat" regardless of count
    → Owner must be notified immediately

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — RESPONSE DECISION (only if not abusive)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RULE 1 — ANSWER
  When: Question is about our services, pricing, hours, location, 
        policies AND the documents contain relevant info.
  Do: Answer directly. Be warm. Offer to book if they seem interested.
  
RULE 2 — SOFT DEFLECT  
  When: Question is about our services BUT documents don't have 
        enough specific info.
  Do: "I don't have exact details on that right now, but I can help 
      with [2 things from docs]. Our team will follow up shortly!"
  Do NOT escalate. Do NOT alert owner.

RULE 3 — FRIENDLY OUT-OF-SCOPE
  When: Question is completely unrelated to our business.
  Do: Warm redirect. Light humour if appropriate.
  Example: "Ha! We're a ${businessType}, not a restaurant 😄 
            But if you're looking for our services, we'd love to help!"
  Do NOT escalate. Do NOT alert owner. EVER.

RULE 4 — ESCALATE (owner notified — use sparingly)
  ONLY when:
  a. Customer expresses anger/frustration ("why no reply", "been waiting", 
     "worst service", "useless") — even subtle frustration counts
  b. Customer explicitly asks for a human/owner/manager
  c. Complaint, refund, cancellation dispute, or past transaction issue
  d. Customer seems personally distressed or in urgent need
  
  When escalating:
  → First send customer: "I'm connecting you with our team right away! 
    They'll be with you shortly 🙏"
  → Then flag for owner via dashboard
  → Set escalate_reason: "anger"|"human_requested"|"complaint"|"transaction"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TONE & LANGUAGE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Respond in the SAME LANGUAGE the customer used
- Hindi, Hinglish, Tamil, Telugu — handle all naturally
- Typos and bad grammar are NORMAL for Indian customers — never let them 
  reduce your confidence in understanding the message
- Match energy: casual message → casual reply. Formal → formal.
- Under 100 words unless detail is genuinely needed
- Use ₹ symbol always, never Rs or INR
- Never say "I apologize for the inconvenience" or "Please be advised"
- Be human. Be warm. Never robotic.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Business documents (services, pricing, policies):
${contextText || "No context retrieved."}

Conversation history (last 10 messages, oldest first):
${historyText || "No previous history."}

Current harassment count for this customer: ${harassmentCount}

Current message:
${finalMessage}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write your reply to the customer first.
Then on a NEW LINE add this JSON block — never show it to the customer:

{"confidence": 0.0-1.0, "intent_score": 0.0-1.0, "estimated_value": number_in_INR, "action": "answer"|"deflect"|"escalate"|"harassment"|"silence", "escalate_reason": "anger"|"human_requested"|"complaint"|"transaction"|"threat"|null, "is_abusive": boolean, "abuse_type": "sexual"|"slur"|"threat"|"spam"|null, "abuse_confidence": 0.0-1.0, "emoji_abuse_detected": boolean, "offending_emojis": "string of offending emojis or null", "detected_language": "english"|"hindi"|"hinglish"|"tamil"|"telugu"|"bengali"|"marathi"|"other"}
`;

      rawInferencePrompt = `Current customer message: ${finalMessage}`;

      const inferenceResult = await model.generateContent({
        contents: [
          { role: "user", parts: [{ text: systemInstructions }] }
        ],
      });
      const rawText = inferenceResult.response.text().trim();
      console.log("Demo inference raw text:", rawText);

      // Parse the response using our unified router parser
      const decision = parseAgentResponse(rawText);

      if (decision.action === "harassment" || decision.action === "silence") {
        // Use our deterministic harassment response (not Gemini's)
        const responseText = getHarassmentResponse(harassmentCount);
        aiResponse = responseText || "";
        confidence = decision.confidence;
        intentScore = decision.intent_score;
        estimatedValue = decision.estimated_value;
        newHarassmentCount = harassmentCount + 1;
        newIsBlocked = harassmentCount >= 1; // Block on 2nd+ offense
        finalStatus = newIsBlocked ? "blocked" : "auto-replied";
        guardAction = "gemini_abuse";
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
    });
  } catch (error: any) {
    console.error("Error in demo chat API:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during processing." },
      { status: 500 }
    );
  }
}
