# Migration Guide: Removing Teams & Adding SUPERADMIN

## ⚠️ CRITICAL: This is a BREAKING CHANGE

This migration will:
- Remove ALL team functionality
- Convert venues to user-ownership
- Add SUPERADMIN role
- Break existing URLs and team-based access

## Prerequisites

1. **Full database backup:**
   ```bash
   docker compose exec postgres pg_dump -U admin rockola > backup-$(date +%Y%m%d-%H%M%S).sql
   ```

2. **Stop the application:**
   ```bash
   docker compose stop app
   ```

## Migration Steps

### Step 1: Apply Database Migration

**Option A: Using Prisma Migrate (Recommended)**

```bash
# Inside Docker container
docker compose exec app npx prisma migrate dev --name remove-teams-add-superadmin

# Or from host
npx prisma migrate dev --name remove-teams-add-superadmin
```

**Option B: Manual SQL Migration**

If Prisma fails, run the manual migration script:

```bash
# Copy migration script into container
docker cp prisma/migrations/backup-and-migrate-to-user-based.sql saas-starter-kit-main-postgres-1:/tmp/

# Run migration
docker compose exec postgres psql -U admin -d rockola -f /tmp/backup-and-migrate-to-user-based.sql
```

### Step 2: Set SUPERADMIN Users

After migration, promote your admin user(s):

```bash
docker compose exec postgres psql -U admin -d rockola
```

```sql
-- Update your admin email here
UPDATE "User" SET role = 'SUPERADMIN' WHERE email = 'your-admin@email.com';

-- Verify
SELECT id, name, email, role FROM "User";

\q
```

### Step 3: Generate Prisma Client

```bash
docker compose exec app npx prisma generate
```

### Step 4: Rebuild and Restart

```bash
# Rebuild the app with new schema
docker compose build app

# Start everything
docker compose up -d

# Check logs
docker compose logs -f app
```

### Step 5: Verify Migration

**Check database schema:**
```bash
docker compose exec postgres psql -U admin -d rockola -c "\d \"Venue\""
docker compose exec postgres psql -U admin -d rockola -c "\d \"User\""
docker compose exec postgres psql -U admin -d rockola -c "\dt"  # List all tables
```

**Expected results:**
- `Venue` should have `userId` column (not `teamId`)
- `User` should have `role` column
- `Team`, `TeamMember`, `Invitation` tables should NOT exist
- `ApiKey` should have `userId` column (not `teamId`)

### Step 6: Test Application

1. **Sign in as regular user:**
   - Should land on `/venues` (not `/teams/...`)
   - Can create venues
   - Can only see own venues

2. **Sign in as SUPERADMIN:**
   - Can see ALL venues
   - Can manage any venue

3. **Test Spotify connection:**
   - Create a venue
   - Add Spotify credentials
   - Connect Spotify
   - Verify n8n webhook receives data

## Troubleshooting

### Problem: Prisma Migration Fails

**Solution:**
Use manual SQL migration (Option B above)

### Problem: "Table 'Team' does not exist"

**Solution:**
This is expected! The old code references are still there. We need to complete the UI refactoring.

### Problem: Cannot access /teams/... URLs

**Solution:**
This is expected! Use `/venues` instead.

### Problem: User has no role

```sql
-- Set default role for users without role
UPDATE "User" SET role = 'USER' WHERE role IS NULL;
```

### Problem: Venues have no userId

```sql
-- Check if migration completed
SELECT id, name, "userId" FROM "Venue";

-- If userId is NULL, migration didn't complete properly
-- Restore from backup and retry
```

## Rollback Procedure

If something goes wrong:

```bash
# Stop everything
docker compose down

# Restore database
docker compose up -d postgres
sleep 5
docker compose exec -T postgres psql -U admin -d rockola < backup-YYYYMMDD-HHMMSS.sql

# Revert code changes
git checkout HEAD -- prisma/schema.prisma models/ lib/permissions.ts pages/api/

# Regenerate Prisma client
docker compose exec app npx prisma generate

# Restart app
docker compose up -d app
```

## Post-Migration Tasks

After successful migration:

1. [ ] Update frontend UI (remove team references)
2. [ ] Create SUPERADMIN dashboard
3. [ ] Update documentation
4. [ ] Notify users of URL changes
5. [ ] Remove old team-based API endpoints
6. [ ] Update any external integrations (n8n workflows, etc.)

## What's Different

### Before:
- URL: `/teams/my-team/venues`
- Ownership: Team → Venues
- Roles: OWNER, ADMIN, MEMBER (per team)

### After:
- URL: `/venues`
- Ownership: User → Venues
- Roles: SUPERADMIN, USER (global)

## Files Changed

**Database:**
- `prisma/schema.prisma` - Removed Team models, updated roles
- `prisma/migrations/backup-and-migrate-to-user-based.sql` - Migration script

**Models:**
- `models/user.ts` - Added SUPERADMIN helpers
- `models/venue.ts` - Changed to user-ownership

**Permissions:**
- `lib/permissions.ts` - New permission structure

**API Endpoints (NEW):**
- `pages/api/venues/index.ts`
- `pages/api/venues/[venueId].ts`
- `pages/api/venues/[venueId]/spotify/connect.ts`
- `pages/api/venues/[venueId]/spotify/disconnect.ts`
- Updated: `pages/api/spotify/callback.ts`

**Documentation:**
- `REFACTORING-SUMMARY.md` - Full refactoring details
- `MIGRATION-GUIDE.md` - This file

## Next Phase: UI Updates

The backend is now ready. Next steps:

1. Update all frontend pages to use `/venues` instead of `/teams/[slug]/venues`
2. Remove team selection/navigation components
3. Create SUPERADMIN dashboard
4. Update all API client calls
5. Test thoroughly

## Support

If you encounter issues:

1. Check Docker logs: `docker compose logs -f`
2. Check database state: `docker compose exec postgres psql -U admin -d rockola`
3. Verify Prisma client: `docker compose exec app npx prisma studio`
4. Review migration script: `prisma/migrations/backup-and-migrate-to-user-based.sql`


