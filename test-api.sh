#!/bin/bash

# API Testing Script for Rockola
# Base URL - adjust if needed
BASE_URL="http://localhost:4002"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Rockola API Testing Script ===${NC}\n"

# You'll need to set these variables after logging in
# Get these from browser DevTools -> Application -> Cookies after logging in
SESSION_TOKEN=""  # next-auth.session-token cookie value
CSRF_TOKEN=""     # Get from /api/auth/csrf endpoint

# Helper function to make authenticated requests
auth_request() {
  local method=$1
  local endpoint=$2
  local data=$3
  
  if [ -z "$SESSION_TOKEN" ]; then
    echo -e "${RED}Error: SESSION_TOKEN not set. Please login first and set the cookie value.${NC}"
    return 1
  fi
  
  if [ "$method" = "GET" ]; then
    curl -s -X GET \
      -H "Content-Type: application/json" \
      -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
      "$BASE_URL$endpoint" | jq .
  else
    curl -s -X $method \
      -H "Content-Type: application/json" \
      -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
      -d "$data" \
      "$BASE_URL$endpoint" | jq .
  fi
}

echo -e "${GREEN}1. Health Check${NC}"
curl -s "$BASE_URL/api/health" | jq .
echo -e "\n"

echo -e "${GREEN}2. Hello${NC}"
curl -s "$BASE_URL/api/hello" | jq .
echo -e "\n"

echo -e "${GREEN}3. Get CSRF Token${NC}"
CSRF_TOKEN=$(curl -s "$BASE_URL/api/auth/csrf" | jq -r '.csrfToken')
echo "CSRF Token: $CSRF_TOKEN"
echo -e "\n"

echo -e "${GREEN}4. User Registration (Join)${NC}"
echo "Note: Requires recaptchaToken - you may need to disable recaptcha for testing"
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPassword123!",
    "recaptchaToken": ""
  }' \
  "$BASE_URL/api/auth/join" | jq .
echo -e "\n"

echo -e "${GREEN}5. Login (Credentials)${NC}"
echo "Note: Requires recaptchaToken and CSRF token"
echo "After successful login, get the session token from cookies"
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"admin@example.com\",
    \"password\": \"your-password\",
    \"csrfToken\": \"$CSRF_TOKEN\",
    \"recaptchaToken\": \"\"
  }" \
  "$BASE_URL/api/auth/callback/credentials" | jq .
echo -e "\n"

echo -e "${BLUE}=== AUTHENTICATED ENDPOINTS ===${NC}"
echo -e "${RED}Note: Set SESSION_TOKEN variable first by logging in via browser${NC}\n"

if [ -z "$SESSION_TOKEN" ]; then
  echo -e "${RED}SESSION_TOKEN not set. Skipping authenticated endpoints.${NC}"
  echo -e "${BLUE}To test authenticated endpoints:${NC}"
  echo "1. Login via browser at $BASE_URL/auth/login"
  echo "2. Open DevTools -> Application -> Cookies"
  echo "3. Copy the value of 'next-auth.session-token'"
  echo "4. Set: export SESSION_TOKEN='your-token-value'"
  echo "5. Run this script again"
  exit 0
fi

echo -e "${GREEN}6. Get Current User${NC}"
auth_request "GET" "/api/users/me"
echo -e "\n"

echo -e "${GREEN}7. Get All Users (Super Admin Only)${NC}"
auth_request "GET" "/api/admin/users"
echo -e "\n"

echo -e "${GREEN}8. Create User (Super Admin Only)${NC}"
auth_request "POST" "/api/admin/users" '{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "role": "USER"
}'
echo -e "\n"

echo -e "${GREEN}9. Get User by ID (Super Admin Only)${NC}"
USER_ID="user-id-here"  # Replace with actual user ID
auth_request "GET" "/api/admin/users/$USER_ID"
echo -e "\n"

echo -e "${GREEN}10. Update User (Super Admin Only)${NC}"
auth_request "PUT" "/api/admin/users/$USER_ID" '{
  "name": "Updated Name",
  "email": "updated@example.com"
}'
echo -e "\n"

echo -e "${GREEN}11. Block User (Super Admin Only)${NC}"
auth_request "PATCH" "/api/admin/users/$USER_ID" '{
  "blocked": true
}'
echo -e "\n"

echo -e "${GREEN}12. Change User Password (Super Admin Only)${NC}"
auth_request "PATCH" "/api/admin/users/$USER_ID" '{
  "newPassword": "NewSecurePass123!"
}'
echo -e "\n"

echo -e "${GREEN}13. Delete User (Super Admin Only)${NC}"
auth_request "DELETE" "/api/admin/users/$USER_ID"
echo -e "\n"

echo -e "${GREEN}14. Get User Venues (Super Admin Only)${NC}"
auth_request "GET" "/api/admin/users/$USER_ID/venues"
echo -e "\n"

echo -e "${GREEN}15. Create Venue for User (Super Admin Only)${NC}"
auth_request "POST" "/api/admin/users/$USER_ID/venues" '{
  "name": "Test Venue",
  "slug": "test-venue",
  "address": "123 Test St",
  "mode": "QUEUE",
  "isActive": true
}'
echo -e "\n"

echo -e "${GREEN}16. Get Venue by ID (Super Admin Only)${NC}"
VENUE_ID="venue-id-here"  # Replace with actual venue ID
auth_request "GET" "/api/admin/users/$USER_ID/venues/$VENUE_ID"
echo -e "\n"

echo -e "${GREEN}17. Update Venue (Super Admin Only)${NC}"
auth_request "PUT" "/api/admin/users/$USER_ID/venues/$VENUE_ID" '{
  "name": "Updated Venue Name",
  "isActive": false
}'
echo -e "\n"

echo -e "${GREEN}18. Delete Venue (Super Admin Only)${NC}"
auth_request "DELETE" "/api/admin/users/$USER_ID/venues/$VENUE_ID"
echo -e "\n"

echo -e "${GREEN}19. Get All Venues${NC}"
auth_request "GET" "/api/venues"
echo -e "\n"

echo -e "${GREEN}20. Create Venue${NC}"
auth_request "POST" "/api/venues" '{
  "name": "My Venue",
  "slug": "my-venue",
  "address": "456 Main St",
  "mode": "QUEUE",
  "isActive": true
}'
echo -e "\n"

echo -e "${GREEN}21. Get Venue by ID${NC}"
auth_request "GET" "/api/venues/$VENUE_ID"
echo -e "\n"

echo -e "${GREEN}22. Update Venue${NC}"
auth_request "PUT" "/api/venues/$VENUE_ID" '{
  "name": "Updated Venue",
  "isActive": false
}'
echo -e "\n"

echo -e "${GREEN}23. Delete Venue${NC}"
auth_request "DELETE" "/api/venues/$VENUE_ID"
echo -e "\n"

echo -e "${GREEN}24. Get All Sessions${NC}"
auth_request "GET" "/api/sessions"
echo -e "\n"

echo -e "${GREEN}25. Delete Session${NC}"
SESSION_ID="session-id-here"  # Replace with actual session ID
auth_request "DELETE" "/api/sessions/$SESSION_ID" '{
  "id": "'$SESSION_ID'"
}'
echo -e "\n"

echo -e "${GREEN}26. Get Permissions${NC}"
auth_request "GET" "/api/permissions"
echo -e "\n"

echo -e "${GREEN}27. Get All Users${NC}"
auth_request "GET" "/api/users"
echo -e "\n"

echo -e "${GREEN}28. Change Password${NC}"
auth_request "POST" "/api/password" '{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}'
echo -e "\n"

echo -e "${GREEN}29. Get API Keys${NC}"
auth_request "GET" "/api/api-keys"
echo -e "\n"

echo -e "${GREEN}30. Create API Key${NC}"
auth_request "POST" "/api/api-keys" '{
  "name": "Test API Key"
}'
echo -e "\n"

echo -e "${GREEN}31. Delete API Key${NC}"
API_KEY_ID="api-key-id-here"  # Replace with actual API key ID
auth_request "DELETE" "/api/api-keys/$API_KEY_ID"
echo -e "\n"

echo -e "${GREEN}32. Forgot Password${NC}"
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "recaptchaToken": ""
  }' \
  "$BASE_URL/api/auth/forgot-password" | jq .
echo -e "\n"

echo -e "${GREEN}33. Reset Password${NC}"
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "password": "NewPassword123!",
    "token": "reset-token-here"
  }' \
  "$BASE_URL/api/auth/reset-password" | jq .
echo -e "\n"

echo -e "${GREEN}34. Resend Email Token${NC}"
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }' \
  "$BASE_URL/api/auth/resend-email-token" | jq .
echo -e "\n"

echo -e "${GREEN}35. Unlock Account${NC}"
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "token": "unlock-token-here"
  }' \
  "$BASE_URL/api/auth/unlock-account" | jq .
echo -e "\n"

echo -e "${GREEN}36. Custom Signout${NC}"
auth_request "POST" "/api/auth/custom-signout" '{}'
echo -e "\n"

echo -e "${GREEN}37. Spotify Connect (Venue)${NC}"
auth_request "POST" "/api/venues/$VENUE_ID/spotify/connect" '{}'
echo -e "\n"

echo -e "${GREEN}38. Spotify Disconnect (Venue)${NC}"
auth_request "POST" "/api/venues/$VENUE_ID/spotify/disconnect" '{}'
echo -e "\n"

echo -e "${GREEN}39. OAuth User Info${NC}"
curl -s -X GET \
  -H "Authorization: Bearer oauth-token-here" \
  "$BASE_URL/api/oauth/userinfo" | jq .
echo -e "\n"

echo -e "${GREEN}40. SAML Certificate${NC}"
curl -s "$BASE_URL/api/well-known/saml.cer" | jq .
echo -e "\n"

echo -e "${BLUE}=== Testing Complete ===${NC}"
