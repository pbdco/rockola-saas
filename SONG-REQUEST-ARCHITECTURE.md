# 🎵 Song Request System Architecture

## 🏗️ System Overview

**Architecture:** Next.js Backend (Business Logic) + n8n (Spotify Operations)

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────┐
│   Next.js API   │◄───────►│  PostgreSQL  │         │   Stripe    │
│  (Business      │         │   Database   │         │  Payments   │
│   Logic)        │         │              │         │             │
└────────┬────────┘         └──────────────┘         └──────┬──────┘
         │                                                  │
         │ Webhooks / API Calls                            │
         │                                                  │
         ▼                                                  ▼
┌─────────────────┐                              ┌──────────────┐
│      n8n        │                              │   Spotify    │
│  (Spotify Ops)  │─────────────────────────────►│     API      │
│                 │                              │              │
└─────────────────┘                              └──────────────┘
```

---

## 📋 Core Responsibilities

### **Next.js Backend (Your App)**
- ✅ Song request CRUD operations
- ✅ Payment session creation
- ✅ Business logic & validation
- ✅ Database management
- ✅ User authentication
- ✅ Venue management
- ✅ API endpoints for UI

### **n8n (Automation Platform)**
- ✅ Spotify API calls (search, queue, playback)
- ✅ Track search & validation
- ✅ Queue management
- ✅ Playback monitoring
- ✅ Rule evaluation (Automation Mode)
- ✅ Sentiment analysis
- ✅ Auto-moderation

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
     "patronIdentifier": "whatsapp:+1234567890"
   }
   ```
   - Create `SongRequest` with status `PENDING`
   - Validate venue is active
   - Check if pricing is enabled

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

3. **Payment Flow** (if pricing enabled)
   ```
   Next.js → Create Stripe Checkout Session
   → Return payment URL to user
   → User pays → Stripe webhook → Next.js
   → Update Payment status → Trigger n8n queue
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
// Create song request
POST /api/venues/[venueId]/song-requests
Body: {
  trackName: string;
  artistName: string;
  patronIdentifier?: string;  // WhatsApp number, etc.
}

// List song requests
GET /api/venues/[venueId]/song-requests
Query: {
  status?: 'PENDING' | 'PAID' | 'QUEUED' | 'PLAYING' | 'PLAYED';
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

// Cancel request
DELETE /api/venues/[venueId]/song-requests/[requestId]
```

### **Payment Endpoints**

```typescript
// Create payment session
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

```typescript
// Track search result
POST /api/webhooks/n8n/track-found
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
Body: {
  requestId: string;
  queuePosition: number;
  status: 'QUEUED' | 'PLAYING';
}

// Playback status update
POST /api/webhooks/n8n/playback-updated
Body: {
  requestId: string;
  status: 'PLAYING' | 'PLAYED' | 'SKIPPED';
  playedAt?: Date;
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

### **SongRequest** (Already exists, may need enhancements)

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

## 💰 Payment Integration

### **Payment Flow**

1. **Create Payment Session** (Next.js)
   ```typescript
   // When song request is created and pricing is enabled
   const session = await stripe.checkout.sessions.create({
     payment_method_types: ['card'],
     line_items: [{
       price_data: {
         currency: venue.currency || 'USD',
         product_data: {
           name: `${trackName} - ${artistName}`,
           description: `Song request for ${venue.name}`,
         },
         unit_amount: Math.round(venue.pricePerSong * 100), // Convert to cents
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

```
PENDING → (Payment) → PAID → (n8n Queue) → QUEUED → (Spotify) → PLAYING → PLAYED
   │                                                                    │
   └────────────────────────────────────────────────────────────────────┘
                              (Can be SKIPPED at any point)
```

**Status Transitions:**
- `PENDING`: Request created, waiting for payment (if pricing enabled)
- `PAID`: Payment confirmed, ready to queue
- `QUEUED`: Added to Spotify queue, waiting to play
- `PLAYING`: Currently playing on Spotify
- `PLAYED`: Finished playing
- `SKIPPED`: Skipped (manual or auto-moderation)
- `FAILED`: Error occurred (payment failed, queue failed, etc.)

---

## 🎛️ Mode-Specific Logic

### **Queue Mode**
- ✅ Any track from Spotify catalog
- ✅ No playlist restrictions
- ✅ Direct queue after payment
- ✅ Simple flow

### **Playlist Mode**
- ✅ Only tracks from selected playlist
- ✅ Cooldown checks (prevent duplicates)
- ✅ Playlist sync from Spotify
- ✅ Validation before payment

### **Automation Mode**
- ✅ Rule-based validation
- ✅ Dynamic pricing
- ✅ Time-based restrictions
- ✅ Genre/explicit filtering
- ✅ Auto-moderation integration
- ✅ Context-aware decisions

---

## 🧪 Testing Strategy

### **Unit Tests**
- Song request creation/validation
- Payment calculation
- Status transitions
- Mode-specific logic

### **Integration Tests**
- Next.js ↔ n8n webhook communication
- Payment flow end-to-end
- Queue management
- Playback monitoring

### **Manual Testing**
- Create request via API
- Simulate n8n webhook responses
- Test payment flow
- Verify queue updates

---

## 🚀 Implementation Phases

### **Phase 1: Basic Queue Mode**
1. Song request API endpoints
2. Basic n8n webhook integration (search + queue)
3. Payment integration
4. Simple queue dashboard

### **Phase 2: Playlist Mode**
1. Playlist sync functionality
2. Playlist validation
3. Cooldown checks
4. Playlist management UI

### **Phase 3: Automation Mode**
1. Rule engine (n8n)
2. Rule management API
3. Context management
4. Rule evaluation flow

### **Phase 4: Advanced Features**
1. Auto-moderation
2. Sentiment analysis
3. Advanced analytics
4. Real-time updates

---

## 📝 Key Implementation Notes

1. **n8n Credentials**: Store `n8nCredentialId` in Venue model (already exists)
2. **Token Management**: n8n handles Spotify token refresh
3. **Error Handling**: Both systems need retry logic
4. **Idempotency**: Use request IDs to prevent duplicate processing
5. **Webhook Security**: Verify webhook signatures
6. **Rate Limiting**: Protect n8n endpoints from abuse
7. **Monitoring**: Log all webhook calls for debugging

---

This architecture separates concerns cleanly:
- **Next.js**: Business logic, data, user management
- **n8n**: Spotify operations, automation, complex workflows

Both systems communicate via well-defined webhooks and API calls.
