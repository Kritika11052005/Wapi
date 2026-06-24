-- Add block and harassment columns to customers table
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
  ADD COLUMN IF NOT EXISTS harassment_count INT DEFAULT 0;

-- Index for fast block check on every incoming message
CREATE INDEX IF NOT EXISTS customers_blocked_idx
  ON customers(business_id, phone, is_blocked);

-- Add harassment_count to conversations table
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS harassment_count INT DEFAULT 0;
