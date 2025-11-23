# Venue Slug Conflict Resolution

## Implementation

Automatic slug conflict resolution has been implemented to prevent errors when multiple users create venues with the same name.

## How It Works

### Automatic Suffix Appending

When creating or updating a venue, if the generated slug already exists, the system automatically appends a numeric suffix:

- First venue: `"the-groove-bar"` → slug: `the-groove-bar`
- Second venue: `"the-groove-bar"` → slug: `the-groove-bar-2`
- Third venue: `"the-groove-bar"` → slug: `the-groove-bar-3`
- And so on...

### Implementation Details

**Location:** `models/venue.ts`

**Function:** `generateUniqueSlug(baseSlug, excludeVenueId?)`
- Checks if slug exists in database
- If exists, appends `-2`, `-3`, etc. until finding an available slug
- For updates, excludes the current venue ID from the check (so you can keep your own slug)

**Used in:**
- `createVenue()` - When creating new venues
- `updateVenue()` - When updating venue name or slug

### Examples

**Creating Venues:**
```typescript
// User A creates "The Groove Bar"
createVenue(userA, { name: "The Groove Bar" })
// Result: slug = "the-groove-bar"

// User B creates "The Groove Bar"  
createVenue(userB, { name: "The Groove Bar" })
// Result: slug = "the-groove-bar-2" (automatically resolved)

// User C creates "The Groove Bar"
createVenue(userC, { name: "The Groove Bar" })
// Result: slug = "the-groove-bar-3" (automatically resolved)
```

**Updating Venues:**
```typescript
// Venue currently has slug "my-venue"
// User changes name to "The Groove Bar" (which already exists as "the-groove-bar")
updateVenue(venueId, userId, { name: "The Groove Bar" })
// Result: slug = "the-groove-bar-2" (if "the-groove-bar" exists, otherwise "the-groove-bar")
```

## Benefits

✅ **No more 409 errors** - Users never see "slug already taken" errors
✅ **Seamless UX** - Venues are created successfully even with duplicate names
✅ **Automatic** - No manual intervention needed
✅ **Backward compatible** - Existing venues continue to work
✅ **Works for updates** - Handles name changes that would cause conflicts

## Technical Notes

- Slugs remain **globally unique** (across all users)
- The algorithm is efficient - checks database once per iteration
- Maximum iterations are practically unlimited (but realistically will be very low)
- Works for both regular user venue creation and admin venue creation
- Handles edge cases like updating a venue to a name that conflicts

## Testing

To test the implementation:

1. Create a venue with name "Test Venue"
2. Create another venue with the same name "Test Venue"
3. The second venue should automatically get slug "test-venue-2"
4. Create a third venue with the same name
5. The third venue should get slug "test-venue-3"

All venues will be created successfully without any errors!
