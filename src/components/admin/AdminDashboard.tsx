import React, { useState, useEffect } from 'react';
import { ArticleForm, type ArticleFormData } from './ArticleForm';
import { X } from 'lucide-react';

interface Article extends ArticleFormData {
  id: string;
}

export function AdminDashboard() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load articles
  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const response = await fetch('/api/admin/articles');
      if (response.ok) {
        const data = await response.json();
        setArticles(data);
      }
    } catch (err) {
      console.error('Error loading articles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClick = () => {
    setEditingArticle(null);
    setShowModal(true);
  };

  const handleEditClick = (article: Article) => {
    setEditingArticle(article);
    setShowModal(true);
  };

  const handleSubmit = async (data: ArticleFormData) => {
    setIsSaving(true);
    try {
      const method = editingArticle ? 'PUT' : 'POST';
      const url = editingArticle ? `/api/admin/articles/${editingArticle.id}` : '/api/admin/articles';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadArticles();
        setShowModal(false);
        setEditingArticle(null);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      console.error('Error:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr? Cette action est irreversible.')) return;

    try {
      const response = await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await loadArticles();
      }
    } catch (err) {
      console.error('Error deleting article:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Articles</h1>
          <p className="mt-1 text-muted-foreground">{articles.length} articles total</p>
        </div>
        <button
          onClick={handleCreateClick}
          className="rounded-md bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Nouvel article
        </button>
      </div>

      {/* Articles Table */}
      <div className="rounded-md border border-border bg-card">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : articles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucun article. Créez-en un!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 text-left font-semibold">Titre</th>
                  <th className="px-6 py-4 text-left font-semibold">Catégorie</th>
                  <th className="px-6 py-4 text-left font-semibold">Statut</th>
                  <th className="px-6 py-4 text-left font-semibold">Date</th>
                  <th className="px-6 py-4 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.id} className="border-b border-border">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{article.title}</div>
                        <div className="text-sm text-gray-500">{article.slug}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block rounded-md bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
                        {article.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block rounded-md px-3 py-1 text-sm font-medium ${
                          article.published
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {article.published ? 'Publié' : 'Brouillon'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{article.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEditClick(article)}
                          className="rounded px-3 py-1 text-sm hover:bg-muted transition-colors"
                        >
                          ✏️ Éditer
                        </button>
                        <button
                          onClick={() => handleDelete(article.id)}
                          className="rounded px-3 py-1 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-md bg-card p-8">
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 rounded-md hover:bg-muted transition-colors"
            >
              <X size={24} />
            </button>

            {/* Form */}
            <h2 className="mb-6 text-2xl font-bold">
              {editingArticle ? 'Éditer l\'article' : 'Créer un article'}
            </h2>

            <ArticleForm
              initialData={editingArticle || undefined}
              onSubmit={handleSubmit}
              isLoading={isSaving}
              submitLabel={editingArticle ? 'Enregistrer' : 'Créer article'}
            />
          </div>
        </div>
      )}
    </div>
  );
}
