# Super Admin API Testing Commands

**Base URL:** `http://localhost:4002`  
**Authentication:** All endpoints require Super Admin role. You can use either:
- **Session Token** (from browser cookies)
- **API Key** (Bearer token - recommended for API testing)

## Prerequisites

### Option 1: Using API Key (Recommended)

1. **Login as Super Admin** via browser at `http://localhost:4002/auth/login`
2. **Go to Settings → Security** (`http://localhost:4002/settings/security`)
3. **Create an API Key:**
   - Click "Create API Key"
   - Enter a name (e.g., "Admin API Key")
   - Copy the API key immediately (you won't see it again!)
4. **Set the API key:**
   ```bash
   export API_KEY="your-api-key-here"
   ```

### Option 2: Using Session Token

1. **Login as Super Admin** via browser at `http://localhost:4002/auth/login`
2. **Get Session Token:**
   - Open DevTools (F12) → Application → Cookies
   - Copy value of `next-auth.session-token`
3. **Set the token:**
   ```bash
   export SESSION_TOKEN="your-session-token-here"
   ```

---

## User Management Endpoints

### 1. Get All Users

**Using API Key:**
```bash
curl -X GET http://localhost:4002/api/admin/users \
  -H "Authorization: Bearer $API_KEY" \
  | jq .
```

**Using Session Token:**
```bash
curl -X GET http://localhost:4002/api/admin/users \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  | jq .
```

### 2. Create New User

**Using API Key:**
```bash
curl -X POST http://localhost:4002/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "name": "New User",
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "role": "USER"
  }' \
  | jq .
```

**Using Session Token:**
```bash
curl -X POST http://localhost:4002/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -d '{
    "name": "New User",
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "role": "USER"
  }' \
  | jq .
```

### 3. Create Super Admin User
```bash
curl -X POST http://localhost:4002/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -d '{
    "name": "New Admin",
    "email": "newadmin@example.com",
    "password": "SecurePass123!",
    "role": "SUPERADMIN"
  }' \
  | jq .
```

### 4. Get User by ID
```bash
# Replace USER_ID with actual user ID from previous responses
USER_ID="user-id-here"

curl -X GET http://localhost:4002/api/admin/users/$USER_ID \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  | jq .
```

### 5. Update User Details
```bash
USER_ID="user-id-here"

curl -X PUT http://localhost:4002/api/admin/users/$USER_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -d '{
    "name": "Updated Name",
    "email": "updated@example.com",
    "role": "USER"
  }' \
  | jq .
```

### 6. Change User Role to Super Admin
```bash
USER_ID="user-id-here"

curl -X PUT http://localhost:4002/api/admin/users/$USER_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -d '{
    "role": "SUPERADMIN"
  }' \
  | jq .
```

### 7. Block User
```bash
USER_ID="user-id-here"

curl -X PATCH "http://localhost:4002/api/admin/users/$USER_ID?action=block" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -d '{
    "blocked": true
  }' \
  | jq .
```

### 8. Unblock User
```bash
USER_ID="user-id-here"

curl -X PATCH "http://localhost:4002/api/admin/users/$USER_ID?action=block" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -d '{
    "blocked": false
  }' \
  | jq .
```

### 9. Change User Password
```bash
USER_ID="user-id-here"

curl -X PATCH "http://localhost:4002/api/admin/users/$USER_ID?action=change-password" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -d '{
    "newPassword": "NewSecurePass123!"
  }' \
  | jq .
```

### 10. Delete User
```bash
USER_ID="user-id-here"

curl -X DELETE http://localhost:4002/api/admin/users/$USER_ID \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  | jq .
```

---

## Venue Management for Users (Admin)

### 11. Get All Venues for a User
```bash
USER_ID="user-id-here"

curl -X GET http://localhost:4002/api/admin/users/$USER_ID/venues \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  | jq .
```

### 12. Get Active Venues Only
```bash
USER_ID="user-id-here"

curl -X GET "http://localhost:4002/api/admin/users/$USER_ID/venues?active=true" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  | jq .
```

### 13. Get Inactive Venues Only
```bash
USER_ID="user-id-here"

curl -X GET "http://localhost:4002/api/admin/users/$USER_ID/venues?active=false" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  | jq .
```

### 14. Create Venue for User
```bash
USER_ID="user-id-here"

curl -X POST http://localhost:4002/api/admin/users/$USER_ID/venues \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -d '{
    "name": "Admin Created Venue",
    "slug": "admin-venue",
    "address": "123 Admin Street",
    "mode": "QUEUE",
    "pricingEnabled": false,
    "isActive": true
  }' \
  | jq .
```

### 15. Create Venue with Pricing
```bash
USER_ID="user-id-here"

curl -X POST http://localhost:4002/api/admin/users/$USER_ID/venues \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -d '{
    "name": "Premium Venue",
    "slug": "premium-venue",
    "address": "456 Premium Ave",
    "mode": "PLAYLIST",
    "pricingEnabled": true,
    "pricePerSong": 2.99,
    "currency": "USD",
    "isActive": true
  }' \
  | jq .
```

### 16. Create Venue with Spotify Credentials
```bash
USER_ID="user-id-here"

curl -X POST http://localhost:4002/api/admin/users/$USER_ID/venues \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -d '{
    "name": "Spotify Venue",
    "slug": "spotify-venue",
    "mode": "AUTOMATION",
    "spotifyClientId": "your-client-id",
    "spotifyClientSecret": "your-client-secret",
    "isActive": true
  }' \
  | jq .
```

### 17. Get Venue by ID
```bash
USER_ID="user-id-here"
VENUE_ID="venue-id-here"

curl -X GET http://localhost:4002/api/admin/users/$USER_ID/venues/$VENUE_ID \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  | jq .
```

### 18. Update Venue
```bash
USER_ID="user-id-here"
VENUE_ID="venue-id-here"

curl -X PUT http://localhost:4002/api/admin/users/$USER_ID/venues/$VENUE_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -d '{
    "name": "Updated Venue Name",
    "address": "789 Updated Street",
    "isActive": false
  }' \
  | jq .
```

### 19. Update Venue Mode
```bash
USER_ID="user-id-here"
VENUE_ID="venue-id-here"

curl -X PUT http://localhost:4002/api/admin/users/$USER_ID/venues/$VENUE_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -d '{
    "mode": "PLAYLIST"
  }' \
  | jq .
```

### 20. Enable/Disable Venue Pricing
```bash
USER_ID="user-id-here"
VENUE_ID="venue-id-here"

curl -X PUT http://localhost:4002/api/admin/users/$USER_ID/venues/$VENUE_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -d '{
    "pricingEnabled": true,
    "pricePerSong": 3.50,
    "currency": "EUR"
  }' \
  | jq .
```

### 21. Delete Venue
```bash
USER_ID="user-id-here"
VENUE_ID="venue-id-here"

curl -X DELETE http://localhost:4002/api/admin/users/$USER_ID/venues/$VENUE_ID \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  | jq .
```

---

## Complete Test Workflow

### Step 1: Get Session Token
```bash
# Login via browser first, then get token from cookies
export SESSION_TOKEN="your-token-here"
```

### Step 2: List All Users
```bash
curl -X GET http://localhost:4002/api/admin/users \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  | jq '.data[] | {id, name, email, role}'
```

### Step 3: Create a Test User
```bash
curl -X POST http://localhost:4002/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -d '{
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "TestPass123!",
    "role": "USER"
  }' \
  | jq .
```

### Step 4: Get the Created User ID
```bash
# Extract user ID from previous response
USER_ID=$(curl -s -X GET http://localhost:4002/api/admin/users \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  | jq -r '.data[] | select(.email=="testuser@example.com") | .id')

echo "User ID: $USER_ID"
```

### Step 5: Create Venue for the User
```bash
curl -X POST http://localhost:4002/api/admin/users/$USER_ID/venues \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -d '{
    "name": "Test Venue",
    "slug": "test-venue",
    "mode": "QUEUE",
    "isActive": true
  }' \
  | jq .
```

### Step 6: Get Venue ID
```bash
VENUE_ID=$(curl -s -X GET http://localhost:4002/api/admin/users/$USER_ID/venues \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  | jq -r '.data[0].id')

echo "Venue ID: $VENUE_ID"
```

### Step 7: Update the Venue
```bash
curl -X PUT http://localhost:4002/api/admin/users/$USER_ID/venues/$VENUE_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -d '{
    "name": "Updated Test Venue",
    "isActive": false
  }' \
  | jq .
```

### Step 8: Block the User
```bash
curl -X PATCH "http://localhost:4002/api/admin/users/$USER_ID?action=block" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -d '{
    "blocked": true
  }' \
  | jq .
```

### Step 9: Unblock the User
```bash
curl -X PATCH "http://localhost:4002/api/admin/users/$USER_ID?action=block" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -d '{
    "blocked": false
  }' \
  | jq .
```

### Step 10: Cleanup - Delete Venue and User
```bash
# Delete venue
curl -X DELETE http://localhost:4002/api/admin/users/$USER_ID/venues/$VENUE_ID \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN"

# Delete user
curl -X DELETE http://localhost:4002/api/admin/users/$USER_ID \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN"
```

---

## Quick Reference - All Commands in One Block

### Using API Key (Recommended)
```bash
# Set your API key (get it from Settings → Security)
export API_KEY="your-api-key-here"
export USER_ID="user-id-here"
export VENUE_ID="venue-id-here"

# User Management
curl -X GET http://localhost:4002/api/admin/users -H "Authorization: Bearer $API_KEY" | jq .
curl -X POST http://localhost:4002/api/admin/users -H "Content-Type: application/json" -H "Authorization: Bearer $API_KEY" -d '{"name":"New User","email":"new@example.com","password":"Pass123!","role":"USER"}' | jq .
curl -X GET http://localhost:4002/api/admin/users/$USER_ID -H "Authorization: Bearer $API_KEY" | jq .
curl -X PUT http://localhost:4002/api/admin/users/$USER_ID -H "Content-Type: application/json" -H "Authorization: Bearer $API_KEY" -d '{"name":"Updated","email":"updated@example.com"}' | jq .
curl -X PATCH "http://localhost:4002/api/admin/users/$USER_ID?action=block" -H "Content-Type: application/json" -H "Authorization: Bearer $API_KEY" -d '{"blocked":true}' | jq .
curl -X PATCH "http://localhost:4002/api/admin/users/$USER_ID?action=change-password" -H "Content-Type: application/json" -H "Authorization: Bearer $API_KEY" -d '{"newPassword":"NewPass123!"}' | jq .
curl -X DELETE http://localhost:4002/api/admin/users/$USER_ID -H "Authorization: Bearer $API_KEY"

# Venue Management
curl -X GET http://localhost:4002/api/admin/users/$USER_ID/venues -H "Authorization: Bearer $API_KEY" | jq .
curl -X POST http://localhost:4002/api/admin/users/$USER_ID/venues -H "Content-Type: application/json" -H "Authorization: Bearer $API_KEY" -d '{"name":"Venue","slug":"venue","mode":"QUEUE","isActive":true}' | jq .
curl -X GET http://localhost:4002/api/admin/users/$USER_ID/venues/$VENUE_ID -H "Authorization: Bearer $API_KEY" | jq .
curl -X PUT http://localhost:4002/api/admin/users/$USER_ID/venues/$VENUE_ID -H "Content-Type: application/json" -H "Authorization: Bearer $API_KEY" -d '{"name":"Updated Venue"}' | jq .
curl -X DELETE http://localhost:4002/api/admin/users/$USER_ID/venues/$VENUE_ID -H "Authorization: Bearer $API_KEY"
```

### Using Session Token (Alternative)
```bash
# Set your session token (from browser cookies)
export SESSION_TOKEN="your-session-token-here"
export USER_ID="user-id-here"
export VENUE_ID="venue-id-here"

# User Management
curl -X GET http://localhost:4002/api/admin/users -H "Cookie: next-auth.session-token=$SESSION_TOKEN" | jq .
curl -X POST http://localhost:4002/api/admin/users -H "Content-Type: application/json" -H "Cookie: next-auth.session-token=$SESSION_TOKEN" -d '{"name":"New User","email":"new@example.com","password":"Pass123!","role":"USER"}' | jq .
curl -X GET http://localhost:4002/api/admin/users/$USER_ID -H "Cookie: next-auth.session-token=$SESSION_TOKEN" | jq .
curl -X PUT http://localhost:4002/api/admin/users/$USER_ID -H "Content-Type: application/json" -H "Cookie: next-auth.session-token=$SESSION_TOKEN" -d '{"name":"Updated","email":"updated@example.com"}' | jq .
curl -X PATCH "http://localhost:4002/api/admin/users/$USER_ID?action=block" -H "Content-Type: application/json" -H "Cookie: next-auth.session-token=$SESSION_TOKEN" -d '{"blocked":true}' | jq .
curl -X PATCH "http://localhost:4002/api/admin/users/$USER_ID?action=change-password" -H "Content-Type: application/json" -H "Cookie: next-auth.session-token=$SESSION_TOKEN" -d '{"newPassword":"NewPass123!"}' | jq .
curl -X DELETE http://localhost:4002/api/admin/users/$USER_ID -H "Cookie: next-auth.session-token=$SESSION_TOKEN"

# Venue Management
curl -X GET http://localhost:4002/api/admin/users/$USER_ID/venues -H "Cookie: next-auth.session-token=$SESSION_TOKEN" | jq .
curl -X POST http://localhost:4002/api/admin/users/$USER_ID/venues -H "Content-Type: application/json" -H "Cookie: next-auth.session-token=$SESSION_TOKEN" -d '{"name":"Venue","slug":"venue","mode":"QUEUE","isActive":true}' | jq .
curl -X GET http://localhost:4002/api/admin/users/$USER_ID/venues/$VENUE_ID -H "Cookie: next-auth.session-token=$SESSION_TOKEN" | jq .
curl -X PUT http://localhost:4002/api/admin/users/$USER_ID/venues/$VENUE_ID -H "Content-Type: application/json" -H "Cookie: next-auth.session-token=$SESSION_TOKEN" -d '{"name":"Updated Venue"}' | jq .
curl -X DELETE http://localhost:4002/api/admin/users/$USER_ID/venues/$VENUE_ID -H "Cookie: next-auth.session-token=$SESSION_TOKEN"
```

---

## Response Codes

- `200 OK` - Success
- `201 Created` - Resource created successfully
- `204 No Content` - Success with no response body (DELETE)
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not Super Admin
- `404 Not Found` - Resource not found
- `405 Method Not Allowed` - HTTP method not supported
- `409 Conflict` - Resource conflict (e.g., duplicate email)
- `500 Internal Server Error` - Server error

---

## Notes

- All endpoints require **Super Admin** role
- Replace `$SESSION_TOKEN`, `$USER_ID`, and `$VENUE_ID` with actual values
- Use `jq .` for pretty JSON output (install with `brew install jq` or `apt-get install jq`)
- Venue modes: `QUEUE`, `PLAYLIST`, `AUTOMATION`
- User roles: `USER`, `SUPERADMIN`
- When blocking a user, set `"blocked": true` (this sets `lockedAt` in database)
- When changing password, only include `"newPassword"` in the PATCH request
