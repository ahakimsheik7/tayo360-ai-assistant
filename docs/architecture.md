# Architecture

This document describes the technical architecture of the Tayo360 AI Assistant widget. The system is designed as a **modular, event-driven** architecture in which each layer can be replaced without disrupting the rest.

---

## Guiding Principles

1. **Self-contained** — the widget ships as a single file with no dependencies and no build step.
2. **Self-injecting** — no HTML changes required on the host site; the widget builds itself at runtime.
3. **Modular backend** — every downstream integration is replaceable.
4. **No vendor lock-in** — no single dependency makes the system irreplaceable.
5. **Progressive enhancement** — each roadmap phase adds capability without breaking prior phases.
6. **Security by default** — HTTPS-only webhooks, secrets in environment variables, no PII in logs.

---

## System Layers

| Layer | Responsibility | Current Tech | Replaceable With |
|---|---|---|---|
| Embed | Drop-in script tag | Vanilla JS, self-injecting | React/Vue component, web component |
| Presentation | Widget UI, animations, accessibility | Injected HTML + CSS | Shadow DOM variant |
| Conversation | Dialog state machine, intent routing | Rule-based JS | OpenAI API, Claude API |
| Orchestration | Webhook routing, branching | n8n | Zapier, Make.com, custom Lambda |
| Persistence | Lead storage | Google Sheets | HubSpot, Pipedrive, Postgres |
| Notification | Real-time alerts | Gmail | Slack, Twilio SMS |
| Scheduling | Consultation booking | Google Calendar | Calendly, Cal.com |
| Voice (future) | Telephony channel | VAPI | Retell, alternatives |
| Messaging (future) | WhatsApp / SMS | WhatsApp Business API | Telegram, iMessage |

---

## Data Flow

```
┌──────────┐
│ Visitor  │
└─────┬────┘
      │
      ▼
┌──────────────────────────┐
│ Host website             │   Existing client site (any stack)
│  + <script> tag          │
└─────┬────────────────────┘
      │ widget self-injects on page load
      ▼
┌──────────────────────────┐
│ Embedded Widget          │   tayo360-widget.js
│  • Floating launcher     │
│  • Conversation panel    │
│  • State machine         │
└─────┬────────────────────┘
      │ HTTPS POST (JSON lead) on completion
      ▼
┌──────────────────────────┐
│ n8n Webhook Orchestrator │
│  • Validates payload     │
│  • Branches workflow     │
└─────┬────────────────────┘
      │
      ├──────────────► Google Sheets CRM (append row)
      │
      ├──────────────► Gmail (notify team)
      │
      ├──────────────► Google Calendar (offer booking link)
      │
      └──────────────► Future CRM / Analytics / SaaS Layer
```

---

## Widget Internal Architecture

```
┌─────────────────────────────────────────────┐
│ tayo360-widget.js                           │
│                                             │
│   IIFE                                      │
│   ├─ CONFIG (merged with Tayo360Config)     │
│   ├─ QUICK_ACTIONS, SERVICE_BLURBS          │
│   ├─ CSS template literal                   │
│   │     └─→ injectStyles() → <head>         │
│   ├─ HTML template literal                  │
│   │     └─→ injectHTML()  → <body>          │
│   ├─ State machine                          │
│   │     ├─ state.step (idle..done)          │
│   │     └─ state.lead (9 fields)            │
│   ├─ Conversation handlers                  │
│   │     ├─ botSay() (typed messages)        │
│   │     ├─ handleUserText()                 │
│   │     └─ handleQuickAction()              │
│   ├─ Webhook delivery                       │
│   └─ Public API (window.Tayo360)            │
│                                             │
└─────────────────────────────────────────────┘
```

The widget is wrapped in an IIFE that runs once per page load. A duplicate-load guard (`window.__tayo360WidgetLoaded`) prevents double-injection if the script is included twice.

---

## Lead Payload Schema

The widget POSTs a JSON document with the following shape:

```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "organization": "string",
  "role": "string",
  "serviceInterest": "string",
  "businessNeed": "string",
  "preferredContactTime": "string",
  "leadSource": "Website AI Assistant",
  "submittedAt": "ISO 8601 timestamp"
}
```

This schema is **stable across phases** — n8n, the CRM, and future analytics consume the same contract.

---

## Conversation State Machine

```
   idle
     │
     ▼
   greeting
     │
     ▼
   service ─────► (quick action) ─────► service_explained
                                              │
                                              ▼
                                          name_first
                                              │
                                              ▼
                                          name_last
                                              │
                                              ▼
                                            email ── (invalid? re-prompt)
                                              │
                                              ▼
                                            phone
                                              │
                                              ▼
                                             org
                                              │
                                              ▼
                                            role
                                              │
                                              ▼
                                            need
                                              │
                                              ▼
                                       contact_time ──► (quick action)
                                              │
                                              ▼
                                            done  ──► webhook POST
```

---

## Security & Data Handling

- **Transport** — all webhook traffic over HTTPS only.
- **Secrets** — webhook URLs are loaded via `window.Tayo360Config`. API keys and OAuth credentials live in n8n's encrypted credential store, never in client code.
- **Minimization** — only fields with clear business purpose are collected. No browser fingerprinting, no third-party trackers, no cookies, no localStorage.
- **Auditability** — every lead has a `submittedAt` timestamp and `leadSource`, enabling clean attribution.
- **No PII in logs** — production n8n workflows should scrub email and phone from execution logs.

---

## Performance Targets

| Metric | Target |
|---|---|
| Widget file size (uncompressed) | < 30 KB |
| Widget file size (gzipped) | < 8 KB |
| Time to interactive | < 200 ms on modern devices |
| Webhook round-trip | < 800 ms typical |
| Lighthouse impact on host page | negligible (deferred, no render-blocking) |

---

## Accessibility

- WCAG AA color contrast across all states.
- Full keyboard navigation (Tab/Shift+Tab/Enter/Esc).
- ARIA roles on dialog, status messages, and live regions.
- `aria-live="polite"` on the message stream for screen-reader updates.
- Respect for `prefers-reduced-motion`.
- Semantic HTML throughout.

---

## Extension Points

Engineers can extend the system at these well-defined seams:

1. **`window.Tayo360Config`** — runtime configuration without touching the file.
2. **`QUICK_ACTIONS`** in `tayo360-widget.js` — adjust quick-action buttons per deployment.
3. **`SERVICE_BLURBS`** — customize service descriptions per client.
4. **`handleUserText` switch** — add or remove conversation steps.
5. **`sendLeadToWebhook`** — pre-process or enrich the payload before sending.
6. **n8n workflows** — branch on `serviceInterest` to route different lead types differently.
7. **System prompt** (Phase 3+) — adjust tone and scope per deployment, see `prompts/system-prompt.md`.