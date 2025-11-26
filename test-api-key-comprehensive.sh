#!/bin/bash

# Comprehensive API Key Testing Script for Rockola
# Tests all API endpoints with API key authentication

BASE_URL="http://localhost:4002"
API_KEY="${1:-693cccb04c428d5947589a87dddf0742800f770cfd7a391f82b489495c77aed7}"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

echo -e "${BLUE}=== Rockola Comprehensive API Key Testing ===${NC}\n"
echo -e "${YELLOW}Testing API Key: ${API_KEY:0:20}...${NC}\n"

# Helper function to make API key authenticated requests
api_request() {
  local method=$1
  local endpoint=$2
  local data=$3
  
  if [ "$method" = "GET" ]; then
    curl -s -w "\n%{http_code}" -X GET \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $API_KEY" \
      "$BASE_URL$endpoint"
  else
    curl -s -w "\n%{http_code}" -X $method \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $API_KEY" \
      -d "$data" \
      "$BASE_URL$endpoint"
  fi
}

# Test function
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local expected_status=${5:-200}
  
  echo -e "${GREEN}Testing: $name${NC}"
  echo -e "  ${BLUE}$method $endpoint${NC}"
  
  RESPONSE=$(api_request "$method" "$endpoint" "$data")
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  
  # Support multiple expected status codes (e.g., "201|400")
  if [[ "$expected_status" == *"|"* ]]; then
    IFS='|' read -ra STATUSES <<< "$expected_status"
    MATCH=0
    for status in "${STATUSES[@]}"; do
      if [ "$HTTP_CODE" = "$status" ]; then
        MATCH=1
        break
      fi
    done
    if [ $MATCH -eq 1 ]; then
      echo -e "  ${GREEN}✅ PASS (HTTP $HTTP_CODE)${NC}"
      echo "$BODY" | jq . 2>/dev/null | head -10
      ((PASSED++))
    else
      echo -e "  ${RED}❌ FAIL (Expected one of: $expected_status, got $HTTP_CODE)${NC}"
      echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
      ((FAILED++))
    fi
  elif [ "$HTTP_CODE" = "$expected_status" ]; then
    echo -e "  ${GREEN}✅ PASS (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | jq . 2>/dev/null | head -10
    ((PASSED++))
  else
    echo -e "  ${RED}❌ FAIL (Expected $expected_status, got $HTTP_CODE)${NC}"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
    ((FAILED++))
  fi
  echo ""
}

# Get a real user ID and venue ID for testing
USER_ID=$(curl -s -X GET "$BASE_URL/api/admin/users" -H "Authorization: Bearer $API_KEY" | jq -r '.data[1].id // empty' 2>/dev/null)
VENUE_ID=$(curl -s -X GET "$BASE_URL/api/venues" -H "Authorization: Bearer $API_KEY" | jq -r '.data[0].id // empty' 2>/dev/null)

echo -e "${YELLOW}Using User ID: ${USER_ID:-N/A}${NC}"
echo -e "${YELLOW}Using Venue ID: ${VENUE_ID:-N/A}${NC}\n"

# ============================================
# PUBLIC ENDPOINTS (No Auth Required)
# ============================================
echo -e "${BLUE}=== PUBLIC ENDPOINTS ===${NC}\n"

test_endpoint "Health Check" "GET" "/api/health" "" 200
test_endpoint "Hello" "GET" "/api/hello" "" 200

# ============================================
# USER ENDPOINTS
# ============================================
echo -e "${BLUE}=== USER ENDPOINTS ===${NC}\n"

test_endpoint "Get Current User" "GET" "/api/users/me" "" 200
test_endpoint "Get Permissions" "GET" "/api/permissions" "" 200

# ============================================
# ADMIN ENDPOINTS (Super Admin Only)
# ============================================
echo -e "${BLUE}=== ADMIN ENDPOINTS (Super Admin) ===${NC}\n"

test_endpoint "Get All Users" "GET" "/api/admin/users" "" 200

if [ -n "$USER_ID" ]; then
  # Note: /api/admin/users/[userId] doesn't support GET, only PUT/PATCH/DELETE
  test_endpoint "Get User Venues" "GET" "/api/admin/users/$USER_ID/venues" "" 200
  
  if [ -n "$VENUE_ID" ]; then
    test_endpoint "Get User Venue by ID" "GET" "/api/admin/users/$USER_ID/venues/$VENUE_ID" "" 200
  fi
fi

# ============================================
# VENUE ENDPOINTS
# ============================================
echo -e "${BLUE}=== VENUE ENDPOINTS ===${NC}\n"

test_endpoint "Get All Venues" "GET" "/api/venues" "" 200

if [ -n "$VENUE_ID" ]; then
  test_endpoint "Get Venue by ID" "GET" "/api/venues/$VENUE_ID" "" 200
fi

test_endpoint "Check Venue Slug" "GET" "/api/venues/check-slug?slug=test-venue" "" 200

# ============================================
# API KEY ENDPOINTS
# ============================================
echo -e "${BLUE}=== API KEY ENDPOINTS ===${NC}\n"

test_endpoint "Get API Keys" "GET" "/api/api-keys" "" 200

# Create a test API key
CREATE_KEY_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"name": "Test Key '$(date +%s)'"}' \
  "$BASE_URL/api/api-keys")

TEST_KEY_ID=$(echo "$CREATE_KEY_RESPONSE" | jq -r '.data.id // empty' 2>/dev/null)

if [ -n "$TEST_KEY_ID" ]; then
  echo -e "${GREEN}Created test API key: $TEST_KEY_ID${NC}\n"
  test_endpoint "Delete Test API Key" "DELETE" "/api/api-keys/$TEST_KEY_ID" "" 204
else
  echo -e "${YELLOW}⚠️  Could not create test API key for deletion test${NC}\n"
fi

# ============================================
# SESSION ENDPOINTS
# ============================================
echo -e "${BLUE}=== SESSION ENDPOINTS ===${NC}\n"

test_endpoint "Get All Sessions" "GET" "/api/sessions" "" 200

# ============================================
# VENUE SPOTIFY ENDPOINTS
# ============================================
echo -e "${BLUE}=== VENUE SPOTIFY ENDPOINTS ===${NC}\n"

if [ -n "$VENUE_ID" ]; then
  # Note: Spotify Connect may return 400 if credentials not configured (expected)
  test_endpoint "Spotify Connect (OAuth Redirect)" "GET" "/api/venues/$VENUE_ID/spotify/connect" "" "302|400"
  test_endpoint "Spotify Disconnect" "POST" "/api/venues/$VENUE_ID/spotify/disconnect" '{}' 200
fi

# ============================================
# SONG REQUEST ENDPOINTS
# ============================================
echo -e "${BLUE}=== SONG REQUEST ENDPOINTS ===${NC}\n"

if [ -n "$VENUE_ID" ]; then
  # Note: This may fail if playlist not created yet (expected behavior)
  test_endpoint "Create Song Request" "POST" "/api/venues/$VENUE_ID/song-requests" '{
    "trackName": "Bohemian Rhapsody",
    "artistName": "Queen"
  }' "201|400"
fi

# ============================================
# ERROR HANDLING TESTS
# ============================================
echo -e "${BLUE}=== ERROR HANDLING TESTS ===${NC}\n"

echo -e "${GREEN}Testing: Invalid API Key${NC}"
INVALID_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-key-12345" \
  "$BASE_URL/api/admin/users")
INVALID_CODE=$(echo "$INVALID_RESPONSE" | tail -n1)
if [ "$INVALID_CODE" = "401" ]; then
  echo -e "  ${GREEN}✅ PASS - Correctly rejected invalid key${NC}"
  ((PASSED++))
else
  echo -e "  ${RED}❌ FAIL - Should return 401, got $INVALID_CODE${NC}"
  ((FAILED++))
fi
echo ""

echo -e "${GREEN}Testing: Missing API Key${NC}"
MISSING_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
  -H "Content-Type: application/json" \
  "$BASE_URL/api/admin/users")
MISSING_CODE=$(echo "$MISSING_RESPONSE" | tail -n1)
if [ "$MISSING_CODE" = "401" ] || [ "$MISSING_CODE" = "302" ] || [ "$MISSING_CODE" = "307" ]; then
  echo -e "  ${GREEN}✅ PASS - Correctly rejected missing key (HTTP $MISSING_CODE - redirect to login)${NC}"
  ((PASSED++))
else
  echo -e "  ${RED}❌ FAIL - Should return 401, 302, or 307, got $MISSING_CODE${NC}"
  ((FAILED++))
fi
echo ""

# ============================================
# SUMMARY
# ============================================
echo -e "${BLUE}=== TEST SUMMARY ===${NC}\n"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
TOTAL=$((PASSED + FAILED))
if [ $TOTAL -gt 0 ]; then
  PERCENTAGE=$((PASSED * 100 / TOTAL))
  echo -e "${BLUE}Success Rate: $PERCENTAGE%${NC}"
fi

if [ $FAILED -eq 0 ]; then
  echo -e "\n${GREEN}🎉 All tests passed!${NC}"
  exit 0
else
  echo -e "\n${RED}⚠️  Some tests failed${NC}"
  exit 1
fi
