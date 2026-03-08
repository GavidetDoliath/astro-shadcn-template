import type { Journal } from '@/types/journal';

interface EditorHeaderProps {
  journal: Journal;
  currentPageIndex: number;
  totalPages: number;
  isSaving: boolean;
  onPageChange: (index: number) => void;
  onAddPage: () => void;
  onTitleChange: (title: string) => void;
  onStatusChange: (status: Journal['status']) => void;
  onSave: () => void;
  onExportPdf: () => void;
}

export function EditorHeader({
  journal,
  currentPageIndex,
  totalPages,
  isSaving,
  onPageChange,
  onAddPage,
  onTitleChange,
  onStatusChange,
  onSave,
  onExportPdf,
}: EditorHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border bg-card px-4 py-2">
      {/* Left: title */}
      <div className="flex items-center gap-3">
        <a href="/admin/journals" className="text-sm text-muted-foreground hover:text-foreground">
          ← Journaux
        </a>
        <input
          type="text"
          value={journal.title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="rounded border border-transparent bg-transparent px-2 py-1 text-sm font-semibold hover:border-border focus:border-primary focus:outline-none"
          placeholder="Titre du journal"
        />
        <select
          value={journal.status}
          onChange={(e) => onStatusChange(e.target.value as Journal['status'])}
          className="rounded border border-border bg-background px-2 py-1 text-xs"
        >
          <option value="draft">Brouillon</option>
          <option value="review">En révision</option>
          <option value="approved">Approuvé</option>
        </select>
      </div>

      {/* Center: page navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPageIndex - 1)}
          disabled={currentPageIndex === 0}
          className="flex h-7 w-7 items-center justify-center rounded border border-border text-sm disabled:opacity-30 hover:bg-accent"
        >
          ◀
        </button>
        <span className="min-w-[4rem] text-center text-sm">
          Page {currentPageIndex + 1} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPageIndex + 1)}
          disabled={currentPageIndex >= totalPages - 1}
          className="flex h-7 w-7 items-center justify-center rounded border border-border text-sm disabled:opacity-30 hover:bg-accent"
        >
          ▶
        </button>
        <button
          onClick={onAddPage}
          className="ml-2 rounded border border-border px-2 py-1 text-xs hover:bg-accent"
        >
          + Page
        </button>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="rounded border border-border px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
        >
          {isSaving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button
          onClick={onExportPdf}
          className="rounded bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Bon à tirer ↓
        </button>
      </div>
    </div>
  );
}
