import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { getTemplate, TEMPLATE_GRID_STYLES } from '@/lib/editor-templates';
import { BlockElement } from './BlockElement';
import type { JournalPage, JournalBlock } from '@/types/journal';

interface DroppableZoneProps {
  zoneId: string;
  pageId: string;
  label: string;
  gridArea: string;
  minHeight: number;
  blocks: JournalBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onUpdateBlock: (blockId: string, updates: Partial<JournalBlock>) => void;
  onDeleteBlock: (blockId: string) => void;
}

function DroppableZone({
  zoneId,
  pageId,
  label,
  gridArea,
  minHeight,
  blocks,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlock,
  onDeleteBlock,
}: DroppableZoneProps) {
  const droppableId = `${pageId}::${zoneId}`;
  const { setNodeRef, isOver } = useDroppable({ id: droppableId, data: { pageId, zoneId } });
  const sortableIds = blocks.map((b) => b.id);

  return (
    <div
      style={{ gridArea, minHeight }}
      className={`relative flex flex-col rounded border-2 transition-colors ${
        isOver ? 'border-primary bg-primary/5' : 'border-dashed border-border'
      }`}
      aria-label={label}
    >
      {/* Zone label */}
      <div className="absolute left-1 top-1 z-10 rounded bg-muted/70 px-1 py-0.5 text-[9px] text-muted-foreground">
        {label}
      </div>

      <div ref={setNodeRef} className="flex flex-1 flex-col gap-1 pl-5 pr-2 pt-5 pb-2">
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          {blocks.map((block) => (
            <BlockElement
              key={block.id}
              block={block}
              isSelected={selectedBlockId === block.id}
              onSelect={() => onSelectBlock(block.id)}
              onUpdate={(updates) => onUpdateBlock(block.id, updates)}
              onDelete={() => onDeleteBlock(block.id)}
            />
          ))}
        </SortableContext>

        {blocks.length === 0 && (
          <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground/50">
            Déposez un bloc ici
          </div>
        )}
      </div>
    </div>
  );
}

interface PageCanvasProps {
  page: JournalPage;
  isActive: boolean;
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onUpdateBlock: (blockId: string, updates: Partial<JournalBlock>) => void;
  onDeleteBlock: (blockId: string) => void;
  scale?: number;
}

// A4: 210mm × 297mm at 96dpi → ~794px × ~1123px
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

export function PageCanvas({
  page,
  isActive,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlock,
  onDeleteBlock,
  scale = 1,
}: PageCanvasProps) {
  const template = getTemplate(page.templateId);
  const gridStyle = TEMPLATE_GRID_STYLES[page.templateId] ?? TEMPLATE_GRID_STYLES['une-colonne'];

  if (!template) return null;

  const blocksByZone = Object.fromEntries(
    template.zones.map((zone) => [
      zone.id,
      page.blocks
        .filter((b) => b.zoneId === zone.id)
        .sort((a, b) => a.order - b.order),
    ]),
  );

  return (
    <div
      data-pdf-page={isActive ? page.id : undefined}
      style={{
        width: A4_WIDTH,
        height: A4_HEIGHT,
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        flexShrink: 0,
      }}
      className="relative bg-white shadow-lg"
    >
      {/* Page content with padding (like print margins) */}
      <div style={{ ...gridStyle, padding: '32px', height: '100%', boxSizing: 'border-box' }}>
        {template.zones.map((zone) => (
          <DroppableZone
            key={zone.id}
            zoneId={zone.id}
            pageId={page.id}
            label={zone.label}
            gridArea={zone.gridArea}
            minHeight={zone.minHeight}
            blocks={blocksByZone[zone.id] ?? []}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
            onUpdateBlock={onUpdateBlock}
            onDeleteBlock={onDeleteBlock}
          />
        ))}
      </div>
    </div>
  );
}
