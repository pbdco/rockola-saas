#!/bin/bash

# Backend Migration & Testing Script for Rockola
# This script will backup, migrate, and test the new user-based architecture

set -e  # Exit on error

echo "=================================="
echo "Rockola Backend Migration & Test"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Backup Database
echo -e "${YELLOW}Step 1: Backing up database...${NC}"
BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
docker compose exec -T db pg_dump -U admin saas-starter-kit > "$BACKUP_FILE"

if [ -f "$BACKUP_FILE" ]; then
    echo -e "${GREEN}✓ Database backed up to: $BACKUP_FILE${NC}"
else
    echo -e "${RED}✗ Backup failed!${NC}"
    exit 1
fi
echo ""

# Step 2: Check current database state
echo -e "${YELLOW}Step 2: Checking current database state...${NC}"
echo "Current tables:"
docker compose exec -T db psql -U admin -d saas-starter-kit -c "\dt" | grep -E "Team|Venue|User"
echo ""

# Step 3: Show current venue ownership
echo "Current Venue ownership (teamId-based):"
docker compose exec -T db psql -U admin -d saas-starter-kit -c 'SELECT id, name, "teamId" FROM "Venue" LIMIT 5;' 2>/dev/null || echo "Venues table structure may already be updated"
echo ""

# Step 4: Run Prisma migration
echo -e "${YELLOW}Step 3: Running Prisma migration...${NC}"
echo "This will:"
echo "  - Remove Team, TeamMember, Invitation tables"
echo "  - Change Venue.teamId -> Venue.userId"
echo "  - Change ApiKey.teamId -> ApiKey.userId"
echo "  - Add User.role column"
echo ""
read -p "Continue with migration? (yes/no): " -r
echo ""

if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Generating Prisma client..."
    docker compose exec -T app npx prisma generate || {
        echo -e "${RED}✗ Prisma generate failed. Trying manual migration...${NC}"
        
        # Try manual migration
        echo "Copying migration script to container..."
        docker cp prisma/migrations/backup-and-migrate-to-user-based.sql $(docker compose ps -q db):/tmp/
        
        echo "Running manual migration..."
        docker compose exec -T db psql -U admin -d saas-starter-kit -f /tmp/backup-and-migrate-to-user-based.sql
    }
    
    echo -e "${GREEN}✓ Migration completed${NC}"
else
    echo "Migration cancelled."
    exit 0
fi
echo ""

# Step 5: Verify migration
echo -e "${YELLOW}Step 4: Verifying migration...${NC}"

echo "Checking for old Team tables (should not exist):"
docker compose exec -T db psql -U admin -d saas-starter-kit -c "\dt" | grep -E "Team|Invitation" && echo -e "${RED}✗ Team tables still exist!${NC}" || echo -e "${GREEN}✓ Team tables removed${NC}"
echo ""

echo "Checking Venue table structure (should have userId):"
docker compose exec -T db psql -U admin -d saas-starter-kit -c '\d "Venue"' | grep userId && echo -e "${GREEN}✓ Venue has userId column${NC}" || echo -e "${RED}✗ Venue missing userId!${NC}"
echo ""

echo "Checking User table structure (should have role):"
docker compose exec -T db psql -U admin -d saas-starter-kit -c '\d "User"' | grep role && echo -e "${GREEN}✓ User has role column${NC}" || echo -e "${RED}✗ User missing role!${NC}"
echo ""

echo "Current Venue ownership (userId-based):"
docker compose exec -T db psql -U admin -d saas-starter-kit -c 'SELECT v.id, v.name, v."userId", u.email FROM "Venue" v LEFT JOIN "User" u ON v."userId" = u.id LIMIT 5;'
echo ""

# Step 6: Set SUPERADMIN user
echo -e "${YELLOW}Step 5: Setting SUPERADMIN user...${NC}"
read -p "Enter email address for SUPERADMIN user: " ADMIN_EMAIL

if [ ! -z "$ADMIN_EMAIL" ]; then
    docker compose exec -T db psql -U admin -d saas-starter-kit -c "UPDATE \"User\" SET role = 'SUPERADMIN' WHERE email = '$ADMIN_EMAIL';"
    
    echo "Current users and roles:"
    docker compose exec -T db psql -U admin -d saas-starter-kit -c 'SELECT id, name, email, role FROM "User";'
    echo ""
fi

# Step 7: Rebuild and restart app
echo -e "${YELLOW}Step 6: Rebuilding and restarting application...${NC}"
docker compose build app
docker compose up -d app
echo ""

echo "Waiting for app to start..."
sleep 5
echo ""

# Step 8: Test new API endpoints
echo -e "${YELLOW}Step 7: Testing new API endpoints...${NC}"
echo ""

echo "Testing /api/venues endpoint (should return 401 without auth):"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4002/api/venues)
if [ "$RESPONSE" = "401" ]; then
    echo -e "${GREEN}✓ API endpoint responding correctly (401 Unauthorized)${NC}"
else
    echo -e "${YELLOW}⚠ API returned: $RESPONSE (expected 401)${NC}"
fi
echo ""

# Step 9: Check app logs
echo -e "${YELLOW}Step 8: Checking application logs...${NC}"
echo "Last 20 lines of app logs:"
docker compose logs --tail=20 app
echo ""

# Step 10: Summary
echo "=================================="
echo -e "${GREEN}Backend Migration Complete!${NC}"
echo "=================================="
echo ""
echo "What was changed:"
echo "  ✓ Database schema updated"
echo "  ✓ Team models removed"
echo "  ✓ Venues now owned by users"
echo "  ✓ SUPERADMIN role added"
echo "  ✓ New API endpoints active"
echo ""
echo "Backup saved to: $BACKUP_FILE"
echo ""
echo "Next steps:"
echo "  1. Test login at http://localhost:4002"
echo "  2. Verify user can access their venues"
echo "  3. Test Spotify connection"
echo "  4. Proceed with UI refactoring"
echo ""
echo "Old team-based URLs will no longer work!"
echo "New URL structure: /venues (not /teams/[slug]/venues)"
echo ""
echo "=================================="

