# UI Refactoring Progress

## Approach

Removing ALL team-related functionality since Rockola doesn't need multi-user teams.
Each user directly owns their venues.

## Changes Made

### Components Removed
- [x] `components/team/` - All team management components
- [x] `components/invitation/` - Team invitation components  
- [x] `components/emailTemplates/TeamInvite.tsx` - Team invite email template

### Components To Update
- [ ] `components/apiKey/APIKeys.tsx` - Remove Team dependency
- [ ] `components/apiKey/NewAPIKey.tsx` - Remove Team dependency
- [ ] `components/webhook/*` - Remove Team dependencies
- [ ] `components/billing/LinkToPortal.tsx` - Remove Team dependency

### Pages To Remove
- [ ] `pages/teams/` - All team-related pages
- [ ] `pages/api/teams/` - Old team-based API endpoints

### Pages To Create
- [ ] `pages/venues/index.tsx` - User's venue list
- [ ] `pages/venues/[venueId]/edit.tsx` - Already exists, verify it works
- [ ] `pages/admin/dashboard.tsx` - SUPERADMIN dashboard
- [ ] `pages/admin/users.tsx` - User management for SUPERADMIN
- [ ] `pages/admin/venues.tsx` - All venues for SUPERADMIN

### Navigation Updates
- [ ] Remove team selector
- [ ] Add "My Venues" link
- [ ] Add "Admin" section for SUPERADMIN users
- [ ] Update sidebar/header

### Hooks To Update/Remove
- [ ] `hooks/useTeam.ts` - Remove
- [ ] `hooks/useTeamMembers.ts` - Remove
- [ ] `hooks/useInvitation.ts` - Remove
- [ ] Create `hooks/useVenues.ts` - For user's venues

## Progress

**Phase 1: Get Build Working** ⏳ IN PROGRESS
- Remove team components
- Update remaining components to not use Team
- Fix all TypeScript errors

**Phase 2: Create New Pages** 🔜 NEXT
- Venue list page
- SUPERADMIN dashboard

**Phase 3: Update Navigation** 🔜 PENDING
- Remove team selector
- Add venue links

**Phase 4: Testing** 🔜 PENDING
- Test user flow
- Test SUPERADMIN flow
- Test Spotify connection


