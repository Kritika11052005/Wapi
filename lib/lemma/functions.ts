/* eslint-disable @typescript-eslint/no-explicit-any */
import { LemmaFunction } from "@lemma/sdk";
import { wApiAgent } from "./agent";

export const draftNudgeFunction = new LemmaFunction({
  name: "draft-stale-lead-nudge",
  input: { conversationHistory: "array", businessName: "string", estimatedValue: "number" },
  fn: async (input) => wApiAgent.model.generate(`
    A customer interested in ${input.businessName} (₹${input.estimatedValue}) went cold.
    History: ${input.conversationHistory.map((m: any) => `${m.role === 'owner' ? 'business' : m.role}: ${m.content}`).join('\n')}
    Write a warm, natural WhatsApp follow-up under 50 words in the same language of the customer. Sound human, not pushy.
  `),
});

export const dailySummaryFunction = new LemmaFunction({
  name: "generate-daily-summary",
  input: { activeCount: "number", staleCount: "number", autoHandledCount: "number", topLead: "object" },
  fn: async (input) => `
🌅 Good morning! Your Wapi summary:
📬 ${input.activeCount} open conversations
🤖 ${input.autoHandledCount} handled automatically
⚠️ ${input.staleCount} lead${input.staleCount !== 1 ? "s" : ""} need attention
${input.topLead ? `💰 Top lead: ₹${input.topLead.estimatedValue} — check dashboard` : ""}
  `.trim(),
});
