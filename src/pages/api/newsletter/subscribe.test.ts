import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './subscribe';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  getServerSupabase: vi.fn(),
}));

describe('POST /api/newsletter/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock global fetch for Resend API
    global.fetch = vi.fn();
  });

  it('returns 400 if email is missing', async () => {
    const request = new Request('http://localhost/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('email');
  });

  it('returns 400 if email is invalid', async () => {
    const request = new Request('http://localhost/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    });

    const response = await POST({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('email');
  });

  it('returns 500 if database upsert fails', async () => {
    const { getServerSupabase } = await import('@/lib/supabase');
    vi.mocked(getServerSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue({
        upsert: vi.fn().mockResolvedValue({
          error: new Error('Database error'),
        }),
      }),
    } as any);

    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: 'email-123' }), { status: 200 })
    );

    const request = new Request('http://localhost/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('subscribe');
  });

  it('returns 500 if Resend API call fails', async () => {
    const { getServerSupabase } = await import('@/lib/supabase');
    vi.mocked(getServerSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue({
        upsert: vi.fn().mockResolvedValue({
          error: null,
        }),
      }),
    } as any);

    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'Invalid API key' }), { status: 401 })
    );

    const request = new Request('http://localhost/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('confirmation email');
  });

  it('returns 200 and confirms subscription with valid email', async () => {
    const { getServerSupabase } = await import('@/lib/supabase');
    vi.mocked(getServerSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue({
        upsert: vi.fn().mockResolvedValue({
          error: null,
        }),
      }),
    } as any);

    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: 'email-123' }), { status: 200 })
    );

    const request = new Request('http://localhost/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain('email');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('lowercases email before storing', async () => {
    const { getServerSupabase } = await import('@/lib/supabase');
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(getServerSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue({
        upsert: mockUpsert,
      }),
    } as any);

    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: 'email-123' }), { status: 200 })
    );

    const request = new Request('http://localhost/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'Test@Example.COM' }),
    });

    await POST({ request } as any);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com',
      }),
      expect.any(Object)
    );
  });
});
