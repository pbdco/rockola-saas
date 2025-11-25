# 🎯 Rockola Product Backlog

## 📋 Overview

This document tracks all planned features, enhancements, and improvements for Rockola. Items are organized by priority and status.

**Status Legend:**
- 🔴 **Not Started** - Feature not yet implemented
- 🟡 **In Progress** - Currently being developed
- 🟢 **Completed** - Feature implemented and deployed
- ⏸️ **On Hold** - Temporarily paused
- 💡 **Under Consideration** - Being evaluated

**Priority:**
- **P0** - Critical (blocks core functionality)
- **P1** - High (major feature, significant value)
- **P2** - Medium (nice to have, moderate value)
- **P3** - Low (future consideration)

---

## 🚀 Current Sprint / Active Development

### Phase 3: Playlist Mode Basic Implementation
- 🟡 **Playlist Auto-Creation** - Automatically create playlist when venue is created
- 🟡 **Playlist Link Display** - Show playlist URL in venue UI
- 🟡 **Add Songs to Playlist** - Implement song addition via n8n webhook
- 🔴 **n8n Webhook Integration** - Connect to n8n for playlist management

---

## 💳 Credits & Request Limits System

**Priority:** P1  
**Status:** 🟡 Partially Implemented  
**Epic:** Core Functionality

### Description
Flexible credit system combined with request limits to control patron access. Applies to **all operating modes** but especially critical for **Playlist Mode** party planning use cases.

### Key Features
- **Credit Cost Per Request**: $0 (free) to unlimited (venue owner configurable)
- **Max Requests Per User**: Limit total requests per patron (1 to unlimited, or no limit)
- **Combined Filtering**: Requests must pass credits + limits + rules + catalog (if applicable)
- **Perfect for Parties**: "Each guest can request 2 free songs from our playlist"

### Use Cases
- **Party Planning**: Free requests with max limit (e.g., "2 songs per guest")
- **Live Venues**: Paid requests with daily limits (e.g., "$3.99 per song, max 5 per night")
- **Fair Distribution**: Ensure everyone gets equal opportunity
- **Quality Control**: Combine with rules for content filtering

### Requirements
- ✅ Credit system exists (partially implemented)
- 🔴 **Max requests per user** - Needs implementation
- 🔴 **Request limit configuration UI** - Venue owner settings
- 🔴 **Request limit enforcement** - Validation logic
- 🔴 **Request count tracking** - Per user, with reset options
- 🔴 **Combined validation** - Credits + limits + rules

### Database Schema Updates Needed
```prisma
model Venue {
  // ... existing fields
  creditPerSong      Decimal?  @db.Decimal(10, 2)  // Cost per request (can be 0)
  maxRequestsPerUser Int?                          // Max requests per patron (null = unlimited)
  requestLimitReset  RequestLimitReset?            // DAILY, SESSION, NEVER
}

enum RequestLimitReset {
  DAILY    // Reset at midnight
  SESSION  // Reset when venue closes/opens
  NEVER    // Cumulative limit
}

model VenueClient {
  // ... existing fields
  totalRequests     Int      @default(0)  // Total requests made
  lastRequestAt      DateTime?
}
```

### Acceptance Criteria
- [ ] Venue owner can set `creditPerSong` (0 to unlimited)
- [ ] Venue owner can set `maxRequestsPerUser` (1 to unlimited, or null)
- [ ] Venue owner can set `requestLimitReset` (DAILY, SESSION, NEVER)
- [ ] System validates credit balance before request
- [ ] System validates request count before request
- [ ] System combines credit + limit + rules validation
- [ ] Clear error messages for each validation failure
- [ ] Request count tracking per user
- [ ] Request limit reset logic (daily/session/never)
- [ ] UI shows patron their remaining requests
- [ ] UI shows patron their credit balance

### Related Documentation
- See [CREDITS-AND-LIMITS-FEATURE.md](./CREDITS-AND-LIMITS-FEATURE.md) for detailed specification

---

## 🎵 Core Features - Request Modes

### 1. Request Mode Selection System

**Priority:** P1  
**Status:** 🔴 Not Started  
**Epic:** Core Functionality

#### Description
Allow venue owners to configure how patrons can request music. Two distinct modes with different use cases.

#### Features

##### 1.1 Open Requests Mode
**Status:** 🟡 In Progress (partially implemented)

**Description:**
- Patrons can request any song from Spotify's entire catalog
- Optional music rules filtering (genre, artist, explicit content, time-based)
- Works with existing bot interface (WhatsApp/Telegram)
- Current implementation supports this mode

**Key Features:**
- **Credit-Based Request Limits**: Venue owner can set cost per request ($0 to unlimited)
- **Max Requests Per User**: Limit total number of requests per patron (e.g., "max 3 songs per user")
- **Combined Limits**: Can combine credit cost + max requests + music rules
- **Use Case Example**: Party playlist - "Each guest can request up to 2 songs, free of charge"

**Requirements:**
- ✅ Song search via Spotify API
- ✅ Request validation against rules
- ✅ Credit system integration
- 🔴 Enhanced rule filtering UI
- 🔴 Rule conflict detection and resolution
- 🔴 **Max requests per user configuration**
- 🔴 **Credit cost configuration (can be $0)**
- 🔴 **Request limit enforcement**

**Acceptance Criteria:**
- [ ] Venue owner can enable/disable "Open Requests" mode
- [ ] Venue owner can set credit cost per request (including $0 = free)
- [ ] Venue owner can set max requests per user (e.g., "max 3 requests per patron")
- [ ] Rules can be configured to filter open requests
- [ ] Patrons can request any song (if not blocked by rules, credits, or limits)
- [ ] System validates requests against:
  - [ ] All active rules
  - [ ] User's credit balance
  - [ ] User's request count limit
- [ ] Clear error messages when requests are blocked:
  - [ ] "Insufficient credits" (if credit cost > 0)
  - [ ] "You've reached your request limit" (if max requests exceeded)
  - [ ] "This song doesn't match venue rules" (if blocked by rules)

---

##### 1.2 Catalogue Requests Mode
**Priority:** P1  
**Status:** 🔴 Not Started

**Description:**
- Venue owner defines a curated catalog of music
- Patrons can ONLY request songs from this catalog
- Catalog can include:
  - Specific Spotify playlists
  - Albums
  - Individual songs
  - Artist collections
- Two interfaces for song selection:
  1. **Bot Interface** (existing) - Search within catalog
  2. **Public Microsite** (new) - Visual browsing and selection

**Key Features:**
- **Credit-Based Request Limits**: Same as Open Requests - can set cost ($0 to unlimited)
- **Max Requests Per User**: Limit total requests per patron
- **Catalog + Rules + Credits**: Triple filtering:
  1. Must be in catalog
  2. Must pass music rules
  3. Must have credits and not exceed request limit

**Use Cases:**
- Venues with specific music branding (e.g., "80s Night", "Latin Music Only")
- Events with pre-approved music selection
- Venues that want to control exact song availability
- Licensing compliance (only licensed tracks)
- **Party Planning**: "Each guest can request 2 songs from our wedding playlist, free of charge"

**Features:**

**1.2.1 Catalog Management**
- [ ] Venue owner can create/edit catalog
- [ ] Add Spotify playlists to catalog
- [ ] Add albums to catalog
- [ ] Add individual songs to catalog
- [ ] Add entire artist catalogs
- [ ] Remove items from catalog
- [ ] Catalog preview (see all available songs)
- [ ] Catalog search/filter for venue owner
- [ ] Bulk import from Spotify playlists
- [ ] Catalog versioning (save different catalogs for different events)

**1.2.2 Public Microsite**
- [ ] Public URL for each venue's catalog (e.g., `rockola.com/venue/{slug}/catalog`)
- [ ] Responsive design (mobile-first)
- [ ] Browse catalog by:
  - Playlist
  - Album
  - Artist
  - Genre (if available)
- [ ] Search within catalog
- [ ] Song preview (30-second Spotify preview)
- [ ] One-click request button
- [ ] Show request status (pending, queued, playing)
- [ ] Show current queue
- [ ] QR code generation for easy access
- [ ] No authentication required (public access)
- [ ] Optional: Require patron identifier (phone number, name)

**1.2.3 Bot Integration**
- [ ] Bot searches only within catalog
- [ ] Bot shows catalog options when patron searches
- [ ] Bot can list available playlists/albums
- [ ] Bot can browse catalog by category
- [ ] Bot validates requests against catalog (not just rules)

**1.2.4 Technical Requirements**
- [ ] Database schema for catalog items
- [ ] Catalog sync with Spotify (keep track of available songs)
- [ ] Handle removed/deleted Spotify content
- [ ] Cache catalog for performance
- [ ] API endpoints for catalog management
- [ ] Public API for microsite
- [ ] Rate limiting for public microsite

**Database Schema:**
```prisma
model VenueCatalog {
  id          String   @id @default(uuid())
  venueId     String
  name        String   // Catalog name (e.g., "Friday Night Catalog")
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  venue       Venue    @relation(fields: [venueId], references: [id], onDelete: Cascade)
  items       VenueCatalogItem[]
  
  @@index([venueId])
}

model VenueCatalogItem {
  id            String   @id @default(uuid())
  catalogId     String
  type          CatalogItemType  // PLAYLIST, ALBUM, SONG, ARTIST
  spotifyId     String   // Spotify playlist/album/track/artist ID
  spotifyUri    String   // Full Spotify URI
  name          String   // Display name
  artistName    String?  // For songs
  albumName     String?  // For songs
  imageUrl      String?  // Cover art
  addedAt       DateTime @default(now())
  
  catalog       VenueCatalog @relation(fields: [catalogId], references: [id], onDelete: Cascade)
  
  @@index([catalogId])
  @@index([spotifyId])
}

enum CatalogItemType {
  PLAYLIST
  ALBUM
  SONG
  ARTIST
}
```

**UI/UX Requirements:**
- [ ] Catalog management page in venue settings
- [ ] Drag-and-drop playlist/album selection
- [ ] Search Spotify to add items
- [ ] Preview catalog before saving
- [ ] Public microsite design mockups
- [ ] Mobile-optimized microsite

**Acceptance Criteria:**
- [ ] Venue owner can create and manage catalogs
- [ ] Patrons can only request songs from catalog
- [ ] Public microsite displays catalog beautifully
- [ ] Bot searches within catalog only
- [ ] Catalog syncs with Spotify (handles removed content)

---

## 🎤 Karaoke Mode

**Priority:** P1  
**Status:** 🔴 Not Started  
**Epic:** New Operating Mode

### Description
Transform Rockola into a karaoke bar management system. Handle singer queues, song selection, payment, and lyrics display.

### Use Cases
- Karaoke bars
- Private karaoke events
- Corporate karaoke parties
- Home karaoke setups

### Features

#### 2.1 Singer Queue Management
**Status:** 🔴 Not Started

**Description:**
- Patrons can request a turn to sing
- Queue management for singers
- Song selection per singer
- Payment integration for karaoke sessions

**Requirements:**
- [ ] Singer registration (name, phone number)
- [ ] Queue position assignment
- [ ] Queue display (public view)
- [ ] Queue notifications (SMS/WhatsApp when turn is approaching)
- [ ] Skip singer option (venue owner)
- [ ] Move singer in queue
- [ ] Singer can cancel their turn
- [ ] Auto-advance queue when song ends
- [ ] Queue history

**Database Schema:**
```prisma
model KaraokeSession {
  id              String   @id @default(uuid())
  venueId         String
  singerName      String
  patronIdentifier String?  // Phone number, email, etc.
  spotifyTrackId  String
  trackName       String
  artistName      String
  queuePosition   Int
  status          KaraokeStatus @default(PENDING)
  paidAt          DateTime?
  startedAt       DateTime?
  completedAt     DateTime?
  skippedAt       DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  venue           Venue   @relation(fields: [venueId], references: [id], onDelete: Cascade)
  payment         Payment? @relation("KaraokePayment")
  
  @@index([venueId])
  @@index([venueId, status])
  @@index([venueId, queuePosition])
}

enum KaraokeStatus {
  PENDING      // Waiting in queue
  CURRENT      // Currently singing
  COMPLETED    // Finished singing
  SKIPPED      // Skipped by venue owner
  CANCELLED    // Cancelled by singer
}
```

#### 2.2 Song Selection for Karaoke
**Status:** 🔴 Not Started

**Description:**
- Singers select their song when joining queue
- Search karaoke-available tracks
- Filter by language, genre, difficulty
- Preview song before selecting

**Requirements:**
- [ ] Karaoke track search (Spotify + karaoke metadata)
- [ ] Song preview (30-second preview)
- [ ] Language filter
- [ ] Genre filter
- [ ] Difficulty rating (if available)
- [ ] Popular karaoke songs list
- [ ] Recent songs (avoid duplicates in same session)
- [ ] Song selection UI (bot + microsite)

#### 2.3 Payment Integration
**Status:** 🔴 Not Started

**Description:**
- Charge per karaoke session
- Optional: Charge per song
- Payment before singing (or pay-as-you-go)
- Refund handling for skipped/cancelled sessions

**Requirements:**
- [ ] Payment before queue entry (optional)
- [ ] Payment per song
- [ ] Payment integration with existing credit system
- [ ] Refund for cancelled sessions
- [ ] Payment status tracking
- [ ] Receipt generation

#### 2.4 Lyrics Display System
**Status:** 🔴 Not Started

**Description:**
- Real-time lyrics display for singer
- Public microsite section for lyrics
- Venue owner can project lyrics on TV/screen
- Synchronized lyrics with music playback

**Requirements:**
- [ ] Lyrics API integration (Spotify, Musixmatch, or similar)
- [ ] Real-time lyrics synchronization
- [ ] Public lyrics page (e.g., `rockola.com/venue/{slug}/lyrics`)
- [ ] Full-screen mode for projection
- [ ] Auto-scroll lyrics
- [ ] Highlight current line
- [ ] Font size adjustment
- [ ] Background color themes
- [ ] Mobile-optimized for singer's phone
- [ ] QR code for easy access

**Technical Requirements:**
- [ ] Lyrics API integration
- [ ] WebSocket or Server-Sent Events for real-time updates
- [ ] Lyrics caching
- [ ] Fallback if lyrics unavailable

#### 2.5 Karaoke-Specific UI
**Status:** 🔴 Not Started

**Description:**
- Dedicated karaoke interface for venue owner
- Public queue display
- Current singer display
- Lyrics projection interface

**Requirements:**
- [ ] Venue owner karaoke dashboard
- [ ] Queue management interface
- [ ] Current singer display
- [ ] Public queue view (no auth required)
- [ ] Lyrics projection page
- [ ] Mobile app for venue owner (future)

#### 2.6 Bot Integration for Karaoke
**Status:** 🔴 Not Started

**Description:**
- Patrons join queue via bot
- Select song via bot
- Get queue updates via bot
- Receive notifications

**Requirements:**
- [ ] "Join karaoke queue" bot command
- [ ] Song selection via bot
- [ ] Queue position updates
- [ ] "Your turn is next" notification
- [ ] "Your turn now" notification
- [ ] Cancel queue entry via bot

**Acceptance Criteria:**
- [ ] Patrons can join karaoke queue via bot or microsite
- [ ] Singers can select their song
- [ ] Queue displays publicly
- [ ] Lyrics display in real-time
- [ ] Payment integration works
- [ ] Venue owner can manage queue

---

## 🎛️ Operating Mode Enhancements

### 3. Playlist Mode Enhancements

#### 3.1 Playlist Preview & Editing
**Priority:** P1  
**Status:** 🔴 Not Started

**Description:**
- Venue owner can preview playlist before playing
- Reorder songs in playlist
- Remove unwanted songs
- Add songs manually

**Requirements:**
- [ ] Playlist preview page
- [ ] Drag-and-drop reordering
- [ ] Remove song from playlist
- [ ] Add song manually
- [ ] Playlist statistics (duration, genre distribution)
- [ ] Export playlist

#### 3.2 Playlist Analytics
**Priority:** P2  
**Status:** 🔴 Not Started

**Description:**
- Most requested artists
- Genre distribution
- Request timeline
- Popular songs

**Requirements:**
- [ ] Analytics dashboard
- [ ] Charts and graphs
- [ ] Export analytics data
- [ ] Time-based analytics

### 4. Automation Mode Enhancements

#### 4.1 Empty Queue Intelligence
**Priority:** P1  
**Status:** 🔴 Not Started

**Description:**
- When queue is empty, use rules to select Spotify recommendations
- Rules apply to ALL music (requests + recommendations)
- This is the KEY differentiator for Automation Mode

**Requirements:**
- [ ] Detect empty queue
- [ ] Query Spotify recommendations API
- [ ] Filter recommendations through rules
- [ ] Auto-add filtered recommendations to queue
- [ ] Log recommendation selections

#### 4.2 Smart Queue Management
**Priority:** P1  
**Status:** 🔴 Not Started

**Description:**
- Auto-skip duplicates
- Balance genres
- Prevent same artist back-to-back
- Optimize queue order

**Requirements:**
- [ ] Duplicate detection
- [ ] Genre balancing algorithm
- [ ] Artist spacing rules
- [ ] Queue optimization

#### 4.3 Time-Based Rule Automation
**Priority:** P1  
**Status:** 🔴 Not Started

**Description:**
- Different rules for different times
- Automatic rule switching
- Time-based playlist switching

**Requirements:**
- [ ] Time-based rule scheduling
- [ ] Automatic rule activation/deactivation
- [ ] Playlist switching based on time
- [ ] Rule transition handling

#### 4.4 Time-Based Request Limits (Available Time Control)
**Priority:** P1  
**Status:** 🔴 Not Started

**Description:**
- Track total duration of queued songs
- Compare against venue's remaining opening hours
- Stop accepting requests when no time left
- Guarantee paid/credited requests will play
- Optional feature (venue owner can enable/disable)

**Use Case:**
- Bar opens 11 PM - 5 AM (6 hours = 360 minutes)
- Patrons request songs throughout the night
- System tracks: "120 minutes of songs queued, 240 minutes remaining"
- When remaining time < 0: Stop accepting new requests
- Ensures all paid requests will play before closing

**Requirements:**
- [ ] Venue opening/closing hours configuration
- [ ] Track total duration of queued songs
- [ ] Calculate remaining available time
- [ ] Stop accepting requests when time runs out
- [ ] Show remaining time to venue owner
- [ ] Show remaining time to patrons (via bot)
- [ ] Handle edge cases:
  - [ ] Songs already playing (don't count in queue)
  - [ ] Skipped songs (remove from time calculation)
  - [ ] Time zone handling
  - [ ] Day rollover (e.g., 11 PM - 5 AM next day)
- [ ] Optional feature toggle (enable/disable per venue)
- [ ] Buffer time configuration (e.g., "stop 30 min before closing")

**Database Schema:**
```prisma
model Venue {
  // ... existing fields
  timeBasedRequestLimitsEnabled Boolean @default(false)
  openingTime                   String?  // "23:00" (11 PM)
  closingTime                   String?  // "05:00" (5 AM next day)
  timeLimitBufferMinutes        Int?     @default(0) // Stop accepting X min before closing
}

// Track queued song durations
model SongRequest {
  // ... existing fields
  durationSeconds Int?  // Track duration in seconds (from Spotify)
  estimatedPlayTime DateTime? // When this song is expected to play
}
```

**Calculation Logic:**
```typescript
interface TimeAvailability {
  totalOpeningMinutes: number;      // e.g., 360 (6 hours)
  queuedSongsMinutes: number;       // Sum of all queued song durations
  currentlyPlayingMinutes: number;  // Duration of current song
  remainingMinutes: number;         // Available time for new requests
  bufferMinutes: number;            // Buffer before closing
  canAcceptRequests: boolean;       // true if remaining > buffer
}

function calculateTimeAvailability(venue: Venue): TimeAvailability {
  const now = new Date();
  const openingTime = parseTime(venue.openingTime); // e.g., 23:00
  const closingTime = parseTime(venue.closingTime); // e.g., 05:00 (next day)
  
  // Calculate total opening minutes
  const totalMinutes = calculateTimeDifference(openingTime, closingTime);
  
  // Get all queued songs (status: QUEUED, PENDING)
  const queuedSongs = await getQueuedSongs(venue.id);
  const queuedMinutes = queuedSongs.reduce((sum, song) => 
    sum + (song.durationSeconds / 60), 0
  );
  
  // Get currently playing song
  const currentSong = await getCurrentPlayingSong(venue.id);
  const currentMinutes = currentSong ? (currentSong.durationSeconds / 60) : 0;
  
  // Calculate remaining time
  const elapsedMinutes = calculateElapsedTime(openingTime, now);
  const remainingMinutes = totalMinutes - elapsedMinutes - queuedMinutes - currentMinutes;
  
  // Check if can accept requests
  const bufferMinutes = venue.timeLimitBufferMinutes || 0;
  const canAcceptRequests = remainingMinutes > bufferMinutes;
  
  return {
    totalOpeningMinutes: totalMinutes,
    queuedSongsMinutes: queuedMinutes,
    currentlyPlayingMinutes: currentMinutes,
    remainingMinutes: Math.max(0, remainingMinutes),
    bufferMinutes,
    canAcceptRequests
  };
}
```

**UI Elements:**
- [ ] Venue settings: Enable/disable time-based limits
- [ ] Opening/closing time picker
- [ ] Buffer time configuration
- [ ] Real-time dashboard showing:
  - [ ] Total opening hours
  - [ ] Queued songs duration
  - [ ] Remaining time
  - [ ] Can accept requests? (Yes/No)
- [ ] Bot message when time runs out: "Sorry, we've reached our time limit for tonight. No more requests accepted."

**API Endpoints:**
- `GET /api/venues/[venueId]/time-availability` - Get current time availability
- `POST /api/venues/[venueId]/song-requests` - Validate time availability before creating request

**Acceptance Criteria:**
- [ ] Venue owner can enable/disable time-based request limits
- [ ] Venue owner can set opening/closing hours
- [ ] System tracks total duration of queued songs
- [ ] System calculates remaining time accurately
- [ ] System stops accepting requests when time runs out
- [ ] Clear error message: "No more requests accepted - time limit reached"
- [ ] Dashboard shows real-time availability
- [ ] Bot informs patrons when time limit reached
- [ ] Handles day rollover correctly (e.g., 11 PM - 5 AM)
- [ ] Handles skipped songs (removes from calculation)

---

## 🎭 Crowd Feedback & Auto-Moderation System

**Priority:** P1  
**Status:** 🔴 Not Started  
**Epic:** Core Functionality

### Description
Enable patrons to provide real-time feedback on currently playing music via chatbot. System aggregates sentiment and automatically moderates playback based on crowd reactions.

### Use Cases
- **Live Venues**: Crowd votes on songs, system auto-skips unpopular tracks
- **Energy Management**: Amplify good vibes, reduce bad energy
- **Crowd-Driven Curation**: Let the crowd shape the music experience
- **Free Engagement**: Patrons can influence music without paying

### Features

#### 9.1 Feedback Collection System
**Status:** 🔴 Not Started

**Description:**
- Patrons can react to currently playing music via chatbot
- Multiple reaction types with sentiment scores
- Free to use (no payment required)
- Real-time aggregation per track

**Requirements:**
- [ ] Emoji reaction support:
  - 👍 Thumbs Up (+1 sentiment)
  - 👎 Thumbs Down (-1 sentiment)
  - 🔥 Fire (+2 sentiment - very positive)
  - 💩 Poop (-2 sentiment - very negative)
- [ ] Text-based reactions:
  - "Love this song" (+1)
  - "Skip this" (-1)
  - "This is fire!" (+2)
  - "Hate this" (-2)
- [ ] Reaction collection via bot:
  - Bot prompts: "Now playing 🎵 [Song Name]. How's the vibe? 👍 👎 💩 🔥"
  - Patron responds with emoji or text
  - AI classifies intent as `feedback_reaction`
- [ ] Reaction storage:
  - Link reaction to current playing track
  - Store patron identifier (for duplicate prevention)
  - Timestamp and sentiment score
- [ ] Duplicate prevention:
  - One reaction per patron per track
  - Allow updating reaction (change from 👍 to 🔥)

**Database Schema:**
```prisma
model Reaction {
  id              String   @id @default(uuid())
  venueId         String
  songRequestId   String?  // Link to song request if applicable
  spotifyTrackId  String   // Current playing track
  patronIdentifier String  // WhatsApp phone, Telegram ID, etc.
  platform        String   // "whatsapp", "telegram"
  reactionType    ReactionType
  sentimentScore  Float    // -2.0 to +2.0
  textFeedback    String?  // Optional text comment
  createdAt       DateTime @default(now())
  
  venue           Venue    @relation(fields: [venueId], references: [id], onDelete: Cascade)
  
  @@unique([venueId, spotifyTrackId, patronIdentifier]) // One reaction per patron per track
  @@index([venueId, spotifyTrackId])
  @@index([venueId, createdAt])
}

enum ReactionType {
  THUMBS_UP
  THUMBS_DOWN
  FIRE
  POOP
  TEXT_POSITIVE
  TEXT_NEGATIVE
}
```

**API Endpoints:**
- `POST /api/venues/[venueId]/reactions` - Submit reaction
- `GET /api/venues/[venueId]/reactions/current` - Get reactions for current track
- `GET /api/venues/[venueId]/reactions/stats` - Get aggregated sentiment stats

#### 9.2 Sentiment Aggregation Engine
**Status:** 🔴 Not Started

**Description:**
- Aggregate reactions per track in real-time
- Calculate average sentiment scores
- Track reaction counts and distribution
- Rolling window analysis (last X minutes)

**Requirements:**
- [ ] Real-time aggregation:
  - Calculate average sentiment per track
  - Count total reactions
  - Track reaction distribution (how many 👍, 👎, 🔥, 💩)
- [ ] Rolling window:
  - Analyze reactions in last 5 minutes
  - Weight recent reactions more heavily
  - Handle tracks that just started vs. tracks playing longer
- [ ] Per-venue thresholds:
  - Configurable minimum reactions before auto-moderation
  - Configurable sentiment thresholds
  - Venue owner can disable auto-moderation
- [ ] Aggregation API:
  - `GET /api/venues/[venueId]/sentiment/current` - Current track sentiment
  - `GET /api/venues/[venueId]/sentiment/history` - Historical sentiment data

**Aggregation Logic:**
```typescript
interface TrackSentiment {
  trackId: string;
  trackName: string;
  artistName: string;
  totalReactions: number;
  averageSentiment: number; // -2.0 to +2.0
  distribution: {
    fire: number;
    thumbsUp: number;
    thumbsDown: number;
    poop: number;
  };
  timeWindow: number; // minutes
  lastUpdated: Date;
}
```

#### 9.3 Auto-Moderation System
**Status:** 🔴 Not Started

**Description:**
- Automatically skip tracks with negative sentiment
- Amplify positive tracks (queue similar songs)
- Switch playlists if multiple bad tracks
- Configurable thresholds per venue

**Requirements:**
- [ ] Auto-skip logic:
  - If `avgSentiment < -0.5` AND `totalReactions >= minReactions`:
    - Skip current track via Spotify API
    - Log auto-skip event
    - Notify venue owner (optional)
- [ ] Amplify positive tracks:
  - If `avgSentiment > 0.8`:
    - Use Spotify recommendations API
    - Queue similar tracks
    - Log amplification event
- [ ] Playlist switching:
  - If 2+ consecutive tracks have `avgSentiment < -0.3`:
    - Switch to "safer" playlist (if configured)
    - Alert venue owner
- [ ] Configurable thresholds:
  - Venue owner can set:
    - Minimum reactions before auto-skip
    - Sentiment threshold for skip
    - Sentiment threshold for amplification
    - Enable/disable auto-moderation
- [ ] n8n workflow:
  - Monitor current track every 30 seconds
  - Query reactions for current track
  - Calculate sentiment
  - Execute Spotify actions if thresholds met

**Auto-Moderation Rules:**
```typescript
interface AutoModerationConfig {
  enabled: boolean;
  minReactionsForSkip: number; // Default: 5
  sentimentThresholdForSkip: number; // Default: -0.5
  sentimentThresholdForAmplify: number; // Default: 0.8
  consecutiveBadTracksForPlaylistSwitch: number; // Default: 2
  safePlaylistId?: string; // Playlist to switch to if needed
}
```

#### 9.4 Bot Integration for Feedback
**Status:** 🔴 Not Started

**Description:**
- Bot prompts patrons for feedback when track starts
- Bot processes reaction messages
- Bot provides feedback on sentiment

**Requirements:**
- [ ] Track start notification:
  - When new track starts playing, bot sends to active patrons:
    - "Now playing 🎵 [Song Name] - [Artist]. How's the vibe? 👍 👎 💩 🔥"
  - Only send to patrons who have interacted recently (last 30 min)
- [ ] Reaction processing:
  - Patron responds with emoji or text
  - AI classifies as `feedback_reaction` intent
  - Extract reaction type and sentiment
  - Store reaction in database
  - Confirm reaction: "Thanks! Your 👍 has been recorded."
- [ ] Feedback queries:
  - Patron can ask: "How do people like this song?"
  - Bot responds with current sentiment stats
- [ ] Reaction updates:
  - Patron can change reaction: "Actually, I hate this 💩"
  - Update existing reaction

**Bot Flow:**
```
[Track Starts Playing]
  ↓
[Bot: "Now playing 🎵 Song - Artist. How's the vibe? 👍 👎 💩 🔥"]
  ↓
[Patron: "👍"]
  ↓
[AI: intent = "feedback_reaction", reactionType = "THUMBS_UP", sentiment = 1.0]
  ↓
[Store Reaction]
  ↓
[Bot: "Thanks! Your 👍 has been recorded."]
```

#### 9.5 Sentiment Analytics Dashboard
**Status:** 🔴 Not Started

**Description:**
- Real-time sentiment visualization
- Historical sentiment trends
- Track popularity analysis
- Crowd energy graph

**Requirements:**
- [ ] Real-time dashboard:
  - Current track sentiment gauge
  - Reaction count display
  - Reaction distribution chart
  - Live sentiment updates
- [ ] Historical analytics:
  - Sentiment over time graph
  - Most loved tracks
  - Most hated tracks
  - Average sentiment per hour/day
- [ ] Track analytics:
  - Sentiment score per track
  - Reaction count per track
  - Skip rate (auto-skipped vs. completed)
- [ ] Energy graph:
  - Crowd energy over time
  - Correlate with track genres
  - Identify peak energy times

**UI Components:**
- [ ] Sentiment gauge (current track)
- [ ] Reaction distribution pie chart
- [ ] Sentiment timeline graph
- [ ] Top tracks by sentiment
- [ ] Auto-moderation events log

#### 9.6 n8n Workflow Integration
**Status:** 🔴 Not Started

**Description:**
- n8n workflows for sentiment monitoring
- Auto-moderation execution
- Real-time reaction processing

**Requirements:**
- [ ] Sentiment Monitor Workflow:
  - Trigger: Every 30 seconds
  - Get current playing track per venue
  - Query reactions for current track (last 5 minutes)
  - Calculate sentiment
  - Check thresholds
  - Execute actions (skip/amplify/switch playlist)
- [ ] Reaction Processing Workflow:
  - Trigger: Webhook from bot (reaction received)
  - Validate reaction
  - Store in database
  - Update sentiment cache
  - Trigger real-time updates
- [ ] Track Start Notification Workflow:
  - Trigger: Track change detected
  - Get active patrons (recent interactions)
  - Send feedback prompt via bot
  - Log notification

**Acceptance Criteria:**
- [ ] Patrons can react to current track via bot
- [ ] Reactions are stored and aggregated
- [ ] System auto-skips tracks with negative sentiment
- [ ] System amplifies tracks with positive sentiment
- [ ] Venue owner can configure thresholds
- [ ] Real-time sentiment dashboard works
- [ ] Historical analytics available

**Technical Notes:**
- Reactions are FREE (no payment required)
- Only works in Automation Mode (requires playback control)
- Can be enabled/disabled per venue
- Requires active Spotify playback monitoring

---

## 🔧 Infrastructure & Technical

### 5. Performance & Scalability

#### 5.1 Caching Layer
**Priority:** P2  
**Status:** 🔴 Not Started

- [ ] Redis integration for caching
- [ ] Catalog caching
- [ ] Spotify API response caching
- [ ] Queue state caching

#### 5.2 Rate Limiting Improvements
**Priority:** P2  
**Status:** 🔴 Not Started

- [ ] Per-venue rate limiting
- [ ] Per-patron rate limiting
- [ ] Dynamic rate limit adjustment
- [ ] Rate limit dashboard

### 6. Monitoring & Observability

#### 6.1 Enhanced Logging
**Priority:** P2  
**Status:** 🟡 In Progress (partially implemented)

- [x] Structured JSON logging
- [x] Database operation logging
- [x] n8n webhook logging
- [ ] Request/response logging
- [ ] Performance metrics logging

#### 6.2 Analytics Dashboard
**Priority:** P2  
**Status:** 🔴 Not Started

- [ ] Venue analytics
- [ ] Request statistics
- [ ] Revenue analytics
- [ ] User engagement metrics

---

## 🎨 UI/UX Improvements

### 7. User Experience Enhancements

#### 7.1 Mobile App (Future)
**Priority:** P3  
**Status:** 🔴 Not Started

- [ ] React Native app for venue owners
- [ ] Queue management on mobile
- [ ] Push notifications
- [ ] Offline mode

#### 7.2 Public Microsite Enhancements
**Priority:** P1 (for Catalogue Mode)  
**Status:** 🔴 Not Started

- [ ] Beautiful catalog browsing
- [ ] Song preview integration
- [ ] Social sharing
- [ ] Playlist creation from catalog

---

## 🔐 Security & Compliance

### 8. Security Enhancements

#### 8.1 Enhanced Authentication
**Priority:** P2  
**Status:** 🔴 Not Started

- [ ] Two-factor authentication
- [ ] SSO integration
- [ ] API key rotation
- [ ] Session management improvements

#### 8.2 Data Privacy
**Priority:** P2  
**Status:** 🔴 Not Started

- [ ] GDPR compliance
- [ ] Data export
- [ ] Data deletion
- [ ] Privacy policy updates

---

## 📊 Feature Comparison Matrix

| Feature | Open Requests | Catalogue Requests | Karaoke Mode |
|---------|--------------|-------------------|--------------|
| Song Selection | Any Spotify song | Only from catalog | Karaoke tracks only |
| Bot Interface | ✅ | ✅ | ✅ |
| Public Microsite | ❌ | ✅ | ✅ |
| Queue Management | ✅ | ✅ | ✅ (singer queue) |
| Payment | ✅ | ✅ | ✅ |
| Lyrics Display | ❌ | ❌ | ✅ |
| Rules Filtering | ✅ | ✅ (catalog + rules) | ✅ |
| Feedback System | ✅ (Automation Mode) | ✅ (Automation Mode) | ✅ |
| Auto-Moderation | ✅ (Automation Mode) | ✅ (Automation Mode) | ✅ |
| Time-Based Limits | ❌ | ❌ | ✅ (Automation Mode) |
| Guarantee Playback | ❌ | ❌ | ✅ (via time limits) |

---

## 🎯 Priority Roadmap

### Q1 2025 (Current)
1. 🟡 **Playlist Mode Basic Implementation** (40% Complete)
   - ✅ Database schema & n8n infrastructure
   - 🟡 Auto-create playlist on venue creation (in progress)
   - 🔴 Display playlist link in UI (not started)
   - 🔴 Add songs to playlist API (not started)
2. ✅ **n8n Webhook Integration** (Infrastructure complete)
   - ✅ Webhook client library
   - ✅ Security (HMAC signatures)
   - ✅ Comprehensive logging
   - 🟡 Integration with venue creation (in progress)
3. 🔴 **Max Requests Per User** (P1 - Critical for Playlist Mode)
   - 🔴 Database schema updates
   - 🔴 Request limit configuration UI
   - 🔴 Request count tracking
   - 🔴 Limit enforcement logic
4. 🔴 **Rules System Implementation**
   - ✅ Database schema (VenueRule model)
   - ✅ Webhook function (validateRules)
   - 🔴 Rules editor UI
   - 🔴 Rules validation API
   - 🔴 Rules engine integration
5. 🔴 **Automation Mode Core Features**
   - 🔴 Queue management
   - 🔴 Playback control
   - 🔴 Device switching

### Q2 2025
1. 🔴 **Crowd Feedback System** (P1 - High Priority)
   - Reaction collection via bot
   - Sentiment aggregation engine
   - Auto-moderation system
2. 🔴 **Time-Based Request Limits** (P1 - Critical for Automation Mode)
   - Track queued song durations
   - Calculate remaining opening time
   - Stop accepting requests when time runs out
   - Guarantee paid requests will play
3. 🔴 Catalogue Requests Mode
4. 🔴 Public Microsite for Catalog
5. 🔴 Empty Queue Intelligence
6. 🔴 Playlist Preview & Editing

### Q3 2025
1. 🔴 Karaoke Mode Core
2. 🔴 Lyrics Display System
3. 🔴 Smart Queue Management
4. 🔴 Time-Based Rule Automation

### Q4 2025
1. 🔴 Analytics Dashboard
2. 🔴 Mobile App (MVP)
3. 🔴 Performance Optimizations
4. 🔴 Security Enhancements

---

## 📝 Notes

- This backlog is a living document and will be updated regularly
- Priorities may shift based on user feedback and business needs
- Features marked as "Under Consideration" need more research/validation
- Each feature should have detailed technical specifications before implementation

---

## 🔗 Related Documents

- [SIMPLIFIED-VENUE-MODES.md](./SIMPLIFIED-VENUE-MODES.md) - Operating modes specification
- [VENUE-MODES-USE-CASES.md](./VENUE-MODES-USE-CASES.md) - Use case analysis
- [IMPLEMENTATION-TASKS-SIMPLIFIED-MODES.md](./IMPLEMENTATION-TASKS-SIMPLIFIED-MODES.md) - Current implementation tasks
- [ROCKOLA-API-FOR-N8N.md](./ROCKOLA-API-FOR-N8N.md) - API documentation
- [N8N-WEBHOOKS-SPECIFICATION.md](./N8N-WEBHOOKS-SPECIFICATION.md) - Webhook specifications


---

### More product ideas
- Set song request price based on time slots: Venue owners can set different credit cost per song request, based on time rules (e.g. from 8 to 9 pm: 1 credit = 2 songs; from 9pm to 0am: 1 credit = 1 song).

- Physical catalogue: we build a system to check in physical records or vinyls, that will be added to the catalogue. This operation mode is for live parties in with the invitees bring their records -> gives the record to the moderator -> moderator uploads a photo and data to rockola app -> we add that record to the venue's microsite catalogue -> people can vote for records -> Dj plays voted record -> Moderator sets (we are currently playing X song, from Y album, brought by Z invitee) -> microsite shows currently playing data -> we disable the played record from avaiable (marked as already played). Note this is ONLY available for analogue kind of parties, is not intended to integrate to spotify and we will design a whole new workflow for this.