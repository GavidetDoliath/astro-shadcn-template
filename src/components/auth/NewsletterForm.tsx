import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Loader2, Check, AlertCircle } from 'lucide-react';

export interface NewsletterFormProps {
  onSuccess?: (email: string) => void;
  className?: string;
  buttonVariant?: 'default' | 'outline' | 'ghost';
}

export function NewsletterForm({
  onSuccess,
  className = '',
  buttonVariant = 'default',
}: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json() as Record<string, any>;

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Vérifiez votre e-mail pour confirmer votre inscription.');
        setEmail('');
        onSuccess?.(email);
      } else {
        setStatus('error');
        setMessage(data.error || 'Une erreur est survenue. Veuillez réessayer.');
      }
    } catch (err) {
      console.error('Newsletter subscription error:', err);
      setStatus('error');
      setMessage('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`w-full ${className}`}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || status === 'success'}
            required
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
          />
          <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        </div>
        <Button
          type="submit"
          disabled={loading || !email.trim() || status === 'success'}
          variant={buttonVariant}
          className="px-6"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : status === 'success' ? (
            <Check className="h-4 w-4" />
          ) : (
            'S\'abonner'
          )}
        </Button>
      </div>

      {message && (
        <div
          className={`mt-3 px-4 py-3 rounded-lg flex gap-2 items-start ${
            status === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {status === 'error' && <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />}
          {status === 'success' && <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />}
          <p className="text-sm">{message}</p>
        </div>
      )}
    </form>
  );
}
