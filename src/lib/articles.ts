// src/lib/articles.ts
import { supabase } from '../db/supabase';

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: 'lettre' | 'pamphlet' | 'fosse';
  image: string;
  slug: string;
  author?: string;
  linkedinUrl?: string;
  featured?: boolean;
  published?: boolean;
}

/**
 * Récupère les articles depuis Supabase
 * @param limit - Nombre d'articles à retourner
 * @param sortBy - Tri ('recent' par défaut)
 */
export async function getArticles(limit?: number, sortBy: 'recent' | 'featured' = 'recent'): Promise<Article[]> {
  let query = supabase
    .from('articles')
    .select('*')
    .eq('published', true);

  // Tri par featured ou date
  if (sortBy === 'featured') {
    query = query.order('featured', { ascending: false }).order('date', { ascending: false });
  } else {
    query = query.order('date', { ascending: false });
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Supabase error (getArticles):', error);
    return [];
  }

  return (data || []) as Article[];
}

/**
 * Récupère un article par slug
 */
export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (error) {
    console.error('Supabase error (getArticleBySlug):', error);
    return undefined;
  }

  return data as Article;
}

/**
 * Récupère les articles par catégorie
 */
export async function getArticlesByCategory(
  category: 'lettre' | 'pamphlet' | 'fosse',
  limit?: number,
): Promise<Article[]> {
  let query = supabase
    .from('articles')
    .select('*')
    .eq('category', category)
    .eq('published', true)
    .order('date', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Supabase error (getArticlesByCategory):', error);
    return [];
  }

  return (data || []) as Article[];
}
