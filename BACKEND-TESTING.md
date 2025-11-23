# Backend Testing Checklist

## Before Running Migration

- [ ] Docker Desktop is running
- [ ] Application is accessible at http://localhost:4002
- [ ] You can log in with existing credentials
- [ ] You have noted your admin email for SUPERADMIN promotion

## Running the Migration

**Option 1: Automated Script**
```bash
./test-backend-migration.sh
```

**Option 2: Manual Steps**

### 1. Backup Database
```bash
docker compose exec -T postgres pg_dump -U admin rockola > backup-$(date +%Y%m%d-%H%M%S).sql
```

### 2. Run Migration
```bash
# Generate Prisma client
docker compose exec app npx prisma generate

# Apply migration (if Prisma 7 works)
docker compose exec app npx prisma migrate dev --name remove-teams-add-superadmin

# OR use manual SQL script
docker cp prisma/migrations/backup-and-migrate-to-user-based.sql $(docker compose ps -q postgres):/tmp/
docker compose exec postgres psql -U admin -d rockola -f /tmp/backup-and-migrate-to-user-based.sql
```

### 3. Set SUPERADMIN
```bash
docker compose exec postgres psql -U admin -d rockola
```

```sql
-- Replace with your email
UPDATE "User" SET role = 'SUPERADMIN' WHERE email = 'your-email@example.com';

-- Verify
SELECT id, name, email, role FROM "User";

\q
```

### 4. Rebuild & Restart
```bash
docker compose build app
docker compose up -d
```

## Verification Tests

### Database Structure
- [ ] `Team` table does not exist
- [ ] `TeamMember` table does not exist  
- [ ] `Invitation` table does not exist
- [ ] `Venue` table has `userId` column (not `teamId`)
- [ ] `ApiKey` table has `userId` column (not `teamId`)
- [ ] `User` table has `role` column

**Check with:**
```bash
docker compose exec postgres psql -U admin -d rockola -c "\dt"
docker compose exec postgres psql -U admin -d rockola -c '\d "Venue"'
docker compose exec postgres psql -U admin -d rockola -c '\d "User"'
```

### Data Migration
- [ ] All venues have a `userId` (not null)
- [ ] Users have roles assigned (default: USER)
- [ ] At least one SUPERADMIN user exists

**Check with:**
```bash
docker compose exec postgres psql -U admin -d rockola
```

```sql
-- Check venues have owners
SELECT id, name, "userId" FROM "Venue";

-- Check users have roles
SELECT id, name, email, role FROM "User";

-- Verify no NULL userId
SELECT COUNT(*) FROM "Venue" WHERE "userId" IS NULL;  -- Should be 0
```

### API Endpoints

**Test 1: Unauthenticated request (should return 401)**
```bash
curl -i http://localhost:4002/api/venues
# Expected: 401 Unauthorized
```

**Test 2: Get venues (need to authenticate in browser first)**
1. Go to http://localhost:4002
2. Log in
3. Open browser console
4. Run:
```javascript
fetch('/api/venues')
  .then(r => r.json())
  .then(console.log)
// Should return venues for current user
```

**Test 3: SUPERADMIN can see all venues**
1. Log in as SUPERADMIN user
2. In browser console:
```javascript
fetch('/api/venues')
  .then(r => r.json())
  .then(console.log)
// Should return ALL venues (not just own)
```

### Application Tests

#### As Regular User:
- [ ] Can log in successfully
- [ ] Can create a new venue (UI might be broken, but API should work)
- [ ] Can view only own venues
- [ ] Cannot see other users' venues

#### As SUPERADMIN:
- [ ] Can log in successfully
- [ ] Can see ALL venues from all users
- [ ] Can edit any venue
- [ ] Can delete any venue

### Spotify Integration
- [ ] Venue has `spotifyClientId` and `spotifyClientSecret` configured
- [ ] Can initiate Spotify OAuth flow
- [ ] Callback URL redirects to `/venues` (not `/teams/...`)
- [ ] Spotify credentials save correctly
- [ ] n8n webhook receives correct payload

## Common Issues

### Issue: Prisma generate fails
**Solution:** Use manual SQL migration script

### Issue: Migration shows "relation does not exist"
**Solution:** Migration script should handle this, but if it fails, restore backup and retry

### Issue: Old team URLs still work
**Solution:** This is because old API endpoints still exist. They will be removed after UI refactoring is complete.

### Issue: Cannot access any venues
**Solution:** Check that venues have `userId` populated:
```sql
SELECT id, name, "userId" FROM "Venue" WHERE "userId" IS NULL;
```

## Success Criteria

✅ Backend migration is successful when:

1. Database schema is updated (no Team tables, Venue has userId)
2. All venues have a userId
3. At least one SUPERADMIN user exists
4. New API endpoints respond correctly
5. Application starts without errors
6. Can log in and access basic functionality

## If Something Goes Wrong

### Rollback Procedure:

```bash
# Stop everything
docker compose down

# Restore database
docker compose up -d postgres
sleep 5

# Restore from backup
docker compose exec -T postgres psql -U admin -d rockola < backup-YYYYMMDD-HHMMSS.sql

# Revert code (optional - if you want to go back to team-based)
git checkout HEAD -- prisma/schema.prisma models/ lib/permissions.ts pages/api/

# Restart
docker compose up -d
```

## Next Phase

Once backend tests pass, you can proceed with:
- [ ] UI refactoring
- [ ] SUPERADMIN dashboard
- [ ] Remove old team-based components

---

**Report any issues before proceeding with UI changes!**


