# ZyraTalk Platform — Product Requirements Document (Detailed)

**Document version:** 1.1  
**Last updated:** 2026-05-04  
**Source PRD (canonical):** [`Zyra-Talk-V1 Doc by MS.md`](../Zyra-Talk-V1%20Doc%20by%20MS.md) in repository root  
**Public positioning reference:** [ZyraTalk — AI Answering Service](https://www.zyratalk.com/)

This document expands the root PRD into goals, acceptance-style feature notes, and gaps analysis. Where the root doc is authoritative (e.g. partner types, workspace names, billing via Zoho), this file aligns with it.

---

## 1. Executive summary

Per the root PRD, **ZyraTalk** is a **multi-tenant AI customer communication and automation platform** for **service-based businesses** (plumbing, HVAC, legal, healthcare, contractors, etc.). It combines **AI voice assistants, chatbots, and automation workflows** across **phone and web** to **capture missed calls**, **automate conversations**, **generate and manage leads**, **book appointments**, and **integrate with CRM/ERP**—delivering **24/7** engagement without a human always on the line.

The commercial model includes **direct customers**, **white-label partners** (rebrand and resell), and **non–white-label partners** (resell under ZyraTalk branding, often commission-based). Operations are organized around **Workspaces** (including **Turbo Voice Workspace** for voice rules and **Web Workspace** for chat), **branch** configuration per location, a unified **conversation** store, **notifications** (dashboard, email, SMS, CRM), and **billing** (subscriptions, setup fees, Zoho-backed invoicing).

**Primary business outcomes**

- Reduce missed-call rate (industry pain: ~15–35% of calls unanswered).
- Increase booked revenue from after-hours and overflow traffic.
- Lower cost per handled conversation vs. pure live staffing.
- Maintain brand-consistent, compliant conversations per vertical.

---

## 2. Goals and non-goals

### 2.1 Goals

| ID | Goal | Success metric (examples) |
|----|------|-----------------------------|
| G1 | Answer and complete common intents without human | ≥ X% containment on top intents (booking, reschedule, FAQ) |
| G2 | Reliable post-call artifacts | 100% of completed calls have transcript + summary + disposition |
| G3 | Integrations create/update operational records | ≥ Y% of “book job” flows result in valid CRM/calendar records |
| G4 | Safe escalation | Human backup / transfer works under latency SLO |
| G5 | Multi-tenant isolation | No cross-tenant data leakage in APIs, storage, or logs |
| G6 | Partner isolation | WL/NWL partners only see permitted customer orgs and billing slices |
| G7 | Workspace parity | Voice (Turbo) and Web workspace settings deploy predictably (draft/publish) |

### 2.2 Non-goals (initial phases)

- Building proprietary telephony hardware.
- Full legal practice management or full EHR replacement (integrate instead).
- Guaranteed revenue outcomes in v1 (position as “ROI program” over time).
- Replacing Zoho Books/Invoice as system of record for accounting (sync **to** Zoho per root PRD).

---

## 3. User types (from root PRD)

| Type | Description | Product implications |
|------|-------------|----------------------|
| **Direct user** | Business uses ZyraTalk directly under **ZyraTalk branding**. | Standard tenant onboarding, direct billing, full feature access per plan. |
| **White-label partner** | Rebrands platform (**own domain and branding**), resells, may manage **sub-partners and customers**. | Theming, custom domains, partner hierarchy, **commission-based** billing, isolated admin experiences. |
| **Non–white-label partner** | Resells under **ZyraTalk** branding; manages clients in-system; **commission / revenue share**. | Partner console for managed orgs; branding fixed; commission reporting. |

All three share core capabilities where licensed: **web chatbot**, **inbound/outbound voice**, **live chat**, **conversation history**, **CRM integrations**, **notifications**.

---

## 4. Personas (operational)

| Persona | Needs |
|---------|--------|
| **Owner / GM** | Revenue visibility, missed-call reduction, simple ROI narrative. |
| **Office manager** | Schedules, scripts, on-call rules, dispute resolution on transcripts. |
| **Dispatcher / CSR** | Handoffs, context on caller, job details, notifications. |
| **Internal live-chat agent** | Logged-in dashboard; queue alerts; join conversation. |
| **External live-chat agent** | **Magic-link** style web UI (no full account); notified by **email/SMS** per root PRD. |
| **Partner success / reseller** | Provision child orgs, branding, usage and commission views. |
| **IT / Ops** | SSO (future), audit logs, integration health, data retention. |
| **ZyraTalk platform admin** | Global **Admin Workspace** configs, impersonation controls, support tooling, feature flags. |

---

## 5. Product pillars (from public positioning + root PRD)

1. **AI answering (voice)** — Natural, low-latency dialog; booking/reschedule/FAQ; transfer when needed.  
2. **Frontline AI + human backup** — Seamless escalation path with context bundle for the human.  
3. **AI webchat** — Same knowledge and actions over chat; optional handoff to human inbox.  
4. **Advanced analytics** — Transcripts, recordings, KPIs, funnels, disposition, integration outcomes.  
5. **Integrations & workflows** — CRM, calendar, dispatch, ticketing; notifications to SMS/voice/email/app.  
6. **Industry packs** — Home services, legal, healthcare: prompts, compliance hooks, vocabulary, escalation rules.  
7. **Partner & white-label** — Reseller hierarchy, branding, commission-aware billing (per root PRD).  
8. **Billing & invoices** — Monthly subscription, one-time setup, Zoho sync, partner vs direct invoicing.

---

## 6. Workspace system (from root PRD)

| Workspace | Scope | Contents (authoritative list from root doc) |
|-----------|--------|-----------------------------------------------|
| **Admin Workspace** | **Global** platform admin | Shared configurations available across the product (feature flags, defaults, compliance templates). |
| **Turbo Voice Workspace** | Per-tenant voice | Call handling rules, routing logic, automated responses, **voice AI behavior**, **outbound campaign** rules. |
| **Web Workspace** | Per-tenant web | Chat flows, service menus, **AI rules** (e.g. OpenAI on/off), customer interaction steps, live-chat routing. |

**Acceptance criteria:** Each business **organization** can open and edit Turbo Voice vs Web workspace settings independently; published changes versioned; Admin Workspace edits restricted to platform roles only.

---

## 7. Detailed feature catalog

### 7.1 Tenant, partner hierarchy, and branding

| Feature | Description | Acceptance criteria (high level) |
|---------|-------------|-----------------------------------|
| Organization profile | Legal name, timezone, service areas, hours. | CRUD with validation; timezone drives scheduling rules. |
| Reseller linkage | Direct org vs org managed under a partner. | `partner_id` / equivalent only set when contractually a partner customer; RBAC enforces visibility. |
| White-label branding | Partner **domain**, logos, colors, email sender where applicable. | Preview + publish; no leakage of ZyraTalk assets in WL tenant UI when WL mode on. |
| Roles & permissions | Owner, Admin, Manager, Agent, Partner admin variants. | RBAC enforced on all APIs; audit on permission changes. |

### 7.2 Branch management (from root PRD)

| Feature | Description | Acceptance criteria |
|---------|-------------|----------------------|
| Branches / locations | Separate contact details, hours, chatbot rules, **call workflows** per branch. | All voice and web configs scoping support `location_id` or branch filter. |
| Default welcome & validation | Branches start from **default welcome message** and **validation rules** that define how conversations open. | Configurable per branch; fall back to org defaults when unset. |

### 7.3 Telephony & session

| Feature | Description | Acceptance criteria |
|---------|-------------|----------------------|
| Phone numbers | Provision / port / assign to location or campaign. | Number ↔ tenant binding immutable without admin workflow. |
| Inbound call handling | AI answering, inquiry handling, booking, lead capture, routing (root PRD). | Processed under **Turbo Voice Workspace** rules; p95 voice interaction SLO defined in engineering spec. |
| Outbound campaigns | **Marketing**, **appointment reminders**, **follow-ups**, **service notifications** (root PRD). | Campaign entity with schedule, audience, consent flags, opt-out honored; idempotent dial attempts. |
| Provider stack | Root doc: **Twilio** (telephony), **Vapi** (orchestration), **ElevenLabs** (TTS), **OpenAI** (AI). | Credentials per tenant in vault; health indicators in admin UI. |
| Transfer / warm handoff | To PSTN or queue. | Caller metadata + summary passed to agent desktop (integration-dependent). |
| Voicemail / fallback | When AI unavailable or user-selected. | Clear routing reason codes. |
| Artifacts | Call logs, **recordings**, **transcription**, **notification alerts** (root PRD). | Every completed inbound/outbound leg links to conversation record. |

### 7.4 AI conversation layer

| Feature | Description | Acceptance criteria |
|---------|-------------|----------------------|
| Agent configuration | Brand voice, languages, interruption sensitivity. | Versioned config; draft vs published. |
| Intents & slots | Booking, cancel, reschedule, pricing, emergency, etc. | Intent taxonomy documented per industry pack. |
| Knowledge grounding | FAQs, policies, price ranges (not hallucinated specifics). | Source citations stored where applicable. |
| Guardrails | PII redaction, profanity, medical/legal disclaimers. | Configurable templates per vertical. |
| Human-in-the-loop | Live listen, whisper coach, takeover. | Role-gated; full audit trail. |
| AI toggle (web) | Users may **enable or disable AI** for chat per root PRD. | When off, automated paths use only scripted / deterministic flows. |

### 7.5 Web chatbot & live chat (from root PRD)

| Feature | Description | Acceptance criteria |
|---------|-------------|----------------------|
| Embeddable widget | **Fully customizable** web chat on any website. | Theming + layout tokens; preview. |
| Customization | Chat flow design, **list of services**, **custom links**, **conversation rules**, **automated responses**, **contact data collection**. | All configurable under **Web Workspace** without code deploy where possible. |
| Automated chat | Predefined and/or **AI** (OpenAI) responses; capture name, phone, service, preferred time (root examples). | Structured capture mapped to CRM/lead objects. |
| Live chat | Human-to-human: notification → **internal** or **external** agent joins. | Internal: authenticated dashboard. External: **system-generated link** + **email/SMS** notify; session expires; audit who joined. |
| AI provider | OpenAI (named in root PRD). | Key rotation, model allowlist, spend caps (product policy). |

### 7.6 Conversation management (centralized)

| Feature | Description | Acceptance criteria |
|---------|-------------|----------------------|
| Unified inbox / history | All **voice**, **web chat**, **AI chat**, **live chat** in one conversation system (root PRD). | Single `conversation` id with channel discriminator; cross-channel customer merge rules documented. |
| Conversation contents | Customer info, history, **transcripts**, **tags and status**, **interaction outcome**. | Tags filterable; status drives workflows (e.g. open → pending agent → closed). |

### 7.7 Integrations

| Feature | Description | Acceptance criteria |
|---------|-------------|----------------------|
| CRM | **Salesforce**, **HubSpot** (root PRD): leads, contacts, pipeline updates. | OAuth or API keys stored encrypted; token refresh. |
| Custom / ERP / portal | **ERP**, **websites**, **custom portals** (root PRD). | Webhooks + mapping layer; idempotent writes. |
| Automation | **Zapier** (root PRD) for workflow automation. | First-class connector or documented Zaps; failure notifications. |
| Idempotent writes | Avoid duplicate jobs on retries. | Idempotency keys on external writes. |
| Mapping layer | Field mapping UI / config JSON. | Validation errors surface to admins pre-publish. |
| Webhooks | Outbound events to tenant systems. | Signing secret, retry policy, dead-letter queue. |

### 7.8 Notifications

| Feature | Description | Acceptance criteria |
|---------|-------------|----------------------|
| Triggers (root PRD) | **New incoming chat**, **missed calls**, **new leads**, **appointment bookings**, **AI escalation to human**. | Each maps to a rule with test harness. |
| Channels | **Dashboard alerts**, **email**, **SMS**, **CRM updates** (root PRD). | Delivery status tracked per attempt. |

### 7.9 Call logging & analytics

| Feature | Description | Acceptance criteria |
|---------|-------------|----------------------|
| Transcript | Diarized text with timestamps. | Searchable; retention per plan. |
| Recording | Audio artifact with consent metadata. | Jurisdictional retention flags. |
| Summary | Structured: reason, outcome, next steps. | JSON schema versioned. |
| Disposition | Won/lost/contained/transferred/missed (extend as needed). | Reportable in BI export. |
| Dashboards | Volume, containment, booking rate, SLA. | Date filters; location breakdown. |

### 7.10 Billing & invoices (from root PRD)

| Feature | Description | Acceptance criteria |
|---------|-------------|----------------------|
| Monthly subscription | Typical **monthly billing cycle** for customers. | Plan changes prorated per policy; dunning states. |
| One-time setup | Chatbot setup, **AI training**, workflow configuration, integrations. | Line items on invoice; fulfillment checklist optional. |
| Zoho | **Billing records** pushed to **Zoho** for invoicing/accounting (root PRD). | Idempotent sync; reconciliation report for finance. |
| Partner models | WL: **commission on revenue**, monthly cycle, sub-networks. NWL: commissions/revenue share. Direct: invoices from platform. | Commission statements exportable; no double-bill across hierarchy. |
| Invoice UX | Automatic invoice generation, notifications, **partner billing notifications** (root PRD). | Email/webhook hooks; audit trail. |

### 7.11 Compliance & trust

| Feature | Description | Acceptance criteria |
|---------|-------------|----------------------|
| Consent & disclosures | Played/stored proof where required. | Linked to call record. |
| Data retention | Per tenant policy. | Automated purge jobs with audit. |
| Access logs | Who viewed PII-heavy artifacts. | Exportable for audits. |

### 7.12 Onboarding & support

| Feature | Description | Acceptance criteria |
|---------|-------------|----------------------|
| Demo request capture | Marketing funnel → CRM lead. | Spam protection; SLA for follow-up. |
| Implementation checklist | Scripts, numbers, integrations. | Progress % for CSM dashboard. |

---

## 8. User journeys (condensed)

1. **After-hours booking** — Call → AI qualifies → books slot → CRM job + SMS confirmation → dispatcher sees morning queue.  
2. **Emergency plumbing** — Call → AI triages severity → notifies on-call → optional transfer.  
3. **Price shopper** — AI handles FAQs → if stuck, **transfer** with summary.  
4. **Webchat lead** — Visitor asks availability → captures contact → creates lead in CRM.  
5. **Live chat handoff** — Visitor requests human → internal agent or **external agent via link** picks up with full transcript context.  
6. **Outbound reminder** — Campaign scheduler dials/sends reminder per **Turbo Voice** / messaging rules → CRM activity logged.

---

## 9. Non-functional requirements

| Area | Requirement |
|------|-------------|
| Availability | Voice path highly available; graceful degradation with message to caller. |
| Latency | Interactive voice within product SLO (define p95/p99 in engineering spec). |
| Security | Encryption in transit and at rest; tenant isolation; secrets management. |
| Observability | Traces per call leg; correlation IDs across integrations. |
| Scalability | Horizontal workers for media and dialog; queue-backed integration jobs. |

---

## 10. Technology stack (from root PRD)

| Layer | Vendors / tools named in root doc |
|--------|-----------------------------------|
| Voice & telephony | Twilio |
| Voice AI & orchestration | Vapi |
| LLM | OpenAI |
| Voice generation (TTS) | ElevenLabs |
| Automation & workflows | Zapier |
| Billing & accounting sync | Zoho |

---

## 11. Milestones (suggested)

| Phase | Scope |
|-------|--------|
| **MVP** | Direct tenant, inbound voice (Turbo Voice), transcripts + recordings, web chatbot (automated + optional AI), internal live chat, basic CRM webhook, notifications, conversation tags/status. |
| **v1** | Branches with per-branch welcome/validation, outbound campaigns, external live-chat links, Salesforce/HubSpot connectors, Zoho billing sync, analytics dashboards. |
| **v2** | Partner hierarchy (WL/NWL), white-label domains, commission reporting, Zapier catalog, industry packs, advanced ERP/custom portal patterns. |

---

## 12. Open questions

- How strictly is **Vapi** coupled vs. swappable orchestration behind an abstraction?  
- **Zoho** product split (Books vs. Invoice vs. Billing) and master data for tax/regions?  
- **TCPA** / consent storage requirements for outbound campaigns by region?  
- Healthcare: BAAs, PHI minimization in transcripts — product stance?  
- Legal: advertising rules by jurisdiction for “AI receptionist” copy.  
- White-label: single-tenant vs. pooled infra per **partner** for compliance.

---

## 13. Glossary

| Term | Definition |
|------|------------|
| **CSR** | Customer service representative; here often the AI persona. |
| **Containment** | Caller need resolved without human agent. |
| **Disposition** | Final classification of a conversation outcome. |
| **FSM** | Field service management software. |
| **Turbo Voice Workspace** | Named product area for all voice routing, AI voice behavior, and outbound campaign rules (root PRD). |
| **Web Workspace** | Named product area for chat flows, services, AI rules, and live-chat configuration (root PRD). |
| **Admin Workspace** | Global platform administrator configuration scope (root PRD). |
