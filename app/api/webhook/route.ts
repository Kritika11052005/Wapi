import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/meta/verify-webhook";
import { rateLimiters, applyRateLimit } from "@/lib/rate-limit";
import { sanitiseMessageContent } from "@/lib/sanitise";
import { messageHandlingWorkflow } from "@/lib/lemma/workflow";
import { whatsappIntegration } from "@/lib/lemma/integrations";

// GET handler: Webhook verification handshake
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("Webhook verified successfully!");
    return new Response(challenge, { status: 200 });
  }

  console.warn("Webhook verification failed. Token mismatch.");
  return new Response("Forbidden", { status: 403 });
}

// POST handler: Message webhook events from Meta Cloud API
export async function POST(request: Request) {
  // 1. Read raw body and verify HMAC signature
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256") || "";
  const appSecret = process.env.WHATSAPP_APP_SECRET || "";

  if (!verifyWebhookSignature(rawBody, signature, appSecret)) {
    console.error("Webhook signature verification failed.");
    return new Response("Unauthorized", { status: 403 });
  }

  // 2. Parse Meta Webhook JSON Payload
  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch (err) {
    return new Response("Bad Request", { status: 400 });
  }

  // Verify it is a message entry
  const entry = body.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;
  const message = value?.messages?.[0];

  if (!message) {
    // Return 200 immediately to confirm receipt of non-message status updates (e.g. delivery receipts)
    return new Response("Event received, no message to process", { status: 200 });
  }

  const fromPhone = message.from; // e.g. "919876543210"
  const msgId = message.id;       // Meta message ID
  const msgType = message.type;
  const rawContent = msgType === "text" ? message.text?.body : "";
  const customerName = value?.contacts?.[0]?.profile?.name || "Customer";
  const metaPhoneId = value?.metadata?.phone_number_id || "";

  // 3. Apply Webhook Rate Limiter (per phone number)
  const rateLimitResponse = await applyRateLimit(rateLimiters.webhook, fromPhone);
  if (rateLimitResponse) return rateLimitResponse;

  // Initialize Supabase admin client
  const supabase = createSupabaseAdminClient();

  // 4. Resolve Business Profile
  // Find business matching the meta phone number id, or fallback to first business for Hackathon convenience
  let { data: business, error: bizErr } = await supabase
    .from("businesses")
    .select("*")
    .eq("whatsapp_number", metaPhoneId)
    .single();

  if (bizErr || !business) {
    const { data: firstBiz } = await supabase.from("businesses").select("*").limit(1).single();
    business = firstBiz;
  }

  if (!business) {
    console.error("No business found in database. Please onboarding first.");
    return new Response("Business not found", { status: 404 });
  }

  const businessId = business.id;
  const businessName = business.name;
  const threshold = parseFloat(business.confidence_threshold || "0.75");

  // 5. Customer Record resolution
  let { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("business_id", businessId)
    .eq("phone", fromPhone)
    .single();

  if (!customer) {
    const { data: newCust, error: custErr } = await supabase
      .from("customers")
      .insert({
        business_id: businessId,
        phone: fromPhone,
        display_name: customerName,
      })
      .select()
      .single();
    
    if (custErr) {
      console.error("Error creating customer:", custErr);
      return new Response("Database error", { status: 500 });
    }
    customer = newCust;
  }

  // 6. Conversation Record resolution
  let { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("business_id", businessId)
    .eq("customer_id", customer.id)
    .single();

  if (!conversation) {
    const { data: newConv, error: convErr } = await supabase
      .from("conversations")
      .insert({
        business_id: businessId,
        customer_id: customer.id,
        status: "open",
      })
      .select()
      .single();

    if (convErr) {
      console.error("Error creating conversation:", convErr);
      return new Response("Database error", { status: 500 });
    }
    conversation = newConv;
  }

  // 7. Insert Message & Deduplicate
  const sanitisedContent = sanitiseMessageContent(rawContent || `[Received media type: ${msgType}]`);
  
  const { data: insertedMsg, error: msgErr } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversation.id,
      business_id: businessId,
      role: "customer",
      content: sanitisedContent,
      whatsapp_message_id: msgId,
    })
    .select()
    .single();

  if (msgErr) {
    // If unique key constraint triggered on whatsapp_message_id, it is a duplicate webhook trigger
    if (msgErr.code === "23505") {
      console.log(`Duplicate message webhook ${msgId} skipped.`);
      return new Response("Duplicate message", { status: 200 });
    }
    console.error("Error saving message:", msgErr);
    return new Response("Database error", { status: 500 });
  }

  // If customer sent non-text (image, doc), auto-escalate with standard prompt
  if (msgType !== "text") {
    const autoReply = "I can only help with text messages right now. Let me direct this to the owner to assist you.";
    
    // Save Agent Response
    await supabase.from("messages").insert({
      conversation_id: conversation.id,
      business_id: businessId,
      role: "escalation",
      content: autoReply,
      confidence_score: 0.1,
      intent_score: 0.5,
      estimated_value: 0,
    });

    // Update Conversation status
    await supabase
      .from("conversations")
      .update({ status: "escalated", last_message_at: new Date().toISOString() })
      .eq("id", conversation.id);

    // Send reply via Meta Cloud API
    await whatsappIntegration.send(fromPhone, autoReply);
    return new Response("Media message escalated", { status: 200 });
  }

  // 8. Fetch History for Context
  const { data: historyData } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true })
    .limit(10);

  const mappedHistory = (historyData || []).map((m: any) => ({
    role: m.role,
    content: m.content,
  }));

  // 9. Run the Lemma Message Processing Workflow
  let workflowResult: any;
  try {
    workflowResult = await messageHandlingWorkflow.run({
      message: sanitisedContent,
      from: fromPhone,
      customerId: customer.id,
      businessId: businessId,
      businessName: businessName,
      confidenceThreshold: threshold,
      history: mappedHistory,
    });
  } catch (workflowErr) {
    console.error("Lemma Workflow crashed. Falling back to escalation.");
    
    const fallbackReply = "We have received your message. An owner will reply to you shortly.";
    await supabase.from("messages").insert({
      conversation_id: conversation.id,
      business_id: businessId,
      role: "escalation",
      content: fallbackReply,
      confidence_score: 0,
      intent_score: 0.5,
      estimated_value: 0,
    });

    await supabase
      .from("conversations")
      .update({ status: "escalated", last_message_at: new Date().toISOString() })
      .eq("id", conversation.id);

    await whatsappIntegration.send(fromPhone, fallbackReply);
    return new Response("Workflow error handled", { status: 200 });
  }

  const { score, route } = workflowResult.steps;
  const action = route.action; // 'answer' | 'escalate'
  const generatedReply = route.reply;

  // 10. Update Conversation Details in Database
  await supabase
    .from("conversations")
    .update({
      intent_score: score.intent_score,
      estimated_value: score.estimated_value,
      status: action === "escalate" ? "escalated" : "open",
      is_stale: false, // Reset stale state on new message
      last_message_at: new Date().toISOString(),
    })
    .eq("id", conversation.id);

  // 11. Save AI Response and send to user
  const finalRole = action === "escalate" ? "escalation" : "agent";
  const finalReplyText = action === "escalate"
    ? `We received your request. Let me direct this to the owner of ${businessName} to assist you shortly.`
    : generatedReply;

  await supabase.from("messages").insert({
    conversation_id: conversation.id,
    business_id: businessId,
    role: finalRole,
    content: finalReplyText,
    confidence_score: score.confidence,
    intent_score: score.intent_score,
    estimated_value: score.estimated_value,
  });

  // Dispatch message via Meta API
  await whatsappIntegration.send(fromPhone, finalReplyText);

  return new Response("Success", { status: 200 });
}
