import type { APIRoute } from 'astro';
import { getApiUser, hasRole } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const GET: APIRoute = async ({ request }) => {
  try {
    // Verify admin authentication
    const user = await getApiUser(request);
    if (!user || !hasRole(user, 'admin')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get all users from auth.users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return new Response(JSON.stringify({ error: usersError.message }), { status: 500 });
    }

    // Get profiles for all users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return new Response(JSON.stringify({ error: profilesError.message }), { status: 500 });
    }

    // Combine auth users with profiles
    const usersWithProfiles = users.map(authUser => {
      const profile = profiles?.find(p => p.id === authUser.id);
      return {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
        confirmed_at: authUser.confirmed_at,
        role: profile?.role || 'subscriber_free',
        display_name: profile?.display_name,
        stripe_subscription_status: profile?.stripe_subscription_status,
      };
    });

    return new Response(JSON.stringify(usersWithProfiles), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Users GET error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    // Verify admin authentication
    const user = await getApiUser(request);
    if (!user || !hasRole(user, 'admin')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json() as Record<string, any>;

    const { email, password, fullName, role } = body;

    // Validate inputs
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400 }
      );
    }

    const validRoles = ['admin', 'redacteur', 'subscriber_paid', 'subscriber_free'];
    if (role && !validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }),
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Create user in auth.users
    const { data, error: createError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      user_metadata: {
        full_name: fullName || email.split('@')[0],
      },
      app_metadata: {
        role: role || 'subscriber_free',
      },
    });

    if (createError || !data.user) {
      console.error('Auth user creation error:', createError);
      return new Response(
        JSON.stringify({ error: createError?.message || 'Failed to create user' }),
        { status: 400 }
      );
    }

    // Profile will be auto-created by trigger, but ensure role is set
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        role: role || 'subscriber_free',
      })
      .eq('id', data.user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      // Don't fail - user was created, just profile role might not be updated
    }

    return new Response(
      JSON.stringify({
        id: data.user.id,
        email: data.user.email,
        role: role || 'subscriber_free',
        display_name: fullName || email.split('@')[0],
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Users POST error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
