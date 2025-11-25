#!/bin/bash
# Database Schema Verification Script
# This script ensures the database schema matches Prisma's expectations

set -e

echo "🔍 Verifying database schema against Prisma schema..."

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Required Venue columns from schema.prisma
REQUIRED_VENUE_COLUMNS=(
    "id"
    "userId"
    "name"
    "slug"
    "address"
    "mode"
    "spotifyClientId"
    "spotifyClientSecret"
    "spotifyUserId"
    "spotifyDisplayName"
    "spotifyAccessToken"
    "spotifyRefreshToken"
    "spotifyTokenExpiresAt"
    "spotifyPlaylistId"
    "spotifyPlaylistUrl"
    "n8nCredentialId"
    "pricingEnabled"
    "pricePerSong"
    "currency"
    "qrCodeUrl"
    "isActive"
    "createdAt"
    "updatedAt"
)

# Check if running in Docker
if command -v docker-compose &> /dev/null; then
    PSQL_CMD="docker-compose exec -T db psql -U admin -d saas-starter-kit"
else
    echo -e "${RED}❌ docker-compose not found${NC}"
    exit 1
fi

echo "Checking Venue table columns..."

# Get existing columns
EXISTING_COLUMNS=$($PSQL_CMD -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'Venue' ORDER BY column_name;" -t | tr -d ' ' | grep -v '^$')

# Check each required column
MISSING_COLUMNS=()
for col in "${REQUIRED_VENUE_COLUMNS[@]}"; do
    if ! echo "$EXISTING_COLUMNS" | grep -q "^$col$"; then
        MISSING_COLUMNS+=("$col")
    fi
done

# Report results
if [ ${#MISSING_COLUMNS[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ All required Venue columns exist!${NC}"
else
    echo -e "${RED}❌ Missing columns in Venue table:${NC}"
    for col in "${MISSING_COLUMNS[@]}"; do
        echo -e "  ${YELLOW}- $col${NC}"
    done
    echo ""
    echo "Run the following SQL to fix:"
    echo ""
    for col in "${MISSING_COLUMNS[@]}"; do
        echo "ALTER TABLE \"Venue\" ADD COLUMN IF NOT EXISTS \"$col\" TEXT;"
    done
    exit 1
fi

# Check userId exists (critical for venues)
echo "Verifying userId column..."
USERID_EXISTS=$($PSQL_CMD -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'Venue' AND column_name = 'userId';" -t | tr -d ' ')
if [ -z "$USERID_EXISTS" ]; then
    echo -e "${RED}❌ CRITICAL: userId column missing!${NC}"
    exit 1
else
    echo -e "${GREEN}✅ userId column exists${NC}"
fi

# Check that teamId doesn't exist (should be removed)
echo "Verifying teamId column is removed..."
TEAMID_EXISTS=$($PSQL_CMD -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'Venue' AND column_name = 'teamId';" -t | tr -d ' ')
if [ -n "$TEAMID_EXISTS" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Old teamId column still exists!${NC}"
    echo "Run: ALTER TABLE \"Venue\" DROP COLUMN IF EXISTS \"teamId\";"
else
    echo -e "${GREEN}✅ Old teamId column is removed${NC}"
fi

# Check ApiKey table schema
echo ""
echo "Checking ApiKey table schema..."
APIKEY_USERID_EXISTS=$($PSQL_CMD -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'ApiKey' AND column_name = 'userId';" -t | tr -d ' ')
APIKEY_TEAMID_EXISTS=$($PSQL_CMD -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'ApiKey' AND column_name = 'teamId';" -t | tr -d ' ')

if [ -z "$APIKEY_USERID_EXISTS" ]; then
    echo -e "${RED}❌ CRITICAL: ApiKey.userId column missing!${NC}"
    echo "Run migration: prisma/migrations/20251125000000_fix_apikey_userid/migration.sql"
    exit 1
else
    echo -e "${GREEN}✅ ApiKey.userId column exists${NC}"
fi

if [ -n "$APIKEY_TEAMID_EXISTS" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Old ApiKey.teamId column still exists!${NC}"
    echo "Run: ALTER TABLE \"ApiKey\" DROP COLUMN IF EXISTS \"teamId\";"
else
    echo -e "${GREEN}✅ Old ApiKey.teamId column is removed${NC}"
fi

# Check ApiKey foreign key
echo "Verifying ApiKey foreign key..."
APIKEY_FK_EXISTS=$($PSQL_CMD -c "SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'ApiKey' AND constraint_name = 'ApiKey_userId_fkey';" -t | tr -d ' ')
if [ -z "$APIKEY_FK_EXISTS" ]; then
    echo -e "${YELLOW}⚠️  WARNING: ApiKey foreign key missing!${NC}"
else
    echo -e "${GREEN}✅ ApiKey foreign key exists${NC}"
fi

echo ""
echo -e "${GREEN}✅ Database schema verification complete!${NC}"
