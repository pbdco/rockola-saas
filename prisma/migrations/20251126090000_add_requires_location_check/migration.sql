-- Add requiresLocationCheck flag to Venue
-- Idempotent: only adds column if it does not already exist

ALTER TABLE "Venue"
ADD COLUMN IF NOT EXISTS "requiresLocationCheck" BOOLEAN NOT NULL DEFAULT FALSE;
