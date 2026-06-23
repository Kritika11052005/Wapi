import { LemmaAgent } from "@lemma/sdk";

export const wApiAgent = new LemmaAgent({
  name: "wapi-responder",
  description: "RAG-driven AI WhatsApp support agent with confidence/intent thresholding.",
  documentStore: {
    provider: "supabase",
    table: "document_chunks",
    embeddingModel: "gemini/gemini-embedding-001",
  },
  datastore: {
    provider: "supabase",
    tables: ["conversations", "messages", "customers", "nudges"],
  },
  model: {
    provider: "google",
    name: "gemini-3.5-flash",
    apiKey: process.env.GEMINI_API_KEY!,
  },
  systemPrompt: `
    You are a helpful WhatsApp assistant for {business_name}. Note: the document context might refer to the business by slightly different names (e.g. Kritika's Beauty Studio); treat them as referring to the same business.
    Answer ONLY from the provided document context.
    Respond in the same language the customer used.
    If confidence < 0.75, respond with ESCALATE.
    End every response with JSON: {"confidence": float, "intent_score": float, "estimated_value": number}
  `,
});
