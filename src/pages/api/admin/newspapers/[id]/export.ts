/**
 * POST /api/admin/newspapers/[id]/export
 * Server-side PDF export using Playwright (optional)
 * Falls back to client-side if unavailable
 */

export const prerender = false;

import type { APIContext } from 'astro';
import { getApiUser } from '@/lib/auth';

export async function POST(context: APIContext) {
  const user = await getApiUser(context.request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  const { id } = context.params;

  try {
    // Try to use Playwright if available
    // This requires: npm install playwright
    // For now, we return 501 to trigger client-side export
    return new Response(
      JSON.stringify({
        error: 'Server-side export not available. Using client-side export.',
      }),
      { status: 501 }
    );

    // TODO: Implement Playwright export if needed:
    // const browser = await chromium.launch();
    // const page = await browser.newPage();
    // await page.goto(`http://localhost:4000/admin/newspaper-preview?id=${id}`);
    // const pdf = await page.pdf({ format: 'A4' });
    // await browser.close();
    // return new Response(pdf, { headers: { 'Content-Type': 'application/pdf' } });
  } catch (err: any) {
    console.error('Error exporting PDF:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to export PDF' }),
      { status: 500 }
    );
  }
}
