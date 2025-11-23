# 🎯 Tier-Based Subscription Implementation Plan

## 📋 Overview

This document outlines a comprehensive plan for implementing a tier-based subscription system for the venue management platform. Based on the existing Stripe infrastructure and business model, here's a recommended approach.

---

## 🏗️ Architecture Recommendation

### **User-Based Subscriptions** (Recommended)

**Why:**
- ✅ Simpler billing model (one subscription per user)
- ✅ Users can manage multiple venues under one plan
- ✅ Easier to implement and maintain
- ✅ Better for scaling (users can upgrade as they grow)
- ✅ Aligns with current user-centric architecture

**Alternative:** Venue-based subscriptions (more complex, but allows per-venue pricing)

---

## 📊 Recommended Subscription Tiers

Based on your PROJECT-SCOPE.md, here's an enhanced tier structure:

### **Free Tier** (Trial/Starter)
- **Price:** $0/month
- **Limits:**
  - 1 venue
  - Queue Mode only
  - Basic analytics
  - 50 song requests/month
  - No automation features
  - No custom branding

### **Basic Plan** ($29/month)
- **Price:** $29/month
- **Features:**
  - Up to 3 venues
  - Queue Mode & Playlist Mode
  - Basic analytics
  - Unlimited song requests
  - Spotify integration
  - Email support
  - No automation features

### **Pro Plan** ($79/month)
- **Price:** $79/month
- **Features:**
  - Unlimited venues
  - All modes (Queue, Playlist, **Automation**)
  - Advanced analytics (sentiment, energy graphs)
  - Auto-moderation based on feedback
  - Time-based rule engine
  - Priority support
  - Custom branding options
  - API access

### **Enterprise Plan** (Custom pricing)
- **Price:** Custom
- **Features:**
  - Everything in Pro
  - Dedicated support
  - Custom integrations
  - SLA guarantees
  - On-premise deployment option

---

## 🗄️ Database Schema Changes

### 1. Enhance User Model

```prisma
model User {
  // ... existing fields ...
  
  // Subscription fields
  subscriptionId      String?
  subscriptionTier    SubscriptionTier  @default(FREE)
  subscriptionStatus  SubscriptionStatus @default(INACTIVE)
  stripeCustomerId    String?           @unique
  subscriptionEndsAt  DateTime?
  trialEndsAt         DateTime?
  
  subscription Subscription? @relation(fields: [subscriptionId], references: [id])
  
  @@index([subscriptionTier])
  @@index([subscriptionStatus])
}
```

### 2. Enhance Subscription Model

```prisma
enum SubscriptionTier {
  FREE
  BASIC
  PRO
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  INACTIVE
  TRIAL
  CANCELLED
  PAST_DUE
  UNPAID
}

model Subscription {
  id              String             @id
  userId          String             @unique
  tier            SubscriptionTier   @default(FREE)
  status          SubscriptionStatus @default(INACTIVE)
  customerId      String
  priceId         String
  active          Boolean            @default(false)
  startDate       DateTime
  endDate         DateTime
  cancelAt        DateTime?
  cancelAtPeriodEnd Boolean          @default(false)
  trialStart      DateTime?
  trialEnd        DateTime?
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([status])
  @@index([tier])
}
```

### 3. Create Subscription Limits Model

```prisma
model SubscriptionLimit {
  id              String   @id @default(uuid())
  tier            SubscriptionTier
  maxVenues       Int
  maxSongRequests Int?     // null = unlimited
  allowedModes    VenueMode[]
  features        String[] // ["automation", "advanced_analytics", "api_access"]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([tier])
}
```

---

## 🔐 Feature Gating Implementation

### 1. Create Subscription Service

```typescript
// lib/subscription.ts

export enum SubscriptionTier {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TRIAL = 'TRIAL',
  CANCELLED = 'CANCELLED',
  PAST_DUE = 'PAST_DUE',
  UNPAID = 'UNPAID',
}

export interface SubscriptionLimits {
  maxVenues: number;
  maxSongRequests: number | null; // null = unlimited
  allowedModes: VenueMode[];
  features: string[];
}

// Tier limits configuration
export const TIER_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  [SubscriptionTier.FREE]: {
    maxVenues: 1,
    maxSongRequests: 50,
    allowedModes: ['QUEUE'],
    features: [],
  },
  [SubscriptionTier.BASIC]: {
    maxVenues: 3,
    maxSongRequests: null, // unlimited
    allowedModes: ['QUEUE', 'PLAYLIST'],
    features: ['spotify_integration', 'basic_analytics'],
  },
  [SubscriptionTier.PRO]: {
    maxVenues: -1, // unlimited
    maxSongRequests: null,
    allowedModes: ['QUEUE', 'PLAYLIST', 'AUTOMATION'],
    features: [
      'spotify_integration',
      'basic_analytics',
      'advanced_analytics',
      'automation',
      'auto_moderation',
      'api_access',
    ],
  },
  [SubscriptionTier.ENTERPRISE]: {
    maxVenues: -1,
    maxSongRequests: null,
    allowedModes: ['QUEUE', 'PLAYLIST', 'AUTOMATION'],
    features: [
      'spotify_integration',
      'basic_analytics',
      'advanced_analytics',
      'automation',
      'auto_moderation',
      'api_access',
      'custom_branding',
      'dedicated_support',
      'sla',
    ],
  },
};

export const canAccessFeature = (
  user: User,
  feature: string
): boolean => {
  if (!user.subscription) return false;
  
  const limits = TIER_LIMITS[user.subscriptionTier];
  return limits.features.includes(feature);
};

export const canCreateVenue = async (user: User): Promise<boolean> => {
  const limits = TIER_LIMITS[user.subscriptionTier];
  
  if (limits.maxVenues === -1) return true; // unlimited
  
  const venueCount = await prisma.venue.count({
    where: { userId: user.id },
  });
  
  return venueCount < limits.maxVenues;
};

export const canUseMode = (
  user: User,
  mode: VenueMode
): boolean => {
  const limits = TIER_LIMITS[user.subscriptionTier];
  return limits.allowedModes.includes(mode);
};
```

### 2. Middleware/Guard Functions

```typescript
// lib/guards/subscription.ts

import { ApiError } from '@/lib/errors';
import { canAccessFeature, canCreateVenue, canUseMode } from '@/lib/subscription';
import { User } from '@prisma/client';

export const requireFeature = (feature: string) => {
  return async (user: User) => {
    if (!canAccessFeature(user, feature)) {
      throw new ApiError(
        403,
        `This feature requires a ${user.subscriptionTier === 'FREE' ? 'paid' : 'higher'} subscription plan.`
      );
    }
  };
};

export const requireSubscription = async (user: User) => {
  if (!user.subscription || user.subscriptionStatus !== 'ACTIVE') {
    throw new ApiError(403, 'An active subscription is required.');
  }
};

export const checkVenueLimit = async (user: User) => {
  const canCreate = await canCreateVenue(user);
  if (!canCreate) {
    const limits = TIER_LIMITS[user.subscriptionTier];
    throw new ApiError(
      403,
      `You've reached the venue limit for your plan (${limits.maxVenues} venue${limits.maxVenues > 1 ? 's' : ''}). Upgrade to create more venues.`
    );
  }
};

export const checkModeAccess = (user: User, mode: VenueMode) => {
  if (!canUseMode(user, mode)) {
    throw new ApiError(
      403,
      `${mode} mode requires a ${user.subscriptionTier === 'FREE' ? 'paid' : 'Pro'} subscription.`
    );
  }
};
```

### 3. Update Venue Creation

```typescript
// pages/api/venues/index.ts

import { checkVenueLimit, checkModeAccess } from '@/lib/guards/subscription';

// In POST handler:
await checkVenueLimit(user);
checkModeAccess(user, payload.mode);
```

---

## 💳 Stripe Integration

### 1. Create Checkout Session

```typescript
// pages/api/subscriptions/checkout.ts

import Stripe from 'stripe';
import { requireAuth } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req, res) {
  const user = await requireAuth(req, res);
  
  const { tier, priceId } = req.body;
  
  // Create or retrieve Stripe customer
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    // Update user with customerId
  }
  
  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXTAUTH_URL}/settings/billing?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/settings/billing?canceled=true`,
    metadata: {
      userId: user.id,
      tier,
    },
  });
  
  res.json({ sessionId: session.id, url: session.url });
}
```

### 2. Webhook Handler

```typescript
// pages/api/webhooks/stripe.ts

import Stripe from 'stripe';
import { updateUserSubscription } from '@/models/subscription';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req, res) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      // Activate subscription
      break;
      
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription;
      await updateUserSubscription(subscription);
      break;
      
    case 'invoice.payment_failed':
      // Handle failed payment
      break;
  }
  
  res.json({ received: true });
}
```

---

## 🎨 UI/UX Components

### 1. Pricing Page

```typescript
// pages/pricing.tsx

- Display all tiers with features
- "Upgrade" buttons for each tier
- Show current plan highlight
- Feature comparison table
```

### 2. Billing Settings Page

```typescript
// pages/settings/billing.tsx

- Current plan display
- Usage metrics (venues, requests)
- Upgrade/downgrade options
- Payment method management
- Billing history
- Cancel subscription option
```

### 3. Upgrade Prompts

```typescript
// components/subscription/UpgradePrompt.tsx

- Show when user hits limits
- Contextual (e.g., "Upgrade to create more venues")
- Link to pricing page
```

---

## 📈 Migration Strategy

### Phase 1: Database Migration
1. Add subscription fields to User model
2. Enhance Subscription model
3. Create SubscriptionLimit model
4. Seed default limits

### Phase 2: Backend Implementation
1. Create subscription service/utilities
2. Add guards/middleware
3. Update API endpoints with checks
4. Implement Stripe integration

### Phase 3: Frontend Implementation
1. Create pricing page
2. Build billing settings page
3. Add upgrade prompts
4. Update venue creation/edit flows

### Phase 4: Testing & Rollout
1. Test all tiers
2. Test Stripe webhooks
3. Test feature gating
4. Gradual rollout (start with new users)

---

## 🎯 Best Practices

### 1. **Graceful Degradation**
- Don't break existing functionality
- Show clear upgrade prompts
- Allow viewing but not editing restricted features

### 2. **Trial Period**
- Offer 14-day free trial for paid plans
- Auto-convert to paid or downgrade to free
- Send reminder emails

### 3. **Usage Tracking**
- Track venue count, song requests, etc.
- Show usage in billing dashboard
- Warn when approaching limits

### 4. **Customer Communication**
- Email on subscription changes
- Payment failure notifications
- Upgrade/downgrade confirmations

### 5. **Analytics**
- Track conversion rates
- Monitor churn
- A/B test pricing

---

## 🔄 Alternative: Venue-Based Subscriptions

If you prefer venue-based subscriptions:

**Pros:**
- More granular control
- Venues can have different plans
- Better for multi-venue businesses

**Cons:**
- More complex billing
- Harder to manage
- More database complexity

**Implementation:**
- Add `subscriptionTier` to Venue model
- Each venue has its own subscription
- More complex upgrade flows

---

## 📝 Recommended Next Steps

1. **Start with User-Based Subscriptions** (simpler)
2. **Implement 3 tiers:** Free, Basic ($29), Pro ($79)
3. **Use existing Stripe infrastructure**
4. **Add feature gating gradually**
5. **Monitor usage and adjust limits**

---

## 🚀 Quick Start Checklist

- [ ] Update Prisma schema with subscription fields
- [ ] Create subscription service/utilities
- [ ] Add guards to venue creation/editing
- [ ] Create Stripe checkout endpoint
- [ ] Set up webhook handler
- [ ] Build pricing page
- [ ] Build billing settings page
- [ ] Add upgrade prompts
- [ ] Test all tiers
- [ ] Deploy and monitor

---

This plan provides a solid foundation for implementing tier-based subscriptions while maintaining flexibility for future changes.
