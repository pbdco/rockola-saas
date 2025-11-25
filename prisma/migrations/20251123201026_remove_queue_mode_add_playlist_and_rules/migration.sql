-- Step 0: Update Role enum and add role column to User table
-- First, update Role enum from old values to new values
DO $$ 
BEGIN
    -- Check if Role enum exists with old values
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
        -- Create new Role enum
        CREATE TYPE "Role_new" AS ENUM ('SUPERADMIN', 'USER');
        
        -- Update TeamMember if it exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'TeamMember') THEN
            ALTER TABLE "TeamMember" ALTER COLUMN "role" DROP DEFAULT;
            ALTER TABLE "TeamMember" ALTER COLUMN "role" TYPE "Role_new" USING 'USER'::"Role_new";
            ALTER TABLE "TeamMember" ALTER COLUMN "role" SET DEFAULT 'USER'::"Role_new";
        END IF;
        
        -- Update Invitation if it exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Invitation') THEN
            ALTER TABLE "Invitation" ALTER COLUMN "role" DROP DEFAULT;
            ALTER TABLE "Invitation" ALTER COLUMN "role" TYPE "Role_new" USING 'USER'::"Role_new";
            ALTER TABLE "Invitation" ALTER COLUMN "role" SET DEFAULT 'USER'::"Role_new";
        END IF;
        
        -- Update Team if it exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Team') THEN
            ALTER TABLE "Team" ALTER COLUMN "defaultRole" DROP DEFAULT;
            ALTER TABLE "Team" ALTER COLUMN "defaultRole" TYPE "Role_new" USING 'USER'::"Role_new";
            ALTER TABLE "Team" ALTER COLUMN "defaultRole" SET DEFAULT 'USER'::"Role_new";
        END IF;
        
        -- Drop old enum and rename new one
        DROP TYPE "Role";
        ALTER TYPE "Role_new" RENAME TO "Role";
    ELSE
        -- Create Role enum if it doesn't exist
        CREATE TYPE "Role" AS ENUM ('SUPERADMIN', 'USER');
    END IF;
    
    -- Add role column to User table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'role'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'USER';
    END IF;
END $$;

-- Step 1: Migrate existing QUEUE venues to PLAYLIST
UPDATE "Venue" SET "mode" = 'PLAYLIST' WHERE "mode" = 'QUEUE';

-- Step 2: Create RuleType enum
CREATE TYPE "RuleType" AS ENUM ('CONTENT', 'TIME', 'PRICING', 'REQUESTS');

-- Step 3: Add playlist fields to Venue table
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "spotifyPlaylistId" TEXT;
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "spotifyPlaylistUrl" TEXT;

-- Step 4: Create VenueRule table
CREATE TABLE IF NOT EXISTS "VenueRule" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "RuleType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 10,
    "conditions" JSONB,
    "actions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VenueRule_pkey" PRIMARY KEY ("id")
);

-- Step 5: Add foreign key and indexes for VenueRule
ALTER TABLE "VenueRule" ADD CONSTRAINT "VenueRule_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "VenueRule_venueId_idx" ON "VenueRule"("venueId");
CREATE INDEX IF NOT EXISTS "VenueRule_venueId_enabled_idx" ON "VenueRule"("venueId", "enabled");

-- Step 6: Remove QUEUE from VenueMode enum
-- Note: PostgreSQL doesn't support removing enum values directly
-- We need to create a new enum and migrate

-- First, remove the default constraint
ALTER TABLE "Venue" ALTER COLUMN "mode" DROP DEFAULT;

-- Create new enum without QUEUE
CREATE TYPE "VenueMode_new" AS ENUM ('PLAYLIST', 'AUTOMATION');

-- Update Venue table to use new enum (convert QUEUE to PLAYLIST)
ALTER TABLE "Venue" ALTER COLUMN "mode" TYPE "VenueMode_new" USING (
  CASE 
    WHEN "mode"::text = 'QUEUE' THEN 'PLAYLIST'::"VenueMode_new"
    WHEN "mode"::text = 'PLAYLIST' THEN 'PLAYLIST'::"VenueMode_new"
    WHEN "mode"::text = 'AUTOMATION' THEN 'AUTOMATION'::"VenueMode_new"
    ELSE 'PLAYLIST'::"VenueMode_new"
  END
);

-- Drop old enum and rename new one
DROP TYPE "VenueMode";
ALTER TYPE "VenueMode_new" RENAME TO "VenueMode";

-- Step 7: Set new default value for mode column
ALTER TABLE "Venue" ALTER COLUMN "mode" SET DEFAULT 'PLAYLIST'::"VenueMode";
