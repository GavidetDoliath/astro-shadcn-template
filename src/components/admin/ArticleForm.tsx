import React, { useState } from 'react';
import { RichTextEditor } from './RichTextEditor';

export interface ArticleFormData {
  title: string;
  excerpt: string;
  content: string;
  date: string;
  category: 'lettre' | 'pamphlet' | 'fosse';
  image: string;
  slug: string;
  author: string;
  linkedinUrl: string;
  featured: boolean;
  published: boolean;
  accessLevel: 'public' | 'subscriber_free' | 'subscriber_paid';
}

interface ArticleFormProps {
  initialData?: Partial<ArticleFormData>;
  onSubmit: (data: ArticleFormData) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function ArticleForm({
  initialData = {},
  onSubmit,
  isLoading = false,
  submitLabel = 'Créer article',
}: ArticleFormProps) {
  const [formData, setFormData] = useState<ArticleFormData>({
    title: initialData.title || '',
    excerpt: initialData.excerpt || '',
    content: initialData.content || '',
    date: initialData.date || new Date().toISOString().split('T')[0],
    category: initialData.category || 'lettre',
    image: initialData.image || '',
    slug: initialData.slug || '',
    author: initialData.author || '',
    linkedinUrl: initialData.linkedinUrl || '',
    featured: initialData.featured || false,
    published: initialData.published !== false,
    accessLevel: initialData.accessLevel || 'public',
  });

  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    handleInputChange(e);
    if (!formData.slug || formData.slug === generateSlug(initialData.title || '')) {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(title),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Le titre est requis');
      return;
    }
    if (!formData.slug.trim()) {
      setError('Le slug est requis');
      return;
    }
    if (!formData.content.trim()) {
      setError('Le contenu est requis');
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Row 1: Title and Author */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="title" className="block text-sm font-medium">
            Titre *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleTitleChange}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
            required
          />
        </div>
        <div>
          <label htmlFor="author" className="block text-sm font-medium">
            Auteur
          </label>
          <input
            type="text"
            id="author"
            name="author"
            value={formData.author}
            onChange={handleInputChange}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
      </div>

      {/* Row 2: Slug and Date */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="slug" className="block text-sm font-medium">
            Slug (URL) *
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            value={formData.slug}
            onChange={handleInputChange}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
            required
          />
          <p className="mt-1 text-xs text-gray-500">Auto-généré depuis le titre</p>
        </div>
        <div>
          <label htmlFor="date" className="block text-sm font-medium">
            Date de publication *
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
            required
          />
        </div>
      </div>

      {/* Row 3: Category and Access Level */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="category" className="block text-sm font-medium">
            Catégorie *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
            required
          >
            <option value="lettre">Lettre</option>
            <option value="pamphlet">Pamphlet</option>
            <option value="fosse">Fosse</option>
          </select>
        </div>
        <div>
          <label htmlFor="accessLevel" className="block text-sm font-medium">
            Accès *
          </label>
          <select
            id="accessLevel"
            name="accessLevel"
            value={formData.accessLevel}
            onChange={handleInputChange}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
            required
          >
            <option value="public">Public</option>
            <option value="subscriber_free">Abonné gratuit</option>
            <option value="subscriber_paid">Abonné payant</option>
          </select>
        </div>
      </div>

      {/* Excerpt */}
      <div>
        <label htmlFor="excerpt" className="block text-sm font-medium">
          Extrait (résumé court)
        </label>
        <textarea
          id="excerpt"
          name="excerpt"
          value={formData.excerpt}
          onChange={handleInputChange}
          rows={3}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          placeholder="Résumé de l'article"
        />
      </div>

      {/* Image URL */}
      <div>
        <label htmlFor="image" className="block text-sm font-medium">
          URL Image
        </label>
        <input
          type="url"
          id="image"
          name="image"
          value={formData.image}
          onChange={handleInputChange}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          placeholder="https://..."
        />
      </div>

      {/* LinkedIn URL */}
      <div>
        <label htmlFor="linkedinUrl" className="block text-sm font-medium">
          URL LinkedIn (source)
        </label>
        <input
          type="url"
          id="linkedinUrl"
          name="linkedinUrl"
          value={formData.linkedinUrl}
          onChange={handleInputChange}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          placeholder="https://linkedin.com/pulse/..."
        />
      </div>

      {/* Rich Text Editor */}
      <div>
        <label className="block text-sm font-medium">Contenu de l'article *</label>
        <RichTextEditor
          value={formData.content}
          onChange={(html) => setFormData((prev) => ({ ...prev, content: html }))}
          placeholder="Écrivez votre article ici..."
        />
      </div>

      {/* Checkboxes */}
      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="featured"
            checked={formData.featured}
            onChange={handleInputChange}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm font-medium">En avant (featured)</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="published"
            checked={formData.published}
            onChange={handleInputChange}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm font-medium">Publié</span>
        </label>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="rounded-lg border border-gray-300 px-6 py-2 font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Sauvegarde...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
