/**
 * NewspaperList
 * Displays table of newspaper editions with CRUD actions
 */

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { NewspaperEdition } from '@/types/newspaper';
import { getAvailableTemplates } from '@/lib/newspaper-templates';

interface CreateFormData {
  title: string;
  date: string;
  templateId: string;
}

export default function NewspaperList() {
  const [editions, setEditions] = useState<NewspaperEdition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormData>({ title: '', date: '', templateId: 'chicago-sentinel' });
  const [creatingEdition, setCreatingEdition] = useState(false);

  // Load editions on mount
  useEffect(() => {
    async function loadEditions() {
      try {
        const response = await fetch('/api/admin/newspapers');
        if (!response.ok) throw new Error('Failed to load editions');
        const data = await response.json();
        setEditions(data);
      } catch (err) {
        console.error('Error loading editions:', err);
      } finally {
        setLoading(false);
      }
    }

    loadEditions();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title || !createForm.date) return;

    setCreatingEdition(true);
    try {
      const response = await fetch('/api/admin/newspapers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createForm.title,
          date: createForm.date,
          templateId: createForm.templateId,
          format: 'A4',
        }),
      });

      if (!response.ok) throw new Error('Failed to create edition');
      const edition = await response.json();

      setEditions([edition, ...editions]);
      setShowCreateDialog(false);
      setCreateForm({ title: '', date: '', templateId: 'chicago-sentinel' });

      // Redirect to editor
      window.location.href = `/admin/newspaper-editor?id=${edition.id}`;
    } catch (err) {
      console.error('Error creating edition:', err);
      alert('Erreur lors de la création de l\'édition');
    } finally {
      setCreatingEdition(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette édition ?')) return;

    try {
      const response = await fetch(`/api/admin/newspapers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete edition');
      setEditions(editions.filter(e => e.id !== id));
    } catch (err) {
      console.error('Error deleting edition:', err);
      alert('Erreur lors de la suppression de l\'édition');
    }
  };

  if (loading) {
    return <div className="p-4">Chargement...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Éditions</h1>
          <p className="mt-1 text-muted-foreground">Gérez vos éditions de journal</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          + Créer une édition
        </Button>
      </div>

      {editions.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <p>Aucune édition créée. Commencez par en créer une.</p>
        </div>
      ) : (
        <div className="rounded-md border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-4 text-left font-semibold">Titre</th>
                <th className="px-6 py-4 text-left font-semibold">Date</th>
                <th className="px-6 py-4 text-left font-semibold">Statut</th>
                <th className="px-6 py-4 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {editions.map(edition => (
                <tr key={edition.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">{edition.title}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(edition.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 text-sm font-medium rounded ${
                        edition.status === 'ready'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {edition.status === 'ready' ? 'Prêt' : 'Brouillon'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => (window.location.href = `/admin/newspaper-editor?id=${edition.id}`)}
                        className="rounded px-3 py-1 text-sm hover:bg-accent transition-colors"
                      >
                        Éditer
                      </button>
                      <button
                        onClick={() => handleDelete(edition.id)}
                        className="rounded px-3 py-1 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une nouvelle édition</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Titre de l'édition
              </label>
              <Input
                id="title"
                type="text"
                placeholder="ex: Printemps 2026"
                value={createForm.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateForm({ ...createForm, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium mb-1">
                Date de publication
              </label>
              <Input
                id="date"
                type="date"
                value={createForm.date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateForm({ ...createForm, date: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="template" className="block text-sm font-medium mb-1">
                Modèle de journal
              </label>
              <select
                id="template"
                value={createForm.templateId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCreateForm({ ...createForm, templateId: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {getAvailableTemplates().map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} — {template.description}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={creatingEdition}>
                {creatingEdition ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
