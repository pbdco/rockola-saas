#!/bin/bash

# SUPERADMIN Management Script
# Usage:
#   ./manage-superadmin.sh list                    # List all SUPERADMIN users
#   ./manage-superadmin.sh create [email] [name]    # Create/update user to SUPERADMIN
#   ./manage-superadmin.sh remove [email]          # Remove SUPERADMIN role from user

set -e

DB_USER="admin"
DB_NAME="saas-starter-kit"
CONTAINER_NAME="saas-starter-kit-main-db-1"

# Function to list all SUPERADMIN users
list_superadmins() {
    echo "🔍 Listing all SUPERADMIN users..."
    echo ""
    docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            email,
            name,
            role,
            \"emailVerified\",
            \"createdAt\"
        FROM \"User\" 
        WHERE role = 'SUPERADMIN'
        ORDER BY \"createdAt\" DESC;
    " 2>/dev/null || docker compose exec db psql -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            email,
            name,
            role,
            \"emailVerified\",
            \"createdAt\"
        FROM \"User\" 
        WHERE role = 'SUPERADMIN'
        ORDER BY \"createdAt\" DESC;
    "
}

# Function to create or update a user to SUPERADMIN
create_superadmin() {
    local email="${1:-}"
    local name="${2:-Super Admin}"
    
    if [ -z "$email" ]; then
        echo "❌ Error: Email is required"
        echo ""
        echo "Usage: ./manage-superadmin.sh create [email] [name]"
        echo "Example: ./manage-superadmin.sh create admin@rockola.com \"Super Admin\""
        exit 1
    fi
    
    echo "🔧 Creating/updating SUPERADMIN user..."
    echo "   Email: $email"
    echo "   Name: $name"
    echo ""
    
    # Check if user exists
    user_exists=$(docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*) FROM \"User\" WHERE email = '$email';
    " 2>/dev/null | tr -d ' ' || docker compose exec db psql -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*) FROM \"User\" WHERE email = '$email';
    " | tr -d ' ')
    
    if [ "$user_exists" = "0" ]; then
        echo "⚠️  User with email '$email' does not exist."
        echo ""
        echo "Please sign up first at http://localhost:4002/auth/join"
        echo "Then run this script again to update the role."
        exit 1
    else
        # Update user to SUPERADMIN
        docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" -c "
            UPDATE \"User\" 
            SET role = 'SUPERADMIN', name = '$name'
            WHERE email = '$email';
        " 2>/dev/null || docker compose exec db psql -U "$DB_USER" -d "$DB_NAME" -c "
            UPDATE \"User\" 
            SET role = 'SUPERADMIN', name = '$name'
            WHERE email = '$email';
        "
        
        echo "✅ Successfully updated user '$email' to SUPERADMIN"
        echo ""
        echo "📧 Email: $email"
        echo "👤 Name: $name"
        echo "🔑 Role: SUPERADMIN"
    fi
}

# Function to remove SUPERADMIN role (set to USER)
remove_superadmin() {
    local email="${1:-}"
    
    if [ -z "$email" ]; then
        echo "❌ Error: Email is required"
        echo ""
        echo "Usage: ./manage-superadmin.sh remove [email]"
        echo "Example: ./manage-superadmin.sh remove admin@rockola.com"
        exit 1
    fi
    
    echo "🔧 Removing SUPERADMIN role from user..."
    echo "   Email: $email"
    echo ""
    
    docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" -c "
        UPDATE \"User\" 
        SET role = 'USER'
        WHERE email = '$email';
    " 2>/dev/null || docker compose exec db psql -U "$DB_USER" -d "$DB_NAME" -c "
        UPDATE \"User\" 
        SET role = 'USER'
        WHERE email = '$email';
    "
    
    echo "✅ Successfully removed SUPERADMIN role from '$email'"
}

# Main script logic
case "${1:-}" in
    list)
        list_superadmins
        ;;
    create)
        create_superadmin "$2" "$3"
        ;;
    remove)
        remove_superadmin "$2"
        ;;
    *)
        echo "SUPERADMIN Management Script"
        echo ""
        echo "Usage:"
        echo "  ./manage-superadmin.sh list                    # List all SUPERADMIN users"
        echo "  ./manage-superadmin.sh create [email] [name]   # Create/update user to SUPERADMIN"
        echo "  ./manage-superadmin.sh remove [email]          # Remove SUPERADMIN role"
        echo ""
        echo "Examples:"
        echo "  ./manage-superadmin.sh list"
        echo "  ./manage-superadmin.sh create admin@rockola.com \"Super Admin\""
        echo "  ./manage-superadmin.sh remove admin@rockola.com"
        echo ""
        echo "Note: For 'create', the user must already exist (sign up first at http://localhost:4002/auth/join)"
        exit 1
        ;;
esac

