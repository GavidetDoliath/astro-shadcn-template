/// <reference path="./env.d.ts" />
import { defineMiddleware } from 'astro:middleware';
import { getAuthenticatedUser, hasRole } from '@/lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const accessToken = context.cookies.get('sb-access-token')?.value;

  // Always attach user (null if unauthenticated)
  const user = await getAuthenticatedUser(accessToken);
  context.locals.user = user ?? null;

  // Route protection rules

  // 1. /admin/* pages (except /admin/login): require admin or redacteur role
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!user || !hasRole(user, 'admin', 'redacteur')) {
      return context.redirect('/admin/login?reason=unauthorized');
    }
    return next();
  }

  // 2. /compte/* pages: require authentication
  if (pathname.startsWith('/compte')) {
    if (!user) {
      return context.redirect('/connexion?next=' + encodeURIComponent(pathname));
    }
    return next();
  }

  // 3. All other routes: pass through
  // API routes self-protect via getApiUser() in their handlers
  return next();
});
