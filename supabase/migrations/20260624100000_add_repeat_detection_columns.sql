-- Add repeat detection and escalation columns to conversations table
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS last_message_hash TEXT,
  ADD COLUMN IF NOT EXISTS repeat_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_repeat_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escalation_reason TEXT;

-- Performance index for hash-based repeat lookups
CREATE INDEX IF NOT EXISTS conversations_hash_idx
  ON conversations(id, last_message_hash);
