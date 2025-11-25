-- Fix ApiKey table: migrate from teamId to userId
-- Since ApiKey table is empty, we can safely drop and recreate

-- Step 1: Drop old foreign key constraint and index
ALTER TABLE "ApiKey" DROP CONSTRAINT IF EXISTS "ApiKey_teamId_fkey";
DROP INDEX IF EXISTS "ApiKey_teamId_idx";

-- Step 2: Add userId column
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- Step 3: Since table is empty, we can safely set userId to a default (will be NOT NULL after)
-- For existing rows (if any), we would need to migrate from teamId to userId
-- But since table is empty, we can proceed

-- Step 4: Make userId NOT NULL (safe since table is empty)
ALTER TABLE "ApiKey" ALTER COLUMN "userId" SET NOT NULL;

-- Step 5: Add foreign key constraint to User table
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- Step 6: Create index on userId
CREATE INDEX IF NOT EXISTS "ApiKey_userId_idx" ON "ApiKey"("userId");

-- Step 7: Drop old teamId column
ALTER TABLE "ApiKey" DROP COLUMN IF EXISTS "teamId";
