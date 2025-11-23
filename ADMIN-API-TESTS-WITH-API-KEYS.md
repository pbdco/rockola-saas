# Super Admin API Testing with API Keys

**Base URL:** `http://localhost:4002`  
**Authentication:** API Keys (Bearer Token) - Recommended for API testing

## Where to Create API Keys

1. **Login as Super Admin** at `http://localhost:4002/auth/login`
2. **Navigate to Settings → Security** (`http://localhost:4002/settings/security`)
3. **Scroll down to "API Keys" section**
4. **Click "Create API Key"**
5. **Enter a name** (e.g., "Admin API Key" or "Testing Key")
6. **Copy the API key immediately** - you won't be able to see it again!

## Why Use API Keys Instead of Session Tokens?

✅ **API Keys are better for:**
- Automated testing and scripts
- Server-to-server communication
- Long-running processes
- CI/CD pipelines
- External integrations

❌ **Session Tokens are better for:**
- Browser-based interactions
- Short-term testing
- Development/debugging

---

## All Admin API Commands Using API Keys

### Set Your API Key
```bash
export API_KEY="your-api-key-here"
```

### User Management

#### 1. Get All Users
```bash
curl -X GET http://localhost:4002/api/admin/users \
  -H "Authorization: Bearer $API_KEY" \
  | jq .
```

#### 2. Create New User
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

#### 3. Create Super Admin User
```bash
curl -X POST http://localhost:4002/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "name": "New Admin",
    "email": "newadmin@example.com",
    "password": "SecurePass123!",
    "role": "SUPERADMIN"
  }' \
  | jq .
```

#### 4. Get User by ID
```bash
USER_ID="user-id-here"

curl -X GET http://localhost:4002/api/admin/users/$USER_ID \
  -H "Authorization: Bearer $API_KEY" \
  | jq .
```

#### 5. Update User
```bash
USER_ID="user-id-here"

curl -X PUT http://localhost:4002/api/admin/users/$USER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "name": "Updated Name",
    "email": "updated@example.com",
    "role": "SUPERADMIN"
  }' \
  | jq .
```

#### 6. Block User
```bash
USER_ID="user-id-here"

curl -X PATCH "http://localhost:4002/api/admin/users/$USER_ID?action=block" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "blocked": true
  }' \
  | jq .
```

#### 7. Unblock User
```bash
USER_ID="user-id-here"

curl -X PATCH "http://localhost:4002/api/admin/users/$USER_ID?action=block" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "blocked": false
  }' \
  | jq .
```

#### 8. Change User Password
```bash
USER_ID="user-id-here"

curl -X PATCH "http://localhost:4002/api/admin/users/$USER_ID?action=change-password" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "newPassword": "NewSecurePass123!"
  }' \
  | jq .
```

#### 9. Delete User
```bash
USER_ID="user-id-here"

curl -X DELETE http://localhost:4002/api/admin/users/$USER_ID \
  -H "Authorization: Bearer $API_KEY" \
  | jq .
```

---

### Venue Management for Users

#### 10. Get All Venues for a User
```bash
USER_ID="user-id-here"

curl -X GET http://localhost:4002/api/admin/users/$USER_ID/venues \
  -H "Authorization: Bearer $API_KEY" \
  | jq .
```

#### 11. Create Venue for User
```bash
USER_ID="user-id-here"

curl -X POST http://localhost:4002/api/admin/users/$USER_ID/venues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "name": "Admin Created Venue",
    "slug": "admin-venue",
    "address": "123 Admin Street",
    "mode": "QUEUE",
    "isActive": true
  }' \
  | jq .
```

#### 12. Get Venue by ID
```bash
USER_ID="user-id-here"
VENUE_ID="venue-id-here"

curl -X GET http://localhost:4002/api/admin/users/$USER_ID/venues/$VENUE_ID \
  -H "Authorization: Bearer $API_KEY" \
  | jq .
```

#### 13. Update Venue
```bash
USER_ID="user-id-here"
VENUE_ID="venue-id-here"

curl -X PUT http://localhost:4002/api/admin/users/$USER_ID/venues/$VENUE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "name": "Updated Venue Name",
    "isActive": false
  }' \
  | jq .
```

#### 14. Delete Venue
```bash
USER_ID="user-id-here"
VENUE_ID="venue-id-here"

curl -X DELETE http://localhost:4002/api/admin/users/$USER_ID/venues/$VENUE_ID \
  -H "Authorization: Bearer $API_KEY" \
  | jq .
```

---

## Quick Reference - All Commands

```bash
# Set your API key
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

---

## API Key Management via API

You can also manage API keys via the API:

#### Get All Your API Keys
```bash
curl -X GET http://localhost:4002/api/api-keys \
  -H "Authorization: Bearer $API_KEY" \
  | jq .
```

#### Create New API Key
```bash
curl -X POST http://localhost:4002/api/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "name": "New API Key"
  }' \
  | jq .
```
**Note:** The response will include the `apiKey` field - save it immediately!

#### Delete API Key
```bash
API_KEY_ID="api-key-id-here"

curl -X DELETE http://localhost:4002/api/api-keys/$API_KEY_ID \
  -H "Authorization: Bearer $API_KEY" \
  | jq .
```

---

## Notes

- API keys are tied to the user who created them
- API keys have the same permissions as the user who created them
- Super Admin API keys can access all admin endpoints
- API keys don't expire by default (but can have expiration dates)
- Each API key usage updates the `lastUsedAt` timestamp
- You can create multiple API keys for different purposes
