# 💳 Credit System & Venue Client Architecture

## 🎯 Overview

**Goal:** Build a mock credit system for testing before implementing real payment gateways. This allows us to:
- Test the full song request flow without payment complexity
- Track venue clients (patrons) and their spending
- Provide venue owners with client analytics
- Easily swap in real payments later

---

## 🏗️ Architecture

```
┌─────────────────┐
│  Venue Client   │  (WhatsApp/Telegram user)
│  (Patron)       │
└────────┬────────┘
         │
         │ Request Song via Bot
         ▼
┌─────────────────┐
│   Next.js API   │
│  - Check Credits │
│  - Deduct Credits│
│  - Create Request│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│  - VenueClient  │
│  - Credits      │
│  - Transactions │
└─────────────────┘
```

---

## 📊 Database Schema

### **1. VenueClient Model** (New)

```prisma
model VenueClient {
  id                String   @id @default(uuid())
  venueId           String
  identifier        String   // Phone number: "+1234567890" or Telegram ID
  platform          String   // "whatsapp" | "telegram"
  name              String?  // Optional: "John Doe" (if provided)
  credits           Decimal  @default(0) @db.Decimal(10, 2) // Current balance
  totalSpent        Decimal  @default(0) @db.Decimal(10, 2) // Lifetime spending
  totalRequests     Int      @default(0) // Total song requests made
  firstSeenAt       DateTime @default(now())
  lastSeenAt        DateTime @default(now())
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  venue         Venue              @relation(fields: [venueId], references: [id], onDelete: Cascade)
  songRequests  SongRequest[]
  transactions  CreditTransaction[]

  @@unique([venueId, identifier, platform]) // One client per venue/platform combo
  @@index([venueId])
  @@index([identifier])
  @@index([venueId, identifier, platform])
}
```

**Why this design:**
- `identifier` = phone number or Telegram ID (unique per platform)
- `platform` = "whatsapp" or "telegram" (supports multiple platforms)
- `credits` = current balance (mock currency)
- `totalSpent` = lifetime spending for analytics
- Unique constraint ensures one client record per venue/platform/identifier

### **2. CreditTransaction Model** (New)

```prisma
model CreditTransaction {
  id                String   @id @default(uuid())
  venueClientId     String
  venueId           String
  type              TransactionType
  amount            Decimal  @db.Decimal(10, 2) // Positive = credit, Negative = debit
  balanceBefore     Decimal  @db.Decimal(10, 2)
  balanceAfter      Decimal  @db.Decimal(10, 2)
  description       String?  // "Song request: Bohemian Rhapsody"
  songRequestId     String?  // Link to song request if applicable
  metadata          Json?    // Additional data (admin notes, etc.)
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
  CREDIT_ADDED      // Admin adds credits (testing)
  CREDIT_DEDUCTED   // Song request payment
  CREDIT_REFUNDED   // Request cancelled/refunded
  CREDIT_ADJUSTED   // Manual adjustment by admin
}
```

**Why this design:**
- Full audit trail of all credit movements
- Links to song requests for tracking
- Supports multiple transaction types
- Balance tracking (before/after) for verification

### **3. Update SongRequest Model**

```prisma
model SongRequest {
  // ... existing fields ...
  
  venueClientId     String?  // Link to VenueClient
  creditsUsed       Decimal? @db.Decimal(10, 2) // Credits spent on this request
  
  venueClient VenueClient? @relation(fields: [venueClientId], references: [id], onDelete: SetNull)
  transaction CreditTransaction? @relation
  
  @@index([venueClientId])
}
```

### **4. Update Payment Model** (For future real payments)

```prisma
model Payment {
  // ... existing fields ...
  
  paymentMethod     String?  // "credits" | "stripe" | "mercado_pago"
  creditsUsed       Decimal? @db.Decimal(10, 2) // If paid with credits
  
  // ... rest stays the same ...
}
```

---

## 🔄 Credit System Flow

### **1. Client Registration** (Automatic)

When a client makes their first request:
```
Bot Message → Next.js API → Find or Create VenueClient
```

**Logic:**
```typescript
async function getOrCreateVenueClient(
  venueId: string,
  identifier: string,
  platform: 'whatsapp' | 'telegram',
  name?: string
): Promise<VenueClient> {
  // Try to find existing client
  let client = await prisma.venueClient.findUnique({
    where: {
      venueId_identifier_platform: {
        venueId,
        identifier,
        platform,
      },
    },
  });

  // Create if doesn't exist
  if (!client) {
    client = await prisma.venueClient.create({
      data: {
        venueId,
        identifier,
        platform,
        name,
        credits: 0, // Start with 0 credits
      },
    });
  } else {
    // Update last seen
    await prisma.venueClient.update({
      where: { id: client.id },
      data: { lastSeenAt: new Date() },
    });
  }

  return client;
}
```

### **2. Song Request with Credits**

```
1. Client requests song via bot
2. Next.js: Get or create VenueClient
3. Next.js: Check if client has enough credits
4. If yes:
   - Deduct credits
   - Create CreditTransaction (debit)
   - Create SongRequest (link to client)
   - Proceed with track search & queue
5. If no:
   - Return error: "Insufficient credits. You have X credits, need Y."
```

### **3. Credit Deduction**

```typescript
async function deductCredits(
  venueClientId: string,
  amount: Decimal,
  description: string,
  songRequestId?: string
): Promise<CreditTransaction> {
  const client = await prisma.venueClient.findUnique({
    where: { id: venueClientId },
  });

  if (!client) {
    throw new Error('Client not found');
  }

  if (client.credits < amount) {
    throw new Error(`Insufficient credits. Balance: ${client.credits}, Required: ${amount}`);
  }

  const balanceBefore = client.credits;
  const balanceAfter = balanceBefore - amount;

  // Update client balance
  await prisma.venueClient.update({
    where: { id: venueClientId },
    data: {
      credits: balanceAfter,
      totalSpent: client.totalSpent + amount,
      totalRequests: client.totalRequests + 1,
    },
  });

  // Create transaction record
  const transaction = await prisma.creditTransaction.create({
    data: {
      venueClientId,
      venueId: client.venueId,
      type: 'CREDIT_DEDUCTED',
      amount: -amount, // Negative for debit
      balanceBefore,
      balanceAfter,
      description,
      songRequestId,
    },
  });

  return transaction;
}
```

---

## 🎛️ Admin Functions

### **1. Add Credits to Client** (Testing)

```typescript
POST /api/venues/[venueId]/clients/[clientId]/credits
Body: {
  amount: number;
  description?: string; // "Test credits", "Promotional credits", etc.
}
```

### **2. View Client Details**

```typescript
GET /api/venues/[venueId]/clients/[clientId]
Response: {
  id: string;
  identifier: string;
  platform: string;
  name: string;
  credits: number;
  totalSpent: number;
  totalRequests: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
  recentTransactions: CreditTransaction[];
  recentRequests: SongRequest[];
}
```

### **3. List All Clients for Venue**

```typescript
GET /api/venues/[venueId]/clients
Query: {
  search?: string; // Search by identifier or name
  platform?: 'whatsapp' | 'telegram';
  minCredits?: number;
  sortBy?: 'credits' | 'totalSpent' | 'lastSeenAt';
  limit?: number;
  offset?: number;
}
```

### **4. View Client Transaction History**

```typescript
GET /api/venues/[venueId]/clients/[clientId]/transactions
Query: {
  type?: TransactionType;
  limit?: number;
  offset?: number;
}
```

---

## 📱 API Endpoints

### **Venue Client Management**

```typescript
// Get or create client (used by bot)
POST /api/venues/[venueId]/clients
Body: {
  identifier: string; // Phone number or Telegram ID
  platform: 'whatsapp' | 'telegram';
  name?: string;
}

// List clients
GET /api/venues/[venueId]/clients

// Get client details
GET /api/venues/[venueId]/clients/[clientId]

// Update client (name, etc.)
PUT /api/venues/[venueId]/clients/[clientId]

// Delete client
DELETE /api/venues/[venueId]/clients/[clientId]
```

### **Credit Management**

```typescript
// Add credits (admin/testing)
POST /api/venues/[venueId]/clients/[clientId]/credits/add
Body: {
  amount: number;
  description?: string;
}

// Deduct credits (admin)
POST /api/venues/[venueId]/clients/[clientId]/credits/deduct
Body: {
  amount: number;
  description?: string;
}

// Get credit balance
GET /api/venues/[venueId]/clients/[clientId]/credits

// Get transaction history
GET /api/venues/[venueId]/clients/[clientId]/transactions
```

### **Song Request (Updated)**

```typescript
// Create song request (with credit check)
POST /api/venues/[venueId]/song-requests
Body: {
  trackName: string;
  artistName: string;
  clientIdentifier: string; // Phone or Telegram ID
  platform: 'whatsapp' | 'telegram';
}
```

**Flow:**
1. Get or create VenueClient
2. Check if venue has pricing enabled
3. If pricing enabled:
   - Check client has enough credits
   - Deduct credits
   - Create transaction
4. Create SongRequest (link to client)
5. Proceed with track search

---

## 🎨 UI Components

### **1. Client List Page**

```
/venues/[venueId]/clients

Features:
- Table of all clients
- Search by identifier/name
- Filter by platform
- Sort by credits, spending, last seen
- Quick actions: Add credits, View details
```

### **2. Client Detail Page**

```
/venues/[venueId]/clients/[clientId]

Sections:
- Client Info (identifier, platform, name, dates)
- Credit Balance (current, total spent)
- Statistics (total requests, avg per request)
- Recent Transactions (table)
- Recent Song Requests (table)
- Actions (Add credits, Adjust credits)
```

### **3. Song Request List** (Enhanced)

```
/venues/[venueId]/requests

Enhanced with:
- Client identifier column
- Credits used column
- Filter by client
- Link to client detail page
```

---

## 🔄 Migration Path to Real Payments

**Phase 1: Credits Only** (Current)
- All requests use credits
- Admin adds credits manually
- No real payment gateway

**Phase 2: Hybrid** (Future)
- Clients can pay with credits OR real payment
- Payment gateway adds credits to account
- Seamless transition

**Phase 3: Real Payments Only** (Optional)
- Remove credit system
- Direct payment per request
- Or keep credits as loyalty/rewards

---

## 🧪 Testing Workflow

### **1. Setup Test Client**

```bash
# Add credits to a client
curl -X POST /api/venues/{venueId}/clients/{clientId}/credits/add \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"amount": 100, "description": "Test credits"}'
```

### **2. Make Song Request**

```bash
# Client requests song (via bot simulation)
curl -X POST /api/venues/{venueId}/song-requests \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "trackName": "Bohemian Rhapsody",
    "artistName": "Queen",
    "clientIdentifier": "+1234567890",
    "platform": "whatsapp"
  }'
```

### **3. Verify Credits Deducted**

```bash
# Check client balance
curl -X GET /api/venues/{venueId}/clients/{clientId}/credits \
  -H "Authorization: Bearer $API_KEY"
```

---

## 📋 Implementation Checklist

### **Database**
- [ ] Create VenueClient model
- [ ] Create CreditTransaction model
- [ ] Update SongRequest model (add venueClientId, creditsUsed)
- [ ] Create migration
- [ ] Update Prisma schema

### **Backend**
- [ ] Create VenueClient model functions (getOrCreate, update, etc.)
- [ ] Create credit management functions (add, deduct, check balance)
- [ ] Create transaction logging
- [ ] Update song request creation to use credits
- [ ] Create API endpoints for client management
- [ ] Create API endpoints for credit management

### **Frontend**
- [ ] Client list page
- [ ] Client detail page
- [ ] Add credits modal/form
- [ ] Transaction history table
- [ ] Update song request list to show client info
- [ ] Credit balance display

### **Testing**
- [ ] Test client creation
- [ ] Test credit addition
- [ ] Test credit deduction
- [ ] Test insufficient credits handling
- [ ] Test transaction logging
- [ ] Test client lookup

---

## 🎯 Key Design Decisions

1. **Automatic Client Creation**: Clients are created on first request (no registration needed)
2. **Platform Separation**: Same phone number can be different clients on WhatsApp vs Telegram
3. **Credit-First**: All requests use credits (easy to swap in real payments later)
4. **Full Audit Trail**: Every credit movement is logged
5. **Venue-Scoped**: Clients are per-venue (same phone = different client per venue)

---

## 🔐 Security Considerations

1. **Client Lookup**: Only venue owners can view their clients
2. **Credit Management**: Only venue owners/admins can add credits
3. **Identifier Privacy**: Hash phone numbers in logs (optional)
4. **Rate Limiting**: Prevent credit abuse/spam

---

This architecture provides a solid foundation for testing while being easy to extend with real payments later!
