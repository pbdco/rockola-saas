# Webhook URL Fix

## 🔍 Issue Found

The webhook **was being called**, but with the **wrong URL**:

**Wrong URL:**
```
https://n8n.acrofase.org/webhook/create-spotify-credential/create-playlist
```

**Correct URL:**
```
https://n8n.acrofase.org/webhook/rockola/create-playlist
```

## ✅ Fix Applied

Updated `.env` file:

**Before:**
```env
N8N_WEBHOOK_URL=https://n8n.acrofase.org/webhook/create-spotify-credential
N8N_WEBHOOK_CREATE_PLAYLIST_URL=
```

**After:**
```env
N8N_WEBHOOK_URL=https://n8n.acrofase.org/webhook/rockola
N8N_WEBHOOK_CREATE_PLAYLIST_URL=https://n8n.acrofase.org/webhook/rockola/create-playlist
```

## 📋 What Was Happening

1. ✅ Venue was created successfully
2. ✅ Code detected `mode === 'PLAYLIST'`
3. ✅ Spotify credentials were found
4. ✅ Webhook function was called
5. ❌ **Wrong URL** was used (from `N8N_WEBHOOK_URL` + `/create-playlist`)
6. ❌ n8n returned 404: "webhook not registered"

## ✅ Result

Now the webhook will use the correct URL:
- `https://n8n.acrofase.org/webhook/rockola/create-playlist`

**Next step:** Create a new venue in Playlist Mode and it should work! 🎉
