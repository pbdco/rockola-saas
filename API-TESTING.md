# API Testing Guide

This document provides curl commands to test all API endpoints in the Rockola application.

## Prerequisites

1. **Base URL**: `http://localhost:4002` (adjust if your app runs on a different port)
2. **Session Token**: Required for authenticated endpoints. Get it by:
   - Logging in via browser at `http://localhost:4002/auth/login`
   - Open DevTools (F12) -> Application tab -> Cookies
   - Copy the value of `next-auth.session-token`

## Quick Start

Run the automated test script:
```bash
./test-api.sh
```

Or set the session token and run:
```bash
export SESSION_TOKEN="your-session-token-here"
./test-api.sh
```

## Manual Testing Commands

### 1. Public Endpoints (No Authentication Required)

#### Health Check
```bash
curl http://localhost:4002/api/health
```

#### Hello
```bash
curl http://localhost:4002/api/hello
```

#### Get CSRF Token
```bash
curl http://localhost:4002/api/auth/csrf
```

### 2. Authentication Endpoints

#### User Registration (Join)
```bash
curl -X POST http://localhost:4002/api/auth/join \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPassword123!",
    "recaptchaToken": ""
  }'
```

#### Forgot Password
```bash
curl -X POST http://localhost:4002/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "recaptchaToken": ""
  }'
```

#### Reset Password
```bash
curl -X POST http://localhost:4002/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "password": "NewPassword123!",
    "token": "reset-token-from-email"
  }'
```

#### Resend Email Token
```bash
curl -X POST http://localhost:4002/api/auth/resend-email-token \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

#### Unlock Account
```bash
curl -X POST http://localhost:4002/api/auth/unlock-account \
  -H "Content-Type: application/json" \
  -d '{
    "token": "unlock-token-from-email"
  }'
```

### 3. Authenticated Endpoints (Requires Session Token)

Replace `YOUR_SESSION_TOKEN` with your actual session token from browser cookies.

#### Get Current User
```bash
curl http://localhost:4002/api/users/me \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

#### Get All Users
```bash
curl http://localhost:4002/api/users \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

#### Change Password
```bash
curl -X POST http://localhost:4002/api/password \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "currentPassword": "old-password",
    "newPassword": "new-password"
  }'
```

#### Get Permissions
```bash
curl http://localhost:4002/api/permissions \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

#### Get All Sessions
```bash
curl http://localhost:4002/api/sessions \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

#### Delete Session
```bash
curl -X DELETE http://localhost:4002/api/sessions/SESSION_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "id": "SESSION_ID"
  }'
```

### 4. Super Admin Endpoints (Requires SUPERADMIN Role)

#### Get All Users (Admin)
```bash
curl http://localhost:4002/api/admin/users \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

#### Create User (Admin)
```bash
curl -X POST http://localhost:4002/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "name": "New User",
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "role": "USER"
  }'
```

#### Get User by ID (Admin)
```bash
curl http://localhost:4002/api/admin/users/USER_ID \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

#### Update User (Admin)
```bash
curl -X PUT http://localhost:4002/api/admin/users/USER_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "name": "Updated Name",
    "email": "updated@example.com",
    "role": "SUPERADMIN"
  }'
```

#### Block User (Admin)
```bash
curl -X PATCH http://localhost:4002/api/admin/users/USER_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "blocked": true
  }'
```

#### Unblock User (Admin)
```bash
curl -X PATCH http://localhost:4002/api/admin/users/USER_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "blocked": false
  }'
```

#### Change User Password (Admin)
```bash
curl -X PATCH http://localhost:4002/api/admin/users/USER_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "newPassword": "NewSecurePass123!"
  }'
```

#### Delete User (Admin)
```bash
curl -X DELETE http://localhost:4002/api/admin/users/USER_ID \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### 5. Venue Management Endpoints

#### Get All Venues
```bash
curl http://localhost:4002/api/venues \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

#### Create Venue
```bash
curl -X POST http://localhost:4002/api/venues \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "name": "My Venue",
    "slug": "my-venue",
    "address": "456 Main St",
    "mode": "QUEUE",
    "pricingEnabled": false,
    "isActive": true
  }'
```

#### Get Venue by ID
```bash
curl http://localhost:4002/api/venues/VENUE_ID \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

#### Update Venue
```bash
curl -X PUT http://localhost:4002/api/venues/VENUE_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "name": "Updated Venue Name",
    "isActive": false
  }'
```

#### Delete Venue
```bash
curl -X DELETE http://localhost:4002/api/venues/VENUE_ID \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### 6. Super Admin Venue Management (Manage Venues for Specific Users)

#### Get User Venues (Admin)
```bash
curl http://localhost:4002/api/admin/users/USER_ID/venues \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

#### Create Venue for User (Admin)
```bash
curl -X POST http://localhost:4002/api/admin/users/USER_ID/venues \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "name": "Admin Created Venue",
    "slug": "admin-venue",
    "address": "789 Admin St",
    "mode": "PLAYLIST",
    "isActive": true
  }'
```

#### Get User Venue by ID (Admin)
```bash
curl http://localhost:4002/api/admin/users/USER_ID/venues/VENUE_ID \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

#### Update User Venue (Admin)
```bash
curl -X PUT http://localhost:4002/api/admin/users/USER_ID/venues/VENUE_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "name": "Updated by Admin",
    "isActive": false
  }'
```

#### Delete User Venue (Admin)
```bash
curl -X DELETE http://localhost:4002/api/admin/users/USER_ID/venues/VENUE_ID \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### 7. API Keys Management

#### Get All API Keys
```bash
curl http://localhost:4002/api/api-keys \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

#### Create API Key
```bash
curl -X POST http://localhost:4002/api/api-keys \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "name": "My API Key"
  }'
```

#### Delete API Key
```bash
curl -X DELETE http://localhost:4002/api/api-keys/API_KEY_ID \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### 8. Spotify Integration

#### Connect Spotify to Venue
```bash
curl -X POST http://localhost:4002/api/venues/VENUE_ID/spotify/connect \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{}'
```

#### Disconnect Spotify from Venue
```bash
curl -X POST http://localhost:4002/api/venues/VENUE_ID/spotify/disconnect \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{}'
```

### 9. OAuth Endpoints

#### OAuth User Info
```bash
curl http://localhost:4002/api/oauth/userinfo \
  -H "Authorization: Bearer OAUTH_TOKEN"
```

#### SAML Certificate
```bash
curl http://localhost:4002/api/well-known/saml.cer
```

## Using jq for Pretty Output

Install jq for formatted JSON output:
```bash
# macOS
brew install jq

# Linux
sudo apt-get install jq
```

Then pipe curl output to jq:
```bash
curl http://localhost:4002/api/users/me \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" | jq .
```

## Getting Session Token Programmatically

If you want to get the session token programmatically, you can use the NextAuth session endpoint:

```bash
# This will return the session if you have valid cookies
curl http://localhost:4002/api/auth/session \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

## Testing with Postman/Insomnia

1. Import the collection (if available)
2. Set the base URL: `http://localhost:4002`
3. For authenticated requests:
   - Add a Cookie header: `next-auth.session-token: YOUR_SESSION_TOKEN`
   - Or use the built-in cookie management

## Common Response Codes

- `200 OK` - Success
- `201 Created` - Resource created successfully
- `204 No Content` - Success with no response body
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Authenticated but not authorized (e.g., not super admin)
- `404 Not Found` - Resource not found
- `405 Method Not Allowed` - HTTP method not supported
- `409 Conflict` - Resource conflict (e.g., duplicate email)
- `500 Internal Server Error` - Server error

## Notes

- Replace `YOUR_SESSION_TOKEN`, `USER_ID`, `VENUE_ID`, `API_KEY_ID`, etc. with actual values
- Some endpoints require specific roles (SUPERADMIN for admin endpoints)
- ReCAPTCHA tokens may be required for some endpoints (can be disabled for testing)
- The session token expires after the session max age (default: 14 days)
