import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hasRole, canAccessArticle, getApiUser, type UserProfile } from './auth';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe('auth.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hasRole', () => {
    it('returns false if user is null', () => {
      expect(hasRole(null, 'admin')).toBe(false);
    });

    it('returns true if user has required role', () => {
      const user: UserProfile = {
        id: 'user-1',
        email: 'user@example.com',
        role: 'admin',
      };
      expect(hasRole(user, 'admin')).toBe(true);
    });

    it('returns true if user has any of multiple required roles', () => {
      const user: UserProfile = {
        id: 'user-1',
        email: 'user@example.com',
        role: 'redacteur',
      };
      expect(hasRole(user, 'admin', 'redacteur')).toBe(true);
    });

    it('returns false if user does not have required role', () => {
      const user: UserProfile = {
        id: 'user-1',
        email: 'user@example.com',
        role: 'subscriber_free',
      };
      expect(hasRole(user, 'admin', 'redacteur')).toBe(false);
    });
  });

  describe('canAccessArticle', () => {
    it('allows public access for anyone', () => {
      expect(canAccessArticle(null, 'public')).toBe(true);
    });

    it('denies subscriber_free access to non-logged-in users', () => {
      expect(canAccessArticle(null, 'subscriber_free')).toBe(false);
    });

    it('denies subscriber_paid access to non-logged-in users', () => {
      expect(canAccessArticle(null, 'subscriber_paid')).toBe(false);
    });

    it('allows subscriber_free access to subscriber_free users', () => {
      const user: UserProfile = {
        id: 'user-1',
        email: 'user@example.com',
        role: 'subscriber_free',
      };
      expect(canAccessArticle(user, 'subscriber_free')).toBe(true);
    });

    it('allows subscriber_free access to subscriber_paid users', () => {
      const user: UserProfile = {
        id: 'user-1',
        email: 'user@example.com',
        role: 'subscriber_paid',
      };
      expect(canAccessArticle(user, 'subscriber_free')).toBe(true);
    });

    it('denies subscriber_paid access to subscriber_free users', () => {
      const user: UserProfile = {
        id: 'user-1',
        email: 'user@example.com',
        role: 'subscriber_free',
      };
      expect(canAccessArticle(user, 'subscriber_paid')).toBe(false);
    });

    it('allows subscriber_paid access to subscriber_paid users', () => {
      const user: UserProfile = {
        id: 'user-1',
        email: 'user@example.com',
        role: 'subscriber_paid',
      };
      expect(canAccessArticle(user, 'subscriber_paid')).toBe(true);
    });

    it('allows all access levels to admin users', () => {
      const user: UserProfile = {
        id: 'user-1',
        email: 'user@example.com',
        role: 'admin',
      };
      expect(canAccessArticle(user, 'public')).toBe(true);
      expect(canAccessArticle(user, 'subscriber_free')).toBe(true);
      expect(canAccessArticle(user, 'subscriber_paid')).toBe(true);
    });

    it('allows all access levels to redacteur users', () => {
      const user: UserProfile = {
        id: 'user-1',
        email: 'user@example.com',
        role: 'redacteur',
      };
      expect(canAccessArticle(user, 'public')).toBe(true);
      expect(canAccessArticle(user, 'subscriber_free')).toBe(true);
      expect(canAccessArticle(user, 'subscriber_paid')).toBe(true);
    });
  });

  describe('getApiUser', () => {
    it('returns null if no cookie present', async () => {
      const request = new Request('http://localhost/api/test', { method: 'GET' });
      const result = await getApiUser(request);
      expect(result).toBeNull();
    });

    it('returns null if access token is invalid', async () => {
      const { supabase } = await import('@/lib/supabase');
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid token') as any,
      });

      const request = new Request('http://localhost/api/test', {
        method: 'GET',
        headers: { cookie: 'sb-access-token=invalid-token' },
      });
      const result = await getApiUser(request);
      expect(result).toBeNull();
    });

    it('returns user with admin role if auth succeeds', async () => {
      const { supabase } = await import('@/lib/supabase');
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-1', email: 'admin@example.com' } as any },
        error: null,
      });

      const request = new Request('http://localhost/api/test', {
        method: 'GET',
        headers: { cookie: 'sb-access-token=valid-token' },
      });
      const result = await getApiUser(request);
      expect(result).not.toBeNull();
      expect(result?.id).toBe('user-1');
      expect(result?.email).toBe('admin@example.com');
      expect(result?.role).toBe('admin');
    });
  });
});
