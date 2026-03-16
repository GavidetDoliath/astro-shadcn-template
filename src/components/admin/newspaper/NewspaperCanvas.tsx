/**
 * NewspaperCanvas
 * Beautiful WYSIWYG newspaper canvas with Chicago Sentinel styling
 */

import React from 'react';
import ZoneRenderer from './ZoneRenderer';
import type { NewspaperEditionPage, NewspaperPageTemplate } from '@/types/newspaper';
import { NEWSPAPER_FORMATS } from '@/types/newspaper';

interface Props {
  page: NewspaperEditionPage;
  template: NewspaperPageTemplate;
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string) => void;
}

export default function NewspaperCanvas({
  page,
  template,
  selectedZoneId,
  onSelectZone,
}: Props) {
  const format = NEWSPAPER_FORMATS.A4;
  const scaledHeightPx = format.heightPx * 0.72;

  const canvasStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: template.gridTemplateColumns,
    gridTemplateRows: template.gridTemplateRows,
    gridTemplateAreas: template.gridTemplateAreas,
    width: `${format.widthPx}px`,
    height: `${format.heightPx}px`,
    gap: '12px',
    backgroundColor: '#FAFAF3',
    padding: '20px',
    boxSizing: 'border-box',
    fontFamily: 'Georgia, "Times New Roman", serif',
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <style>{globalStyles}</style>

      {/* Scaled canvas container */}
      <div
        style={{
          transform: 'scale(0.72)',
          transformOrigin: 'top center',
          flexShrink: 0,
        }}
      >
        {/* Newspaper page */}
        <div
          data-pdf-page={page.pageNumber}
          style={canvasStyle}
          className="newspaper-page bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)]"
        >
          {template.zones.map(zone => (
            <div
              key={zone.id}
              style={{
                gridArea: zone.gridArea,
                overflow: 'hidden',
                position: 'relative',
              }}
              className={`cursor-pointer transition-colors ${
                selectedZoneId === zone.id
                  ? 'border-2 border-primary bg-primary/5'
                  : 'border border-dashed border-border/60 hover:border-border'
              }`}
              onClick={() => onSelectZone(zone.id)}
              title={zone.label}
            >
              <div className="absolute left-1 top-1 z-10 bg-muted/70 px-1 py-0.5 text-[9px] text-muted-foreground">
                {zone.label}
              </div>
              <div className="p-2.5">
                <ZoneRenderer
                  zone={zone}
                  content={page.zones[zone.id]}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info bar */}
      <div className="mt-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-mono">
        <span>📄 Page {page.pageNumber}</span>
        <span>•</span>
        <span>{template.label}</span>
        <span>•</span>
        <span>A4 ({format.widthPx}×{format.heightPx}px)</span>
      </div>

      {/* Spacing to account for scaled height */}
      <div style={{ height: scaledHeightPx }} />
    </div>
  );
}

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&display=swap');

  .newspaper-page {
    font-family: Georgia, "Times New Roman", serif;
    color: #1a1a1a;
  }

  .newspaper-page h1 {
    font-family: 'UnifrakturMaguntia', Georgia, serif;
    font-size: 2.2rem;
    font-weight: normal;
    letter-spacing: 0.08em;
    margin: 0;
    line-height: 1.1;
    color: #000;
  }

  .newspaper-page h2 {
    font-family: Georgia, serif;
    font-size: 1.3rem;
    font-weight: bold;
    margin: 8px 0 6px;
    line-height: 1.3;
    color: #000;
  }

  .newspaper-page h3 {
    font-family: Georgia, serif;
    font-size: 1rem;
    font-weight: bold;
    margin: 6px 0 4px;
    line-height: 1.3;
    color: #1a1a1a;
  }

  .newspaper-page h4 {
    font-family: Georgia, serif;
    font-size: 0.9rem;
    font-weight: bold;
    margin: 4px 0 2px;
    line-height: 1.2;
    color: #1a1a1a;
  }

  .newspaper-page p {
    margin: 6px 0;
    font-size: 0.9rem;
    line-height: 1.6;
    color: #1a1a1a;
  }

  .newspaper-page .section-tag {
    display: inline-block;
    background: #000;
    color: #fff;
    padding: 3px 8px;
    font-size: 0.65rem;
    font-weight: bold;
    letter-spacing: 0.12em;
    margin-bottom: 6px;
    font-family: Georgia, serif;
  }

  .newspaper-page .masthead-title {
    font-family: 'UnifrakturMaguntia', Georgia, serif;
    font-size: 2.8rem;
    font-weight: normal;
    letter-spacing: 0.12em;
    margin: 0;
    line-height: 1;
    text-align: center;
    color: #000;
  }

  .newspaper-page .masthead-date {
    text-align: center;
    font-size: 0.75rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin: 8px 0;
    color: #333;
  }

  .newspaper-page .masthead-tagline {
    text-align: center;
    font-size: 0.85rem;
    font-style: italic;
    margin: 6px 0 0;
    color: #555;
  }

  .newspaper-page .article-byline {
    font-size: 0.8rem;
    font-weight: bold;
    margin: 4px 0 8px;
    color: #1a1a1a;
  }

  .newspaper-page .article-image {
    margin: 8px 0;
    border: 1px solid #ddd;
  }

  .newspaper-page .article-image img {
    width: 100%;
    height: auto;
    display: block;
  }

  .newspaper-page .image-caption {
    font-size: 0.75rem;
    color: #666;
    font-style: italic;
    margin-top: 4px;
  }

  .newspaper-page .teaser-headline {
    font-size: 0.95rem;
    font-weight: bold;
    margin: 0 0 4px;
    line-height: 1.3;
    color: #000;
  }

  .newspaper-page .teaser-text {
    font-size: 0.8rem;
    line-height: 1.4;
    margin: 2px 0;
    color: #1a1a1a;
  }

  .newspaper-page .page-ref {
    font-weight: bold;
    color: #333;
    font-size: 0.75rem;
    margin-top: 3px;
  }

  /* Pamphlet Marat styles */
  .newspaper-page .pamphlet-corps {
    font-size: 0.9rem;
    line-height: 1.7;
    text-align: justify;
    text-justify: inter-word;
  }

  .newspaper-page .pamphlet-corps p {
    margin: 8px 0;
  }

  .newspaper-page .pamphlet-marge {
    font-size: 0.8rem;
    line-height: 1.55;
    border-left: 1px solid #18181b;
    padding-left: 12px;
    color: #3a3a3a;
  }

  .newspaper-page .pamphlet-marge h3 {
    font-size: 0.9rem;
    margin: 4px 0 6px;
  }

  .newspaper-page .pamphlet-marge p {
    margin: 4px 0;
  }

  .newspaper-page .pamphlet-citation {
    font-size: 1.4rem;
    font-style: italic;
    text-align: center;
    border-top: 1px solid #18181b;
    border-bottom: 1px solid #18181b;
    padding: 16px;
    margin: 0;
  }

  .newspaper-page .bandeau-meta {
    font-family: monospace;
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    text-align: center;
    border-top: 1px solid #18181b;
    border-bottom: 1px solid #18181b;
    padding: 6px 0;
    color: #18181b;
    margin: 0;
  }

  .newspaper-page .pamphlet-colophon {
    font-family: monospace;
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    text-align: center;
    color: #52525b;
    margin: 0;
  }
`;
