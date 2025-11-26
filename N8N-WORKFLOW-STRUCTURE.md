# n8n Workflow Structure for Playlist Creation

## Node Sequence

```
1. Webhook Trigger
   ↓
2. Code Node (Security Verification)
   ↓
3. IF Node (Check Security Result)
   ↓ (if false)
   HTTP Respond (401 Error)
   ↓ (if true)
4. Code Node (Extract Data)
   ↓
5. HTTP Request (Spotify OAuth - Get Token)
   ↓
6. HTTP Request (Spotify - Create Playlist)
   ↓
7. Code Node (Format Response)
   ↓
8. HTTP Respond (Success Response)
```

---

## Node 1: Webhook Trigger

**Settings:**
- **Path:** `create-playlist`
- **Method:** `POST`
- **Authentication:** JWT Auth
- **Credential:** JWT credential (with `N8N_WEBHOOK_SECRET`)
- **Response Mode:** `Last Node`

**Output:** 
- `$json.jwtPayload` - Decoded JWT payload (webhook data)
- `$json.body` - Request body (if sent)
- `$json.headers` - Request headers

---

## Node 2: (OPTIONAL) Code Node - Extract Data

**Note:** With JWT Auth, n8n automatically verifies the token. You can skip this node and use `$json.jwtPayload` directly, or use this to extract/format data.

**Name:** `Extract Payload` (Optional)

**Code:**
```javascript
const crypto = require('crypto');

// Configuration - These MUST match the values in Rockola's .env file
// Option 1: Use n8n environment variables (recommended)
const EXPECTED_API_KEY = $env.N8N_API_KEY;
const WEBHOOK_SECRET = $env.N8N_WEBHOOK_SECRET;

// Option 2: Use n8n credentials (most secure)
// const credentials = $credentials.rockolaWebhook;
// const EXPECTED_API_KEY = credentials.apiKey;
// const WEBHOOK_SECRET = credentials.webhookSecret;

// Get headers (API key is NOT sent - it's embedded in signature)
const headers = $input.item.json.headers || {};
const receivedSignature = headers['x-signature'];
const receivedTimestamp = parseInt(headers['x-timestamp']);

if (!receivedSignature || !receivedTimestamp) {
  return {
    json: {
      securityValid: false,
      error: 'Missing signature or timestamp',
      statusCode: 401
    }
  };
}

// 1. Check timestamp (prevent replay attacks - 5 minute window)
const now = Date.now();
const timeDiff = Math.abs(now - receivedTimestamp);
if (timeDiff > 5 * 60 * 1000) { // 5 minutes
  return {
    json: {
      securityValid: false,
      error: 'Request expired (timestamp too old)',
      statusCode: 401
    }
  };
}

// 2. Get request body
const body = $input.item.json.body;
const bodyString = JSON.stringify(body);

// 3. Reconstruct message (must match Rockola's format)
// Format: body + timestamp + apiKey
const message = `${bodyString}:${receivedTimestamp}:${EXPECTED_API_KEY}`;

// 4. Calculate signature with same method as Rockola
// Signing key: secret + apiKey
const signingKey = `${WEBHOOK_SECRET}:${EXPECTED_API_KEY}`;
const hmac = crypto.createHmac('sha256', signingKey);
const calculatedSig = hmac.update(message).digest('hex');

// 5. Verify signature (constant-time comparison)
let sigValid = false;
try {
  sigValid = crypto.timingSafeEqual(
    Buffer.from(receivedSignature, 'hex'),
    Buffer.from(calculatedSig, 'hex')
  );
} catch (e) {
  return {
    json: {
      securityValid: false,
      error: 'Invalid signature format',
      statusCode: 401
    }
  };
}

if (!sigValid) {
  return {
    json: {
      securityValid: false,
      error: 'Invalid signature',
      statusCode: 401
    }
  };
}

// 6. Security passed - pass through data
return {
  json: {
    ...body,
    securityValid: true
  }
};
```

---

## Node 3: Code Node - Extract Data (if you didn't use Node 2)

**Name:** `Extract Payload`

**Code:**
```javascript
const data = $input.item.json;

return {
  json: {
    venueId: data.venueId,
    venueName: data.venueName,
    spotifyClientId: data.spotifyClientId,
    spotifyClientSecret: data.spotifyClientSecret
  }
};
```

---

## Node 4: HTTP Request - Spotify OAuth

**Name:** `Get Spotify Token`

**Settings:**
- **Method:** `POST`
- **URL:** `https://accounts.spotify.com/api/token`
- **Authentication:** `Basic Auth`
  - **Username:** `{{ $json.spotifyClientId }}`
  - **Password:** `{{ $json.spotifyClientSecret }}`
- **Body:**
  - **Content Type:** `x-www-form-urlencoded`
  - **Body:**
    ```
    grant_type=client_credentials
    ```
- **Response Format:** `JSON`

**Output:** Access token in `$json.access_token`

---

## Node 5: HTTP Request - Create Playlist

**Name:** `Create Spotify Playlist`

**Settings:**
- **Method:** `POST`
- **URL:** `https://api.spotify.com/v1/users/{{ YOUR_SPOTIFY_USER_ID }}/playlists`
- **Authentication:** `Generic Credential Type`
  - **Header Name:** `Authorization`
  - **Header Value:** `Bearer {{ $('Get Spotify Token').item.json.access_token }}`
- **Body:**
  - **Content Type:** `JSON`
  - **Body:**
    ```json
    {
      "name": "Rockola - {{ $('Extract Payload').item.json.venueName }}",
      "description": "Collaborative playlist for {{ $('Extract Payload').item.json.venueName }} - Created by Rockola",
      "public": false,
      "collaborative": true
    }
    ```
- **Response Format:** `JSON`

**Output:** Playlist data with `id` and `external_urls.spotify`

---

## Node 6: Code Node - Format Response

**Name:** `Format Response`

**Code:**
```javascript
const playlist = $input.item.json;

return {
  json: {
    success: true,
    playlistId: playlist.id,
    playlistUrl: playlist.external_urls.spotify,
    playlistName: playlist.name
  }
};
```

---

## Node 9: HTTP Respond - Success

**Name:** `Return Success`

**Settings:**
- **Response Code:** `200`
- **Response Body:**
```json
{{ $json }}
```

---

## Complete Workflow JSON Structure (With JWT)

```
Webhook Trigger (JWT Auth)
  → Code: Extract Payload (Optional - can use $json.jwtPayload directly)
    → HTTP Request: Get Spotify Token
      → HTTP Request: Create Spotify Playlist
        → Code: Format Response
          → HTTP Respond: Return Success
```

**Note:** With JWT Auth, n8n automatically verifies the token. No security verification node needed!

---

## Quick Setup Checklist

- [ ] Webhook Trigger configured with JWT Auth
- [ ] JWT credential created (with `N8N_WEBHOOK_SECRET`)
- [ ] Data extraction node (optional - can use `$json.jwtPayload` directly)
- [ ] Spotify OAuth node
- [ ] Spotify Create Playlist node
- [ ] Response formatting node
- [ ] Success response node (200)
- [ ] Set Spotify User ID in Create Playlist node

**Note:** No security verification Code node needed - JWT Auth handles it automatically!

---

## Environment Variables / Credentials Needed

### ⚠️ IMPORTANT: This is a SHARED SECRET

This value must be configured in **BOTH** places:

1. **Rockola's `.env` file** (so Rockola can sign requests)
2. **n8n workflow** (so n8n can verify signatures)

### Value to Configure:

**N8N_WEBHOOK_SECRET** - A shared secret (you generate this yourself)
- Used for: HMAC-SHA256 signature verification
- Example: `rockola-webhook-secret-2024-random-string`
- Set in Rockola: `.env` file → `N8N_WEBHOOK_SECRET=your-secret-here`
- Set in n8n: Environment variable or credential

**Note:** We use only the webhook secret (standard webhook pattern like Stripe, GitHub). No API key needed!

### How to Generate:

```bash
# Generate a random webhook secret (32 characters)
openssl rand -hex 32
```

### Where to Set:

**In Rockola (`.env` file):**
```env
N8N_WEBHOOK_SECRET=your-generated-secret-here
```

**In n8n:**
- Go to Settings → Environment Variables
- Add: `N8N_WEBHOOK_SECRET` = `your-generated-secret-here`
- OR create a credential with this value

**Important:** The same secret must be set in both places!

---

## Testing

**Test URL:** `POST https://your-n8n.com/webhook/create-playlist`

**Test Body:**
```json
{
  "venueId": "test-123",
  "venueName": "Test Venue",
  "spotifyClientId": "your-client-id",
  "spotifyClientSecret": "your-client-secret"
}
```

**Expected Response:**
```json
{
  "success": true,
  "playlistId": "37i9dQZF1DXbITWG1ZJKYt",
  "playlistUrl": "https://open.spotify.com/playlist/37i9dQZF1DXbITWG1ZJKYt",
  "playlistName": "Rockola - Test Venue"
}
```
