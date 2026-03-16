/**
 * ZoneRenderer
 * Renders a single zone with newspaper styling
 */

import React from 'react';
import type { NewspaperZone, ZoneContent } from '@/types/newspaper';

interface Props {
  zone: NewspaperZone;
  content: ZoneContent | undefined;
}

export default function ZoneRenderer({ zone, content }: Props) {
  const renderMasthead = (data: any) => (
    <div>
      <h1 className="masthead-title">{data.journalTitle || 'THE SENTINEL'}</h1>
      {data.date && <div className="masthead-date">{data.date}</div>}
      {data.tagline && <div className="masthead-tagline">{data.tagline}</div>}
    </div>
  );

  const renderMeta = (data: any) => {
    const isBandeau = zone.id === 'bandeau';
    const isColophon = zone.id === 'colophon';

    if (isBandeau) {
      return (
        <div className="bandeau-meta">
          <p style={{ margin: 0 }}>{data.text || 'VOL. I · N° 1 · PRINTEMPS 2026'}</p>
        </div>
      );
    }

    if (isColophon) {
      return (
        <div className="pamphlet-colophon">
          <p style={{ margin: 0 }}>{data.text || '— Prochain numéro · Correspondance · etc. —'}</p>
        </div>
      );
    }

    return (
      <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#666', letterSpacing: '0.1em' }}>
        <p style={{ margin: 0 }}>{data.text || 'VOL. 1, No. 1'}</p>
      </div>
    );
  };

  const renderArticle = (data: any) => {
    const isCorps = zone.id === 'corps';
    const isMarge = zone.id === 'marge';

    if (isCorps) {
      return (
        <div className="pamphlet-corps">
          {data.sectionLabel && <div className="section-tag">{data.sectionLabel}</div>}
          {data.headline && <h2>{data.headline}</h2>}
          {data.subheadline && <h3 style={{ fontStyle: 'italic', fontWeight: 'normal' }}>{data.subheadline}</h3>}
          {data.byline && <div className="article-byline">By {data.byline}</div>}
          {data.imageUrl && (
            <div className="article-image">
              <img src={data.imageUrl} alt={data.imageCaption || ''} style={{ maxHeight: '200px', objectFit: 'cover' }} />
              {data.imageCaption && <p className="image-caption">{data.imageCaption}</p>}
            </div>
          )}
          {data.body && (
            <div dangerouslySetInnerHTML={{ __html: data.body }} />
          )}
        </div>
      );
    }

    if (isMarge) {
      return (
        <div className="pamphlet-marge">
          {data.headline && <h3>{data.headline}</h3>}
          {data.subheadline && <p style={{ fontStyle: 'italic', fontSize: '0.8rem', margin: '2px 0' }}>{data.subheadline}</p>}
          {data.byline && <p style={{ fontSize: '0.75rem', color: '#333', margin: '2px 0' }}>{data.byline}</p>}
          {data.body && (
            <div dangerouslySetInnerHTML={{ __html: data.body }} />
          )}
        </div>
      );
    }

    return (
      <div>
        {data.sectionLabel && <div className="section-tag">{data.sectionLabel}</div>}
        {data.headline && <h2>{data.headline}</h2>}
        {data.subheadline && <h3 style={{ fontStyle: 'italic', fontWeight: 'normal' }}>{data.subheadline}</h3>}
        {data.byline && <div className="article-byline">By {data.byline}</div>}
        {data.imageUrl && (
          <div className="article-image">
            <img src={data.imageUrl} alt={data.imageCaption || ''} style={{ maxHeight: '150px', objectFit: 'cover' }} />
            {data.imageCaption && <p className="image-caption">{data.imageCaption}</p>}
          </div>
        )}
        {data.body && (
          <div style={{ fontSize: '0.85rem', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: data.body }} />
        )}
      </div>
    );
  };

  const renderImage = (data: any) => (
    <div style={{ textAlign: 'center' }}>
      {data.imageUrl ? (
        <>
          <img
            src={data.imageUrl}
            alt={data.alt || ''}
            style={{
              width: '100%',
              height: 'auto',
              border: '1px solid #ddd',
              maxHeight: '200px',
              objectFit: 'cover',
            }}
          />
          {data.caption && <p className="image-caption">{data.caption}</p>}
        </>
      ) : (
        <div
          style={{
            background: '#f0f0f0',
            border: '2px dashed #ccc',
            padding: '24px',
            textAlign: 'center',
            color: '#999',
            fontSize: '0.85rem',
          }}
        >
          📷 Image
        </div>
      )}
    </div>
  );

  const renderTeaser = (data: any) => {
    const isCitation = zone.id === 'citation';

    if (isCitation) {
      return (
        <div className="pamphlet-citation">
          {data.headline && <p style={{ margin: 0 }}>{data.headline}</p>}
        </div>
      );
    }

    return (
      <div style={{ fontSize: '0.85rem' }}>
        {data.headline && <h4 className="teaser-headline">{data.headline}</h4>}
        {data.summary && <p className="teaser-text">{data.summary}</p>}
        {data.pageRef && <p className="page-ref">{data.pageRef}</p>}
      </div>
    );
  };

  const renderContent = () => {
    if (!content) {
      return (
        <div className="flex h-full items-center justify-center text-[10px] italic opacity-40 text-center px-1">
          ← Cliquer pour éditer
        </div>
      );
    }

    switch (content.type) {
      case 'masthead':
        return renderMasthead(content.data);
      case 'meta':
        return renderMeta(content.data);
      case 'article':
        return renderArticle(content.data);
      case 'image':
        return renderImage(content.data);
      case 'teaser':
        return renderTeaser(content.data);
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full overflow-auto flex flex-col justify-start">
      {renderContent()}
    </div>
  );
}
