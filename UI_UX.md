# UI/UX Design Document

## Wapi — Visual Design System

**Version:** 1.0 | **Date:** June 2026

---

## 1. Design Philosophy

Wapi is built for a business owner who does not think of themselves as a tech user. The design must feel **immediately legible** — not a SaaS dashboard drowning in features, but a tool that surfaces exactly one thing: who do I talk to right now, and what do I say?

**Four principles:**

1. **Clarity over completeness** — surface the one next action, not all possible actions
2. **Alive, not static** — realtime updates should feel natural, not jarring
3. **Trustworthy, not clever** — the AI is a tool, not a personality; UI should reinforce confidence, not novelty
4. **Mobile-aware** — owners check this on their phone between appointments

---

## 2. Color Palette

Extracted from "Refreshing Aqua Tones" palette, extended for a complete design system. These tones complement WhatsApp's existing green brand while feeling distinct and premium.

```
PRIMARY PALETTE
───────────────
--color-midnight:   #0B3D52    Dark navy teal — primary surfaces, headers, sidebar
--color-ocean:      #00B4D8    Bright cyan — primary CTA buttons, active states
--color-mint:       #90E0EF    Light aqua — secondary backgrounds, hover states, empty states
--color-teal:       #2A9D8F    Medium teal-green — accent, intent bar fill, value badges
--color-lime:       #57CC99    Bright lime green — success states, resolved badges, positive metrics

NEUTRALS
─────────
--color-surface:    #F0FAFA    Off-white with aqua tint — main page background
--color-card:       #FFFFFF    Pure white — conversation cards, panels
--color-border:     #C8E9EF    Soft aqua-grey — card borders, dividers
--color-text-primary:   #0B2333    Near-black with blue undertone — headings, primary text
--color-text-secondary: #4A7A8A    Muted teal-grey — labels, timestamps, metadata
--color-text-placeholder: #8DB4BC  Light teal-grey — placeholder text, disabled states

SEMANTIC COLOURS
─────────────────
--color-escalated:  #F4A261    Warm amber — escalated conversation badges, warning states
--color-stale:      #E63946    Coral red — stale lead badges, urgent states
--color-stale-soft: #FFE5E7    Very light red — stale card background tint
--color-resolved:   #ADB5BD    Cool grey — resolved/inactive states

GRADIENTS
──────────
--gradient-hero:    linear-gradient(135deg, #0B3D52 0%, #00B4D8 60%, #57CC99 100%)
--gradient-card-hover: linear-gradient(180deg, rgba(0,180,216,0.05) 0%, transparent 100%)
--gradient-cta:     linear-gradient(90deg, #00B4D8, #2A9D8F)
```

---

## 3. Typography

**Display face:** `Clash Display` (Variable) — geometric, slightly editorial, confident without being corporate. Used for hero headlines, section titles, large numbers.

**Body face:** `Inter` (Variable) — legible, neutral, widely supported. Used for all body copy, labels, buttons, form inputs.

**Mono face:** `JetBrains Mono` — for message previews, phone numbers, code-like data.

```
TYPE SCALE
───────────
--text-hero:    Clash Display 600, 56px/60px, letter-spacing: -0.03em
--text-h1:      Clash Display 600, 36px/42px, letter-spacing: -0.02em
--text-h2:      Clash Display 500, 28px/34px, letter-spacing: -0.01em
--text-h3:      Inter 600, 20px/28px
--text-body:    Inter 400, 15px/24px
--text-small:   Inter 400, 13px/20px
--text-label:   Inter 500, 12px/16px, letter-spacing: 0.06em, UPPERCASE
--text-mono:    JetBrains Mono 400, 13px/20px
--text-value:   Clash Display 700, 24px/28px  (for ₹ values in dashboard)
```

---

## 4. UI Components

**Agent Instructions:** Search the following for pre-built animated components before building from scratch:

- **ReactBits** (`reactbits.dev`) — animated text, card effects, button variants, scroll reveals
- **Aceternity UI** (`ui.aceternity.com`) — spotlight cards, animated backgrounds, tracing beams, glowing borders
- **Framer Motion** — layout animations (priority queue reorder), page transitions, micro-interactions
- **Godly** (`godly.website`) — reference for landing page scroll patterns, hero treatments
- **Refer.no styles** — reference for card and typography layout inspiration

### Component Library

#### Buttons

```
Primary CTA:
  Background: --gradient-cta
  Text: white, Inter 600, 15px
  Padding: 12px 24px
  Border-radius: 10px
  Hover: brightness(1.1) + scale(1.02)
  Active: scale(0.98)

Secondary:
  Background: transparent
  Border: 1.5px solid --color-ocean
  Text: --color-ocean
  
Ghost:
  Background: transparent
  Text: --color-text-secondary
  Hover: background --color-mint at 40% opacity
```

#### Conversation Cards (Priority Queue)

```
Background: --color-card
Border: 1px solid --color-border
Border-radius: 14px
Padding: 16px
Shadow: 0 2px 8px rgba(11,61,82,0.06)
Hover: shadow 0 4px 16px rgba(0,180,216,0.12) + translate-y(-1px)

Selected state:
  Border: 2px solid --color-ocean
  Background: linear-gradient(to-right, rgba(0,180,216,0.04), white)

Stale state:
  Background: --color-stale-soft
  Border: 1px solid rgba(230,57,70,0.3)
  Badge pulses: keyframe animation, opacity 1 → 0.4 → 1, 2s loop

Layout animation: Framer Motion `layout` prop on each card
  When priority changes, cards animate to new position smoothly (spring)
```

#### Value Badge

```
₹500:   background #E8F8F2, text --color-teal,   font: Clash Display 600
₹2000:  background #FFF4E5, text --color-escalated
₹5000+: background gradient-cta (clipped to badge), text white
```

#### Intent Bar

```
Container: height 3px, background --color-border, border-radius 99px
Fill: --color-teal to --color-ocean gradient, width = intent_score * 100%
Animation: width transition 600ms ease on load
```

#### Status Badges

```
Open:      #E0F7FA background, --color-ocean text
Escalated: #FFF3E0 background, --color-escalated text
Stale:     #FFE5E7 background, --color-stale text + pulsing dot
Resolved:  #F5F5F5 background, --color-text-secondary text
```

#### Message Bubbles

```
Customer:  background #F0FAFA, border 1px solid --color-border, border-radius 16px 16px 16px 4px
Agent:     background --color-midnight, text white, border-radius 16px 16px 4px 16px
Escalated: background #FFF3E0, border 1px solid --color-escalated, border-radius 16px 16px 4px 16px
Owner:     background --gradient-cta, text white, border-radius 16px 16px 4px 16px
```

#### Nudge Panel

```
Container: 
  Background: linear-gradient(135deg, #FFF5F5, #FFF8E1)
  Border-left: 3px solid --color-stale
  Border-radius: 0 12px 12px 0
  Padding: 20px

Header: --color-stale, Inter 600 ("This lead has gone quiet")
Value display: Clash Display 700, --color-teal
Draft text area: 
  Background: white
  Border: 1px solid --color-border
  Font: Inter 400, 14px (editable)
  
Send button: background --color-stale, hover brightness(0.9)
```

---

## 5. Screen Previews

### Landing Page Structure

```
┌──────────────────────────────────────────────────────────┐
│  NAVBAR: Wapi wordmark (--color-midnight) | Sign In | CTA│
├──────────────────────────────────────────────────────────┤
│                                                          │
│  HERO (full viewport, --gradient-hero background)        │
│                                                          │
│  "Your WhatsApp inbox,                                   │
│   but smarter."             [Phone mockup showing        │
│                              live WhatsApp conversation] │
│  Sub: Answer every customer,                             │
│  prioritise every lead.                                  │
│                                                          │
│  [Get Started Free →]  [Watch demo ▶]                   │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  PROBLEM STRIP (--color-surface background)              │
│  [Missed leads] [Repetitive answers] [No prioritisation] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  VIDEO SCROLL SECTION                                    │
│  "See it in 60 seconds"                                  │
│                                                          │
│  Sticky video frame on right, scroll triggers phases:    │
│  Phase 1 (scroll 0-33%): Customer WhatsApp view         │
│  Phase 2 (scroll 33-66%): Dashboard updating live       │
│  Phase 3 (scroll 66-100%): Stale nudge firing           │
│                                                          │
│  Left side: phase descriptions that appear/fade          │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  HOW IT WORKS — 3 steps with animated connectors         │
├──────────────────────────────────────────────────────────┤
│  CTA SECTION — dark (--color-midnight background)        │
│  "Start in 5 minutes. No coding."                        │
│  [Create your free account →]                            │
└──────────────────────────────────────────────────────────┘
```

### Dashboard Layout

```
┌──────────────────────────────────────────────────────────┐
│  NAV: [Wapi] .............. [Priya's Salon ▾] [⚙] [→]  │
├──────────────────────────────────────────────────────────┤
│ STAT STRIP:  [24 Active] [18 Auto-handled] [3 Escalated] [2 Stale] │
├──────────────┬───────────────────────────────────────────┤
│ QUEUE        │  CONVERSATION DETAIL                      │
│ ─────────    │  ──────────────────                       │
│ [🔴 +91 98.. │  +91 98765 ***** · First contact: Mon    │
│  "what's the │  Estimated value: ₹5,000 · Intent: ████░ │
│  price for.. │                                           │
│  2h ago ₹5k] │  [Customer] "hi, what are your rates     │
│              │   for a full bridal package?"             │
│ [🟡 +91 87.. │                                           │
│  "do you hav │  [Agent] "Hi! Our bridal package starts  │
│  slots on Sa │   at ₹8,000 and includes..."              │
│  45m ago ₹2k]│                                           │
│              │  [Customer] "ok sounds good, i'll think  │
│ [🟢 +91 76.. │   about it"                               │
│  "confirmed  │                                           │
│  for 3pm tha │  ┌──── TYPE A REPLY ─────────────────┐   │
│  just now ₹1k│  │                                   │   │
│              │  └──────────────────── [Send] ───────┘   │
│ [filter ▾]   │                            [Mark Resolved]│
│              ├───────────────────────────────────────────┤
│              │  ⚠ NUDGE: Gone quiet for 2h              │
│              │  Value: ₹5,000                            │
│              │  "Hi! Just checking if you had any       │
│              │   questions about the bridal package..."  │
│              │  [Edit draft] [Send Follow-up] [Dismiss]  │
└──────────────┴───────────────────────────────────────────┘
```

---

## 6. Design Elements

### Signature Element — Animated Priority Reorder

The single most memorable moment in the dashboard: when a new message arrives, the affected conversation card smoothly animates to its new position in the priority queue (using Framer Motion's `layoutId` and `AnimatePresence`). It's subtle — a 400ms spring animation — but it makes the ranking feel alive and trustworthy rather than static.

### Hero Phone Mockup

- A floating phone mockup (CSS perspective transform, slight 3D tilt)
- Shows a real WhatsApp conversation thread inside
- Messages animate in one by one on load (staggered Framer Motion entrance)
- Agent reply appears with a brief "typing..." indicator before the message
- Subtle parallax on scroll — phone floats slightly as hero section scrolls

### Video Scroll Section

- Implementation: `position: sticky` container, progress tracked via `IntersectionObserver` or scroll event
- A single MP4 (screen recording of the product) plays frame-by-frame based on scroll position
- Three phase labels on the left fade in/out as user scrolls through each third
- Use `<video>` element with `currentTime` set proportionally to scroll progress (not autoplay)
- Background: --color-midnight, text: white, creates contrast before the light-background sections below

### Animated Stat Numbers

- On dashboard load, stat numbers count up from 0 to their value (600ms, ease-out)
- On real-time update, number transitions with a flip animation (ReactBits number ticker)

### Onboarding Step Indicator

- 3 dots at the top, current step filled with --color-ocean
- Completed steps filled with --color-teal + checkmark icon

---

## 7. Design Principles Applied

### Simplicity

- Dashboard has one primary action per state: if a conversation is stale, the only highlighted action is "Send Follow-up." All other actions are secondary (smaller, ghost buttons).
- No modals unless absolutely necessary — use slide-in panels instead
- Every screen has a single F0 action (largest, highest contrast button)

### Consistency

- All interactive states follow the same pattern: default → hover (lift + shadow) → active (press-in) → disabled (opacity 0.4)
- Colour use is semantic — teal always means good/active, amber always means needs attention, red always means urgent. Never decorative.
- Spacing scale: 4px base unit. All padding/margin in multiples of 4.

### Usability

- The priority queue is the only inbox the owner needs to look at. No separate "All conversations" view buried in a sub-menu.
- The nudge panel appears inline below the conversation — no popup, no separate page. The owner sees the context and the action in one view.
- Empty states are action-oriented: "Send a test message to +91 XXXXX to see your first conversation" not "No conversations yet."

### Accessibility

- All interactive elements meet WCAG AA contrast (4.5:1 minimum)
- Keyboard navigation supported throughout dashboard
- Reduced motion: all animations respect `prefers-reduced-motion` media query
- All form inputs have visible labels (not just placeholder text)
- Status badges use both colour and text label (never colour alone)

---

## 8. Animation Inventory

| Element | Animation | Library | Duration |
|---|---|---|---|
| Page load | Fade + slide up (staggered) | Framer Motion | 400ms |
| Queue card position change | Spring layout animation | Framer Motion | 400ms |
| New card entrance | Slide in from right + fade | Framer Motion | 300ms |
| Stale badge pulse | Opacity 1→0.4→1 loop | CSS keyframes | 2s |
| Hero phone messages | Staggered entrance | Framer Motion | 600ms total |
| Stat number count-up | Number ticker | ReactBits | 600ms |
| Video scroll phases | currentTime proportional to scroll | Vanilla JS | – |
| Nudge panel entrance | Slide down + fade | Framer Motion | 250ms |
| Intent bar fill | Width transition | CSS | 600ms |
| Button hover | Scale + shadow | CSS transitions | 150ms |
