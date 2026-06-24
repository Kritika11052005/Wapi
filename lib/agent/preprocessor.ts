export function preprocessCustomerMessage(message: string): string {
  // Normalise common Hinglish/informal patterns before embedding
  // This improves semantic search accuracy for Indian customers
  
  const normalized = message
    .toLowerCase()
    .trim()
    // Common informal patterns
    .replace(/\bwhat you\b/gi, 'what are your')
    .replace(/\bwhat is you\b/gi, 'what are your')
    .replace(/\bkitna\b/gi, 'how much')
    .replace(/\bkya\b/gi, 'what')
    .replace(/\bkab\b/gi, 'when')
    .replace(/\bkahan\b/gi, 'where')
    .replace(/\bkaisa\b/gi, 'how')
    .replace(/\bcharge[s]?\b/gi, 'price')
    .replace(/\brate[s]?\b/gi, 'price')
    .replace(/\bfees?\b/gi, 'price')
    // Fix common typos
    .replace(/\bmakeup\b/gi, 'makeup')
    .replace(/\bbridel\b/gi, 'bridal')
    .replace(/\bhaircut\b/gi, 'hair cut')

  return normalized
}
