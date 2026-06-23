import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { rateLimiters, applyRateLimit } from "@/lib/rate-limit";
import { whatsappIntegration } from "@/lib/lemma/integrations";

export async function POST(request: Request) {
  // 1. Authenticate User Session
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Fetch Business ID
  const { data: business, error: bizErr } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (bizErr || !business) {
    return NextResponse.json({ error: "Business profile not found" }, { status: 404 });
  }

  const businessId = business.id;

  // 3. Apply Reply Rate Limiter
  const rateLimitResponse = await applyRateLimit(rateLimiters.reply, businessId);
  if (rateLimitResponse) return rateLimitResponse;

  // 4. Parse Request Body
  let body: any;
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { conversationId, message } = body;
  if (!conversationId || !message?.trim()) {
    return NextResponse.json({ error: "Missing conversationId or message text" }, { status: 400 });
  }

  // 5. Fetch Conversation and Customer
  const { data: conversation, error: convErr } = await supabase
    .from("conversations")
    .select("*, customers(*)")
    .eq("id", conversationId)
    .eq("business_id", businessId)
    .single();

  if (convErr || !conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const customerPhone = conversation.customers?.phone;
  if (!customerPhone) {
    return NextResponse.json({ error: "Customer phone number not resolved" }, { status: 400 });
  }

  // 6. Send message to WhatsApp via Lemma Integration
  try {
    await whatsappIntegration.send(customerPhone, message);
  } catch (err: any) {
    console.error("Error dispatching manual owner reply:", err);
    return NextResponse.json({ error: "Failed to send WhatsApp message" }, { status: 500 });
  }

  // 7. Insert message record as owner role
  const { data: insertedMsg, error: msgErr } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      business_id: businessId,
      role: "owner",
      content: message.trim(),
    })
    .select()
    .single();

  if (msgErr) {
    console.error("Failed to insert message:", msgErr);
    return NextResponse.json({ error: "Database error recording message" }, { status: 500 });
  }

  // 8. Reset stale lead flags and update conversation status to open
  await supabase
    .from("conversations")
    .update({
      is_stale: false,
      status: "open",
      last_message_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  return NextResponse.json({ success: true, message: insertedMsg });
}
