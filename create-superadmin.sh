#!/bin/bash

# Create SUPERADMIN user script
# Usage: ./create-superadmin.sh [email] [password] [name]

EMAIL=${1:-admin@rockola.com}
PASSWORD=${2:-admin123}
NAME=${3:-"Super Admin"}

echo "Creating SUPERADMIN user..."
echo "Email: $EMAIL"
echo "Name: $NAME"

# Hash password using Node.js (requires bcryptjs)
# For now, we'll use a SQL approach that requires manual password hashing
# Or use Prisma Studio to create the user

echo ""
echo "Option 1: Using Prisma Studio (Recommended)"
echo "Run: docker compose exec app npx prisma studio"
echo "Then create a user with:"
echo "  - Email: $EMAIL"
echo "  - Name: $NAME"
echo "  - Role: SUPERADMIN"
echo "  - Password: (set via signup or use bcrypt hash)"
echo ""
echo "Option 2: Using SQL (after creating user via signup)"
echo "Run this SQL to update an existing user:"
echo ""
echo "docker compose exec db psql -U postgres -d saas-starter-kit -c \"UPDATE \\\"User\\\" SET role = 'SUPERADMIN' WHERE email = '$EMAIL';\""
echo ""
echo "Option 3: Create user via UI, then update role"
echo "1. Sign up at http://localhost:4002/auth/join with email: $EMAIL"
echo "2. Then run the SQL command above to set role to SUPERADMIN"
