# Rockola SaaS Refactoring: Team Removal & SUPERADMIN Implementation

## Summary

This document outlines the major architectural change from a team-based multi-tenant system to a user-direct ownership model with SUPERADMIN capabilities.

## What Changed

### 1. Database Schema (`prisma/schema.prisma`)

**Roles Updated:**
- Removed: `ADMIN`, `OWNER`, `MEMBER`
- Added: `SUPERADMIN`, `USER`

**User Model:**
- Added `role` field (defaults to `USER`)
- Added direct relations to `venues` and `apiKeys`
- Removed `teamMembers` and `invitations` relations

**Removed Models:**
- `Team`
- `TeamMember`
- `Invitation`

**Updated Models:**
- `Venue`: Changed `teamId` → `userId`
- `ApiKey`: Changed `teamId` → `userId`

### 2. Permissions System (`lib/permissions.ts`)

**New Resources:**
- `venue`, `api_key`, `payment`, `song_request`, `user`, `platform`

**Role Permissions:**
- `SUPERADMIN`: Full access to all resources (`*`)
- `USER`: Can manage own venues, API keys; read own payments and song requests

### 3. Models

**`models/user.ts`:**
- Added `isSuperAdmin()` helper
- Updated `throwIfNotAllowed()` to use User role instead of TeamMember
- Added `throwIfNoUserAccess()` for auth checks
- Removed TeamMember dependencies

**`models/venue.ts`:**
- Changed all functions from `teamId` → `userId`
- Added `listAllVenues()` for SUPERADMIN to see all venues
- Updated `getVenueForUser()` (was `getVenueForTeam`)
- Added user ownership checks

### 4. API Endpoints

**New Structure:**
- `/api/venues/` - List/create venues
- `/api/venues/[venueId]` - Get/update/delete specific venue
- `/api/venues/[venueId]/spotify/connect` - Connect Spotify
- `/api/venues/[venueId]/spotify/disconnect` - Disconnect Spotify
- `/api/spotify/callback` - Spotify OAuth callback (updated)

**Authentication:**
- Uses `throwIfNoUserAccess()` to get current user
- SUPERADMIN can access/manage all venues
- Regular users only manage their own venues

**Old Endpoints (TO BE REMOVED):**
- `/api/teams/[slug]/venues/...` (still exist but will be deprecated)

### 5. Migration Script

**Location:** `prisma/migrations/backup-and-migrate-to-user-based.sql`

**What it does:**
1. Adds `userId` column to Venue
2. Adds `role` column to User
3. Migrates venues to first OWNER/ADMIN of each team
4. Migrates API keys to team owners
5. Drops Team, TeamMember, Invitation tables
6. Updates indexes and foreign keys

## Migration Steps

### Before Migration

1. **Backup Database:**
   ```bash
   docker compose exec postgres pg_dump -U admin rockola > backup-$(date +%Y%m%d).sql
   ```

2. **Stop Application:**
   ```bash
   docker compose stop app
   ```

### Running Migration

1. **Apply Prisma Schema:**
   ```bash
   npx prisma migrate dev --name remove-teams-add-superadmin
   ```

2. **Or manually run migration:**
   ```bash
   docker compose exec postgres psql -U admin -d rockola -f /path/to/backup-and-migrate-to-user-based.sql
   ```

### After Migration

1. **Set SUPERADMIN Users:**
   ```sql
   UPDATE "User" SET role = 'SUPERADMIN' WHERE email = 'admin@yourdomain.com';
   ```

2. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

3. **Restart Application:**
   ```bash
   docker compose up -d app
   ```

## UI Changes Needed

### Pages to Create:
- `/pages/venues/index.tsx` - New venues list page (no team slug)
- `/pages/venues/[venueId]/edit.tsx` - New edit venue page
- `/pages/admin/dashboard.tsx` - SUPERADMIN dashboard

### Pages to Remove/Update:
- `/pages/teams/...` - All team-related pages
- Update navigation to remove team selector
- Update sidebar/header to show "My Venues" directly

### Components to Update:
- `VenueList` - Update API calls to `/api/venues`
- `CreateVenue` - Update API calls
- `EditVenueForm` - Update API calls
- `SpotifyConnect` - Update connect/disconnect endpoints
- Navigation components - Remove team references

## Testing Checklist

- [ ] User can sign up and log in
- [ ] User can create a venue
- [ ] User can list their venues
- [ ] User can edit their venue
- [ ] User can delete their venue
- [ ] User can connect Spotify to venue
- [ ] User can disconnect Spotify from venue
- [ ] SUPERADMIN can see all venues
- [ ] SUPERADMIN can manage any venue
- [ ] Regular user cannot see other users' venues
- [ ] n8n webhook receives correct data
- [ ] Venue-specific Spotify credentials work

## Breaking Changes

⚠️ **This is a breaking change!**

- All existing team-based URLs will break
- Users will need to re-authenticate
- Previous team permissions no longer apply
- API clients using team slug in URLs must update

## Benefits

✅ **Simplified Architecture:**
- No team management overhead
- Direct user-to-venue ownership
- Simpler permission model

✅ **Better for Rockola Business Model:**
- Each venue owner manages their own venues
- No confusing team concepts
- Clear ownership

✅ **SUPERADMIN Control:**
- Platform-wide management
- Full visibility across all venues
- Support capabilities

## Next Steps

1. Complete UI refactoring
2. Update all frontend API calls
3. Create SUPERADMIN dashboard
4. Update documentation
5. Test thoroughly
6. Deploy migration

## Rollback Plan

If issues arise:

1. Restore database from backup
2. Revert code changes
3. Restart application

```bash
docker compose stop
docker compose exec postgres psql -U admin -d rockola < backup-YYYYMMDD.sql
git checkout main  # or previous commit
docker compose up -d
```


