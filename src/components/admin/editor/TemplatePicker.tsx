import type { ReactNode } from 'react';
import { EDITOR_TEMPLATES } from '@/lib/editor-templates';

interface TemplatePickerProps {
  currentTemplateId: string;
  onSelect: (templateId: string) => void;
  onClose: () => void;
}

export function TemplatePicker({ currentTemplateId, onSelect, onClose }: TemplatePickerProps) {
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Sélectionner un template"
      tabIndex={-1}
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="document"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Choisir un template</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {EDITOR_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => {
                onSelect(template.id);
                onClose();
              }}
              className={`flex flex-col gap-1 rounded-lg border-2 p-3 text-left transition-colors ${
                currentTemplateId === template.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-accent'
              }`}
            >
              <TemplatePreview templateId={template.id} />
              <span className="mt-1 font-medium">{template.label}</span>
              <span className="text-xs text-muted-foreground">{template.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TemplatePreview({ templateId }: { templateId: string }) {
  const previews: Record<string, ReactNode> = {
    manchette: (
      <div className="flex h-16 flex-col gap-0.5">
        <div className="w-full flex-none rounded bg-muted" style={{ height: 16 }} />
        <div className="flex flex-1 gap-0.5">
          <div className="flex-1 rounded bg-muted/60" />
          <div className="flex-1 rounded bg-muted/60" />
          <div className="flex-1 rounded bg-muted/60" />
        </div>
      </div>
    ),
    'une-colonne': (
      <div className="h-16">
        <div className="h-full w-full rounded bg-muted" />
      </div>
    ),
    'deux-colonnes': (
      <div className="flex h-16 gap-0.5">
        <div className="flex-1 rounded bg-muted" />
        <div className="flex-1 rounded bg-muted" />
      </div>
    ),
    'trois-colonnes': (
      <div className="flex h-16 gap-0.5">
        <div className="flex-1 rounded bg-muted" />
        <div className="flex-1 rounded bg-muted" />
        <div className="flex-1 rounded bg-muted" />
      </div>
    ),
    'une-plus-deux': (
      <div className="flex h-16 gap-0.5">
        <div className="flex-[3] rounded bg-muted" />
        <div className="flex-[1] flex flex-col gap-0.5">
          <div className="flex-1 rounded bg-muted/60" />
          <div className="flex-1 rounded bg-muted/60" />
        </div>
      </div>
    ),
    feature: (
      <div className="flex h-16 flex-col gap-0.5">
        <div className="flex-1 rounded bg-muted" />
        <div className="flex flex-1 gap-0.5">
          <div className="flex-1 rounded bg-muted/60" />
          <div className="flex-1 rounded bg-muted/60" />
        </div>
      </div>
    ),
  };

  return previews[templateId] ?? <div className="h-16 rounded bg-muted" />;
}
