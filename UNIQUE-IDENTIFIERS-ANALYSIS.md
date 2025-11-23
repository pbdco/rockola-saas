# Unique Identifiers Analysis

## Venues

### Primary Identifier
- **Field:** `id` (UUID)
- **Type:** Primary key, auto-generated
- **Usage:** Internal database identifier, used in API routes like `/api/venues/[venueId]`

### Unique Identifier
- **Field:** `slug` (String)
- **Database Constraint:** `@unique` - **Globally unique across ALL users**
- **Validation:** ✅ Yes, checked via Prisma unique constraint

### Slug Uniqueness Handling

**Database Level:**
```prisma
model Venue {
  slug String @unique  // Globally unique constraint
}
```

**Application Level:**
- ✅ Catches `P2002` Prisma errors (unique constraint violation)
- ✅ Returns `409 Conflict` with message: "This venue slug is already taken."
- ✅ Implemented in:
  - `/api/venues/index.ts` (create)
  - `/api/venues/[venueId].ts` (update)
  - `/api/admin/users/[userId]/venues.ts` (admin create)
  - `/api/admin/users/[userId]/venues/[venueId].ts` (admin update)

**Current Behavior:**
- Slug is **globally unique** - if User A creates "my-venue", User B cannot create "my-venue"
- This is likely intentional for URL routing (e.g., `/venues/my-venue`)
- Auto-generation: If slug conflicts occur, the error is caught and returned to the user

**Potential Issue:**
- If two users try to create venues with the same name (e.g., "The Groove Bar"), the auto-generated slug will conflict
- Currently, the second user will get a 409 error and must manually specify a different slug

---

## Users

### Primary Identifier
- **Field:** `id` (UUID)
- **Type:** Primary key, auto-generated
- **Usage:** Internal database identifier, used in API routes like `/api/admin/users/[userId]`

### Unique Identifier
- **Field:** `email` (String)
- **Database Constraint:** `@unique` - **Globally unique**
- **Validation:** ✅ Yes, checked before create/update

### Email Uniqueness Handling

**Database Level:**
```prisma
model User {
  email String @unique  // Globally unique constraint
}
```

**Application Level:**
- ✅ Explicitly checked before creating users
- ✅ Explicitly checked before updating email
- ✅ Returns `400 Bad Request` with message: "User with this email already exists" or "Email already in use"
- ✅ Implemented in:
  - `/api/auth/join.ts` (user signup) - line 61
  - `/api/admin/users.ts` (admin create user) - line 88
  - `/api/admin/users/[userId].ts` (admin update user) - line 87

**Current Behavior:**
- Email is **globally unique** - no two users can have the same email
- This is standard and expected behavior
- Validation happens before database insert, providing better error messages

---

## Summary

| Entity | Primary ID | Unique Field | Uniqueness Scope | Validation | Conflict Handling |
|--------|-----------|--------------|------------------|------------|-------------------|
| **Venue** | `id` (UUID) | `slug` (String) | **Global** (all users) | ✅ Database + App | 409 Conflict error |
| **User** | `id` (UUID) | `email` (String) | **Global** | ✅ Database + App | 400 Bad Request error |

---

## Recommendations

### Venue Slug Uniqueness

**Current:** Global uniqueness (all users share the same slug namespace)

**Considerations:**
1. **If slugs are used in public URLs** (e.g., `/venues/my-venue`), global uniqueness makes sense
2. **If slugs are only for internal use**, consider making them unique per-user:
   ```prisma
   @@unique([userId, slug])  // Unique per user
   ```

**Current Implementation:**
- ✅ Properly validates uniqueness
- ✅ Returns clear error messages
- ⚠️ Potential UX issue: Users might get conflicts when auto-generating slugs from common names

**Potential Improvement:**
- Add automatic suffix when slug conflicts (e.g., "my-venue-2", "my-venue-3")
- Or make slugs unique per-user if they're not used in public URLs

### User Email Uniqueness

**Current:** Global uniqueness (standard behavior)

**Status:** ✅ Perfect - no changes needed
- Properly validated
- Clear error messages
- Standard behavior for authentication systems
