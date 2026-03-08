import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  getServerSupabase: vi.fn(),
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
  getApiUser: vi.fn(),
}));

describe('POST /api/stripe/portal', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns 401 if user is not authenticated', async () => {
    vi.mock('stripe', () => ({
      default: vi.fn(),
    }));

    const { POST } = await import('./portal');
    const { getApiUser } = await import('@/lib/auth');
    vi.mocked(getApiUser).mockResolvedValue(null);

    const request = new Request('http://localhost/api/stripe/portal', {
      method: 'POST',
    });

    const response = await POST({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Unauthorized');
  });

  it('returns 404 if user has no Stripe customer', async () => {
    vi.mock('stripe', () => ({
      default: vi.fn(),
    }));

    const { POST } = await import('./portal');
    const { getApiUser } = await import('@/lib/auth');
    const { getServerSupabase } = await import('@/lib/supabase');

    vi.mocked(getApiUser).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      role: 'subscriber_free',
    });

    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis().mockReturnValueOnce({
      single: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    });

    vi.mocked(getServerSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      }),
    } as any);

    const request = new Request('http://localhost/api/stripe/portal', {
      method: 'POST',
    });

    const response = await POST({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('Stripe customer');
  });

  it('returns 404 if stripe_customer_id is empty string', async () => {
    vi.mock('stripe', () => ({
      default: vi.fn(),
    }));

    const { POST } = await import('./portal');
    const { getApiUser } = await import('@/lib/auth');
    const { getServerSupabase } = await import('@/lib/supabase');

    vi.mocked(getApiUser).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      role: 'subscriber_free',
    });

    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis().mockReturnValueOnce({
      single: vi.fn().mockResolvedValue({
        data: { stripe_customer_id: '' },
        error: null,
      }),
    });

    vi.mocked(getServerSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      }),
    } as any);

    const request = new Request('http://localhost/api/stripe/portal', {
      method: 'POST',
    });

    const response = await POST({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('Stripe customer');
  });

  it('creates billing portal session and returns URL', async () => {
    vi.mock('stripe', () => ({
      default: vi.fn(() => ({
        billingPortal: {
          sessions: {
            create: vi.fn().mockResolvedValue({
              url: 'https://billing.stripe.com/session-123',
            }),
          },
        },
      })),
    }));

    const { POST } = await import('./portal');
    const { getApiUser } = await import('@/lib/auth');
    const { getServerSupabase } = await import('@/lib/supabase');

    vi.mocked(getApiUser).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      role: 'subscriber_paid',
    });

    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis().mockReturnValueOnce({
      single: vi.fn().mockResolvedValue({
        data: { stripe_customer_id: 'cus_123' },
        error: null,
      }),
    });

    vi.mocked(getServerSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      }),
    } as any);

    const request = new Request('http://localhost/api/stripe/portal', {
      method: 'POST',
    });

    const response = await POST({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.url).toBe('https://billing.stripe.com/session-123');
  });
});
