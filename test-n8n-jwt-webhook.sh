#!/bin/bash

# Test n8n webhook with JWT authentication
# Usage: ./test-n8n-jwt-webhook.sh

set -e

# Load N8N_WEBHOOK_SECRET from .env file
if [ -f .env ]; then
  N8N_WEBHOOK_SECRET=$(grep "^N8N_WEBHOOK_SECRET=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
else
  echo "Error: .env file not found"
  exit 1
fi

# Check if secret is set
if [ -z "$N8N_WEBHOOK_SECRET" ]; then
  echo "Error: N8N_WEBHOOK_SECRET not set in .env"
  echo "Please set N8N_WEBHOOK_SECRET in your .env file"
  exit 1
fi

# Webhook URL (production endpoint)
WEBHOOK_URL="https://n8n.acrofase.org/webhook/rockola/create-playlist"

echo "🔐 Generating JWT token..."
echo ""

# Generate JWT using Node.js (using a here-doc to avoid escaping issues)
JWT_TOKEN=$(node <<EOF
const jwt = require('jsonwebtoken');
const payload = {
  venueId: 'test-venue-id-123',
  venueName: 'Test Venue',
  spotifyClientId: '51ac6e03a9694126b84402763a033249',
  spotifyClientSecret: '96570d65d0c84d51839c1bf6c8354ad5'
};
const secret = '$N8N_WEBHOOK_SECRET';
const now = Math.floor(Date.now() / 1000);
const tokenPayload = {
  ...payload,
  iat: now,
  exp: now + (5 * 60)
};
const token = jwt.sign(tokenPayload, secret, { algorithm: 'HS256' });
console.log(token);
EOF
)

# Test payload for curl
PAYLOAD='{"venueId":"test-venue-id-123","venueName":"Test Venue","spotifyClientId":"51ac6e03a9694126b84402763a033249","spotifyClientSecret":"96570d65d0c84d51839c1bf6c8354ad5"}'

if [ -z "$JWT_TOKEN" ]; then
  echo "Error: Failed to generate JWT token"
  exit 1
fi

echo "✅ JWT token generated"
echo ""
echo "📤 Sending request to: $WEBHOOK_URL"
echo ""

# Send request
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d "$PAYLOAD" \
  "$WEBHOOK_URL" \
  --max-time 30)

# Extract HTTP status code (last line)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
# Extract response body (all but last line)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Response:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "HTTP Status: $HTTP_CODE"
echo ""
echo "Response Body:"
echo "$RESPONSE_BODY" | jq . 2>/dev/null || echo "$RESPONSE_BODY"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if successful
if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  echo "✅ Success! Webhook responded with HTTP $HTTP_CODE"
  exit 0
else
  echo "❌ Error! Webhook responded with HTTP $HTTP_CODE"
  exit 1
fi
