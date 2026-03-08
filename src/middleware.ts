import { defineMiddleware } from 'astro:middleware';
import { getApiUser } from '@/lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Attach user to locals for all requests
  const user = await getApiUser(context.request);
  context.locals.user = user;

  // Protect /admin/* routes (except login page)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!user) {
      return context.redirect('/admin/login');
    }
  }

  // Protect /api/admin/* routes — return 401 for unauthenticated API calls
  if (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/auth/login')) {
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return next();
});
