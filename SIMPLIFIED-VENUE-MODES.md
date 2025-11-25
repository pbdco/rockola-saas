# 🎛️ Simplified Venue Operating Modes - Refined Proposal

## 📋 Overview

Rockola will support **two operating modes** (removing Queue Mode). Each mode has different tiers based on subscription plan and features.

---

## 🔵 Playlist Mode

**Core Concept:** All song requests are added to a dedicated Spotify playlist. The venue owner plays this playlist manually on their Spotify device/app.

### **Playlist Mode: Basic** (Basic Plan - $29/month)

#### **How It Works:**
1. Venue owner selects "Playlist Mode" when creating venue
2. System automatically creates a Spotify playlist for the venue (using shared Spotify account)
3. Playlist name: `"Rockola - {Venue Name}"` (e.g., "Rockola - The Groove Bar")
4. Patrons request songs via WhatsApp/Telegram bot
5. System validates request (credits, rate limits)
6. System adds song to the venue's playlist via Spotify API
7. Venue owner manually plays the playlist on their Spotify device/app
8. UI shows playlist link so venue owner can add it to their Spotify library

#### **Key Features:**
- ✅ **No Spotify setup required** - Uses shared Spotify account (from `.env`)
- ✅ **Automatic playlist creation** - One playlist per venue
- ✅ **Simple song addition** - Just add tracks to playlist
- ✅ **Playlist link in UI** - Venue owner can easily access and follow playlist
- ✅ **Credit-based request limits** - Control who can request and how much
  - **Cost per request**: $0 to unlimited (venue owner configurable)
  - **Max requests per user**: Limit total requests per patron (e.g., "max 2 songs per guest")
  - **Combined with rules**: Can limit by credits + request count + music rules
  - **Perfect for parties**: "Each guest can request 2 free songs from our playlist"
- ✅ **Rate limiting** - Prevents spam

#### **Technical Details:**
- **Spotify Account:** Uses shared/main Spotify app credentials from `.env`:
  - `SPOTIFY_CLIENT_ID` (default: `51ac6e03a9694126b84402763a033249`)
  - `SPOTIFY_CLIENT_SECRET` (default: `96570d65d0c84d51839c1bf6c8354ad5`)
- **Playlist Management:**
  - Playlist created automatically when venue is created
  - Playlist ID stored in `Venue.spotifyPlaylistId`
  - Playlist is public or collaborative (TBD)
- **OAuth Flow:** Not required for venue owner (uses shared account)
- **Database Fields:**
  - `spotifyPlaylistId` - The created playlist ID
  - `spotifyPlaylistUrl` - The Spotify playlist URL (for UI display)

#### **Superadmin Feature:**
- Superadmins can set **default Spotify client ID/secret per venue**
- Purpose: Distribute rate limits across multiple Spotify apps
- If one app hits rate limits, assign different app to specific venues
- Default: Uses `.env` values
- Override: Set per-venue in superadmin dashboard
- **Only used for Playlist Mode**

#### **UI Elements:**
- Show playlist link/button: "Open Playlist in Spotify"
- Display playlist name
- Show number of tracks in playlist
- Option to regenerate playlist (creates new one, archives old)

#### **Limitations:**
- ❌ No content curation rules
- ❌ No genre/artist restrictions
- ❌ No time-based rules
- ❌ Manual playlist playback (venue owner must play it)

---

### **Playlist Mode: Advanced** (Pro Plan - $79/month)

#### **How It Works:**
Same as Playlist Mode Basic, **PLUS**:
- Rules system for content curation
- Genre/artist/blacklist restrictions
- Time-based rules (e.g., "no rock after midnight")

#### **Key Features:**
- ✅ Everything from Playlist Mode Basic
- ✅ **Credit-based request limits** - Same as Basic (cost + max requests per user)
- ✅ **Rules System** - Content curation via natural language
- ✅ **Blacklists** - Per hour/day/all day
- ✅ **Genre Restrictions** - "Only reggae", "No trap"
- ✅ **Artist Restrictions** - "Not allow Rolling Stones"
- ✅ **Time-Based Rules** - "No explicit after 11 PM"
- ✅ **AI Integration** - Rules stored as system prompt for bot
- ✅ **Triple Filtering**: Requests must pass:
  1. Credit check (has enough credits, hasn't exceeded max requests)
  2. Music rules (genre, artist, explicit, time-based)
  3. Catalog check (if in Catalogue Mode)

#### **Rules System:**
Rules are defined in **natural language** by venue owner:
- "Not allow rock, trap, or cumbia"
- "Only reggae"
- "Not allow Rolling Stones"
- "No explicit content after 11 PM"
- "Only allow songs under 5 minutes during happy hour"

**Storage:**
- Rules stored in `VenueRule` model
- Rules converted to structured format for validation
- Rules also stored as **system prompt** for AI bot (n8n conversation context)
- Bot uses rules to:
  - Validate requests before adding to playlist
  - Respond to patron queries about allowed genres
  - Explain why a request was rejected

#### **Rule Types:**
1. **Content Rules:**
   - Genre allow/deny lists
   - Artist allow/deny lists
   - Explicit content restrictions
   - Track length restrictions

2. **Time-Based Rules:**
   - Apply rules at specific times
   - Different rules for different days
   - "All day" rules

3. **Blacklists:**
   - Per hour (e.g., "No rock 11 PM - 2 AM")
   - Per day (e.g., "No trap on Sundays")
   - All day (e.g., "Never allow explicit content")

#### **Technical Details:**
- **Database Models:**
  - `VenueRule` - Stores rules per venue
  - `VenueRuleCondition` - Time/day conditions
  - `VenueRuleAction` - What to do (allow/deny, genre filter, etc.)
- **Validation:**
  - Before adding song to playlist, check all active rules
  - Rules evaluated in priority order
  - If rule blocks request, return error to patron with explanation
- **AI Integration:**
  - Rules converted to system prompt
  - Bot uses prompt to understand venue's music policy
  - Bot can explain rules to patrons

#### **UI Elements:**
- Rules editor (natural language input)
- Rule list with enable/disable toggle
- Time-based rule scheduler
- Blacklist manager
- Test rule against sample songs

---

## 🟣 Automation Mode (Pro Plan Only - $79/month)

**Core Concept:** Full Spotify automation with playback control. Requires venue owner's own Spotify app credentials.

### **How It Works:**
1. Venue owner creates their own Spotify app (gets Client ID/Secret)
2. Venue owner connects their Spotify account via OAuth
3. System can control their Spotify playback (queue, skip, play, device switching)
4. Patrons request songs via bot
5. System validates against rules (same as Playlist Mode Advanced)
6. System automatically adds to Spotify queue or plays immediately
7. System can automatically skip songs based on feedback/rules
8. System can switch playlists automatically based on time/rules

### **Key Features:**
- ✅ **Full playback control** - Queue, skip, play, device switching
- ✅ **Automatic playback** - No manual intervention needed
- ✅ **Rules System** - Same as Playlist Mode Advanced
- ✅ **Time-based automation** - Auto-switch playlists, adjust settings
- ✅ **Auto-moderation** - Skip songs based on crowd feedback
- ✅ **Device control** - Switch between Spotify devices
- ✅ **Time-Based Request Limits** ⭐ **NEW FEATURE**
  - Track total duration of queued songs
  - Compare against venue's remaining opening hours
  - Stop accepting requests when no time left
  - **Guarantee paid requests will play** - Ensures all paid/credited songs play before closing
  - Optional feature (venue owner can enable/disable)
  - Example: Bar 11 PM - 5 AM, stops accepting requests when queue fills remaining time
- ✅ **Future: AI Analysis** - Control music based on feedback and other inputs

### **Technical Details:**
- **Spotify Account:** Requires venue owner's own Spotify app
  - Venue owner must create Spotify app at https://developer.spotify.com
  - Venue owner provides Client ID/Secret in venue settings
  - OAuth flow connects venue owner's Spotify account
- **OAuth Flow:** Required (different from Playlist Mode)
- **Playback Control:**
  - `POST /me/player/queue` - Add to queue
  - `POST /me/player/next` - Skip current track
  - `GET /me/player` - Get current playback state
  - `PUT /me/player/play` - Start/resume playback
  - `GET /me/player/devices` - List available devices
  - `PUT /me/player` - Transfer playback to device

### **Rules System:**
Same as Playlist Mode Advanced, **PLUS**:
- **Playlist switching rules** - "Switch to jazz playlist at 6 PM"
- **Pricing rules** - "Charge 2x credits after midnight"
- **Request enable/disable** - "Disable requests after 3 AM"
- **Auto-moderation rules** - "Skip if 3+ negative reactions"

### **Future: AI Analysis**
- Analyze crowd feedback (emoji reactions)
- Adjust music selection based on sentiment
- Predict optimal song choices
- Auto-skip songs with negative feedback
- Suggest playlist changes based on crowd energy

### **Limitations:**
- ❌ Requires venue owner to create Spotify app
- ❌ More complex setup
- ❌ Pro Plan only

---

## 📊 Comparison Table

| Feature | Playlist Mode Basic | Playlist Mode Advanced | Automation Mode |
|---------|-------------------|----------------------|-----------------|
| **Subscription** | Basic ($29/mo) | Pro ($79/mo) | Pro ($79/mo) |
| **Spotify Setup** | None (shared account) | None (shared account) | Required (owner's app) |
| **OAuth Required** | ❌ | ❌ | ✅ |
| **Playlist Creation** | Automatic | Automatic | Manual/Optional |
| **Song Addition** | Add to playlist | Add to playlist | Add to queue/play |
| **Playback Control** | Manual (owner plays) | Manual (owner plays) | Automatic |
| **Rules System** | ❌ | ✅ | ✅ |
| **Time-Based Rules** | ❌ | ✅ | ✅ |
| **Auto-Moderation** | ❌ | ❌ | ✅ (future) |
| **Device Control** | ❌ | ❌ | ✅ |
| **AI Analysis** | ❌ | ❌ | ✅ (future) |

---

## 🗄️ Database Schema Changes

### **Venue Model Updates:**
```prisma
model Venue {
  // ... existing fields ...
  
  mode                  VenueMode      @default(PLAYLIST)  // Remove QUEUE
  spotifyPlaylistId     String?        // For Playlist Mode
  spotifyPlaylistUrl    String?        // For UI display
  spotifyClientId       String?        // For Automation Mode OR per-venue override (Playlist Mode)
  spotifyClientSecret   String?        @db.Text  // For Automation Mode OR per-venue override (Playlist Mode)
  
  // ... rest of fields ...
}
```

### **New Models:**
```prisma
model VenueRule {
  id          String   @id @default(uuid())
  venueId     String
  name        String
  description String?  // Natural language rule
  type        RuleType // CONTENT, TIME, PRICING, REQUESTS
  enabled     Boolean  @default(true)
  priority    Int      @default(10)
  conditions  Json?    // Time conditions, day conditions
  actions     Json     // What to do (allow/deny, genre filter, etc.)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  venue Venue @relation(fields: [venueId], references: [id], onDelete: Cascade)

  @@index([venueId])
}

enum RuleType {
  CONTENT    // Genre, artist, explicit content
  TIME       // Time-based restrictions
  PRICING    // Dynamic pricing
  REQUESTS   // Enable/disable requests
}
```

---

## 🔧 Implementation Plan

### **Phase 1: Remove Queue Mode**
1. Update `VenueMode` enum: Remove `QUEUE`, keep `PLAYLIST` and `AUTOMATION`
2. Migrate existing `QUEUE` venues to `PLAYLIST` mode
3. Update UI to remove Queue Mode option
4. Update documentation

### **Phase 2: Playlist Mode Basic**
1. Add `spotifyPlaylistId` and `spotifyPlaylistUrl` to Venue model
2. Create playlist automatically when venue is created (Playlist Mode)
3. Add playlist link to venue UI
4. Implement song addition to playlist (via shared Spotify account)
5. Add superadmin UI for setting per-venue Spotify credentials

### **Phase 3: Playlist Mode Advanced (Rules)**
1. Create `VenueRule` model
2. Build rules editor UI (natural language input)
3. Implement rule validation logic
4. Integrate rules as system prompt for AI bot
5. Add blacklist management

### **Phase 4: Automation Mode Refinement**
1. Ensure OAuth flow works for venue owner's Spotify app
2. Implement playback control endpoints
3. Add device switching
4. Integrate rules system (reuse from Playlist Mode Advanced)

### **Phase 5: Future - AI Analysis**
1. Collect feedback data
2. Build sentiment analysis
3. Implement auto-moderation
4. Add predictive music selection

---

## 🎯 Decision Matrix

### **Choose Playlist Mode Basic If:**
- ✅ You want the simplest setup (no Spotify app needed)
- ✅ You're okay with manual playlist playback
- ✅ You don't need content curation
- ✅ You're on Basic Plan

### **Choose Playlist Mode Advanced If:**
- ✅ You want content curation (rules, blacklists)
- ✅ You want to restrict genres/artists
- ✅ You want time-based rules
- ✅ You're on Pro Plan
- ✅ You don't need automatic playback control

### **Choose Automation Mode If:**
- ✅ You want automatic playback control
- ✅ You want "set it and forget it" automation
- ✅ You want device switching
- ✅ You want auto-moderation (future)
- ✅ You're on Pro Plan
- ✅ You're willing to create your own Spotify app

---

## 🔐 Security & Rate Limits

### **Playlist Mode (Shared Account):**
- **Rate Limit Management:**
  - Default: All venues use shared Spotify app from `.env`
  - If rate limits hit: Superadmin assigns different Spotify app to specific venues
  - Distribute venues across multiple Spotify apps to avoid rate limits
- **Superadmin Controls:**
  - Set default Spotify client ID/secret per venue
  - Override shared account for specific venues
  - Monitor rate limit usage

### **Automation Mode (Owner's Account):**
- Each venue uses their own Spotify app
- Rate limits are per venue (not shared)
- No rate limit distribution needed

---

## ✅ Clarifications & Decisions

1. **Playlist Visibility:**
   - ✅ **Collaborative** - User has to join the playlist
   - Created from n8n (not directly from Rockola)

2. **Playlist Creation:**
   - ✅ Triggered automatically when venue is created (Playlist Mode)
   - POST request to n8n webhook after venue creation
   - n8n responds with created playlist link
   - Playlist link visible in venue details UI

3. **Rules Validation:**
   - ✅ When saving rules from Rockola UI:
     - Call n8n webhook with rules
     - n8n sends rules to AI agent for validation
     - AI responds: OK or conflict explanation
     - Rockola shows "Analyzing rules... please wait 🤖" while waiting
     - Only save if AI returns OK
     - If conflicts, show explanation in UI, user must modify

4. **Default Spotify Credentials:**
   - ✅ Added to `.env` as defaults
   - ✅ Configurable via superadmin UI (overrides default)
   - Used only for Playlist Mode

5. **N8N Webhook Configuration:**
   - ✅ Multiple n8n webhooks (one per action)
   - ✅ Configurable from superadmin dashboard UI
   - ✅ Defaults in `.env`, but can override per webhook
   - ✅ Superadmin can set different webhook URLs for each action

---

## ✅ Next Steps

1. **Review this proposal** - Does this align with your vision?
2. **Answer open questions** - Help refine the details
3. **Create implementation todos** - Break down into tasks
4. **Start with Phase 1** - Remove Queue Mode, migrate existing venues

---

This simplified approach makes the system more focused and easier to understand. The two modes serve distinct use cases, and the tiered approach (Basic vs Advanced) allows for upselling while keeping the entry point simple.
