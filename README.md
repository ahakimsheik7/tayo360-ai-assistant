# Tayo360 AI Assistant Widget

> An enterprise-grade AI chat widget you can embed into any website with a single `<script>` tag.
> **Automate. Simplify. Scale.**

A modern, self-injecting AI assistant widget that operates as a 24/7 digital business representative — greeting visitors, qualifying intent, capturing leads, and feeding qualified prospects into your CRM via n8n.

Built for [tayo360.com](https://www.tayo360.com/) and designed to be reused across any client website.

---

## Table of Contents

- [Highlights](#highlights)
- [Quick Embed](#quick-embed)
- [Configuration](#configuration)
- [Public JavaScript API](#public-javascript-api)
- [Conversation Flow](#conversation-flow)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Repository Structure](#repository-structure)
- [n8n Integration](#n8n-integration)
- [Customization](#customization)
- [Roadmap](#roadmap)
- [License](#license)

---

## Highlights

- 🚀 **One-line embed** — paste a single `<script>` tag and you're done
- 🪄 **Self-injecting** — no HTML changes to your existing site
- 🎨 **SaaS-grade UI** — refined visual language benchmarked against Stripe / Notion / Intercom / Linear
- 📱 **Fully responsive** — full-screen mobile, floating panel on desktop
- ♿ **Accessible** — WCAG AA contrast, keyboard navigation, ARIA roles, reduced-motion support
- 🪶 **Lightweight** — vanilla JS, no dependencies, no build step
- 🔌 **n8n-ready** — drop in your webhook URL and leads flow straight to your CRM
- 🔒 **Privacy-first** — collects only the fields needed for follow-up; no trackers

---

## Quick Embed

The widget is **already deployed in `widget/tayo360-widget.js`**. To add it to your existing website:

### Minimal (just works)

```html
<script src="https://your-cdn.example.com/tayo360-widget.js" defer></script>
```

That's it. The widget self-injects into the page, places a floating launcher in the bottom-right, and runs the full lead-capture conversation.

### With configuration

```html
<script>
  window.Tayo360Config = {
    webhookUrl: 'https://your-n8n.example.com/webhook/tayo360-lead',
    brandName: 'Tayo360',
    botName: 'Tayo360 Assistant',
    primaryColor: '#0a2540',
    accentColor: '#1a73a8',
    autoOpenAfterMs: 0           // set e.g. 8000 to auto-open after 8s
  };
</script>
<script src="https://your-cdn.example.com/tayo360-widget.js" defer></script>
```

### Trigger from any page element

Add the `data-tayo360-open` attribute to any element on your site:

```html
<button data-tayo360-open>Talk to our AI assistant</button>
<a href="#" data-tayo360-open>Chat with us</a>
```

---

## Configuration

All options live on `window.Tayo360Config`. Set this **before** the widget script loads.

| Option | Type | Default | Purpose |
|---|---|---|---|
| `webhookUrl` | string | `''` | n8n webhook endpoint that receives the lead payload |
| `brandName` | string | `'Tayo360'` | Brand displayed in the header and footer |
| `botName` | string | `'Tayo360 Assistant'` | Assistant title in the header |
| `statusText` | string | `'Online · usually replies instantly'` | Status line beneath the bot name |
| `poweredByText` | string | `'Powered by Tayo360'` | Footer credit |
| `primaryColor` | string | `'#0a2540'` | Dark navy used for header, buttons, user bubbles |
| `accentColor` | string | `'#1a73a8'` | Accent blue for hover states and focus |
| `typingDelay` | `{min, max}` | `{600, 1100}` | Milliseconds between bot messages (realistic feel) |
| `autoOpenAfterMs` | number | `0` | If > 0, auto-opens the panel after this many ms |

---

## Public JavaScript API

The widget exposes a small public API after load:

```js
Tayo360.open();      // Open the chat panel
Tayo360.close();     // Close the chat panel
Tayo360.toggle();    // Toggle open/closed
Tayo360.version;     // '1.0.0'
```

---

## Conversation Flow

```
Greeting
   ↓
Service interest  (quick-action buttons)
   ↓
Service explanation
   ↓
First name → Last name → Email → Phone → Organization → Role → Business need
   ↓
Preferred contact time  (quick-action buttons)
   ↓
Confirmation + webhook POST
```

The assistant follows these behavior rules:

- **One question at a time** — no overwhelming multi-question prompts
- **Validates email** before continuing
- **Re-anchors** unexpected free-text answers back into the flow
- **Never** provides legal, medical, or financial advice
- **Always** ends with a clear next step

See [`prompts/system-prompt.md`](./prompts/system-prompt.md) for the full behavior spec.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | Self-injected HTML (no template engine) |
| Styling | Self-injected CSS with CSS custom properties |
| Behavior | Vanilla JavaScript (ES2017+) |
| Build step | None — ship the file as-is |
| Dependencies | None |
| Workflow orchestration | n8n |
| CRM (Phase 2) | Google Sheets |
| Notifications (Phase 5) | Gmail / Twilio SMS |
| Scheduling (Phase 4) | Google Calendar |
| Conversation AI (Phase 3+) | OpenAI API |
| Voice (Phase 6) | VAPI |
| Messaging (Phase 7) | WhatsApp Business API |

---

## Architecture

```
Visitor
  └─→ Embedded Widget  (one <script> tag, self-injecting)
        └─→ Conversation Engine  (rule-based → OpenAI later)
              └─→ n8n Webhook
                    ├─→ Google Sheets CRM
                    ├─→ Gmail Notifications
                    ├─→ Google Calendar Booking
                    └─→ Future CRM / Analytics / SaaS Layer
```

Full architecture write-up: [`docs/architecture.md`](./docs/architecture.md).

---

## Repository Structure

```
tayo360-ai-assistant/
│
├── README.md                       # You are here
├── LICENSE                         # MIT or proprietary
│
├── widget/
│   └── tayo360-widget.js           # The single embeddable file
│
├── examples/
│   └── embed.html                  # Working demo + copy-paste embed snippets
│
├── docs/
│   ├── architecture.md             # Technical architecture
│   ├── embed-guide.md              # Step-by-step embed instructions
│   ├── workflow-plan.md            # n8n & automation workflow spec
│   └── roadmap.md                  # 9-phase delivery plan
│
├── prompts/
│   └── system-prompt.md            # Assistant tone, scope, behavior
│
├── workflows/
│   └── n8n-workflows.json          # Importable n8n workflow
│
└── assets/
    └── screenshots/                # Marketing screenshots
```

---

## n8n Integration

The widget POSTs a single JSON payload to your n8n webhook when a lead completes the flow:

```json
{
  "firstName": "Aaliyah",
  "lastName": "Brown",
  "email": "aaliyah@example.com",
  "phone": "+1-555-555-1234",
  "organization": "Brown Consulting",
  "role": "Founder",
  "serviceInterest": "AI Receptionist",
  "businessNeed": "Need 24/7 inquiry handling",
  "preferredContactTime": "Morning",
  "leadSource": "Website AI Assistant",
  "submittedAt": "2026-05-14T18:30:00.000Z"
}
```

To activate:

1. Import [`workflows/n8n-workflows.json`](./workflows/n8n-workflows.json) into n8n.
2. Activate the webhook trigger and copy its URL.
3. Set `webhookUrl` in `window.Tayo360Config`.

Full n8n spec: [`docs/workflow-plan.md`](./docs/workflow-plan.md).

Until `webhookUrl` is configured, leads are logged to the browser console as a structured table — useful for development and debugging.

---

## Customization

### Per-client branding

Override `primaryColor`, `accentColor`, `brandName`, and `botName` in `window.Tayo360Config`. No CSS edits needed.

### Quick actions

To change the quick-action buttons, edit the `QUICK_ACTIONS.initial` array near the top of `widget/tayo360-widget.js`.

### Service descriptions

To change what the assistant says about each service, edit `SERVICE_BLURBS` in the same file.

### Conversation flow

To add or remove steps, modify the `handleUserText` switch statement in `widget/tayo360-widget.js`.

---

## Roadmap

| Phase | Deliverable | Status |
|---|---|---|
| 1 | Embeddable Website Widget | ✅ |
| 2 | Lead Capture & Google Sheets CRM | 🔜 |
| 3 | n8n Automation Orchestration | ⏳ |
| 4 | Google Calendar Booking | ⏳ |
| 5 | Email & SMS Notifications | ⏳ |
| 6 | Voice AI Assistant (VAPI) | ⏳ |
| 7 | WhatsApp Integration | ⏳ |
| 8 | Analytics Dashboard | ⏳ |
| 9 | Multi-Client SaaS Platform | ⏳ |

Full roadmap: [`docs/roadmap.md`](./docs/roadmap.md).

---

## License

Proprietary to **Tayo360**. All rights reserved.
For commercial deployment inquiries: [tayo360.com](https://www.tayo360.com/).

---

<p align="center">
  <strong>Tayo360</strong> · Automate. Simplify. Scale.
</p>