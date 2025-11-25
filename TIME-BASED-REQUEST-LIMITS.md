# ⏰ Time-Based Request Limits (Available Time Control)

## 📋 Overview

**Feature:** Control song request acceptance based on available playing time  
**Mode:** Automation Mode only (requires playback control)  
**Priority:** P1 (High)  
**Status:** 🔴 Not Started

### Core Concept

Track the total duration of queued songs and compare it against the venue's remaining opening hours. When there's no more time available, stop accepting new requests to **guarantee that all paid/credited requests will actually play** before the venue closes.

---

## 🎯 Problem Statement

### The Challenge
- Patrons pay credits/money to request songs
- Venue has limited operating hours (e.g., 11 PM - 5 AM = 6 hours)
- If too many songs are requested, some won't play before closing
- **Result**: Patrons paid but their songs never played = bad experience

### The Solution
- Track total duration of all queued songs
- Calculate remaining opening time
- Stop accepting requests when time runs out
- **Guarantee**: All accepted requests will play before closing

---

## 💡 Use Case Examples

### Example 1: Nightclub (11 PM - 5 AM)

**Configuration:**
```json
{
  "mode": "AUTOMATION",
  "timeBasedRequestLimitsEnabled": true,
  "openingTime": "23:00",  // 11 PM
  "closingTime": "05:00",  // 5 AM (next day)
  "timeLimitBufferMinutes": 30  // Stop 30 min before closing
}
```

**Scenario:**
- Bar opens at 11 PM (360 minutes total)
- At 1 AM (120 minutes elapsed):
  - 180 minutes of songs queued
  - 60 minutes remaining (360 - 120 - 180)
  - ✅ Still accepting requests
- At 3 AM (240 minutes elapsed):
  - 120 minutes of songs queued
  - 0 minutes remaining (360 - 240 - 120)
  - ❌ **Stop accepting requests** (reached time limit)
- At 4:30 AM (330 minutes elapsed):
  - Buffer kicks in (30 min before 5 AM closing)
  - ❌ No new requests accepted

**Result**: All songs requested before 3 AM will play. No one pays for songs that won't play.

### Example 2: Restaurant (6 PM - 11 PM)

**Configuration:**
```json
{
  "mode": "AUTOMATION",
  "timeBasedRequestLimitsEnabled": true,
  "openingTime": "18:00",  // 6 PM
  "closingTime": "23:00",  // 11 PM
  "timeLimitBufferMinutes": 15  // Stop 15 min before closing
}
```

**Scenario:**
- Restaurant open 5 hours (300 minutes)
- At 9 PM (180 minutes elapsed):
  - 100 minutes of songs queued
  - 20 minutes remaining (300 - 180 - 100)
  - ⚠️ **Warning**: "Only 20 minutes of request time remaining"
- At 9:15 PM (195 minutes elapsed):
  - 105 minutes of songs queued
  - 0 minutes remaining
  - ❌ **Stop accepting requests**

---

## 🏗️ Technical Implementation

### Database Schema

```prisma
model Venue {
  // ... existing fields
  
  // Time-Based Request Limits
  timeBasedRequestLimitsEnabled Boolean @default(false)
  openingTime                   String?  // Format: "HH:MM" (e.g., "23:00")
  closingTime                   String?  // Format: "HH:MM" (e.g., "05:00")
  timeLimitBufferMinutes        Int?     @default(0) // Stop X min before closing
}

model SongRequest {
  // ... existing fields
  durationSeconds Int?  // Song duration from Spotify (in seconds)
  estimatedPlayTime DateTime? // When this song is expected to play
}
```

### Calculation Logic

```typescript
interface TimeAvailability {
  totalOpeningMinutes: number;      // Total venue operating time
  elapsedMinutes: number;            // Time since opening
  queuedSongsMinutes: number;        // Sum of queued song durations
  currentlyPlayingMinutes: number;   // Duration of current song
  remainingMinutes: number;           // Available time for new requests
  bufferMinutes: number;              // Buffer before closing
  canAcceptRequests: boolean;        // true if remaining > buffer
  timeUntilClosing: string;           // Human-readable: "2 hours 15 minutes"
}

async function calculateTimeAvailability(venueId: string): Promise<TimeAvailability> {
  const venue = await getVenue(venueId);
  
  if (!venue.timeBasedRequestLimitsEnabled) {
    return { canAcceptRequests: true }; // Feature disabled
  }
  
  const now = new Date();
  const openingTime = parseTimeToDate(venue.openingTime, now);
  const closingTime = parseTimeToDate(venue.closingTime, now, true); // May be next day
  
  // Calculate total opening minutes
  const totalMinutes = Math.floor((closingTime.getTime() - openingTime.getTime()) / (1000 * 60));
  
  // Calculate elapsed time since opening
  const elapsedMinutes = Math.floor((now.getTime() - openingTime.getTime()) / (1000 * 60));
  
  // Get all queued songs (status: QUEUED, PENDING)
  const queuedSongs = await prisma.songRequest.findMany({
    where: {
      venueId,
      status: { in: ['QUEUED', 'PENDING'] }
    },
    select: { durationSeconds: true }
  });
  
  const queuedMinutes = queuedSongs.reduce((sum, song) => {
    return sum + (song.durationSeconds ? song.durationSeconds / 60 : 0);
  }, 0);
  
  // Get currently playing song
  const currentSong = await prisma.songRequest.findFirst({
    where: {
      venueId,
      status: 'PLAYING'
    },
    select: { durationSeconds: true }
  });
  
  const currentMinutes = currentSong?.durationSeconds 
    ? currentSong.durationSeconds / 60 
    : 0;
  
  // Calculate remaining time
  const bufferMinutes = venue.timeLimitBufferMinutes || 0;
  const remainingMinutes = totalMinutes - elapsedMinutes - queuedMinutes - currentMinutes - bufferMinutes;
  
  const canAcceptRequests = remainingMinutes > 0;
  
  // Format time until closing
  const timeUntilClosing = formatTimeRemaining(remainingMinutes + bufferMinutes);
  
  return {
    totalOpeningMinutes: totalMinutes,
    elapsedMinutes: Math.max(0, elapsedMinutes),
    queuedSongsMinutes: queuedMinutes,
    currentlyPlayingMinutes: currentMinutes,
    remainingMinutes: Math.max(0, remainingMinutes),
    bufferMinutes,
    canAcceptRequests,
    timeUntilClosing
  };
}
```

### Request Validation

```typescript
async function validateTimeAvailability(
  venueId: string,
  songDurationSeconds: number
): Promise<ValidationResult> {
  const availability = await calculateTimeAvailability(venueId);
  
  if (!availability.canAcceptRequests) {
    return {
      valid: false,
      error: "TIME_LIMIT_REACHED",
      message: `Sorry, we've reached our time limit for tonight. No more requests accepted.`
    };
  }
  
  const songMinutes = songDurationSeconds / 60;
  
  if (availability.remainingMinutes < songMinutes) {
    return {
      valid: false,
      error: "INSUFFICIENT_TIME",
      message: `Not enough time remaining (${availability.remainingMinutes.toFixed(0)} min). This song is ${songMinutes.toFixed(0)} minutes.`
    };
  }
  
  return { valid: true };
}
```

### Integration with Request Flow

```typescript
async function createSongRequest(venueId: string, track: SpotifyTrack, clientId: string) {
  const venue = await getVenue(venueId);
  
  // 1. Validate time availability (if enabled)
  if (venue.timeBasedRequestLimitsEnabled) {
    const timeValidation = await validateTimeAvailability(venueId, track.duration_ms / 1000);
    if (!timeValidation.valid) {
      throw new ApiError(400, timeValidation.message);
    }
  }
  
  // 2. Validate credits (existing)
  // 3. Validate request limits (existing)
  // 4. Validate rules (existing)
  
  // 5. Create request
  const songRequest = await prisma.songRequest.create({
    data: {
      venueId,
      clientId,
      spotifyTrackId: track.id,
      trackName: track.name,
      artistName: track.artists[0].name,
      durationSeconds: Math.floor(track.duration_ms / 1000),
      status: 'PENDING'
    }
  });
  
  return songRequest;
}
```

---

## 🎛️ Venue Owner Configuration

### UI Elements

**Time-Based Request Limits Settings:**
```
┌─────────────────────────────────────┐
│ Time-Based Request Limits           │
├─────────────────────────────────────┤
│ ☑ Enable time-based request limits  │
│                                     │
│ Opening Time:                       │
│ [ 23:00 ] (11:00 PM)                │
│                                     │
│ Closing Time:                       │
│ [ 05:00 ] (5:00 AM)                 │
│ ℹ️ Use 24-hour format               │
│                                     │
│ Buffer Before Closing:              │
│ [ 30 ] minutes                       │
│ ℹ️ Stop accepting requests X min    │
│    before closing                   │
└─────────────────────────────────────┘
```

**Real-Time Dashboard:**
```
┌─────────────────────────────────────┐
│ Time Availability                   │
├─────────────────────────────────────┤
│ Total Opening Time: 6 hours          │
│ Elapsed Time: 2 hours 15 min        │
│ Queued Songs: 3 hours 30 min        │
│ Currently Playing: 3 min            │
│                                     │
│ Remaining Time: 12 minutes          │
│                                     │
│ Status: ⚠️ Low Time Remaining        │
│ Can Accept Requests: ✅ Yes         │
│                                     │
│ Time Until Closing: 42 minutes      │
│ (including 30 min buffer)           │
└─────────────────────────────────────┘
```

---

## 🤖 Bot Integration

### Bot Messages

**When Time Limit Reached:**
```
Bot: "Sorry, we've reached our time limit for tonight. 
      No more song requests can be accepted. 
      All queued songs will play before closing!"
```

**When Time Running Low:**
```
Bot: "⚠️ Only 15 minutes of request time remaining. 
      Requests will stop soon!"
```

**When Requesting Song:**
```
Bot: "🎵 Song added! 
      Remaining request time: 2 hours 30 minutes"
```

**Query Remaining Time:**
```
Patron: "How much time is left?"
Bot: "There's 1 hour 45 minutes of request time remaining tonight."
```

---

## 📊 Edge Cases & Handling

### 1. Day Rollover (11 PM - 5 AM)
- **Challenge**: Closing time is next day
- **Solution**: Use date arithmetic to handle next-day closing
- **Example**: Opening = "2025-11-24 23:00", Closing = "2025-11-25 05:00"

### 2. Skipped Songs
- **Challenge**: Songs get skipped, should remove from time calculation
- **Solution**: When song status changes to SKIPPED, recalculate time availability
- **Implementation**: Remove skipped song duration from queued time

### 3. Songs Already Playing
- **Challenge**: Current song shouldn't count in "queued" time
- **Solution**: Track separately as "currentlyPlayingMinutes"
- **Implementation**: Only count QUEUED and PENDING status songs

### 4. Time Zone Handling
- **Challenge**: Venue in different timezone
- **Solution**: Store opening/closing times in venue's local timezone
- **Implementation**: Use timezone-aware date calculations

### 5. Venue Opens Late / Closes Early
- **Challenge**: Actual hours differ from configured hours
- **Solution**: Use actual opening time (first song played) as reference
- **Future**: Add "actual opening time" tracking

### 6. Buffer Time
- **Challenge**: Need buffer before closing to ensure last songs play
- **Solution**: Configurable buffer (e.g., 30 minutes)
- **Implementation**: Subtract buffer from remaining time calculation

---

## 🔄 Real-Time Updates

### WebSocket / Server-Sent Events
- Push time availability updates to venue dashboard
- Update every 30 seconds or when queue changes
- Show live countdown: "12 minutes remaining"

### n8n Workflow
```
[Schedule Trigger: Every 30 seconds]
  ↓
[Get current time availability for all active venues]
  ↓
[For each venue with time limits enabled:]
  - Calculate remaining time
  - If remaining < 0: Mark venue as "time limit reached"
  - Update venue status in database
  ↓
[If time limit reached AND venue still accepting requests:]
  - Update venue.isAcceptingRequests = false
  - Notify venue owner (optional)
  - Log event
```

---

## ✅ Acceptance Criteria

- [ ] Venue owner can enable/disable time-based request limits
- [ ] Venue owner can set opening/closing hours (24-hour format)
- [ ] Venue owner can set buffer time before closing
- [ ] System tracks total duration of queued songs
- [ ] System calculates remaining time accurately
- [ ] System stops accepting requests when time runs out
- [ ] Clear error message: "Time limit reached - no more requests"
- [ ] Dashboard shows real-time time availability
- [ ] Bot informs patrons when time limit reached
- [ ] Bot shows remaining time when patron requests song
- [ ] Handles day rollover correctly (e.g., 11 PM - 5 AM)
- [ ] Handles skipped songs (removes from calculation)
- [ ] Handles timezone differences
- [ ] Updates in real-time as songs are added/played/skipped

---

## 🎯 Benefits

### For Venue Owners
- ✅ **Guarantee Quality**: All paid requests will play
- ✅ **Customer Satisfaction**: No disappointed patrons
- ✅ **Revenue Protection**: No refunds needed for unplayed songs
- ✅ **Better Planning**: Know exactly when to stop accepting requests

### For Patrons
- ✅ **Guaranteed Playback**: If request accepted, song will play
- ✅ **Transparency**: Know how much time is remaining
- ✅ **Fair System**: Everyone gets equal opportunity

### For Platform
- ✅ **Trust Building**: Guarantees create trust
- ✅ **Reduced Support**: Fewer complaints about unplayed songs
- ✅ **Better UX**: Clear communication about availability

---

## 🔗 Integration Points

### With Credit System
- If time limit reached, don't charge credits
- If time limit reached mid-payment, cancel payment
- Refund credits if song can't play (edge case)

### With Request Limits
- Time limit is additional check
- Request must pass: Credits + Max Requests + Rules + **Time Availability**
- All checks must pass for request to be accepted

### With Automation Mode
- Only works in Automation Mode (requires playback control)
- Integrates with queue management
- Works with auto-moderation (skipped songs remove from time)

---

## 📝 Configuration Examples

### Example 1: Nightclub (11 PM - 5 AM)
```json
{
  "timeBasedRequestLimitsEnabled": true,
  "openingTime": "23:00",
  "closingTime": "05:00",
  "timeLimitBufferMinutes": 30
}
```
**Result**: 6 hours total, stops accepting requests 30 min before 5 AM

### Example 2: Restaurant (6 PM - 11 PM)
```json
{
  "timeBasedRequestLimitsEnabled": true,
  "openingTime": "18:00",
  "closingTime": "23:00",
  "timeLimitBufferMinutes": 15
}
```
**Result**: 5 hours total, stops accepting requests 15 min before 11 PM

### Example 3: All-Day Venue (12 PM - 12 AM)
```json
{
  "timeBasedRequestLimitsEnabled": true,
  "openingTime": "12:00",
  "closingTime": "00:00",
  "timeLimitBufferMinutes": 60
}
```
**Result**: 12 hours total, stops accepting requests 1 hour before midnight

### Example 4: Disabled
```json
{
  "timeBasedRequestLimitsEnabled": false
}
```
**Result**: No time limits, accept requests until manually disabled

---

## 🚀 Implementation Priority

**Priority:** P1 (High)  
**Status:** 🔴 Not Started  
**Target:** Q2 2025 (after Automation Mode core features)

This feature is **critical** for Automation Mode venues that want to guarantee paid requests will play. It's especially important for:
- High-volume request venues
- Paid request venues (credits/money)
- Time-constrained venues (short operating hours)

---

## 📚 Related Documentation

- [SIMPLIFIED-VENUE-MODES.md](./SIMPLIFIED-VENUE-MODES.md) - Operating modes specification
- [CREDITS-AND-LIMITS-FEATURE.md](./CREDITS-AND-LIMITS-FEATURE.md) - Credit system
- [PRODUCT-BACKLOG.md](./PRODUCT-BACKLOG.md) - Full feature backlog
