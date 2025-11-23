# 📋 Implementation Tasks - Simplified Venue Modes

## 🎯 Overview

This document breaks down the implementation of simplified venue modes into actionable tasks.

---

## Phase 1: Database & Schema Changes

### ✅ Task 1.1: Update VenueMode Enum
- [ ] Remove `QUEUE` from `VenueMode` enum in Prisma schema
- [ ] Keep `PLAYLIST` and `AUTOMATION`
- [ ] Create migration to update enum
- [ ] Update TypeScript types

**Files:**
- `prisma/schema.prisma`
- `prisma/migrations/YYYYMMDDHHMMSS_remove_queue_mode/migration.sql`

---

### ✅ Task 1.2: Add Playlist Fields to Venue Model
- [ ] Add `spotifyPlaylistId` (String?)
- [ ] Add `spotifyPlaylistUrl` (String?)
- [ ] Create migration

**Files:**
- `prisma/schema.prisma`
- `prisma/migrations/YYYYMMDDHHMMSS_add_playlist_fields/migration.sql`

---

### ✅ Task 1.3: Create VenueRule Model
- [ ] Create `VenueRule` model with fields:
  - `id`, `venueId`, `name`, `description`, `type`, `enabled`, `priority`
  - `conditions` (Json), `actions` (Json)
- [ ] Create `RuleType` enum: `CONTENT`, `TIME`, `PRICING`, `REQUESTS`
- [ ] Add relation to Venue
- [ ] Create migration

**Files:**
- `prisma/schema.prisma`
- `prisma/migrations/YYYYMMDDHHMMSS_add_venue_rules/migration.sql`

---

### ✅ Task 1.4: Migrate Existing QUEUE Venues
- [ ] Create migration script to:
  - Find all venues with `mode: QUEUE`
  - Update to `mode: PLAYLIST`
  - Log migration results

**Files:**
- `prisma/migrations/YYYYMMDDHHMMSS_migrate_queue_to_playlist/migration.sql`

---

## Phase 2: Environment & Configuration

### ✅ Task 2.1: Update .env Structure
- [ ] Add default Spotify credentials:
  ```bash
  SPOTIFY_CLIENT_ID=51ac6e03a9694126b84402763a033249
  SPOTIFY_CLIENT_SECRET=96570d65d0c84d51839c1bf6c8354ad5
  ```
- [ ] Add individual n8n webhook URLs:
  ```bash
  N8N_WEBHOOK_CREATE_PLAYLIST_URL=
  N8N_WEBHOOK_VALIDATE_RULES_URL=
  N8N_WEBHOOK_ADD_SONG_TO_PLAYLIST_URL=
  N8N_WEBHOOK_SEARCH_TRACK_URL=
  N8N_WEBHOOK_ADD_SONG_TO_QUEUE_URL=
  N8N_WEBHOOK_SKIP_TRACK_URL=
  ```

**Files:**
- `.env.example`
- `.env` (local)

---

### ✅ Task 2.2: Update lib/env.ts
- [ ] Add `spotify.defaultClientId` and `spotify.defaultClientSecret`
- [ ] Add `n8n.webhooks` object with all webhook URLs
- [ ] Support fallback to `N8N_WEBHOOK_URL` if individual URLs not set

**Files:**
- `lib/env.ts`

---

## Phase 3: Playlist Mode - Basic

### ✅ Task 3.1: Create Playlist on Venue Creation
- [ ] After venue creation (if `mode: PLAYLIST`):
  - Call n8n webhook `/create-playlist`
  - Pass venue details and Spotify credentials
  - Wait for response with playlist ID/URL
  - Update venue with `spotifyPlaylistId` and `spotifyPlaylistUrl`
- [ ] Handle errors gracefully (log, show in UI)

**Files:**
- `models/venue.ts` (update `createVenue`)
- `lib/n8n-webhooks.ts` (new utility file)

---

### ✅ Task 3.2: Display Playlist Link in UI
- [ ] Add playlist link to venue details page
- [ ] Show "Open Playlist in Spotify" button
- [ ] Display playlist name and track count (if available)
- [ ] Show loading state while playlist is being created

**Files:**
- `components/venues/VenueDetails.tsx` (new or update existing)
- `pages/venues/[venueId]/index.tsx` (or similar)

---

### ✅ Task 3.3: Add Song to Playlist (API Endpoint)
- [ ] Create `POST /api/venues/[venueId]/song-requests` endpoint
- [ ] Validate request (credits, rate limits, rules if Advanced)
- [ ] Call n8n webhook `/add-song-to-playlist`
- [ ] Update `SongRequest` status
- [ ] Return success/error

**Files:**
- `pages/api/venues/[venueId]/song-requests.ts` (new or update)

---

## Phase 4: Rules System (Playlist Advanced / Automation)

### ✅ Task 4.1: Rules Editor UI Component
- [ ] Create `components/venues/RulesEditor.tsx`
- [ ] Natural language input for rules
- [ ] Rule list with enable/disable toggle
- [ ] Time-based rule scheduler
- [ ] Blacklist manager
- [ ] Show "Analyzing rules... please wait 🤖" during validation

**Files:**
- `components/venues/RulesEditor.tsx` (new)
- `components/venues/RuleForm.tsx` (new)
- `components/venues/TimeRuleScheduler.tsx` (new)

---

### ✅ Task 4.2: Rules Validation API
- [ ] Create `POST /api/venues/[venueId]/rules/validate` endpoint
- [ ] Call n8n webhook `/validate-rules`
- [ ] Wait for AI agent response
- [ ] Return validation result (OK or conflicts)

**Files:**
- `pages/api/venues/[venueId]/rules/validate.ts` (new)

---

### ✅ Task 4.3: Save Rules API
- [ ] Create `POST /api/venues/[venueId]/rules` endpoint
- [ ] Only save if validation passed
- [ ] Store rules in `VenueRule` model
- [ ] Return success/error

**Files:**
- `pages/api/venues/[venueId]/rules/index.ts` (new)
- `pages/api/venues/[venueId]/rules/[ruleId].ts` (new for update/delete)

---

### ✅ Task 4.4: Rules Validation in Song Requests
- [ ] Update song request endpoint to check active rules
- [ ] Validate against genre/artist/blacklist rules
- [ ] Apply time-based rules
- [ ] Return appropriate error messages

**Files:**
- `pages/api/venues/[venueId]/song-requests.ts` (update)
- `lib/rules-engine.ts` (new utility)

---

## Phase 5: Superadmin Configuration UI

### ✅ Task 5.1: Superadmin Settings Page
- [ ] Create `pages/admin/settings/n8n.tsx`
- [ ] Form to configure:
  - Default Spotify credentials
  - Individual n8n webhook URLs
  - N8N API key and secret
- [ ] Save to database (new `SystemConfig` model or similar)

**Files:**
- `pages/admin/settings/n8n.tsx` (new)
- `components/admin/N8NConfigForm.tsx` (new)
- `models/system-config.ts` (new, optional)

---

### ✅ Task 5.2: Per-Venue Spotify Credentials Override
- [ ] Add fields to venue edit form (superadmin only)
- [ ] Allow setting custom `spotifyClientId` and `spotifyClientSecret`
- [ ] Show default values if not overridden
- [ ] Use override values when calling n8n webhooks

**Files:**
- `components/venues/EditVenueForm.tsx` (update)
- `pages/admin/venues/[venueId]/edit.tsx` (new or update)

---

## Phase 6: UI Updates

### ✅ Task 6.1: Remove Queue Mode from UI
- [ ] Update venue creation form (remove Queue Mode option)
- [ ] Update venue edit form
- [ ] Update mode selection dropdown
- [ ] Update documentation/help text

**Files:**
- `components/venues/CreateVenueForm.tsx`
- `components/venues/EditVenueForm.tsx`
- `locales/en/common.json` (update translations)

---

### ✅ Task 6.2: Update Mode Descriptions
- [ ] Update UI to show:
  - Playlist Mode Basic (Basic Plan)
  - Playlist Mode Advanced (Pro Plan)
  - Automation Mode (Pro Plan)
- [ ] Add feature comparison tooltips
- [ ] Show subscription tier requirements

**Files:**
- `components/venues/ModeSelector.tsx` (new or update)
- `locales/en/common.json`

---

## Phase 7: N8N Webhook Utilities

### ✅ Task 7.1: Create N8N Webhook Client
- [ ] Create `lib/n8n-webhooks.ts` utility
- [ ] Functions for each webhook:
  - `createPlaylist()`
  - `validateRules()`
  - `addSongToPlaylist()`
  - `searchTrack()`
  - `addSongToQueue()`
  - `skipTrack()`
- [ ] Handle signature generation
- [ ] Handle errors and retries

**Files:**
- `lib/n8n-webhooks.ts` (new)

---

### ✅ Task 7.2: Webhook Security Middleware
- [ ] Create `lib/middleware/n8n-webhook-auth.ts`
- [ ] Verify API key
- [ ] Verify HMAC-SHA256 signature
- [ ] Reusable for all n8n → Rockola webhooks

**Files:**
- `lib/middleware/n8n-webhook-auth.ts` (new)

---

## Phase 8: Testing

### ✅ Task 8.1: Unit Tests
- [ ] Test venue creation with playlist creation
- [ ] Test rules validation
- [ ] Test webhook signature generation/verification
- [ ] Test rules engine logic

**Files:**
- `__tests__/models/venue.spec.ts` (new or update)
- `__tests__/lib/rules-engine.spec.ts` (new)
- `__tests__/lib/n8n-webhooks.spec.ts` (new)

---

### ✅ Task 8.2: Integration Tests
- [ ] Test full song request flow (Playlist Mode)
- [ ] Test rules validation flow
- [ ] Test superadmin configuration

**Files:**
- `tests/e2e/venues/playlist-mode.spec.ts` (new)
- `tests/e2e/venues/rules.spec.ts` (new)

---

## Phase 9: Documentation

### ✅ Task 9.1: Update Architecture Docs
- [ ] Update `SONG-REQUEST-ARCHITECTURE.md` with simplified modes
- [ ] Update `PROJECT-SCOPE.md` with new mode structure
- [ ] Archive `VENUE-MODES-COMPARISON.md` (or update)

**Files:**
- `SONG-REQUEST-ARCHITECTURE.md`
- `PROJECT-SCOPE.md`

---

### ✅ Task 9.2: API Documentation
- [ ] Document new endpoints
- [ ] Document webhook contracts
- [ ] Update README with new features

**Files:**
- `README.md`
- `API-DOCUMENTATION.md` (new or update)

---

## 🎯 Priority Order

1. **Phase 1** - Database changes (foundation)
2. **Phase 2** - Environment configuration
3. **Phase 3** - Playlist Mode Basic (core functionality)
4. **Phase 7** - N8N webhook utilities (needed for Phase 3)
5. **Phase 4** - Rules system (advanced feature)
6. **Phase 5** - Superadmin UI (configuration)
7. **Phase 6** - UI updates (polish)
8. **Phase 8** - Testing
9. **Phase 9** - Documentation

---

## 💡 Additional Suggestions

### 1. **Playlist Regeneration**
- Consider adding ability to create new playlist (archiving old one)
- Use case: Starting fresh, clearing old requests
- Could be a button in venue settings: "Create New Playlist"

### 2. **Rules Templates**
- Pre-built rule templates for common scenarios:
  - "No explicit content"
  - "Only [genre]"
  - "Time-based restrictions"
- Makes it easier for venue owners

### 3. **Playlist Analytics**
- Track most requested songs
- Track playlist growth over time
- Show in venue dashboard

### 4. **Batch Operations**
- Allow adding multiple songs at once
- Useful for venue owners manually curating

### 5. **Playlist Sync Status**
- Show when playlist was last synced
- Option to manually trigger sync
- Useful for debugging

### 6. **Error Handling & Retries**
- Implement retry logic for n8n webhook calls
- Queue failed requests for retry
- Alert superadmin if webhook consistently fails

### 7. **Webhook Monitoring**
- Log all webhook calls (success/failure)
- Show webhook health in superadmin dashboard
- Alert on repeated failures

---

## ✅ Ready to Start?

Once you confirm:
1. Review this task list
2. Answer any remaining questions
3. Confirm n8n webhooks are ready (or we can mock them for testing)

I'll start with **Phase 1** (Database changes) and work through systematically.
