-- Fix Venue table: Rename teamId to userId
-- This migration fixes the schema mismatch where the database has teamId but Prisma expects userId

-- Step 1: Add userId column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Venue' AND column_name = 'userId'
    ) THEN
        ALTER TABLE "Venue" ADD COLUMN "userId" TEXT;
    END IF;
END $$;

-- Step 2: Migrate data from teamId to userId (if TeamMember table exists and has data)
-- For each venue, find the first member of the team and assign them as the owner
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'TeamMember') 
       AND EXISTS (SELECT 1 FROM "Venue" WHERE "userId" IS NULL) THEN
        UPDATE "Venue" v
        SET "userId" = (
            SELECT tm."userId"
            FROM "TeamMember" tm
            WHERE tm."teamId" = v."teamId"
            ORDER BY tm."createdAt" ASC
            LIMIT 1
        )
        WHERE v."userId" IS NULL;
    END IF;
END $$;

-- Step 3: For venues without a team, set userId to a default user if available
DO $$ 
DECLARE
    default_user_id TEXT;
BEGIN
    SELECT id INTO default_user_id FROM "User" ORDER BY "createdAt" ASC LIMIT 1;
    
    IF default_user_id IS NOT NULL THEN
        UPDATE "Venue" SET "userId" = default_user_id WHERE "userId" IS NULL;
    END IF;
END $$;

-- Step 4: Make userId NOT NULL (only if all venues have userId or no venues exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Venue" WHERE "userId" IS NULL) THEN
        ALTER TABLE "Venue" ALTER COLUMN "userId" SET NOT NULL;
    END IF;
END $$;

-- Step 5: Create index on userId if it doesn't exist
CREATE INDEX IF NOT EXISTS "Venue_userId_idx" ON "Venue"("userId");

-- Step 6: Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Venue_userId_fkey'
    ) THEN
        ALTER TABLE "Venue" ADD CONSTRAINT "Venue_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Step 7: Drop old teamId foreign key and column if they exist
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Venue_teamId_fkey'
    ) THEN
        ALTER TABLE "Venue" DROP CONSTRAINT "Venue_teamId_fkey";
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'Venue_teamId_idx'
    ) THEN
        DROP INDEX "Venue_teamId_idx";
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Venue' AND column_name = 'teamId'
    ) THEN
        ALTER TABLE "Venue" DROP COLUMN "teamId";
    END IF;
END $$;

-- Step 8: Add all missing Spotify-related columns if they don't exist
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "spotifyClientId" TEXT;
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "spotifyClientSecret" TEXT;
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "spotifyDisplayName" TEXT;

-- Step 9: Add n8nCredentialId column if it doesn't exist
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "n8nCredentialId" TEXT;
