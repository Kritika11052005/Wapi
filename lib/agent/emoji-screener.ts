// lib/agent/emoji-screener.ts
// Pre-screens messages for abusive emoji combinations
// Runs BEFORE Gemini to save API costs on obvious cases

// Combinations that are ALWAYS harassment — no context needed
const ALWAYS_ABUSIVE_COMBOS = [
  ['🍆', '💦'],
  ['🍆', '🍑'],
  ['🍆', '🍑', '💦'],
  ['👅', '🍆'],
  ['👅', '💦'],
  ['🫦', '🍆'],
  ['🍆', '😩'],
  ['🍆', '😋'],
  ['💦', '😩'],
]

// Single emojis abusive ONLY when sent alone with no real text
const ABUSIVE_ALONE = ['🔞', '🍆']

export interface EmojiScreenResult {
  isAbusive: boolean
  offendingEmojis: string | null
  confidence: number  // 1.0 = certain, 0 = let Gemini decide
}

function extractEmojis(text: string): string[] {
  const emojiRegex = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu
  return [...(text.match(emojiRegex) ?? [])]
}

function stripEmojis(text: string): string {
  return text
    .replace(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu, '')
    .trim()
}

export function screenEmojis(message: string): EmojiScreenResult {
  const emojis = extractEmojis(message)
  const textOnly = stripEmojis(message)

  // No emojis — skip
  if (emojis.length === 0) {
    return { isAbusive: false, offendingEmojis: null, confidence: 0 }
  }

  // Check always-abusive combinations
  for (const combo of ALWAYS_ABUSIVE_COMBOS) {
    const allPresent = combo.every(e => emojis.includes(e))
    if (allPresent) {
      return {
        isAbusive: true,
        offendingEmojis: combo.join(' '),
        confidence: 1.0
      }
    }
  }

  // Check abusive-when-alone (no meaningful text alongside)
  if (textOnly.length < 4) {
    for (const emoji of ABUSIVE_ALONE) {
      if (emojis.includes(emoji)) {
        return {
          isAbusive: true,
          offendingEmojis: emoji,
          confidence: 0.95
        }
      }
    }
  }

  // Ambiguous — pass full message to Gemini for semantic understanding
  return { isAbusive: false, offendingEmojis: null, confidence: 0 }
}
