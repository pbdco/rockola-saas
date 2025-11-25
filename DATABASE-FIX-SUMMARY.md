# Database Schema Fix Summary

## Problem
The database schema was out of sync with Prisma schema, causing errors when creating venues:
1. `teamId` column existed but Prisma expected `userId`
2. Missing columns: `spotifyClientId`, `spotifyClientSecret`, `spotifyDisplayName`, `n8nCredentialId`

## Solution Applied

### 1. Migration Created: `20251124000800_fix_venue_userid`
This migration:
- Adds `userId` column
- Migrates data from `teamId` to `userId` (if applicable)
- Drops old `teamId` column and constraints
- Adds all missing Spotify-related columns
- Adds `n8nCredentialId` column

### 2. Verification Script Created
Created `scripts/verify-database-schema.sh` to check database schema matches Prisma expectations.

Run it anytime with:
```bash
./scripts/verify-database-schema.sh
```

### 3. Changes Made

#### Database columns added to Venue table:
- `userId` (NOT NULL, with foreign key to User)
- `spotifyClientId`
- `spotifyClientSecret`
- `spotifyDisplayName`
- `n8nCredentialId`

#### Database columns removed:
- `teamId` (replaced with `userId`)

## How to Prevent This in the Future

### 1. Always run schema verification after migrations:
```bash
./scripts/verify-database-schema.sh
```

### 2. Before deploying, check schema sync:
```bash
npx prisma migrate status
npx prisma validate
```

### 3. After pulling schema changes:
```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Use the migration properly:
The migration `20251124000800_fix_venue_userid` is idempotent and safe to run multiple times.

## Current Status
✅ All database columns match Prisma schema
✅ `userId` column exists with proper foreign key
✅ All Spotify-related columns present
✅ Old `teamId` column removed
✅ Verification script in place

## Testing
The database is now ready for venue creation. Test by:
1. Navigate to `/venues/create`
2. Fill in venue details
3. Submit the form
4. No errors should occur

All database operations are logged to Docker stdout for debugging.
