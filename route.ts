import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
      chatHistory, 
      documentText, 
      businessName, 
      businessType,
      audio,
      mimeType,
      speechLanguage 
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
        const queryEmbedResult = await embeddingModel.embedContent({
          content: { role: "user", parts: [{ text: preprocessed.cleanedEnglishQuery }] },
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
          .filter((c) => c.similarity >= 0.25)
          .slice(0, 3);
      }
    }

    const contextText = retrievedChunks.map((c) => c.text).join("\n\n");

    // Step 3: Inference
    let aiResponse = "";
    let systemInstructions = "";
    let rawInferencePrompt = "";
    if (preprocessed.isGibberishOrNoise) {
      aiResponse = "ESCALATE";
    } else {
      const historyText = chatHistory
        .map((h: any) => `${h.sender === "customer" ? "Customer" : "Agent"}: ${h.text}`)
        .join("\n");

      systemInstructions = `
You are an AI customer support agent for "${businessName}" (a ${businessType}).
Your goal is to answer the customer's query using ONLY the retrieved facts below.
If the answer cannot be found in the facts, or if you are unsure, respond ONLY with: ESCALATE

Rules:
1. Do NOT make up facts. Stick strictly to the provided information.
2. If the user's question is not answered by the facts, you MUST say: ESCALATE
3. Respond in the customer's language (${preprocessed.detectedLanguage}). If Hinglish, respond in friendly Hinglish (Hindi written in Latin script). If Marathi, respond in Marathi. If Spanish, respond in Spanish.
4. Keep the response polite, helpful, and concise (under 2-3 sentences).
`;

      rawInferencePrompt = `
Retrieved facts:
${contextText || "No context retrieved."}

Conversation History:
${historyText || "No history."}
Customer: ${finalMessage}

Agent:`;

      const inferenceResult = await model.generateContent({
        contents: [
          { role: "user", parts: [{ text: `${systemInstructions}\n\n${rawInferencePrompt}` }] }
        ],
      });
      aiResponse = inferenceResult.response.text().trim();
    }

    // Step 4: Scoring and Gating
    let confidence = 1.0;
    let intentScore = 0.5;
    let estimatedValue = 0;

    if (aiResponse === "ESCALATE") {
      confidence = 0.2;
      intentScore = 0.8;
      estimatedValue = 0;
    } else {
      const scorePrompt = `
Analyze the customer's message and the AI's drafted response to evaluate lead metrics.
Return a valid JSON object matching the schema below.

Customer Query: "${finalMessage}"
AI Response: "${aiResponse}"

Rules:
1. "intentScore" should be between 0.0 and 1.0, representing how likely they want to purchase or book a service (e.g. asking for prices/slots/bookings is 0.8+, general inquiries about location/timings is 0.3-0.5, greetings is 0.1).
2. "estimatedValue" should be an estimate of the sale in Indian Rupees (₹) based on the services they are asking about. If they ask about standard hair styling (e.g. ₹500) set 500. If they ask about a package, guess its value. If no price is mentioned or they ask location/greetings, set 0.
3. "confidence" is your confidence in the AI response (0.0 to 1.0). If the answer matches context well, set 0.95+.

JSON Schema:
{
  "confidence": float,
  "intentScore": float,
  "estimatedValue": number
}

Respond ONLY with the JSON block. Do not include markdown code block formatting (like \`\`\`json).
`;
      const scoreResult = await model.generateContent(scorePrompt);
      const scoreText = scoreResult.response.text().trim();
      const scoreJsonMatch = scoreText.match(/\{[\s\S]*\}/);
      if (scoreJsonMatch) {
        try {
          const scoreData = JSON.parse(scoreJsonMatch[0]);
          confidence = scoreData.confidence ?? 1.0;
          intentScore = scoreData.intentScore ?? 0.5;
          estimatedValue = scoreData.estimatedValue ?? 0;
        } catch (e) {
          console.error("Error parsing score JSON:", e);
        }
      }
    }

    const finalStatus =
      preprocessed.isGibberishOrNoise || aiResponse === "ESCALATE" || confidence < 0.7
        ? "escalated"
        : "auto-replied";

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
