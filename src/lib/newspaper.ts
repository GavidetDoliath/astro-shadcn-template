/**
 * Newspaper Edition Queries
 * CRUD operations for newspaper editions via Supabase
 */

import { getServerSupabase } from '@/lib/supabase';
import type { NewspaperEdition } from '@/types/newspaper';
import { getNewspaperTemplate } from '@/lib/newspaper-templates';
import { v4 as uuidv4 } from 'uuid';

/**
 * Map database row to NewspaperEdition type
 */
function mapRow(row: any): NewspaperEdition {
  return {
    id: row.id,
    title: row.title,
    templateId: row.template_id,
    format: row.format,
    date: row.date,
    status: row.status,
    pages: row.pages || [],
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get all newspaper editions ordered by date descending
 */
export async function getNewspaperEditions(): Promise<NewspaperEdition[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('newspaper_editions')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapRow);
}

/**
 * Get single newspaper edition by ID
 */
export async function getNewspaperEditionById(id: string): Promise<NewspaperEdition | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase.from('newspaper_editions').select('*').eq('id', id).single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows found
    throw error;
  }
  return mapRow(data);
}

/**
 * Create new newspaper edition
 */
export async function createNewspaperEdition(input: {
  title: string;
  templateId?: string;
  format?: string;
  date: string;
  createdBy?: string;
}): Promise<NewspaperEdition> {
  const supabase = getServerSupabase();

  const templateId = input.templateId || 'chicago-sentinel';
  const template = getNewspaperTemplate(templateId);

  if (!template) {
    throw new Error(`Unknown template: ${templateId}`);
  }

  // Initialize with blank pages (one per template)
  const pages = template.pages.map((page, index) => ({
    id: uuidv4(),
    pageNumber: index + 1,
    templatePageId: page.id,
    zones: {},
  }));

  const { data, error } = await supabase
    .from('newspaper_editions')
    .insert({
      id: uuidv4(),
      title: input.title,
      template_id: templateId,
      format: input.format || 'A4',
      date: input.date,
      status: 'draft',
      pages,
      created_by: input.createdBy,
    })
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
}

/**
 * Update newspaper edition
 */
export async function updateNewspaperEdition(
  id: string,
  updates: Partial<NewspaperEdition>
): Promise<NewspaperEdition> {
  const supabase = getServerSupabase();

  const payload: any = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.date !== undefined) payload.date = updates.date;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.pages !== undefined) payload.pages = updates.pages;

  const { data, error } = await supabase
    .from('newspaper_editions')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
}

/**
 * Delete newspaper edition by ID
 */
export async function deleteNewspaperEdition(id: string): Promise<void> {
  const supabase = getServerSupabase();
  const { error } = await supabase.from('newspaper_editions').delete().eq('id', id);

  if (error) throw error;
}
