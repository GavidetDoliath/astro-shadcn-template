import { getServerSupabase } from '@/lib/supabase';

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
function extractAccessToken(request: Request): string | null {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;

  const match = cookie.match(/sb-access-token=([^;]+)/);
  return match?.[1] || null;
}

/**
 * Get authenticated user from request (via access token cookie)
 * Used in API routes to identify the requesting user
 */
export async function getApiUser(request: Request): Promise<UserProfile | null> {
  const accessToken = extractAccessToken(request);

  if (!accessToken) {
    return null;
  }

  try {
    const supabase = getServerSupabase();

    // Set auth token for this request
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      console.error('Auth error:', error?.message);
      return null;
    }

    // Fetch user profile from profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profileData) {
      console.error('Profile fetch error:', profileError?.message);
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email || '',
      role: profileData.role || 'subscriber_free',
      display_name: profileData.display_name,
      stripe_customer_id: profileData.stripe_customer_id,
      stripe_subscription_id: profileData.stripe_subscription_id,
      stripe_subscription_status: profileData.stripe_subscription_status,
    };
  } catch (error) {
    console.error('Auth error:', error);
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
  // Public access
  if (accessLevel === 'public') return true;

  // Logged-in users
  if (user) {
    // Subscriber access
    if (accessLevel === 'subscriber_free' && hasRole(user, 'subscriber_free', 'subscriber_paid', 'admin', 'redacteur')) {
      return true;
    }

    // Paid subscriber access
    if (accessLevel === 'subscriber_paid' && hasRole(user, 'subscriber_paid', 'admin', 'redacteur')) {
      return true;
    }
  }

  return false;
}
