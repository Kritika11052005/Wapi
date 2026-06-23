import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client with service key to bypass RLS in Lemma backend tasks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAdmin = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
  : null;

// Initialize Google Generative AI
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

export class LemmaAgent {
  name: string;
  description: string;
  documentStore: {
    search: (args: { query: string; businessId: string; topK?: number; similarityThreshold?: number }) => Promise<any[]>;
  };
  datastore: {
    upsert: (table: string, data: any) => Promise<any>;
  };
  model: {
    generate: (prompt: string) => Promise<string>;
  };
  systemPrompt: string;

  constructor(config: {
    name: string;
    description: string;
    documentStore?: any;
    datastore?: any;
    model?: any;
    systemPrompt: string;
  }) {
    this.name = config.name;
    this.description = config.description;
    this.systemPrompt = config.systemPrompt;

    // Set up Document Store Search (RAG lookup)
    this.documentStore = {
      search: async ({ query, businessId, topK = 3, similarityThreshold = 0.7 }) => {
        if (!supabaseAdmin || !genAI) {
          console.warn("Supabase or Gemini API Key not configured for RAG search");
          return [];
        }

        try {
          // 1. Generate Query Embedding using gemini-embedding-001
          const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
          const embedResult = await embeddingModel.embedContent({
            content: { role: "user", parts: [{ text: query }] },
          });
          const queryEmbedding = embedResult.embedding.values;

          // 2. Query Supabase using match_document_chunks RPC
          const { data: chunks, error } = await supabaseAdmin.rpc("match_document_chunks", {
            query_embedding: queryEmbedding,
            match_threshold: similarityThreshold,
            match_count: topK,
            filter_business_id: businessId
          });

          if (error) {
            console.error("Error in match_document_chunks RPC:", error);
            // Fallback: If RPC fails, try query directly without vector if needed, or return empty
            return [];
          }

          return chunks || [];
        } catch (err) {
          console.error("Error during document search:", err);
          return [];
        }
      }
    };

    // Set up Datastore
    this.datastore = {
      upsert: async (table: string, data: any) => {
        if (!supabaseAdmin) {
          throw new Error("Supabase Admin client not initialized");
        }
        let options = undefined;
        if (table === "conversations") {
          options = { onConflict: "business_id,customer_id" };
        } else if (table === "customers") {
          options = { onConflict: "business_id,phone" };
        }
        const { data: result, error } = await supabaseAdmin
          .from(table)
          .upsert(data, options)
          .select();
        if (error) {
          console.error(`Error upserting to ${table}:`, error);
          throw error;
        }
        return result;
      }
    };

    // Set up Model Generator
    this.model = {
      generate: async (prompt: string) => {
        if (!genAI) {
          throw new Error("Gemini API Key not configured");
        }
        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
        const result = await model.generateContent(prompt);
        return result.response.text();
      }
    };
  }

  // Execute Agent Reasoning
  async run(input: {
    userMessage: string;
    preprocessedQuery?: string;
    detectedLanguage?: string;
    context: any[];
    conversationHistory: any[];
    businessName: string;
  }): Promise<{ text: string }> {
    if (!genAI) {
      throw new Error("Gemini API Key not configured");
    }

    const businessName = input.businessName || "the business";
    const formattedSysPrompt = this.systemPrompt.replace(/{business_name}/g, businessName);

    const contextStr = input.context && input.context.length > 0
      ? input.context.map((c, i) => `[Doc ${i + 1}]: ${c.content}`).join("\n\n")
      : "No document context found for this inquiry.";

    const historyStr = input.conversationHistory && input.conversationHistory.length > 0
      ? input.conversationHistory.map(m => `${m.role === 'owner' ? 'business' : m.role}: ${m.content}`).join("\n")
      : "No previous history.";

    const fullPrompt = `
You are an AI WhatsApp responder.
=== System Instructions ===
${formattedSysPrompt}

=== Available Document Context ===
${contextStr}

=== Conversation History ===
${historyStr}

=== Current User Message ===
customer (original): ${input.userMessage}
${input.preprocessedQuery ? `customer (cleaned English translation): ${input.preprocessedQuery}` : ""}
${input.detectedLanguage ? `detected language: ${input.detectedLanguage}` : ""}

Response guidelines:
1. First, think step-by-step about whether the question can be answered from the context and calculate your confidence. Write this thinking inside a <thinking>...</thinking> block.
2. Formulate your answer based ONLY on the provided Document Context. Do not invent any pricing or services.
3. Respond in the same language the customer used (detected language: ${input.detectedLanguage || "English"}). If the customer message is in a language other than English (e.g. Hindi, Hinglish, Spanish), you MUST translate your final answer from the English document context into that language perfectly.
4. End your response with a JSON block containing confidence, intent_score, and estimated_value (in Indian Rupees: ₹).
Example format:
<thinking>
The user is asking for the location. Doc 2 states the location is "4th Block, MG Road, Pune". I can answer with high confidence (1.0).
</thinking>
We are located at 4th Block, MG Road, Pune.
{"confidence": 1.0, "intent_score": 0.9, "estimated_value": 0}

If you are unsure of the answer or if the information is not in the Document Context, reply with "ESCALATE" and:
{"confidence": 0.20, "intent_score": 0.50, "estimated_value": 0}
`;

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const result = await model.generateContent(fullPrompt);
    const text = result.response.text();
    console.log("Gemini Raw Response:", text);

    return { text };
  }
}

export class LemmaWorkflow {
  name: string;
  steps: Array<{ name: string; fn: (ctx: any) => Promise<any> }>;

  constructor(config: {
    name: string;
    steps: Array<{ name: string; fn: (ctx: any) => Promise<any> }>;
  }) {
    this.name = config.name;
    this.steps = config.steps;
  }

  async run(input: any): Promise<any> {
    const ctx: any = {
      input,
      steps: {}
    };

    // Run each step sequentially, passing the cumulative context
    for (const step of this.steps) {
      try {
        const result = await step.fn(ctx);
        ctx.steps[step.name] = result;
      } catch (err) {
        console.error(`Error in workflow step '${step.name}':`, err);
        throw err;
      }
    }

    return ctx;
  }
}

export class LemmaFunction {
  name: string;
  inputSchema: any;
  fn: (input: any) => Promise<any>;

  constructor(config: {
    name: string;
    input: any;
    fn: (input: any) => Promise<any>;
  }) {
    this.name = config.name;
    this.inputSchema = config.input;
    this.fn = config.fn;
  }

  async run(input: any): Promise<any> {
    return this.fn(input);
  }
}

export class LemmaIntegration {
  name: string;
  type: string;
  config: any;
  sendFn: (to: string, message: string) => Promise<any>;

  constructor(config: {
    name: string;
    type: string;
    config: any;
    send: (to: string, message: string) => Promise<any>;
  }) {
    this.name = config.name;
    this.type = config.type;
    this.config = config.config;
    this.sendFn = config.send;
  }

  async send(to: string, message: string): Promise<any> {
    return this.sendFn(to, message);
  }
}
