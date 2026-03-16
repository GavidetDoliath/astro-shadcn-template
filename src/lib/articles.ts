import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type Article = CollectionEntry<'articles'>;

interface CategoryInfo {
  name: string;
  count: number;
}

interface TagInfo {
  name: string;
  count: number;
}

/**
 * Récupère tous les articles, triés par date ou featured
 * @param limit - Nombre d'articles à retourner
 * @param sortBy - Tri ('recent' par défaut ou 'featured')
 */
export async function getArticles(
  limit?: number,
  sortBy: 'recent' | 'featured' = 'recent',
): Promise<Article[]> {
  let articles = await getCollection('articles');

  // Trier par featured ou date
  if (sortBy === 'featured') {
    articles = articles.sort((a, b) => {
      if (b.data.featured !== a.data.featured) {
        return (b.data.featured ? 1 : 0) - (a.data.featured ? 1 : 0);
      }
      return new Date(b.data.date).getTime() - new Date(a.data.date).getTime();
    });
  } else {
    articles = articles.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());
  }

  if (limit) {
    articles = articles.slice(0, limit);
  }

  return articles;
}

/**
 * Récupère un article par slug
 */
export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  return getEntry('articles', slug);
}

/**
 * Récupère les articles d'une catégorie
 */
export async function getArticlesByCategory(category: string, limit?: number): Promise<Article[]> {
  const articles = await getCollection('articles');
  let filtered = articles.filter((a) => a.data.category === category);

  filtered = filtered.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());

  if (limit) {
    filtered = filtered.slice(0, limit);
  }

  return filtered;
}

/**
 * Récupère les articles d'un tag
 */
export async function getArticlesByTag(tag: string, limit?: number): Promise<Article[]> {
  const articles = await getCollection('articles');
  let filtered = articles.filter((a) => a.data.tags.includes(tag));

  filtered = filtered.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());

  if (limit) {
    filtered = filtered.slice(0, limit);
  }

  return filtered;
}

/**
 * Retourne toutes les catégories uniques avec leur nombre d'articles
 */
export async function getCategories(): Promise<CategoryInfo[]> {
  const articles = await getCollection('articles');
  const categories = new Map<string, number>();

  articles.forEach((article) => {
    const category = article.data.category;
    categories.set(category, (categories.get(category) || 0) + 1);
  });

  return Array.from(categories.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Retourne tous les tags uniques avec leur nombre d'articles
 */
export async function getAllTags(): Promise<TagInfo[]> {
  const articles = await getCollection('articles');
  const tags = new Map<string, number>();

  articles.forEach((article) => {
    article.data.tags.forEach((tag) => {
      tags.set(tag, (tags.get(tag) || 0) + 1);
    });
  });

  return Array.from(tags.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
