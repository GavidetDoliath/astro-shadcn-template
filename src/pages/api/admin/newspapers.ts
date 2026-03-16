/**
 * GET /api/admin/newspapers - Get all newspaper editions
 * POST /api/admin/newspapers - Create new newspaper edition
 */

export const prerender = false;

import type { APIContext } from 'astro';
import { getApiUser } from '@/lib/auth';
import {
  getNewspaperEditions,
  createNewspaperEdition,
} from '@/lib/newspaper';

export async function GET(context: APIContext) {
  const user = await getApiUser(context.request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  try {
    const editions = await getNewspaperEditions();
    return new Response(JSON.stringify(editions), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error fetching newspaper editions:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch editions' }), {
      status: 500,
    });
  }
}

export async function POST(context: APIContext) {
  const user = await getApiUser(context.request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { title, templateId, format, date } = body;

  if (!title || !date) {
    return new Response(JSON.stringify({ error: 'Missing required fields: title, date' }), {
      status: 400,
    });
  }

  try {
    const edition = await createNewspaperEdition({
      title,
      templateId: templateId || 'chicago-sentinel',
      format: format || 'A4',
      date,
      createdBy: user.id,
    });

    return new Response(JSON.stringify(edition), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error creating newspaper edition:', err);
    return new Response(JSON.stringify({ error: 'Failed to create edition' }), {
      status: 500,
    });
  }
}
