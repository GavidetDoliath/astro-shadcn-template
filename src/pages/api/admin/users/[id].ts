import type { APIRoute } from 'astro';
import { getApiUser, hasRole } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400 });
    }

    // Verify admin authentication
    const user = await getApiUser(request);
    if (!user || !hasRole(user, 'admin')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get user from auth.users
    const { data: { user: authUser }, error: userError } = await supabase.auth.admin.getUserById(
      id,
    );

    if (userError || !authUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    return new Response(
      JSON.stringify({
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
        confirmed_at: authUser.confirmed_at,
        role: profile?.role || 'subscriber_free',
        display_name: profile?.display_name,
        stripe_subscription_status: profile?.stripe_subscription_status,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('User GET error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400 });
    }

    // Verify admin authentication
    const user = await getApiUser(request);
    if (!user || !hasRole(user, 'admin')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json() as Record<string, any>;
    const { role, fullName } = body;

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

    // Update profile role if provided
    if (role) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500 }
        );
      }
    }

    // Update user metadata if fullName provided
    if (fullName) {
      const { error: metaError } = await supabase.auth.admin.updateUserById(id, {
        user_metadata: {
          full_name: fullName,
        },
      });

      if (metaError) {
        console.error('User metadata update error:', metaError);
        return new Response(
          JSON.stringify({ error: metaError.message }),
          { status: 500 }
        );
      }
    }

    // Return updated user
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    return new Response(
      JSON.stringify({
        id,
        role: profile?.role,
        display_name: profile?.display_name,
        message: 'User updated successfully',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('User PUT error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400 });
    }

    // Verify admin authentication
    const user = await getApiUser(request);
    if (!user || !hasRole(user, 'admin')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Prevent deleting yourself
    if (id === user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own user account' }),
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Delete user (cascade will delete profile)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(id);

    if (deleteError) {
      console.error('User delete error:', deleteError);
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 500 }
      );
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('User DELETE error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
