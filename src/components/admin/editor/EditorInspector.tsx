import type { JournalBlock } from '@/types/journal';

interface EditorInspectorProps {
  block: JournalBlock | null;
  onUpdate: (updates: Partial<JournalBlock>) => void;
}

export function EditorInspector({ block, onUpdate }: EditorInspectorProps) {
  if (!block) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
        Sélectionnez un bloc pour modifier ses propriétés
      </div>
    );
  }

  const updateStyle = (key: string, value: string) =>
    onUpdate({ style: { ...block.style, [key]: value || undefined } });

  const updateContent = (key: string, value: string) =>
    onUpdate({ content: { ...block.content, [key]: value } });

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Bloc : {block.type}
        </p>
      </div>

      {/* Text/Heading content */}
      {(block.type === 'text' || block.type === 'heading') && (
        <Field label="Texte">
          <textarea
            className="w-full rounded border border-border bg-background p-2 text-sm"
            rows={4}
            value={block.content.text ?? ''}
            onChange={(e) => updateContent('text', e.target.value)}
          />
        </Field>
      )}

      {/* Image content */}
      {block.type === 'image' && (
        <>
          <Field label="URL de l'image">
            <input
              type="text"
              className="w-full rounded border border-border bg-background p-2 text-sm"
              value={block.content.imageUrl ?? ''}
              placeholder="https://..."
              onChange={(e) => updateContent('imageUrl', e.target.value)}
            />
          </Field>
          <Field label="Texte alternatif">
            <input
              type="text"
              className="w-full rounded border border-border bg-background p-2 text-sm"
              value={block.content.imageAlt ?? ''}
              placeholder="Description de l'image"
              onChange={(e) => updateContent('imageAlt', e.target.value)}
            />
          </Field>
        </>
      )}

      {/* Typography */}
      {(block.type === 'text' || block.type === 'heading' || block.type === 'article') && (
        <>
          <Field label="Taille de police">
            <select
              className="w-full rounded border border-border bg-background p-2 text-sm"
              value={block.style?.fontSize ?? ''}
              onChange={(e) => updateStyle('fontSize', e.target.value)}
            >
              <option value="">Défaut</option>
              <option value="0.75rem">Petit (0.75rem)</option>
              <option value="0.875rem">Normal (0.875rem)</option>
              <option value="1rem">Moyen (1rem)</option>
              <option value="1.25rem">Grand (1.25rem)</option>
              <option value="1.5rem">Titre (1.5rem)</option>
              <option value="2rem">Grand titre (2rem)</option>
              <option value="3rem">Manchette (3rem)</option>
            </select>
          </Field>

          <Field label="Graisse">
            <select
              className="w-full rounded border border-border bg-background p-2 text-sm"
              value={block.style?.fontWeight ?? ''}
              onChange={(e) => updateStyle('fontWeight', e.target.value)}
            >
              <option value="">Défaut</option>
              <option value="400">Normal</option>
              <option value="600">Semi-gras</option>
              <option value="700">Gras</option>
              <option value="900">Très gras</option>
            </select>
          </Field>

          <Field label="Alignement">
            <div className="flex gap-1">
              {(['left', 'center', 'right', 'justify'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => updateStyle('textAlign', align)}
                  className={`flex-1 rounded border py-1 text-xs transition-colors ${
                    block.style?.textAlign === align
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  {align === 'left' ? '⬅' : align === 'center' ? '↔' : align === 'right' ? '➡' : '≡'}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Couleur du texte">
            <input
              type="color"
              className="h-9 w-full cursor-pointer rounded border border-border bg-background"
              value={block.style?.color ?? '#000000'}
              onChange={(e) => updateStyle('color', e.target.value)}
            />
          </Field>
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: import('react').ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
