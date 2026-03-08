import type { APIContext } from 'astro';
import { getApiUser as getUser } from '@/lib/auth';
import { getJournalById, updateJournal, deleteJournal } from '@/lib/journals';

export const prerender = false;

export async function GET(context: APIContext) {
  const user = await getUser(context.request);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  if (user.role !== 'admin') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const id = context.params.id as string;
  const journal = await getJournalById(id);
  if (!journal) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

  return new Response(JSON.stringify(journal), { headers: { 'Content-Type': 'application/json' } });
}

export async function PUT(context: APIContext) {
  const user = await getUser(context.request);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  if (user.role !== 'admin') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const id = context.params.id as string;
  let body;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  try {
    const journal = await updateJournal(id, body);
    return new Response(JSON.stringify(journal), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}

export async function DELETE(context: APIContext) {
  const user = await getUser(context.request);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  if (user.role !== 'admin') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const id = context.params.id as string;
  try {
    await deleteJournal(id);
    return new Response(null, { status: 204 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
