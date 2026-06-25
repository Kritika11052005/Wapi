-- Create transactions table to track bookings, orders, and subscriptions
CREATE TABLE IF NOT EXISTS transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id       UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id       UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  conversation_id   UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  type              TEXT NOT NULL, -- 'appointment' | 'order' | 'subscription'
  status            TEXT NOT NULL, -- 'collecting' | 'confirmed' | 'cancelled'
  details           JSONB NOT NULL DEFAULT '{}'::jsonb,
  value             NUMERIC(10,2) DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_conv_tx_type UNIQUE (conversation_id, type)
);

-- Index for fast lookup in dashboard and webhook
CREATE INDEX IF NOT EXISTS transactions_lookup_idx
  ON transactions(business_id, conversation_id, type);

-- Enable Row Level Security (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy for owners to manage their own business transactions
CREATE POLICY "Owner can CRUD own transactions"
  ON transactions FOR ALL
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );
