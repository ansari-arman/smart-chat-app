# ZyraTalk Platform — Database Schema (Logical)

**Document version:** 1.1  
**Last updated:** 2026-05-04  
**Scope:** Logical relational schema aligned with the root PRD [`Zyra-Talk-V1 Doc by MS.md`](../Zyra-Talk-V1%20Doc%20by%20MS.md) (workspaces, partners, live chat, outbound campaigns, billing/Zoho) and [ZyraTalk marketing site](https://www.zyratalk.com/). Physical naming (snake_case), types, and indexes should be adapted to the chosen RDBMS (PostgreSQL recommended).

**Conventions**

- Primary keys: `id` UUID unless noted.  
- Timestamps: `timestamptz` — `created_at`, `updated_at`; soft delete: `deleted_at`.  
- Multi-tenant: almost all business tables include `organization_id` FK → `organizations`.  
- **Meta column schema** in each table: `Column | Type | Nullable | Default | PK/FK | Notes`.

---

## 1. Entity overview (table list)

| # | Table | Purpose |
|---|--------|---------|
| 1 | `partners` | Reseller / WL or NWL partner entity; commission defaults. |
| 2 | `organizations` | Tenant / company (direct or under a `partner`). |
| 3 | `organization_locations` | Branches: hours, voice/chat overrides, welcome/validation. |
| 4 | `platform_settings` | Singleton or key-value **Admin Workspace**–level config. |
| 5 | `workspace_configs` | **Turbo Voice** vs **Web Workspace** JSON per organization. |
| 6 | `users` | Human users (staff, admins, agents). |
| 7 | `organization_memberships` | User ↔ org membership + role. |
| 8 | `roles` | Role definitions (seeded + custom optional). |
| 9 | `phone_numbers` | E.164 numbers mapped to org/location. |
| 10 | `customers` | End callers / chat visitors (PII). |
| 11 | `conversations` | Voice, web AI chat, live chat session header. |
| 12 | `conversation_participants` | Links customers, users, AI to a conversation. |
| 13 | `conversation_turns` | STT/LLM/scripted turns for replay and search. |
| 14 | `conversation_guest_invites` | Magic-link access for **external** live-chat agents. |
| 15 | `recordings` | Audio file metadata. |
| 16 | `summaries` | AI-generated structured summary per conversation. |
| 17 | `dispositions` | Lookup + per-conversation disposition. |
| 18 | `tags` | Tenant-defined labels for conversations. |
| 19 | `conversation_tags` | M2M: conversation ↔ tag. |
| 20 | `leads` | Captured lead rows (from chat/voice); CRM sync. |
| 21 | `appointments` | Booked/rescheduled/canceled jobs or meetings. |
| 22 | `outbound_campaigns` | Marketing / reminder / follow-up dialer campaigns. |
| 23 | `outbound_campaign_recipients` | Scheduled targets + consent + send state. |
| 24 | `notification_rules` | Declarative routing (e.g. new chat → dashboard). |
| 25 | `notification_events` | Outbound notification attempts. |
| 26 | `integrations` | CRM, ERP, Zapier, calendar, custom connectors. |
| 27 | `integration_credentials` | OAuth tokens / API keys (encrypted payload reference). |
| 28 | `integration_mappings` | Field / object mapping JSON. |
| 29 | `external_sync_jobs` | Async integration work, idempotency, retries. |
| 30 | `webhook_endpoints` | Tenant-configured inbound HTTP endpoints (optional). |
| 31 | `webhook_deliveries` | Outbound signed deliveries to tenant URLs. |
| 32 | `ai_agent_configs` | Versioned AI persona, voice, policies (OpenAI/ElevenLabs/Vapi refs). |
| 33 | `knowledge_documents` | KB sources (FAQ, policy docs). |
| 34 | `knowledge_chunks` | Chunked text for retrieval (with embedding ref optional). |
| 35 | `subscriptions` | Monthly recurring billing per organization. |
| 36 | `one_time_charges` | Setup fees (chatbot, AI training, workflows, integrations). |
| 37 | `invoices` | Invoice headers synced to **Zoho** (external id). |
| 38 | `partner_commission_accruals` | Optional accrual lines for WL/NWL revenue share. |
| 39 | `audit_logs` | Security and compliance-sensitive actions. |
| 40 | `demo_leads` | Marketing “request demo” captures. |

---

## 2. Table definitions & column schema

### 2.1 `partners`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| legal_name | text | NO | | | |
| partner_kind | text | NO | | | `white_label`, `non_white_label`. |
| default_commission_percent | numeric(5,2) | YES | | | WL/NWL commission baseline. |
| billing_metadata | jsonb | NO | `{}` | | Payout tier, tax ids, etc. |
| anchor_organization_id | uuid | YES | | FK → organizations | Partner’s own admin org, if modeled. |
| created_at | timestamptz | NO | now() | | |
| updated_at | timestamptz | NO | now() | | |
| deleted_at | timestamptz | YES | | | |

---

### 2.2 `organizations`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| partner_id | uuid | YES | | FK → partners | Set when org is sold/managed via partner. |
| name | text | NO | | | Legal or DBA. |
| slug | text | NO | | UNIQUE | URL-safe identifier. |
| timezone | text | NO | `America/Phoenix` | | IANA TZ. |
| industry | text | YES | | | e.g. `home_services`, `legal`, `healthcare`. |
| status | text | NO | `active` | | `active`, `suspended`, `churned`. |
| white_label_enabled | boolean | NO | false | | WL branding for this org’s customer-facing surfaces. |
| branding | jsonb | NO | `{}` | | Domain, logo URLs, theme tokens (WL). |
| settings | jsonb | NO | `{}` | | Feature flags, retention overrides. |
| created_at | timestamptz | NO | now() | | |
| updated_at | timestamptz | NO | now() | | |
| deleted_at | timestamptz | YES | | | Soft delete. |

---

### 2.3 `organization_locations`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| organization_id | uuid | NO | | FK → organizations | |
| name | text | NO | | | Branch name. |
| address_line1 | text | YES | | | |
| city | text | YES | | | |
| region | text | YES | | | State/province. |
| postal_code | text | YES | | | |
| country | text | YES | | | ISO-3166-1 alpha-2. |
| service_area_geojson | jsonb | YES | | | Polygon/multipolygon. |
| business_hours | jsonb | NO | | | Weekly schedule JSON. |
| default_welcome_message | text | YES | | | Branch conversation openers (root PRD). |
| validation_rules | jsonb | YES | | | Branch-level validation (root PRD). |
| created_at | timestamptz | NO | now() | | |
| updated_at | timestamptz | NO | now() | | |
| deleted_at | timestamptz | YES | | | |

---

### 2.4 `platform_settings`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | smallint | NO | 1 | PK | Singleton row `id = 1` for **Admin Workspace** globals. |
| settings | jsonb | NO | `{}` | | Feature flags, default templates, compliance defaults. |
| updated_at | timestamptz | NO | now() | | |

---

### 2.5 `workspace_configs`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| organization_id | uuid | NO | | FK → organizations | |
| workspace_kind | text | NO | | | `turbo_voice`, `web`. |
| status | text | NO | `draft` | | `draft`, `published`. |
| config | jsonb | NO | `{}` | | Flows, routing, AI on/off, services, links (root PRD). |
| published_version | int | NO | 0 | | Bump on publish. |
| published_at | timestamptz | YES | | | |
| created_at | timestamptz | NO | now() | | |
| updated_at | timestamptz | NO | now() | | |
| | | | | UNIQUE(organization_id, workspace_kind) | One row per kind per org. |

---

### 2.6 `users`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| email | citext | NO | | UNIQUE | Use citext or lower-indexed text. |
| email_verified_at | timestamptz | YES | | | |
| password_hash | text | YES | | | Null if SSO-only (future). |
| full_name | text | YES | | | |
| last_login_at | timestamptz | YES | | | |
| created_at | timestamptz | NO | now() | | |
| updated_at | timestamptz | NO | now() | | |
| deleted_at | timestamptz | YES | | | |

---

### 2.7 `organization_memberships`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| organization_id | uuid | NO | | FK → organizations | |
| user_id | uuid | NO | | FK → users | |
| role_id | uuid | NO | | FK → roles | |
| status | text | NO | `active` | | `active`, `invited`, `revoked`. |
| created_at | timestamptz | NO | now() | | |
| updated_at | timestamptz | NO | now() | | |
| | | | | UNIQUE(organization_id, user_id) | One membership per pair. |

---

### 2.8 `roles`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| organization_id | uuid | YES | | FK → organizations | Null = system role. |
| key | text | NO | | | e.g. `owner`, `admin`. |
| label | text | NO | | | Display name. |
| permissions | jsonb | NO | `[]` | | List of permission strings. |
| created_at | timestamptz | NO | now() | | |
| updated_at | timestamptz | NO | now() | | |

---

### 2.9 `phone_numbers`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| organization_id | uuid | NO | | FK → organizations | |
| location_id | uuid | YES | | FK → organization_locations | |
| e164 | text | NO | | UNIQUE | +1… |
| provider | text | NO | | | Carrier / CPaaS id. |
| provider_resource_id | text | YES | | | External id. |
| status | text | NO | `active` | | |
| created_at | timestamptz | NO | now() | | |
| updated_at | timestamptz | NO | now() | | |

---

### 2.10 `customers`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| organization_id | uuid | NO | | FK → organizations | |
| display_name | text | YES | | | |
| primary_phone_e164 | text | YES | | | Index for dedupe. |
| primary_email | citext | YES | | | |
| address_json | jsonb | YES | | | Service location. |
| marketing_consent | boolean | NO | false | | |
| tcpa_consent_at | timestamptz | YES | | | When outbound applies. |
| external_ids | jsonb | NO | `{}` | | CRM ids map. |
| created_at | timestamptz | NO | now() | | |
| updated_at | timestamptz | NO | now() | | |
| deleted_at | timestamptz | YES | | | |

---

### 2.11 `conversations`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| organization_id | uuid | NO | | FK → organizations | |
| location_id | uuid | YES | | FK → organization_locations | |
| channel | text | NO | | | `voice`, `webchat` (AI widget), `ai_chat`, `live_chat`, `sms`. |
| direction | text | NO | | | `inbound`, `outbound`. |
| status | text | NO | `open` | | e.g. `open`, `pending_agent`, `closed` (live chat / voice). |
| interaction_outcome | text | YES | | | Short outcome label; detailed JSON may live in `summaries`. |
| disposition_id | uuid | YES | | FK → dispositions | Set at wrap-up (missed, contained, transferred, …). |
| started_at | timestamptz | NO | now() | | |
| ended_at | timestamptz | YES | | | |
| phone_number_id | uuid | YES | | FK → phone_numbers | Inbound DID. |
| external_call_id | text | YES | | | CPaaS / **Vapi** / Twilio correlation id. |
| outbound_campaign_recipient_id | uuid | YES | | FK → outbound_campaign_recipients | When call is campaign-driven. |
| ai_agent_config_id | uuid | YES | | FK → ai_agent_configs | Config used. |
| language | text | YES | | | BCP 47. |
| metadata | jsonb | NO | `{}` | | UTM, widget version, missed-call reason, etc. |
| created_at | timestamptz | NO | now() | | |
| updated_at | timestamptz | NO | now() | | |

---

### 2.12 `conversation_participants`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| conversation_id | uuid | NO | | FK → conversations | |
| participant_type | text | NO | | | `customer`, `user`, `ai`, `system`. |
| customer_id | uuid | YES | | FK → customers | |
| user_id | uuid | YES | | FK → users | |
| joined_at | timestamptz | NO | now() | | |
| left_at | timestamptz | YES | | | |

---

### 2.13 `conversation_turns`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| conversation_id | uuid | NO | | FK → conversations | |
| sequence | int | NO | | | Monotonic per conversation. |
| speaker | text | NO | | | `caller`, `agent`, `user`, `system`. |
| text | text | NO | | | Redacted where policy applies. |
| started_at_ms | bigint | YES | | | Offset from conversation start. |
| ended_at_ms | bigint | YES | | | |
| raw_stt_json | jsonb | YES | | | Optional vendor payload. |
| llm_model | text | YES | | | |
| created_at | timestamptz | NO | now() | | |

---

### 2.14 `recordings`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| conversation_id | uuid | NO | | FK → conversations | UNIQUE preferred 1:1. |
| storage_uri | text | NO | | | s3://… or internal path. |
| duration_seconds | int | YES | | | |
| consent_obtained | boolean | NO | false | | Jurisdiction-dependent. |
| mime_type | text | NO | | | |
| checksum_sha256 | text | YES | | | Integrity. |
| created_at | timestamptz | NO | now() | | |

---

### 2.15 `summaries`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| conversation_id | uuid | NO | | FK → conversations | |
| schema_version | text | NO | `v1` | | For JSON contract. |
| body | jsonb | NO | | | reason, outcome, entities, next_steps. |
| model | text | YES | | | |
| created_at | timestamptz | NO | now() | | |

---

### 2.16 `dispositions`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| organization_id | uuid | YES | | FK → organizations | Null = global enum. |
| key | text | NO | | | `contained`, `transferred`, … |
| label | text | NO | | | |
| created_at | timestamptz | NO | now() | | |

Disposition is linked from **`conversations.disposition_id`**. Suggested `key` values include `contained`, `transferred`, `missed`, `new_lead`, `appointment_booked`, `escalated_to_human`.

---

### 2.17 `appointments`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| organization_id | uuid | NO | | FK → organizations | |
| location_id | uuid | YES | | FK → organization_locations | |
| customer_id | uuid | NO | | FK → customers | |
| conversation_id | uuid | YES | | FK → conversations | Originating convo. |
| status | text | NO | `scheduled` | | `scheduled`, `completed`, `canceled`. |
| starts_at | timestamptz | NO | | | |
| ends_at | timestamptz | NO | | | |
| service_type | text | YES | | | |
| notes | text | YES | | | |
| external_job_id | text | YES | | | CRM/FSM id. |
| idempotency_key | text | YES | | UNIQUE per org | Prevents dup writes. |
| created_at | timestamptz | NO | now() | | |
| updated_at | timestamptz | NO | now() | | |

---

### 2.18 `notification_rules`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| organization_id | uuid | NO | | FK → organizations | |
| name | text | NO | | | |
| priority | int | NO | 100 | | Lower runs first. |
| condition_json | jsonb | NO | | | e.g. intent, after_hours. |
| actions_json | jsonb | NO | | | channels, templates, targets. |
| enabled | boolean | NO | true | | |
| created_at | timestamptz | NO | now() | | |
| updated_at | timestamptz | NO | now() | | |

---

### 2.19 `notification_events`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| organization_id | uuid | NO | | FK → organizations | |
| conversation_id | uuid | YES | | FK → conversations | |
| notification_rule_id | uuid | YES | | FK → notification_rules | |
| channel | text | NO | | | `sms`, `email`, `voice`. |
| target | text | NO | | | E.164 or email. |
| payload_json | jsonb | NO | | | Rendered body metadata. |
| status | text | NO | `queued` | | `queued`, `sent`, `failed`. |
| provider_message_id | text | YES | | | |
| error | text | YES | | | |
| created_at | timestamptz | NO | now() | | |
| sent_at | timestamptz | YES | | | |

---

### 2.20 `integrations`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| organization_id | uuid | NO | | FK → organizations | |
| type | text | NO | | | `salesforce`, `hubspot`, `zapier`, `zoho_billing`, `erp`, `custom_portal`, `jobber`, … |
| status | text | NO | `disconnected` | | |
| config | jsonb | NO | `{}` | | Non-secret settings. |
| created_at | timestamptz | NO | now() | | |
| updated_at | timestamptz | NO | now() | | |

---

### 2.21 `integration_credentials`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| integration_id | uuid | NO | | FK → integrations | |
| kind | text | NO | | | `oauth_refresh`, `api_key`. |
| secret_ref | text | NO | | | KMS/Vault reference, not plaintext. |
| expires_at | timestamptz | YES | | | OAuth. |
| created_at | timestamptz | NO | now() | | |
| updated_at | timestamptz | NO | now() | | |

---

### 2.22 `integration_mappings`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| integration_id | uuid | NO | | FK → integrations | |
| object_type | text | NO | | | `appointment`, `customer`, … |
| mapping_json | jsonb | NO | | | Field map + transforms. |
| created_at | timestamptz | NO | now() | | |
| updated_at | timestamptz | NO | now() | | |

---

### 2.23 `external_sync_jobs`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| organization_id | uuid | NO | | FK → organizations | |
| integration_id | uuid | NO | | FK → integrations | |
| operation | text | NO | | | `create_job`, `upsert_contact`. |
| payload_json | jsonb | NO | | | |
| idempotency_key | text | NO | | | UNIQUE per integration. |
| status | text | NO | `pending` | | `pending`, `processing`, `succeeded`, `failed`. |
| attempt_count | int | NO | 0 | | |
| last_error | text | YES | | | |
| created_at | timestamptz | NO | now() | | |
| updated_at | timestamptz | NO | now() | | |

---

### 2.24 `webhook_endpoints`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| organization_id | uuid | NO | | FK → organizations | |
| url | text | NO | | | HTTPS. |
| secret_ref | text | NO | | | Signing secret storage ref. |
| event_types | jsonb | NO | `[]` | | Subscriptions. |
| enabled | boolean | NO | true | | |
| created_at | timestamptz | NO | now() | | |
| updated_at | timestamptz | NO | now() | | |

---

### 2.25 `webhook_deliveries`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| webhook_endpoint_id | uuid | NO | | FK → webhook_endpoints | |
| event_type | text | NO | | | |
| payload_json | jsonb | NO | | | |
| status | text | NO | `pending` | | |
| attempt_count | int | NO | 0 | | |
| last_http_status | int | YES | | | |
| last_error | text | YES | | | |
| created_at | timestamptz | NO | now() | | |
| delivered_at | timestamptz | YES | | | |

---

### 2.26 `ai_agent_configs`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| organization_id | uuid | NO | | FK → organizations | |
| location_id | uuid | YES | | FK → organization_locations | |
| name | text | NO | | | |
| version | int | NO | 1 | | |
| status | text | NO | `draft` | | `draft`, `published`, `archived`. |
| voice_provider | text | YES | | | |
| voice_id | text | YES | | | |
| system_prompt | text | YES | | | |
| tool_allowlist | jsonb | NO | `[]` | | |
| safety_json | jsonb | NO | `{}` | | |
| published_at | timestamptz | YES | | | |
| created_at | timestamptz | NO | now() | | |
| updated_at | timestamptz | NO | now() | | |

---

### 2.27 `knowledge_documents`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| organization_id | uuid | NO | | FK → organizations | |
| title | text | NO | | | |
| source_uri | text | YES | | | Upload path or URL. |
| mime_type | text | YES | | | |
| status | text | NO | `processing` | | `processing`, `ready`, `failed`. |
| created_at | timestamptz | NO | now() | | |
| updated_at | timestamptz | NO | now() | | |

---

### 2.28 `knowledge_chunks`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| knowledge_document_id | uuid | NO | | FK → knowledge_documents | |
| chunk_index | int | NO | | | |
| content | text | NO | | | |
| embedding_ref | text | YES | | | Vector store pointer if external. |
| metadata | jsonb | NO | `{}` | | page, section. |
| created_at | timestamptz | NO | now() | | |

---

### 2.29 `audit_logs`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| organization_id | uuid | YES | | FK → organizations | |
| actor_user_id | uuid | YES | | FK → users | |
| action | text | NO | | | `read_transcript`, `update_role`, … |
| resource_type | text | NO | | | |
| resource_id | uuid | YES | | | |
| ip_address | inet | YES | | | |
| user_agent | text | YES | | | |
| metadata | jsonb | NO | `{}` | | |
| created_at | timestamptz | NO | now() | | |

---

### 2.30 `demo_leads`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| email | citext | NO | | | |
| full_name | text | YES | | | |
| company | text | YES | | | |
| phone_e164 | text | YES | | | |
| source | text | YES | | | `website`, `partner`. |
| utm | jsonb | YES | | | |
| created_at | timestamptz | NO | now() | | |

---

### 2.31 `conversation_guest_invites`

Magic-link access for **external live-chat agents** (not platform users). Root PRD: system-generated link + email/SMS.

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| conversation_id | uuid | NO | | FK → conversations | |
| token_hash | text | NO | | UNIQUE | Store hash only, never raw token. |
| invited_email | citext | YES | | | |
| invited_phone_e164 | text | YES | | | |
| expires_at | timestamptz | NO | | | |
| used_at | timestamptz | YES | | | First successful join. |
| created_by_user_id | uuid | YES | | FK → users | Staff who issued invite. |
| created_at | timestamptz | NO | now() | | |

---

### 2.32 `tags`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| organization_id | uuid | NO | | FK → organizations | |
| name | text | NO | | | |
| color | text | YES | | | UI hex. |
| created_at | timestamptz | NO | now() | | |
| | | | | UNIQUE(organization_id, name) | |

---

### 2.33 `conversation_tags`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| conversation_id | uuid | NO | | FK → conversations | |
| tag_id | uuid | NO | | FK → tags | |
| created_at | timestamptz | NO | now() | | |
| | | | | PK (conversation_id, tag_id) | |

---

### 2.34 `leads`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| organization_id | uuid | NO | | FK → organizations | |
| conversation_id | uuid | YES | | FK → conversations | Source session. |
| customer_id | uuid | YES | | FK → customers | |
| status | text | NO | `new` | | `new`, `contacted`, `qualified`, `lost`, `won`. |
| payload | jsonb | NO | `{}` | | Name, phone, service, preferred time, etc. |
| external_lead_id | text | YES | | | CRM id post-sync. |
| created_at | timestamptz | NO | now() | | |
| updated_at | timestamptz | NO | now() | | |

---

### 2.35 `outbound_campaigns`

Root PRD: marketing calls, appointment reminders, follow-ups, service notifications — configured under **Turbo Voice Workspace** (store fine detail in `workspace_configs` or reference by id here).

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| organization_id | uuid | NO | | FK → organizations | |
| location_id | uuid | YES | | FK → organization_locations | |
| name | text | NO | | | |
| campaign_kind | text | NO | | | `marketing`, `reminder`, `follow_up`, `service_notice`. |
| status | text | NO | `draft` | | `draft`, `scheduled`, `running`, `paused`, `completed`. |
| schedule_cron | text | YES | | | Or use one-off `run_at` in metadata. |
| workspace_config_version | int | YES | | | Optional pointer to published Turbo Voice config. |
| metadata | jsonb | NO | `{}` | | Dial window, max attempts, script id. |
| created_at | timestamptz | NO | now() | | |
| updated_at | timestamptz | NO | now() | | |

---

### 2.36 `outbound_campaign_recipients`

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| campaign_id | uuid | NO | | FK → outbound_campaigns | |
| customer_id | uuid | YES | | FK → customers | |
| to_phone_e164 | text | NO | | | |
| consent_recorded | boolean | NO | false | | TCPA / marketing consent. |
| scheduled_at | timestamptz | YES | | | |
| status | text | NO | `pending` | | `pending`, `dialing`, `completed`, `failed`, `skipped`. |
| last_attempt_at | timestamptz | YES | | | |
| attempt_count | int | NO | 0 | | |
| created_at | timestamptz | NO | now() | | |
| updated_at | timestamptz | NO | now() | | |

---

### 2.37 `subscriptions`

Monthly billing cycle (root PRD). Amounts are indicative; finance may remain canonical in Zoho.

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| organization_id | uuid | NO | | FK → organizations | |
| plan_key | text | YES | | | Product catalog key. |
| amount_cents | bigint | NO | | | |
| currency | char(3) | NO | `USD` | | ISO 4217. |
| billing_interval | text | NO | `month` | | `month`, `year`. |
| status | text | NO | `active` | | `active`, `past_due`, `canceled`. |
| current_period_start | timestamptz | YES | | | |
| current_period_end | timestamptz | YES | | | |
| zoho_subscription_id | text | YES | | | If mirrored in Zoho. |
| created_at | timestamptz | NO | now() | | |
| updated_at | timestamptz | NO | now() | | |

---

### 2.38 `one_time_charges`

Setup: chatbot, AI training, workflows, integrations (root PRD).

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| organization_id | uuid | NO | | FK → organizations | |
| description | text | NO | | | |
| amount_cents | bigint | NO | | | |
| currency | char(3) | NO | `USD` | | |
| status | text | NO | `pending` | | `pending`, `invoiced`, `void`. |
| invoice_id | uuid | YES | | FK → invoices | |
| created_at | timestamptz | NO | now() | | |
| updated_at | timestamptz | NO | now() | | |

---

### 2.39 `invoices`

Billing records pushed to **Zoho** (root PRD).

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| organization_id | uuid | NO | | FK → organizations | |
| partner_id | uuid | YES | | FK → partners | When invoice is partner-related. |
| zoho_invoice_id | text | YES | | UNIQUE | External id from Zoho sync. |
| amount_cents | bigint | NO | | | |
| currency | char(3) | NO | `USD` | | |
| status | text | NO | `draft` | | `draft`, `issued`, `paid`, `void`. |
| issued_at | timestamptz | YES | | | |
| paid_at | timestamptz | YES | | | |
| sync_status | text | NO | `pending` | | `pending`, `synced`, `failed`. |
| last_sync_error | text | YES | | | |
| metadata | jsonb | NO | `{}` | | Line-item snapshot optional. |
| created_at | timestamptz | NO | now() | | |
| updated_at | timestamptz | NO | now() | | |

---

### 2.40 `partner_commission_accruals`

Optional ledger for WL/NWL commission on revenue (root PRD).

| Column | Type | Nullable | Default | PK/FK | Notes |
|--------|------|----------|---------|-------|--------|
| id | uuid | NO | gen_random_uuid() | PK | |
| partner_id | uuid | NO | | FK → partners | |
| organization_id | uuid | NO | | FK → organizations | End-customer org generating revenue. |
| period_start | date | NO | | | |
| period_end | date | NO | | | |
| revenue_cents | bigint | NO | | | Basis amount. |
| commission_percent | numeric(5,2) | NO | | | Snapshot at accrual time. |
| commission_cents | bigint | NO | | | |
| status | text | NO | `accrued` | | `accrued`, `approved`, `paid`. |
| invoice_id | uuid | YES | | FK → invoices | Partner payout invoice link. |
| created_at | timestamptz | NO | now() | | |

---

## 3. Suggested indexes (non-exhaustive)

| Table | Index | Rationale |
|-------|--------|-----------|
| `customers` | `(organization_id, primary_phone_e164)` | Dedupe / lookup. |
| `conversations` | `(organization_id, started_at DESC)` | Dashboards. |
| `conversation_turns` | `(conversation_id, sequence)` | Replay. |
| `external_sync_jobs` | `(status, created_at)` | Worker polling. |
| `notification_events` | `(organization_id, created_at DESC)` | Support views. |
| `audit_logs` | `(organization_id, created_at DESC)` | Compliance export. |
| `workspace_configs` | `(organization_id, workspace_kind)` | Already UNIQUE; index for listing. |
| `leads` | `(organization_id, status, created_at DESC)` | CRM pipeline views. |
| `outbound_campaign_recipients` | `(campaign_id, status, scheduled_at)` | Dialer workers. |
| `invoices` | `(organization_id, issued_at DESC)`, `(zoho_invoice_id)` | Billing + Zoho reconciliation. |
| `partner_commission_accruals` | `(partner_id, period_start, period_end)` | Partner statements. |
| `conversation_guest_invites` | `(token_hash)` | Magic-link lookup. |

---

## 4. ER relationships (textual)

- `partners` 1—* `organizations` (optional `partner_id`), 1—* `partner_commission_accruals`, optional 1—1 `anchor_organization_id` back to `organizations`.  
- `organizations` 1—* `organization_locations`, `workspace_configs`, `phone_numbers`, `users` (via memberships), `customers`, `conversations`, `subscriptions`, `invoices`, …  
- `conversations` 1—* `conversation_turns`, optional 1—1 `recordings`, *—1 `summaries`, *—* `tags` via `conversation_tags`, 1—* `conversation_guest_invites`, optional FK from `outbound_campaign_recipients`.  
- `customers` 1—* `appointments`, `leads`, *—* `conversations` via `conversation_participants`.  
- `outbound_campaigns` 1—* `outbound_campaign_recipients` 1—* `conversations` (outbound legs).  
- `integrations` 1—* `integration_credentials`, `integration_mappings`, `external_sync_jobs`.

---

## 5. Extensions & notes

- **PostgreSQL:** enable `citext` for email columns; consider `pgcrypto` for UUID.  
- **PII:** encrypt sensitive columns or use column-level encryption; restrict `customers` / `conversation_turns` via RLS.  
- **Analytics rollups:** optional materialized views or warehouse (BigQuery/Snowflake) fed by CDC — not listed as core OLTP tables here.
