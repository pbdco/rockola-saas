# 🎛️ Venue Operating Modes - Complete Comparison

## 📋 Overview

Rockola supports **three operating modes** per venue. Each mode offers different levels of control and automation. Venue owners select one mode per venue based on their needs.

---

## 🟢 Queue Mode (Open Requests)

### **What It Is**
The simplest mode - patrons can request **any song from the entire Spotify catalog**. Think of it as a traditional jukebox with full Spotify access.

### **How It Works**
1. Patron sends song request via WhatsApp/Telegram bot
2. Bot searches Spotify for the track
3. System checks credits (if pricing enabled)
4. If valid: Deduct credits → Queue song → Play

### **Key Features**
- ✅ **Full Spotify catalog access** - Any song, any artist
- ✅ **No playlist restrictions** - Complete freedom
- ✅ **Simple validation** - Basic checks (venue active, credits sufficient)
- ✅ **Direct queue** - Songs go straight to Spotify queue
- ✅ **Rate limiting** - Prevents spam (configurable per venue)
- ✅ **Credit-based payment** - Mock credits for testing

### **Use Cases**
- Bars/clubs wanting full song selection
- Venues with no specific music curation needs
- Simple jukebox functionality
- Testing and development

### **Limitations**
- ❌ No content curation (any song can be requested)
- ❌ No automatic playlist management
- ❌ No time-based rules
- ❌ No genre restrictions

### **Technical Flow**
```
Client Request → Check Credits → Search Spotify → Queue Song → Play
```

### **Subscription Tier**
- **Basic Plan** ($29/month) ✅
- **Pro Plan** ($79/month) ✅

---

## 🔵 Playlist Mode (Curated)

### **What It Is**
A curated experience where patrons can **only request songs from a pre-selected Spotify playlist**. The venue owner chooses the playlist, and all requests must come from that list.

### **How It Works**
1. Venue owner selects a Spotify playlist
2. System syncs playlist tracks to database
3. Patron sends song request via bot
4. System validates: Is track in the selected playlist?
5. System checks cooldown: Was this track played recently?
6. If valid: Deduct credits → Queue song → Play

### **Key Features**
- ✅ **Playlist restriction** - Only songs from selected playlist
- ✅ **Playlist sync** - Tracks cached in database for fast validation
- ✅ **Cooldown checks** - Prevents duplicate requests (e.g., same song within 30 min)
- ✅ **Content curation** - Venue controls what can be requested
- ✅ **Rate limiting** - Prevents spam
- ✅ **Credit-based payment** - Mock credits for testing

### **Use Cases**
- Restaurants with specific music themes
- Events with curated playlists
- Venues wanting to maintain a certain vibe
- Branded music experiences

### **Limitations**
- ❌ Limited to one playlist at a time
- ❌ No automatic playlist switching
- ❌ No time-based rules
- ❌ Manual playlist selection required

### **Technical Flow**
```
Client Request → Validate against Playlist → Check Cooldown → 
Check Credits → Queue Song → Play
```

### **Database Requirements**
- `PlaylistTrack` model to cache playlist songs
- Cooldown tracking (lastPlayedAt timestamp)

### **Subscription Tier**
- **Basic Plan** ($29/month) ✅
- **Pro Plan** ($79/month) ✅

---

## 🟣 Automation Mode (Rule-Driven)

### **What It Is**
The most advanced mode - an **intelligent Spotify automation system** that enforces rules based on time, content, and venue policies. The system automatically manages Spotify playback, playlists, and request validation.

### **How It Works**
1. Venue owner defines rules (time-based, content-based, etc.)
2. n8n evaluates rules periodically (every 5 minutes)
3. System updates "venue context" (active rules, current playlist, pricing, etc.)
4. When patron requests song:
   - System checks active rules
   - Validates against time restrictions, genre, explicit content
   - Applies dynamic pricing (if rules specify)
   - Makes context-aware decision
5. System can automatically:
   - Switch playlists at specific times
   - Enable/disable requests
   - Adjust pricing
   - Skip songs based on sentiment
   - Switch Spotify devices

### **Key Features**
- ✅ **Time-based automation** - Rules trigger at specific times
- ✅ **Rule engine** - Complex validation logic
- ✅ **Dynamic pricing** - Adjust creditPerSong based on rules
- ✅ **Content filtering** - Genre, explicit content, track length
- ✅ **Automatic playlist switching** - Change playlists based on time/rules
- ✅ **Auto-moderation** - Skip songs based on crowd feedback
- ✅ **Context-aware decisions** - Bot responses adapt to active rules
- ✅ **Rate limiting** - Prevents spam
- ✅ **Credit-based payment** - Mock credits for testing

### **Use Cases**
- Venues with different vibes throughout the day
- Bars that want automated music management
- Events with time-based music policies
- Venues wanting "set it and forget it" automation
- Advanced music curation needs

### **Example Rules**
```
6:00 PM - 8:00 PM: "Play chill jazz playlist; no explicit content"
8:00 PM - 11:00 PM: "Enable requests; allow pop, reggaeton"
11:00 PM - 3:00 AM: "Disallow slow songs > 6 minutes; priority to paid requests"
3:00 AM - 5:00 AM: "Disable requests; play closing playlist automatically"
```

### **Rule Types**
- **Time-based**: Trigger at specific times/days
- **Content-based**: Genre, explicit, track length
- **Playlist-based**: Switch playlists automatically
- **Pricing-based**: Adjust creditPerSong dynamically
- **Request-based**: Enable/disable requests, set limits

### **Limitations**
- ❌ More complex to set up
- ❌ Requires rule configuration
- ❌ More moving parts (rules, context, automation)

### **Technical Flow**
```
Client Request → n8n Rule Evaluation → Context Check → 
Validate (time/genre/explicit) → Check Credits → Queue Song → Play

OR

Scheduled (n8n) → Evaluate Rules → Update Context → 
Auto Actions (switch playlist, adjust pricing, etc.)
```

### **Database Requirements**
- `VenueRule` model for rule storage
- `VenueContext` model for cached rule state
- Rule evaluation logic (n8n)

### **Subscription Tier**
- **Basic Plan** ($29/month) ❌
- **Pro Plan** ($79/month) ✅

---

## 📊 Side-by-Side Comparison

| Feature | Queue Mode | Playlist Mode | Automation Mode |
|---------|-----------|---------------|-----------------|
| **Song Selection** | Full Spotify catalog | Selected playlist only | Full catalog + rules |
| **Content Curation** | None | Playlist-based | Rule-based |
| **Time-Based Rules** | ❌ | ❌ | ✅ |
| **Automatic Actions** | ❌ | ❌ | ✅ (playlist switch, pricing, etc.) |
| **Playlist Switching** | Manual only | Manual only | Automatic (via rules) |
| **Genre Filtering** | ❌ | ❌ | ✅ |
| **Explicit Content Control** | ❌ | ❌ | ✅ |
| **Dynamic Pricing** | Fixed | Fixed | ✅ (via rules) |
| **Cooldown Checks** | ❌ | ✅ | ✅ |
| **Auto-Moderation** | ❌ | ❌ | ✅ |
| **Complexity** | Low | Medium | High |
| **Setup Time** | Minutes | Minutes | Hours (rule configuration) |
| **Best For** | Simple jukebox | Curated experience | Advanced automation |

---

## 🎯 Decision Matrix

### **Choose Queue Mode If:**
- ✅ You want the simplest setup
- ✅ You want full song selection freedom
- ✅ You don't need content curation
- ✅ You're just starting out
- ✅ You want to test the system

### **Choose Playlist Mode If:**
- ✅ You want to curate the music selection
- ✅ You have a specific playlist/theme
- ✅ You want to prevent certain songs
- ✅ You want cooldown protection (no duplicates)
- ✅ You don't need time-based automation

### **Choose Automation Mode If:**
- ✅ You want "set it and forget it" automation
- ✅ You have different music needs throughout the day
- ✅ You want time-based rules
- ✅ You want dynamic pricing
- ✅ You want auto-moderation
- ✅ You want automatic playlist switching
- ✅ You have Pro Plan subscription

---

## 🔄 Mode Switching

**Can venues switch modes?**
- ✅ Yes, venues can change modes at any time
- ⚠️ Switching modes may affect:
  - Active song requests
  - Playlist data (if switching from Playlist Mode)
  - Rule context (if switching from Automation Mode)

**Recommendation:**
- Switch modes when venue is inactive (no pending requests)
- Or handle mode switch gracefully (complete current requests, then apply new mode)

---

## 💡 Hybrid Approach (Future)

**Potential Enhancement:**
- Allow mixing modes (e.g., Automation Mode with Playlist Mode)
- Example: "Automation Mode + Playlist restriction"
- Rules apply, but requests limited to selected playlist

---

## 📝 Implementation Notes

### **Queue Mode**
- Simplest to implement
- No additional database models needed
- Direct Spotify queue integration

### **Playlist Mode**
- Requires `PlaylistTrack` model
- Playlist sync functionality
- Cooldown tracking

### **Automation Mode**
- Requires `VenueRule` model
- Requires `VenueContext` model
- n8n rule evaluation engine
- Most complex implementation

---

## 🎨 UI Considerations

### **Mode Selection**
- Dropdown in venue creation/edit form
- Clear descriptions for each mode
- Show which subscription tier is required

### **Mode-Specific Settings**
- **Queue Mode**: Just credit settings
- **Playlist Mode**: Playlist selector + cooldown settings
- **Automation Mode**: Rule editor + context viewer

---

This comparison should help clarify the differences between the three modes. Each serves a different use case and complexity level.
