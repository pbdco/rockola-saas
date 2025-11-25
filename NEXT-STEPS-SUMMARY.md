# 🎯 Next Steps Summary - Rockola Development

**Date:** 2025-01-24  
**Current Status:** Phase 3 - Playlist Mode Basic (40% Complete)

---

## 📊 Current Status Overview

### ✅ What's Done
- **Database & Schema**: 100% complete
- **Infrastructure**: n8n webhooks, logging, environment config - 100% complete
- **UI Components**: Venue management UI - 80% complete
- **API Integration**: 20% complete (webhook functions exist, not integrated)

### 🟡 What's In Progress
- **Playlist Auto-Creation**: Webhook function ready, needs integration
- **Playlist Display**: Database ready, needs UI component
- **Song Request API**: Needs implementation

### 🔴 What's Next
1. Complete Playlist Mode Basic implementation
2. Implement Max Requests Per User feature
3. Build Rules System

---

## 🚀 Immediate Next Steps (Priority Order)

### **Step 0: Superadmin n8n Configuration UI** ⚡ HIGH PRIORITY (Infrastructure)

**Why:** Currently, n8n webhook URLs are only in `.env` file. Superadmins need UI to configure without code changes.

**Status:** ❌ Not implemented (planned but not done)

**Tasks:**
1. **Database Schema** (if needed):
   - Option A: Create `SystemConfig` model to store config in database
   - Option B: Use environment variable override system (simpler)
2. **Create Settings Page**: `pages/admin/settings/n8n.tsx`
3. **Create Config Form Component**: `components/admin/N8NConfigForm.tsx`
   - Form fields for:
     - Default Spotify Client ID/Secret
     - Individual n8n webhook URLs (6 webhooks)
     - N8N API Key and Secret
   - Show current values from `.env`
   - Save to database/config
4. **API Endpoint**: `POST /api/admin/settings/n8n`
   - Validate superadmin access
   - Save configuration
   - Return success/error
5. **Update `lib/env.ts`**: Support reading from database/config override
   - Priority: Database config > Environment variables
6. **Navigation**: Add "Settings" link to admin dashboard

**Files to Create:**
- `pages/admin/settings/n8n.tsx` (new)
- `components/admin/N8NConfigForm.tsx` (new)
- `pages/api/admin/settings/n8n.ts` (new)
- `models/system-config.ts` (optional, if using database)

**Estimated Time:** 3-4 hours

**Priority:** HIGH - Should be done before Playlist Mode Basic, as it allows configuration without code changes.

---

### **Step 1: Complete Playlist Auto-Creation** ⚡ HIGH PRIORITY

**Goal:** When a venue is created with `mode: PLAYLIST`, automatically create a Spotify playlist.

**Tasks:**
1. Update `models/venue.ts` `createVenue()` function
   - After venue creation, if `mode === 'PLAYLIST'`
   - Call `createPlaylist()` from `lib/n8n-webhooks.ts`
   - Use default Spotify credentials from `env.spotify.defaultClientId/Secret`
   - Save `spotifyPlaylistId` and `spotifyPlaylistUrl` to venue
   - Handle errors gracefully (log, don't fail venue creation)

**Files to Modify:**
- `models/venue.ts` - Add playlist creation logic
- `lib/n8n-webhooks.ts` - Already exists ✅

**Estimated Time:** 1-2 hours

---

### **Step 2: Display Playlist Link in UI** ⚡ HIGH PRIORITY

**Goal:** Show the created playlist link in the venue details page.

**Tasks:**
1. Create or update venue details component
   - Display `spotifyPlaylistUrl` if exists
   - Show "Open Playlist in Spotify" button
   - Display playlist name (if available)
   - Show loading state while playlist is being created
   - Handle case when playlist creation failed

**Files to Create/Modify:**
- `components/venues/VenueDetails.tsx` (new or update existing)
- `pages/teams/[slug]/venues/[venueId]/index.tsx` (or similar)

**Estimated Time:** 1-2 hours

---

### **Step 3: Create Song Request API Endpoint** ⚡ HIGH PRIORITY

**Goal:** Allow adding songs to playlist via API endpoint.

**Tasks:**
1. Create `POST /api/venues/[venueId]/song-requests` endpoint
   - Validate request (user auth, venue exists)
   - Validate credits (if pricing enabled)
   - Validate request limits (if configured)
   - Validate rules (if Playlist Advanced / Automation)
   - Search track via `searchTrack()` webhook
   - Add song to playlist via `addSongToPlaylist()` webhook
   - Create `SongRequest` record
   - Update request status
   - Return success/error

**Files to Create:**
- `pages/api/venues/[venueId]/song-requests.ts` (new)

**Estimated Time:** 2-3 hours

---

### **Step 4: Integration Testing** ⚡ MEDIUM PRIORITY

**Goal:** Test the complete flow end-to-end.

**Test Cases:**
1. Create venue → Playlist created → Link displayed
2. Create song request → Song added to playlist
3. Error handling (n8n webhook failures)
4. Edge cases (no Spotify credentials, invalid track, etc.)

**Estimated Time:** 1-2 hours

---

## 📋 After Playlist Mode Basic (Next Sprint)

### **Step 5: Max Requests Per User** 🔴 P1 - CRITICAL

**Why:** Essential for Playlist Mode party planning use cases.

**Tasks:**
1. **Database Schema Updates**
   - Add `maxRequestsPerUser` (Int?) to Venue model
   - Add `requestLimitReset` (RequestLimitReset?) to Venue model
   - Add `totalRequests` (Int) to VenueClient model
   - Add `lastRequestAt` (DateTime?) to VenueClient model
   - Create migration

2. **Configuration UI**
   - Add fields to venue create/edit forms
   - Request limit input (1 to unlimited, or null)
   - Reset option dropdown (DAILY, SESSION, NEVER)
   - Validation and help text

3. **Request Count Tracking**
   - Track requests per user in VenueClient
   - Implement reset logic (daily/session/never)
   - Update request count on song request creation

4. **Limit Enforcement**
   - Validate request count before accepting request
   - Combine with credit validation
   - Clear error messages
   - Show remaining requests to patron

**Estimated Time:** 4-6 hours

---

### **Step 6: Rules System (Playlist Advanced)** 🔴 P1

**Why:** Enables Playlist Mode Advanced features.

**Tasks:**
1. **Rules Editor UI**
   - Create `components/venues/RulesEditor.tsx`
   - Natural language input for rules
   - Rule list with enable/disable toggle
   - Time-based rule scheduler
   - Show "Analyzing rules... 🤖" during validation

2. **Rules Validation API**
   - Create `POST /api/venues/[venueId]/rules/validate` endpoint
   - Call `validateRules()` webhook
   - Wait for AI agent response
   - Return validation result (OK or conflicts)

3. **Save Rules API**
   - Create `POST /api/venues/[venueId]/rules` endpoint
   - Only save if validation passed
   - Store rules in VenueRule model

4. **Rules Engine Integration**
   - Update song request endpoint to check active rules
   - Validate against genre/artist/blacklist rules
   - Apply time-based rules

**Estimated Time:** 6-8 hours

---

## 🎯 Sprint Goals

### **Current Sprint (Week 1-2)**
- ✅ Complete Playlist Mode Basic
- ✅ Test end-to-end flow
- ✅ Fix any bugs

### **Next Sprint (Week 3-4)**
- 🔴 Implement Max Requests Per User
- 🔴 Start Rules System

### **Q1 2025 Goals**
- ✅ Playlist Mode Basic
- 🔴 Max Requests Per User
- 🔴 Rules System (Playlist Advanced)
- 🔴 Automation Mode Core Features

---

## 📝 Development Notes

### **Testing Strategy**
- Use mock n8n webhooks for local development
- Test with real n8n webhooks in staging
- Comprehensive error handling
- Log all operations for debugging

### **Code Quality**
- Follow existing code patterns
- Use TypeScript types
- Add error handling
- Log all operations
- Write clear error messages

### **Documentation**
- Update API documentation
- Update mode documentation
- Document any new patterns

---

## 🚨 Important Reminders

1. **n8n Webhooks**: Functions exist in `lib/n8n-webhooks.ts`, just need integration
2. **Error Handling**: Always handle n8n webhook failures gracefully
3. **Logging**: All operations should be logged (already set up)
4. **Testing**: Test with mock responses first, then real n8n
5. **Database**: All migrations are complete, schema is ready

---

## 🔗 Quick Reference

- **Status Document**: [PROJECT-STATUS.md](./PROJECT-STATUS.md)
- **Backlog**: [PRODUCT-BACKLOG.md](./PRODUCT-BACKLOG.md)
- **Implementation Tasks**: [IMPLEMENTATION-TASKS-SIMPLIFIED-MODES.md](./IMPLEMENTATION-TASKS-SIMPLIFIED-MODES.md)
- **API Documentation**: [ROCKOLA-API-FOR-N8N.md](./ROCKOLA-API-FOR-N8N.md)
- **Webhook Specs**: [N8N-WEBHOOKS-SPECIFICATION.md](./N8N-WEBHOOKS-SPECIFICATION.md)

---

**Ready to start? Begin with Step 1: Complete Playlist Auto-Creation** 🚀
