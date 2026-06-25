// lib/agent/harassment-handler.ts

import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export const HARASSMENT_RESPONSES = {
  level1: [
    "This is a professional business account. Please keep your language respectful. Further inappropriate messages will result in your number being blocked. 🙏",
    "We only offer professional services here. Please note that further abuse or inappropriate messages will result in being blocked. 🙏",
    "This is a professional space. Please keep this conversation respectful, otherwise your number will be blocked. 🙏"
  ],
  level2: "This is a professional account. We will not be responding further and your number has been blocked.",
  threat: "We have noted this threat and will be taking appropriate action. Your number has been blocked and this has been escalated to the business owner."
}

export function getHarassmentResponse(harassmentCount: number): string | null {
  if (harassmentCount === 0) {
    // Random level 1 response so it doesn't look robotic
    const responses = HARASSMENT_RESPONSES.level1
    return responses[Math.floor(Math.random() * responses.length)]
  }
  if (harassmentCount === 1) {
    return HARASSMENT_RESPONSES.level2
  }
  // harassmentCount >= 2 → silence, return null
  return null
}

export async function handleHarassmentEscalation(
  phone: string,
  businessId: string,
  conversationId: string,
  harassmentCount: number,
  isThreat: boolean
): Promise<void> {
  const supabase = createSupabaseAdminClient()

  // Increment harassment count on the conversation (try-catch for schema safety)
  try {
    await supabase
      .from('conversations')
      .update({
        harassment_count: harassmentCount + 1,
        status: harassmentCount >= 1 ? 'blocked' : 'open',
      })
      .eq('id', conversationId)
  } catch (dbErr) {
    console.warn("Could not write harassment_count to conversations:", dbErr)
    // Fall back to updating status only if possible
    try {
      await supabase
        .from('conversations')
        .update({
          status: harassmentCount >= 1 ? 'blocked' : 'open',
        })
        .eq('id', conversationId)
    } catch (e) {}
  }

  // Block the customer after second offense
  try {
    if (harassmentCount >= 1 || isThreat) {
      await supabase
        .from('customers')
        .update({
          is_blocked: true,
          blocked_at: new Date().toISOString(),
          blocked_reason: isThreat ? 'threat' : 'harassment',
          harassment_count: harassmentCount + 1,
        })
        .eq('phone', phone)
        .eq('business_id', businessId)
    } else {
      // First offense (non-threat) — just increment the count, no block yet
      await supabase
        .from('customers')
        .update({
          harassment_count: harassmentCount + 1,
        })
        .eq('phone', phone)
        .eq('business_id', businessId)
    }
  } catch (dbErr) {
    console.warn("Could not write harassment/block details to customers:", dbErr)
  }

  // If it's a threat — escalate to owner immediately regardless of count
  if (isThreat) {
    try {
      await supabase
        .from('conversations')
        .update({
          status: 'escalated',
          escalation_reason: 'threat',
        })
        .eq('id', conversationId)
    } catch (dbErr) {
      console.warn("Could not write threat escalation to conversations:", dbErr)
      try {
        await supabase
          .from('conversations')
          .update({
            status: 'escalated',
          })
          .eq('id', conversationId)
      } catch (e) {}
    }
  }
}

export async function isCustomerBlocked(
  phone: string,
  businessId: string
): Promise<boolean> {
  const supabase = createSupabaseAdminClient()
  
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('is_blocked')
      .eq('phone', phone)
      .eq('business_id', businessId)
      .single()

    if (error) {
      return false
    }
    return data?.is_blocked ?? false
  } catch (e) {
    return false
  }
}
