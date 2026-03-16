/**
 * ZoneInspector
 * Contextual form for editing zone content
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ArticlePicker from './ArticlePicker';
import type { NewspaperZone, ZoneContent, ArticleContent } from '@/types/newspaper';

interface Article {
  id: string;
  title: string;
  excerpt?: string;
}

interface Props {
  zone: NewspaperZone | null;
  content: ZoneContent | undefined;
  articles: Article[];
  onChange: (zoneId: string, content: ZoneContent) => void;
}

export default function ZoneInspector({ zone, content, articles, onChange }: Props) {
  const [articleMode, setArticleMode] = useState<'db' | 'free'>('db');

  useEffect(() => {
    if (content?.type === 'article' && content.data.mode) {
      setArticleMode(content.data.mode);
    }
  }, [content]);

  if (!zone) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-muted-foreground italic">
        ← Cliquer sur une zone pour l'éditer
      </div>
    );
  }

  const renderMastheadForm = () => {
    const data = (content?.type === 'masthead' ? content.data : {}) as any;
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Titre du journal</label>
          <Input
            type="text"
            value={data.journalTitle || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange(zone.id, {
                type: 'masthead',
                data: { ...data, journalTitle: e.target.value },
              })
            }
            placeholder="THE CHICAGO SENTINEL"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Date</label>
          <Input
            type="text"
            value={data.date || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange(zone.id, {
                type: 'masthead',
                data: { ...data, date: e.target.value },
              })
            }
            placeholder="jeudi 6 mars 2026"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Tagline</label>
          <Input
            type="text"
            value={data.tagline || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange(zone.id, {
                type: 'masthead',
                data: { ...data, tagline: e.target.value },
              })
            }
            placeholder="Un journal de réflexion"
          />
        </div>
      </div>
    );
  };

  const renderMetaForm = () => {
    const data = (content?.type === 'meta' ? content.data : {}) as any;
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Texte</label>
          <Input
            type="text"
            value={data.text || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange(zone.id, {
                type: 'meta',
                data: { text: e.target.value },
              })
            }
            placeholder="Vol. 12, n°1"
          />
        </div>
      </div>
    );
  };

  const renderArticleForm = () => {
    const data = (content?.type === 'article' ? content.data : {}) as ArticleContent;
    return (
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={articleMode === 'db' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setArticleMode('db')}
          >
            Depuis DB
          </Button>
          <Button
            type="button"
            variant={articleMode === 'free' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setArticleMode('free')}
          >
            Texte libre
          </Button>
        </div>

        {articleMode === 'db' ? (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Article</label>
            <ArticlePicker
              value={data.articleId}
              onChange={(id, article) => {
                onChange(zone.id, {
                  type: 'article',
                  data: {
                    mode: 'db',
                    articleId: id,
                    headline: article.title,
                    sectionLabel: data.sectionLabel || zone.sectionTag,
                  },
                });
              }}
              articles={articles}
            />
          </div>
        ) : (
          <>
            {zone.sectionTag && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium">Section</label>
                <Input
                  type="text"
                  value={data.sectionLabel || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onChange(zone.id, {
                      type: 'article',
                      data: { ...data, mode: 'free', sectionLabel: e.target.value },
                    })
                  }
                  placeholder={zone.sectionTag}
                />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium">Titre</label>
              <Input
                type="text"
                value={data.headline || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChange(zone.id, {
                    type: 'article',
                    data: { ...data, mode: 'free', headline: e.target.value },
                  })
                }
                placeholder="Article Headline"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium">Sous-titre</label>
              <Input
                type="text"
                value={data.subheadline || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChange(zone.id, {
                    type: 'article',
                    data: { ...data, mode: 'free', subheadline: e.target.value },
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium">Auteur</label>
              <Input
                type="text"
                value={data.byline || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChange(zone.id, {
                    type: 'article',
                    data: { ...data, mode: 'free', byline: e.target.value },
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium">Corps de texte (HTML)</label>
              <textarea
                value={data.body || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  onChange(zone.id, {
                    type: 'article',
                    data: { ...data, mode: 'free', body: e.target.value },
                  })
                }
                placeholder="<p>Article body...</p>"
                rows={4}
                className="rounded border border-border bg-background px-2 py-1 font-mono text-sm"
              />
            </div>
          </>
        )}
      </div>
    );
  };

  const renderImageForm = () => {
    const data = (content?.type === 'image' ? content.data : {}) as any;
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">URL de l'image</label>
          <Input
            type="text"
            value={data.imageUrl || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange(zone.id, {
                type: 'image',
                data: { ...data, imageUrl: e.target.value },
              })
            }
            placeholder="https://..."
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Légende</label>
          <Input
            type="text"
            value={data.caption || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange(zone.id, {
                type: 'image',
                data: { ...data, caption: e.target.value },
              })
            }
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Alt text</label>
          <Input
            type="text"
            value={data.alt || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange(zone.id, {
                type: 'image',
                data: { ...data, alt: e.target.value },
              })
            }
          />
        </div>
      </div>
    );
  };

  const renderTeaserForm = () => {
    const data = (content?.type === 'teaser' ? content.data : {}) as any;
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Titre</label>
          <Input
            type="text"
            value={data.headline || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange(zone.id, {
                type: 'teaser',
                data: { ...data, headline: e.target.value },
              })
            }
            placeholder="Teaser headline"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Résumé</label>
          <Input
            type="text"
            value={data.summary || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange(zone.id, {
                type: 'teaser',
                data: { ...data, summary: e.target.value },
              })
            }
            placeholder="Article summary..."
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Référence page</label>
          <Input
            type="text"
            value={data.pageRef || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange(zone.id, {
                type: 'teaser',
                data: { ...data, pageRef: e.target.value },
              })
            }
            placeholder="PAGE 10"
          />
        </div>
      </div>
    );
  };

  const renderForm = () => {
    switch (zone.type) {
      case 'masthead':
        return renderMastheadForm();
      case 'meta':
        return renderMetaForm();
      case 'article':
        return renderArticleForm();
      case 'image':
        return renderImageForm();
      case 'teaser':
        return renderTeaserForm();
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-border px-4 py-3 shrink-0">
        <h3 className="font-semibold text-sm">{zone.label}</h3>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{zone.type}</p>
      </div>
      <div className="flex flex-col gap-4 overflow-y-auto p-4">
        {renderForm()}
      </div>
    </div>
  );
}
