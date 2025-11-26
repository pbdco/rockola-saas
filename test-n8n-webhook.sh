#!/bin/bash

# Test n8n webhook endpoint with proper signature
# This simulates what Rockola sends to n8n

WEBHOOK_URL="https://n8n.acrofase.org/webhook-test/rockola/create-playlist"
SECRET="n8n-rockola-a9694126b84402763a033249"

# Payload that Rockola sends
PAYLOAD='{
  "venueId": "test-venue-id-123",
  "venueName": "Test Venue",
  "spotifyClientId": "51ac6e03a9694126b84402763a033249",
  "spotifyClientSecret": "96570d65d0c84d51839c1bf6c8354ad5"
}'

# Calculate signature (same as Rockola does)
TIMESTAMP=$(node -e "console.log(Date.now())")
MESSAGE="${PAYLOAD}:${TIMESTAMP}"
SIGNATURE=$(node -e "
const crypto = require('crypto');
const message = '${MESSAGE}';
const secret = '${SECRET}';
const hmac = crypto.createHmac('sha256', secret);
console.log(hmac.update(message).digest('hex'));
")

echo "=== Testing n8n Webhook ==="
echo "URL: ${WEBHOOK_URL}"
echo "Timestamp: ${TIMESTAMP}"
echo "Signature: ${SIGNATURE}"
echo "Payload: ${PAYLOAD}"
echo ""

# Make the request with timeout
echo "Sending request..."
curl -X POST "${WEBHOOK_URL}" \
  -H "Content-Type: application/json" \
  -H "X-Signature: ${SIGNATURE}" \
  -H "X-Timestamp: ${TIMESTAMP}" \
  -d "${PAYLOAD}" \
  --max-time 10 \
  -w "\n\nHTTP Status: %{http_code}\nTime: %{time_total}s\n" \
  2>&1
