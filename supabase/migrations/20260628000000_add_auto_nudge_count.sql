-- Add auto_nudge_count column to conversations table to track automatic nudges sent
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS auto_nudge_count INT DEFAULT 0;
