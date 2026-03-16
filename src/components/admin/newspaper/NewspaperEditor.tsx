/**
 * NewspaperEditor
 * Main editor shell with 3-panel layout (zones, canvas, inspector)
 */

import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import NewspaperCanvas from './NewspaperCanvas';
import ZoneInspector from './ZoneInspector';
import { getNewspaperTemplate } from '@/lib/newspaper-templates';
import type { NewspaperEdition, ZoneContent } from '@/types/newspaper';

interface Article {
  id: string;
  title: string;
  excerpt?: string;
}

interface Props {
  initialEdition: NewspaperEdition;
  articles: Article[];
}

export default function NewspaperEditor({ initialEdition, articles }: Props) {
  const [edition, setEdition] = useState(initialEdition);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const template = getNewspaperTemplate(edition.templateId);
  if (!template) {
    return <div className="p-4">Template non trouvé</div>;
  }

  const currentPage = edition.pages[0];
  const currentPageTemplate = template.pages[0];

  // Auto-save debounced
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaving(true);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/admin/newspapers/${edition.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: edition.title,
            date: edition.date,
            status: edition.status,
            pages: edition.pages,
          }),
        });

        if (!response.ok) throw new Error('Save failed');
        setSaving(false);
      } catch (err) {
        console.error('Error saving edition:', err);
        setSaving(false);
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [edition]);

  const handleZoneChange = (zoneId: string, content: ZoneContent) => {
    setEdition(prev => ({
      ...prev,
      pages: [
        {
          ...prev.pages[0],
          zones: {
            ...prev.pages[0].zones,
            [zoneId]: content,
          },
        },
      ],
    }));
  };

  const selectedZone = currentPageTemplate?.zones.find(z => z.id === selectedZoneId);
  const selectedZoneContent = selectedZoneId ? currentPage?.zones[selectedZoneId] : undefined;

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/admin/newspapers/${edition.id}/export`, {
        method: 'POST',
      });

      if (!response.ok) {
        alert('Export serveur non disponible. Utilisation de l\'export client...');
        // Fall back to client-side export
        const canvas = document.querySelector('[data-pdf-page]') as HTMLElement;
        if (canvas) {
          const html2canvas = (await import('html2canvas')).default;
          const jsPDF = (await import('jspdf')).jsPDF;

          const canvasImg = await html2canvas(canvas, {
            backgroundColor: '#fff',
            scale: 2,
          });

          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [794, 1123],
          });

          pdf.addImage(canvasImg.toDataURL('image/png'), 'PNG', 0, 0, 794, 1123);
          pdf.save(`${edition.title}.pdf`);
        }
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${edition.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting:', err);
      alert('Erreur lors de l\'export');
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <div className="flex items-center gap-4">
          <a href="/admin/newspapers" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
            ← Éditions
          </a>
          <div>
            <h1 className="text-lg font-bold">{edition.title}</h1>
            <p className="text-xs text-muted-foreground">{new Date(edition.date).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {saving ? 'Enregistrement...' : 'Enregistré'}
          </span>
          <Button onClick={handleExport} size="sm">
            ⬇ Exporter PDF
          </Button>
          <select
            value={edition.status}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setEdition(prev => ({
                ...prev,
                status: e.target.value as 'draft' | 'ready',
              }))
            }
            className="rounded border border-border bg-card px-2 py-1 text-sm hover:bg-accent transition-colors"
          >
            <option value="draft">Brouillon</option>
            <option value="ready">Prêt</option>
          </select>
        </div>
      </header>

      {/* Body: 3-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: Zones list */}
        <aside className="flex w-52 shrink-0 flex-col overflow-y-auto border-r border-border bg-card p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Zones
          </h3>
          <div className="flex flex-col gap-1">
            {currentPageTemplate?.zones.map(zone => (
              <button
                key={zone.id}
                className={`rounded px-2 py-1.5 text-left text-xs transition-colors ${
                  selectedZoneId === zone.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
                onClick={() => setSelectedZoneId(zone.id)}
              >
                <span className="mr-1">{zone.type === 'article' ? '▸' : '◇'}</span>
                {zone.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Center: Canvas */}
        <div className="flex flex-1 flex-col items-center overflow-auto bg-muted/30 p-8">
          <NewspaperCanvas
            page={currentPage}
            template={currentPageTemplate}
            selectedZoneId={selectedZoneId}
            onSelectZone={setSelectedZoneId}
          />
        </div>

        {/* Right sidebar: Inspector */}
        <aside className="flex w-80 shrink-0 flex-col overflow-y-auto border-l border-border bg-card">
          <ZoneInspector
            zone={selectedZone || null}
            content={selectedZoneContent}
            articles={articles}
            onChange={handleZoneChange}
          />
        </aside>
      </div>
    </div>
  );
}
