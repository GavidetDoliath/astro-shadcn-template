// src/lib/auth.ts
import { createClient } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'redacteur' | 'subscriber_paid' | 'subscriber_free';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  display_name: string | null;
  stripe_subscription_status: string | null;
  subscription_current_period_end: string | null;
}

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Validate session token and return full user profile with role.
 * Returns null if unauthenticated or token invalid.
 */
export async function getAuthenticatedUser(
  accessToken: string | undefined,
): Promise<UserProfile | null> {
  if (!accessToken) return null;

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) return null;

    // Fetch profile with role
    const serverSupabase = createClient(supabaseUrl, serviceRoleKey || supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: profile, error: profileError } = await serverSupabase
      .from('profiles')
      .select('role, display_name, stripe_subscription_status, subscription_current_period_end')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) return null;

    return {
      id: user.id,
      email: user.email!,
      role: profile.role as UserRole,
      display_name: profile.display_name,
      stripe_subscription_status: profile.stripe_subscription_status,
      subscription_current_period_end: profile.subscription_current_period_end,
    };
  } catch (err) {
    console.error('Failed to authenticate user:', err);
    return null;
  }
}

/**
 * Extract and validate auth from request cookies.
 * Used by API route handlers.
 */
export async function getApiUser(request: Request): Promise<UserProfile | null> {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const match = cookieHeader.match(/sb-access-token=([^;]+)/);
  const token = match?.[1];
  return getAuthenticatedUser(token);
}

/**
 * Check if user has any of the given roles.
 */
export function hasRole(user: UserProfile | null, ...roles: UserRole[]): boolean {
  return user !== null && roles.includes(user.role);
}

/**
 * Check if user can access content at the given access level.
 */
export function canAccessArticle(
  user: UserProfile | null,
  accessLevel: 'public' | 'subscriber_free' | 'subscriber_paid',
): boolean {
  if (accessLevel === 'public') return true;
  if (!user) return false;
  if (accessLevel === 'subscriber_free') {
    return ['subscriber_free', 'subscriber_paid', 'redacteur', 'admin'].includes(user.role);
  }
  if (accessLevel === 'subscriber_paid') {
    return ['subscriber_paid', 'admin'].includes(user.role);
  }
  return false;
}
