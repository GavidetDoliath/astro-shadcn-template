import type { APIRoute } from 'astro';
import { getServerSupabase } from '@/lib/supabase';

const fromEmail = import.meta.env.FROM_EMAIL || 'noreply@example.com';
const siteUrl = import.meta.env.SITE_URL || 'http://localhost:4000';

/**
 * Generate a random token (32 bytes hex)
 */
function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email } = (await request.json()) as { email?: string };

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email is required' }), { status: 400 });
    }

    const supabase = getServerSupabase();
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

    // Upsert newsletter subscription
    const { error: upsertError } = await supabase.from('newsletter_subscriptions').upsert(
      {
        email: email.toLowerCase(),
        status: 'pending',
        confirmation_token: token,
        token_expires_at: expiresAt,
        source: 'website',
      },
      { onConflict: 'email' }
    );

    if (upsertError) {
      console.error('Database error:', upsertError);
      return new Response(JSON.stringify({ error: 'Failed to subscribe' }), { status: 500 });
    }

    // Send confirmation email via Resend
    const confirmUrl = `${siteUrl}/api/newsletter/confirm?token=${encodeURIComponent(token)}`;

    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.RESEND_API_KEY || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: email,
          subject: 'Confirmez votre abonnement à la newsletter',
          html: `<p>Cliquez sur le lien ci-dessous pour confirmer votre abonnement:</p><a href="${confirmUrl}">${confirmUrl}</a>`,
        }),
      });

      if (!resendResponse.ok) {
        console.error('Resend error:', await resendResponse.text());
        return new Response(JSON.stringify({ error: 'Failed to send confirmation email' }), { status: 500 });
      }
    } catch (resendError) {
      console.error('Resend fetch error:', resendError);
      return new Response(JSON.stringify({ error: 'Failed to send confirmation email' }), { status: 500 });
    }

    return new Response(JSON.stringify({ message: 'Check your email to confirm subscription' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Newsletter subscribe error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
