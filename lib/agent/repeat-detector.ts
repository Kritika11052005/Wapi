// lib/agent/repeat-detector.ts
// Detects repeated/spam messages without calling Gemini

import crypto from 'crypto'

export type RepeatAction = 'normal' | 'acknowledge' | 'warn' | 'ignore'

export function hashMessage(content: string): string {
  const normalised = content
    .toLowerCase()
    .replace(/[^\w\s]/g, '')   // strip punctuation
    .replace(/\s+/g, ' ')      // collapse whitespace
    .trim()
  return crypto.createHash('md5').update(normalised).digest('hex')
}

export function getRepeatAction(repeatCount: number): RepeatAction {
  if (repeatCount === 0) return 'normal'       // first time — process normally
  if (repeatCount === 1) return 'acknowledge'  // second time — gentle nudge
  if (repeatCount === 2) return 'warn'         // third time — firm message
  return 'ignore'                              // fourth+ — complete silence
}

export function getRepeatResponse(
  action: RepeatAction,
  businessVertical: string
): string | null {
  switch (action) {
    case 'acknowledge':
      return `I already shared that info just above! 😊 Let me know if anything wasn't clear or if you'd like to book.`
    case 'warn':
      return `It looks like you've sent the same message a few times. I've already answered above — feel free to ask something different and I'll be happy to help!`
    case 'ignore':
      return null  // complete silence — do not respond
    default:
      return null
  }
}

export function isRapidSpam(lastRepeatAt: string | null): boolean {
  if (!lastRepeatAt) return false
  const elapsed = Date.now() - new Date(lastRepeatAt).getTime()
  return elapsed < 30_000  // same message within 30 seconds = spam
}
