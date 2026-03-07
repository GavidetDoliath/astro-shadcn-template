import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = import.meta.env.RESEND_API_KEY;
const fromEmail = import.meta.env.FROM_EMAIL || 'noreply@laderaison.fr';
const siteUrl = import.meta.env.SITE_URL || 'https://laderaison.fr';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json() as Record<string, any>;

    // Validate email
    const { email } = body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Valid email is required' }),
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Initialize Supabase with service role
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if email already exists
    const { data: existing } = await supabase
      .from('newsletter_subscriptions')
      .select('id, status')
      .eq('email', normalizedEmail)
      .single();

    if (existing) {
      if (existing.status === 'confirmed') {
        return new Response(
          JSON.stringify({ message: 'Already subscribed', status: 'confirmed' }),
          { status: 200 }
        );
      }
      // If pending or unsubscribed, regenerate token
    }

    // Generate confirmation token
    const confirmationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    // Upsert newsletter subscription
    const { error: upsertError } = await supabase
      .from('newsletter_subscriptions')
      .upsert(
        {
          email: normalizedEmail,
          status: 'pending',
          confirmation_token: confirmationToken,
          token_expires_at: tokenExpiresAt,
          source: 'website',
        },
        { onConflict: 'email' }
      );

    if (upsertError) {
      console.error('Newsletter subscribe error:', upsertError);
      return new Response(
        JSON.stringify({ error: 'Failed to subscribe. Please try again.' }),
        { status: 500 }
      );
    }

    // Send confirmation email via Resend
    if (resendApiKey) {
      const confirmUrl = `${siteUrl}/api/newsletter/confirm?token=${confirmationToken}`;
      const emailHtml = `
        <div style="font-family: system-ui, sans-serif; padding: 20px; color: #333;">
          <h2>Confirmez votre abonnement à La Déraison</h2>
          <p>Merci de vous être inscrit à notre newsletter. Cliquez sur le lien ci-dessous pour confirmer votre adresse e-mail.</p>
          <p style="margin: 30px 0;">
            <a href="${confirmUrl}" style="
              display: inline-block;
              padding: 12px 24px;
              background-color: #000;
              color: #fff;
              text-decoration: none;
              border-radius: 4px;
              font-weight: bold;
            ">Confirmer mon inscription</a>
          </p>
          <p style="color: #666; font-size: 12px;">
            Ou copiez ce lien dans votre navigateur:<br/>
            <code>${confirmUrl}</code>
          </p>
          <p style="margin-top: 30px; color: #999; font-size: 12px;">
            Ce lien expire dans 24 heures. Si vous n'avez pas demandé cet abonnement, ignorez cet e-mail.
          </p>
        </div>
      `;

      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: fromEmail,
            to: normalizedEmail,
            subject: 'Confirmez votre abonnement à La Déraison',
            html: emailHtml,
          }),
        });

        if (!response.ok) {
          console.error('Resend API error:', await response.text());
          // Don't fail the subscription if email fails - user can still confirm manually
        }
      } catch (emailErr) {
        console.error('Failed to send confirmation email:', emailErr);
        // Continue - subscription is still valid, just email failed
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Subscription pending. Check your email for confirmation link.',
        status: 'pending',
      }),
      { status: 201 }
    );
  } catch (err) {
    console.error('Newsletter subscribe error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
};
