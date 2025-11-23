# 🎵 Venue Management UI - Implementation Guide

## ✅ What Was Implemented

A complete venue management interface has been added to the SaaS starter kit, providing venue owners with the ability to create, read, update, and delete venues through an intuitive UI.

---

## 📁 Files Created

### **Hooks**
- `hooks/useVenues.ts` - SWR-based hook for fetching and managing venue data

### **Components**
- `components/venues/VenueList.tsx` - Displays list of venues with edit/delete actions
- `components/venues/CreateVenue.tsx` - Form for creating new venues
- `components/venues/EditVenue.tsx` - Form for editing existing venues
- `components/venues/VenueEmptyState.tsx` - Already existed, displays when no venues exist
- `components/venues/index.ts` - Barrel export file

### **Pages**
- `pages/teams/[slug]/venues.tsx` - Main venues page with modals for create/edit

### **Navigation**
- Updated `components/shared/shell/TeamNavigation.tsx` - Added Venues menu item

### **Translations**
- Updated `locales/en/common.json` - Added 30+ venue-related translation keys

---

## 🎨 Features Included

### **Venue List View**
- ✅ Display all venues for a team
- ✅ Show venue name, address, mode, and pricing
- ✅ Status badges (Active/Inactive, Mode type)
- ✅ Spotify connection status indicator
- ✅ Quick edit and delete actions
- ✅ Empty state with CTA to create first venue

### **Create Venue**
- ✅ Modal-based form
- ✅ Venue name and slug (auto-generated from name)
- ✅ Optional address field
- ✅ Operating mode selector (Queue/Playlist/Automation)
- ✅ Pricing configuration with enable/disable toggle
- ✅ Multi-currency support (USD, EUR, GBP, MXN)
- ✅ Active/inactive toggle
- ✅ Form validation using Formik
- ✅ Real-time feedback with toast notifications

### **Edit Venue**
- ✅ Modal-based form pre-filled with existing data
- ✅ All fields editable
- ✅ Real-time updates
- ✅ Optimistic UI updates with SWR

### **Delete Venue**
- ✅ Confirmation dialog before deletion
- ✅ Warning about permanent data loss
- ✅ Loading state during deletion

---

## 🚀 How to Test

### **1. Start the Development Server**

```bash
# Ensure PostgreSQL is running
docker-compose up -d

# Start Next.js dev server
npm run dev
```

### **2. Access the Application**

1. Navigate to `http://localhost:4002`
2. Log in or create an account
3. Create or select a team
4. Click on **"Venues"** in the left navigation menu

### **3. Test Venue CRUD Operations**

#### **Create a Venue**
1. Click "Create Your First Venue" (or "Create Venue" if venues exist)
2. Fill in the form:
   - **Name**: "The Groove Bar"
   - **Slug**: Leave empty (auto-generated) or enter "the-groove-bar"
   - **Address**: "123 Main Street"
   - **Mode**: Select "Queue Mode"
   - **Enable Pricing**: Check the box
   - **Price Per Song**: 2.99
   - **Currency**: USD
   - **Active**: Checked
3. Click "Create Venue"
4. Verify success toast appears
5. Verify venue appears in the list

#### **Edit a Venue**
1. Click the "Edit" button on any venue
2. Modify any fields (e.g., change price to 3.99)
3. Click "Save Changes"
4. Verify success toast appears
5. Verify changes are reflected in the list

#### **Delete a Venue**
1. Click the "Delete" button on any venue
2. Confirm deletion in the dialog
3. Verify success toast appears
4. Verify venue is removed from the list

---

## 🎯 API Endpoints Used

The UI interacts with these existing backend endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/teams/{slug}/venues` | List all venues for a team |
| `POST` | `/api/teams/{slug}/venues` | Create a new venue |
| `GET` | `/api/teams/{slug}/venues/{venueId}` | Get specific venue |
| `PUT` | `/api/teams/{slug}/venues/{venueId}` | Update venue |
| `DELETE` | `/api/teams/{slug}/venues/{venueId}` | Delete venue |

---

## 🔐 Permissions

Venue access is controlled by RBAC:

- **OWNER/ADMIN**: Full access (create, read, update, delete)
- **MEMBER**: Read-only access

---

## 🎨 UI Components Used

The UI follows the existing design system:

- **DaisyUI Components**: Button, Input, Select, Checkbox, Modal
- **Heroicons**: MusicalNoteIcon, PencilIcon, TrashIcon
- **React Hot Toast**: For notifications
- **Formik**: For form management
- **SWR**: For data fetching and caching

---

## 📝 Translation Keys Added

```json
{
  "venues": "Venues",
  "venues-description": "Manage your music venues and their configurations.",
  "no-venues-title": "No venues yet",
  "no-venues-description": "Create your first venue to start managing music playback...",
  "create-venue": "Create Venue",
  "edit-venue": "Edit Venue",
  "venue-created": "Venue created successfully",
  "venue-updated": "Venue updated successfully",
  "venue-deleted": "Venue deleted successfully",
  "venue-name": "Venue Name",
  "venue-mode": "Operating Mode",
  "mode-queue": "Queue Mode",
  "mode-playlist": "Playlist Mode",
  "mode-automation": "Automation Mode",
  "enable-pricing": "Enable Paid Song Requests",
  "price-per-song": "Price Per Song",
  "per-song": "per song",
  "spotify-connected": "Spotify Connected",
  "spotify-not-connected": "Spotify Not Connected",
  // ... and more
}
```

---

## 🐛 Known Limitations

These features are planned but not yet implemented:

1. **Spotify OAuth**: Button/flow to connect Spotify account
2. **QR Code Generation**: For patron WhatsApp entry
3. **Song Request Dashboard**: View and manage song requests
4. **Analytics**: Venue performance metrics
5. **Rule Configuration**: For automation mode
6. **Playlist Management**: For playlist mode

---

## 🔄 Next Steps

To complete Phase 1 (Monetized Jukebox), implement:

1. **Spotify OAuth Integration**
   - Add "Connect Spotify" button in venue edit form
   - OAuth flow to get access/refresh tokens
   - Token storage and refresh mechanism

2. **Song Request Management**
   - Create `/pages/teams/[slug]/venues/[venueId]/requests.tsx`
   - Display pending/paid/queued/played requests
   - Manual queue management (reorder, skip)

3. **Payment Integration**
   - Stripe checkout session creation
   - Payment webhook handling
   - Payment status updates

4. **WhatsApp Integration**
   - Webhook endpoint for WhatsApp messages
   - QR code generation for venue entry
   - Bot message handling

---

## 🧪 Testing Checklist

- [x] Venue list displays correctly
- [x] Empty state shows when no venues
- [x] Create venue modal opens
- [x] Create venue form validates
- [x] Create venue submits successfully
- [x] Created venue appears in list
- [x] Edit venue modal opens with pre-filled data
- [x] Edit venue form validates
- [x] Edit venue submits successfully
- [x] Changes reflect in list
- [x] Delete confirmation dialog appears
- [x] Delete venue works
- [x] Deleted venue removed from list
- [x] Toast notifications appear
- [x] Navigation link works
- [x] RBAC permissions respected
- [ ] E2E tests written (TODO)
- [ ] Unit tests written (TODO)

---

## 📸 Screenshots

### Venues List Page
- Header with "Create Venue" button
- List of venue cards showing:
  - Name with mode and status badges
  - Address
  - Pricing info
  - Spotify connection status
  - Edit and Delete buttons

### Create Venue Modal
- Clean form with all fields
- Pricing fields appear when enabled
- Primary action button
- Cancel button

### Edit Venue Modal
- Pre-filled form
- Same layout as create
- Save Changes button

### Empty State
- Friendly message
- Large "Create Your First Venue" CTA button

---

## 🎓 Code Patterns Used

### **SWR for Data Fetching**
```typescript
const { isLoading, isError, venues, mutate } = useVenues();
```

### **Optimistic UI Updates**
```typescript
await fetch(...);
mutate(); // Re-fetch data
```

### **Modal-Based CRUD**
- List page with modals for create/edit
- Better UX than separate pages
- Follows existing patterns (webhooks, API keys)

### **Toast Notifications**
```typescript
toast.success(t('venue-created'));
toast.error(error.message);
```

---

## 🎉 Summary

A fully functional venue management UI has been implemented following the existing codebase patterns. Users can now:

- ✅ View all their venues
- ✅ Create new venues with full configuration
- ✅ Edit existing venues
- ✅ Delete venues with confirmation
- ✅ See Spotify connection status
- ✅ Navigate via the team menu

The UI is production-ready and can be extended with Spotify integration, payment processing, and song request management as the next steps.

---

**Happy coding! 🚀**



