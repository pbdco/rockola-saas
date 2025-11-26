# n8n Webhook Setup Guide

## ✅ Using JWT Authentication (Current Implementation)

We use **JWT authentication** for n8n webhooks - it's simpler and requires no Code node for verification!

---

## 🔧 Setup

### Rockola `.env`:
```env
N8N_WEBHOOK_SECRET=your-secret-here
```

**Generate secret:**
```bash
openssl rand -hex 32
```

### n8n Configuration:

1. **Create JWT Credential:**
   - Go to **Credentials** → **Create New** → **JWT**
   - **Key Type:** Passphrase
   - **Secret:** Same value as `N8N_WEBHOOK_SECRET` in Rockola
   - **Algorithm:** HS256
   - Save

2. **Configure Webhook Node:**
   - **Path:** `create-playlist` (or your path)
   - **Method:** POST
   - **Authentication:** JWT Auth
   - **Credential:** Select the JWT credential

**That's it!** n8n automatically verifies JWT tokens.

---

## 📥 What Rockola Sends

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**JWT Payload (automatically decoded by n8n):**
```json
{
  "venueId": "venue-id",
  "venueName": "Venue Name",
  "spotifyClientId": "...",
  "spotifyClientSecret": "...",
  "iat": 1764102210,
  "exp": 1764102510
}
```

---

## 📊 Accessing Data in n8n

**JWT payload is automatically available:**
```javascript
// Access from JWT payload
const venueId = $json.jwtPayload.venueId;
const venueName = $json.jwtPayload.venueName;
const spotifyClientId = $json.jwtPayload.spotifyClientId;
const spotifyClientSecret = $json.jwtPayload.spotifyClientSecret;

// Or from body (if sent)
const body = $json.body;
```

**n8n automatically:**
- ✅ Verifies JWT signature
- ✅ Checks expiration (5 minutes)
- ✅ Decodes payload
- ✅ Makes it available as `jwtPayload`

---

## 🔄 Workflow Structure

```
1. Webhook Trigger (JWT Auth)
   └─ Authentication: JWT Auth
   └─ Credential: JWT (with N8N_WEBHOOK_SECRET)

2. Extract Data (Optional)
   └─ Use $json.jwtPayload directly
   └─ Or extract/format if needed

3. Business Logic
   └─ Spotify OAuth
   └─ Create Playlist
   └─ Return Response
```

**No security verification node needed!** n8n handles it automatically.

---

## ✅ Benefits

- ✅ **No Code node needed** for verification
- ✅ **Automatic expiration check**
- ✅ **Automatic signature verification**
- ✅ **Payload automatically decoded**
- ✅ **Standard JWT approach**
- ✅ **Simple setup**

---

## 📝 Complete Example: Create Playlist Webhook

**Rockola sends:**
- JWT token in `Authorization: Bearer <token>`
- Token contains: `venueId`, `venueName`, `spotifyClientId`, `spotifyClientSecret`
- Token expires in 5 minutes

**n8n receives:**
- Automatically verifies JWT
- Makes payload available as `$json.jwtPayload`

**n8n workflow:**
1. Webhook (JWT Auth) ✅
2. Extract data from `jwtPayload`
3. Get Spotify token
4. Create playlist
5. Return response

**Simple and secure!** 🚀
