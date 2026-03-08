import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'redacteur' | 'subscriber_paid' | 'subscriber_free';
  display_name?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_subscription_status?: string;
}

/**
 * Extract access token from request cookies
 */
export function extractAccessToken(request: Request): string | null {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;

  const match = cookie.match(/sb-access-token=([^;]+)/);
  return match?.[1] || null;
}

/**
 * Get authenticated user from request (via access token cookie)
 * Uses anon key — no service role key required
 */
export async function getApiUser(request: Request): Promise<UserProfile | null> {
  const accessToken = extractAccessToken(request);

  if (!accessToken) {
    return null;
  }

  try {
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email || '',
      role: 'admin',
    };
  } catch {
    return null;
  }
}

/**
 * Check if user has required role(s)
 */
export function hasRole(user: UserProfile | null, ...roles: string[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Check if user can access article based on access level
 */
export function canAccessArticle(user: UserProfile | null, accessLevel: string): boolean {
  if (accessLevel === 'public') return true;

  if (user) {
    if (accessLevel === 'subscriber_free' && hasRole(user, 'subscriber_free', 'subscriber_paid', 'admin', 'redacteur')) {
      return true;
    }

    if (accessLevel === 'subscriber_paid' && hasRole(user, 'subscriber_paid', 'admin', 'redacteur')) {
      return true;
    }
  }

  return false;
}
