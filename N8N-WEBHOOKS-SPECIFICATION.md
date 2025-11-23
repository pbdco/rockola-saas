# 🔌 N8N Webhooks Specification

## 📋 Overview

This document defines all N8N webhooks that Rockola will call, and all webhooks that n8n will call back to Rockola. All webhooks use API key + crypto signature for security.

---

## 🔐 Security Headers (All Webhooks)

All webhooks (both directions) must include:

```
X-API-Key: {N8N_API_KEY}
X-Signature: {HMAC-SHA256 signature}
```

**Signature Calculation:**
```typescript
import crypto from 'crypto';

function calculateSignature(body: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  return hmac.update(body).digest('hex');
}
```

**Verification:**
```typescript
function verifySignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const calculated = calculateSignature(body, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculatedSignature)
  );
}
```

---

## 📤 Rockola → n8n Webhooks (Called by Next.js)

### 1. **Create Playlist** (Playlist Mode)

**Endpoint:** `POST {N8N_WEBHOOK_URL}/create-playlist`

**When:** Automatically triggered when a venue is created with `mode: PLAYLIST`

**Request Headers:**
```
Content-Type: application/json
X-API-Key: {N8N_API_KEY}
X-Signature: {HMAC-SHA256 signature of request body}
```

**Request Body:**
```json
{
  "venueId": "uuid",
  "venueName": "The Groove Bar",
  "spotifyClientId": "51ac6e03a9694126b84402763a033249",
  "spotifyClientSecret": "96570d65d0c84d51839c1bf6c8354ad5"
}
```

**Response (Success):**
```json
{
  "success": true,
  "playlistId": "37i9dQZF1DXbITWG1ZJKYt",
  "playlistUrl": "https://open.spotify.com/playlist/37i9dQZF1DXbITWG1ZJKYt",
  "playlistName": "Rockola - The Groove Bar"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Failed to create playlist: {error message}"
}
```

**n8n Action:**
- Use provided Spotify credentials to authenticate
- Create a collaborative playlist named `"Rockola - {venueName}"`
- Make it collaborative (so venue owner can join)
- Return playlist ID and URL

**Configurable in Superadmin UI:** ✅ Yes
**Default in .env:** `N8N_WEBHOOK_CREATE_PLAYLIST_URL`

---

### 2. **Validate Rules** (Playlist Advanced / Automation Mode)

**Endpoint:** `POST {N8N_WEBHOOK_URL}/validate-rules`

**When:** When venue owner saves/updates rules in Rockola UI

**Request Headers:**
```
Content-Type: application/json
X-API-Key: {N8N_API_KEY}
X-Signature: {HMAC-SHA256 signature of request body}
```

**Request Body:**
```json
{
  "venueId": "uuid",
  "rules": [
    {
      "id": "rule-uuid-1",
      "name": "No rock after midnight",
      "description": "Not allow rock, trap, or cumbia after 11 PM",
      "type": "CONTENT",
      "enabled": true,
      "priority": 10,
      "conditions": {
        "timeRange": "23:00-03:00",
        "daysOfWeek": [1, 2, 3, 4, 5, 6, 7]
      },
      "actions": {
        "denyGenres": ["rock", "trap", "cumbia"]
      }
    },
    {
      "id": "rule-uuid-2",
      "name": "Only reggae",
      "description": "Only allow reggae music",
      "type": "CONTENT",
      "enabled": true,
      "priority": 5,
      "conditions": null,
      "actions": {
        "allowGenres": ["reggae"]
      }
    }
  ]
}
```

**Response (Success - No Conflicts):**
```json
{
  "success": true,
  "valid": true,
  "message": "Rules validated successfully"
}
```

**Response (Error - Conflicts Found):**
```json
{
  "success": true,
  "valid": false,
  "conflicts": [
    {
      "rule1": "rule-uuid-1",
      "rule2": "rule-uuid-2",
      "conflict": "Rule 'No rock after midnight' conflicts with 'Only reggae': Both rules apply to the same time period but have conflicting genre restrictions."
    }
  ],
  "suggestions": [
    "Consider disabling one rule or adjusting time ranges to avoid conflicts."
  ]
}
```

**Response (Error - Validation Failed):**
```json
{
  "success": false,
  "error": "Failed to validate rules: {error message}"
}
```

**n8n Action:**
- Send rules to AI agent (OpenAI/Claude/etc.)
- AI analyzes rules for:
  - Logical conflicts (e.g., "only reggae" + "no reggae")
  - Time-based conflicts (overlapping time ranges with conflicting actions)
  - Priority conflicts (lower priority rule overriding higher priority)
- Return validation result with conflict explanations if any

**Configurable in Superadmin UI:** ✅ Yes
**Default in .env:** `N8N_WEBHOOK_VALIDATE_RULES_URL`

---

### 3. **Add Song to Playlist** (Playlist Mode)

**Endpoint:** `POST {N8N_WEBHOOK_URL}/add-song-to-playlist`

**When:** After patron request is validated and credits are deducted

**Request Headers:**
```
Content-Type: application/json
X-API-Key: {N8N_API_KEY}
X-Signature: {HMAC-SHA256 signature of request body}
```

**Request Body:**
```json
{
  "venueId": "uuid",
  "requestId": "uuid",
  "playlistId": "37i9dQZF1DXbITWG1ZJKYt",
  "trackUri": "spotify:track:4uLU6hMCjM75X6rr3Xg3F8",
  "spotifyClientId": "51ac6e03a9694126b84402763a033249",
  "spotifyClientSecret": "96570d65d0c84d51839c1bf6c8354ad5"
}
```

**Response (Success):**
```json
{
  "success": true,
  "added": true,
  "playlistLength": 42
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Failed to add song: {error message}"
}
```

**n8n Action:**
- Authenticate with provided Spotify credentials
- Add track to playlist
- Return success confirmation

**Configurable in Superadmin UI:** ✅ Yes
**Default in .env:** `N8N_WEBHOOK_ADD_SONG_TO_PLAYLIST_URL`

---

### 4. **Search Track** (All Modes)

**Endpoint:** `POST {N8N_WEBHOOK_URL}/search-track`

**When:** When patron requests a song and we need to find it on Spotify

**Request Headers:**
```
Content-Type: application/json
X-API-Key: {N8N_API_KEY}
X-Signature: {HMAC-SHA256 signature of request body}
```

**Request Body:**
```json
{
  "venueId": "uuid",
  "requestId": "uuid",
  "trackName": "Bohemian Rhapsody",
  "artistName": "Queen",
  "spotifyClientId": "51ac6e03a9694126b84402763a033249",
  "spotifyClientSecret": "96570d65d0c84d51839c1bf6c8354ad5"
}
```

**Response (Success):**
```json
{
  "success": true,
  "track": {
    "spotifyTrackId": "4uLU6hMCjM75X6rr3Xg3F8",
    "trackUri": "spotify:track:4uLU6hMCjM75X6rr3Xg3F8",
    "trackName": "Bohemian Rhapsody",
    "artistName": "Queen",
    "albumName": "A Night At The Opera",
    "duration": 355000,
    "explicit": false,
    "previewUrl": "https://p.scdn.co/mp3-preview/..."
  }
}
```

**Response (Not Found):**
```json
{
  "success": true,
  "track": null,
  "message": "Track not found on Spotify"
}
```

**n8n Action:**
- Authenticate with Spotify API
- Search for track using Spotify Search API
- Return best match or null if not found

**Configurable in Superadmin UI:** ✅ Yes
**Default in .env:** `N8N_WEBHOOK_SEARCH_TRACK_URL`

---

### 5. **Add Song to Queue** (Automation Mode)

**Endpoint:** `POST {N8N_WEBHOOK_URL}/add-song-to-queue`

**When:** After patron request is validated and credits are deducted (Automation Mode only)

**Request Headers:**
```
Content-Type: application/json
X-API-Key: {N8N_API_KEY}
X-Signature: {HMAC-SHA256 signature of request body}
```

**Request Body:**
```json
{
  "venueId": "uuid",
  "requestId": "uuid",
  "trackUri": "spotify:track:4uLU6hMCjM75X6rr3Xg3F8",
  "deviceId": "optional-device-id",
  "spotifyAccessToken": "BQC...",
  "spotifyRefreshToken": "AQD..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "queued": true,
  "queuePosition": 3
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Failed to add to queue: {error message}"
}
```

**n8n Action:**
- Use venue owner's Spotify access token
- Add track to Spotify queue
- Optionally transfer playback to specific device
- Return queue position

**Configurable in Superadmin UI:** ✅ Yes
**Default in .env:** `N8N_WEBHOOK_ADD_SONG_TO_QUEUE_URL`

---

### 6. **Skip Current Track** (Automation Mode)

**Endpoint:** `POST {N8N_WEBHOOK_URL}/skip-track`

**When:** Auto-moderation or manual skip request

**Request Headers:**
```
Content-Type: application/json
X-API-Key: {N8N_API_KEY}
X-Signature: {HMAC-SHA256 signature of request body}
```

**Request Body:**
```json
{
  "venueId": "uuid",
  "requestId": "uuid",
  "reason": "auto_moderation" | "manual" | "rule_violation",
  "spotifyAccessToken": "BQC...",
  "spotifyRefreshToken": "AQD..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "skipped": true
}
```

**n8n Action:**
- Use venue owner's Spotify access token
- Skip to next track
- Return confirmation

**Configurable in Superadmin UI:** ✅ Yes
**Default in .env:** `N8N_WEBHOOK_SKIP_TRACK_URL`

---

## 📥 n8n → Rockola Webhooks (Called by n8n)

### 1. **Credit Purchase** (Mock Payment Flow)

**Endpoint:** `POST /api/webhooks/n8n/credit-purchase`

**When:** When patron completes mock credit purchase via n8n bot

**Request Headers:**
```
Content-Type: application/json
X-API-Key: {N8N_API_KEY}
X-Signature: {HMAC-SHA256 signature of request body}
```

**Request Body:**
```json
{
  "venueId": "uuid",
  "clientIdentifier": "541112121212",
  "platform": "whatsapp",
  "creditsAmount": 10.00,
  "purchaseId": "purchase-uuid",
  "clientName": "Pablo",
  "clientLastName": "Garcia",
  "metadata": {
    "paymentMethod": "mock",
    "quantity": 10
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "transactionId": "uuid",
  "newBalance": 15.00
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Failed to process credit purchase: {error message}"
}
```

**Rockola Action:**
- Verify webhook signature
- Find or create `VenueClient`
- Create `CreditTransaction` (type: PURCHASE)
- Update client credits balance
- Return confirmation

---

### 2. **Track Found** (After Search)

**Endpoint:** `POST /api/webhooks/n8n/track-found`

**When:** After n8n successfully finds a track (optional callback)

**Request Headers:**
```
Content-Type: application/json
X-API-Key: {N8N_API_KEY}
X-Signature: {HMAC-SHA256 signature of request body}
```

**Request Body:**
```json
{
  "requestId": "uuid",
  "spotifyTrackId": "4uLU6hMCjM75X6rr3Xg3F8",
  "trackUri": "spotify:track:4uLU6hMCjM75X6rr3Xg3F8",
  "trackName": "Bohemian Rhapsody",
  "artistName": "Queen",
  "albumName": "A Night At The Opera"
}
```

**Response:**
```json
{
  "success": true
}
```

**Rockola Action:**
- Update `SongRequest` with track details
- Continue with validation/credit check

---

### 3. **Queue Position Update** (Automation Mode)

**Endpoint:** `POST /api/webhooks/n8n/queue-updated`

**When:** When song is added to queue and position is known

**Request Headers:**
```
Content-Type: application/json
X-API-Key: {N8N_API_KEY}
X-Signature: {HMAC-SHA256 signature of request body}
```

**Request Body:**
```json
{
  "requestId": "uuid",
  "queuePosition": 3,
  "status": "QUEUED"
}
```

**Response:**
```json
{
  "success": true
}
```

**Rockola Action:**
- Update `SongRequest` with queue position and status

---

### 4. **Playback Status Update** (Automation Mode)

**Endpoint:** `POST /api/webhooks/n8n/playback-updated`

**When:** When track starts playing, finishes, or is skipped

**Request Headers:**
```
Content-Type: application/json
X-API-Key: {N8N_API_KEY}
X-Signature: {HMAC-SHA256 signature of request body}
```

**Request Body:**
```json
{
  "requestId": "uuid",
  "status": "PLAYING" | "PLAYED" | "SKIPPED",
  "playedAt": "2025-11-23T20:30:00Z"
}
```

**Response:**
```json
{
  "success": true
}
```

**Rockola Action:**
- Update `SongRequest` status and `playedAt` timestamp

---

## 🔧 Environment Variables

### **Default Webhook URLs (in .env):**

```bash
# Default Spotify credentials for Playlist Mode
SPOTIFY_CLIENT_ID=51ac6e03a9694126b84402763a033249
SPOTIFY_CLIENT_SECRET=96570d65d0c84d51839c1bf6c8354ad5

# N8N Base URL (if all webhooks are on same n8n instance)
N8N_WEBHOOK_URL=https://n8n.acrofase.org/webhook

# Individual webhook URLs (can override base URL)
N8N_WEBHOOK_CREATE_PLAYLIST_URL=${N8N_WEBHOOK_URL}/create-playlist
N8N_WEBHOOK_VALIDATE_RULES_URL=${N8N_WEBHOOK_URL}/validate-rules
N8N_WEBHOOK_ADD_SONG_TO_PLAYLIST_URL=${N8N_WEBHOOK_URL}/add-song-to-playlist
N8N_WEBHOOK_SEARCH_TRACK_URL=${N8N_WEBHOOK_URL}/search-track
N8N_WEBHOOK_ADD_SONG_TO_QUEUE_URL=${N8N_WEBHOOK_URL}/add-song-to-queue
N8N_WEBHOOK_SKIP_TRACK_URL=${N8N_WEBHOOK_URL}/skip-track

# Security
N8N_API_KEY=your-api-key-here
N8N_WEBHOOK_SECRET=your-shared-secret-for-signing
```

---

## 🎛️ Superadmin Configuration UI

Superadmins can configure:
1. **Default Spotify credentials** (used for Playlist Mode)
2. **Per-venue Spotify credentials** (override for specific venues)
3. **Individual webhook URLs** (override defaults from .env)
4. **N8N API key and secret** (for webhook security)

**UI Location:** Superadmin Dashboard → Settings → N8N Configuration

---

## 📝 Implementation Notes

1. **Webhook URLs are configurable** - Defaults in `.env`, but superadmin can override
2. **All webhooks use same security** - API key + HMAC-SHA256 signature
3. **Error handling** - All webhooks should handle timeouts and retries
4. **Logging** - Log all webhook calls for debugging
5. **Rate limiting** - n8n should handle rate limits gracefully

---

## ✅ Summary

**Rockola → n8n Webhooks (6 total):**
1. Create Playlist
2. Validate Rules
3. Add Song to Playlist
4. Search Track
5. Add Song to Queue
6. Skip Track

**n8n → Rockola Webhooks (4 total):**
1. Credit Purchase
2. Track Found
3. Queue Position Update
4. Playback Status Update

**Total: 10 webhooks**
