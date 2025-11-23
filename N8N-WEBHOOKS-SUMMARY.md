# 🔌 N8N Webhooks - Quick Reference

## 📤 Rockola → n8n (6 webhooks)

### 1. **Create Playlist**
- **URL:** `POST {N8N_WEBHOOK_URL}/create-playlist`
- **When:** Venue created with Playlist Mode
- **Action:** Create collaborative Spotify playlist
- **Response:** `{ success, playlistId, playlistUrl, playlistName }`

### 2. **Validate Rules**
- **URL:** `POST {N8N_WEBHOOK_URL}/validate-rules`
- **When:** Venue owner saves rules in UI
- **Action:** Send rules to AI agent, check for conflicts
- **Response:** `{ success, valid, conflicts[], suggestions[] }`

### 3. **Add Song to Playlist**
- **URL:** `POST {N8N_WEBHOOK_URL}/add-song-to-playlist`
- **When:** After song request validated and credits deducted
- **Action:** Add track to venue's playlist
- **Response:** `{ success, added, playlistLength }`

### 4. **Search Track**
- **URL:** `POST {N8N_WEBHOOK_URL}/search-track`
- **When:** Patron requests a song
- **Action:** Search Spotify for track
- **Response:** `{ success, track: { spotifyTrackId, trackUri, ... } }`

### 5. **Add Song to Queue** (Automation Mode)
- **URL:** `POST {N8N_WEBHOOK_URL}/add-song-to-queue`
- **When:** After song request validated (Automation Mode)
- **Action:** Add track to Spotify queue
- **Response:** `{ success, queued, queuePosition }`

### 6. **Skip Track** (Automation Mode)
- **URL:** `POST {N8N_WEBHOOK_URL}/skip-track`
- **When:** Auto-moderation or manual skip
- **Action:** Skip current track
- **Response:** `{ success, skipped }`

---

## 📥 n8n → Rockola (4 webhooks)

### 1. **Credit Purchase**
- **URL:** `POST /api/webhooks/n8n/credit-purchase`
- **When:** Patron completes mock credit purchase
- **Action:** Add credits to VenueClient
- **Body:** `{ venueId, clientIdentifier, platform, creditsAmount, ... }`

### 2. **Track Found**
- **URL:** `POST /api/webhooks/n8n/track-found`
- **When:** After track search (optional callback)
- **Action:** Update SongRequest with track details
- **Body:** `{ requestId, spotifyTrackId, trackUri, ... }`

### 3. **Queue Position Update**
- **URL:** `POST /api/webhooks/n8n/queue-updated`
- **When:** Song added to queue, position known
- **Action:** Update SongRequest queue position
- **Body:** `{ requestId, queuePosition, status }`

### 4. **Playback Status Update**
- **URL:** `POST /api/webhooks/n8n/playback-updated`
- **When:** Track starts/finishes/skipped
- **Action:** Update SongRequest status
- **Body:** `{ requestId, status, playedAt }`

---

## 🔐 Security (All Webhooks)

**Headers Required:**
```
X-API-Key: {N8N_API_KEY}
X-Signature: {HMAC-SHA256 signature}
```

**Signature:** HMAC-SHA256 of request body using `N8N_WEBHOOK_SECRET`

---

## 📝 Full Details

See `N8N-WEBHOOKS-SPECIFICATION.md` for complete request/response schemas.
