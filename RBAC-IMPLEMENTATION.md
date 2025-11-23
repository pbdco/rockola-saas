# 🔐 Role-Based Access Control (RBAC) Implementation

## Overview

Rockola uses a comprehensive RBAC system to control access to resources and actions across the platform. This document outlines the current implementation, permissions structure, and best practices.

## Roles

| Role | Description | Permissions Level |
|------|-------------|-------------------|
| **OWNER** | Team creator, full control | All permissions (`*` on all resources) |
| **ADMIN** | Administrative access | Full permissions (same as OWNER) |
| **MEMBER** | Basic team member | Limited read-only access |

## Resources & Permissions

### Current Resources

```typescript
type Resource =
  | 'team'
  | 'team_member'
  | 'team_invitation'
  | 'team_sso'
  | 'team_dsync'
  | 'team_audit_log'
  | 'team_webhook'
  | 'team_payments'
  | 'team_api_key'
  | 'team_venue';
```

### Actions

```typescript
type Action = 'create' | 'update' | 'read' | 'delete' | 'leave';
```

## Permission Matrix

### OWNER & ADMIN
- **Full access** to all resources (`*` actions)
- Can create, read, update, delete all team resources
- Can manage members, invitations, SSO, API keys, venues, etc.

### MEMBER
- **Team**: `read`, `leave`
- **Venues**: `read` only
- Cannot create, update, or delete venues
- Cannot manage API keys, members, or settings

## Implementation

### Backend Enforcement

All API endpoints enforce permissions using `throwIfNotAllowed`:

```typescript
// Example: Venue creation
const teamMember = await throwIfNoTeamAccess(req, res);
throwIfNotAllowed(teamMember, 'team_venue', 'create');
```

**Location**: `models/user.ts`

### Frontend Enforcement

UI components use `AccessControl` to hide/show elements:

```tsx
<AccessControl resource="team_venue" actions={['create']}>
  <Button onClick={handleCreate}>Create Venue</Button>
</AccessControl>
```

**Location**: `components/shared/AccessControl.tsx`

### Hook for Permission Checks

```tsx
const { canAccess } = useCanAccess();
if (canAccess('team_venue', ['create'])) {
  // Show create button
}
```

**Location**: `hooks/useCanAccess.ts`

## Current RBAC Coverage

### ✅ Fully Protected

- **API Keys**: Create, read, delete (admin-only)
- **Venues**: Create, read, update, delete (admin-only)
- **Team Members**: All operations (admin-only)
- **Team Settings**: All operations (admin-only)
- **SSO**: All operations (admin-only)
- **Webhooks**: All operations (admin-only)
- **Payments**: All operations (admin-only)

### ⚠️ Needs Review

- **Song Requests**: Not yet implemented (will need permissions)
- **Venue Rules**: Not yet implemented (will need permissions)
- **Reactions**: Not yet implemented (will need permissions)

## Best Practices

### 1. Always Enforce on Backend

```typescript
// ✅ Good: Backend always checks
throwIfNotAllowed(teamMember, 'team_venue', 'create');

// ❌ Bad: Only checking in frontend
if (canAccess('team_venue', ['create'])) {
  // Frontend-only check - can be bypassed!
}
```

### 2. Use AccessControl in UI

```tsx
// ✅ Good: Hide UI elements based on permissions
<AccessControl resource="team_venue" actions={['create']}>
  <Button>Create Venue</Button>
</AccessControl>

// ❌ Bad: Always showing buttons
<Button>Create Venue</Button> // Shows to everyone!
```

### 3. Consistent Permission Checks

```typescript
// ✅ Good: Consistent resource/action naming
throwIfNotAllowed(user, 'team_venue', 'create');
throwIfNotAllowed(user, 'team_venue', 'update');
throwIfNotAllowed(user, 'team_venue', 'delete');

// ❌ Bad: Inconsistent naming
throwIfNotAllowed(user, 'venue', 'create'); // Wrong resource name
```

## Adding New Resources

### Step 1: Add to Permissions Type

```typescript
// lib/permissions.ts
export type Resource =
  | 'team'
  | 'team_venue'
  | 'team_song_request'; // ← Add new resource
```

### Step 2: Define Permissions

```typescript
// lib/permissions.ts
export const permissions: RolePermissions = {
  OWNER: [
    // ... existing
    {
      resource: 'team_song_request',
      actions: '*', // Full access
    },
  ],
  ADMIN: [
    // ... existing
    {
      resource: 'team_song_request',
      actions: '*', // Full access
    },
  ],
  MEMBER: [
    // ... existing
    {
      resource: 'team_song_request',
      actions: ['create', 'read'], // Can create and view own requests
    },
  ],
};
```

### Step 3: Enforce in API Endpoints

```typescript
// pages/api/teams/[slug]/song-requests/index.ts
const teamMember = await throwIfNoTeamAccess(req, res);
throwIfNotAllowed(teamMember, 'team_song_request', 'create');
```

### Step 4: Protect UI Components

```tsx
// components/song-requests/CreateRequest.tsx
<AccessControl resource="team_song_request" actions={['create']}>
  <Button>Request Song</Button>
</AccessControl>
```

## Testing RBAC

### Manual Testing Checklist

- [ ] MEMBER cannot create venues
- [ ] MEMBER cannot edit venues
- [ ] MEMBER cannot delete venues
- [ ] MEMBER cannot connect Spotify
- [ ] MEMBER cannot create API keys
- [ ] ADMIN can perform all venue operations
- [ ] OWNER can perform all operations
- [ ] UI buttons are hidden for unauthorized users
- [ ] API endpoints return 403 for unauthorized requests

### Automated Testing

```typescript
// Example test
it('should prevent MEMBER from creating venues', async () => {
  const member = await createTeamMember(teamId, userId, Role.MEMBER);
  const response = await createVenue(member, venueData);
  expect(response.status).toBe(403);
});
```

## Security Considerations

1. **Defense in Depth**: Always enforce on both frontend and backend
2. **API Key Access**: API keys provide admin-level access (by design)
3. **Session Validation**: All requests validate team membership
4. **Resource Isolation**: Users can only access their team's resources

## Future Enhancements

- [ ] Granular permissions (e.g., `venue_spotify_connect` separate from `venue_update`)
- [ ] Custom roles per team
- [ ] Permission inheritance
- [ ] Audit logging for permission checks
- [ ] Role-based UI navigation (hide entire sections)

## Related Files

- `lib/permissions.ts` - Permission definitions
- `models/user.ts` - Permission checking logic
- `components/shared/AccessControl.tsx` - UI permission component
- `hooks/useCanAccess.ts` - Permission hook
- `pages/api/teams/[slug]/permissions.ts` - Permissions API endpoint


