import { useState, useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { Journal, JournalBlock, JournalPage, BlockType } from '@/types/journal';
import { EDITOR_TEMPLATES } from '@/lib/editor-templates';
import { BlockPalette } from './BlockPalette';
import { PageCanvas } from './PageCanvas';
import { EditorHeader } from './EditorHeader';
import { EditorInspector } from './EditorInspector';
import { TemplatePicker } from './TemplatePicker';

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function createBlock(type: BlockType, zoneId: string, order: number, extra?: Partial<JournalBlock>): JournalBlock {
  return {
    id: generateId(),
    type,
    zoneId,
    order,
    content: extra?.content ?? {},
    style: extra?.style,
  };
}

function createPage(pageNumber: number, templateId = 'deux-colonnes'): JournalPage {
  return { id: generateId(), pageNumber, templateId, blocks: [] };
}

interface JournalEditorProps {
  journal: Journal;
  articles: Array<{ id: string; title: string; excerpt?: string }>;
}

export function JournalEditor({ journal: initialJournal, articles }: JournalEditorProps) {
  const [journal, setJournal] = useState<Journal>(() => {
    const j = { ...initialJournal };
    if (!j.content?.pages?.length) {
      j.content = { pages: [createPage(1)] };
    }
    return j;
  });

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const saveTimeoutRef = useRef<number | null>(null);

  const currentPage = journal.content.pages[currentPageIndex];

  // Debounced autosave
  const scheduleAutosave = useCallback((updated: Journal) => {
    if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => {
      saveJournal(updated, false);
    }, 2000);
  }, []);

  useEffect(() => () => { if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current); }, []);

  function updateJournal(updater: (j: Journal) => Journal) {
    setJournal((prev) => {
      const next = updater(prev);
      scheduleAutosave(next);
      return next;
    });
  }

  function updateCurrentPage(updater: (p: JournalPage) => JournalPage) {
    updateJournal((j) => {
      const pages = [...j.content.pages];
      pages[currentPageIndex] = updater(pages[currentPageIndex]);
      return { ...j, content: { ...j.content, pages } };
    });
  }

  async function saveJournal(j: Journal, showFeedback = true) {
    if (showFeedback) setIsSaving(true);
    try {
      await fetch(`/api/admin/journals/${j.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: j.title, status: j.status, content: j.content, issueNumber: j.issueNumber }),
      });
    } finally {
      if (showFeedback) setIsSaving(false);
    }
  }

  // DnD setup
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current as { type: BlockType; source: string; articleId?: string; articleTitle?: string; articleExcerpt?: string } | undefined;

    // Drop from palette → zone
    if (activeData?.source === 'palette') {
      const overId = String(over.id);
      // over.id can be `pageId::zoneId` (zone) or a block id
      let targetPageId: string | null = null;
      let targetZoneId: string | null = null;

      if (overId.includes('::')) {
        [targetPageId, targetZoneId] = overId.split('::');
      } else {
        // dropped on a block — find which zone it belongs to
        for (const page of journal.content.pages) {
          const block = page.blocks.find((b) => b.id === overId);
          if (block) {
            targetPageId = page.id;
            targetZoneId = block.zoneId;
            break;
          }
        }
      }

      if (!targetPageId || !targetZoneId) return;

      updateJournal((j) => {
        const pages = j.content.pages.map((page) => {
          if (page.id !== targetPageId) return page;
          const zoneBlocks = page.blocks.filter((b) => b.zoneId === targetZoneId);
          const newBlock = createBlock(activeData.type, targetZoneId, zoneBlocks.length, {
            content: activeData.articleId
              ? { articleId: activeData.articleId, articleTitle: activeData.articleTitle, articleExcerpt: activeData.articleExcerpt }
              : {},
          });
          return { ...page, blocks: [...page.blocks, newBlock] };
        });
        return { ...j, content: { ...j.content, pages } };
      });
      return;
    }

    // Reorder within same zone
    const activeBlockId = String(active.id);
    const overBlockId = String(over.id);
    if (activeBlockId === overBlockId) return;

    updateJournal((j) => {
      const pages = j.content.pages.map((page) => {
        const activeBlock = page.blocks.find((b) => b.id === activeBlockId);
        if (!activeBlock) return page;

        const overBlock = page.blocks.find((b) => b.id === overBlockId);
        if (!overBlock || overBlock.zoneId !== activeBlock.zoneId) return page;

        const zoneBlocks = page.blocks.filter((b) => b.zoneId === activeBlock.zoneId).sort((a, b) => a.order - b.order);
        const activeIdx = zoneBlocks.findIndex((b) => b.id === activeBlockId);
        const overIdx = zoneBlocks.findIndex((b) => b.id === overBlockId);
        const reordered = arrayMove(zoneBlocks, activeIdx, overIdx).map((b, i) => ({ ...b, order: i }));

        const otherBlocks = page.blocks.filter((b) => b.zoneId !== activeBlock.zoneId);
        return { ...page, blocks: [...otherBlocks, ...reordered] };
      });
      return { ...j, content: { ...j.content, pages } };
    });
  }

  function addPage() {
    updateJournal((j) => {
      const newPage = createPage(j.content.pages.length + 1);
      return { ...j, content: { ...j.content, pages: [...j.content.pages, newPage] } };
    });
    setCurrentPageIndex(journal.content.pages.length);
  }

  function deletePage(pageIndex: number) {
    if (journal.content.pages.length <= 1) return;
    updateJournal((j) => {
      const pages = j.content.pages.filter((_, i) => i !== pageIndex).map((p, i) => ({ ...p, pageNumber: i + 1 }));
      return { ...j, content: { ...j.content, pages } };
    });
    setCurrentPageIndex((prev) => Math.min(prev, journal.content.pages.length - 2));
  }

  function updateBlock(blockId: string, updates: Partial<JournalBlock>) {
    updateCurrentPage((page) => ({
      ...page,
      blocks: page.blocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b)),
    }));
  }

  function deleteBlock(blockId: string) {
    setSelectedBlockId(null);
    updateCurrentPage((page) => ({ ...page, blocks: page.blocks.filter((b) => b.id !== blockId) }));
  }

  const selectedBlock = currentPage?.blocks.find((b) => b.id === selectedBlockId) ?? null;

  async function handleExportPdf() {
    const { exportToPdf } = await import('./PdfExport');
    await exportToPdf(journal.title, journal.issueNumber);
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <EditorHeader
          journal={journal}
          currentPageIndex={currentPageIndex}
          totalPages={journal.content.pages.length}
          isSaving={isSaving}
          onPageChange={setCurrentPageIndex}
          onAddPage={addPage}
          onTitleChange={(title) => updateJournal((j) => ({ ...j, title }))}
          onStatusChange={(status) => updateJournal((j) => ({ ...j, status }))}
          onSave={() => saveJournal(journal, true)}
          onExportPdf={handleExportPdf}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="flex w-56 shrink-0 flex-col overflow-y-auto border-r border-border bg-card p-3">
            <BlockPalette articles={articles} />

            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Page actuelle</p>
              <button
                onClick={() => setShowTemplatePicker(true)}
                className="w-full rounded border border-border px-3 py-2 text-left text-xs hover:bg-accent"
              >
                Template: {EDITOR_TEMPLATES.find((t) => t.id === currentPage?.templateId)?.label ?? '—'}
              </button>
              {journal.content.pages.length > 1 && (
                <button
                  onClick={() => deletePage(currentPageIndex)}
                  className="mt-1 w-full rounded border border-destructive/30 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/5"
                >
                  Supprimer cette page
                </button>
              )}
            </div>

            {/* Page thumbnails */}
            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pages</p>
              <div className="flex flex-col gap-1">
                {journal.content.pages.map((page, i) => (
                  <button
                    key={page.id}
                    onClick={() => setCurrentPageIndex(i)}
                    className={`rounded px-2 py-1.5 text-left text-xs transition-colors ${
                      i === currentPageIndex ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                    }`}
                  >
                    Page {page.pageNumber}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Canvas */}
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <main
            className="flex flex-1 flex-col items-center overflow-auto bg-muted/30 p-8 gap-8"
            onClick={() => setSelectedBlockId(null)}
            onKeyDown={(e) => e.key === 'Escape' && setSelectedBlockId(null)}
          >
            {currentPage && (
              <PageCanvas
                page={currentPage}
                isActive
                selectedBlockId={selectedBlockId}
                onSelectBlock={setSelectedBlockId}
                onUpdateBlock={updateBlock}
                onDeleteBlock={deleteBlock}
                scale={0.75}
              />
            )}
          </main>

          {/* Inspector */}
          <aside className="flex w-56 shrink-0 flex-col overflow-y-auto border-l border-border bg-card">
            <div className="border-b border-border px-4 py-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inspecteur</p>
            </div>
            <EditorInspector
              block={selectedBlock}
              onUpdate={(updates) => selectedBlockId && updateBlock(selectedBlockId, updates)}
            />
          </aside>
        </div>
      </div>

      <DragOverlay>
        {activeId && (
          <div className="rounded border border-primary bg-card px-3 py-2 text-sm shadow-lg opacity-90">
            Déplacement…
          </div>
        )}
      </DragOverlay>

      {showTemplatePicker && currentPage && (
        <TemplatePicker
          currentTemplateId={currentPage.templateId}
          onSelect={(templateId) =>
            updateCurrentPage((page) => ({ ...page, templateId, blocks: [] }))
          }
          onClose={() => setShowTemplatePicker(false)}
        />
      )}
    </DndContext>
  );
}
