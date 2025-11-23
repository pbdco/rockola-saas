# 🎵 Rockola SaaS — Complete Project Specification

> **AI-powered Spotify automation platform for venues with crowd-driven feedback, rule-based orchestration, and WhatsApp interaction layer.**

---

## 📋 Executive Summary

**Rockola** is a multi-tenant SaaS platform that transforms venues (bars, restaurants, clubs, gyms, hotels) into intelligent, self-moderating music environments. It combines:

1. **Spotify Automation** — time-based, rule-driven playlist and playback control.
2. **WhatsApp AI Bot** — conversational interface for patrons to request songs (paid) or react to music (free).
3. **Crowd Feedback Loop** — real-time sentiment analysis that adapts playback automatically.
4. **n8n Orchestration** — backend automation engine handling Spotify API, payments, rules, and workflows.

### Core Value Proposition

- **For Venue Owners:** Automate music management, monetize song requests, gain crowd analytics.
- **For Patrons:** Influence music through requests or reactions via simple WhatsApp chat.
- **For Platform:** Subscription + transaction revenue, scalable across venue types.

---

## 🧠 Conceptual Evolution

Rockola evolves through four stages:

| Stage | Definition | Value |
|-------|------------|-------|
| **Stage 1** | Rockola = "Monetized Jukebox" | Patrons pay to queue songs via WhatsApp. |
| **Stage 2** | Rockola = "Smart Music Manager" | Rules + AI per venue, human-like request feedback. |
| **Stage 3** | Rockola = "SpotifyOps Platform" | Full automation of Spotify environments per venue, rule-based intelligent orchestration. |
| **Stage 4** | Rockola = "Intelligent Venue Experience" | Context-driven ambient control (music + lighting + timing). |

Once you add **rule-based Spotify automation per venue (time-slot driven)**, Rockola stops being "just jukebox SaaS" and becomes a **Spotify orchestration and automation layer** for businesses.

Each venue instance becomes an **autonomous Spotify agent** — programmed through natural language rules and automated by backend (AI + n8n).

Example rules defined by owner in dashboard:

| Time Slot     | Ruleset                                               |
|---------------|-------------------------------------------------------|
| 6:00–8:00 PM  | "Play chill jazz playlist; no explicit content."      |
| 8:00–11:00 PM | "Enable patron requests; allow pop, reggaeton."       |
| 11:00–3:00 AM | "Disallow slow songs > 6 minutes; priority to paid requests." |
| 3:00–5:00 AM  | "Play closing playlist automatically."                |

---

## 🎛 Operating Modes

Rockola supports three conceptual operating modes per venue:

### 🟢 Queue Mode (Open Requests)

- Patrons can request **any song from Spotify** via WhatsApp.
- AI validates against current rules (genre, explicit, time, blacklist).
- Payment is required per request.
- Feedback emojis (👍👎💩🔥) influence future recommendations and auto-moderation behavior.

### 🔵 Playlist Mode (Curated)

- Venue owner selects a **specific Spotify playlist**.
- Patrons can **only request songs from that playlist**.
- Songs are synced/cached and validated against the playlist.
- Cooldowns prevent immediate repeats.
- Payment is required per request.

### 🟣 Automation Mode (Rule-Driven Spotify Agent)

> The system automatically enforces Spotify playback behavior per time slot, optionally mixing automation + user requests.

**Core behavior:**

- Time-based triggers drive Spotify actions automatically.
- AI interprets the "mood" or "rule" in human language and maps it to real actions.
- Patrons still interact through WhatsApp, but bot behavior is constrained by the active rule context.

**Example outcomes:**

- 18:00 → auto switch to "Venue Speakers" device, start chill playlist.
- 20:00 → enable requests; bot starts accepting song requests.
- 23:00 → disallow explicit songs; auto-skip those.
- 03:00 → disable requests, play closing playlist.

---

## 🧩 System Architecture (High-Level)

```
┌─────────────────────────────────────────────────────────────┐
│                    PATRON INTERFACE                         │
│                   (WhatsApp Bot + AI)                       │
│  - Request songs (paid)                                     │
│  - React with emojis (free feedback)                        │
│  - Ask about rules/queue                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│              AI AGENT + n8n ORCHESTRATION                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Intent     │  │    Rules     │  │   Sentiment  │     │
│  │ Classifier   │  │   Engine     │  │   Analyzer   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Payment    │  │   Spotify    │  │  Analytics   │     │
│  │   Handler    │  │   Control    │  │   Logger     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                          ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL INTEGRATIONS                      │
│  - Spotify API (OAuth2, playback control)                   │
│  - Stripe / Mercado Pago (payments)                         │
│  - PostgreSQL (data persistence)                            │
│  - WhatsApp Business API                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                  VENUE OWNER DASHBOARD                      │
│  - Configure Spotify connection                             │
│  - Define time-based rules (natural language)               │
│  - Set pricing and payment methods                          │
│  - View live sentiment + analytics                          │
│  - Monitor queue and playback                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧱 Core Modules

### 1. Venue Management System

**Purpose:** Multi-tenant venue configuration and control.

**Key features:**

- Venue CRUD (create, list, update, delete).
- Spotify OAuth2 connection per venue.
- Operating mode selection (`queue`, `playlist`, `automation`).
- QR code generation for patron WhatsApp entry.
- Active/inactive toggle.

**Data model (conceptual):**

```json
{
  "venue_id": "UUID",
  "owner_id": "UUID",
  "name": "The Groove Bar",
  "address": "123 Main St",
  "spotify_user_id": "spotify_user_123",
  "spotify_credentials": {
    "access_token": "encrypted-string",
    "refresh_token": "encrypted-string",
    "expires_at": "2025-11-17T01:00:00Z"
  },
  "mode": "automation",
  "pricing": {
    "enabled": true,
    "price_per_song": 2.99,
    "currency": "USD"
  },
  "qr_code_url": "https://.../qr.png",
  "is_active": true,
  "created_at": "2025-11-17T00:00:00Z"
}
```

**Note:** `mode` can be `"queue"`, `"playlist"`, or `"automation"`.

---

### 2. Rule Engine (Time-Based Automation)

**Purpose:** Define and execute venue-specific music policies (SpotifyOps).

Each venue can define **rules** in natural language via dashboard UI.  
AI converts these phrases into structured JSON rules stored in the DB.

**Example natural phrases:**

- "From 1 to 3 AM, only play 80s rock."
- "Switch to chill playlist at 6 PM every weekday."
- "Mute explicit songs after midnight."
- "Disable song requests after 3 AM."
- "Charge $5 per song after midnight."

**Internal rule representation:**

```json
{
  "rule_id": "UUID",
  "venue_id": "UUID",
  "name": "No explicit after 1 AM",
  "type": "content",
  "enabled": true,
  "conditions": {
    "time_range": "01:00-03:00",
    "days_of_week": [5, 6, 7],
    "date_range": null
  },
  "actions": [
    {
      "action_type": "set_allow_explicit",
      "parameters": { "value": false }
    }
  ],
  "priority": 10,
  "created_at": "2025-11-17T00:00:00Z"
}
```

**Note:** `type` can be `"content"`, `"playlist"`, `"genre"`, `"pricing"`, or `"requests"`.

**Other rule examples:**

```json
{
  "name": "Switch playlist during dinner",
  "type": "playlist",
  "conditions": { "time_range": "18:00-21:00" },
  "actions": [
    {
      "action_type": "switch_playlist",
      "parameters": {
        "spotify_playlist_id": "37i9dQZF1DXbITWG1ZJKYt"
      }
    }
  ]
}
```

```json
{
  "name": "Enable patron requests at 8 PM",
  "type": "requests",
  "conditions": { "time_range": "20:00-23:00" },
  "actions": [
    {
      "action_type": "set_accept_requests",
      "parameters": { "value": true }
    }
  ]
}
```

```json
{
  "name": "Premium pricing after midnight",
  "type": "pricing",
  "conditions": { "time_range": "00:00-03:00" },
  "actions": [
    {
      "action_type": "set_price_per_song",
      "parameters": { "price": 4.99, "currency": "USD" }
    }
  ]
}
```

---

### 3. n8n Scheduler Workflow for Rules

**Purpose:** Periodically apply rules and update Spotify & AI context.

**Pseudoflow:**

```
[Schedule Trigger: every 5 minutes]
  ↓
[Fetch all active venues]
  ↓
For each venue:
  [Determine current time slot & day]
  [Fetch all enabled rules for this venue]
  [Filter rules whose conditions match now]
  [Compare to previous active rules (cache)]
  If new rules activated or old rules deactivated:
      - Apply actions:
          * switch playlist
          * change pricing
          * enable/disable requests
          * set explicit/genre constraints
      - Update current context in DB
      - Optionally notify owner or log event
```

**Context stored for quick access:**

```json
{
  "venue_id": "UUID",
  "current_context": {
    "allow_explicit": false,
    "allowed_genres": ["rock", "jazz"],
    "accept_requests": true,
    "price_per_song": 3.50,
    "active_playlist_id": "spotify_playlist_id_here"
  },
  "updated_at": "2025-11-17T02:00:00Z"
}
```

AI uses this context when responding to patrons.

---

### 4. WhatsApp Bot + AI Agent

**Purpose:** Conversational entry point for patrons.

Patrons interact via WhatsApp; messages are sent to your backend or n8n, passed to an AI model with the current venue context.

**Key intents:**

```json
{
  "intent": "song_request | feedback_reaction | query_rules | query_queue | cancel_request | general_chat",
  "entities": {
    "song_name": "string",
    "artist_name": "string",
    "spotify_link": "string",
    "emoji": "string",
    "sentiment": 0.8
  },
  "confidence": 0.95
}
```

**Possible intent values:**
- `"song_request"`
- `"feedback_reaction"`
- `"query_rules"`
- `"query_queue"`
- `"cancel_request"`
- `"general_chat"`

**Song request flow (Queue Mode / Automation Mode):**

1. User: "Play Bohemian Rhapsody."
2. AI: `intent = "song_request"`, `entities = {"song_name": "Bohemian Rhapsody"}`
3. Backend/n8n:
   - Get `current_context` for venue.
   - Check if requests are enabled.
   - Check if genre/explicit allowed (once track is identified).
4. If allowed:
   - Generate payment link via Stripe/Mercado Pago.
   - Bot: "Found it 🎵 Bohemian Rhapsody - Queen. It costs $2.99. Pay here: [link]."
5. After payment webhook:
   - Add to Spotify queue.
   - Bot: "✅ Your song is queued! You're #3 in line."

**Feedback flow:**

1. New track starts.
2. Bot to all active patrons:
   - "Now playing 🎵 Levitating - Dua Lipa. How's the vibe? 👍 👎 💩 🔥"
3. User: "💩"
4. AI: `intent = "feedback_reaction"`, `entities = { "emoji": "💩", "sentiment": -2 }`
5. n8n logs reaction → sentiment engine updates track score.

---

### 5. Sentiment Analysis & Auto-Moderation

**Purpose:** Generic auto-DJ behavior: skip bad songs, amplify good vibes.

**Reaction logging:**

```json
{
  "reaction_id": "UUID",
  "venue_id": "UUID",
  "patron_id": "hashed-id",
  "spotify_track_id": "track123",
  "reaction_type": "poop",
  "sentiment_score": -2.0,
  "created_at": "2025-11-17T02:10:00Z"
}
```

**Possible reaction_type values:**
- `"thumbs_up"` (sentiment_score: +1)
- `"fire"` (sentiment_score: +2)
- `"thumbs_down"` (sentiment_score: -1)
- `"poop"` (sentiment_score: -2)

**Aggregation (per track, rolling window):**

```json
{
  "track_id": "track123",
  "venue_id": "UUID",
  "total_reactions": 15,
  "avg_sentiment": -0.6,
  "distribution": {
    "fire": 2,
    "thumbs_up": 3,
    "thumbs_down": 5,
    "poop": 5
  }
}
```

**Auto-moderation rules:**

- If `avg_sentiment < -0.5` and `total_reactions >= MIN_REACTIONS`:
  - Skip track via `POST /me/player/next`.
  - Log event: "Auto-skip due to negative feedback."
- If 2 consecutive tracks have `avg_sentiment < -0.3`:
  - Switch to safer playlist.
- If `avg_sentiment > 0.8`:
  - Use Spotify `recommendations` endpoint to enqueue similar tracks.

**n8n workflow (Sentiment Monitor):**

```
[Schedule Trigger: every 30 seconds]
  ↓
[Get current track from Spotify API per venue]
  ↓
[Query reactions for this track in last X minutes]
  ↓
[Compute avg_sentiment + total_reactions]
  ↓
[Determine action based on thresholds]
  ↓
[Execute Spotify action (skip/queue recommended)]
  ↓
[Update analytics & logs]
```

---

### 6. Payment System

**Purpose:** Monetize song requests (not feedback).

- **Feedback (reactions) are always free.**
- **Song requests are pay-per-song** (when configured by venue).

**Payment flow:**

1. Song request is validated by rules.
2. n8n creates Stripe/Mercado Pago Checkout Session.
3. Bot sends payment URL to user.
4. Patron pays → gateway calls webhook.
5. n8n verifies and marks the song request as `"paid"`.
6. n8n adds track to Spotify queue.
7. Bot confirms queue position.

**Revenue split example:**

```json
{
  "total_amount": 2.99,
  "venue_revenue": 2.39,
  "platform_fee": 0.45,
  "processing_fee": 0.15
}
```

**Breakdown:**
- Venue revenue: 80%
- Platform fee: 15%
- Processing fee: 5% (Stripe)

**Venue-level pricing configuration:**

```json
{
  "pricing_enabled": true,
  "price_per_song": 2.99,
  "currency": "USD"
}
```

---

### 7. Spotify Integration

**Required OAuth2 Scopes:**

```javascript
const SPOTIFY_SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',    // Required to add tracks to public playlists
  'playlist-modify-private'    // Required to add tracks to private playlists
];
```

**Key REST API calls:**

| Operation | Endpoint | Purpose |
|-----------|----------|---------|
| Add to queue | `POST /me/player/queue?uri={track_uri}` | Queue requested song |
| Get playback | `GET /me/player` | Monitor current track |
| Skip track | `POST /me/player/next` | Auto-moderation skip |
| Search track | `GET /search?q={query}&type=track&limit=20` | Find tracks (Queue Mode) |
| Get playlist | `GET /playlists/{id}/tracks` | Sync playlist (Playlist Mode) |

**Token handling:**

- Access token (1-hour lifetime) stored per venue.
- Refresh token stored securely.
- n8n scheduled workflow refreshes tokens before expiry and updates DB.

---

## 🗄 Core Database Schema (Simplified)

### `users`

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### `venues`

```sql
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  spotify_user_id VARCHAR(255),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  mode VARCHAR(50) NOT NULL DEFAULT 'queue',
  spotify_playlist_id VARCHAR(255),
  pricing_enabled BOOLEAN DEFAULT false,
  price_per_song DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  qr_code_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_venues_owner ON venues(owner_id);
CREATE INDEX idx_venues_spotify_user ON venues(spotify_user_id);
```

**Note:** `mode` values: `'queue'`, `'playlist'`, `'automation'`

---

### `venue_rules`

```sql
CREATE TABLE venue_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_venue_rules_venue ON venue_rules(venue_id);
CREATE INDEX idx_venue_rules_type ON venue_rules(type);
CREATE INDEX idx_venue_rules_enabled ON venue_rules(enabled);
```

**Note:** `type` values: `'content'`, `'playlist'`, `'genre'`, `'pricing'`, `'requests'`

---

### `venue_context`

```sql
CREATE TABLE venue_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE UNIQUE,
  current_context JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_venue_context_venue ON venue_context(venue_id);
```

**Purpose:** Stores the currently active rule context per venue for fast AI access.

---

### `song_requests`

```sql
CREATE TABLE song_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  patron_id VARCHAR(255),
  spotify_track_id VARCHAR(255) NOT NULL,
  track_name VARCHAR(255) NOT NULL,
  artist_name VARCHAR(255) NOT NULL,
  album_name VARCHAR(255),
  track_uri VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  price_paid DECIMAL(10,2),
  payment_id VARCHAR(255),
  queue_position INTEGER,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  queued_at TIMESTAMP,
  played_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_song_requests_venue ON song_requests(venue_id);
CREATE INDEX idx_song_requests_status ON song_requests(status);
CREATE INDEX idx_song_requests_payment ON song_requests(payment_id);
```

**Note:** `status` values: `'pending'`, `'paid'`, `'queued'`, `'playing'`, `'played'`, `'skipped'`, `'failed'`

---

### `reactions`

```sql
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  patron_id VARCHAR(255),
  spotify_track_id VARCHAR(255) NOT NULL,
  reaction_type VARCHAR(50) NOT NULL,
  sentiment_score FLOAT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reactions_venue ON reactions(venue_id);
CREATE INDEX idx_reactions_track ON reactions(spotify_track_id);
CREATE INDEX idx_reactions_created ON reactions(created_at);
```

**Note:** `reaction_type` values: `'thumbs_up'`, `'fire'`, `'thumbs_down'`, `'poop'`

---

### `playlist_tracks`

```sql
CREATE TABLE playlist_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  spotify_track_id VARCHAR(255) NOT NULL,
  track_name VARCHAR(255) NOT NULL,
  artist_name VARCHAR(255) NOT NULL,
  album_name VARCHAR(255),
  track_uri VARCHAR(255) NOT NULL,
  last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (venue_id, spotify_track_id)
);

CREATE INDEX idx_playlist_tracks_venue ON playlist_tracks(venue_id);
CREATE INDEX idx_playlist_tracks_track ON playlist_tracks(spotify_track_id);
```

**Purpose:** Cache of tracks from venue's selected Spotify playlist (Playlist Mode only).

---

### `payments`

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES song_requests(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'pending',
  venue_revenue DECIMAL(10,2),
  platform_fee DECIMAL(10,2),
  processing_fee DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_request ON payments(request_id);
CREATE INDEX idx_payments_venue ON payments(venue_id);
CREATE INDEX idx_payments_stripe ON payments(stripe_payment_intent_id);
```

**Note:** `status` values: `'pending'`, `'succeeded'`, `'failed'`, `'refunded'`

---

## 🤖 n8n Workflow Summary

### Main workflows:

1. **Spotify Token Refresh**  
   - **Trigger:** schedule (every 50 min)  
   - **Action:** refresh tokens for all venues nearing expiry.

2. **Process Song Request**  
   - **Trigger:** webhook from bot/AI (intent: `"song_request"`)  
   - **Actions:** rule check → search track → create payment session.

3. **Payment Confirmation**  
   - **Trigger:** Stripe/Mercado Pago webhook  
   - **Actions:** verify payment → update `song_requests` → queue song.

4. **Monitor Playback**  
   - **Trigger:** schedule (every 30 sec)  
   - **Actions:** fetch current track → update `"playing"` / `"played"` statuses.

5. **Capture Feedback Reaction**  
   - **Trigger:** webhook from bot/AI (intent: `"feedback_reaction"`)  
   - **Actions:** store reaction record → (optionally) recalc sentiment.

6. **Sentiment Auto-Moderation**  
   - **Trigger:** schedule (every 30 sec)  
   - **Actions:** aggregate sentiment → decide skip/continue/recommend.

7. **Rule Activation**  
   - **Trigger:** schedule (every 5 min)  
   - **Actions:** check conditions → apply actions → update venue context.

8. **Sync Playlist Tracks** (Playlist Mode)  
   - **Trigger:** schedule (every 6 hours) or manual  
   - **Actions:** fetch playlist tracks → upsert into `playlist_tracks`.

---

## 💰 Business Model

### Venue Plans

**Basic Plan** ($29/month)
- Manual or semi-automatic queue.
- Queue Mode & Playlist Mode.
- Simple analytics.

**Pro Plan** ($79/month)
- Includes **Automation Mode**.
- Auto-moderation based on feedback.
- Time-based rule engine.
- Advanced analytics (crowd sentiment, energy graph).

### Patron Payments

- Pay-per-song request (Stripe/Mercado Pago).
- Reactions/feedback are always free.

### Revenue Split

```json
{
  "total_amount": 2.99,
  "venue_revenue": 2.39,
  "platform_fee": 0.45,
  "processing_fee": 0.15
}
```

- Venue: 80%
- Platform: 15%
- Payment processor: 5%

---

## 📐 Abstract Logic Flow (High-Level)

```
PATRON ACTION (WhatsApp message)
  ↓
AI AGENT
  - Classify intent
  - Extract entities (song, emoji, etc.)
  - Inject venue context (rules, pricing, constraints)
  ↓
RULE ENGINE
  - Apply applicable rules (time, genre, explicit, pricing, requests)
  ↓
DECISION:
  - If song_request allowed → start payment flow
  - If song_request blocked → explain restriction
  - If feedback_reaction → sentiment update
  - If query → respond using context (allowed genres, queue, etc.)
  ↓
SPOTIFY CONTROL
  - Add track to queue
  - Skip track
  - Switch playlist
  ↓
FEEDBACK LOOP
  - Reactions influence auto-moderation
  ↓
ANALYTICS
  - Log all requests, reactions, sentiment, revenue
```

---

## ✅ MVP Build Phases (Suggestion)

### Phase 1 — Core Jukebox

- [ ] Venue creation + Spotify OAuth.
- [ ] Basic WhatsApp bot integration.
- [ ] Song request → payment → queue.
- [ ] Queue Mode.
- [ ] Minimal admin dashboard.

### Phase 2 — Rule-Based Automation

- [ ] Rule editor (structured JSON first, AI later).
- [ ] Automation Mode execution via n8n.
- [ ] Playlist Mode.
- [ ] Context-aware AI responses.

### Phase 3 — Feedback & Auto-Moderation

- [ ] Reactions collection + sentiment scoring.
- [ ] Auto-skip and auto-recommendation logic.
- [ ] Live sentiment & energy dashboards.

### Phase 4 — Scaling & Polish

- [ ] Multi-venue analytics.
- [ ] Admin/super-admin tools.
- [ ] Robust error handling & logging.

---

## �️ Implementation Plan (MVP → Advanced)

The roadmap below mirrors the build phases but adds deliverables, dependencies, and how to test each step so progress stays incremental and verifiable.

### Phase 0 — Foundation & Environment

**Goals**
1. Configure `.env` secrets for Spotify, Stripe (or Mercado Pago), WhatsApp sandbox, and Postgres.
2. Ensure Prisma migrations and seed scripts run cleanly in Docker and on the host.
3. Document baseline QA commands (e.g., `docker compose up`, `npm run dev`, `npm run test`).

**Testing**
- Run `docker compose up -d` and verify `app` + `db` containers stay healthy.
- Hit `http://localhost:4002` and attempt login with seeded credentials.

### Phase 1 — Monetized Jukebox (Stage 1)

**Goals**
1. Extend Prisma schema with `venues`, `song_requests`, and `payments` (basic fields from the data model section).
2. Build venue CRUD UI (list/create/edit) within the starter dashboard and wire team owners to their venues.
3. Implement Spotify OAuth connection flow storing encrypted tokens.
4. Create REST endpoints (or Next.js API routes) to accept song requests (simulating WhatsApp payloads) and store them as `pending`.
5. Integrate Stripe Checkout to generate payment URLs and mark requests as `paid` via webhook.

**Testing**
- Run `npx prisma migrate dev` to apply new schema, then `npx prisma studio` to inspect records.
- Manual UI test: create venue, connect Spotify using sandbox credentials, submit mock request via `curl` to `/api/song-requests`, check DB row.
- Trigger payment flow in Stripe test mode and ensure webhook updates request status.

### Phase 2 — Queue & Playlist Modes (Stage 2)

**Goals**
1. Queue Mode: after payment confirmation, search Spotify for requested track and queue it via API; provide dashboard view of pending/queued/played songs.
2. Playlist Mode: allow owner to select a playlist, sync tracks into `playlist_tracks`, and restrict requests to that set (with cooldown checks).
3. Add admin tooling to reorder/skip requests manually.

**Testing**
- Provide script `scripts/mock-whatsapp-request.ts` to simulate requests and payments.
- UI verification: queue table updates in real time; playlist selector enforces validation (attempt disallowed track → see error).

### Phase 3 — Rule Engine & Automation Mode (Stage 3)

**Goals**
1. Build rule builder UI (structured form first) persisting JSON `conditions` and `actions`.
2. Implement scheduled worker (Next.js cron route or separate service) that evaluates rules every few minutes, writes results into `venue_context`, and toggles request flags, playlists, pricing, etc.
3. Expose current context in dashboard and via API so WhatsApp bot can fetch it.

**Testing**
- Unit tests for rule evaluator (input rules/time → expected context snapshot).
- Manual flow: define “No explicit after midnight” rule, run scheduler, verify context updates and requests become blocked in UI/API.

### Phase 4 — WhatsApp Bot + AI Agent (Stage 3/4 bridge)

**Goals**
1. Wire WhatsApp Business / Twilio sandbox webhook into Next.js API route.
2. Integrate LLM (OpenAI/Anthropic) for intent detection + entity extraction, seeded with venue context.
3. Build conversation flows for song requests, queue queries, and reactions; send payment links directly in chat.

**Testing**
- Use WhatsApp sandbox number to send “Play <song>” → observe logs, payment link response, and DB entry.
- Simulate reaction emojis and ensure they persist to `reactions` table.

### Phase 5 — Sentiment & Auto-Moderation (Stage 4 — Final Phase)

**Goals**
1. Implement emoji reaction capture and sentiment aggregation that monitors reactions per track and triggers Spotify skip/recommend actions when thresholds hit.
2. Add dashboard charts for average sentiment, reaction counts, revenue over time.
3. Introduce configurable thresholds per venue (e.g., auto-skip if avg sentiment < -0.5 with ≥10 reactions).

**Testing**
- Seed reactions via utility script, run job, confirm skip events logged and track state updates.
- Verify analytics charts render expected aggregates using seeded data.

### Phase 6 — Polish & Scale

**Goals**
1. Natural-language rule authoring via AI (convert text to structured JSON automatically).
2. Subscription billing tiers (Basic vs Pro) plus usage-based reporting.
3. Enhanced observability (Sentry dashboards, audit logs) and deployment automation.

**Testing**
- Define NLP rule via UI and verify JSON translation matches expectation.
- Execute e2e “happy path” regression: new venue setup → connect Spotify → accept request → auto-moderation triggered.

---

## � Technical Stack Recommendation

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15 + React 18 + Tailwind/DaisyUI |
| **Backend API** | Next.js API routes / Edge functions (Node 20) |
| **Auth** | NextAuth.js with Prisma adapter |
| **Database/ORM** | PostgreSQL 16 + Prisma ORM |
| **Automation** | n8n (self-hosted or cloud) |
| **AI/NLP** | OpenAI GPT-4 or Anthropic Claude (via API) |
| **Messaging** | WhatsApp Business API or Twilio |
| **Payments** | Stripe (primary) / Mercado Pago (alt) |
| **Hosting** | AWS/GCP/Railway/Render |

---

## 📝 Key Takeaways

1. **Rockola = SpotifyOps for Venues**  
   It's not just a jukebox — it's a full automation and orchestration layer for Spotify in physical spaces.

2. **Three Operating Modes**  
   - **Queue Mode:** open requests from full Spotify catalog.
   - **Playlist Mode:** curated, restricted to a specific playlist.
   - **Automation Mode:** time-based rules drive everything automatically.

3. **Dual Economy**  
   - **Paid:** song requests (patron pays per song).
   - **Free:** feedback reactions (crowd sentiment drives auto-moderation).

4. **AI + n8n Core**  
   - AI handles natural language understanding and rule conversion.
   - n8n orchestrates all backend workflows (Spotify, payments, rules, sentiment).

5. **Social Feedback Loop**  
   - Patrons react with emojis.
   - System aggregates sentiment.
   - Auto-moderation skips bad songs, amplifies good vibes.

6. **Rule Engine**  
   - Venue owners define rules in natural language.
   - AI converts to structured JSON.
   - n8n applies rules based on time/context.

---

This markdown file defines the **abstract logic, architecture, data model, and workflows** needed to start implementing Rockola. It's structured so an AI coding assistant can work module-by-module (API, DB, n8n flows, UI) from this spec.

---

**End of Document**