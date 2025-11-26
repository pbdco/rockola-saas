# n8n JWT Credential Configuration

## 📝 What to Configure in the JWT Auth Credential Screen

When you see the n8n "JWT Auth account" credential screen, configure it as follows:

### ✅ Configuration Values:

1. **Key Type:** 
   - Select: **"Passphrase"** ✅ (already selected in your screenshot)

2. **Secret:**
   - Enter: **`N8N_WEBHOOK_SECRET`** value
   - This is the **same secret** that's in Rockola's `.env` file
   - Example: `your-secret-here-32-chars-minimum`
   - **Important:** Must match exactly with Rockola's `N8N_WEBHOOK_SECRET`

3. **Algorithm:**
   - Select: **"HS256"** ✅ (already selected in your screenshot)
   - This matches what Rockola uses to sign JWT tokens

### 🔍 How to Find Your Secret:

**In Rockola's `.env` file:**
```env
N8N_WEBHOOK_SECRET=your-actual-secret-value-here
```

**Or generate a new one:**
```bash
openssl rand -hex 32
```

### ✅ After Configuration:

1. **Save the credential** with a name like:
   - `Rockola Webhook JWT`
   - `Rockola n8n JWT Auth`

2. **Use it in your Webhook node:**
   - Go to your Webhook node settings
   - Under **Authentication**, select **"JWT Auth"**
   - Choose the credential you just created

3. **That's it!** n8n will automatically:
   - ✅ Verify JWT signature
   - ✅ Check expiration (5 minutes)
   - ✅ Decode payload
   - ✅ Make data available as `$json.jwtPayload`

---

## 📋 Quick Checklist:

- [ ] Key Type: **Passphrase** ✅
- [ ] Secret: **Same as `N8N_WEBHOOK_SECRET` in Rockola** ✅
- [ ] Algorithm: **HS256** ✅
- [ ] Save credential
- [ ] Use in Webhook node → Authentication → JWT Auth

---

## ⚠️ Important Notes:

1. **The secret must match exactly** between Rockola and n8n
2. **HS256 algorithm** is required (matches Rockola's JWT signing)
3. **No Code node needed** - n8n handles verification automatically
4. **JWT expires in 5 minutes** - n8n automatically rejects expired tokens

---

## 🔄 Example:

**Rockola `.env`:**
```env
N8N_WEBHOOK_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**n8n JWT Credential:**
- Secret: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
- Algorithm: `HS256`
- Key Type: `Passphrase`

**Result:** ✅ Webhooks will work!
