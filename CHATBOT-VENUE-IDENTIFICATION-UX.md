# 🎯 Chatbot Venue Identification - UX Design

## 📋 Overview

This document defines the UX strategies for identifying which venue a user wants to request songs from. Multiple approaches are supported to accommodate different use cases.

---

## 🎨 Ideal UX Approaches

### **Approach 1: QR Code (Recommended for Physical Venues) ⭐**

**Best For:** Physical venues (bars, clubs, restaurants, events)

**How It Works:**
1. Venue owner generates QR code in Rockola UI
2. QR code links to chatbot with venue context: `https://wa.me/1234567890?venue={venueId}`
3. User scans QR code at venue
4. Chatbot opens with venue pre-selected
5. User can immediately request songs

**Implementation:**
- QR code URL format: `{CHATBOT_URL}?venue={venueId}` or `{CHATBOT_URL}?venue={venueSlug}`
- Venue ID/slug passed as query parameter
- Chatbot stores venue in conversation context
- No need to ask user which venue

**Advantages:**
- ✅ Zero friction - user scans and starts requesting
- ✅ Perfect for physical venues
- ✅ No confusion about which venue
- ✅ Venue owner controls distribution

**Example Flow:**
```
[User scans QR code at venue]
         ↓
[Chatbot opens: "Welcome to The Groove Bar! 🎵"]
         ↓
[User: "Play Bohemian Rhapsody"]
         ↓
[Bot: "✅ Added to playlist!"]
```

---

### **Approach 2: Phone Number Mapping (For Regular Patrons)**

**Best For:** Regular patrons who frequent specific venues

**How It Works:**
1. User's phone number is linked to a default venue
2. When user messages chatbot, venue is auto-identified
3. User can switch venues if needed

**Implementation:**
- Store `defaultVenueId` in `VenueClient` model (or separate mapping table)
- When chatbot receives message, lookup venue by phone number
- If multiple venues, show selection menu

**Database Schema Addition:**
```prisma
model VenueClient {
  // ... existing fields
  defaultVenueId String?  // Default venue for this client
  defaultVenue   Venue?   @relation("ClientDefaultVenue", fields: [defaultVenueId], references: [id])
}
```

**Advantages:**
- ✅ Seamless for regular patrons
- ✅ No need to select venue each time
- ✅ Can still switch venues if needed

**Example Flow:**
```
[User: "Play Bohemian Rhapsody"]
         ↓
[Bot: "✅ Added to The Groove Bar playlist!"]
         ↓
[User: "Switch to Jazz Club"]
         ↓
[Bot: "Switched to Jazz Club. What song would you like?"]
```

---

### **Approach 3: Venue Selection Menu (Multi-Venue Support)**

**Best For:** Users who visit multiple venues or venues with multiple locations

**How It Works:**
1. User messages chatbot (no venue context)
2. Bot shows list of active venues
3. User selects venue
4. Venue stored in conversation context
5. User can switch venues anytime

**Implementation:**
- First message: Show venue selection menu
- Store selected venue in conversation context (n8n workflow variable)
- Allow switching: "Switch venue" command

**Advantages:**
- ✅ Supports multiple venues
- ✅ User has control
- ✅ Clear selection process

**Example Flow:**
```
[User: "Hi"]
         ↓
[Bot: "Welcome! Which venue? 
       1. The Groove Bar
       2. Jazz Club
       3. Rock Venue
       
       Reply with number or name"]
         ↓
[User: "1"]
         ↓
[Bot: "Great! You're connected to The Groove Bar. What song would you like?"]
```

---

### **Approach 4: Venue Name in Message (Flexible)**

**Best For:** Users who mention venue in their message

**How It Works:**
1. User sends message: "Play Bohemian Rhapsody at The Groove Bar"
2. AI agent extracts venue name from message
3. Bot validates venue exists and is active
4. Bot uses that venue for the request

**Implementation:**
- AI agent extracts: `{trackName}`, `{artistName}`, `{venueName}`
- Lookup venue by name/slug
- If multiple matches, ask user to clarify

**Advantages:**
- ✅ Natural language support
- ✅ Flexible - works with any message format
- ✅ No pre-configuration needed

**Example Flow:**
```
[User: "Play Bohemian Rhapsody at The Groove Bar"]
         ↓
[Bot extracts: track="Bohemian Rhapsody", artist="Queen", venue="The Groove Bar"]
         ↓
[Bot: "✅ Added to The Groove Bar playlist!"]
```

---

### **Approach 5: Venue Code/Shortcode (Quick Access)**

**Best For:** Venues with printed materials (menus, flyers, posters)

**How It Works:**
1. Each venue has a short code (e.g., "GROOVE", "JAZZ123")
2. User sends code to chatbot: "GROOVE"
3. Bot identifies venue from code
4. Venue stored in conversation context

**Implementation:**
- Add `shortCode` field to `Venue` model (unique, uppercase)
- User sends: `{shortCode}` or `"Connect {shortCode}"`
- Bot looks up venue by shortCode

**Database Schema Addition:**
```prisma
model Venue {
  // ... existing fields
  shortCode String? @unique  // e.g., "GROOVE", "JAZZ123"
}
```

**Advantages:**
- ✅ Easy to remember and share
- ✅ Works on printed materials
- ✅ Quick venue switching

**Example Flow:**
```
[User: "GROOVE"]
         ↓
[Bot: "Connected to The Groove Bar! What song would you like?"]
         ↓
[User: "Play Bohemian Rhapsody"]
         ↓
[Bot: "✅ Added to playlist!"]
```

---

### **Approach 6: Default Venue (Simplest)**

**Best For:** Single-venue chatbots or venue-specific phone numbers

**How It Works:**
1. Chatbot is configured with one default venue
2. All requests go to that venue
3. No venue selection needed

**Implementation:**
- Store default venue in n8n workflow configuration
- All requests use this venue
- Simplest implementation

**Advantages:**
- ✅ Simplest to implement
- ✅ Zero friction
- ✅ Perfect for dedicated venue chatbots

**Example Flow:**
```
[User: "Play Bohemian Rhapsody"]
         ↓
[Bot: "✅ Added to The Groove Bar playlist!"]
```

---

## 🎯 Recommended Hybrid Approach

**Best Practice:** Combine multiple approaches for maximum flexibility

### **Priority Order:**

1. **QR Code** (if present in URL) → Use venue from query parameter
2. **Phone Number Mapping** (if user has default venue) → Use default venue
3. **Venue Name in Message** (if mentioned) → Extract and use
4. **Venue Code** (if sent) → Lookup by shortCode
5. **Venue Selection Menu** (if none of above) → Show menu
6. **Default Venue** (if configured) → Use default

### **Implementation Flow:**

```javascript
// Pseudo-code for venue identification
function identifyVenue(message, phoneNumber, queryParams) {
  // 1. Check QR code (query parameter)
  if (queryParams.venue) {
    return getVenueById(queryParams.venue);
  }
  
  // 2. Check phone number mapping
  const client = getClientByPhone(phoneNumber);
  if (client?.defaultVenueId) {
    return getVenueById(client.defaultVenueId);
  }
  
  // 3. Extract venue from message (AI agent)
  const extractedVenue = extractVenueFromMessage(message);
  if (extractedVenue) {
    return findVenueByName(extractedVenue);
  }
  
  // 4. Check for venue code
  const venueCode = extractVenueCode(message);
  if (venueCode) {
    return findVenueByShortCode(venueCode);
  }
  
  // 5. Show selection menu
  return showVenueSelectionMenu();
}
```

---

## 📱 User Experience Flows

### **Flow 1: First-Time User (QR Code)**

```
[User scans QR code at venue]
         ↓
[Chatbot: "Welcome to The Groove Bar! 🎵
          I can help you request songs for our playlist.
          Just tell me the song name and artist!"]
         ↓
[User: "Play Bohemian Rhapsody by Queen"]
         ↓
[Bot: "✅ Great! I've added 'Bohemian Rhapsody' by Queen to the playlist!
       📍 Queue Position: #3
       🎵 Playlist: [link]
       Your remaining credits: 10.00"]
```

### **Flow 2: Returning User (Phone Number Mapping)**

```
[User: "Play Stairway to Heaven"]
         ↓
[Bot: "✅ Added 'Stairway to Heaven' by Led Zeppelin to The Groove Bar playlist!
       📍 Queue Position: #5
       Your remaining credits: 8.00"]
```

### **Flow 3: Multi-Venue User**

```
[User: "Hi"]
         ↓
[Bot: "Welcome back! Which venue?
       1. The Groove Bar
       2. Jazz Club
       3. Rock Venue
       
       Or scan the QR code at the venue"]
         ↓
[User: "1"]
         ↓
[Bot: "Connected to The Groove Bar! What song would you like?"]
         ↓
[User: "Play Bohemian Rhapsody"]
         ↓
[Bot: "✅ Added to playlist!"]
```

### **Flow 4: Venue Switching**

```
[User: "Switch to Jazz Club"]
         ↓
[Bot: "Switched to Jazz Club! What song would you like?"]
         ↓
[User: "Play Take Five"]
         ↓
[Bot: "✅ Added to Jazz Club playlist!"]
```

### **Flow 5: Venue in Message**

```
[User: "Play Bohemian Rhapsody at The Groove Bar"]
         ↓
[Bot: "✅ Added 'Bohemian Rhapsody' by Queen to The Groove Bar playlist!"]
```

---

## 🔧 Implementation Details

### **1. QR Code Generation**

**API Endpoint:** `GET /api/venues/[venueId]/qr-code`

**Response:**
```json
{
  "data": {
    "qrCodeUrl": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://wa.me/1234567890?venue=550e8400-e29b-41d4-a716-446655440000",
    "chatbotUrl": "https://wa.me/1234567890?venue=550e8400-e29b-41d4-a716-446655440000",
    "venueId": "550e8400-e29b-41d4-a716-446655440000",
    "venueSlug": "the-groove-bar"
  }
}
```

**UI:** Venue settings page shows QR code that venue owner can download/print

---

### **2. Phone Number to Venue Mapping**

**Database Schema:**
```prisma
model VenueClient {
  // ... existing fields
  defaultVenueId String?
  defaultVenue   Venue?   @relation("ClientDefaultVenue", fields: [defaultVenueId], references: [id])
  
  @@index([identifier, platform])  // For quick lookup
}

// Or separate mapping table
model ClientVenueMapping {
  id            String   @id @default(uuid())
  clientId      String
  venueId       String
  isDefault     Boolean  @default(false)
  lastUsedAt    DateTime @default(now())
  
  client        VenueClient @relation(fields: [clientId], references: [id])
  venue         Venue       @relation(fields: [venueId], references: [id])
  
  @@unique([clientId, venueId])
  @@index([clientId, isDefault])
}
```

**API Endpoint:** `GET /api/venues/clients/by-identifier?identifier={phone}&platform=whatsapp`

**Response includes default venue:**
```json
{
  "data": {
    "id": "...",
    "identifier": "541112121212",
    "defaultVenueId": "550e8400-e29b-41d4-a716-446655440000",
    "defaultVenue": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "The Groove Bar"
    }
  }
}
```

---

### **3. Venue Short Code**

**Database Schema:**
```prisma
model Venue {
  // ... existing fields
  shortCode String? @unique  // e.g., "GROOVE", "JAZZ123"
}
```

**API Endpoint:** `GET /api/venues/by-shortcode?code=GROOVE`

**Response:**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "The Groove Bar",
    "shortCode": "GROOVE",
    "isActive": true
  }
}
```

---

### **4. Venue Selection Menu**

**API Endpoint:** `GET /api/venues?active=true&limit=10`

**Response:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "The Groove Bar",
      "slug": "the-groove-bar",
      "isActive": true
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Jazz Club",
      "slug": "jazz-club",
      "isActive": true
    }
  ]
}
```

**n8n Workflow:**
- Format as numbered list
- Store selected venue in workflow variable: `$workflow.venueId`

---

### **5. AI Agent Venue Extraction**

**Prompt for AI Agent:**
```
Extract venue information from user message:
- Track name
- Artist name
- Venue name (if mentioned)

Examples:
- "Play Bohemian Rhapsody at The Groove Bar" → venue: "The Groove Bar"
- "Play song at Jazz Club" → venue: "Jazz Club"
- "Play song" → venue: null (use context/default)
```

**Output:**
```json
{
  "trackName": "Bohemian Rhapsody",
  "artistName": "Queen",
  "venueName": "The Groove Bar"  // or null
}
```

---

## 🎨 UI Components Needed

### **1. QR Code Generator (Venue Settings)**

**Location:** `/venues/[venueId]/edit` or `/venues/[venueId]/settings`

**Features:**
- Display QR code image
- Download QR code (PNG/SVG)
- Copy chatbot URL
- Print-friendly version

**Component:** `components/venues/VenueQRCode.tsx`

---

### **2. Venue Short Code Input (Venue Settings)**

**Location:** `/venues/[venueId]/edit`

**Features:**
- Input field for short code
- Validation (unique, uppercase, alphanumeric)
- Display short code usage instructions

**Component:** `components/venues/VenueShortCode.tsx`

---

## 📊 Decision Matrix

| Approach | Friction | Best For | Implementation Complexity |
|----------|---------|----------|---------------------------|
| QR Code | ⭐⭐⭐⭐⭐ | Physical venues | Low |
| Phone Mapping | ⭐⭐⭐⭐ | Regular patrons | Medium |
| Selection Menu | ⭐⭐⭐ | Multi-venue users | Low |
| Venue in Message | ⭐⭐⭐⭐ | Flexible users | Medium (AI agent) |
| Venue Code | ⭐⭐⭐⭐ | Printed materials | Low |
| Default Venue | ⭐⭐⭐⭐⭐ | Single venue | Very Low |

---

## ✅ Recommended Implementation Order

1. **Phase 1: Basic (MVP)**
   - Default venue in n8n workflow config
   - Venue selection menu (if multiple venues)

2. **Phase 2: QR Codes**
   - QR code generation API
   - QR code display in venue settings
   - Venue from query parameter

3. **Phase 3: Phone Mapping**
   - Default venue in VenueClient
   - Venue lookup by phone number

4. **Phase 4: Advanced**
   - Venue short codes
   - AI agent venue extraction
   - Venue switching command

---

## 🧪 Testing Scenarios

- [ ] QR code scan → Venue identified correctly
- [ ] Phone number mapping → Default venue used
- [ ] Venue selection menu → User can select venue
- [ ] Venue in message → Extracted correctly
- [ ] Venue code → Lookup works
- [ ] No venue context → Shows selection menu
- [ ] Invalid venue → Error message
- [ ] Inactive venue → Error message
- [ ] Venue switching → Context updated
- [ ] Multiple venues with same name → Asks for clarification

---

## 📚 Related Documentation

- [N8N-CHATBOT-SONG-REQUEST-FLOW.md](./N8N-CHATBOT-SONG-REQUEST-FLOW.md) - Complete song request flow
- [ROCKOLA-API-FOR-N8N.md](./ROCKOLA-API-FOR-N8N.md) - API reference

---

## 🎯 Summary

**Best Approach:** **Hybrid** - Support multiple methods with priority order:

1. **QR Code** (zero friction for physical venues)
2. **Phone Mapping** (seamless for regular patrons)
3. **Venue in Message** (flexible for any user)
4. **Selection Menu** (fallback for new users)

**MVP Implementation:**
- Start with **default venue** or **selection menu**
- Add **QR codes** in Phase 2
- Add **phone mapping** in Phase 3

This provides the best UX for all use cases! 🎉
