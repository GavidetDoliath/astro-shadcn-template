import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from './unsubscribe';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  getServerSupabase: vi.fn(),
}));

describe('POST /api/newsletter/unsubscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 if neither email nor token is provided', async () => {
    const request = new Request('http://localhost/api/newsletter/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('email or token');
  });

  it('returns 200 when unsubscribing by email', async () => {
    const { getServerSupabase } = await import('@/lib/supabase');
    const mockUpdate = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(getServerSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      }),
    } as any);

    const request = new Request('http://localhost/api/newsletter/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain('Unsubscribed');
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'unsubscribed' });
    expect(mockEq).toHaveBeenCalledWith('email', 'test@example.com');
  });

  it('returns 200 when unsubscribing by token', async () => {
    const { getServerSupabase } = await import('@/lib/supabase');
    const mockUpdate = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(getServerSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      }),
    } as any);

    const request = new Request('http://localhost/api/newsletter/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'valid-token' }),
    });

    const response = await POST({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain('Unsubscribed');
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'unsubscribed' });
    expect(mockEq).toHaveBeenCalledWith('confirmation_token', 'valid-token');
  });

  it('returns 500 if database update fails', async () => {
    const { getServerSupabase } = await import('@/lib/supabase');
    vi.mocked(getServerSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: new Error('Database error'),
        }),
      }),
    } as any);

    const request = new Request('http://localhost/api/newsletter/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Failed');
  });

  it('lowercases email before database query', async () => {
    const { getServerSupabase } = await import('@/lib/supabase');
    const mockEq = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(getServerSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: mockEq,
      }),
    } as any);

    const request = new Request('http://localhost/api/newsletter/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'Test@Example.COM' }),
    });

    await POST({ request } as any);

    expect(mockEq).toHaveBeenCalledWith('email', 'test@example.com');
  });
});

describe('GET /api/newsletter/unsubscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 if neither email nor token is provided', async () => {
    const request = new Request('http://localhost/api/newsletter/unsubscribe', {
      method: 'GET',
    });

    const response = await GET({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('email or token');
  });

  it('returns 200 when unsubscribing by email via GET', async () => {
    const { getServerSupabase } = await import('@/lib/supabase');
    const mockEq = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(getServerSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: mockEq,
      }),
    } as any);

    const request = new Request(
      'http://localhost/api/newsletter/unsubscribe?email=test@example.com',
      {
        method: 'GET',
      }
    );

    const response = await GET({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain('Unsubscribed');
  });

  it('returns 200 when unsubscribing by token via GET', async () => {
    const { getServerSupabase } = await import('@/lib/supabase');
    const mockEq = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(getServerSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: mockEq,
      }),
    } as any);

    const request = new Request(
      'http://localhost/api/newsletter/unsubscribe?token=valid-token',
      {
        method: 'GET',
      }
    );

    const response = await GET({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain('Unsubscribed');
  });
});
