-- Migration: Remove Teams, Make Venues User-Owned (FIXED)
-- This migration transforms the multi-tenant team-based architecture to user-owned venues
-- Database: saas-starter-kit (PostgreSQL)

-- Step 1: Add temporary columns to Venue to store new userId
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- Step 2: Update the Role enum - remove old values and add new ones
-- We need to do this carefully because you can't just modify an enum in PostgreSQL

-- First, create a new enum with the desired values
DO $$ 
BEGIN
    -- Drop the old enum if it exists (will fail if in use, which is ok)
    -- We'll recreate it with new values
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role_new') THEN
        CREATE TYPE "Role_new" AS ENUM ('SUPERADMIN', 'USER');
    END IF;
END $$;

-- Step 3: Migrate venues to be owned by the first admin/owner of each team
-- For each venue, find the first OWNER or ADMIN of the team and assign them as the owner
UPDATE "Venue" v
SET "userId" = (
  SELECT tm."userId"
  FROM "TeamMember" tm
  WHERE tm."teamId" = v."teamId"
    AND tm."role" IN ('OWNER', 'ADMIN')
  ORDER BY tm."createdAt" ASC
  LIMIT 1
)
WHERE "userId" IS NULL;

-- If no owner/admin found (shouldn't happen), use first member
UPDATE "Venue" v
SET "userId" = (
  SELECT tm."userId"
  FROM "TeamMember" tm
  WHERE tm."teamId" = v."teamId"
  ORDER BY tm."createdAt" ASC
  LIMIT 1
)
WHERE "userId" IS NULL;

-- Step 4: Make userId NOT NULL now that we've populated it
ALTER TABLE "Venue" ALTER COLUMN "userId" SET NOT NULL;

-- Step 5: Create index on userId
CREATE INDEX IF NOT EXISTS "Venue_userId_idx" ON "Venue"("userId");

-- Step 6: Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Venue_userId_fkey'
    ) THEN
        ALTER TABLE "Venue" ADD CONSTRAINT "Venue_userId_fkey" 
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Step 7: Drop old teamId foreign key and column
ALTER TABLE "Venue" DROP CONSTRAINT IF EXISTS "Venue_teamId_fkey";
DROP INDEX IF EXISTS "Venue_teamId_idx";
ALTER TABLE "Venue" DROP COLUMN IF EXISTS "teamId";

-- Step 8: Migrate ApiKeys to be user-owned (assign to first admin/owner of team)
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "userId" TEXT;

UPDATE "ApiKey" ak
SET "userId" = (
  SELECT tm."userId"
  FROM "TeamMember" tm
  WHERE tm."teamId" = ak."teamId"
    AND tm."role" IN ('OWNER', 'ADMIN')
  ORDER BY tm."createdAt" ASC
  LIMIT 1
)
WHERE "userId" IS NULL;

-- If no owner/admin found, use first member
UPDATE "ApiKey" ak
SET "userId" = (
  SELECT tm."userId"
  FROM "TeamMember" tm
  WHERE tm."teamId" = ak."teamId"
  ORDER BY tm."createdAt" ASC
  LIMIT 1
)
WHERE "userId" IS NULL;

-- Make userId NOT NULL if there are ApiKeys
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "ApiKey" LIMIT 1) THEN
        ALTER TABLE "ApiKey" ALTER COLUMN "userId" SET NOT NULL;
    END IF;
END $$;

-- Create index and foreign key for ApiKey
CREATE INDEX IF NOT EXISTS "ApiKey_userId_idx" ON "ApiKey"("userId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ApiKey_userId_fkey'
    ) THEN
        ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" 
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Drop old teamId from ApiKey
ALTER TABLE "ApiKey" DROP CONSTRAINT IF EXISTS "ApiKey_teamId_fkey";
DROP INDEX IF EXISTS "ApiKey_teamId_idx";
ALTER TABLE "ApiKey" DROP COLUMN IF EXISTS "teamId";

-- Step 9: Drop Team-related tables (CASCADE will handle foreign keys)
DROP TABLE IF EXISTS "Invitation" CASCADE;
DROP TABLE IF EXISTS "TeamMember" CASCADE;
DROP TABLE IF EXISTS "Team" CASCADE;

-- Step 10: Now update the Role enum
-- This is tricky - we need to:
-- 1. Add role column to User with the NEW enum type
-- 2. Drop the old Role enum
-- 3. Rename Role_new to Role

-- Add role column to User using the new enum
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" "Role_new" NOT NULL DEFAULT 'USER';

-- Drop the old Role enum (it should be safe now that Team tables are gone)
DROP TYPE IF EXISTS "Role" CASCADE;

-- Rename the new enum to Role
ALTER TYPE "Role_new" RENAME TO "Role";

-- Step 11: Set default role for all existing users
UPDATE "User" SET role = 'USER' WHERE role IS NULL OR role::text NOT IN ('SUPERADMIN', 'USER');

-- Done!
-- You can now set SUPERADMIN users with:
-- UPDATE "User" SET role = 'SUPERADMIN' WHERE email = 'admin@example.com';


