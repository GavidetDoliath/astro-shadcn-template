/**
 * GET /api/admin/newspapers/[id] - Get single newspaper edition
 * PUT /api/admin/newspapers/[id] - Update newspaper edition
 * DELETE /api/admin/newspapers/[id] - Delete newspaper edition
 */

export const prerender = false;

import type { APIContext } from 'astro';
import { getApiUser } from '@/lib/auth';
import {
  getNewspaperEditionById,
  updateNewspaperEdition,
  deleteNewspaperEdition,
} from '@/lib/newspaper';

export async function GET(context: APIContext) {
  const user = await getApiUser(context.request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  const { id } = context.params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400 });
  }

  try {
    const edition = await getNewspaperEditionById(id);
    if (!edition) {
      return new Response(JSON.stringify({ error: 'Edition not found' }), { status: 404 });
    }

    return new Response(JSON.stringify(edition), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error fetching newspaper edition:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch edition' }), {
      status: 500,
    });
  }
}

export async function PUT(context: APIContext) {
  const user = await getApiUser(context.request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  const { id } = context.params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400 });
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  try {
    const edition = await updateNewspaperEdition(id, body);
    return new Response(JSON.stringify(edition), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error updating newspaper edition:', err);
    return new Response(JSON.stringify({ error: 'Failed to update edition' }), {
      status: 500,
    });
  }
}

export async function DELETE(context: APIContext) {
  const user = await getApiUser(context.request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  const { id } = context.params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400 });
  }

  try {
    await deleteNewspaperEdition(id);
    return new Response(null, { status: 204 });
  } catch (err: any) {
    console.error('Error deleting newspaper edition:', err);
    return new Response(JSON.stringify({ error: 'Failed to delete edition' }), {
      status: 500,
    });
  }
}
