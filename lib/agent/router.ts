export type EscalateReason = 'anger' | 'human_requested' | 'complaint' | 'transaction' | 'threat' | null

export type AgentAction = 'answer' | 'deflect' | 'escalate' | 'harassment' | 'silence'

export interface AgentDecision {
  reply: string           // the actual message to send to customer (without JSON block)
  action: AgentAction
  confidence: number
  intent_score: number
  estimated_value: number
  escalate_reason: EscalateReason
  harassment_count?: number
  detected_language: string
}

// Valid reasons that justify notifying the owner
const VALID_ESCALATE_REASONS: EscalateReason[] = [
  'anger',
  'human_requested', 
  'complaint',
  'transaction',
  'threat'
]

export function parseAgentResponse(rawResponse: string): AgentDecision {
  // Extract the JSON block from the end of the response
  let jsonMatch = rawResponse.match(/\{[^{}]*"action"[^{}]*\}/)
  if (!jsonMatch) {
    jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
  }
  
  if (!jsonMatch) {
    // If JSON parsing fails, default to safe escalation
    return {
      reply: rawResponse.trim(),
      action: 'escalate',
      confidence: 0,
      intent_score: 0,
      estimated_value: 0,
      escalate_reason: 'complaint',
      harassment_count: 0,
      detected_language: 'english'
    }
  }

  try {
    const parsed = JSON.parse(jsonMatch[0])
    
    // Clean reply = everything before the JSON block and thinking tags stripped
    let cleanReply = rawResponse.replace(jsonMatch[0], '')
      .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
      .trim()

    return {
      reply: cleanReply,
      action: parsed.action ?? 'deflect',
      confidence: parsed.confidence ?? 0,
      intent_score: parsed.intent_score ?? parsed.intentScore ?? 0,
      estimated_value: parsed.estimated_value ?? parsed.estimatedValue ?? 0,
      escalate_reason: parsed.escalate_reason ?? parsed.escalateReason ?? null,
      harassment_count: parsed.harassment_count ?? parsed.harassmentCount ?? 0,
      detected_language: parsed.detected_language ?? parsed.detectedLanguage ?? 'english'
    }
  } catch (e) {
    console.error("Failed to parse JSON match in agent response:", e)
    return {
      reply: rawResponse.replace(jsonMatch[0], '').replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim(),
      action: 'escalate',
      confidence: 0,
      intent_score: 0,
      estimated_value: 0,
      escalate_reason: 'complaint',
      harassment_count: 0,
      detected_language: 'english'
    }
  }
}

export function shouldNotifyOwner(decision: AgentDecision): boolean {
  // Owner is ONLY notified for genuine escalations with valid reasons
  // deflect = never notify owner
  // answer = never notify owner  
  // escalate with invalid/null reason = still don't notify (safety net)
  
  return (
    decision.action === 'escalate' &&
    decision.escalate_reason !== null &&
    VALID_ESCALATE_REASONS.includes(decision.escalate_reason)
  )
}

export function getEscalationMessage(): string {
  return "I'm connecting you with our team right away! They'll be with you shortly 🙏"
}

export function getOutOfScopePrefix(): string {
  // Used as fallback if the model doesn't generate a deflection naturally
  return "That's a bit outside what I can help with here! But for anything related to our services, I'm all yours 😊"
}
