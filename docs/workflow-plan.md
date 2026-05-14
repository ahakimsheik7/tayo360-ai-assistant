# Workflow Plan — n8n & Automation

This document describes the n8n workflows that connect the Tayo360 AI Assistant widget to the downstream automation stack (Google Sheets CRM, Gmail notifications, Google Calendar booking, and future systems).

---

## Workflow Overview

```
[Webhook: incoming lead]
        │
        ▼
[Set: normalize fields]
        │
        ▼
[Google Sheets: append row]
        │
        ▼
[Gmail: notify team]
        │
        ▼
[Switch: serviceInterest = "Book Consultation"?]
        │
        ├── yes ──► [Google Calendar: create draft event] ──► [Gmail: booking link]
        │
        └── no  ──► [End]
```

The complete importable JSON lives in [`../workflows/n8n-workflows.json`](../workflows/n8n-workflows.json).

---

## Node-by-Node Specification

### 1. Webhook Trigger

- **Type:** `n8n-nodes-base.webhook`
- **Method:** `POST`
- **Path:** `tayo360-lead`
- **Response mode:** `onReceived` (returns immediately so the widget UX stays snappy)
- **Authentication:** none on Phase 2 (add HMAC signature verification in Phase 3+)

**Input payload:**

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

---

### 2. Set Node — Normalize

Normalizes whitespace, lowercases the email, and adds derived fields.

| Output field | Expression |
|---|---|
| `fullName` | `{{ $json.firstName }} {{ $json.lastName }}` |
| `email` | `{{ $json.email.trim().toLowerCase() }}` |
| `submittedDate` | `{{ $json.submittedAt.slice(0,10) }}` |
| `status` | `"New"` |
| `followUpNotes` | `""` |

---

### 3. Google Sheets — Append Row

- **Operation:** `Append`
- **Sheet:** `Tayo360 Leads`
- **Column mapping:**

| Sheet Column | Source |
|---|---|
| Date | `{{ $json.submittedDate }}` |
| First Name | `{{ $json.firstName }}` |
| Last Name | `{{ $json.lastName }}` |
| Email | `{{ $json.email }}` |
| Phone | `{{ $json.phone }}` |
| Organization | `{{ $json.organization }}` |
| Role | `{{ $json.role }}` |
| Service Interest | `{{ $json.serviceInterest }}` |
| Business Need | `{{ $json.businessNeed }}` |
| Preferred Contact Time | `{{ $json.preferredContactTime }}` |
| Lead Source | `{{ $json.leadSource }}` |
| Status | `New` |
| Follow-Up Notes | _(empty)_ |

---

### 4. Gmail — Notify Team

- **To:** `team@tayo360.com` (configurable per deployment)
- **Subject:** `New lead: {{ $json.fullName }} — {{ $json.serviceInterest }}`
- **Body (HTML):**

```html
<h2>New lead captured</h2>
<table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;">
  <tr><td><strong>Name</strong></td><td>{{ $json.fullName }}</td></tr>
  <tr><td><strong>Email</strong></td><td>{{ $json.email }}</td></tr>
  <tr><td><strong>Phone</strong></td><td>{{ $json.phone }}</td></tr>
  <tr><td><strong>Organization</strong></td><td>{{ $json.organization }}</td></tr>
  <tr><td><strong>Role</strong></td><td>{{ $json.role }}</td></tr>
  <tr><td><strong>Service Interest</strong></td><td>{{ $json.serviceInterest }}</td></tr>
  <tr><td><strong>Business Need</strong></td><td>{{ $json.businessNeed }}</td></tr>
  <tr><td><strong>Preferred Contact Time</strong></td><td>{{ $json.preferredContactTime }}</td></tr>
</table>
<p style="color:#5a6478;font-size:12px;">Captured via Tayo360 AI Assistant.</p>
```

---

### 5. Switch — Consultation Branch

Routes to a calendar booking branch when `serviceInterest === "Book Consultation"`.

---

### 6. Google Calendar — Create Booking (conditional)

- **Operation:** `Create` (tentative event)
- **Summary:** `Discovery call — {{ $json.fullName }}`
- **Description:** the captured `businessNeed`
- **Default duration:** 30 minutes

A follow-up Gmail node sends the prospect a personalized booking link (Calendly, Cal.com, or Google Calendar appointment slots) based on the deployment.

---

## Google Sheets CRM Schema

Create a sheet titled **`Tayo360 Leads`** with these columns (in order):

| Column | Type | Notes |
|---|---|---|
| Date | text | YYYY-MM-DD |
| First Name | text | |
| Last Name | text | |
| Email | text | normalized to lowercase |
| Phone | text | free-form |
| Organization | text | |
| Role | text | |
| Service Interest | text | one of the quick-action values |
| Business Need | text | free-form |
| Preferred Contact Time | text | Morning / Afternoon / Evening / Anytime |
| Lead Source | text | `"Website AI Assistant"` |
| Status | text | New / Contacted / Qualified / Converted / Closed |
| Follow-Up Notes | text | team annotations |

---

## Operational Notes

- **Activate the workflow** in n8n once all credentials are connected.
- **Test mode** — run a synthetic POST against the webhook before going live:
  ```bash
  curl -X POST https://your-n8n.example.com/webhook/tayo360-lead \
    -H "Content-Type: application/json" \
    -d @test-lead.json
  ```
- **Monitoring** — n8n's built-in execution log gives full visibility.
- **Error handling** — add an Error Trigger workflow that emails ops when any step fails.
- **Rate limits** — Google Sheets API allows ~500 writes/100s/user; well within expected lead volume.

---

## Future Workflow Branches (Phases 5–9)

- **Phase 5** — SMS notification node (Twilio) in parallel with Gmail.
- **Phase 6** — Voice transcript ingestion from VAPI feeds the same Sheets row.
- **Phase 7** — WhatsApp message node handles inbound conversations through the same webhook contract.
- **Phase 8** — Analytics workflow aggregates rows nightly into a metrics dashboard.
- **Phase 9** — Multi-tenant routing: a tenant ID in the payload routes to per-client Sheets and notification targets.