import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { rateLimiters, applyRateLimit } from "@/lib/rate-limit";
import { draftNudgeFunction } from "@/lib/lemma/functions";
import { whatsappIntegration } from "@/lib/lemma/integrations";

export async function POST(request: Request) {
  // 1. Authenticate User Session
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Fetch Business ID and Name
  const { data: business, error: bizErr } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("user_id", user.id)
    .single();

  if (bizErr || !business) {
    return NextResponse.json({ error: "Business profile not found" }, { status: 404 });
  }

  const businessId = business.id;
  const businessName = business.name;

  // 3. Apply Nudge Rate Limiter
  const rateLimitResponse = await applyRateLimit(rateLimiters.nudge, businessId);
  if (rateLimitResponse) return rateLimitResponse;

  // 4. Parse Request Body
  let body: any;
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { conversationId, action = "draft", content } = body;
  if (!conversationId) {
    return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
  }

  // 5. Fetch and verify Conversation
  const { data: conversation, error: convErr } = await supabase
    .from("conversations")
    .select("*, customers(*)")
    .eq("id", conversationId)
    .eq("business_id", businessId)
    .single();

  if (convErr || !conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // 6. Handle Actions
  if (action === "draft") {
    // Generate draft nudge
    // Fetch last 10 messages for conversation history context
    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(10);

    const historyArray = (history || []).map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    let draftText = "";
    try {
      draftText = await draftNudgeFunction.run({
        conversationHistory: historyArray,
        businessName: businessName,
        estimatedValue: conversation.estimated_value || 0,
      });
      
      // Clean up draft from any leading/trailing whitespace or quotes
      draftText = draftText.trim().replace(/^["']|["']$/g, "");
    } catch (err: any) {
      console.error("Error running draftNudgeFunction:", err);
      return NextResponse.json({ error: "Failed to generate AI nudge draft" }, { status: 500 });
    }

    // Upsert into nudges table
    const { data: nudgeRecord, error: nudgeErr } = await supabase
      .from("nudges")
      .insert({
        conversation_id: conversationId,
        business_id: businessId,
        draft_content: draftText,
        status: "pending",
      })
      .select()
      .single();

    if (nudgeErr) {
      console.error("Error inserting nudge record:", nudgeErr);
    }

    return NextResponse.json({ nudge: draftText });

  } else if (action === "send") {
    if (!content) {
      return NextResponse.json({ error: "Missing content for send action" }, { status: 400 });
    }

    const customerPhone = conversation.customers?.phone;
    if (!customerPhone) {
      return NextResponse.json({ error: "Customer phone number not found" }, { status: 400 });
    }

    // Send WhatsApp message
    try {
      await whatsappIntegration.send(customerPhone, content);
    } catch (err: any) {
      console.error("Error sending nudge message:", err);
      return NextResponse.json({ error: "Failed to dispatch message via WhatsApp" }, { status: 500 });
    }

    // Insert Message as Owner
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      business_id: businessId,
      role: "owner",
      content: content,
    });

    // Update Nudge record
    await supabase
      .from("nudges")
      .update({
        status: "sent",
        final_content: content,
        sent_at: new Date().toISOString(),
      })
      .eq("conversation_id", conversationId)
      .eq("status", "pending");

    // Update Conversation state
    await supabase
      .from("conversations")
      .update({
        is_stale: false,
        status: "open",
        last_message_at: new Date().toISOString(),
        auto_nudge_count: 0,
      })
      .eq("id", conversationId);

    return NextResponse.json({ success: true });

  } else if (action === "dismiss") {
    // Update Nudge record
    await supabase
      .from("nudges")
      .update({
        status: "dismissed",
      })
      .eq("conversation_id", conversationId)
      .eq("status", "pending");

    // Update Conversation state
    await supabase
      .from("conversations")
      .update({
        is_stale: false,
        auto_nudge_count: 0,
      })
      .eq("id", conversationId);

    return NextResponse.json({ success: true });

  } else {
    return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
  }
}
