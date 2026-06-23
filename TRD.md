# Technical Requirements Document (TRD)

## Wapi — WhatsApp AI CRM for Indian SMBs

**Version:** 2.0 | **Date:** June 2026 | **Role:** Systems Architecture & Engineering

---

## 1. System Overview

Wapi is a full-stack AI application deployed as a single Vercel project. Two primary runtime surfaces:

1. **API layer** — receives inbound WhatsApp messages from Meta's Cloud API, runs the Lemma agent pipeline, stores results to Supabase, fires replies back through Meta
2. **Dashboard** — a Next.js 16 React app the business owner visits in their browser; updates in real-time via Supabase Realtime WebSocket

No separate backend service. No Kubernetes. No Docker in production. One repo, one `vercel deploy`.

---

## 2. Frontend Stack

| Concern | Choice | Reason |
|---|---|---|
| Framework | Next.js 16.2 (App Router) | Co-locates API routes and UI, one deployment |
| Language | TypeScript (strict mode) | Type safety for API payloads, Supabase types |
| Styling | Tailwind CSS v4 | Utility-first, no runtime CSS-in-JS overhead |
| Components | shadcn/ui + ReactBits + Aceternity UI | shadcn for structure, ReactBits/Aceternity for animated components |
| Animation | Framer Motion 11 | Priority queue reorder, card entrances, nudge panel |
| State | Zustand 5 | Lightweight, no boilerplate, persists queue state |
| Real-time | Supabase Realtime (WebSocket) | Native Postgres change subscription, zero extra infra |
| Data fetching | TanStack Query v5 | Caching, optimistic updates, 10s fallback refetch |
| Forms | React Hook Form + Zod | Document upload, settings |
| Icons | Lucide React | Consistent, tree-shakeable |

---

## 3. Backend Stack

All backend logic in Next.js App Router API routes under `/app/api/`.

| Route | Method | Purpose |
|---|---|---|
| `/api/webhook` | GET | Meta Cloud API verification handshake |
| `/api/webhook` | POST | Receive inbound WhatsApp messages |
| `/api/documents` | POST | Upload + embed business documents |
| `/api/conversations` | GET | Fetch prioritised conversation list |
| `/api/conversations/[id]/reply` | POST | Owner sends manual reply |
| `/api/conversations/[id]/resolve` | PATCH | Mark conversation resolved |
| `/api/nudge/[id]/send` | POST | Send AI-drafted stale lead follow-up |
| `/api/cron/daily-summary` | GET | Vercel Cron — morning owner summary |
| `/api/auth/[...supabase]` | * | Supabase Auth callback handlers |

---

## 4. Database — Supabase (PostgreSQL)

### Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;   -- pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS pg_cron;  -- scheduled stale detection
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- fast text search
```

**Core tables:** `businesses`, `documents`, `document_chunks`, `customers`, `conversations`, `messages`, `nudges`

**Supabase Realtime:** Enable on `conversations` and `messages` tables (Supabase dashboard → Realtime → Tables).

### pg_cron — Stale Lead Detection (every 30 min)

```sql
SELECT cron.schedule(
  'mark-stale-leads',
  '*/30 * * * *',
  $$
    UPDATE conversations
    SET is_stale = true, status = 'stale', stale_detected_at = NOW()
    WHERE status = 'open'
      AND is_stale = false
      AND intent_score > 0.6
      AND last_message_at < NOW() - INTERVAL '2 hours';
  $$
);
```

---

## 5. Auth & Security

**Provider:** Supabase Auth (email + password)

- JWT tokens in httpOnly cookies — not localStorage
- All API routes validate session server-side via `@supabase/ssr`
- RLS enabled on ALL tables — business can only read/write its own rows
- Webhook authenticated via `X-Hub-Signature-256` HMAC verification
- All sensitive env vars server-only (no `NEXT_PUBLIC_` except Supabase URL + anon key)
- Rate limiting on every API route via Upstash Redis

See Security Document for full threat model and implementation.

---

## 6. Lemma SDK — Agent Infrastructure Layer

Lemma is the agentic infrastructure. 15% of judging. Must be visibly used.

### Installation

```bash
npm install @lemma/sdk
```

### Primitive Mapping

| Lemma Primitive | Wapi Usage |
|---|---|
| **Agent** | WhatsApp responder — reads docs, reasons, decides answer vs escalate |
| **Document Store** | Owner's uploaded docs (services, pricing, policies) — vector search |
| **Datastore** | Conversations, customers, nudges — structured state |
| **Workflow** | Full message pipeline: receive → retrieve → infer → score → reply |
| **Functions** | Nudge drafter, daily summary generator |
| **Integrations** | Meta WhatsApp Cloud API, Gemini 3.5 Flash |

### Agent Definition

```typescript
// lib/lemma/agent.ts
import { LemmaAgent } from '@lemma/sdk'

export const wApiAgent = new LemmaAgent({
  name: 'wapi-responder',
  description: 'WhatsApp customer support agent for Indian SMBs',

  documentStore: {
    provider: 'supabase',
    table: 'document_chunks',
    embeddingColumn: 'embedding',
    contentColumn: 'content',
    embeddingModel: 'gemini/text-embedding-004',
  },

  datastore: {
    provider: 'supabase',
    tables: ['conversations', 'messages', 'customers', 'nudges'],
  },

  model: {
    provider: 'google',
    name: 'gemini-3.5-flash',
    apiKey: process.env.GEMINI_API_KEY!,
  },

  systemPrompt: `
    You are a helpful WhatsApp assistant for {business_name}.
    Answer ONLY from the provided document context.
    Respond in the same language the customer used.
    If confidence < 0.75, respond with ESCALATE.
    End every response with JSON: {"confidence": float, "intent_score": float, "estimated_value": number}
  `,
})
```

### Workflow Definition

```typescript
// lib/lemma/workflow.ts
import { LemmaWorkflow } from '@lemma/sdk'
import { wApiAgent } from './agent'

export const messageHandlingWorkflow = new LemmaWorkflow({
  name: 'whatsapp-message-handler',
  steps: [
    {
      name: 'receive',
      fn: async (ctx) => ({
        message: ctx.input.message,
        customerPhone: ctx.input.from,
        businessId: ctx.input.businessId,
      }),
    },
    {
      name: 'retrieve-context',
      fn: async (ctx) => ({
        chunks: await wApiAgent.documentStore.search({
          query: ctx.steps.receive.message,
          businessId: ctx.steps.receive.businessId,
          topK: 3,
          similarityThreshold: 0.70,
        }),
      }),
    },
    {
      name: 'infer',
      fn: async (ctx) => wApiAgent.run({
        userMessage: ctx.steps.receive.message,
        context: ctx.steps['retrieve-context'].chunks,
        conversationHistory: ctx.input.history,
        businessName: ctx.input.businessName,
      }),
    },
    {
      name: 'score',
      fn: async (ctx) => {
        const jsonMatch = ctx.steps.infer.text.match(/\{.*\}/s)
        return jsonMatch ? JSON.parse(jsonMatch[0]) : { confidence: 0, intent_score: 0, estimated_value: 0 }
      },
    },
    {
      name: 'route',
      fn: async (ctx) => ({
        action: ctx.steps.score.confidence >= (ctx.input.confidenceThreshold ?? 0.75) ? 'answer' : 'escalate',
        reply: ctx.steps.infer.text.replace(/\{.*\}/s, '').trim(),
      }),
    },
    {
      name: 'persist',
      fn: async (ctx) => {
        await wApiAgent.datastore.upsert('conversations', {
          businessId: ctx.steps.receive.businessId,
          customerPhone: ctx.steps.receive.customerPhone,
          intentScore: ctx.steps.score.intent_score,
          estimatedValue: ctx.steps.score.estimated_value,
          status: ctx.steps.route.action === 'escalate' ? 'escalated' : 'open',
          lastMessageAt: new Date().toISOString(),
        })
      },
    },
  ],
})
```

### Lemma Functions

```typescript
// lib/lemma/functions.ts
import { LemmaFunction } from '@lemma/sdk'

export const draftNudgeFunction = new LemmaFunction({
  name: 'draft-stale-lead-nudge',
  input: { conversationHistory: 'array', businessName: 'string', estimatedValue: 'number' },
  fn: async (input) => wApiAgent.model.generate(`
    A customer interested in ${input.businessName} (₹${input.estimatedValue}) went cold.
    History: ${input.conversationHistory.map((m: any) => `${m.role}: ${m.content}`).join('\n')}
    Write a warm, natural WhatsApp follow-up under 50 words. Sound human, not pushy.
  `),
})

export const dailySummaryFunction = new LemmaFunction({
  name: 'generate-daily-summary',
  input: { activeCount: 'number', staleCount: 'number', autoHandledCount: 'number', topLead: 'object' },
  fn: async (input) => `
🌅 Good morning! Your Wapi summary:
📬 ${input.activeCount} open conversations
🤖 ${input.autoHandledCount} handled automatically
⚠️ ${input.staleCount} lead${input.staleCount !== 1 ? 's' : ''} need attention
${input.topLead ? `💰 Top lead: ₹${input.topLead.estimatedValue} — check dashboard` : ''}
  `.trim(),
})
```

### Lemma Integration (WhatsApp)

```typescript
// lib/lemma/integrations.ts
import { LemmaIntegration } from '@lemma/sdk'

export const whatsappIntegration = new LemmaIntegration({
  name: 'meta-whatsapp',
  type: 'webhook',
  config: {
    baseUrl: 'https://graph.facebook.com/v20.0',
    authToken: process.env.WHATSAPP_ACCESS_TOKEN!,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
  },
  send: async (to: string, message: string) => {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: message } }),
      }
    )
    return res.json()
  },
})
```

### Judging Demo Callouts (15% criterion)

Explicitly say in the submission writeup:

- Agent is provisioned via **Lemma's Agent primitive**
- Business docs stored in **Lemma's Document Store**, retrieved via semantic search
- Full message pipeline runs as a **Lemma Workflow** (5 steps: receive → retrieve → infer → score → reply)
- Stale lead nudge drafted by a **Lemma Function**
- WhatsApp registered as a **Lemma Integration**

---

## 7. Rate Limiting — All API Routes

**Provider:** Upstash Redis + `@upstash/ratelimit` (serverless, free tier, Vercel-native)

```bash
npm install @upstash/ratelimit @upstash/redis
```

### Shared Rate Limiter Utility

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const rateLimiters = {
  webhook:       new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, '1 m'),  prefix: 'wapi:webhook' }),
  auth:          new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5,  '15 m'), prefix: 'wapi:auth' }),
  documents:     new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1 h'),  prefix: 'wapi:documents' }),
  conversations: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(120,'1 m'),  prefix: 'wapi:conversations' }),
  reply:         new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, '1 m'),  prefix: 'wapi:reply' }),
  nudge:         new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5,  '1 h'),  prefix: 'wapi:nudge' }),
}

export async function applyRateLimit(limiter: Ratelimit, identifier: string) {
  const { success, limit, remaining, reset } = await limiter.limit(identifier)
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
      }}
    )
  }
  return null
}
```

### Rate Limit Coverage — Every Route

| Route | Limit | Window | Identifier |
|---|---|---|---|
| `POST /api/auth/signup` | 5 req | 15 min | IP address |
| `POST /api/auth/signin` | 5 req | 15 min | IP address |
| `POST /api/documents` | 10 req | 1 hour | User ID |
| `GET /api/conversations` | 120 req | 1 min | User ID |
| `POST /api/conversations/[id]/reply` | 30 req | 1 min | User ID |
| `POST /api/nudge/[id]/send` | 5 req | 1 hour | User ID + Conversation ID |
| `POST /api/webhook` | 60 req | 1 min | Sender phone number |
| `GET /api/cron/*` | Bearer token only | — | `CRON_SECRET` |

---

## 8. AI & APIs

### Gemini 3.5 Flash

- **Use:** Agent inference, intent scoring, nudge drafting, value estimation
- **Model string:** `gemini-3.5-flash`
- **SDK:** `@google/generative-ai`
- **Key:** `GEMINI_API_KEY` — server-only

### Gemini Embeddings

- **Model:** `text-embedding-004` (768 dimensions)
- **Use:** Embed document chunks on upload, embed queries at inference
- **pgvector query:** `ORDER BY embedding <=> query_embedding LIMIT 3`

### Meta WhatsApp Cloud API

- **Base URL:** `https://graph.facebook.com/v20.0`
- **Auth:** Bearer token (`WHATSAPP_ACCESS_TOKEN`)
- **Phone Number ID:** `WHATSAPP_PHONE_NUMBER_ID`
- **Verify token:** `WHATSAPP_VERIFY_TOKEN`
- **Signature:** `X-Hub-Signature-256` HMAC on every POST

---

## 9. Deployment

### Vercel Configuration

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-summary",
      "schedule": "30 3 * * *"
    }
  ]
}
```

*9 AM IST = 3:30 AM UTC*

### Environment Variables

```bash
# Supabase — NEXT_PUBLIC_ is safe (RLS enforces security)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server-only — bypasses RLS

# Gemini
GEMINI_API_KEY=                     # server-only

# Meta WhatsApp
WHATSAPP_ACCESS_TOKEN=              # server-only
WHATSAPP_PHONE_NUMBER_ID=           # server-only
WHATSAPP_VERIFY_TOKEN=              # server-only
WHATSAPP_APP_SECRET=                # server-only — HMAC verification

# Upstash Redis (rate limiting)
UPSTASH_REDIS_REST_URL=             # server-only
UPSTASH_REDIS_REST_TOKEN=           # server-only

# Cron
CRON_SECRET=                        # server-only
```

### Deployment Steps (Day 1)

1. `vercel deploy` → get production URL
2. Register `https://your-app.vercel.app/api/webhook` in Meta App Dashboard → WhatsApp → Webhooks
3. Subscribe to `messages` webhook field
4. Verify token handshake completes
5. Send test message → confirm it appears in Supabase `messages` table

---

## 10. Architecture Flow

```
CUSTOMER (WhatsApp)
      │ messages business number
      ▼
META CLOUD API
      │ POST /api/webhook
      ▼
NEXT.JS 16 (Vercel)
  │
  ├── /api/webhook
  │     1. Verify HMAC signature
  │     2. Rate limit (per sender phone)
  │     3. Parse + store message → Supabase
  │     4. Run Lemma Workflow (5 steps)
  │     5. Send reply via Lemma WhatsApp Integration
  │
  ├── /api/cron/daily-summary (Vercel Cron 3:30 AM UTC)
  │     Run Lemma dailySummaryFunction → send to owner's WhatsApp
  │
  └── Dashboard (/dashboard)
        Supabase Realtime WebSocket
        Priority queue + Nudge panel
      │
      ▼
SUPABASE
  PostgreSQL + pgvector + pg_cron + Realtime
  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐
  │ document_    │  │ conversations│  │   messages    │
  │ chunks       │  │ (priority    │  │ (full history)│
  │ (vectors)    │  │  scored)     │  │               │
  └──────────────┘  └──────┬───────┘  └───────────────┘
                           │
          pg_cron marks is_stale = true
          → Realtime fires → Dashboard updates
          → draftNudgeFunction triggered
      │
      ▼
UPSTASH REDIS
  Rate limit counters per route per identifier
```

---

## 11. Engineering Rules

### Scalable

- Stateless API routes — all state in Supabase, not in-memory
- pgvector `ivfflat` index for sub-100ms similarity search
- Webhook returns 200 to Meta within 5s; Lemma workflow continues async
- Gemini timeout > 15s → fallback to escalation path, never hang

### Modular

```
/app
  /api
    /webhook          ← Lemma workflow entry point
    /documents        ← Upload + Lemma document store indexing
    /conversations    ← CRUD + priority queue
    /nudge            ← Lemma draftNudgeFunction + send
    /cron             ← Lemma dailySummaryFunction

/lib
  /lemma              ← agent.ts, workflow.ts, functions.ts, integrations.ts
  /supabase           ← server.ts, client.ts, admin.ts
  /meta               ← WhatsApp API wrapper
  /rate-limit         ← Shared Upstash rate limiter
  /sanitise           ← Input sanitisation helpers

/types                ← Shared TypeScript interfaces
/hooks                ← useConversations, usePriorityQueue, useRealtime
```

### Observable

- Every API route logs: request ID, route, duration, status
- Lemma workflow logs each step name, duration, and output shape
- Gemini calls log: token counts, confidence score, latency
- Errors logged as structured JSON (Vercel captures automatically)

### Secure by Default

- RLS on every table
- HMAC verified on every webhook POST
- Rate limited on every API route
- No sensitive keys in client bundle
- Input sanitised before DB insert or Gemini prompt
- Cron routes behind `CRON_SECRET` Bearer token

---

## 12. Complete Technology Versions

```json
{
  "next": "16.2.x",
  "typescript": "5.x",
  "tailwindcss": "4.x",
  "framer-motion": "11.x",
  "@supabase/supabase-js": "2.x",
  "@supabase/ssr": "0.5.x",
  "@lemma/sdk": "latest",
  "@google/generative-ai": "0.21.x",
  "@upstash/ratelimit": "2.x",
  "@upstash/redis": "1.x",
  "zod": "3.x",
  "react-hook-form": "7.x",
  "@tanstack/react-query": "5.x",
  "zustand": "5.x",
  "lucide-react": "latest",
  "shadcn/ui": "latest",
  "@hello-pangea/dnd": "4.x"
}
```
