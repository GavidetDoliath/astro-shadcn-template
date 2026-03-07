import { useState } from 'react';
import type { Article } from '@/lib/articles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import ArticleForm from './ArticleForm';
import { Trash2, Edit2 } from 'lucide-react';

interface Props {
  initialArticles: Article[];
}

export default function ArticlesList({ initialArticles }: Props) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const togglePublished = async (id: string, current: boolean) => {
    // Optimistic update
    setArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, published: !current } : a))
    );

    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !current }),
      });

      if (!res.ok) {
        // Revert on failure
        setArticles((prev) =>
          prev.map((a) => (a.id === id ? { ...a, published: current } : a))
        );
      }
    } catch (err) {
      console.error('Error toggling published:', err);
      // Revert on failure
      setArticles((prev) =>
        prev.map((a) => (a.id === id ? { ...a, published: current } : a))
      );
    }
  };

  const deleteArticle = async (id: string) => {
    if (!confirm('Supprimer cet article ?')) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' });

      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.id !== id));
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Error deleting article:', err);
      alert('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    setEditingArticle(null);
    setShowForm(true);
  };

  const handleSave = (savedArticle: Article) => {
    if (editingArticle) {
      setArticles((prev) =>
        prev.map((a) => (a.id === savedArticle.id ? savedArticle : a))
      );
    } else {
      setArticles((prev) => [savedArticle, ...prev]);
    }
    setShowForm(false);
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Button onClick={handleCreateClick}>+ Nouvel article</Button>
      </div>

      {articles.length === 0 ? (
        <p>Aucun article pour le moment.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: 'var(--parchemin)',
              border: '1px solid var(--encre)',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid var(--encre)' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Titre</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Catégorie</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Publié</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article, idx) => (
                <tr
                  key={article.id}
                  style={{
                    borderBottom: '1px solid var(--encre)',
                    backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)',
                  }}
                >
                  <td style={{ padding: '1rem' }}>{article.title}</td>
                  <td style={{ padding: '1rem' }}>
                    <Badge>{article.category}</Badge>
                  </td>
                  <td style={{ padding: '1rem' }}>{article.date}</td>
                  <td
                    style={{
                      padding: '1rem',
                      textAlign: 'center',
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    <Switch
                      checked={article.published ?? false}
                      onCheckedChange={() =>
                        togglePublished(article.id, article.published ?? false)
                      }
                    />
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        justifyContent: 'center',
                      }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingArticle(article);
                          setShowForm(true);
                        }}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteArticle(article.id)}
                        disabled={loading}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ArticleForm
          article={editingArticle}
          onClose={() => setShowForm(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
