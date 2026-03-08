import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CSSProperties } from 'react';
import type { JournalBlock } from '@/types/journal';

interface BlockElementProps {
  block: JournalBlock;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<JournalBlock>) => void;
  onDelete: () => void;
}

export function BlockElement({ block, isSelected, onSelect, onUpdate, onDelete }: BlockElementProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded border-2 transition-colors ${
        isSelected ? 'border-primary' : 'border-transparent hover:border-border'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onSelect(); } }}
      role="button"
      tabIndex={0}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-5 top-1/2 flex -translate-y-1/2 cursor-grab flex-col gap-0.5 opacity-0 group-hover:opacity-100 active:cursor-grabbing"
      >
        <span className="block h-0.5 w-3 bg-muted-foreground rounded" />
        <span className="block h-0.5 w-3 bg-muted-foreground rounded" />
        <span className="block h-0.5 w-3 bg-muted-foreground rounded" />
      </div>

      {/* Delete button */}
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -right-2 -top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs hover:bg-destructive/80"
        >
          ×
        </button>
      )}

      <BlockContent block={block} onUpdate={onUpdate} />
    </div>
  );
}

function BlockContent({ block, onUpdate }: { block: JournalBlock; onUpdate: (u: Partial<JournalBlock>) => void }) {
  const textStyle: CSSProperties = {
    fontSize: block.style?.fontSize,
    fontWeight: block.style?.fontWeight,
    textAlign: block.style?.textAlign,
    color: block.style?.color,
  };

  switch (block.type) {
    case 'heading':
      return (
        <h2
          contentEditable
          suppressContentEditableWarning
          style={{ ...textStyle, fontSize: textStyle.fontSize ?? '1.5rem', fontWeight: textStyle.fontWeight ?? '700' }}
          className="min-h-[2rem] p-2 text-2xl font-bold outline-none"
          onBlur={(e) =>
            onUpdate({ content: { ...block.content, text: e.currentTarget.textContent ?? '' } })
          }
        >
          {block.content.text || 'Titre'}
        </h2>
      );

    case 'text':
      return (
        <p
          contentEditable
          suppressContentEditableWarning
          style={textStyle}
          className="min-h-[3rem] whitespace-pre-wrap p-2 text-sm leading-relaxed outline-none"
          onBlur={(e) =>
            onUpdate({ content: { ...block.content, text: e.currentTarget.textContent ?? '' } })
          }
        >
          {block.content.text || 'Cliquez pour écrire...'}
        </p>
      );

    case 'article':
      return (
        <div className="p-2">
          <h3 className="font-bold leading-snug" style={textStyle}>
            {block.content.articleTitle || 'Article sans titre'}
          </h3>
          {block.content.articleExcerpt && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{block.content.articleExcerpt}</p>
          )}
        </div>
      );

    case 'image':
      return (
        <div className="flex min-h-[6rem] flex-col items-center justify-center gap-2 rounded bg-muted/30 p-4 text-center">
          {block.content.imageUrl ? (
            <img
              src={block.content.imageUrl}
              alt={block.content.imageAlt ?? ''}
              className="max-h-40 max-w-full rounded object-contain"
            />
          ) : (
            <>
              <span className="text-2xl text-muted-foreground">⬜</span>
              <span className="text-xs text-muted-foreground">Image (renseignez l&apos;URL dans l&apos;inspecteur)</span>
            </>
          )}
        </div>
      );

    case 'separator':
      return <hr className="my-2 border-t-2 border-foreground/20" />;

    default:
      return null;
  }
}
