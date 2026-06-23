# Product Requirements Document (PRD)

## Wapi — WhatsApp AI CRM for Indian SMBs

**Version:** 1.0 | **Date:** June 2026 | **Status:** Approved for Build

---

## 1. App Overview

**Wapi** is an AI-powered WhatsApp inbox and CRM layer built for Indian small business owners — salons, clinics, tutoring centres, local service providers — who receive customer enquiries on WhatsApp but have no structured way to track, prioritise, or act on them.

Wapi gives the business owner a WhatsApp number that:

1. Automatically answers customer questions by reasoning over the business's own uploaded documents (services, prices, policies)
2. Escalates what it cannot answer with confidence, without guessing
3. Shows the owner a live dashboard ranked by lead value and urgency — not a flat inbox
4. Autonomously detects stale high-value conversations and drafts a follow-up nudge, unprompted

**One-line pitch:** *Your WhatsApp inbox, but it already knows who's worth ₹8,000, who's gone cold, and exactly what to say to bring them back.*

---

## 2. Problem Statement

### The Gap

Indian SMB owners live on WhatsApp. Over 78% of Indian SMBs use WhatsApp for business communication, yet the tools available to them fall into two camps:

- **Basic WhatsApp Business App** — a manual inbox with no automation, no prioritisation, no memory
- **WATI / AiSensy / Gallabox** — flow-builder chatbots where the owner must manually pre-wire "if customer says X → send template Y." There is no reasoning, no doc-awareness, no intent scoring

### The Pain Points (in order of severity)

1. **Missed leads** — a high-intent message from 9 PM gets buried under Tuesday morning chatter. The owner never follows up.
2. **Repetitive answers** — 70% of inbound messages are the same 8 questions (price, availability, location, duration). The owner types the same reply 15 times a day.
3. **No prioritisation** — the inbox is chronological. A ₹500 enquiry looks the same as a ₹8,000 bridal booking enquiry.
4. **Zero memory** — no record of what a customer asked, what was promised, or when they last reached out.
5. **Competitor gap** — every chatbot tool on the market requires the owner to build decision trees. None of them read the owner's actual documents and reason over them.

---

## 3. Target Users

### Primary User — The Business Owner

**Who:** Solo operators or small teams (1–5 people) running appointment-based or service-based Indian SMBs.

**Specific personas:**

- Priya, 32 — runs a beauty salon in Pune, gets 40–60 WhatsApp messages/day, misses 15–20% of them
- Rahul, 41 — runs a physiotherapy clinic in Bengaluru, manually types prices and slot availability 30 times a day
- Meena, 28 — runs home tuitions for Class 10–12, loses track of which parent enquired, which enrolled, which ghosted

**What they care about:** Revenue captured, time saved, zero missed leads. They do not care about "AI" — they care about not losing a ₹5,000 booking.

### Secondary User — The Customer

**Who:** Existing or prospective customers of the SMB, aged 18–55, who already use WhatsApp as their default communication channel.

**What they experience:** They message a business number exactly like any contact. No app download, no account, no change in behaviour.

---

## 4. Core Features

### F1 — Document Ingestion (Owner Onboarding)

Owner uploads 2–3 documents: services list, pricing sheet, policies/FAQs. System chunks, embeds, and stores them in a vector store. This is the knowledge base the agent reasons over.

### F2 — AI-Powered WhatsApp Responder

When a customer sends a message:

- Agent retrieves relevant document chunks via semantic search
- Gemini 3.5 Flash reasons over retrieved context + conversation history
- If confidence ≥ threshold: sends accurate, contextual reply
- If confidence < threshold: sends polite escalation message ("Let me get someone to help you with that") and flags the conversation for owner attention

### F3 — Intent & Value Scoring

Every conversation is assigned:

- `intent_score` (0–1): how likely the customer is to convert, based on message content
- `estimated_value` (₹): inferred from service mentions in the conversation
- `urgency_flag`: true if the customer has asked a time-sensitive question (booking, appointment, "today", "tomorrow")

### F4 — Priority Queue Dashboard

Owner-facing web dashboard showing:

- Live conversation feed ranked by (intent_score × estimated_value), not chronology
- Status badges: Auto-handled / Escalated / Stale / Resolved
- Each conversation card shows: customer number, last message preview, inferred value, time since last message, suggested next action

### F5 — Stale Lead Detector + Nudge Drafter

Powered by pg_cron running every 30 minutes:

- Identifies conversations where `intent_score > 0.6` AND `last_message_at < NOW() - 2 hours` AND `status = open`
- Marks conversation as `is_stale = true`
- Calls Gemini to draft a personalised follow-up message the owner can send in one click
- Dashboard surfaces the nudge with a "Send Follow-up" button

### F6 — Daily Owner Summary (WhatsApp)

Each morning at 9 AM (Vercel Cron):

- Sends the owner a WhatsApp message: "3 open leads, 1 stale high-value conversation, 2 bookings confirmed yesterday"
- Links back to the dashboard

### F7 — Conversation Memory

Full conversation history stored per customer phone number. Agent receives last N turns as context with every new message, enabling continuity ("As I mentioned earlier, our Saturday slots are full").

### F8 — Manual Override

Owner can:

- Jump into any conversation and reply manually
- Mark a conversation as resolved
- Edit/reject a nudge draft before sending
- Assign a conversation a custom value tag

---

## 5. Goals

### Hackathon Goals (June 24–30)

- Core loop works end-to-end: upload docs → customer messages → agent replies → dashboard updates live
- Stale lead nudge fires and drafts a follow-up correctly
- Screen recording demo is 2–3 min and shows all three moments: auto-reply, escalation, dashboard priority queue

### Product Goals (Post-Hackathon)

- Reduce owner's manual reply time by ≥ 70%
- Capture ≥ 85% of inbound leads without owner intervention
- Surface the top 3 highest-value open conversations at any time
- Reduce lead response time from hours to seconds

---

## 6. User Stories

### Owner Onboarding

- As an owner, I want to paste my services and prices into a simple form so the AI can answer questions about them
- As an owner, I want the setup to take under 5 minutes with no technical knowledge required

### Answering

- As an owner, I want customers to get an accurate answer immediately, even when I'm asleep
- As an owner, I want the agent to escalate questions it's unsure about so it never gives wrong information

### Dashboard

- As an owner, I want to see my most valuable open conversations at the top, not the most recent
- As an owner, I want to know at a glance which conversations have gone cold and need my attention

### Nudge

- As an owner, I want the system to notice when a ₹5,000 lead has gone quiet and draft a message I can send in one tap
- As an owner, I want to edit the draft before it sends — never auto-send without my approval

### Summary

- As an owner, I want a morning WhatsApp summary so I know exactly what to focus on before I open my laptop

---

## 7. Success Metrics

| Metric | Target |
|---|---|
| Auto-handled message rate | ≥ 80% of inbound messages |
| Agent response accuracy | ≥ 90% correct answers on doc-grounded questions |
| False escalation rate | ≤ 10% (agent escalates when it should have answered) |
| Stale lead detection precision | ≥ 85% of flagged leads are genuinely high-intent |
| Dashboard load time | < 2 seconds |
| Owner onboarding time | < 5 minutes from signup to first AI reply |
| Demo scoring (hackathon) | Top 3 in problem clarity + execution quality |

---

## 8. Feature Map

```
WAPI
├── Auth
│   ├── Sign up (email + password)
│   ├── Sign in
│   └── Session management (Supabase Auth)
│
├── Onboarding
│   ├── Business profile setup (name, vertical, phone)
│   ├── Document upload (PDF / text paste)
│   ├── Embedding pipeline (chunk → embed → store)
│   └── WhatsApp number linking (Meta Cloud API)
│
├── WhatsApp Agent
│   ├── Webhook receiver (POST /api/webhook)
│   ├── RAG retrieval (pgvector similarity search)
│   ├── Gemini 3.5 Flash inference
│   ├── Confidence gating (answer vs. escalate)
│   ├── Intent + value scoring
│   └── Reply sender (Meta Cloud API)
│
├── Dashboard
│   ├── Priority queue (ranked conversation list)
│   ├── Conversation detail view
│   ├── Manual reply input
│   ├── Stale lead nudge panel
│   ├── Stats strip (auto-handled / escalated / resolved)
│   └── Real-time updates (Supabase Realtime)
│
├── Cron Jobs
│   ├── Stale lead detector (pg_cron, every 30 min)
│   └── Daily summary sender (Vercel Cron, 9 AM)
│
└── Settings
    ├── Update business documents
    ├── Confidence threshold adjustment
    ├── Notification preferences
    └── Account management
```

---

## 9. Out of Scope (v1)

- Multi-agent team inbox (multiple human agents)
- Instagram / SMS channels
- Payment collection
- Calendar / booking integration
- Mobile app for the owner
- Bulk broadcast campaigns
- Analytics beyond the dashboard strip
