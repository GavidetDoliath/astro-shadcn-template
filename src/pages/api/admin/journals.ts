import type { APIContext } from 'astro';
import { getApiUser as getUser } from '@/lib/auth';
import { getJournals, createJournal } from '@/lib/journals';

export const prerender = false;

export async function GET(context: APIContext) {
  const user = await getUser(context.request);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  if (user.role !== 'admin') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  try {
    const journals = await getJournals();
    return new Response(JSON.stringify(journals), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}

export async function POST(context: APIContext) {
  const user = await getUser(context.request);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  if (user.role !== 'admin') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  let body;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { title, issueNumber, date, status, content } = body;
  if (!title || !date) {
    return new Response(JSON.stringify({ error: 'title and date are required' }), { status: 400 });
  }

  try {
    const journal = await createJournal({
      title,
      issueNumber,
      date,
      status: status ?? 'draft',
      content: content ?? { pages: [] },
      createdBy: user.id,
    });
    return new Response(JSON.stringify(journal), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
