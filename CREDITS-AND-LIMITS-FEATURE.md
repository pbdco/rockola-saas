# 💳 Credits & Request Limits System

## 📋 Overview

Rockola uses a **flexible credit system** combined with **request limits** to control how patrons can request music. This system applies to **all operating modes** but is especially important for **Playlist Mode** use cases like party planning.

---

## 🎯 Core Concepts

### 1. Credit Cost Per Request
- **Configurable**: Venue owner sets cost per song request
- **Range**: $0 (free) to unlimited
- **Purpose**: Monetize requests OR make them free
- **Example**: 
  - Free requests: `creditPerSong = 0`
  - Paid requests: `creditPerSong = 2.99` (USD)

### 2. Max Requests Per User
- **Configurable**: Venue owner sets maximum requests per patron
- **Range**: 1 to unlimited (or no limit)
- **Purpose**: Limit how many songs each patron can request
- **Example**:
  - Party playlist: `maxRequestsPerUser = 2` (each guest gets 2 free songs)
  - Unlimited: `maxRequestsPerUser = null` (no limit)

### 3. Combined Filtering
Requests must pass **ALL** of these checks:
1. ✅ **Credit Balance**: Patron has enough credits (if cost > 0)
2. ✅ **Request Limit**: Patron hasn't exceeded max requests
3. ✅ **Music Rules**: Song passes genre/artist/explicit/time rules
4. ✅ **Catalog Check**: Song is in catalog (if Catalogue Mode)

---

## 🎉 Use Case: Party Playlist Planning

### Scenario
**Wedding Reception** - Couple wants guests to collaborate on playlist

### Configuration
```json
{
  "mode": "PLAYLIST",
  "creditPerSong": 0,           // Free requests
  "maxRequestsPerUser": 2,      // Each guest can request 2 songs
  "rules": [
    {
      "type": "CONTENT",
      "description": "No explicit content",
      "action": "deny_explicit"
    },
    {
      "type": "GENRE",
      "description": "Only wedding-appropriate genres",
      "allowedGenres": ["pop", "r&b", "soul", "jazz"]
    }
  ]
}
```

### How It Works
1. Guest requests song #1 → ✅ Free, within limit, passes rules → Added to playlist
2. Guest requests song #2 → ✅ Free, within limit, passes rules → Added to playlist
3. Guest requests song #3 → ❌ "You've reached your limit of 2 requests"
4. Guest requests explicit song → ❌ "This song doesn't match venue rules"

### Benefits
- ✅ Fair distribution (everyone gets equal requests)
- ✅ Quality control (rules filter inappropriate content)
- ✅ No cost to guests (free requests)
- ✅ Collaborative playlist building

---

## 🍺 Use Case: Live Bar with Paid Requests

### Scenario
**Nightclub** - Charge for requests, but limit spam

### Configuration
```json
{
  "mode": "AUTOMATION",
  "creditPerSong": 4.99,       // $4.99 per request
  "maxRequestsPerUser": 5,     // Max 5 paid requests per night
  "rules": [
    {
      "type": "TIME",
      "description": "No slow songs after midnight",
      "timeRange": "00:00-03:00",
      "action": "deny_slow_songs"
    }
  ]
}
```

### How It Works
1. Patron requests song → ✅ Has credits, within limit, passes rules → Charged $4.99, added to queue
2. Patron requests 5th song → ✅ Has credits, within limit → Charged, added
3. Patron requests 6th song → ❌ "You've reached your limit of 5 requests tonight"
4. Patron requests slow song at 1 AM → ❌ "No slow songs after midnight"

### Benefits
- ✅ Revenue generation (paid requests)
- ✅ Prevents abuse (max requests per user)
- ✅ Quality control (time-based rules)
- ✅ Fair access (everyone gets same limit)

---

## 🎵 Use Case: Catalogue Mode with Limits

### Scenario
**80s Night Event** - Only 80s music, limited requests per person

### Configuration
```json
{
  "mode": "PLAYLIST",
  "requestMode": "CATALOGUE",
  "catalog": {
    "playlists": ["80s Hits Playlist"],
    "albums": ["Thriller", "Like a Virgin"]
  },
  "creditPerSong": 0,           // Free
  "maxRequestsPerUser": 3,      // 3 songs per person
  "rules": [
    {
      "type": "GENRE",
      "description": "Only 80s music",
      "allowedGenres": ["80s", "new wave", "synth-pop"]
    }
  ]
}
```

### How It Works
1. Patron requests "Billie Jean" → ✅ In catalog, free, within limit, passes rules → Added
2. Patron requests "Bohemian Rhapsody" (70s) → ❌ Not in 80s catalog
3. Patron requests 4th song → ❌ "You've reached your limit of 3 requests"

### Benefits
- ✅ Theme enforcement (catalog + rules)
- ✅ Fair distribution (max requests)
- ✅ Free engagement (no cost)
- ✅ Quality curation (catalog + rules)

---

## 🏗️ Technical Implementation

### Database Schema

```prisma
model Venue {
  // ... existing fields
  creditPerSong      Decimal?  @db.Decimal(10, 2)  // Cost per request (can be 0)
  maxRequestsPerUser Int?                          // Max requests per patron (null = unlimited)
  currency           String?   @default("USD")
}

model VenueClient {
  id                String   @id @default(uuid())
  venueId           String
  identifier        String   // WhatsApp phone, Telegram ID, etc.
  platform          String   // "whatsapp", "telegram"
  credits           Decimal  @default(0) @db.Decimal(10, 2)
  totalRequests     Int      @default(0)  // Total requests made
  lastRequestAt      DateTime?
  // ... other fields
  
  @@unique([venueId, identifier, platform])
  @@index([venueId, identifier])
}
```

### Request Validation Flow

```typescript
async function validateSongRequest(
  venue: Venue,
  client: VenueClient,
  track: SpotifyTrack
): Promise<ValidationResult> {
  // 1. Check credit cost
  if (venue.creditPerSong && venue.creditPerSong > 0) {
    if (client.credits < venue.creditPerSong) {
      return {
        valid: false,
        error: "Insufficient credits",
        message: `You need ${venue.creditPerSong} credits. You have ${client.credits}.`
      };
    }
  }
  
  // 2. Check max requests per user
  if (venue.maxRequestsPerUser) {
    const requestsToday = await getRequestCountToday(venue.id, client.id);
    if (requestsToday >= venue.maxRequestsPerUser) {
      return {
        valid: false,
        error: "Request limit exceeded",
        message: `You've reached your limit of ${venue.maxRequestsPerUser} requests.`
      };
    }
  }
  
  // 3. Check music rules
  const rulesResult = await validateAgainstRules(venue, track);
  if (!rulesResult.valid) {
    return {
      valid: false,
      error: "Rule violation",
      message: rulesResult.message
    };
  }
  
  // 4. Check catalog (if Catalogue Mode)
  if (venue.requestMode === 'CATALOGUE') {
    const inCatalog = await checkCatalog(venue.id, track.id);
    if (!inCatalog) {
      return {
        valid: false,
        error: "Not in catalog",
        message: "This song is not available in the venue's catalog."
      };
    }
  }
  
  // All checks passed
  return { valid: true };
}
```

### Credit Deduction

```typescript
async function processSongRequest(venue: Venue, client: VenueClient, track: SpotifyTrack) {
  // Validate first
  const validation = await validateSongRequest(venue, client, track);
  if (!validation.valid) {
    throw new Error(validation.message);
  }
  
  // Deduct credits (if cost > 0)
  if (venue.creditPerSong && venue.creditPerSong > 0) {
    await deductCredits(client.id, venue.creditPerSong);
    await createCreditTransaction({
      clientId: client.id,
      venueId: venue.id,
      amount: venue.creditPerSong,
      type: 'SONG_REQUEST',
      description: `Song request: ${track.name}`
    });
  }
  
  // Increment request count
  await incrementRequestCount(client.id);
  
  // Create song request
  const songRequest = await createSongRequest({
    venueId: venue.id,
    clientId: client.id,
    trackId: track.id,
    trackName: track.name,
    artistName: track.artist,
    status: 'PENDING'
  });
  
  return songRequest;
}
```

---

## 🎛️ Venue Owner Configuration

### UI Elements

**Credit & Limits Settings:**
```
┌─────────────────────────────────────┐
│ Credit & Request Limits             │
├─────────────────────────────────────┤
│ Cost per Request:                   │
│ [ $0.00 ] USD                       │
│ ℹ️ Set to $0 for free requests      │
│                                     │
│ Max Requests Per User:              │
│ [ 2 ] requests                       │
│ ☐ Unlimited (no limit)               │
│ ℹ️ Limit how many songs each        │
│    patron can request               │
│                                     │
│ Currency:                            │
│ [ USD ▼ ]                           │
└─────────────────────────────────────┘
```

### Use Case Presets

**Party Playlist:**
- Cost: $0
- Max Requests: 2-3 per user
- Rules: Content filtering (no explicit)

**Live Bar:**
- Cost: $2.99 - $4.99
- Max Requests: 5-10 per user
- Rules: Time-based, genre restrictions

**Unlimited Free:**
- Cost: $0
- Max Requests: Unlimited
- Rules: Basic content filtering

---

## 📊 Request Limit Tracking

### Per-User Tracking
- Track total requests per `VenueClient`
- Reset options:
  - **Daily**: Reset at midnight
  - **Per Session**: Reset when venue closes
  - **Never**: Cumulative limit (e.g., "max 10 requests total")

### Implementation
```typescript
interface RequestLimitConfig {
  maxRequestsPerUser: number | null;  // null = unlimited
  resetPeriod: 'DAILY' | 'SESSION' | 'NEVER';
  sessionStartTime?: DateTime;        // For SESSION reset
}

async function checkRequestLimit(
  venue: Venue,
  client: VenueClient
): Promise<boolean> {
  if (!venue.maxRequestsPerUser) {
    return true; // No limit
  }
  
  const requestCount = await getRequestCount(
    venue.id,
    client.id,
    venue.requestLimitConfig.resetPeriod
  );
  
  return requestCount < venue.maxRequestsPerUser;
}
```

---

## 🎯 Key Benefits

### For Venue Owners
1. **Control Access**: Limit who can request and how much
2. **Monetization**: Charge for requests (or make them free)
3. **Fair Distribution**: Ensure everyone gets equal opportunity
4. **Quality Control**: Combine with rules for content filtering
5. **Flexibility**: Works for free parties or paid venues

### For Patrons
1. **Clear Limits**: Know exactly how many requests they have
2. **Fair System**: Everyone gets same opportunity
3. **Free Option**: Can be completely free ($0 cost)
4. **Transparency**: Clear error messages when limits reached

### For Platform
1. **Revenue**: Optional paid requests generate revenue
2. **Engagement**: Free requests drive engagement
3. **Scalability**: Limits prevent abuse
4. **Flexibility**: Works for all use cases

---

## 🔗 Integration Points

### With Music Rules
- Rules filter WHAT can be requested
- Credits/Limits filter WHO can request and HOW MUCH
- Combined: "Guest can request 2 free songs, but only from allowed genres"

### With Catalogue Mode
- Catalogue filters WHAT songs are available
- Credits/Limits filter access to catalog
- Combined: "Guest can request 3 songs from our 80s catalog, free of charge"

### With Automation Mode
- Same credit/limit system applies
- Auto-moderation can skip paid requests (refund credits)
- Sentiment can influence future request limits

---

## 📝 Configuration Examples

### Example 1: Free Party Playlist
```json
{
  "creditPerSong": 0,
  "maxRequestsPerUser": 2,
  "resetPeriod": "NEVER"
}
```
**Result**: Each guest can request 2 free songs total

### Example 2: Paid Bar with Daily Limit
```json
{
  "creditPerSong": 3.99,
  "maxRequestsPerUser": 5,
  "resetPeriod": "DAILY"
}
```
**Result**: Each patron can request up to 5 songs per day at $3.99 each

### Example 3: Unlimited Free
```json
{
  "creditPerSong": 0,
  "maxRequestsPerUser": null,
  "resetPeriod": "NEVER"
}
```
**Result**: Unlimited free requests (only limited by rules)

### Example 4: High-Value Requests
```json
{
  "creditPerSong": 9.99,
  "maxRequestsPerUser": 1,
  "resetPeriod": "SESSION"
}
```
**Result**: Each patron gets 1 premium request per session at $9.99

---

## ✅ Acceptance Criteria

- [ ] Venue owner can set `creditPerSong` (0 to unlimited)
- [ ] Venue owner can set `maxRequestsPerUser` (1 to unlimited, or null)
- [ ] System validates credit balance before request
- [ ] System validates request count before request
- [ ] System combines credit + limit + rules validation
- [ ] Clear error messages for each validation failure
- [ ] Credits deducted only if cost > 0
- [ ] Request count incremented after successful request
- [ ] Request limits can reset daily, per session, or never
- [ ] UI shows patron their remaining requests
- [ ] UI shows patron their credit balance

---

## 🎯 Priority

**Priority:** P1 (High)  
**Status:** 🟡 Partially Implemented (credit system exists, max requests per user needs implementation)

This feature is **critical** for Playlist Mode use cases, especially party planning scenarios where fair distribution is important.
