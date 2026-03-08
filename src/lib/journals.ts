import { getServerSupabase } from '@/lib/supabase';
import type { Journal, JournalContent } from '@/types/journal';

function mapRow(row: Record<string, unknown>): Journal {
  return {
    id: row.id as string,
    title: row.title as string,
    issueNumber: row.issue_number as number | undefined,
    date: row.date as string,
    status: row.status as Journal['status'],
    content: (row.content as JournalContent) ?? { pages: [] },
    createdBy: row.created_by as string | undefined,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

export async function getJournals(): Promise<Journal[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase.from('journals').select('*').order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function getJournalById(id: string): Promise<Journal | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase.from('journals').select('*').eq('id', id).single();
  if (error) return null;
  return mapRow(data);
}

export async function createJournal(journal: Omit<Journal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Journal> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('journals')
    .insert({
      title: journal.title,
      issue_number: journal.issueNumber ?? null,
      date: journal.date,
      status: journal.status,
      content: journal.content,
      created_by: journal.createdBy ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data);
}

export async function updateJournal(id: string, updates: Partial<Journal>): Promise<Journal> {
  const supabase = getServerSupabase();
  const payload: Record<string, unknown> = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.issueNumber !== undefined) payload.issue_number = updates.issueNumber;
  if (updates.date !== undefined) payload.date = updates.date;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.content !== undefined) payload.content = updates.content;
  payload.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from('journals').update(payload).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return mapRow(data);
}

export async function deleteJournal(id: string): Promise<void> {
  const supabase = getServerSupabase();
  const { error } = await supabase.from('journals').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
