import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  getServerSupabase: vi.fn(),
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
  getApiUser: vi.fn(),
}));

describe('POST /api/stripe/checkout', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns 401 if user is not authenticated', async () => {
    vi.mock('stripe', () => ({
      default: vi.fn(),
    }));

    const { POST } = await import('./checkout');
    const { getApiUser } = await import('@/lib/auth');
    vi.mocked(getApiUser).mockResolvedValue(null);

    const request = new Request('http://localhost/api/stripe/checkout', {
      method: 'POST',
    });

    const response = await POST({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Unauthorized');
  });

  it('returns 500 if STRIPE_PRICE_ID is not configured', async () => {
    const originalPriceId = process.env.STRIPE_PRICE_ID;
    process.env.STRIPE_PRICE_ID = '';

    vi.mock('stripe', () => ({
      default: vi.fn(),
    }));

    const { POST } = await import('./checkout');
    const { getApiUser } = await import('@/lib/auth');

    vi.mocked(getApiUser).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      role: 'subscriber_free',
    });

    const request = new Request('http://localhost/api/stripe/checkout', {
      method: 'POST',
    });

    const response = await POST({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('STRIPE_PRICE_ID');

    process.env.STRIPE_PRICE_ID = originalPriceId;
  });

});
