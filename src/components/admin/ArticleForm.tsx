import { useState } from 'react';
import type { Article } from '@/lib/articles';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface Props {
  article: Article | null; // null = create mode
  onClose: () => void;
  onSave: (article: Article) => void;
}

export default function ArticleForm({ article, onClose, onSave }: Props) {
  const isEdit = article !== null;
  const [form, setForm] = useState({
    title: article?.title ?? '',
    excerpt: article?.excerpt ?? '',
    date: article?.date ?? new Date().toISOString().split('T')[0],
    category: article?.category ?? ('lettre' as const),
    access_level: article?.access_level ?? ('public' as const),
    slug: article?.slug ?? '',
    author: article?.author ?? '',
    linkedinUrl: article?.linkedinUrl ?? '',
    image: article?.image ?? '',
    featured: article?.featured ?? false,
    published: article?.published ?? false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSwitchChange = (name: 'featured' | 'published') => {
    setForm((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const method = isEdit ? 'PUT' : 'POST';
      const url = isEdit ? `/api/admin/articles/${article?.id}` : '/api/admin/articles';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error || 'Erreur lors de la sauvegarde');
        setLoading(false);
        return;
      }

      const saved = (await res.json()) as Article;
      onSave(saved);
    } catch (err) {
      console.error('Submit error:', err);
      setError('Erreur réseau');
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent style={{ maxWidth: '600px' }}>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'article" : 'Nouvel article'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <Label htmlFor="title">Titre *</Label>
            <input
              id="title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                marginTop: '0.25rem',
                border: '1px solid var(--encre)',
                borderRadius: '0.25rem',
              }}
            />
          </div>

          <div>
            <Label htmlFor="excerpt">Extrait</Label>
            <textarea
              id="excerpt"
              name="excerpt"
              value={form.excerpt}
              onChange={handleChange}
              rows={3}
              style={{
                width: '100%',
                padding: '0.5rem',
                marginTop: '0.25rem',
                border: '1px solid var(--encre)',
                borderRadius: '0.25rem',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <Label htmlFor="date">Date *</Label>
              <input
                id="date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  marginTop: '0.25rem',
                  border: '1px solid var(--encre)',
                  borderRadius: '0.25rem',
                }}
              />
            </div>

            <div>
              <Label htmlFor="category">Catégorie *</Label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  marginTop: '0.25rem',
                  border: '1px solid var(--encre)',
                  borderRadius: '0.25rem',
                }}
              >
                <option value="lettre">Lettre</option>
                <option value="pamphlet">Pamphlet</option>
                <option value="fosse">Fosse</option>
              </select>
            </div>

            <div>
              <Label htmlFor="access_level">Accès</Label>
              <select
                id="access_level"
                name="access_level"
                value={form.access_level}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  marginTop: '0.25rem',
                  border: '1px solid var(--encre)',
                  borderRadius: '0.25rem',
                }}
              >
                <option value="public">Public</option>
                <option value="subscriber_free">Abonné gratuit</option>
                <option value="subscriber_paid">Abonné payant</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="slug">Slug *</Label>
            <input
              id="slug"
              name="slug"
              type="text"
              value={form.slug}
              onChange={handleChange}
              required
              placeholder="article-slug"
              style={{
                width: '100%',
                padding: '0.5rem',
                marginTop: '0.25rem',
                border: '1px solid var(--encre)',
                borderRadius: '0.25rem',
              }}
            />
          </div>

          <div>
            <Label htmlFor="image">Image URL</Label>
            <input
              id="image"
              name="image"
              type="url"
              value={form.image}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.5rem',
                marginTop: '0.25rem',
                border: '1px solid var(--encre)',
                borderRadius: '0.25rem',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <Label htmlFor="author">Auteur</Label>
              <input
                id="author"
                name="author"
                type="text"
                value={form.author}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  marginTop: '0.25rem',
                  border: '1px solid var(--encre)',
                  borderRadius: '0.25rem',
                }}
              />
            </div>

            <div>
              <Label htmlFor="linkedinUrl">URL LinkedIn</Label>
              <input
                id="linkedinUrl"
                name="linkedinUrl"
                type="url"
                value={form.linkedinUrl}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  marginTop: '0.25rem',
                  border: '1px solid var(--encre)',
                  borderRadius: '0.25rem',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Switch
                id="featured"
                checked={form.featured}
                onCheckedChange={() => handleSwitchChange('featured')}
              />
              <Label htmlFor="featured">À la une</Label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Switch
                id="published"
                checked={form.published}
                onCheckedChange={() => handleSwitchChange('published')}
              />
              <Label htmlFor="published">Publié</Label>
            </div>
          </div>

          {error && <p style={{ color: 'var(--sang)', fontSize: '0.875rem' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (isEdit ? 'Enregistrement...' : 'Création...') : isEdit ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
