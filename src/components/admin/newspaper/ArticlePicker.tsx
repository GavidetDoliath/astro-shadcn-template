/**
 * ArticlePicker
 * Combobox to search and select articles from database
 */

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface Article {
  id: string;
  title: string;
  excerpt?: string;
}

interface Props {
  value: string | undefined;
  onChange: (id: string, article: Article) => void;
  articles: Article[];
}

export default function ArticlePicker({ value, onChange, articles }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get selected article label
  const selectedArticle = articles.find(a => a.id === value);

  // Filter articles by search
  const filtered = articles.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));

  // Handle outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent): void => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (article: Article) => {
    onChange(article.id, article);
    setOpen(false);
    setSearch('');
  };

  const handleClear = () => {
    onChange('', { id: '', title: '' });
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Rechercher un article..."
          value={open ? search : selectedArticle?.title || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 border border-border bg-card shadow-md max-h-64 overflow-y-auto mt-1 rounded-md">
          {filtered.map(article => (
            <div
              key={article.id}
              className={`px-3 py-2 text-sm cursor-pointer border-b border-border/50 last:border-0 transition-colors ${
                value === article.id ? 'bg-primary/10' : 'hover:bg-accent'
              }`}
              onClick={() => handleSelect(article)}
            >
              <div className="font-medium">{article.title}</div>
              {article.excerpt && <div className="text-xs text-muted-foreground mt-0.5">{article.excerpt}</div>}
            </div>
          ))}
        </div>
      )}

      {open && filtered.length === 0 && search && (
        <div className="absolute top-full left-0 right-0 z-50 border border-border bg-card shadow-md px-3 py-2 text-sm text-muted-foreground mt-1 rounded-md">
          Aucun article trouvé
        </div>
      )}
    </div>
  );
}
