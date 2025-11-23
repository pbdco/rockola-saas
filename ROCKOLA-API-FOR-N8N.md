# 🔌 Rockola API Endpoints for n8n

## 📋 Overview

This document lists **all Rockola API endpoints** that n8n will call, including:
- **Webhooks** (n8n → Rockola) - Already documented in `N8N-WEBHOOKS-SPECIFICATION.md`
- **Agent Endpoints** (n8n → Rockola) - For checking credits, rules, venue details, etc.
- **Programmatic Endpoints** (n8n → Rockola) - For transactions and data operations

**Authentication:** All endpoints require API key authentication (except webhooks which use API key + signature).

---

## 🔐 Authentication

### **API Key Authentication**
For agent/programmatic endpoints, include API key in header:
```
Authorization: Bearer {API_KEY}
```
or
```
X-API-Key: {API_KEY}
```

### **Webhook Authentication**
For webhooks (n8n → Rockola), use:
```
X-API-Key: {N8N_API_KEY}
X-Signature: {HMAC-SHA256 signature}
```

---

## 📥 Webhooks (n8n → Rockola)

See `N8N-WEBHOOKS-SPECIFICATION.md` for complete webhook documentation.

**Summary:**
1. `POST /api/webhooks/n8n/credit-purchase` - Credit purchase
2. `POST /api/webhooks/n8n/track-found` - Track search result
3. `POST /api/webhooks/n8n/queue-updated` - Queue position update
4. `POST /api/webhooks/n8n/playback-updated` - Playback status update

---

## 🤖 Agent Endpoints (n8n → Rockola)

These endpoints are used by n8n agents/bots to check status, validate requests, and get information.

### 1. **Check Client Credits**

**Endpoint:** `GET /api/venues/[venueId]/clients/by-identifier`

**Purpose:** Check if a client has enough credits for a song request.

**Request:**
```http
GET /api/venues/550e8400-e29b-41d4-a716-446655440000/clients/by-identifier?identifier=541112121212&platform=whatsapp
Authorization: Bearer {API_KEY}
```

**Response (Success):**
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
    "totalRequests": 5,
    "firstSeenAt": "2025-11-20T10:00:00Z",
    "lastSeenAt": "2025-11-23T18:30:00Z"
  }
}
```

**Response (Not Found):**
```json
{
  "error": {
    "message": "Client not found"
  }
}
```

**Use Case:** Before processing a song request, check if client has sufficient credits.

---

### 2. **Get Venue Details**

**Endpoint:** `GET /api/venues/[venueId]`

**Purpose:** Get venue configuration including mode, pricing, rules, playlist info.

**Request:**
```http
GET /api/venues/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {API_KEY}
```

**Response (Success):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "440e8400-e29b-41d4-a716-446655440000",
    "name": "The Groove Bar",
    "slug": "the-groove-bar",
    "address": "123 Main Street",
    "mode": "PLAYLIST",
    "spotifyPlaylistId": "37i9dQZF1DXbITWG1ZJKYt",
    "spotifyPlaylistUrl": "https://open.spotify.com/playlist/37i9dQZF1DXbITWG1ZJKYt",
    "spotifyClientId": "51ac6e03a9694126b84402763a033249",
    "spotifyClientSecret": "96570d65d0c84d51839c1bf6c8354ad5",
    "pricingEnabled": true,
    "pricePerSong": 5.00,
    "currency": "USD",
    "creditPerSong": 5.00,
    "defaultCredits": 10.00,
    "maxCredits": null,
    "rateLimitRequests": 10,
    "rateLimitWindowMinutes": 60,
    "isActive": true,
    "createdAt": "2025-11-20T10:00:00Z",
    "updatedAt": "2025-11-23T18:30:00Z"
  }
}
```

**Use Case:** Get venue configuration to understand mode, pricing, and settings.

---

### 3. **Get Active Venue Rules**

**Endpoint:** `GET /api/venues/[venueId]/rules`

**Purpose:** Get all active rules for a venue to validate song requests.

**Request:**
```http
GET /api/venues/550e8400-e29b-41d4-a716-446655440000/rules?enabled=true
Authorization: Bearer {API_KEY}
```

**Response (Success):**
```json
{
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440001",
      "venueId": "550e8400-e29b-41d4-a716-446655440000",
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
      },
      "createdAt": "2025-11-20T10:00:00Z",
      "updatedAt": "2025-11-23T18:30:00Z"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "venueId": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Only reggae",
      "description": "Only allow reggae music",
      "type": "CONTENT",
      "enabled": true,
      "priority": 5,
      "conditions": null,
      "actions": {
        "allowGenres": ["reggae"]
      },
      "createdAt": "2025-11-20T10:00:00Z",
      "updatedAt": "2025-11-23T18:30:00Z"
    }
  ]
}
```

**Query Parameters:**
- `enabled` (boolean, optional) - Filter by enabled status
- `type` (string, optional) - Filter by rule type (CONTENT, TIME, PRICING, REQUESTS)

**Use Case:** Before processing a song request, get active rules to validate against.

---

### 4. **Validate Song Request**

**Endpoint:** `POST /api/venues/[venueId]/song-requests/validate`

**Purpose:** Validate if a song request is allowed (checks credits, rules, rate limits).

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

**Response (Invalid - Insufficient Credits):**
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

**Response (Invalid - Rule Violation):**
```json
{
  "data": {
    "valid": false,
    "allowed": false,
    "clientCredits": 15.50,
    "requiredCredits": 5.00,
    "sufficientCredits": true,
    "rateLimitOk": true,
    "rulesPassed": false,
    "reasons": [
      "Track violates rule 'No rock after midnight': Rock genre not allowed after 11 PM"
    ]
  }
}
```

**Response (Invalid - Rate Limit):**
```json
{
  "data": {
    "valid": false,
    "allowed": false,
    "clientCredits": 15.50,
    "requiredCredits": 5.00,
    "sufficientCredits": true,
    "rateLimitOk": false,
    "rulesPassed": true,
    "reasons": [
      "Rate limit exceeded: 10 requests per 60 minutes. Please wait before requesting again."
    ]
  }
}
```

**Use Case:** Validate song request before processing (credits, rules, rate limits).

---

### 5. **Check Rate Limit**

**Endpoint:** `GET /api/venues/[venueId]/clients/by-identifier/rate-limit`

**Purpose:** Check if a client has exceeded rate limits.

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

**Use Case:** Check rate limit before processing song request.

---

### 6. **Get Song Request Status**

**Endpoint:** `GET /api/venues/[venueId]/song-requests/[requestId]`

**Purpose:** Get current status of a song request.

**Request:**
```http
GET /api/venues/550e8400-e29b-41d4-a716-446655440000/song-requests/880e8400-e29b-41d4-a716-446655440001
Authorization: Bearer {API_KEY}
```

**Response (Success):**
```json
{
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440001",
    "venueId": "550e8400-e29b-41d4-a716-446655440000",
    "venueClientId": "660e8400-e29b-41d4-a716-446655440001",
    "patronIdentifier": "541112121212",
    "platform": "whatsapp",
    "spotifyTrackId": "4uLU6hMCjM75X6rr3Xg3F8",
    "trackName": "Bohemian Rhapsody",
    "artistName": "Queen",
    "albumName": "A Night At The Opera",
    "trackUri": "spotify:track:4uLU6hMCjM75X6rr3Xg3F8",
    "status": "QUEUED",
    "price": 5.00,
    "currency": "USD",
    "creditsUsed": 5.00,
    "queuePosition": 3,
    "requestedAt": "2025-11-23T18:30:00Z",
    "queuedAt": "2025-11-23T18:30:15Z",
    "playedAt": null,
    "createdAt": "2025-11-23T18:30:00Z",
    "updatedAt": "2025-11-23T18:30:15Z"
  }
}
```

**Use Case:** Check status of a song request (for bot responses, status updates).

---

### 7. **List Song Requests**

**Endpoint:** `GET /api/venues/[venueId]/song-requests`

**Purpose:** List song requests for a venue (for monitoring, analytics).

**Request:**
```http
GET /api/venues/550e8400-e29b-41d4-a716-446655440000/song-requests?status=QUEUED&limit=10&offset=0
Authorization: Bearer {API_KEY}
```

**Response (Success):**
```json
{
  "data": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440001",
      "venueId": "550e8400-e29b-41d4-a716-446655440000",
      "patronIdentifier": "541112121212",
      "trackName": "Bohemian Rhapsody",
      "artistName": "Queen",
      "status": "QUEUED",
      "queuePosition": 1,
      "requestedAt": "2025-11-23T18:30:00Z"
    },
    {
      "id": "880e8400-e29b-41d4-a716-446655440002",
      "venueId": "550e8400-e29b-41d4-a716-446655440000",
      "patronIdentifier": "541112121213",
      "trackName": "Stairway to Heaven",
      "artistName": "Led Zeppelin",
      "status": "QUEUED",
      "queuePosition": 2,
      "requestedAt": "2025-11-23T18:31:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

**Query Parameters:**
- `status` (string, optional) - Filter by status (PENDING, PAID, QUEUED, PLAYING, PLAYED, SKIPPED, FAILED)
- `clientIdentifier` (string, optional) - Filter by client identifier
- `platform` (string, optional) - Filter by platform (whatsapp, telegram)
- `limit` (number, optional) - Limit results (default: 20)
- `offset` (number, optional) - Offset for pagination (default: 0)

**Use Case:** Get queue status, monitor requests, analytics.

---

## 🔄 Programmatic Endpoints (n8n → Rockola)

These endpoints are used for programmatic operations and transactions.

### 8. **Create Song Request**

**Endpoint:** `POST /api/venues/[venueId]/song-requests`

**Purpose:** Create a new song request (after validation and credit deduction).

**Request:**
```http
POST /api/venues/550e8400-e29b-41d4-a716-446655440000/song-requests
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
  "albumName": "A Night At The Opera",
  "spotifyTrackId": "4uLU6hMCjM75X6rr3Xg3F8",
  "trackUri": "spotify:track:4uLU6hMCjM75X6rr3Xg3F8",
  "clientName": "Pablo",
  "clientLastName": "Garcia"
}
```

**Response (Success):**
```json
{
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440001",
    "venueId": "550e8400-e29b-41d4-a716-446655440000",
    "venueClientId": "660e8400-e29b-41d4-a716-446655440001",
    "patronIdentifier": "541112121212",
    "platform": "whatsapp",
    "spotifyTrackId": "4uLU6hMCjM75X6rr3Xg3F8",
    "trackName": "Bohemian Rhapsody",
    "artistName": "Queen",
    "albumName": "A Night At The Opera",
    "trackUri": "spotify:track:4uLU6hMCjM75X6rr3Xg3F8",
    "status": "PENDING",
    "price": 5.00,
    "currency": "USD",
    "creditsUsed": 5.00,
    "queuePosition": null,
    "requestedAt": "2025-11-23T18:30:00Z",
    "queuedAt": null,
    "playedAt": null,
    "createdAt": "2025-11-23T18:30:00Z",
    "updatedAt": "2025-11-23T18:30:00Z"
  }
}
```

**Response (Error - Insufficient Credits):**
```json
{
  "error": {
    "message": "Insufficient credits",
    "currentBalance": 2.50,
    "required": 5.00,
    "shortfall": 2.50
  }
}
```

**Response (Error - Rule Violation):**
```json
{
  "error": {
    "message": "Request violates venue rules",
    "rule": "No rock after midnight",
    "reason": "Rock genre not allowed after 11 PM"
  }
}
```

**Use Case:** Create song request after validation (credits deducted automatically).

---

### 9. **Update Song Request Status**

**Endpoint:** `PUT /api/venues/[venueId]/song-requests/[requestId]`

**Purpose:** Update song request status (e.g., after adding to playlist/queue).

**Request:**
```http
PUT /api/venues/550e8400-e29b-41d4-a716-446655440000/song-requests/880e8400-e29b-41d4-a716-446655440001
Authorization: Bearer {API_KEY}
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "QUEUED",
  "queuePosition": 3,
  "queuedAt": "2025-11-23T18:30:15Z"
}
```

**Response (Success):**
```json
{
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440001",
    "status": "QUEUED",
    "queuePosition": 3,
    "queuedAt": "2025-11-23T18:30:15Z",
    "updatedAt": "2025-11-23T18:30:15Z"
  }
}
```

**Use Case:** Update request status after adding to playlist/queue.

---

### 10. **Cancel Song Request (Refund Credits)**

**Endpoint:** `DELETE /api/venues/[venueId]/song-requests/[requestId]`

**Purpose:** Cancel a song request and refund credits if already paid.

**Request:**
```http
DELETE /api/venues/550e8400-e29b-41d4-a716-446655440000/song-requests/880e8400-e29b-41d4-a716-446655440001
Authorization: Bearer {API_KEY}
```

**Response (Success):**
```json
{
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440001",
    "status": "CANCELLED",
    "creditsRefunded": 5.00,
    "newBalance": 20.50
  }
}
```

**Use Case:** Cancel request and refund credits (e.g., if track not found, user cancels).

---

### 11. **Get Client Transactions**

**Endpoint:** `GET /api/venues/[venueId]/clients/[clientId]/transactions`

**Purpose:** Get credit transaction history for a client.

**Request:**
```http
GET /api/venues/550e8400-e29b-41d4-a716-446655440000/clients/660e8400-e29b-41d4-a716-446655440001/transactions?limit=10&offset=0
Authorization: Bearer {API_KEY}
```

**Response (Success):**
```json
{
  "data": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440001",
      "venueClientId": "660e8400-e29b-41d4-a716-446655440001",
      "venueId": "550e8400-e29b-41d4-a716-446655440000",
      "type": "PURCHASE",
      "amount": 10.00,
      "balanceBefore": 5.50,
      "balanceAfter": 15.50,
      "description": "Credit purchase via bot",
      "songRequestId": null,
      "metadata": {
        "purchaseId": "purchase-uuid"
      },
      "createdAt": "2025-11-23T18:00:00Z"
    },
    {
      "id": "990e8400-e29b-41d4-a716-446655440002",
      "venueClientId": "660e8400-e29b-41d4-a716-446655440001",
      "venueId": "550e8400-e29b-41d4-a716-446655440000",
      "type": "SPEND",
      "amount": -5.00,
      "balanceBefore": 15.50,
      "balanceAfter": 10.50,
      "description": "Song request: Bohemian Rhapsody",
      "songRequestId": "880e8400-e29b-41d4-a716-446655440001",
      "metadata": null,
      "createdAt": "2025-11-23T18:30:00Z"
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

**Query Parameters:**
- `type` (string, optional) - Filter by transaction type (PURCHASE, SPEND, REFUND, MANUAL_ADD)
- `limit` (number, optional) - Limit results (default: 20)
- `offset` (number, optional) - Offset for pagination (default: 0)

**Use Case:** Get transaction history for client (for bot responses, analytics).

---

### 12. **List Clients for Venue**

**Endpoint:** `GET /api/venues/[venueId]/clients`

**Purpose:** List all clients for a venue.

**Request:**
```http
GET /api/venues/550e8400-e29b-41d4-a716-446655440000/clients?platform=whatsapp&sortBy=credits&limit=20&offset=0
Authorization: Bearer {API_KEY}
```

**Response (Success):**
```json
{
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "venueId": "550e8400-e29b-41d4-a716-446655440000",
      "identifier": "541112121212",
      "platform": "whatsapp",
      "name": "Pablo",
      "lastName": "Garcia",
      "credits": 15.50,
      "totalSpent": 25.00,
      "totalRequests": 5,
      "firstSeenAt": "2025-11-20T10:00:00Z",
      "lastSeenAt": "2025-11-23T18:30:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440002",
      "venueId": "550e8400-e29b-41d4-a716-446655440000",
      "identifier": "541112121213",
      "platform": "whatsapp",
      "name": "Maria",
      "lastName": "Lopez",
      "credits": 8.00,
      "totalSpent": 12.00,
      "totalRequests": 2,
      "firstSeenAt": "2025-11-21T14:00:00Z",
      "lastSeenAt": "2025-11-23T17:00:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

**Query Parameters:**
- `search` (string, optional) - Search by identifier, name, or lastName
- `platform` (string, optional) - Filter by platform (whatsapp, telegram)
- `sortBy` (string, optional) - Sort by: credits, totalSpent, lastSeenAt (default: lastSeenAt)
- `limit` (number, optional) - Limit results (default: 20)
- `offset` (number, optional) - Offset for pagination (default: 0)

**Use Case:** List clients for venue (for analytics, monitoring).

---

## 📊 Summary Table

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/webhooks/n8n/credit-purchase` | POST | Credit purchase webhook | API Key + Signature |
| `/api/webhooks/n8n/track-found` | POST | Track search result | API Key + Signature |
| `/api/webhooks/n8n/queue-updated` | POST | Queue position update | API Key + Signature |
| `/api/webhooks/n8n/playback-updated` | POST | Playback status update | API Key + Signature |
| `/api/venues/[venueId]` | GET | Get venue details | API Key |
| `/api/venues/[venueId]/rules` | GET | Get active rules | API Key |
| `/api/venues/[venueId]/clients/by-identifier` | GET | Check client credits | API Key |
| `/api/venues/[venueId]/clients/by-identifier/rate-limit` | GET | Check rate limit | API Key |
| `/api/venues/[venueId]/song-requests/validate` | POST | Validate song request | API Key |
| `/api/venues/[venueId]/song-requests` | POST | Create song request | API Key |
| `/api/venues/[venueId]/song-requests` | GET | List song requests | API Key |
| `/api/venues/[venueId]/song-requests/[requestId]` | GET | Get request status | API Key |
| `/api/venues/[venueId]/song-requests/[requestId]` | PUT | Update request status | API Key |
| `/api/venues/[venueId]/song-requests/[requestId]` | DELETE | Cancel request (refund) | API Key |
| `/api/venues/[venueId]/clients` | GET | List clients | API Key |
| `/api/venues/[venueId]/clients/[clientId]/transactions` | GET | Get transactions | API Key |

---

## 🔄 Typical Flow Examples

### **Song Request Flow (Playlist Mode)**

1. **Get Venue Details**
   ```
   GET /api/venues/{venueId}
   → Get mode, pricing, playlist info
   ```

2. **Check Client Credits**
   ```
   GET /api/venues/{venueId}/clients/by-identifier?identifier={id}&platform={platform}
   → Check if client has enough credits
   ```

3. **Check Rate Limit**
   ```
   GET /api/venues/{venueId}/clients/by-identifier/rate-limit?identifier={id}&platform={platform}
   → Check if client exceeded rate limit
   ```

4. **Get Active Rules**
   ```
   GET /api/venues/{venueId}/rules?enabled=true
   → Get rules for validation
   ```

5. **Validate Song Request**
   ```
   POST /api/venues/{venueId}/song-requests/validate
   → Validate credits, rules, rate limits
   ```

6. **Create Song Request** (if valid)
   ```
   POST /api/venues/{venueId}/song-requests
   → Create request, deduct credits
   ```

7. **Call n8n to Add to Playlist**
   ```
   POST {N8N_WEBHOOK_URL}/add-song-to-playlist
   → Add track to playlist
   ```

8. **Update Request Status**
   ```
   PUT /api/venues/{venueId}/song-requests/{requestId}
   → Update status to QUEUED
   ```

---

## ⚠️ Error Responses

All endpoints return errors in this format:

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid API key)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## 📝 Notes

1. **API Key:** n8n should use a dedicated API key with appropriate permissions
2. **Rate Limiting:** All endpoints may have rate limits (TBD)
3. **Webhook Security:** Webhooks use HMAC-SHA256 signature verification
4. **Error Handling:** Always check `success` field in responses
5. **Pagination:** List endpoints support pagination with `limit` and `offset`

---

This document provides all the endpoints n8n will need to interact with Rockola. All endpoints include exact JSON request/response examples.
