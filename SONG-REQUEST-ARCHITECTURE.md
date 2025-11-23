# 🎵 Song Request System Architecture

## 🏗️ System Overview

**Architecture:** Next.js Backend (Business Logic) + n8n (Spotify Operations + Bot)

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────┐
│   Next.js API   │◄───────►│  PostgreSQL  │         │   Stripe    │
│  (Business      │         │   Database   │         │  Payments   │
│   Logic)        │         │              │         │  (Future)   │
└────────┬────────┘         └──────────────┘         └─────────────┘
         │                                                  │
         │ Webhooks / API Calls                            │
         │                                                  │
         ▼                                                  ▼
┌─────────────────┐                              ┌──────────────┐
│      n8n        │                              │   Spotify    │
│  (Spotify Ops  │─────────────────────────────►│     API      │
│   + Bot)        │                              │              │
└────────┬────────┘                              └──────────────┘
         │
         │ Bot Messages
         ▼
┌─────────────────┐
│ Venue Clients   │
│ (WhatsApp/      │
│  Telegram)      │
└─────────────────┘
```

---

## 📋 Core Responsibilities

### **Next.js Backend (Your App)**
- ✅ Song request CRUD operations
- ✅ Credit system management (mock payments for testing)
- ✅ Venue client tracking (WhatsApp/Telegram users)
- ✅ Business logic & validation
- ✅ Database management
- ✅ User authentication
- ✅ Venue management
- ✅ API endpoints for UI
- ✅ Webhook receivers (from n8n)

### **n8n (Automation Platform)**
- ✅ Spotify API calls (search, queue, playback)
- ✅ Track search & validation
- ✅ Queue management
- ✅ Playback monitoring
- ✅ Rule evaluation (Automation Mode)
- ✅ Sentiment analysis
- ✅ Auto-moderation
- ✅ Bot integration (WhatsApp/Telegram)
- ✅ Client ID generation (WhatsApp: phone, Telegram: name_id)
- ✅ Mock payment link generation
- ✅ Credit purchase webhook to Rockola

---

## 🎯 Song Request Flow by Mode

### **1. Queue Mode** (Open Requests)

**Flow:**
```
User Request → Next.js API → n8n (Search) → Payment → n8n (Queue) → Spotify
```

**Detailed Steps:**

1. **Request Creation** (Next.js)
   ```
   POST /api/venues/[venueId]/song-requests
   {
     "trackName": "Bohemian Rhapsody",
     "artistName": "Queen",
     "clientIdentifier": "541112121212",  // From n8n (WhatsApp: phone, Telegram: name_id)
     "platform": "whatsapp",               // From n8n
     "clientName": "John",                 // Optional, from n8n
     "clientLastName": "Doe"               // Optional, from n8n
   }
   ```
   - Get or create `VenueClient` (using identifier + platform)
   - Check rate limit (max requests in time window)
   - Validate venue is active
   - Check if pricing is enabled
   - If pricing enabled:
     - Get `venue.creditPerSong`
     - Check if `client.credits >= creditPerSong`
     - If insufficient: Return error with balance info
     - If sufficient: Deduct credits, create transaction
   - Create `SongRequest` with status `PENDING`, link to client

2. **Track Search** (n8n Webhook)
   ```
   Next.js → POST n8n/webhook/search-track
   {
     "venueId": "uuid",
     "requestId": "uuid",
     "trackName": "Bohemian Rhapsody",
     "artistName": "Queen"
   }
   ```
   - n8n searches Spotify API
   - Returns track details (spotifyTrackId, trackUri, etc.)
   - Next.js updates SongRequest with track info

3. **Credit Check & Deduction** (if pricing enabled)
   ```
   Next.js → Check client credits
   → If insufficient:
     - Return error to n8n
     - n8n bot offers credit purchase
   → If sufficient:
     - Deduct credits (venue.creditPerSong)
     - Create CreditTransaction (debit)
     - Proceed to track search
   ```

   **Credit Purchase Flow (Mock via n8n):**
   ```
   Client needs credits → Bot detects insufficient balance
   → Bot calls n8n webhook to generate purchase link
   → n8n creates mock payment page (with manual credit input)
   → User opens link → Enters credit amount → Clicks purchase
   → n8n webhook → POST /api/webhooks/n8n/credit-purchase
   → Next.js adds credits to client
   → Bot sends confirmation message
   ```

4. **Queue Song** (n8n Webhook)
   ```
   Next.js → POST n8n/webhook/queue-song
   {
     "venueId": "uuid",
     "requestId": "uuid",
     "trackUri": "spotify:track:...",
     "spotifyAccessToken": "..."
   }
   ```
   - n8n adds track to Spotify queue
   - Returns queue position
   - Next.js updates SongRequest: status → `QUEUED`, queuePosition

5. **Playback Monitoring** (n8n Scheduled)
   ```
   n8n (every 30s) → Check Spotify playback
   → If track playing → Webhook to Next.js
   → Update SongRequest: status → `PLAYING`
   → When finished → status → `PLAYED`
   ```

---

### **2. Playlist Mode** (Restricted to Playlist)

**Flow:**
```
User Request → Next.js API → Validate against Playlist → Payment → Queue
```

**Key Differences:**

1. **Playlist Validation** (Next.js)
   - Check if track exists in venue's selected playlist
   - Query `playlist_tracks` table (if exists) or sync from Spotify
   - Reject if track not in playlist

2. **Cooldown Check** (Next.js)
   - Check if same track was played recently (e.g., last 30 min)
   - Prevent duplicate requests

3. **Rest of flow same as Queue Mode**

**Database Schema Addition:**
```prisma
model PlaylistTrack {
  id          String   @id @default(uuid())
  venueId     String
  spotifyTrackId String
  trackName   String
  artistName  String
  trackUri    String
  addedAt     DateTime @default(now())
  
  venue Venue @relation(fields: [venueId], references: [id], onDelete: Cascade)
  
  @@unique([venueId, spotifyTrackId])
  @@index([venueId])
}
```

---

### **3. Automation Mode** (Rule-Based)

**Flow:**
```
User Request → Next.js API → n8n (Rule Evaluation) → Decision → Queue/Reject
```

**Key Differences:**

1. **Rule Evaluation** (n8n)
   ```
   Next.js → POST n8n/webhook/evaluate-request
   {
     "venueId": "uuid",
     "requestId": "uuid",
     "trackName": "...",
     "artistName": "...",
     "currentContext": {...}  // venue rules, time, etc.
   }
   ```
   - n8n evaluates rules against request
   - Checks: time restrictions, genre, explicit content, request limits
   - Returns: `allowed: true/false`, `reason: string`

2. **Context Management**
   - Next.js maintains `venue_context` (current rules state)
   - n8n updates context when rules change
   - Context includes: enabled rules, current playlist, pricing, etc.

3. **Auto-Actions** (n8n Scheduled)
   - n8n runs rule scheduler (every 5 min)
   - Evaluates time-based rules
   - Updates venue context
   - Webhooks Next.js to update database

**Rule Structure:**
```typescript
interface VenueRule {
  id: string;
  venueId: string;
  name: string;
  type: 'content' | 'playlist' | 'genre' | 'pricing' | 'requests' | 'time';
  enabled: boolean;
  conditions: {
    // Time-based
    startTime?: string;  // "22:00"
    endTime?: string;    // "02:00"
    daysOfWeek?: number[]; // [0,1,2,3,4,5,6]
    
    // Content-based
    genres?: string[];
    explicitAllowed?: boolean;
    maxRequestsPerHour?: number;
    
    // Playlist-based
    playlistId?: string;
  };
  actions: {
    // What happens when rule matches
    blockRequests?: boolean;
    switchPlaylist?: string;
    adjustPricing?: number;
    enableAutoModeration?: boolean;
  };
  priority: number;
}
```

---

## 🔄 API Endpoints (Next.js)

### **Song Request Management**

```typescript
// Create song request (from n8n bot)
POST /api/venues/[venueId]/song-requests
Body: {
  trackName: string;
  artistName: string;
  clientIdentifier: string;  // WhatsApp: "541112121212", Telegram: "Pablo_8223311098"
  platform: 'whatsapp' | 'telegram';
  clientName?: string;        // Optional, from bot
  clientLastName?: string;    // Optional, from bot
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

// List song requests
GET /api/venues/[venueId]/song-requests
Query: {
  status?: 'PENDING' | 'PAID' | 'QUEUED' | 'PLAYING' | 'PLAYED';
  clientIdentifier?: string;  // Filter by client
  platform?: 'whatsapp' | 'telegram';
  limit?: number;
  offset?: number;
}

// Get single request
GET /api/venues/[venueId]/song-requests/[requestId]

// Update request (admin)
PUT /api/venues/[venueId]/song-requests/[requestId]
Body: {
  status?: RequestStatus;
  queuePosition?: number;
}

// Cancel request (refund credits if paid)
DELETE /api/venues/[venueId]/song-requests/[requestId]
```

### **Credit Management Endpoints**

```typescript
// Credit purchase webhook (n8n → Rockola)
POST /api/webhooks/n8n/credit-purchase
Headers: {
  'X-API-Key': string;        // n8n API key
  'X-Signature': string;       // Crypto signature for verification
}
Body: {
  venueId: string;
  clientIdentifier: string;    // WhatsApp: "541112121212", Telegram: "Pablo_8223311098"
  platform: 'whatsapp' | 'telegram';
  creditsAmount: number;        // Amount purchased (from manual input on webpage)
  purchaseId: string;          // Mock payment ID from n8n
  metadata?: {
    purchaseLinkId?: string;
  };
}

Response: {
  success: true;
  clientId: string;
  newBalance: number;
  transactionId: string;
}

// Manual credit addition (venue owner)
POST /api/venues/[venueId]/clients/add-credits
Body: {
  identifier: string;
  platform: 'whatsapp' | 'telegram';
  amount: number;
  description?: string;  // "Physical payment at bar"
}

// Get client by identifier
GET /api/venues/[venueId]/clients/by-identifier
Query: {
  identifier: string;
  platform: 'whatsapp' | 'telegram';
}

// List all clients for venue
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
Query: {
  type?: TransactionType;
  limit?: number;
  offset?: number;
}
```

### **Payment Endpoints** (Future - Real Payments)

```typescript
// Create payment session (for future Stripe integration)
POST /api/venues/[venueId]/song-requests/[requestId]/payment
Response: {
  checkoutUrl: string;
  sessionId: string;
}

// Stripe webhook (payment confirmation)
POST /api/webhooks/stripe
// Handles: checkout.session.completed, payment_intent.succeeded
```

### **n8n Webhook Receivers** (Called by n8n)

**Security:** All n8n webhooks must include:
- `X-API-Key`: API key for authentication
- `X-Signature`: Crypto signature (HMAC-SHA256) for verification

```typescript
// Credit purchase (n8n → Rockola)
POST /api/webhooks/n8n/credit-purchase
Headers: {
  'X-API-Key': string;
  'X-Signature': string;  // HMAC-SHA256 signature
}
Body: {
  venueId: string;
  clientIdentifier: string;
  platform: 'whatsapp' | 'telegram';
  creditsAmount: number;
  purchaseId: string;
  metadata?: Json;
}

// Track search result
POST /api/webhooks/n8n/track-found
Headers: {
  'X-API-Key': string;
  'X-Signature': string;
}
Body: {
  requestId: string;
  spotifyTrackId: string;
  trackUri: string;
  trackName: string;
  artistName: string;
  albumName?: string;
}

// Queue position update
POST /api/webhooks/n8n/queue-updated
Headers: {
  'X-API-Key': string;
  'X-Signature': string;
}
Body: {
  requestId: string;
  queuePosition: number;
  status: 'QUEUED' | 'PLAYING';
}

// Playback status update
POST /api/webhooks/n8n/playback-updated
Headers: {
  'X-API-Key': string;
  'X-Signature': string;
}
Body: {
  requestId: string;
  status: 'PLAYING' | 'PLAYED' | 'SKIPPED';
  playedAt?: Date;
}
```

**Webhook Signature Verification:**
```typescript
import crypto from 'crypto';

function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const calculatedSignature = hmac.update(body).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculatedSignature)
  );
}
```

---

## 🔌 n8n Webhook Endpoints (Called by Next.js)

### **Track Search**

```typescript
POST {N8N_WEBHOOK_URL}/search-track
Body: {
  venueId: string;
  requestId: string;
  trackName: string;
  artistName: string;
}
Response: {
  success: boolean;
  track?: {
    spotifyTrackId: string;
    trackUri: string;
    trackName: string;
    artistName: string;
    albumName: string;
    duration: number;
    explicit: boolean;
    previewUrl?: string;
  };
  error?: string;
}
```

### **Queue Song**

```typescript
POST {N8N_WEBHOOK_URL}/queue-song
Body: {
  venueId: string;
  requestId: string;
  trackUri: string;
  spotifyAccessToken: string;  // From venue.spotifyAccessToken
  spotifyRefreshToken: string;
}
Response: {
  success: boolean;
  queuePosition?: number;
  error?: string;
}
```

### **Generate Credit Purchase Link** (n8n → n8n, then n8n → Rockola)

**Flow:**
1. Bot detects insufficient credits
2. Bot calls n8n webhook to generate purchase link
3. n8n creates mock payment webpage with:
   - Manual credit amount input field (numeric)
   - "Purchase" button
4. User enters credit amount → Clicks purchase
5. n8n webhook calls Rockola: `POST /api/webhooks/n8n/credit-purchase`
6. Rockola adds credits → Returns success
7. Bot sends confirmation message to client

### **Evaluate Request** (Automation Mode)

```typescript
POST {N8N_WEBHOOK_URL}/evaluate-request
Body: {
  venueId: string;
  requestId: string;
  trackName: string;
  artistName: string;
  spotifyTrackId: string;
  currentContext: VenueContext;  // Rules, time, etc.
}
Response: {
  allowed: boolean;
  reason?: string;
  suggestedActions?: {
    adjustPricing?: number;
    switchPlaylist?: string;
  };
}
```

### **Get Queue Status**

```typescript
GET {N8N_WEBHOOK_URL}/queue-status?venueId={venueId}
Response: {
  currentTrack: {
    trackId: string;
    trackName: string;
    artistName: string;
    startedAt: Date;
  };
  queue: Array<{
    trackId: string;
    trackName: string;
    position: number;
  }>;
}
```

---

## 📊 Database Models

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
  venueClients VenueClient[]
}
```

### **VenueClient Model** (New)

```prisma
model VenueClient {
  id                String   @id @default(uuid())
  venueId           String
  identifier        String   // WhatsApp: "541112121212", Telegram: "Pablo_8223311098"
  platform          String   // "whatsapp" | "telegram"
  name              String?  // Optional first name
  lastName          String?  // Optional last name
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

### **CreditTransaction Model** (New)

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

### **SongRequest** (Updated)

```prisma
model SongRequest {
  id                String        @id @default(uuid())
  venueId           String
  patronIdentifier  String?       // WhatsApp number, email, etc.
  spotifyTrackId    String?
  trackName         String
  artistName        String
  albumName         String?
  trackUri          String?
  status            RequestStatus @default(PENDING)
  price             Decimal?      @db.Decimal(10, 2)
  currency          String?       @default("USD")
  queuePosition     Int?
  requestedAt       DateTime      @default(now())
  queuedAt          DateTime?
  playedAt          DateTime?
  skippedAt         DateTime?
  skipReason        String?       // "auto_moderation", "manual", etc.
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  venue    Venue    @relation(fields: [venueId], references: [id], onDelete: Cascade)
  payment  Payment? @relation("SongRequestPayment")

  @@index([venueId])
  @@index([status])
  @@index([venueId, status])
  @@index([requestedAt])
}
```

### **PlaylistTrack** (For Playlist Mode)

```prisma
model PlaylistTrack {
  id              String   @id @default(uuid())
  venueId         String
  spotifyTrackId  String
  trackName       String
  artistName      String
  trackUri        String
  albumName       String?
  duration        Int?     // milliseconds
  explicit        Boolean  @default(false)
  addedAt         DateTime @default(now())
  lastPlayedAt    DateTime? // For cooldown checks
  
  venue Venue @relation(fields: [venueId], references: [id], onDelete: Cascade)
  
  @@unique([venueId, spotifyTrackId])
  @@index([venueId])
  @@index([venueId, lastPlayedAt])
}
```

### **Payment Model** (Updated for Future Real Payments)

```prisma
model Payment {
  id               String         @id @default(uuid())
  songRequestId    String         @unique
  venueId          String
  providerPaymentId String?      // Stripe payment intent ID (future)
  paymentMethod    String?       // "credits" | "stripe" | "mercado_pago"
  amount           Decimal        @db.Decimal(10, 2)
  currency         String         @default("USD")
  status           PaymentStatus  @default(PENDING)
  creditsUsed      Decimal?      @db.Decimal(10, 2) // If paid with credits
  venueRevenue     Decimal?       @db.Decimal(10, 2)
  platformFee      Decimal?       @db.Decimal(10, 2)
  processingFee    Decimal?       @db.Decimal(10, 2)
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  songRequest SongRequest @relation("SongRequestPayment", fields: [songRequestId], references: [id], onDelete: Cascade)
  venue       Venue       @relation(fields: [venueId], references: [id], onDelete: Cascade)

  @@index([venueId])
  @@index([status])
}
```

### **VenueRule** (For Automation Mode)

```prisma
model VenueRule {
  id          String   @id @default(uuid())
  venueId     String
  name        String
  type        String   // 'content' | 'playlist' | 'genre' | 'pricing' | 'requests' | 'time'
  enabled     Boolean  @default(true)
  conditions  Json     // Rule conditions
  actions     Json     // Rule actions
  priority    Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  venue Venue @relation(fields: [venueId], references: [id], onDelete: Cascade)
  
  @@index([venueId])
  @@index([venueId, enabled])
  @@index([type])
}
```

### **VenueContext** (Cached rule state)

```prisma
model VenueContext {
  id          String   @id @default(uuid())
  venueId     String   @unique
  context     Json     // Current active rules, playlist, pricing, etc.
  updatedAt   DateTime @updatedAt
  
  venue Venue @relation(fields: [venueId], references: [id], onDelete: Cascade)
}
```

---

## 💳 Credit System Integration

### **Credit-Based Payment Flow** (Current - Testing)

1. **Client Requests Song** (via Bot)
   ```
   Bot → POST /api/venues/[venueId]/song-requests
   {
     "trackName": "Bohemian Rhapsody",
     "artistName": "Queen",
     "clientIdentifier": "541112121212",
     "platform": "whatsapp",
     "clientName": "John",
     "clientLastName": "Doe"
   }
   ```

2. **Credit Check & Deduction** (Next.js)
   ```typescript
   // Get or create VenueClient
   const client = await getOrCreateVenueClient(
     venueId,
     clientIdentifier,
     platform,
     clientName,
     clientLastName
   );

   // Check rate limit
   const rateLimitOk = await checkRateLimit(client.id, venue);
   if (!rateLimitOk) {
     throw new Error('Rate limit exceeded');
   }

   // Check credits
   const creditPerSong = venue.creditPerSong || 0;
   if (client.credits < creditPerSong) {
     return {
       error: {
         message: 'Insufficient credits',
         currentBalance: client.credits,
         required: creditPerSong,
         shortfall: creditPerSong - client.credits
       }
     };
   }

   // Deduct credits
   await deductCredits(
     client.id,
     creditPerSong,
     `Song request: ${trackName} - ${artistName}`,
     requestId
   );
   ```

3. **Credit Purchase Flow** (Mock via n8n)
   ```
   Step 1: Client needs credits
     → Bot detects insufficient balance
     → Bot calls n8n webhook to generate purchase link

   Step 2: n8n generates purchase webpage
     → Webpage has manual credit amount input (numeric field)
     → User enters amount (e.g., 20, 50, 100)
     → User clicks "Purchase"

   Step 3: n8n webhook calls Rockola
     POST /api/webhooks/n8n/credit-purchase
     Headers: {
       'X-API-Key': N8N_API_KEY,
       'X-Signature': calculated_signature
     }
     Body: {
       venueId: "uuid",
       clientIdentifier: "541112121212",
       platform: "whatsapp",
       creditsAmount: 20.0,  // From user input
       purchaseId: "mock-payment-123"
     }

   Step 4: Rockola adds credits
     - Verify webhook signature
     - Find or create VenueClient
     - Check maxCredits limit (if set)
     - Add credits
     - Create CreditTransaction (CREDIT_ADDED)
     - Return success

   Step 5: Bot sends confirmation
     → n8n receives success
     → Bot sends message: "✅ 20 credits added! Your balance: 20.0"
   ```

4. **Manual Credit Addition** (Venue Owner)
   ```typescript
   POST /api/venues/[venueId]/clients/add-credits
   Body: {
     identifier: "541112121212",
     platform: "whatsapp",
     amount: 50.0,
     description: "Physical payment at bar"
   }
   ```

### **Real Payment Integration** (Future - Stripe)

1. **Create Payment Session** (Next.js)
   ```typescript
   // When song request is created and pricing is enabled
   // Future: Can use Stripe to add credits OR pay per song
   const session = await stripe.checkout.sessions.create({
     payment_method_types: ['card'],
     line_items: [{
       price_data: {
         currency: venue.currency || 'USD',
         product_data: {
           name: `${trackName} - ${artistName}`,
           description: `Song request for ${venue.name}`,
         },
         unit_amount: Math.round(venue.pricePerSong * 100),
       },
       quantity: 1,
     }],
     mode: 'payment',
     success_url: `${APP_URL}/venues/${venueId}/requests?success=true`,
     cancel_url: `${APP_URL}/venues/${venueId}/requests?canceled=true`,
     metadata: {
       venueId,
       requestId,
       userId: user.id,
     },
   });
   ```

2. **Stripe Webhook** (Next.js)
   ```typescript
   // When payment succeeds
   POST /api/webhooks/stripe
   - Verify webhook signature
   - Extract metadata (venueId, requestId)
   - Update Payment status → SUCCEEDED
   - Update SongRequest status → PAID
   - Optionally: Add credits to client OR proceed directly to queue
   - Trigger n8n to queue song
   ```

3. **Revenue Split Calculation**
   ```typescript
   const totalAmount = payment.amount;
   const platformFee = totalAmount * 0.15; // 15%
   const processingFee = totalAmount * 0.05; // 5% (Stripe)
   const venueRevenue = totalAmount - platformFee - processingFee; // 80%
   ```

---

## 🔄 Status Lifecycle

**With Credit System:**
```
PENDING → (Credits Check) → (Credits Deducted) → (n8n Queue) → QUEUED → (Spotify) → PLAYING → PLAYED
   │                                                                                        │
   └────────────────────────────────────────────────────────────────────────────────────────┘
                              (Can be SKIPPED at any point)
```

**Status Transitions:**
- `PENDING`: Request created, credits checked and deducted (if pricing enabled)
- `PAID`: Legacy status (for future real payments) - Currently same as PENDING after credit deduction
- `QUEUED`: Added to Spotify queue, waiting to play
- `PLAYING`: Currently playing on Spotify
- `PLAYED`: Finished playing
- `SKIPPED`: Skipped (manual or auto-moderation) - Credits can be refunded
- `FAILED`: Error occurred (credit deduction failed, queue failed, etc.) - Credits refunded

**Credit Refund Scenarios:**
- Request cancelled before queued → Full refund
- Request failed to queue → Full refund
- Request skipped (if configured) → Partial or full refund

---

## 🎛️ Mode-Specific Logic

### **Queue Mode**
- ✅ Any track from Spotify catalog
- ✅ No playlist restrictions
- ✅ Direct queue after credit deduction
- ✅ Simple flow
- ✅ Rate limiting per client
- ✅ Credit-based payment (mock for testing)

### **Playlist Mode**
- ✅ Only tracks from selected playlist
- ✅ Cooldown checks (prevent duplicates)
- ✅ Playlist sync from Spotify
- ✅ Validation before credit deduction
- ✅ Rate limiting per client
- ✅ Credit-based payment (mock for testing)

### **Automation Mode**
- ✅ Rule-based validation
- ✅ Dynamic pricing (can adjust creditPerSong via rules)
- ✅ Time-based restrictions
- ✅ Genre/explicit filtering
- ✅ Auto-moderation integration
- ✅ Context-aware decisions
- ✅ Rate limiting per client
- ✅ Credit-based payment (mock for testing)

---

## 🧪 Testing Strategy

### **Unit Tests**
- Song request creation/validation
- Credit deduction/calculation
- Rate limiting logic
- Client lookup/creation
- Status transitions
- Mode-specific logic

### **Integration Tests**
- Next.js ↔ n8n webhook communication
- Credit purchase flow end-to-end
- Credit deduction flow
- Queue management
- Playback monitoring
- Webhook signature verification

### **Manual Testing**
- Create request via API (with client identifier)
- Test credit deduction
- Test insufficient credits handling
- Test credit purchase webhook
- Test manual credit addition
- Simulate n8n webhook responses
- Verify queue updates
- Test rate limiting

---

## 🚀 Implementation Phases

### **Phase 1: Credit System + Basic Queue Mode**
1. Database models (VenueClient, CreditTransaction)
2. Venue credit settings (creditPerSong, defaultCredits, etc.)
3. Credit management functions (add, deduct, check balance)
4. Rate limiting implementation
5. Song request API with credit check
6. Credit purchase webhook (n8n → Rockola)
7. Manual credit addition (venue owner)
8. Client management API
9. Basic queue dashboard with client info

### **Phase 2: Playlist Mode**
1. Playlist sync functionality
2. Playlist validation
3. Cooldown checks
4. Playlist management UI
5. Credit system integration

### **Phase 3: Automation Mode**
1. Rule engine (n8n)
2. Rule management API
3. Context management
4. Rule evaluation flow
5. Dynamic credit pricing via rules

### **Phase 4: Advanced Features**
1. Auto-moderation
2. Sentiment analysis
3. Advanced analytics
4. Real-time updates
5. Client analytics dashboard

### **Phase 5: Real Payment Integration** (Future)
1. Stripe integration
2. Hybrid payment (credits OR real payment)
3. Payment gateway webhooks
4. Revenue split calculation

---

## 📝 Key Implementation Notes

1. **n8n Credentials**: Store `n8nCredentialId` in Venue model (already exists)
2. **Token Management**: n8n handles Spotify token refresh
3. **Error Handling**: Both systems need retry logic
4. **Idempotency**: Use request IDs to prevent duplicate processing
5. **Webhook Security**: 
   - Verify API key in `X-API-Key` header
   - Verify crypto signature in `X-Signature` header (HMAC-SHA256)
   - Use shared secret for signature verification
6. **Rate Limiting**: Protect n8n endpoints from abuse
7. **Monitoring**: Log all webhook calls for debugging
8. **Client ID Format**:
   - WhatsApp: Phone number normalized (no +, no spaces) - e.g., "541112121212"
   - Telegram: `{name}_{telegramId}` - e.g., "Pablo_8223311098"
   - IDs are set by n8n and sent to Rockola (we don't generate them)
9. **Credit System**:
   - All settings configurable per venue
   - Default credits given to new clients
   - Max credits limit (optional)
   - Rate limiting per client
10. **Credit Purchase**:
    - Mock payment webpage with manual credit input
    - n8n webhook calls Rockola to add credits
    - Full audit trail via CreditTransaction

---

## 🔐 Webhook Security Implementation

**n8n → Rockola Webhook Security:**

```typescript
// Environment variables
N8N_API_KEY=your-api-key-here
N8N_WEBHOOK_SECRET=your-shared-secret-for-signing

// Webhook verification middleware
import crypto from 'crypto';

function verifyN8nWebhook(
  req: NextApiRequest,
  apiKey: string,
  signature: string
): boolean {
  // 1. Verify API key
  const providedApiKey = req.headers['x-api-key'];
  if (providedApiKey !== apiKey) {
    return false;
  }

  // 2. Verify signature
  const body = JSON.stringify(req.body);
  const secret = process.env.N8N_WEBHOOK_SECRET!;
  const hmac = crypto.createHmac('sha256', secret);
  const calculatedSignature = hmac.update(body).digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculatedSignature)
  );
}

// Usage in webhook handler
export default async function handler(req, res) {
  const apiKey = req.headers['x-api-key'];
  const signature = req.headers['x-signature'];
  
  if (!verifyN8nWebhook(req, process.env.N8N_API_KEY!, signature)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Process webhook...
}
```

---

This architecture separates concerns cleanly:
- **Next.js**: Business logic, data, user management, credit system
- **n8n**: Spotify operations, automation, bot integration, complex workflows

Both systems communicate via well-defined webhooks and API calls with proper security.
