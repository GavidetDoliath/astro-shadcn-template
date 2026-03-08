import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async () => {
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/connexion',
      'Set-Cookie': [
        'sb-access-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
        'sb-refresh-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
      ].join(', '),
    },
  });
};
