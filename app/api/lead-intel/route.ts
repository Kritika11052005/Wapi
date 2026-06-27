/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/server";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY environment variable is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { conversationId, chatHistory, businessName = "the business", businessType = "services" } = body;

    let finalHistory: Array<{ role: string; content: string }> = [];
    let finalBizName = businessName;
    let finalBizType = businessType;

    // If conversationId is provided, load from Supabase database (authenticated dashboard context)
    if (conversationId) {
      const supabase = await createClient();
      const { data: { user }, error: authErr } = await supabase.auth.getUser();

      if (authErr || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Fetch business profile
      const { data: business, error: bizErr } = await supabase
        .from("businesses")
        .select("id, name, vertical")
        .eq("user_id", user.id)
        .single();

      if (bizErr || !business) {
        return NextResponse.json({ error: "Business profile not found" }, { status: 404 });
      }

      finalBizName = business.name;
      finalBizType = business.vertical || "services";

      // Verify conversation belongs to this business
      const { data: conversation, error: convErr } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("business_id", business.id)
        .single();

      if (convErr || !conversation) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }

      // Fetch message history (up to 15 messages)
      const { data: msgs, error: msgsErr } = await supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(15);

      if (msgsErr) {
        return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
      }

      finalHistory = (msgs || []).map((m: any) => ({
        role: m.role,
        content: m.content,
      }));
    } else if (chatHistory && Array.isArray(chatHistory)) {
      // Otherwise, use public/demo in-memory payload
      finalHistory = chatHistory.map((m: any) => ({
        role: m.sender || m.role,
        content: m.text || m.content,
      }));
    } else {
      return NextResponse.json({ error: "Either conversationId or chatHistory is required" }, { status: 400 });
    }

    // Filter out system messages and format history
    const filteredHistory = finalHistory
      .filter((m) => m.role !== "system")
      .map((m) => `${m.role === "customer" ? "Customer" : "Business"}: ${m.content}`)
      .join("\n");

    if (!filteredHistory.trim()) {
      return NextResponse.json({
        summary: "No conversation history yet.",
        promised: "None.",
        nextActions: ["Wait for customer to say hello."],
        leadWarmth: "Cold"
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const prompt = `
You are an expert sales analyst and CRM intelligence engine.
Analyze the following conversation history between a customer and "${finalBizName}" (a ${finalBizType}).
Your goal is to extract:
1. A concise 2-sentence summary of the conversation so far (what the customer wants, their key queries, and current status).
2. What has been promised or agreed upon (prices, times, slots, specific offers) or "None" if nothing yet.
3. Suggest the 2-3 next logical actions for the business owner to move the sale/booking forward.
4. Classify the lead warmth level: "Cold", "Warm", or "Hot".
   - "Hot": Close to booking, already discussed packages/prices, highly engaged.
   - "Warm": Expressed interest in specific services, asking questions, but not booked yet.
   - "Cold": Little engagement, simple greeting, or has gone completely silent / unresponsive.

Conversation History:
${filteredHistory}

Format your response EXACTLY as a JSON block with the following keys (do not include any other text, markdown formatting or backticks):
{
  "summary": "Concise 2-sentence summary of lead history",
  "promised": "What was promised/agreed to (e.g. ₹1500 package on Sunday at 2 PM)",
  "nextActions": [
    "Suggested action 1",
    "Suggested action 2"
  ],
  "leadWarmth": "Cold" | "Warm" | "Hot"
}

Respond ONLY with the JSON block. Do not wrap it in markdown block fences.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`Failed to parse AI JSON response: ${text}`);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);

  } catch (err: any) {
    console.error("Error in lead-intel API:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
