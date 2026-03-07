import { useState } from 'react';
import type { UserProfile } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit2, Plus } from 'lucide-react';
import UserForm from './UserForm';

interface User {
  id: string;
  email: string;
  role: string;
  display_name?: string;
  created_at: string;
  confirmed_at?: string;
  stripe_subscription_status?: string;
}

interface Props {
  initialUsers: User[];
}

export default function UsersList({ initialUsers }: Props) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr? Cette action est irreversible.')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });

      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
      } else {
        const data = (await res.json()) as { error?: string };
        setError(data.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (savedUser: User) => {
    if (editingUser) {
      // Update existing
      setUsers(users.map(u => (u.id === savedUser.id ? savedUser : u)));
      setEditingUser(null);
    } else {
      // Add new
      setUsers([savedUser, ...users]);
    }
    setShowForm(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'redacteur':
        return 'bg-blue-100 text-blue-800';
      case 'subscriber_paid':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'redacteur':
        return 'Rédacteur';
      case 'subscriber_paid':
        return 'Payant';
      case 'subscriber_free':
        return 'Gratuit';
      default:
        return role;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Utilisateurs ({users.length})</h2>
        <Button
          onClick={() => {
            setEditingUser(null);
            setShowForm(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouvel utilisateur
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">Nom</th>
              <th className="px-4 py-3 text-left font-semibold">Rôle</th>
              <th className="px-4 py-3 text-left font-semibold">Créé</th>
              <th className="px-4 py-3 text-left font-semibold">Confirmé</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr
                key={user.id}
                className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="px-4 py-3 font-mono text-xs">{user.email}</td>
                <td className="px-4 py-3 text-sm">{user.display_name || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {formatDate(user.created_at)}
                </td>
                <td className="px-4 py-3 text-xs">
                  {user.confirmed_at ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setShowForm(true);
                      }}
                      className="p-1 text-gray-600 hover:text-blue-600 transition"
                      title="Modifier"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={loading}
                      className="p-1 text-gray-600 hover:text-red-600 transition disabled:opacity-50"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <UserForm
          user={editingUser}
          onClose={() => {
            setShowForm(false);
            setEditingUser(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
