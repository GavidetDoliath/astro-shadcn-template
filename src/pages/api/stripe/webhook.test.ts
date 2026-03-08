import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  getServerSupabase: vi.fn(),
}));

describe('POST /api/stripe/webhook', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Clear module cache before each test
    vi.resetModules();
  });

  it('returns 500 if webhook secret is not configured', async () => {
    // Set env before import
    const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;
    process.env.STRIPE_WEBHOOK_SECRET = '';

    // Mock Stripe before importing
    vi.mock('stripe', () => ({
      default: vi.fn(),
    }));

    const { POST } = await import('./webhook');

    const request = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: '{}',
    });

    const response = await POST({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('secret');

    process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
  });


  it('handles checkout.session.completed event', async () => {
    vi.mock('stripe', () => ({
      default: vi.fn(() => ({
        webhooks: {
          constructEvent: vi.fn(() => ({
            type: 'checkout.session.completed',
            data: {
              object: {
                customer: 'cus_123',
                subscription: 'sub_123',
                metadata: { userId: 'user-1' },
              },
            },
          })),
        },
      })),
    }));

    const { POST } = await import('./webhook');
    const { getServerSupabase } = await import('@/lib/supabase');

    const mockUpdate = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(getServerSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      }),
    } as any);

    const request = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 'valid-signature' },
      body: '{}',
    });

    const response = await POST({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
  });

  it('ignores unknown event types', async () => {
    vi.mock('stripe', () => ({
      default: vi.fn(() => ({
        webhooks: {
          constructEvent: vi.fn(() => ({
            type: 'some.unknown.event',
            data: { object: {} },
          })),
        },
      })),
    }));

    const { POST } = await import('./webhook');
    const { getServerSupabase } = await import('@/lib/supabase');

    vi.mocked(getServerSupabase).mockReturnValue({
      from: vi.fn(),
    } as any);

    const request = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 'valid-signature' },
      body: '{}',
    });

    const response = await POST({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
  });
});
