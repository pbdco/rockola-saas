-- Migration: Remove Teams, Make Venues User-Owned
-- This migration transforms the multi-tenant team-based architecture to user-owned venues
-- Database: saas-starter-kit (PostgreSQL)

-- Step 1: Add temporary columns to Venue to store new userId
ALTER TABLE "Venue" ADD COLUMN "userId" TEXT;

-- Step 2: Add role column to User
ALTER TABLE "User" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'USER';

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
);

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
CREATE INDEX "Venue_userId_idx" ON "Venue"("userId");

-- Step 6: Add foreign key constraint
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 7: Drop old teamId foreign key and column
ALTER TABLE "Venue" DROP CONSTRAINT "Venue_teamId_fkey";
DROP INDEX IF EXISTS "Venue_teamId_idx";
ALTER TABLE "Venue" DROP COLUMN "teamId";

-- Step 8: Migrate ApiKeys to be user-owned (assign to first admin/owner of team)
ALTER TABLE "ApiKey" ADD COLUMN "userId" TEXT;

UPDATE "ApiKey" ak
SET "userId" = (
  SELECT tm."userId"
  FROM "TeamMember" tm
  WHERE tm."teamId" = ak."teamId"
    AND tm."role" IN ('OWNER', 'ADMIN')
  ORDER BY tm."createdAt" ASC
  LIMIT 1
);

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

-- Make userId NOT NULL
ALTER TABLE "ApiKey" ALTER COLUMN "userId" SET NOT NULL;

-- Create index and foreign key for ApiKey
CREATE INDEX "ApiKey_userId_idx" ON "ApiKey"("userId");
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old teamId from ApiKey
ALTER TABLE "ApiKey" DROP CONSTRAINT "ApiKey_teamId_fkey";
DROP INDEX IF EXISTS "ApiKey_teamId_idx";
ALTER TABLE "ApiKey" DROP COLUMN "teamId";

-- Step 9: Drop Team-related tables (CASCADE will handle foreign keys)
DROP TABLE IF EXISTS "Invitation" CASCADE;
DROP TABLE IF EXISTS "TeamMember" CASCADE;
DROP TABLE IF EXISTS "Team" CASCADE;

-- Step 10: Update Role enum
-- First, update existing user roles to default to USER (optional, since we added default)
-- No need to update if default was applied

-- Note: The Role enum changes (ADMIN->USER, removing OWNER/MEMBER) will be handled by Prisma's migration

-- Step 11: You may want to manually set certain users as SUPERADMIN
-- Example: UPDATE "User" SET role = 'SUPERADMIN' WHERE email = 'admin@example.com';

