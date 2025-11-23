# 💳 Credit System - Final Requirements Summary

## 📋 Requirements Overview

### **1. Credit Configuration (Per Venue)**

**Venue Settings:**
- `creditPerSong`: Decimal (configurable per venue) - How many credits each song costs
- `defaultCredits`: Decimal (configurable per venue) - Credits given to new clients
- `maxCredits`: Decimal | null (configurable, default = null = no max)
- `rateLimitRequests`: Int (e.g., 5 requests)
- `rateLimitWindowMinutes`: Int (e.g., 10 minutes)

**Example:**
```json
{
  "creditPerSong": 2.5,
  "defaultCredits": 10.0,
  "maxCredits": 100.0,  // or null for unlimited
  "rateLimitRequests": 5,
  "rateLimitWindowMinutes": 10
}
```

### **2. Client ID Format**

**Important:** IDs are set by n8n and sent to Rockola app. We don't generate them.

**WhatsApp:**
- Format: Phone number normalized (no +, no spaces, no dashes)
- Example: `"541112121212"` (from `+54 11 1212-1212`)

**Telegram:**
- Format: `{name}_{telegramId}`
- Example: `"Pablo_8223311098"` (name: "Pablo", Telegram ID: 8223311098)

**Storage:**
- Store in `VenueClient.identifier` field
- Store platform in `VenueClient.platform` field

### **3. Credit Management**

**Automatic (via n8n mock payment):**
1. Client runs out of credits
2. Bot generates purchase link via n8n webhook
3. User opens link → selects credit quantity → clicks purchase
4. n8n webhook calls Rockola: `POST /api/webhooks/n8n/credit-purchase`
5. Rockola adds credits to client
6. Bot sends confirmation message

**Manual (by venue owner):**
- Venue owner can manually add credits to any client
- Uses client's phone number/identifier to find client
- Useful for physical payments at venue

### **4. Rate Limiting**

**Per Client, Per Venue:**
- Max X requests in Y minutes
- Configurable per venue
- Example: Max 5 requests in 10 minutes
- If exceeded: Return error, don't create request

### **5. Client Data Visibility**

**Venue Owners Can See:**
- All clients for their venues
- Client identifier (phone/Telegram ID)
- Client name (if available)
- Current credit balance
- Total spending
- Total requests
- Transaction history
- Request history

---

## 🗄️ Updated Database Schema

### **Venue Model (Add Credit Settings)**

```prisma
model Venue {
  // ... existing fields ...
  
  // Credit system settings
  creditPerSong          Decimal?  @db.Decimal(10, 2) // Credits per song request
  defaultCredits         Decimal?  @default(0) @db.Decimal(10, 2) // Credits for new clients
  maxCredits             Decimal?  @db.Decimal(10, 2) // Max credits per client (null = unlimited)
  rateLimitRequests      Int?      // Max requests per window
  rateLimitWindowMinutes Int?      // Time window in minutes
  
  // ... rest of fields ...
}
```

### **VenueClient Model**

```prisma
model VenueClient {
  id                String   @id @default(uuid())
  venueId           String
  identifier        String   // WhatsApp: "541112121212", Telegram: "Pablo_8223311098"
  platform          String   // "whatsapp" | "telegram"
  name              String?  // Optional name (from Telegram or provided)
  credits           Decimal  @default(0) @db.Decimal(10, 2)
  totalSpent        Decimal  @default(0) @db.Decimal(10, 2)
  totalRequests     Int      @default(0)
  firstSeenAt       DateTime @default(now())
  lastSeenAt        DateTime @default(now())
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  venue         Venue              @relation(fields: [venueId], references: [id], onDelete: Cascade)
  songRequests  SongRequest[]
  transactions  CreditTransaction[]

  @@unique([venueId, identifier, platform])
  @@index([venueId])
  @@index([identifier])
  @@index([venueId, identifier, platform])
}
```

### **CreditTransaction Model**

```prisma
model CreditTransaction {
  id                String   @id @default(uuid())
  venueClientId     String
  venueId           String
  type              TransactionType
  amount            Decimal  @db.Decimal(10, 2) // Positive = credit, Negative = debit
  balanceBefore     Decimal  @db.Decimal(10, 2)
  balanceAfter      Decimal  @db.Decimal(10, 2)
  description       String?
  songRequestId     String?
  metadata          Json?    // { purchaseLinkId, paymentMethod, etc. }
  createdAt         DateTime @default(now())

  venueClient  VenueClient  @relation(fields: [venueClientId], references: [id], onDelete: Cascade)
  venue        Venue       @relation(fields: [venueId], references: [id], onDelete: Cascade)
  songRequest  SongRequest? @relation(fields: [songRequestId], references: [id], onDelete: SetNull)

  @@index([venueClientId])
  @@index([venueId])
  @@index([songRequestId])
  @@index([createdAt])
}

enum TransactionType {
  CREDIT_ADDED      // Admin adds credits (manual or via purchase)
  CREDIT_DEDUCTED   // Song request payment
  CREDIT_REFUNDED   // Request cancelled/refunded
  CREDIT_ADJUSTED   // Manual adjustment by admin
}
```

### **Update SongRequest Model**

```prisma
model SongRequest {
  // ... existing fields ...
  
  venueClientId     String?
  creditsUsed        Decimal? @db.Decimal(10, 2)
  
  venueClient VenueClient? @relation(fields: [venueClientId], references: [id], onDelete: SetNull)
  transaction CreditTransaction? @relation
  
  @@index([venueClientId])
}
```

---

## 🔄 Complete Flow

### **1. Song Request Flow**

```
Bot Message (n8n) → POST /api/venues/[venueId]/song-requests
{
  "trackName": "Bohemian Rhapsody",
  "artistName": "Queen",
  "clientIdentifier": "541112121212",  // From n8n
  "platform": "whatsapp"              // From n8n
}

Next.js Logic:
1. Get or create VenueClient (using identifier + platform)
2. Check rate limit (max requests in window)
3. Get venue.creditPerSong
4. Check if client.credits >= creditPerSong
5. If insufficient:
   - Return error with current balance
   - Bot can offer to purchase credits
6. If sufficient:
   - Deduct credits (creditPerSong)
   - Create CreditTransaction (debit)
   - Create SongRequest (link to client)
   - Proceed with track search & queue
```

### **2. Credit Purchase Flow (Mock via n8n)**

```
Step 1: Client runs out of credits
  → Bot detects insufficient credits
  → Bot calls n8n webhook to generate purchase link

Step 2: n8n generates purchase link
  → n8n creates mock payment page
  → Returns link to bot
  → Bot sends link to client

Step 3: Client purchases credits
  → Client opens link
  → Selects credit quantity (e.g., 10, 20, 50 credits)
  → Clicks "Purchase"
  → n8n webhook calls Rockola

Step 4: Rockola receives purchase
  POST /api/webhooks/n8n/credit-purchase
  {
    "venueId": "uuid",
    "clientIdentifier": "541112121212",
    "platform": "whatsapp",
    "creditsAmount": 20.0,
    "purchaseId": "mock-payment-id-123"
  }

Step 5: Rockola adds credits
  - Find or create VenueClient
  - Check maxCredits limit (if set)
  - Add credits
  - Create CreditTransaction (CREDIT_ADDED)
  - Return success

Step 6: Bot sends confirmation
  → n8n receives success from Rockola
  → Bot sends confirmation message to client
```

### **3. Manual Credit Addition (Venue Owner)**

```
Venue Owner → UI: Add Credits to Client
  → Enter client identifier (phone number)
  → Enter credit amount
  → Click "Add Credits"

POST /api/venues/[venueId]/clients/add-credits
{
  "identifier": "541112121212",
  "platform": "whatsapp",
  "amount": 50.0,
  "description": "Physical payment at bar"
}

Next.js:
1. Find VenueClient (by identifier + platform + venueId)
2. If not found, create new client
3. Check maxCredits limit
4. Add credits
5. Create CreditTransaction (CREDIT_ADDED)
6. Return success
```

---

## 📡 API Endpoints

### **Song Request (Updated)**

```typescript
POST /api/venues/[venueId]/song-requests
Body: {
  trackName: string;
  artistName: string;
  clientIdentifier: string;  // From n8n
  platform: 'whatsapp' | 'telegram';  // From n8n
}

Response (if insufficient credits):
{
  error: {
    message: "Insufficient credits",
    currentBalance: 2.5,
    required: 5.0,
    shortfall: 2.5
  }
}
```

### **Credit Purchase Webhook (n8n → Rockola)**

```typescript
POST /api/webhooks/n8n/credit-purchase
Body: {
  venueId: string;
  clientIdentifier: string;
  platform: 'whatsapp' | 'telegram';
  creditsAmount: number;
  purchaseId: string;  // Mock payment ID from n8n
  metadata?: {
    selectedQuantity?: number;
    purchaseLinkId?: string;
  };
}

Response: {
  success: true;
  clientId: string;
  newBalance: number;
  transactionId: string;
}
```

### **Manual Credit Addition**

```typescript
POST /api/venues/[venueId]/clients/add-credits
Body: {
  identifier: string;
  platform: 'whatsapp' | 'telegram';
  amount: number;
  description?: string;
}

Response: {
  data: {
    clientId: string;
    newBalance: number;
    transactionId: string;
  };
}
```

### **Client Management**

```typescript
// Get or create client (used internally)
GET /api/venues/[venueId]/clients/by-identifier
Query: {
  identifier: string;
  platform: 'whatsapp' | 'telegram';
}

// List all clients
GET /api/venues/[venueId]/clients
Query: {
  search?: string;
  platform?: 'whatsapp' | 'telegram';
  sortBy?: 'credits' | 'totalSpent' | 'lastSeenAt';
  limit?: number;
  offset?: number;
}

// Get client details
GET /api/venues/[venueId]/clients/[clientId]

// Get client transactions
GET /api/venues/[venueId]/clients/[clientId]/transactions
```

---

## 🛡️ Rate Limiting Logic

```typescript
async function checkRateLimit(
  venueClientId: string,
  venue: Venue
): Promise<boolean> {
  if (!venue.rateLimitRequests || !venue.rateLimitWindowMinutes) {
    return true; // No rate limit configured
  }

  const windowStart = new Date();
  windowStart.setMinutes(
    windowStart.getMinutes() - venue.rateLimitWindowMinutes
  );

  const recentRequests = await prisma.songRequest.count({
    where: {
      venueClientId,
      requestedAt: {
        gte: windowStart,
      },
      status: {
        not: 'FAILED', // Don't count failed requests
      },
    },
  });

  return recentRequests < venue.rateLimitRequests;
}
```

---

## 🎨 UI Components

### **1. Venue Settings (Credit Configuration)**

```
/venues/[venueId]/edit

New Fields:
- Credit Per Song (Decimal)
- Default Credits for New Clients (Decimal)
- Max Credits Per Client (Decimal | null)
- Rate Limit: Max Requests (Int)
- Rate Limit: Time Window (Int, minutes)
```

### **2. Client List**

```
/venues/[venueId]/clients

Features:
- Table: Identifier, Platform, Name, Credits, Total Spent, Last Seen
- Search by identifier/name
- Filter by platform
- Quick action: "Add Credits"
- Click row → Client Detail
```

### **3. Client Detail**

```
/venues/[venueId]/clients/[clientId]

Sections:
- Client Info Card
- Credit Balance Card (with "Add Credits" button)
- Statistics (Total Requests, Avg per Request, etc.)
- Recent Transactions Table
- Recent Song Requests Table
```

### **4. Add Credits Modal**

```
Modal:
- Client Identifier Input (or select from list)
- Platform Select (whatsapp/telegram)
- Credit Amount Input
- Description (optional)
- Submit Button
```

---

## 🔐 Security & Validation

1. **Webhook Security**: Verify n8n webhook requests (API key or signature)
2. **Client Lookup**: Only venue owners can view their clients
3. **Credit Limits**: Enforce maxCredits when adding credits
4. **Rate Limiting**: Prevent abuse
5. **Identifier Validation**: Validate format based on platform

---

## 📝 Implementation Order

### **Phase 1: Database & Models**
1. Update Venue model (add credit settings)
2. Create VenueClient model
3. Create CreditTransaction model
4. Update SongRequest model
5. Create migration

### **Phase 2: Backend Functions**
1. VenueClient functions (getOrCreate, findByIdentifier)
2. Credit management (add, deduct, check balance)
3. Rate limiting function
4. Transaction logging

### **Phase 3: API Endpoints**
1. Song request endpoint (with credit check)
2. Credit purchase webhook (n8n → Rockola)
3. Manual credit addition endpoint
4. Client management endpoints

### **Phase 4: UI**
1. Venue settings (credit configuration)
2. Client list page
3. Client detail page
4. Add credits modal

---

## ✅ Summary

**Key Points:**
- ✅ Credits configurable per venue
- ✅ Default credits configurable per venue
- ✅ Manual credit addition by venue owners
- ✅ Mock payment flow via n8n webhook
- ✅ Client IDs set by n8n (WhatsApp: phone, Telegram: name_id)
- ✅ Rate limiting per client
- ✅ Max credits configurable (default: no max)
- ✅ Full audit trail (transactions)
- ✅ Venue owners can view all client data

**Ready to implement?** Let me know if this matches your requirements!
