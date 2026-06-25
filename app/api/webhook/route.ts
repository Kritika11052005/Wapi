import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/meta/verify-webhook";
import { rateLimiters, applyRateLimit } from "@/lib/rate-limit";
import { sanitiseMessageContent } from "@/lib/sanitise";
import { messageHandlingWorkflow } from "@/lib/lemma/workflow";
import { whatsappIntegration } from "@/lib/lemma/integrations";
import { shouldNotifyOwner, getEscalationMessage } from "@/lib/agent/router";
import {
  getHarassmentResponse,
  handleHarassmentEscalation,
  isCustomerBlocked,
  HARASSMENT_RESPONSES
} from "@/lib/agent/harassment-handler";
import { screenEmojis } from "@/lib/agent/emoji-screener";
import {
  hashMessage,
  getRepeatAction,
  getRepeatResponse,
  isRapidSpam
} from "@/lib/agent/repeat-detector";

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

  // ── BLOCK CHECK ──────────────────────────────────────────
  // Must run before any agent processing
  const blocked = await isCustomerBlocked(fromPhone, business.id);
  if (blocked) {
    // Customer is blocked — acknowledge Meta but send nothing to customer
    console.log(JSON.stringify({
      event: 'blocked_message_received',
      phone: fromPhone,
      businessId: business.id,
      timestamp: new Date().toISOString()
    }));
    return new Response('OK', { status: 200 });
  }
  // ─────────────────────────────────────────────────────────

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

  // ═══════════════════════════════════════════════
  // GUARD 2 — REPEAT/SPAM DETECTION
  // Same message sent multiple times — no Gemini call
  // ═══════════════════════════════════════════════
  const businessVertical = business.vertical || "business";
  const messageHash = hashMessage(sanitisedContent);

  const { data: convGuardData } = await supabase
    .from('conversations')
    .select('last_message_hash, repeat_count, last_repeat_at, harassment_count')
    .eq('id', conversation.id)
    .single();

  const isSameMessage = convGuardData?.last_message_hash === messageHash;
  const newRepeatCount = isSameMessage ? (convGuardData?.repeat_count ?? 0) + 1 : 0;
  const repeatAction = getRepeatAction(newRepeatCount);

  // Update hash tracking
  await supabase.from('conversations').update({
    last_message_hash: messageHash,
    repeat_count: isSameMessage ? newRepeatCount : 0,
    last_repeat_at: isSameMessage ? new Date().toISOString() : null,
  }).eq('id', conversation.id);

  if (repeatAction !== 'normal') {
    const repeatReply = getRepeatResponse(repeatAction, businessVertical);
    if (repeatReply !== null) {
      // Save repeat response as agent message
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        business_id: businessId,
        role: "agent",
        content: repeatReply,
        confidence_score: 1.0,
        intent_score: 0,
        estimated_value: 0,
      });
      await whatsappIntegration.send(fromPhone, repeatReply);
    }
    console.log(JSON.stringify({
      event: 'repeat_detected',
      count: newRepeatCount,
      action: repeatAction,
      rapidSpam: isRapidSpam(convGuardData?.last_repeat_at ?? null),
      phone: fromPhone,
      timestamp: new Date().toISOString()
    }));
    return new Response('OK', { status: 200 });
    // ← Exits here. Gemini never called. Zero API cost.
  }

  // ═══════════════════════════════════════════════
  // GUARD 3 — EMOJI PRE-SCREEN
  // Obvious abuse caught before Gemini call
  // ═══════════════════════════════════════════════
  const emojiScreen = screenEmojis(sanitisedContent);

  if (emojiScreen.isAbusive && emojiScreen.confidence >= 0.95) {
    const currentEmojiCount = convGuardData?.harassment_count ?? 0;
    const harassReply = getHarassmentResponse(currentEmojiCount);

    if (harassReply !== null) {
      await whatsappIntegration.send(fromPhone, harassReply);
    }

    await handleHarassmentEscalation(
      fromPhone, businessId, conversation.id, currentEmojiCount, false
    );

    console.log(JSON.stringify({
      event: 'emoji_abuse_blocked',
      emojis: emojiScreen.offendingEmojis,
      level: currentEmojiCount,
      phone: fromPhone,
      timestamp: new Date().toISOString()
    }));
    return new Response('OK', { status: 200 });
    // ← Exits here. Gemini never called.
  }

  // ═══════════════════════════════════════════════
  // GEMINI AGENT CALL
  // Only genuine, non-spam, non-obvious-abuse messages reach here
  // ═══════════════════════════════════════════════
  const currentHarassmentCount = convGuardData?.harassment_count ?? 0;

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
      businessVertical: businessVertical,
      confidenceThreshold: threshold,
      history: mappedHistory,
      harassmentCount: currentHarassmentCount,
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
  const action = route.action; // 'answer' | 'deflect' | 'escalate' | 'harassment' | 'silence'
  const generatedReply = route.reply;
  const agentDecision = score;
  const isThreat = agentDecision.escalate_reason === 'threat';

  // ═══════════════════════════════════════════════
  // ROUTE DECISION
  // ═══════════════════════════════════════════════
  if (action === 'harassment' || action === 'silence' || isThreat) {
    // Gemini detected abuse or threat (multilingual, contextual, subtle)
    // Reuse harassment count already fetched during Guard 2
    const harassReply = isThreat 
      ? HARASSMENT_RESPONSES.threat 
      : getHarassmentResponse(currentHarassmentCount);

    if (harassReply !== null) {
      await whatsappIntegration.send(fromPhone, harassReply);
      // Save the harassment/threat boundary message in the messages table
      try {
        await supabase.from("messages").insert({
          conversation_id: conversation.id,
          business_id: businessId,
          role: isThreat ? "escalation" : "agent",
          content: harassReply,
          confidence_score: score.confidence,
          intent_score: score.intent_score,
          estimated_value: score.estimated_value,
        });
      } catch (dbErr) {
        console.warn("Could not save harassment reply to messages:", dbErr);
      }
    }

    await handleHarassmentEscalation(
      fromPhone,
      business.id,
      conversation.id,
      currentHarassmentCount,
      isThreat
    );

    console.log(JSON.stringify({
      event: 'harassment_handled',
      level: currentHarassmentCount,
      blocked: currentHarassmentCount >= 1 || isThreat,
      threat: isThreat,
      phone: fromPhone,
      timestamp: new Date().toISOString()
    }));

    return new Response('OK', { status: 200 });
  }

  // 10. Update Conversation Details in Database
  const updateData: any = {
    intent_score: score.intent_score,
    estimated_value: score.estimated_value,
    status: action === "escalate" ? "escalated" : "open",
    is_stale: false, // Reset stale state on new message
    last_message_at: new Date().toISOString(),
  };

  await supabase
    .from("conversations")
    .update(updateData)
    .eq("id", conversation.id);

  // If genuinely escalated, save the escalation reason (wrapped in a try-catch for schema safety)
  if (shouldNotifyOwner(score)) {
    try {
      await supabase
        .from("conversations")
        .update({
          status: "escalated",
          escalation_reason: score.escalate_reason,
        })
        .eq("id", conversation.id);
    } catch (err) {
      console.warn("Could not save escalation_reason (did you run the SQL migration?):", err);
    }
  }

  // 11. Save AI Response and send to user
  const finalRole = action === "escalate" ? "escalation" : "agent";
  const finalReplyText = action === "escalate"
    ? getEscalationMessage()
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

  // If a transaction is detected or updated, persist it to the database
  if (score.transaction_detected && score.transaction_type && score.transaction_status) {
    try {
      await supabase
        .from("transactions")
        .upsert({
          business_id: businessId,
          customer_id: customer.id,
          conversation_id: conversation.id,
          type: score.transaction_type,
          status: score.transaction_status,
          details: score.transaction_details || {},
          value: score.estimated_value || 0,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "conversation_id,type"
        });
    } catch (txErr) {
      console.warn("Could not save transaction to database (did you run the transactions SQL migration?):", txErr);
    }
  }

  // Dispatch message via Meta API
  await whatsappIntegration.send(fromPhone, finalReplyText);

  // Structured log for every decision
  console.log(JSON.stringify({
    event: 'agent_decision',
    action: score.action,
    confidence: score.confidence,
    isAbusive: score.is_abusive ?? false,
    abuseType: score.abuse_type ?? null,
    escalate_reason: score.escalate_reason,
    owner_notified: shouldNotifyOwner(score),
    language: score.detected_language,
    transaction_detected: score.transaction_detected,
    transaction_type: score.transaction_type,
    transaction_status: score.transaction_status,
    timestamp: new Date().toISOString()
  }));

  return new Response("Success", { status: 200 });
}
