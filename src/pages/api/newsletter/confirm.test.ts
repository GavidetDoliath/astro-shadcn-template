import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './confirm';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  getServerSupabase: vi.fn(),
}));

describe('GET /api/newsletter/confirm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 if token is missing', async () => {
    const request = new Request('http://localhost/api/newsletter/confirm', {
      method: 'GET',
    });

    const response = await GET({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Token');
  });

  it('returns 404 if token is not found in database', async () => {
    const { getServerSupabase } = await import('@/lib/supabase');
    vi.mocked(getServerSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Not found'),
        }),
      }),
    } as any);

    const request = new Request(
      'http://localhost/api/newsletter/confirm?token=unknown-token',
      {
        method: 'GET',
      }
    );

    const response = await GET({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('Invalid');
  });

  it('returns 400 if token has expired', async () => {
    const { getServerSupabase } = await import('@/lib/supabase');
    const expiredDate = new Date(Date.now() - 1000).toISOString(); // 1 second ago

    vi.mocked(getServerSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'sub-1',
            email: 'test@example.com',
            status: 'pending',
            confirmation_token: 'valid-token',
            token_expires_at: expiredDate,
          },
          error: null,
        }),
      }),
    } as any);

    const request = new Request(
      'http://localhost/api/newsletter/confirm?token=valid-token',
      {
        method: 'GET',
      }
    );

    const response = await GET({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('expired');
  });

  it('returns 200 and confirms subscription with valid token', async () => {
    const { getServerSupabase } = await import('@/lib/supabase');
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    vi.mocked(getServerSupabase).mockReturnValue({
      from: vi.fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'sub-1',
              email: 'test@example.com',
              status: 'pending',
              confirmation_token: 'valid-token',
              token_expires_at: futureDate,
            },
            error: null,
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
    } as any);

    const request = new Request(
      'http://localhost/api/newsletter/confirm?token=valid-token',
      {
        method: 'GET',
      }
    );

    const response = await GET({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain('confirmed');
  });

  it('returns 500 if update fails', async () => {
    const { getServerSupabase } = await import('@/lib/supabase');
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    vi.mocked(getServerSupabase).mockReturnValue({
      from: vi.fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'sub-1',
              email: 'test@example.com',
              status: 'pending',
              confirmation_token: 'valid-token',
              token_expires_at: futureDate,
            },
            error: null,
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            error: new Error('Database error'),
          }),
        }),
    } as any);

    const request = new Request(
      'http://localhost/api/newsletter/confirm?token=valid-token',
      {
        method: 'GET',
      }
    );

    const response = await GET({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Failed');
  });
});
