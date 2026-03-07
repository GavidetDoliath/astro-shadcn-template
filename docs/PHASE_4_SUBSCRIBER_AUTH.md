# Phase 4: Subscriber Authentication

## Overview

Phase 4 implements full subscriber account management with email/password authentication. This allows readers to create accounts, login, and manage their profile.

## Features

✓ Email/password signup with automatic profile creation
✓ Login with HttpOnly secure cookies
✓ Logout with cookie cleanup
✓ Token refresh (automatic via middleware)
✓ Protected account dashboard
✓ Role-based access (subscriber_free by default)

## Files Created

### API Routes
- `src/pages/api/auth/signup.ts` — POST to create account
- `src/pages/api/auth/login.ts` — POST to authenticate
- `src/pages/api/auth/logout.ts` — POST to logout
- `src/pages/api/auth/refresh.ts` — POST to refresh session

### Components
- `src/components/auth/LoginForm.tsx` — Login form (React)
- `src/components/auth/SignupForm.tsx` — Signup form (React)

### Pages
- `src/pages/connexion.astro` — Login page
- `src/pages/inscription.astro` — Signup page
- `src/pages/compte/index.astro` — Account dashboard (SSR, auth required)

## Setup Instructions

### 1. Database Requirements

Ensure tables from Phase 1 exist:
- `profiles` table with user role tracking
- Trigger that auto-creates profile on auth.users signup

### 2. Environment Variables

Ensure `.env` has (from previous phases):
```env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Usage

### Authentication Flow

#### Signup
1. User visits `/inscription`
2. Fills form: email, password, optional full name
3. POST `/api/auth/signup` → creates auth user
4. Trigger in Supabase creates profile row (role: subscriber_free)
5. Session created → cookies set
6. Redirect to `/compte` (account dashboard)

#### Login
1. User visits `/connexion`
2. Enters email + password
3. POST `/api/auth/login` → validates credentials
4. Cookies set (access + refresh tokens)
5. Redirect to `/compte` or `?next=` parameter

#### Session Management
- Access token: 1 hour validity
- Refresh token: 7 days validity
- Tokens stored in HttpOnly cookies (secure, SameSite=Strict)
- Middleware automatically attaches user to `Astro.locals.user`

#### Token Refresh
- POST `/api/auth/refresh` → gets new access token
- Called automatically when token expires (future middleware enhancement)
- Maintains session without re-login

#### Logout
- POST `/api/auth/logout` → clears cookies
- Redirects to home page

### Protected Pages

Pages that require authentication:
- `/compte/*` — Account pages (redirects to `/connexion` if not logged in)
- `/admin/*` — Admin pages (already protected in Phase 2)

### Account Dashboard (`/compte`)

**Features:**
- Display user profile (email, name, role)
- Show subscription status
- Logout button
- Future: Edit profile, manage subscription, change password

**Current Sections:**
- **Profil** — Email, name, role
- **Abonnement** — Subscription status and renewal date (if paid)
- **Sécurité** — Security settings (placeholder for future password change)

## API Endpoints

### POST /api/auth/signup

Create a new subscriber account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "fullName": "John Doe"  // optional
}
```

**Response (201 Created):**
```json
{
  "ok": true,
  "message": "Account created successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Errors:**
- `400` — Invalid email or password < 6 chars
- `400` — Email already exists
- `500` — Server error

---

### POST /api/auth/login

Authenticate a subscriber.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200 OK):**
```json
{
  "ok": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Errors:**
- `401` — Invalid email or password
- `500` — Server error

Sets cookies:
- `sb-access-token` (1 hour)
- `sb-refresh-token` (7 days)

---

### POST /api/auth/logout

Logout and clear session.

**Request:**
```
POST /api/auth/logout
```

**Response:**
- Clears cookies
- HTTP 302 redirect to `/`

---

### POST /api/auth/refresh

Refresh an expired access token.

**Request:**
```
POST /api/auth/refresh
```

**Response (200 OK):**
```json
{
  "ok": true,
  "message": "Session refreshed"
}
```

**Errors:**
- `401` — No refresh token or refresh failed

Sets new `sb-access-token` cookie.

## Security Considerations

✓ **Passwords:** Never stored in cookies or returned in responses
✓ **Tokens:** HttpOnly cookies prevent JavaScript access
✓ **HTTPS:** Secure flag set in production (dev disabled for localhost)
✓ **CSRF:** SameSite=Strict prevents cross-site form submissions
✓ **Validation:** Email format + password length checked
✓ **Expiry:** Access tokens expire after 1 hour

## User Profile Creation

When a user signs up, Supabase trigger automatically:
1. Creates row in `profiles` table
2. Sets `role = subscriber_free` (default)
3. Sets `display_name` from fullName or email prefix
4. Records `created_at` timestamp

View in Supabase: `profiles` table → filter by your user ID

## Testing

### Test Locally

1. Start dev server: `pnpm dev`
2. Visit http://localhost:4000/inscription
3. Create an account (test@example.com)
4. Should redirect to `/compte`
5. Visit http://localhost:4000/connexion
6. Login with same credentials

### Verify Database

Check Supabase:
```sql
-- Check auth.users
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;

-- Check profiles
SELECT id, role, display_name, created_at FROM profiles ORDER BY created_at DESC;
```

### Test Protected Routes

1. Logout or clear cookies
2. Visit http://localhost:4000/compte
3. Should redirect to `/connexion?next=/compte`

## Middleware Integration

The middleware (`src/middleware.ts`) now:
1. Validates JWT token from `sb-access-token` cookie
2. Fetches user profile from `profiles` table
3. Attaches full `UserProfile` object to `Astro.locals.user`
4. Protects routes based on role:
   - `/admin/*` → requires admin or redacteur
   - `/compte/*` → requires any authenticated user

## Next Steps

- **Phase 5**: Content gating (show "subscribe" overlay for locked articles)
- **Phase 6**: Admin user management interface
- **Phase 7**: Stripe integration (paid subscriptions)

## Troubleshooting

### Can't signup
- Check email format validation
- Verify password is at least 6 characters
- Check Supabase auth is properly configured

### Can't login
- Verify credentials are correct (case-sensitive email)
- Check cookies are being set (browser DevTools > Application > Cookies)
- Try `/api/auth/refresh` if session expired

### Stuck on redirect
- Clear browser cookies for localhost
- Check `SUPABASE_SERVICE_ROLE_KEY` is set in `.env`
- Verify `profiles` table exists in Supabase

### Profile not created
- Check Supabase trigger `on_auth_user_created` is enabled
- Verify `profiles` table exists with correct schema
- Check Supabase logs for trigger errors

## Future Enhancements

- [ ] Email verification on signup
- [ ] Password reset flow
- [ ] Two-factor authentication
- [ ] Social login (Google, GitHub, etc.)
- [ ] Profile edit form
- [ ] Change password
- [ ] Delete account
- [ ] Session management (view active sessions)
