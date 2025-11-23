# API Keys Guide

## Where to Create API Keys

**As a Super Admin, you can create API keys in the Settings page:**

1. **Login** as Super Admin at `http://localhost:4002/auth/login`
2. **Navigate to Settings → Security** (`http://localhost:4002/settings/security`)
3. **Scroll down** to the "API Keys" section
4. **Click "Create API Key"**
5. **Enter a name** (e.g., "Admin API Key", "Testing Key", "Production Key")
6. **Copy the API key immediately** - you won't be able to see it again once you close the dialog!

## Why Use API Keys Instead of Session Tokens?

### ✅ API Keys are Better For:
- **Automated testing** and scripts
- **Server-to-server communication**
- **CI/CD pipelines**
- **Long-running processes**
- **External integrations**
- **API clients** (Postman, Insomnia, etc.)
- **Production environments**

### ✅ Session Tokens are Better For:
- **Browser-based interactions**
- **Short-term testing**
- **Development/debugging**
- **Interactive use**

## How API Keys Work

1. **API keys are user-specific** - they have the same permissions as the user who created them
2. **Super Admin API keys** can access all admin endpoints
3. **API keys don't expire by default** (but can have expiration dates)
4. **Each API key usage** updates the `lastUsedAt` timestamp
5. **You can create multiple API keys** for different purposes

## Using API Keys in curl

Instead of using session tokens:
```bash
curl -X GET http://localhost:4002/api/admin/users \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN"
```

Use API keys with Bearer token:
```bash
curl -X GET http://localhost:4002/api/admin/users \
  -H "Authorization: Bearer $API_KEY"
```

## Example: Complete Workflow

### Step 1: Create API Key via UI
1. Go to `http://localhost:4002/settings/security`
2. Click "Create API Key"
3. Name it "Admin Testing Key"
4. Copy the key: `a1b2c3d4e5f6...` (example)

### Step 2: Use the API Key
```bash
export API_KEY="a1b2c3d4e5f6..."

# Test it
curl -X GET http://localhost:4002/api/admin/users \
  -H "Authorization: Bearer $API_KEY" \
  | jq .
```

### Step 3: Use for All Admin Operations
```bash
# Create user
curl -X POST http://localhost:4002/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Pass123!",
    "role": "USER"
  }'

# Block user
curl -X PATCH "http://localhost:4002/api/admin/users/$USER_ID?action=block" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"blocked": true}'
```

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** to store API keys
3. **Rotate API keys** regularly
4. **Delete unused API keys**
5. **Use different API keys** for different environments (dev, staging, production)
6. **Monitor API key usage** via the `lastUsedAt` timestamp

## Managing API Keys

### View All Your API Keys
Go to `Settings → Security → API Keys` to see:
- API key name
- Creation date
- Last used date
- Actions (delete/revoke)

### Delete/Revoke API Key
1. Go to `Settings → Security → API Keys`
2. Click the delete/trash icon next to the API key
3. Confirm deletion

**Note:** Once deleted, that API key will no longer work for authentication.

## API Key vs Session Token Comparison

| Feature | API Key | Session Token |
|---------|---------|---------------|
| **Format** | Bearer token in Authorization header | Cookie value |
| **Expiration** | Optional (can be permanent) | 14 days default |
| **Best For** | API testing, automation | Browser sessions |
| **Security** | Can be revoked independently | Expires with session |
| **Multiple Keys** | Yes, unlimited | One active session |
| **Usage Tracking** | `lastUsedAt` timestamp | Session activity |

## Troubleshooting

### "Unauthorized" Error
- Check that the API key is correct
- Verify the API key hasn't been deleted
- Ensure you're using `Authorization: Bearer $API_KEY` header

### "Forbidden" Error
- Verify your user has Super Admin role
- API keys inherit permissions from the user who created them

### API Key Not Working
- Check if the API key was deleted
- Verify you copied the full key (it's a long hex string)
- Make sure you're using `Bearer` prefix in the Authorization header
