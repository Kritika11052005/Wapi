import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id: conversationId } = await params;

  // 3. Fetch Conversation and Customer
  const { data: conversation, error: convErr } = await supabase
    .from("conversations")
    .select("*, customers(*)")
    .eq("id", conversationId)
    .eq("business_id", business.id)
    .single();

  if (convErr || !conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const customerId = conversation.customer_id;

  // 4. Update Customer Block Status
  try {
    await supabase
      .from("customers")
      .update({
        is_blocked: false,
        harassment_count: 0,
        blocked_at: null,
        blocked_reason: null,
      })
      .eq("id", customerId);
  } catch (err) {
    console.warn("Could not unblock customer in database (schema might not be updated yet):", err);
  }

  // 5. Update Conversation Status to 'resolved'
  try {
    await supabase
      .from("conversations")
      .update({
        status: "resolved",
        harassment_count: 0,
      })
      .eq("id", conversationId);
  } catch (err) {
    console.warn("Could not reset harassment_count in conversation:", err);
    try {
      await supabase
        .from("conversations")
        .update({
          status: "resolved",
        })
        .eq("id", conversationId);
    } catch (fallbackErr) {
      console.error("Fallback update failed:", fallbackErr);
    }
  }

  return NextResponse.json({ success: true });
}
