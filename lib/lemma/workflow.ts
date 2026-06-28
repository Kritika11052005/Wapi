/* eslint-disable @typescript-eslint/no-explicit-any */
import { LemmaWorkflow } from "@lemma/sdk";
import { wApiAgent } from "./agent";
import { preprocessCustomerMessage } from "@/lib/agent/preprocessor";
import { parseAgentResponse } from "@/lib/agent/router";

export const messageHandlingWorkflow = new LemmaWorkflow({
  name: "whatsapp-message-handler",
  steps: [
    {
      name: "receive",
      fn: async (ctx) => ({
        message: ctx.input.message,
        customerPhone: ctx.input.from,
        customerId: ctx.input.customerId,
        businessId: ctx.input.businessId,
      }),
    },
    {
      name: "preprocess",
      fn: async (ctx) => {
        const rawMessage = ctx.steps.receive.message;
        if (!rawMessage || !rawMessage.trim()) {
          return {
            cleanedEnglishQuery: "",
            detectedLanguage: "English",
            isGibberishOrNoise: false,
          };
        }

        try {
          const prompt = `
Analyze the following WhatsApp message from a customer.
Task:
1. Detect the language of the message (e.g. English, Hindi, Hinglish, Spanish, Marathi, French, etc.).
2. Determine if the message is complete gibberish, spam, noise, or random characters (e.g., "asdfgh", "...", "xoxoxo" or keysmash is noise).
3. If it is a meaningful message (even with typos or in another language), correct all typos and translate/rewrite it into clear, standard English search terms/questions. This is to help us look up relevant information in an English-only business document database. If the message is already in English, simply clean up typos and punctuation.

Format your response EXACTLY as a JSON block with the following keys (do not include any other text):
{
  "cleanedEnglishQuery": "the corrected/translated message in English, or empty string if it's pure gibberish",
  "detectedLanguage": "the detected language name",
  "isGibberishOrNoise": true/false
}

Customer message:
"${rawMessage}"
`;

          const responseText = await wApiAgent.model.generate(prompt);
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
              cleanedEnglishQuery: parsed.cleanedEnglishQuery || rawMessage,
              detectedLanguage: parsed.detectedLanguage || "English",
              isGibberishOrNoise: typeof parsed.isGibberishOrNoise === "boolean" ? parsed.isGibberishOrNoise : parsed.isGibberishOrNoise === "true",
            };
          }
        } catch (err) {
          console.error("Error in preprocessing step:", err);
        }

        return {
          cleanedEnglishQuery: rawMessage,
          detectedLanguage: "English",
          isGibberishOrNoise: false,
        };
      },
    },
    {
      name: "retrieve-context",
      fn: async (ctx) => {
        if (ctx.steps.preprocess.isGibberishOrNoise) {
          console.log("Query flagged as gibberish/noise. Skipping RAG search.");
          return { chunks: [] };
        }

        const rawQuery = ctx.steps.preprocess.cleanedEnglishQuery || ctx.steps.receive.message;
        const queryToSearch = preprocessCustomerMessage(rawQuery);
        const chunks = await wApiAgent.documentStore.search({
          query: queryToSearch,
          businessId: ctx.steps.receive.businessId,
          topK: 3,
          similarityThreshold: 0.30,
        });
        console.log("RAG Search Query (Preprocessed):", queryToSearch);
        console.log("RAG Chunks Found:", JSON.stringify(chunks, null, 2));
        return { chunks };
      },
    },
    {
      name: "infer",
      fn: async (ctx) => {
        // Inject harassment count into conversation history so Gemini sees it as context
        // (SDK only replaces {business_name} and {business_vertical} — we cannot modify sdk.ts)
        const history = [...(ctx.input.history || [])];
        const harassmentCount = ctx.input.harassmentCount ?? 0;
        history.push({
          role: 'system',
          content: `[SYSTEM] Current harassment_count for this customer: ${harassmentCount}`,
        });

        return wApiAgent.run({
          userMessage: ctx.steps.receive.message,
          preprocessedQuery: ctx.steps.preprocess.cleanedEnglishQuery,
          detectedLanguage: ctx.steps.preprocess.detectedLanguage,
          context: ctx.steps["retrieve-context"].chunks,
          conversationHistory: history,
          businessName: ctx.input.businessName,
          businessVertical: ctx.input.businessVertical,
        });
      },
    },
    {
      name: "score",
      fn: async (ctx) => {
        const rawResponse = ctx.steps.infer.text;
        const decision = parseAgentResponse(rawResponse);
        return decision;
      },
    },
    {
      name: "route",
      fn: async (ctx) => {
        const decision = ctx.steps.score;
        return {
          action: decision.action,
          reply: decision.reply,
          escalate_reason: decision.escalate_reason,
        };
      },
    },
    {
      name: "persist",
      fn: async (ctx) => {
        try {
          const updateObj: any = {
            business_id: ctx.steps.receive.businessId,
            customer_id: ctx.steps.receive.customerId,
            intent_score: ctx.steps.score.intent_score,
            estimated_value: ctx.steps.score.estimated_value,
            status: ctx.steps.route.action === "escalate" ? "escalated" : "open",
            last_message_at: new Date().toISOString(),
          };
          if (ctx.steps.route.action === "escalate" && ctx.steps.route.escalate_reason) {
            updateObj.escalation_reason = ctx.steps.route.escalate_reason;
          }
          await wApiAgent.datastore.upsert("conversations", updateObj);
        } catch (err) {
          console.warn("Failed to persist with escalation_reason, retrying without it:", err);
          await wApiAgent.datastore.upsert("conversations", {
            business_id: ctx.steps.receive.businessId,
            customer_id: ctx.steps.receive.customerId,
            intent_score: ctx.steps.score.intent_score,
            estimated_value: ctx.steps.score.estimated_value,
            status: ctx.steps.route.action === "escalate" ? "escalated" : "open",
            last_message_at: new Date().toISOString(),
          });
        }
      },
    },
  ],
});
