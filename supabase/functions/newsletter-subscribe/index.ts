import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';
import { crypto } from 'https://deno.land/std@0.208.0/crypto/mod.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const resendApiKey = Deno.env.get('RESEND_API_KEY') || '';
const fromEmail = Deno.env.get('FROM_EMAIL') || 'bonjour@laderaison.fr';
const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:4000';

Deno.serve(async (req) => {
  // Only POST allowed
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { email } = await req.json() as { email?: string };

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Generate confirmation token (32 bytes, hex encoded)
    const tokenArray = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(tokenArray).map(b => b.toString(16).padStart(2, '0')).join('');

    // Token expires in 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Insert or update subscription
    const { error: insertError } = await supabase.from('newsletter_subscriptions').upsert(
      {
        email,
        status: 'pending',
        confirmation_token: token,
        token_expires_at: expiresAt,
        source: 'website',
      },
      { onConflict: 'email' }
    );

    if (insertError) {
      console.error('Failed to insert newsletter subscription:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to subscribe' }), { status: 500 });
    }

    // Send confirmation email via Resend
    const confirmUrl = `${siteUrl}/api/newsletter/confirm?token=${encodeURIComponent(token)}`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: email,
        subject: 'Confirmez votre abonnement à La Déraison',
        html: `
          <h2>Confirmez votre abonnement</h2>
          <p>Merci de votre intérêt pour La Déraison!</p>
          <p>
            <a href="${confirmUrl}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px;">
              Confirmer mon abonnement
            </a>
          </p>
          <p style="color: #666; font-size: 12px;">
            Ce lien expire dans 24 heures. Si vous ne l'avez pas demandé, ignorez cet email.
          </p>
        `,
      }),
    });

    if (!response.ok) {
      console.error('Failed to send email:', await response.text());
      return new Response(
        JSON.stringify({ error: 'Failed to send confirmation email' }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Check your email to confirm' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Newsletter subscribe error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
