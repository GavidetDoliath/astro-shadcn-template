# Phase 6: Admin User Management

## Overview

Phase 6 implements a complete admin interface for managing user accounts. Admins can create, edit, and delete users; assign roles; and manage subscriptions.

## Features

✓ List all users with filtering and sorting
✓ Create new users with roles
✓ Edit user roles and display names
✓ Delete users
✓ View user subscription status
✓ Admin-only access control
✓ Responsive table UI with actions

## Files Created/Modified

### API Routes
- `src/pages/api/admin/users.ts` — GET all users, POST create user (NEW)
- `src/pages/api/admin/users/[id].ts` — GET, PUT, DELETE user (NEW)

### Components
- `src/components/admin/UsersList.tsx` — Users table with actions (NEW)
- `src/components/admin/UserForm.tsx` — Create/edit user dialog (NEW)

### Pages
- `src/pages/admin/utilisateurs/index.astro` — Users management page (NEW)
- `src/pages/admin/index.astro` — Added navigation to users (MODIFIED)

## User Roles

### Admin (`admin`)
- Full system access
- Can manage all users
- Can manage articles
- Can configure settings

### Redacteur (`redacteur`)
- Create and edit their own articles
- Cannot manage users
- Cannot delete articles of others
- Cannot access admin panel (unless also admin)

### Subscriber Paid (`subscriber_paid`)
- Access to premium content
- Personal account dashboard
- Can manage own profile
- No admin access

### Subscriber Free (`subscriber_free`)
- Access to free content
- Personal account dashboard
- Can manage own profile
- No admin access

## Setup Instructions

### 1. Database Requirements

Ensure `profiles` table exists with role column (from Phase 1/4):
```sql
CREATE TYPE user_role AS ENUM ('admin', 'redacteur', 'subscriber_paid', 'subscriber_free');

ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'subscriber_free';
```

### 2. Authentication

User must be admin (`role = 'admin'`) to access:
- `/admin/utilisateurs` — Users management page
- `/api/admin/users` — Users API endpoints

### 3. Environment Variables

No new env vars needed. Uses existing Supabase credentials.

## User Interface

### Users Management Page (`/admin/utilisateurs`)

**Header:**
- Page title "Gestion des utilisateurs"
- "Nouvel utilisateur" button

**Statistics:**
- Total user count
- Admin count
- Redacteur count
- Subscriber count

**Users Table:**
- Email (identifier)
- Name (display name)
- Role (badge with color)
- Created date
- Confirmed status (checkmark)
- Actions (Edit, Delete buttons)

**Inline Actions:**
- Edit: Opens user form dialog
- Delete: Confirms deletion, removes from table

### User Form Dialog

**Create Mode:**
- Email input (required)
- Full name input (optional, defaults to email prefix)
- Password input (required, minimum 6 chars)
- Role select (admin, redacteur, subscriber_paid, subscriber_free)

**Edit Mode:**
- Email display (disabled, cannot change)
- Full name input (optional)
- Password input (optional, leave blank to keep current)
- Role select

## API Endpoints

### GET /api/admin/users

Get all users with profiles.

**Authentication:** Admin only

**Response (200):**
```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2026-03-07T...",
    "confirmed_at": "2026-03-07T...",
    "role": "admin",
    "display_name": "John Doe",
    "stripe_subscription_status": null
  }
]
```

---

### POST /api/admin/users

Create a new user.

**Authentication:** Admin only

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "fullName": "New User",
  "role": "subscriber_free"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "email": "newuser@example.com",
  "role": "subscriber_free",
  "display_name": "New User"
}
```

**Errors:**
- `400` — Missing required fields
- `400` — Password < 6 characters
- `400` — Invalid role
- `400` — Email already exists

---

### GET /api/admin/users/[id]

Get single user details.

**Authentication:** Admin only

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "admin",
  "display_name": "John Doe",
  "created_at": "2026-03-07T...",
  "confirmed_at": "2026-03-07T..."
}
```

**Errors:**
- `404` — User not found

---

### PUT /api/admin/users/[id]

Update user role and/or display name.

**Authentication:** Admin only

**Request:**
```json
{
  "role": "redacteur",
  "fullName": "Updated Name",
  "password": "newpassword"  // optional
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "role": "redacteur",
  "display_name": "Updated Name",
  "message": "User updated successfully"
}
```

**Errors:**
- `400` — Invalid role
- `400` — Self-reference (cannot change own password via this endpoint)

---

### DELETE /api/admin/users/[id]

Delete a user and their profile.

**Authentication:** Admin only

**Response:** 204 No Content

**Errors:**
- `400` — Cannot delete yourself
- `404` — User not found

## Role-Based Access

### Can Access `/admin/utilisateurs`
- Admin only
- Redirects to `/admin/login` if not admin

### API Protection
- All endpoints require admin authentication
- Checked via JWT token in cookies
- Returns `401 Unauthorized` if not authenticated
- Returns `401 Unauthorized` if not admin role

## User Creation Workflow

### Via Admin Interface

1. Click "Nouvel utilisateur" button
2. Fill form:
   - Email (required)
   - Full name (optional)
   - Password (required, min 6 chars)
   - Role (select from dropdown)
3. Click "Créer"
4. User appears in table
5. Trigger automatically creates profile with selected role

### Via API

```bash
curl -X POST http://localhost:4000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "fullName": "New User",
    "role": "redacteur"
  }'
```

## Role Change Workflow

1. Click edit (pencil icon) on user row
2. Change role in dropdown
3. Optionally change display name
4. Click "Enregistrer"
5. User's role updated immediately
6. RLS policies enforce new permissions

## User Deletion

**Confirmation:**
- Dialog: "Êtes-vous sûr? Cette action est irreversible."
- Require explicit confirmation

**Cascade Delete:**
- User deleted from `auth.users`
- Profile automatically deleted (FK cascade)
- All associated data cleaned up

**Protection:**
- Cannot delete yourself (403 Forbidden)
- Prevents accidental lockout

## Testing

### Test Locally

1. Go to http://localhost:4000/admin
2. Login as admin
3. Click "Utilisateurs" tab
4. Try these actions:
   - View stats
   - Create new user (various roles)
   - Edit user role
   - Delete user (not yourself!)

### Test with API

```bash
# List users
curl http://localhost:4000/api/admin/users \
  -H "Cookie: sb-access-token=your-token"

# Create user
curl -X POST http://localhost:4000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=your-token" \
  -d '{"email":"test@example.com","password":"test123","role":"subscriber_free"}'

# Update user
curl -X PUT http://localhost:4000/api/admin/users/user-id \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=your-token" \
  -d '{"role":"redacteur"}'

# Delete user
curl -X DELETE http://localhost:4000/api/admin/users/user-id \
  -H "Cookie: sb-access-token=your-token"
```

### Database Verification

```sql
-- View all users and roles
SELECT
  a.email,
  p.role,
  p.display_name,
  a.created_at,
  a.confirmed_at
FROM auth.users a
LEFT JOIN profiles p ON a.id = p.id
ORDER BY a.created_at DESC;

-- Find admins
SELECT email, id FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin';

-- Count by role
SELECT role, COUNT(*) FROM profiles GROUP BY role;
```

## Security Considerations

✓ **Admin-only access** — Checked on both page and API level
✓ **Self-deletion prevention** — Cannot delete own account
✓ **Password validation** — Minimum 6 characters
✓ **Email uniqueness** — Enforced by auth.users
✓ **Role validation** — Only allowed roles accepted
✓ **Cascade delete** — Profile deleted with user automatically
✓ **Audit trail** — Created/confirmed dates tracked

## Limitations & Future Enhancements

### Current Limitations
- No bulk actions (export, delete multiple)
- No search/filtering in table
- No password reset via admin
- No email verification requirement

### Future Enhancements
- [ ] Search and filter users by email, role, date
- [ ] Bulk actions (change role, delete multiple)
- [ ] User profile picture
- [ ] Login history / audit log
- [ ] Two-factor authentication
- [ ] Password reset email
- [ ] Invite links (pre-signup)
- [ ] User activity timeline
- [ ] Subscription management UI

## Related Phases

- **Phase 4** — Subscriber authentication (creates users)
- **Phase 5** — Content gating (uses user roles)
- **Phase 7** — Stripe (manages paid subscriptions)

## Next Steps

With Phase 6 complete:
1. Admin can manage all user accounts
2. Admins and redacteurs can be assigned
3. Subscription tiers can be set per user
4. Ready for Phase 7 (Stripe) to automate paid tier
