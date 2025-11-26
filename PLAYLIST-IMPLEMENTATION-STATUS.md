# Playlist Mode Implementation Status

## ✅ Completed

### 1. Playlist Auto-Creation on Venue Creation
**Status:** ✅ **IMPLEMENTED**

**Location:** `models/venue.ts` (lines 137-209)

**How it works:**
- When a venue is created with `mode === 'PLAYLIST'`
- Automatically calls `createPlaylist()` webhook
- Uses default Spotify credentials from `.env`:
  - `SPOTIFY_DEFAULT_CLIENT_ID`
  - `SPOTIFY_DEFAULT_CLIENT_SECRET`
- Updates venue with `spotifyPlaylistId` and `spotifyPlaylistUrl`
- Handles errors gracefully (venue still created if playlist fails)

**Also works on update:**
- If venue mode changes to `PLAYLIST` and no playlist exists
- Automatically creates playlist (lines 292-353)

**Webhook:**
- ✅ JWT authentication implemented
- ✅ n8n webhook tested and working
- ✅ Endpoint: `https://n8n.acrofase.org/webhook/rockola/create-playlist`

---

## 🔍 Need to Verify

### 2. Playlist Link Display in UI
**Status:** ❓ **NEEDS VERIFICATION**

**What to check:**
- [ ] Venue detail/edit page shows playlist URL
- [ ] Playlist link is clickable
- [ ] Shows "No playlist created" if missing
- [ ] Displays playlist name if available

**Files to check:**
- `components/venues/EditVenue.tsx`
- `components/venues/VenueList.tsx`
- `pages/venues/[venueId]/edit.tsx`

---

## 🔴 Not Implemented Yet

### 3. Add Songs to Playlist
**Status:** 🔴 **NOT IMPLEMENTED**

**What's needed:**
- When a song request is made in Playlist Mode
- Call `addSongToPlaylist()` webhook
- Add track to the venue's Spotify playlist
- Update song request status

**Function exists:** `lib/n8n-webhooks.ts` (line 245)
**Webhook endpoint:** Needs to be configured in n8n

---

## 📋 Next Steps

### Immediate (Playlist Mode Basic):
1. ✅ **Verify playlist URL display in UI** - Check if it's already there
2. 🔴 **Implement "Add Songs to Playlist"** - When song requests are made
3. 🔴 **Test end-to-end flow** - Create venue → Request song → Add to playlist

### Next Sprint (P1 Features):
1. **Max Requests Per User** (P1)
   - Database schema updates
   - Configuration UI
   - Request count tracking
   - Limit enforcement

2. **Rules System** (P1)
   - Rules editor UI
   - Rules validation API
   - Rules engine integration

---

## 🧪 Testing Checklist

- [x] n8n webhook endpoint tested and working
- [ ] Create venue in Playlist Mode → Playlist created
- [ ] Playlist URL saved to venue
- [ ] Playlist URL displayed in UI
- [ ] Create song request → Song added to playlist
- [ ] Error handling (missing credentials, webhook failure)

---

## 🔧 Configuration Required

**Rockola `.env`:**
```env
SPOTIFY_DEFAULT_CLIENT_ID=your-client-id
SPOTIFY_DEFAULT_CLIENT_SECRET=your-client-secret
N8N_WEBHOOK_SECRET=your-webhook-secret
N8N_WEBHOOK_CREATE_PLAYLIST_URL=https://n8n.acrofase.org/webhook/rockola/create-playlist
```

**n8n:**
- ✅ JWT credential configured
- ✅ Webhook node with JWT Auth
- ✅ Playlist creation workflow active
