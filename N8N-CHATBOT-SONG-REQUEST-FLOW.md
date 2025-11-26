# 🤖 N8N Chatbot Song Request Flow

## 📋 Overview

This document defines the complete workflow for handling song requests via n8n chatbot (WhatsApp/Telegram). The chatbot will interact with Rockola API to validate requests, check credits, and create song requests.

---

## 🔄 Complete Flow Diagram

```
[User sends message via WhatsApp/Telegram]
         ↓
[Chatbot receives message]
         ↓
[Extract intent: "song_request"]
         ↓
[Extract: trackName, artistName, venueId, patronIdentifier, platform]
         ↓
[1. Get Venue Details]
         ↓
[2. Check Client Credits]
         ↓
[3. Check Rate Limit]
         ↓
[4. Get Active Rules (if Advanced Mode)]
         ↓
[5. Search Track on Spotify (via n8n webhook)]
         ↓
[6. Validate Song Request (credits + rules + rate limits)]
         ↓
[7. Create Song Request (deducts credits)]
         ↓
[8. Add Song to Playlist (via n8n webhook)]
         ↓
[9. Respond to User with Success/Error]
```

---

## 📥 Input: Chatbot Message

**Message Format:**
- **WhatsApp/Telegram message** from patron
- **Intent:** `song_request` (detected by AI/pattern matching)
- **Extracted Data:**
  ```json
  {
    "trackName": "Bohemian Rhapsody",
    "artistName": "Queen",
    "venueId": "550e8400-e29b-41d4-a716-446655440000",
    "patronIdentifier": "541112121212",  // Phone number or Telegram ID
    "platform": "whatsapp" | "telegram",
    "clientName": "Pablo",  // Optional, extracted from conversation
    "clientLastName": "Garcia"  // Optional
  }
  ```

**How to Extract:**
- Use AI agent (OpenAI/Claude) to extract structured data from natural language
- Or use pattern matching: "play [song] by [artist]"
- Venue ID can be:
  - Stored in conversation context (user selected venue)
  - Extracted from message (e.g., "play song at venue-name")
  - Default venue for user

---

## 🔌 API Endpoints (n8n → Rockola)

All endpoints require **API Key Authentication**:
```
Authorization: Bearer {API_KEY}
```

### **Step 1: Get Venue Details**

**Endpoint:** `GET /api/venues/[venueId]`

**Purpose:** Get venue configuration (mode, pricing, playlist info, active status)

**Request:**
```http
GET /api/venues/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {API_KEY}
```

**Response:**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "The Groove Bar",
    "mode": "PLAYLIST",
    "spotifyPlaylistId": "37i9dQZF1DXbITWG1ZJKYt",
    "spotifyPlaylistUrl": "https://open.spotify.com/playlist/37i9dQZF1DXbITWG1ZJKYt",
    "pricingEnabled": true,
    "pricePerSong": 5.00,
    "currency": "USD",
    "creditPerSong": 5.00,
    "isActive": true
  }
}
```

**Validation:**
- ✅ Check `isActive === true` (if false, respond: "Venue is not active")
- ✅ Check `mode === "PLAYLIST"` (if not, respond: "Song requests only available for Playlist Mode")
- ✅ Check `spotifyPlaylistId` exists (if not, respond: "Playlist not ready yet. Please wait a moment.")

**Error Handling:**
- `404`: Venue not found → "Venue not found"
- `401`: Invalid API key → Log error, don't respond to user
- `403`: No access → "You don't have access to this venue"

---

### **Step 2: Check Client Credits**

**Endpoint:** `GET /api/venues/[venueId]/clients/by-identifier`

**Purpose:** Check if client exists and has enough credits

**Request:**
```http
GET /api/venues/550e8400-e29b-41d4-a716-446655440000/clients/by-identifier?identifier=541112121212&platform=whatsapp
Authorization: Bearer {API_KEY}
```

**Response (Client Exists):**
```json
{
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "venueId": "550e8400-e29b-41d4-a716-446655440000",
    "identifier": "541112121212",
    "platform": "whatsapp",
    "name": "Pablo",
    "lastName": "Garcia",
    "credits": 15.50,
    "totalSpent": 25.00,
    "totalRequests": 5
  }
}
```

**Response (Client Not Found - New User):**
```json
{
  "error": {
    "message": "Client not found"
  }
}
```

**Logic:**
- If client not found → Create new client with `defaultCredits` (from venue config)
- If `venue.pricingEnabled === false` → Credits not required, skip credit check
- If `venue.creditPerSong === 0` → Free requests, skip credit check
- If `client.credits < venue.creditPerSong` → **STOP FLOW**, respond: "Insufficient credits. Current balance: {credits}, Required: {creditPerSong}"

**Error Handling:**
- `404`: Client not found → Create new client (see logic above)
- `401`: Invalid API key → Log error

---

### **Step 3: Check Rate Limit**

**Endpoint:** `GET /api/venues/[venueId]/clients/by-identifier/rate-limit`

**Purpose:** Check if client exceeded rate limits

**Request:**
```http
GET /api/venues/550e8400-e29b-41d4-a716-446655440000/clients/by-identifier/rate-limit?identifier=541112121212&platform=whatsapp
Authorization: Bearer {API_KEY}
```

**Response (Within Limit):**
```json
{
  "data": {
    "withinLimit": true,
    "requestsInWindow": 5,
    "maxRequests": 10,
    "windowMinutes": 60,
    "resetAt": "2025-11-23T19:30:00Z"
  }
}
```

**Response (Exceeded):**
```json
{
  "data": {
    "withinLimit": false,
    "requestsInWindow": 12,
    "maxRequests": 10,
    "windowMinutes": 60,
    "resetAt": "2025-11-23T19:30:00Z",
    "waitMinutes": 15
  }
}
```

**Logic:**
- If `withinLimit === false` → **STOP FLOW**, respond: "Rate limit exceeded. You've made {requestsInWindow} requests in the last {windowMinutes} minutes. Maximum allowed: {maxRequests}. Please wait {waitMinutes} minutes before requesting again."

**Error Handling:**
- `404`: Client not found → Treat as new user, within limit
- `401`: Invalid API key → Log error

---

### **Step 4: Get Active Rules (Optional - Playlist Advanced Mode)**

**Endpoint:** `GET /api/venues/[venueId]/rules?enabled=true`

**Purpose:** Get active rules for validation (only if venue has rules configured)

**Request:**
```http
GET /api/venues/550e8400-e29b-41d4-a716-446655440000/rules?enabled=true
Authorization: Bearer {API_KEY}
```

**Response:**
```json
{
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440001",
      "name": "No rock after midnight",
      "type": "CONTENT",
      "enabled": true,
      "conditions": {
        "timeRange": "23:00-03:00",
        "daysOfWeek": [1, 2, 3, 4, 5, 6, 7]
      },
      "actions": {
        "denyGenres": ["rock", "trap", "cumbia"]
      }
    }
  ]
}
```

**Logic:**
- If `data.length === 0` → No rules, skip rule validation
- If rules exist → Store for validation after track search

**Error Handling:**
- `401`: Invalid API key → Log error
- Empty array is valid (no rules configured)

---

### **Step 5: Search Track on Spotify**

**Endpoint:** `POST {N8N_WEBHOOK_URL}/search-track` (Rockola → n8n)

**Purpose:** Find track on Spotify using track name and artist

**This is called by Rockola API, not directly by chatbot!**

**Note:** The chatbot will call `POST /api/venues/[venueId]/song-requests` which internally calls this webhook.

**But for reference, the webhook payload is:**
```json
{
  "venueId": "550e8400-e29b-41d4-a716-446655440000",
  "requestId": "req_1234567890_abc123",
  "trackName": "Bohemian Rhapsody",
  "artistName": "Queen",
  "spotifyClientId": "51ac6e03a9694126b84402763a033249",
  "spotifyClientSecret": "96570d65d0c84d51839c1bf6c8354ad5"
}
```

**Response:**
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

---

### **Step 6: Validate Song Request (Optional - Can Skip if Already Validated)**

**Endpoint:** `POST /api/venues/[venueId]/song-requests/validate`

**Purpose:** Comprehensive validation (credits + rules + rate limits)

**Request:**
```http
POST /api/venues/550e8400-e29b-41d4-a716-446655440000/song-requests/validate
Authorization: Bearer {API_KEY}
Content-Type: application/json
```

**Request Body:**
```json
{
  "clientIdentifier": "541112121212",
  "platform": "whatsapp",
  "trackName": "Bohemian Rhapsody",
  "artistName": "Queen",
  "spotifyTrackId": "4uLU6hMCjM75X6rr3Xg3F8",
  "trackUri": "spotify:track:4uLU6hMCjM75X6rr3Xg3F8",
  "genre": "rock",
  "explicit": false,
  "duration": 355000
}
```

**Response (Valid):**
```json
{
  "data": {
    "valid": true,
    "allowed": true,
    "clientCredits": 15.50,
    "requiredCredits": 5.00,
    "sufficientCredits": true,
    "rateLimitOk": true,
    "rulesPassed": true,
    "reasons": []
  }
}
```

**Response (Invalid):**
```json
{
  "data": {
    "valid": false,
    "allowed": false,
    "clientCredits": 2.50,
    "requiredCredits": 5.00,
    "sufficientCredits": false,
    "rateLimitOk": true,
    "rulesPassed": true,
    "reasons": [
      "Insufficient credits. Current balance: 2.50, Required: 5.00"
    ]
  }
}
```

**Logic:**
- If `valid === false` → **STOP FLOW**, respond with error message from `reasons` array
- If `valid === true` → Continue to create song request

**Note:** This step is optional if you've already validated credits and rate limits in steps 2-3. However, it's useful for rule validation after track search.

---

### **Step 7: Create Song Request**

**Endpoint:** `POST /api/venues/[venueId]/song-requests`

**Purpose:** Create song request and deduct credits

**Request:**
```http
POST /api/venues/550e8400-e29b-41d4-a716-446655440000/song-requests
Authorization: Bearer {API_KEY}
Content-Type: application/json
```

**Request Body:**
```json
{
  "trackName": "Bohemian Rhapsody",
  "artistName": "Queen",
  "patronIdentifier": "541112121212"
}
```

**Response (Success):**
```json
{
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440001",
    "trackName": "Bohemian Rhapsody",
    "artistName": "Queen",
    "status": "QUEUED",
    "queuePosition": 3,
    "playlistUrl": "https://open.spotify.com/playlist/37i9dQZF1DXbITWG1ZJKYt"
  }
}
```

**What This Endpoint Does:**
1. Validates venue (active, mode, playlist exists)
2. Searches track via n8n webhook (`search-track`)
3. Creates `SongRequest` record (status: `PENDING`)
4. Adds song to playlist via n8n webhook (`add-song-to-playlist`)
5. Updates request status to `QUEUED`
6. Returns success with queue position

**Error Responses:**
- `400`: Venue not active / Wrong mode / Playlist not ready
- `404`: Track not found → "Sorry, I couldn't find '{trackName}' by {artistName} on Spotify. Please check the spelling and try again."
- `500`: Failed to add to playlist → "Sorry, there was an error adding your song. Please try again later."

---

### **Step 8: Add Song to Playlist (Internal - Called by Rockola API)**

**Endpoint:** `POST {N8N_WEBHOOK_URL}/add-song-to-playlist` (Rockola → n8n)

**Purpose:** Add track to Spotify playlist

**This is called internally by Rockola API, not directly by chatbot!**

**Webhook Payload:**
```json
{
  "venueId": "550e8400-e29b-41d4-a716-446655440000",
  "requestId": "880e8400-e29b-41d4-a716-446655440001",
  "playlistId": "37i9dQZF1DXbITWG1ZJKYt",
  "trackUri": "spotify:track:4uLU6hMCjM75X6rr3Xg3F8",
  "spotifyClientId": "51ac6e03a9694126b84402763a033249",
  "spotifyClientSecret": "96570d65d0c84d51839c1bf6c8354ad5"
}
```

**Response:**
```json
{
  "success": true,
  "added": true,
  "playlistLength": 42
}
```

---

## 📤 Output: Chatbot Response

### **Success Response:**

```
✅ Great! I've added "{trackName}" by {artistName} to the playlist!

📍 Queue Position: #{queuePosition}
🎵 Playlist: {playlistUrl}

Your remaining credits: {newBalance}
```

**Example:**
```
✅ Great! I've added "Bohemian Rhapsody" by Queen to the playlist!

📍 Queue Position: #3
🎵 Playlist: https://open.spotify.com/playlist/37i9dQZF1DXbITWG1ZJKYt

Your remaining credits: 10.50
```

---

### **Error Responses:**

#### **1. Insufficient Credits:**
```
❌ Sorry, you don't have enough credits.

Current balance: {credits}
Required: {creditPerSong}
Shortfall: {shortfall}

💳 To add credits, reply with "buy credits"
```

#### **2. Rate Limit Exceeded:**
```
⏱️ Rate limit exceeded!

You've made {requestsInWindow} requests in the last {windowMinutes} minutes.
Maximum allowed: {maxRequests}

Please wait {waitMinutes} minutes before requesting again.
```

#### **3. Track Not Found:**
```
❌ Sorry, I couldn't find "{trackName}" by {artistName} on Spotify.

Please check the spelling and try again.
💡 Tip: Try "Artist - Song" format
```

#### **4. Venue Not Active:**
```
❌ Sorry, this venue is not currently active.

Please contact the venue owner for more information.
```

#### **5. Playlist Not Ready:**
```
⏳ The playlist is still being created. Please wait a moment and try again.
```

#### **6. Rule Violation:**
```
❌ Sorry, "{trackName}" by {artistName} doesn't match the venue's music rules.

Reason: {rule violation reason}

Please choose a different song.
```

#### **7. Generic Error:**
```
❌ Sorry, there was an error processing your request. Please try again later.
```

---

## 🎯 Simplified Flow (Recommended)

For **Playlist Mode Basic** (no rules, simple validation), you can simplify the flow:

```
1. Get Venue Details
2. Check Client Credits (create if not exists)
3. Check Rate Limit
4. Create Song Request (this handles search + add to playlist)
5. Respond to User
```

**Skip:**
- Step 4 (Get Active Rules) - Only needed for Advanced Mode
- Step 6 (Validate Song Request) - Already validated in steps 2-3

---

## 🔧 N8N Workflow Structure

### **Workflow Nodes:**

1. **Webhook Trigger** (WhatsApp/Telegram)
   - Receives message from user
   - Extracts: message text, sender ID, platform

2. **AI Agent / Pattern Matching**
   - Extract intent: `song_request`
   - Extract: `trackName`, `artistName`
   - Get `venueId` from context or message

3. **HTTP Request: Get Venue**
   - `GET /api/venues/{venueId}`
   - Validate venue is active and in PLAYLIST mode

4. **HTTP Request: Check Client**
   - `GET /api/venues/{venueId}/clients/by-identifier`
   - If 404, create new client with default credits

5. **HTTP Request: Check Rate Limit**
   - `GET /api/venues/{venueId}/clients/by-identifier/rate-limit`
   - If exceeded, respond with error and stop

6. **HTTP Request: Create Song Request**
   - `POST /api/venues/{venueId}/song-requests`
   - This handles search + add to playlist internally

7. **Format Response**
   - Format success/error message
   - Include queue position, playlist URL, remaining credits

8. **Send Response**
   - Send formatted message back to user via WhatsApp/Telegram

---

## 🔐 API Key Configuration

**For n8n chatbot:**
1. Create API key in Rockola UI (Settings → API Keys)
2. Store API key securely in n8n credentials
3. Use in all HTTP Request nodes:
   ```
   Authorization: Bearer {API_KEY}
   ```

**API Key Permissions:**
- Must have access to venue (user owns venue or is superadmin)
- API key inherits user's permissions

---

## 📝 Error Handling Best Practices

1. **Always validate venue first** - Don't proceed if venue is inactive
2. **Create client if not exists** - New users should get default credits
3. **Check credits before search** - Avoid unnecessary API calls
4. **Check rate limit early** - Fail fast if limit exceeded
5. **Handle track not found gracefully** - Suggest checking spelling
6. **Log all errors** - For debugging and monitoring
7. **User-friendly messages** - Don't expose technical errors to users

---

## 🧪 Testing Checklist

- [ ] New user (no client record) → Creates client with default credits
- [ ] Existing user with sufficient credits → Request succeeds
- [ ] Insufficient credits → Error message with balance
- [ ] Rate limit exceeded → Error message with wait time
- [ ] Track not found → Error message with suggestion
- [ ] Venue inactive → Error message
- [ ] Playlist not ready → Error message
- [ ] Invalid API key → Logs error, doesn't respond to user
- [ ] Network errors → Retry logic or graceful error

---

## 📚 Related Documentation

- [ROCKOLA-API-FOR-N8N.md](./ROCKOLA-API-FOR-N8N.md) - Complete API reference
- [N8N-WEBHOOKS-SPECIFICATION.md](./N8N-WEBHOOKS-SPECIFICATION.md) - Webhook specifications
- [API-KEYS-GUIDE.md](./API-KEYS-GUIDE.md) - API key setup guide

---

## ✅ Summary

**Complete Flow:**
1. User sends message → Chatbot receives
2. Extract song request data (track, artist, venue)
3. Validate venue (active, mode, playlist)
4. Check/create client and credits
5. Check rate limit
6. Create song request (searches track + adds to playlist)
7. Respond to user with success/error

**Key Endpoints:**
- `GET /api/venues/{venueId}` - Get venue details
- `GET /api/venues/{venueId}/clients/by-identifier` - Check credits
- `GET /api/venues/{venueId}/clients/by-identifier/rate-limit` - Check rate limit
- `POST /api/venues/{venueId}/song-requests` - Create request (handles search + add)

**Authentication:**
- All endpoints require `Authorization: Bearer {API_KEY}` header
