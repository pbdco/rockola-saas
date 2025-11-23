#!/bin/bash
# Non-interactive migration script

set -e

echo "=================================="
echo "Backend Migration (Non-Interactive)"
echo "=================================="
echo ""

# Backup already created: backup-20251123-004946.sql
echo "✓ Backup created: backup-20251123-004946.sql"
echo ""

# Copy migration script to container
echo "Copying migration SQL to container..."
docker cp prisma/migrations/backup-and-migrate-to-user-based.sql $(docker compose ps -q db):/tmp/migration.sql

# Run migration
echo "Running migration..."
docker compose exec -T db psql -U admin -d saas-starter-kit -f /tmp/migration.sql

echo ""
echo "Migration completed!"
echo ""

# Verify
echo "Verifying migration..."
echo ""

echo "1. Checking if Team tables are gone:"
docker compose exec -T db psql -U admin -d saas-starter-kit -c "\dt" | grep -i team && echo "ERROR: Team tables still exist!" || echo "✓ Team tables removed"
echo ""

echo "2. Checking Venue table (should have userId):"
docker compose exec -T db psql -U admin -d saas-starter-kit -c '\d "Venue"' | grep userId && echo "✓ Venue has userId" || echo "ERROR: No userId column!"
echo ""

echo "3. Checking User table (should have role):"
docker compose exec -T db psql -U admin -d saas-starter-kit -c '\d "User"' | grep -w role && echo "✓ User has role column" || echo "ERROR: No role column!"
echo ""

echo "4. Current venues with owners:"
docker compose exec -T db psql -U admin -d saas-starter-kit -c 'SELECT v.id, v.name, v."userId", u.email FROM "Venue" v LEFT JOIN "User" u ON v."userId" = u.id;'
echo ""

echo "5. Current users with roles:"
docker compose exec -T db psql -U admin -d saas-starter-kit -c 'SELECT id, name, email, role FROM "User";'
echo ""

echo "=================================="
echo "Migration verification complete!"
echo "=================================="
echo ""
echo "Next: Set SUPERADMIN user"
echo 'Run: docker compose exec db psql -U admin -d saas-starter-kit'
echo 'Then: UPDATE "User" SET role = '\''SUPERADMIN'\'' WHERE email = '\''your@email.com'\'';'


