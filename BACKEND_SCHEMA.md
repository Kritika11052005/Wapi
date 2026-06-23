# Backend Schema Document

## Wapi — Data Storage & Organisation

**Version:** 1.0 | **Date:** June 2026

---

## 1. Overview

All data lives in a single Supabase PostgreSQL instance. The schema is designed around three core entities: **Business** (the owner), **Conversation** (a customer thread), and **Document** (the knowledge base).

Row Level Security (RLS) is enabled on every table. A business can only access its own data. This is enforced at the database level — not just the application level.

---

## 2. Extensions

```sql
-- Run these first in Supabase SQL editor
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;      -- pgvector: for document embeddings
CREATE EXTENSION IF NOT EXISTS pg_cron;     -- scheduled jobs: stale lead detection
CREATE EXTENSION IF NOT EXISTS pg_trgm;     -- trigram index: fast text search
```

---

## 3. Full Schema

### Table: `businesses`

The business owner's account. One row per owner.

```sql
CREATE TABLE businesses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,                    -- "Priya's Beauty Salon"
  vertical          TEXT NOT NULL,                    -- "salon" | "clinic" | "tutoring" | "gym" | "other"
  owner_phone       TEXT NOT NULL,                    -- for daily summary WhatsApp delivery (+91...)
  city              TEXT,
  whatsapp_number   TEXT,                             -- the Meta Cloud API test number assigned
  confidence_threshold  NUMERIC DEFAULT 0.75,         -- owner-configurable, 0.5–0.9
  stale_window_hours    INT DEFAULT 2,                -- hours before a conversation is considered stale
  daily_summary_enabled BOOLEAN DEFAULT TRUE,
  onboarding_complete   BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Each authenticated user owns exactly one business
CREATE UNIQUE INDEX businesses_user_id_idx ON businesses(user_id);

-- RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can read own business"
  ON businesses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can update own business"
  ON businesses FOR UPDATE
  USING (auth.uid() = user_id);
```

---

### Table: `documents`

Raw uploaded documents (PDF text or pasted text) before chunking.

```sql
CREATE TABLE documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  filename      TEXT,                                 -- original filename or "Pasted text"
  content       TEXT NOT NULL,                        -- full raw text content
  file_size     INT,                                  -- bytes
  status        TEXT DEFAULT 'processing',            -- "processing" | "indexed" | "error"
  chunk_count   INT DEFAULT 0,                        -- number of chunks created
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can CRUD own documents"
  ON documents FOR ALL
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );
```

---

### Table: `document_chunks`

Chunked and embedded segments of each document. This is what pgvector searches against.

```sql
CREATE TABLE document_chunks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,                        -- the chunk text (300–500 tokens)
  embedding     VECTOR(768),                          -- Gemini text-embedding-004 output
  chunk_index   INT NOT NULL,                         -- position within the document
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- IVFFlat index for fast approximate nearest-neighbour search
-- nlist = 100 is appropriate for < 100,000 chunks
CREATE INDEX document_chunks_embedding_idx
  ON document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- RLS (service role bypasses for embedding pipeline; anon/user reads only own business chunks)
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can read own chunks"
  ON document_chunks FOR SELECT
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- Service role can insert/delete (used by embedding pipeline in API route)
-- No explicit policy needed for service role — it bypasses RLS
```

**Chunking strategy:**

- Chunk size: 400 tokens (overlapping 50 tokens)
- Library: custom recursive character splitter (or `langchain/text_splitter`)
- Each chunk preserves its source document section heading if possible

---

### Table: `customers`

Phone numbers that have contacted the business via WhatsApp.

```sql
CREATE TABLE customers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  phone         TEXT NOT NULL,                        -- "+919876543210"
  display_name  TEXT,                                 -- from WhatsApp profile if available
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at  TIMESTAMPTZ DEFAULT NOW(),
  message_count INT DEFAULT 0,
  UNIQUE(business_id, phone)                          -- one customer record per phone per business
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can read own customers"
  ON customers FOR SELECT
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );
```

---

### Table: `conversations`

One row per customer thread. This is the primary table the dashboard reads from.

```sql
CREATE TABLE conversations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id       UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id       UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Status
  status            TEXT DEFAULT 'open',
  -- open | escalated | stale | resolved
  
  -- AI scoring (updated on every new message)
  intent_score      NUMERIC(4,3) DEFAULT 0,           -- 0.000 – 1.000
  estimated_value   NUMERIC(10,2) DEFAULT 0,          -- ₹ value inferred from conversation
  urgency_flag      BOOLEAN DEFAULT FALSE,             -- time-sensitive request
  priority_score    NUMERIC GENERATED ALWAYS AS
                    (intent_score * estimated_value) STORED,
  -- computed column: used for dashboard ORDER BY
  
  -- Stale detection
  is_stale          BOOLEAN DEFAULT FALSE,
  stale_detected_at TIMESTAMPTZ,
  
  -- Counters
  total_messages        INT DEFAULT 0,
  auto_handled_count    INT DEFAULT 0,
  escalated_count       INT DEFAULT 0,
  
  -- Timestamps
  last_message_at   TIMESTAMPTZ DEFAULT NOW(),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  resolved_at       TIMESTAMPTZ,
  
  UNIQUE(business_id, customer_id)
);

-- Primary dashboard query index
CREATE INDEX conversations_priority_idx
  ON conversations(business_id, status, priority_score DESC, last_message_at DESC)
  WHERE status != 'resolved';

-- Stale detection index (pg_cron query)
CREATE INDEX conversations_stale_check_idx
  ON conversations(last_message_at, intent_score, status, is_stale)
  WHERE status = 'open' AND is_stale = false;

-- Enable Realtime (done in Supabase dashboard, or via API)
ALTER TABLE conversations REPLICA IDENTITY FULL;

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can read and update own conversations"
  ON conversations FOR ALL
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );
```

---

### Table: `messages`

Every individual message in a conversation. Full history, append-only.

```sql
CREATE TABLE messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  business_id       UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  role              TEXT NOT NULL,
  -- "customer"  — inbound WhatsApp message
  -- "agent"     — AI auto-reply
  -- "escalation"— AI escalation message sent to customer
  -- "owner"     — manual reply from business owner
  
  content           TEXT NOT NULL,
  
  -- Meta from Gemini (only on agent messages)
  confidence_score  NUMERIC(4,3),
  intent_score      NUMERIC(4,3),
  estimated_value   NUMERIC(10,2),
  
  -- Meta from WhatsApp
  whatsapp_message_id TEXT,                           -- Meta's message ID for dedup
  
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX messages_conversation_idx
  ON messages(conversation_id, created_at ASC);

-- Deduplication: Meta may deliver the same webhook twice
CREATE UNIQUE INDEX messages_whatsapp_id_idx
  ON messages(whatsapp_message_id)
  WHERE whatsapp_message_id IS NOT NULL;

-- Enable Realtime
ALTER TABLE messages REPLICA IDENTITY FULL;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can read own messages"
  ON messages FOR SELECT
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- Service role inserts messages (webhook handler)
```

---

### Table: `nudges`

AI-drafted follow-up messages for stale conversations. One active nudge per conversation at a time.

```sql
CREATE TABLE nudges (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  business_id       UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  draft_content     TEXT NOT NULL,                    -- Gemini-generated message draft
  final_content     TEXT,                             -- owner-edited version (if modified)
  
  status            TEXT DEFAULT 'pending',
  -- pending  — draft ready, not yet acted on
  -- sent     — owner clicked "Send Follow-up"
  -- dismissed— owner clicked "Dismiss"
  
  sent_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE nudges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can CRUD own nudges"
  ON nudges FOR ALL
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );
```

---

## 4. pg_cron Jobs

Both jobs run inside Supabase (zero extra infrastructure).

### Job 1 — Stale Lead Detector (every 30 minutes)

```sql
SELECT cron.schedule(
  'mark-stale-leads',
  '*/30 * * * *',
  $$
    -- Step 1: Mark conversations as stale
    UPDATE conversations
    SET
      is_stale = true,
      stale_detected_at = NOW(),
      status = 'stale'
    WHERE
      status = 'open'
      AND is_stale = false
      AND intent_score > 0.6
      AND last_message_at < NOW() - (stale_window_hours || ' hours')::INTERVAL;
    
    -- Note: nudge drafting (Gemini call) is triggered by the Realtime event
    -- in the Next.js app, not here in the DB. Keeping SQL jobs pure SQL.
  $$
);
```

### Job 2 — Reset stale if customer replies (trigger-based, not cron)

```sql
-- When a new customer message arrives, reset stale state
CREATE OR REPLACE FUNCTION reset_stale_on_reply()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'customer' THEN
    UPDATE conversations
    SET
      is_stale = false,
      stale_detected_at = NULL,
      status = 'open',
      last_message_at = NOW()
    WHERE id = NEW.conversation_id;
    
    -- Dismiss any pending nudges for this conversation
    UPDATE nudges
    SET status = 'dismissed'
    WHERE conversation_id = NEW.conversation_id AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_customer_reply
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION reset_stale_on_reply();
```

---

## 5. Key Queries

### Dashboard Priority Queue

```sql
SELECT
  c.id,
  c.status,
  c.intent_score,
  c.estimated_value,
  c.priority_score,
  c.is_stale,
  c.last_message_at,
  c.urgency_flag,
  cu.phone,
  cu.display_name,
  m.content AS last_message_preview
FROM conversations c
JOIN customers cu ON c.customer_id = cu.id
LEFT JOIN LATERAL (
  SELECT content FROM messages
  WHERE conversation_id = c.id
  ORDER BY created_at DESC
  LIMIT 1
) m ON true
WHERE
  c.business_id = $1
  AND c.status != 'resolved'
ORDER BY c.priority_score DESC, c.last_message_at DESC
LIMIT 50;
```

### Semantic Document Search (RAG retrieval)

```sql
SELECT
  dc.content,
  dc.chunk_index,
  1 - (dc.embedding <=> $1::vector) AS similarity
FROM document_chunks dc
WHERE
  dc.business_id = $2
  AND 1 - (dc.embedding <=> $1::vector) > 0.7  -- similarity threshold
ORDER BY dc.embedding <=> $1::vector
LIMIT 3;
```

### Conversation History (for agent context)

```sql
SELECT role, content, created_at
FROM messages
WHERE conversation_id = $1
ORDER BY created_at DESC
LIMIT 10;
-- Note: reverse this array in application code before sending to Gemini (oldest first)
```

---

## 6. Data Flow Summary

```
DOCUMENT UPLOAD
Owner uploads PDF/text
    → /api/documents POST
    → Insert into documents (status: processing)
    → Split into chunks (400 tokens, 50 overlap)
    → Embed each chunk via Gemini text-embedding-004
    → Insert into document_chunks with embedding VECTOR
    → Update documents.status = 'indexed', chunk_count = N

INBOUND MESSAGE
Customer messages on WhatsApp
    → Meta POSTs to /api/webhook
    → Upsert customers record
    → Upsert conversations record (or get existing)
    → Insert message (role: 'customer')
    → Embed customer message → pgvector search → top 3 chunks
    → Gemini inference → parse answer + scores
    → Update conversations: intent_score, estimated_value, last_message_at
    → If answer: Insert message (role: 'agent'), send via Meta API
    → If escalate: Insert message (role: 'escalation'), send via Meta API
    → Supabase Realtime fires → dashboard updates

STALE DETECTION (pg_cron every 30 min)
    → UPDATE conversations SET is_stale = true WHERE ...
    → Realtime fires on conversations table
    → Dashboard listener: detects is_stale = true on a conversation
    → Calls /api/nudge/generate → Gemini drafts follow-up
    → Inserts into nudges table
    → Nudge panel appears in dashboard

NUDGE SEND (owner clicks "Send Follow-up")
    → /api/nudge/[id]/send POST
    → Reads nudges.final_content (or draft_content if unedited)
    → Sends via Meta API
    → Updates nudges.status = 'sent', sent_at = NOW()
    → Inserts message (role: 'owner') into messages
    → Updates conversations.is_stale = false
```
