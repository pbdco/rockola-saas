#!/bin/bash

# API Key Testing Script for Rockola
# Tests API key authentication for superadmin

BASE_URL="http://localhost:4002"
API_KEY="${1:-693cccb04c428d5947589a87dddf0742800f770cfd7a391f82b489495c77aed7}"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Rockola API Key Testing Script ===${NC}\n"
echo -e "${YELLOW}Testing API Key: ${API_KEY:0:20}...${NC}\n"

# Helper function to make API key authenticated requests
api_request() {
  local method=$1
  local endpoint=$2
  local data=$3
  
  if [ "$method" = "GET" ]; then
    curl -s -X GET \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $API_KEY" \
      "$BASE_URL$endpoint"
  else
    curl -s -X $method \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $API_KEY" \
      -d "$data" \
      "$BASE_URL$endpoint"
  fi
}

# Test 1: Health Check (No auth required)
echo -e "${GREEN}1. Health Check (No Auth)${NC}"
curl -s "$BASE_URL/api/health" | jq .
echo -e "\n"

# Test 2: Get Current User (should work with API key)
echo -e "${GREEN}2. Get Current User (/api/users/me)${NC}"
RESPONSE=$(api_request "GET" "/api/users/me")
echo "$RESPONSE" | jq .
if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo -e "${RED}❌ Failed${NC}"
else
  echo -e "${GREEN}✅ Success${NC}"
fi
echo -e "\n"

# Test 3: Get All Users (Super Admin Only)
echo -e "${GREEN}3. Get All Users (Super Admin - /api/admin/users)${NC}"
RESPONSE=$(api_request "GET" "/api/admin/users")
echo "$RESPONSE" | jq .
if echo "$RESPONSE" | jq -e '.data' > /dev/null 2>&1; then
  USER_COUNT=$(echo "$RESPONSE" | jq '.data | length')
  echo -e "${GREEN}✅ Success - Found $USER_COUNT users${NC}"
else
  echo -e "${RED}❌ Failed${NC}"
fi
echo -e "\n"

# Test 4: Get API Keys
echo -e "${GREEN}4. Get API Keys (/api/api-keys)${NC}"
RESPONSE=$(api_request "GET" "/api/api-keys")
echo "$RESPONSE" | jq .
if echo "$RESPONSE" | jq -e '.data' > /dev/null 2>&1; then
  KEY_COUNT=$(echo "$RESPONSE" | jq '.data | length')
  echo -e "${GREEN}✅ Success - Found $KEY_COUNT API keys${NC}"
else
  echo -e "${RED}❌ Failed${NC}"
fi
echo -e "\n"

# Test 5: Get All Venues
echo -e "${GREEN}5. Get All Venues (/api/venues)${NC}"
RESPONSE=$(api_request "GET" "/api/venues")
echo "$RESPONSE" | jq .
if echo "$RESPONSE" | jq -e '.data' > /dev/null 2>&1; then
  VENUE_COUNT=$(echo "$RESPONSE" | jq '.data | length')
  echo -e "${GREEN}✅ Success - Found $VENUE_COUNT venues${NC}"
else
  echo -e "${RED}❌ Failed${NC}"
fi
echo -e "\n"

# Test 6: Get Permissions
echo -e "${GREEN}6. Get Permissions (/api/permissions)${NC}"
RESPONSE=$(api_request "GET" "/api/permissions")
echo "$RESPONSE" | jq .
if echo "$RESPONSE" | jq -e '.data' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Success${NC}"
else
  echo -e "${RED}❌ Failed${NC}"
fi
echo -e "\n"

# Test 7: Get Sessions
echo -e "${GREEN}7. Get Sessions (/api/sessions)${NC}"
RESPONSE=$(api_request "GET" "/api/sessions")
echo "$RESPONSE" | jq .
if echo "$RESPONSE" | jq -e '.data' > /dev/null 2>&1; then
  SESSION_COUNT=$(echo "$RESPONSE" | jq '.data | length')
  echo -e "${GREEN}✅ Success - Found $SESSION_COUNT sessions${NC}"
else
  echo -e "${RED}❌ Failed${NC}"
fi
echo -e "\n"

# Test 8: Invalid API Key Test
echo -e "${GREEN}8. Test Invalid API Key${NC}"
INVALID_KEY="invalid-key-12345"
RESPONSE=$(curl -s -X GET \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INVALID_KEY" \
  "$BASE_URL/api/admin/users")
echo "$RESPONSE" | jq .
if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Correctly rejected invalid key${NC}"
else
  echo -e "${RED}❌ Should have rejected invalid key${NC}"
fi
echo -e "\n"

# Test 9: Missing API Key Test
echo -e "${GREEN}9. Test Missing API Key${NC}"
RESPONSE=$(curl -s -X GET \
  -H "Content-Type: application/json" \
  "$BASE_URL/api/admin/users")
echo "$RESPONSE" | jq .
if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Correctly rejected missing key${NC}"
else
  echo -e "${RED}❌ Should have rejected missing key${NC}"
fi
echo -e "\n"

echo -e "${BLUE}=== Testing Complete ===${NC}"
echo -e "${YELLOW}Usage: ./test-api-key.sh [API_KEY]${NC}"
echo -e "${YELLOW}Default: Uses the provided API key${NC}"
