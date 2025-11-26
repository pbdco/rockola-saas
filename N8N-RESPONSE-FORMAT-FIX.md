# n8n Webhook Response Format Fix

## 🔍 Issue Identified

The n8n webhook returns the **raw Spotify API response**, but our code was expecting a **formatted response**.

### Actual n8n Response (Spotify API format):
```json
{
  "id": "0htJ6ND1BOYGT3kgT1TrKT",
  "external_urls": {
    "spotify": "https://open.spotify.com/playlist/0htJ6ND1BOYGT3kgT1TrKT"
  },
  "name": "ROCKOLA - Test Venue",
  "collaborative": false,
  "public": true,
  ...
}
```

### Expected Format (what our code was looking for):
```json
{
  "playlistId": "0htJ6ND1BOYGT3kgT1TrKT",
  "playlistUrl": "https://open.spotify.com/playlist/0htJ6ND1BOYGT3kgT1TrKT",
  "playlistName": "ROCKOLA - Test Venue"
}
```

## ✅ Solution Implemented

Updated `lib/n8n-webhooks.ts` → `createPlaylist()` function to handle **both formats**:

1. **Formatted response** (if n8n formats it): `{ playlistId, playlistUrl, playlistName }`
2. **Raw Spotify API response** (current): `{ id, external_urls: { spotify }, name }`

### Code Changes:
```typescript
// Extract playlist data from either format
if (response.playlistId) {
  // Formatted response format
  playlistId = response.playlistId;
  playlistUrl = response.playlistUrl;
  playlistName = response.playlistName;
} else if (response.id) {
  // Raw Spotify API response format
  playlistId = response.id;
  playlistUrl = response.external_urls?.spotify || response.href;
  playlistName = response.name;
}
```

## 📋 What Gets Saved to Venue

When playlist is created successfully:
- `venue.spotifyPlaylistId` = `"0htJ6ND1BOYGT3kgT1TrKT"` (from `id`)
- `venue.spotifyPlaylistUrl` = `"https://open.spotify.com/playlist/..."` (from `external_urls.spotify`)

## ✅ Result

Now the code correctly extracts:
- ✅ `playlistId` from `response.id`
- ✅ `playlistUrl` from `response.external_urls.spotify`
- ✅ `playlistName` from `response.name`

And saves it to the venue database! 🎉
