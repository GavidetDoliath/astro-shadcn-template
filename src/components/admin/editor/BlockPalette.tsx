import { useDraggable } from '@dnd-kit/core';
import type { BlockType } from '@/types/journal';

interface PaletteItem {
  type: BlockType;
  label: string;
  icon: string;
  description: string;
}

const PALETTE_ITEMS: PaletteItem[] = [
  { type: 'heading', label: 'Titre', icon: 'H', description: 'Titre de section' },
  { type: 'text', label: 'Corps de texte', icon: '¶', description: 'Paragraphe éditable' },
  { type: 'image', label: 'Image', icon: '⬜', description: 'Image ou photo' },
  { type: 'separator', label: 'Séparateur', icon: '—', description: 'Ligne de séparation' },
];

interface DraggablePaletteItemProps {
  item: PaletteItem;
}

function DraggablePaletteItem({ item }: DraggablePaletteItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: { type: item.type, source: 'palette' },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`flex cursor-grab items-center gap-2 rounded border border-border bg-card px-3 py-2 text-sm transition-opacity active:cursor-grabbing ${isDragging ? 'opacity-40' : 'hover:bg-accent'}`}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-xs font-bold">
        {item.icon}
      </span>
      <div>
        <div className="font-medium">{item.label}</div>
        <div className="text-xs text-muted-foreground">{item.description}</div>
      </div>
    </div>
  );
}

interface ArticlePaletteItemProps {
  id: string;
  title: string;
  excerpt?: string;
}

function DraggableArticleItem({ id, title, excerpt }: ArticlePaletteItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-article-${id}`,
    data: { type: 'article' as BlockType, source: 'palette', articleId: id, articleTitle: title, articleExcerpt: excerpt },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`cursor-grab rounded border border-border bg-card px-3 py-2 text-sm transition-opacity active:cursor-grabbing ${isDragging ? 'opacity-40' : 'hover:bg-accent'}`}
    >
      <div className="line-clamp-2 font-medium leading-snug">{title}</div>
      {excerpt && <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{excerpt}</div>}
    </div>
  );
}

interface BlockPaletteProps {
  articles: Array<{ id: string; title: string; excerpt?: string }>;
}

export function BlockPalette({ articles }: BlockPaletteProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Blocs</p>
        <div className="flex flex-col gap-1.5">
          {PALETTE_ITEMS.map((item) => (
            <DraggablePaletteItem key={item.type} item={item} />
          ))}
        </div>
      </div>

      {articles.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Articles</p>
          <div className="flex max-h-96 flex-col gap-1.5 overflow-y-auto">
            {articles.map((article) => (
              <DraggableArticleItem key={article.id} {...article} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
