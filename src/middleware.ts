import { defineMiddleware } from 'astro:middleware';
import { getApiUser } from '@/lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  // Attach user to locals for all requests
  const user = await getApiUser(context.request);
  context.locals.user = user;

  // Protect /compte/* routes
  if (context.request.url.includes('/compte/')) {
    if (!user) {
      return context.redirect('/connexion');
    }
  }

  // Protect /admin/* routes (admin and redacteur only)
  if (context.request.url.includes('/admin/')) {
    if (!user || !['admin', 'redacteur'].includes(user.role)) {
      return context.redirect('/');
    }
  }

  return next();
});
