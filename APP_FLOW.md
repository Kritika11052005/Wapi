# App Flow Document

## Wapi — Screen-by-Screen User Journey

**Version:** 1.0 | **Date:** June 2026

---

## 1. Flow Overview

```
PUBLIC SURFACE                AUTHENTICATED SURFACE
─────────────                 ──────────────────────
Landing Page                  Onboarding Wizard
     │                              │
     ├── Sign Up ──────────► Step 1: Business Profile
     │                             │
     └── Sign In ──────────► Step 2: Document Upload
                                   │
                             Step 3: WhatsApp Link
                                   │
                             ┌─────▼────────────────┐
                             │     DASHBOARD         │
                             │  ┌──────────────────┐ │
                             │  │ Priority Queue   │ │
                             │  ├──────────────────┤ │
                             │  │ Conversation     │ │
                             │  │ Detail Panel     │ │
                             │  ├──────────────────┤ │
                             │  │ Nudge Panel      │ │
                             │  └──────────────────┘ │
                             └──────────┬────────────┘
                                        │
                             ┌──────────▼────────────┐
                             │     SETTINGS          │
                             │  Documents / Account  │
                             └───────────────────────┘
```

---

## 2. Core Pages

### Page 1 — Landing Page (`/`)

**Purpose:** Convert visitors to sign-ups. Explain the value prop in 90 seconds.

**Sections (scroll order):**

1. **Hero** — Headline + sub-headline + CTA button ("Get Started Free") + animated phone mockup showing a live WhatsApp conversation being auto-answered
2. **Problem strip** — 3 pain points with icons: "Missed leads", "Repetitive answers", "No prioritisation"
3. **How it works** — 3-step visual: Upload docs → Customer messages → You see a ranked inbox
4. **Video scroll section** — single looping video (screen recording of the product) broken into phases revealed as the user scrolls: Phase 1 shows the customer side (WhatsApp conversation), Phase 2 reveals the dashboard updating live, Phase 3 shows the stale lead nudge firing
5. **Social proof strip** — "Built for salons, clinics, tutors, and local service businesses"
6. **CTA section** — "Start in 5 minutes. No coding." + Sign Up button
7. **Footer** — Links + tagline

**Primary action:** "Get Started Free" → `/auth/signup`
**Secondary action:** "Sign In" → `/auth/signin`

---

### Page 2 — Auth Pages (`/auth/signup`, `/auth/signin`)

**Sign Up:**

- Email input
- Password input (min 8 chars, strength indicator)
- Confirm password
- "Create Account" button
- Redirect: → `/onboarding/profile` on success
- Error states: email already exists, password mismatch, weak password

**Sign In:**

- Email input
- Password input
- "Sign In" button
- "Forgot password?" link → `/auth/reset-password`
- Redirect: → `/dashboard` if onboarding complete, → `/onboarding/profile` if not
- Error states: wrong credentials, unverified email

**Edge cases:**

- User lands on `/dashboard` without session → redirect to `/auth/signin`
- User lands on `/auth/signup` with active session → redirect to `/dashboard`

---

### Page 3 — Onboarding Wizard (`/onboarding`)

**3-step linear wizard. Progress bar at top. Cannot skip steps.**

#### Step 1 — Business Profile (`/onboarding/profile`)

Fields:

- Business name (text)
- Business type (dropdown: Salon / Clinic / Tutoring / Gym / Other)
- Owner's WhatsApp number (for daily summary delivery)
- City

Validation: all fields required. Phone must be valid Indian format (+91).
CTA: "Continue →"

#### Step 2 — Upload Your Documents (`/onboarding/documents`)

UI:

- Drag-and-drop zone accepting PDF or plain text
- OR a large text paste area ("Just paste your services and prices here")
- Shows uploaded file name + size after upload
- "Processing..." state while embedding runs (spinner + "We're reading your documents")
- Success state: "✓ 247 chunks indexed. Your AI is ready."

Edge cases:

- File too large (> 5MB): "Please upload a file under 5MB or paste the text directly"
- Unsupported format: "We accept PDF and text files only"
- Embedding fails: "Something went wrong. Please try again." (retry button)

CTA: "Continue →" (enabled only after successful embedding)

#### Step 3 — Connect WhatsApp (`/onboarding/whatsapp`)

Shows:

- The business's assigned WhatsApp test number (from Meta Cloud API setup)
- QR code or phone number display
- Instructions: "Send any message to this number from your phone to test it"
- Live status: "Waiting for test message..." → "✓ Connection verified!"

Edge cases:

- If test message not received after 60s: "Not receiving messages? Check our setup guide."
- If webhook not verified: show error with link to Meta App Dashboard

CTA: "Go to Dashboard →" (enabled after connection verified)

---

### Page 4 — Dashboard (`/dashboard`)

**Primary owner interface. Updates in real-time via Supabase Realtime.**

#### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Wapi logo | Business name | Settings | Sign out    │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  STAT STRIP  │         CONVERSATION DETAIL PANEL            │
│  (4 numbers) │         (appears when conversation           │
│              │          is selected from queue)             │
├──────────────┤                                              │
│              │                                              │
│  PRIORITY    │  - Customer number + first seen             │
│  QUEUE       │  - Inferred value badge (₹)                 │
│              │  - Full message thread                      │
│  (ranked     │  - Agent replies highlighted differently    │
│  conversation│  - Manual reply input                       │
│  cards)      │  - "Resolve" button                         │
│              │                                              │
│  [card]      │                                              │
│  [card]      ├──────────────────────────────────────────────┤
│  [card]      │         NUDGE PANEL                         │
│  [card]      │  (appears when is_stale = true on           │
│              │   selected conversation)                    │
│              │  - "This lead has gone quiet"               │
│              │  - AI-drafted follow-up message             │
│              │  - Edit draft text area                     │
│              │  - "Send Follow-up" button                  │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

#### Stat Strip (top of left panel)

4 live counters:

- **Active** — open conversations today
- **Auto-handled** — messages replied by AI without escalation
- **Escalated** — conversations needing owner attention
- **Stale** — high-intent conversations gone cold

#### Priority Queue Cards

Each card shows:

- Customer phone (partially masked: +91 98765 *****)
- Last message preview (truncated to 60 chars)
- Time since last message ("2h ago", "just now")
- Value badge: ₹500 / ₹2,000 / ₹8,000 (coloured by size)
- Status badge: Open (teal) / Escalated (amber) / Stale (red pulse) / Resolved (grey)
- Intent bar: thin horizontal bar, fill = intent_score

**Sorting logic:** `ORDER BY (intent_score * estimated_value) DESC, last_message_at DESC`

**Real-time behaviour:** When a new message arrives, the relevant card animates to its new position in the queue (Framer Motion layout animation).

#### Conversation Detail Panel

- Opens when a card is clicked
- Full scrollable message thread
- Customer messages: left-aligned, grey bubble
- Agent messages: right-aligned, teal bubble
- Escalation messages: right-aligned, amber bubble
- Owner manual replies: right-aligned, dark bubble with "You" label
- Manual reply input at bottom: text area + "Send" button
- "Mark Resolved" button in top-right of panel

#### Nudge Panel

Appears below conversation detail when `is_stale = true`:

- Banner: "⚠️ This lead has gone quiet for X hours"
- Inferred value: "Estimated conversation value: ₹5,000"
- Draft message (editable text area with Gemini-generated copy)
- "Send Follow-up" button (sends via Meta API to customer)
- "Dismiss" link (marks nudge as dismissed, removes panel)

---

### Page 5 — Settings (`/settings`)

**Tabs:**

1. **Documents** — view indexed documents, upload new, delete old (re-triggers embedding pipeline)
2. **AI Settings** — confidence threshold slider (0.5 – 0.9, default 0.75), stale conversation window (1h / 2h / 4h)
3. **Notifications** — daily summary on/off, summary time preference
4. **Account** — change email, change password, delete account

---

## 3. Navigation Rules

- **Unauthenticated:** can only access `/`, `/auth/signup`, `/auth/signin`, `/auth/reset-password`
- **Authenticated + onboarding incomplete:** redirected to `/onboarding/[current-step]`
- **Authenticated + onboarding complete:** can access `/dashboard`, `/settings`
- **Back navigation during onboarding:** allowed between steps, data is preserved
- **Dashboard → Settings:** top-right Settings icon, always accessible
- **Settings → Dashboard:** "← Back to Dashboard" link in Settings header

---

## 4. Primary Actions

| Action | Trigger | Result |
|---|---|---|
| Sign up | Submit signup form | Account created, redirected to onboarding |
| Upload document | Drop file / paste text | Embedding pipeline runs, chunks indexed |
| Receive WhatsApp message | Customer messages number | Agent pipeline runs, card appears in queue |
| Select conversation | Click queue card | Detail panel opens |
| Send manual reply | Submit reply input | Message sent via Meta API, thread updates |
| Send nudge | Click "Send Follow-up" | Draft sent to customer, card status updates |
| Resolve conversation | Click "Mark Resolved" | Card moves to resolved state, removed from active queue |
| View stale lead | Nudge panel auto-appears | AI draft ready to review and send |

---

## 5. Edge Cases

| Scenario | Behaviour |
|---|---|
| Webhook fires but Gemini is down | Escalate to owner, log error, never fail silently |
| Customer sends message in Hindi/Tamil | Gemini responds in same language |
| Customer sends image/audio | "I can only help with text messages right now. Please describe what you need." |
| Owner's document has contradictory pricing | Agent answers with both options and flags uncertainty |
| Same customer messages twice before agent responds | Messages queued, context preserved, single response addresses both |
| Supabase Realtime connection drops | TanStack Query refetches every 10s as fallback |
| Owner sends manual reply while agent is processing | Agent detects owner reply in history, skips its own response |
| Business deletes a document mid-conversation | Agent uses remaining indexed chunks, may escalate more |
| Stale lead nudge sent, customer replies | Conversation status resets to 'open', is_stale = false, nudge dismissed |

---

## 6. User States

### Owner States

```
UNAUTHENTICATED
    │
    └── signs up ──► ONBOARDING_PROFILE
                          │
                          └── completes ──► ONBOARDING_DOCUMENTS
                                                │
                                                └── completes ──► ONBOARDING_WHATSAPP
                                                                        │
                                                                        └── verifies ──► ACTIVE
                                                                                           │
                                                                                           └── deactivates ──► INACTIVE
```

### Conversation States

```
NEW ──► OPEN ──► ESCALATED ──► RESOLVED
              │
              └──► STALE ──► OPEN (if customer replies)
                          └──► RESOLVED (if owner resolves)
```

---

## 7. Flow Notes

- **WhatsApp verification must be Day 1** — all other flows depend on it
- The dashboard should work without a selected conversation (empty state: "Select a conversation to view details")
- Empty queue state: "No active conversations. Your AI is ready to respond."
- First-time dashboard with no messages: show a prompt "Send a test message to your WhatsApp number to see it in action"
- Mobile responsiveness: dashboard collapses to single-column on mobile (queue list → tap → full-screen detail)
- The nudge panel should use a subtle red pulse animation on the card badge to draw attention without being alarming
