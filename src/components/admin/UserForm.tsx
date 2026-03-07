import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: string;
  display_name?: string;
  created_at: string;
}

interface Props {
  user: User | null; // null = create mode
  onClose: () => void;
  onSave: (user: User) => void;
}

export default function UserForm({ user, onClose, onSave }: Props) {
  const isEdit = user !== null;
  const [form, setForm] = useState({
    email: user?.email ?? '',
    password: '',
    fullName: user?.display_name ?? '',
    role: user?.role ?? ('subscriber_free' as const),
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!form.email) {
        throw new Error('Email is required');
      }
      if (!isEdit && !form.password) {
        throw new Error('Password is required for new users');
      }
      if (form.password && form.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const method = isEdit ? 'PUT' : 'POST';
      const url = isEdit ? `/api/admin/users/${user?.id}` : '/api/admin/users';

      const body: Record<string, any> = {
        email: form.email,
        role: form.role,
        fullName: form.fullName,
      };

      // Only include password on create or if changed
      if (!isEdit) {
        body.password = form.password;
      } else if (form.password) {
        body.password = form.password;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      const saved = (await res.json()) as User;
      onSave(saved);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur réseau';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent style={{ maxWidth: '500px' }}>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '0.375rem' }}>
              <AlertCircle style={{ height: '1.25rem', width: '1.25rem', color: '#dc2626', flexShrink: 0 }} />
              <p style={{ fontSize: '0.875rem', color: '#991b1b' }}>{error}</p>
            </div>
          )}

          <div>
            <Label htmlFor="email">Email *</Label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              disabled={isEdit || loading}
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
            <Label htmlFor="fullName">Nom complet</Label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={handleChange}
              disabled={loading}
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
            <Label htmlFor="password">
              {isEdit ? 'Mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *'}
            </Label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              disabled={loading}
              required={!isEdit}
              placeholder={isEdit ? 'Laisser vide pour ne pas changer' : 'Minimum 6 caractères'}
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
            <Label htmlFor="role">Rôle *</Label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              disabled={loading}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                marginTop: '0.25rem',
                border: '1px solid var(--encre)',
                borderRadius: '0.25rem',
              }}
            >
              <option value="admin">Admin (accès complet)</option>
              <option value="redacteur">Rédacteur (gestion articles)</option>
              <option value="subscriber_paid">Abonné payant</option>
              <option value="subscriber_free">Abonné gratuit</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 style={{ height: '1rem', width: '1rem', marginRight: '0.5rem', animation: 'spin 1s linear infinite' }} />
                  {isEdit ? 'Enregistrement...' : 'Création...'}
                </>
              ) : isEdit ? (
                'Enregistrer'
              ) : (
                'Créer'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
