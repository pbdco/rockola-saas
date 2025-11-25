# 🧪 UI Testing Guide - What You Can Test Now

## ✅ Currently Available Features

### 1. **Venue Management (Full CRUD)**

#### **Create Venue**
- Navigate to: `/venues` → Click "Create Venue"
- **What to test:**
  - ✅ Create venue with name, address
  - ✅ Select operating mode: **PLAYLIST** or **AUTOMATION** (QUEUE mode removed)
  - ✅ Auto-generated slug from name (or custom slug)
  - ✅ Slug conflict detection (shows warning if slug taken)
  - ✅ Enable/disable pricing
  - ✅ Set price per song and currency
  - ✅ Set venue as active/inactive
  - ✅ Optional Spotify Client ID/Secret (for Automation Mode)
  - ✅ Form validation
  - ✅ Success/error toast notifications

#### **Edit Venue**
- Navigate to: `/venues` → Click "Edit" on any venue
- **What to test:**
  - ✅ Edit all venue fields
  - ✅ Change operating mode (PLAYLIST ↔ AUTOMATION)
  - ✅ Real-time slug availability checking
  - ✅ Slug conflict warnings
  - ✅ Auto-scroll to top after save
  - ✅ Immediate UI updates (no page reload needed)
  - ✅ Form re-initializes with updated data

#### **Delete Venue**
- Navigate to: `/venues` → Click "Delete" on any venue
- **What to test:**
  - ✅ Confirmation dialog
  - ✅ Venue removal from list
  - ✅ Success notification

#### **View Venues List**
- Navigate to: `/venues`
- **What to test:**
  - ✅ List all venues
  - ✅ See venue details (name, mode, address, pricing)
  - ✅ See Spotify connection status
  - ✅ Empty state when no venues
  - ✅ Quick actions (Edit/Delete buttons)

---

### 2. **Logging System** (Check Docker Logs)

#### **What's Being Logged:**
- ✅ All database operations (queries, inserts, updates, deletes)
- ✅ All API requests (method, path, user, response time)
- ✅ All n8n webhook calls (when implemented)
- ✅ All errors and warnings

#### **How to View Logs:**
```bash
# View all logs
docker-compose logs -f

# View only app logs
docker-compose logs -f app

# View only database logs
docker-compose logs -f postgres

# Filter for specific operations
docker-compose logs -f app | grep "DB Operation"
docker-compose logs -f app | grep "API Request"
```

#### **Log Format:**
All logs are in JSON format for easy parsing:
```json
{
  "timestamp": "2025-11-23T20:30:00.000Z",
  "level": "INFO",
  "message": "DB Operation: create on Venue",
  "type": "db_operation",
  "operation": "create",
  "model": "Venue",
  "query": {...},
  "result": {...},
  "duration": "45ms"
}
```

---

### 3. **Database Schema Changes**

#### **What Changed:**
- ✅ `VenueMode` enum: Removed `QUEUE`, kept `PLAYLIST` and `AUTOMATION`
- ✅ Added `spotifyPlaylistId` and `spotifyPlaylistUrl` to Venue model
- ✅ Created `VenueRule` model (for future rules system)
- ✅ Updated `Role` enum (SUPERADMIN, USER)

#### **What to Verify:**
- ✅ Existing venues with QUEUE mode were migrated to PLAYLIST
- ✅ New venues default to PLAYLIST mode
- ✅ Can only select PLAYLIST or AUTOMATION in forms

---

## 🚧 Not Yet Implemented (Coming Soon)

### **Phase 3: Playlist Mode Basic**
- ❌ Auto-create playlist when venue is created
- ❌ Display playlist link in venue details
- ❌ Add song to playlist functionality

### **Phase 4: Rules System**
- ❌ Rules editor UI
- ❌ Rules validation (AI agent integration)
- ❌ Rules application to song requests

### **Phase 5: Superadmin Configuration**
- ❌ N8N webhook URL configuration
- ❌ Default Spotify credentials override
- ❌ Per-venue Spotify credentials override

---

## 🧪 Testing Checklist

### **Basic Functionality**
- [ ] Create a new venue with PLAYLIST mode
- [ ] Create a new venue with AUTOMATION mode
- [ ] Edit venue name and verify slug auto-updates
- [ ] Edit venue slug and see conflict warning
- [ ] Enable pricing and set price per song
- [ ] Delete a venue and confirm removal
- [ ] Check Docker logs for database operations
- [ ] Check Docker logs for API requests

### **Edge Cases**
- [ ] Create venue with duplicate slug (should auto-append suffix)
- [ ] Create venue with very long name
- [ ] Edit venue and change mode
- [ ] Try to create venue with invalid data
- [ ] Check logs when operations fail

### **UI/UX**
- [ ] Verify toast notifications appear
- [ ] Verify loading states during operations
- [ ] Verify form validation messages
- [ ] Verify slug preview updates in real-time
- [ ] Verify page scrolls to top after edit save

---

## 📊 What to Look For in Logs

When testing, you should see logs like:

### **Database Operations:**
```json
{"timestamp":"...","level":"INFO","type":"db_operation","operation":"create","model":"Venue",...}
{"timestamp":"...","level":"INFO","type":"db_operation","operation":"query","model":"Venue",...}
{"timestamp":"...","level":"INFO","type":"db_operation","operation":"update","model":"Venue",...}
```

### **API Requests:**
```json
{"timestamp":"...","level":"INFO","type":"api_request","method":"POST","path":"/api/venues",...}
{"timestamp":"...","level":"INFO","type":"api_request","method":"PUT","path":"/api/venues/[id]",...}
```

### **Venue Operations:**
```json
{"timestamp":"...","level":"INFO","type":"venue_operation","operation":"create_venue","venueId":"...","mode":"PLAYLIST"}
```

---

## 🎯 Quick Test Scenario

1. **Start Docker:**
   ```bash
   docker-compose up -d
   ```

2. **Start Dev Server:**
   ```bash
   npm run dev
   ```

3. **Test Flow:**
   - Login to app
   - Go to `/venues`
   - Create a venue named "Test Venue"
   - Select PLAYLIST mode
   - Enable pricing ($5.00 USD)
   - Save
   - Edit the venue
   - Change name to "Test Venue Updated"
   - See slug auto-update
   - Save
   - Check Docker logs: `docker-compose logs -f app | grep "venue"`

4. **Verify:**
   - ✅ Venue appears in list
   - ✅ Mode shows as PLAYLIST
   - ✅ Pricing shows correctly
   - ✅ Logs show all operations
   - ✅ No errors in console or logs

---

## 💡 Tips

- **Logs are verbose** - You'll see every database query, API call, etc.
- **Logs are JSON** - Easy to parse and filter
- **All operations logged** - Nothing happens silently
- **Check both browser console and Docker logs** - Different info in each

---

**Ready to test!** Start with creating a venue and watch the logs to see everything that happens.
