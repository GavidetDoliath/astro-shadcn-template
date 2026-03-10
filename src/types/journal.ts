export type PageFormat = 'A4' | 'A3';

export const PAGE_FORMATS: Record<PageFormat, { width: number; height: number; mmWidth: number; mmHeight: number }> = {
  A4: { width: 794, height: 1123, mmWidth: 210, mmHeight: 297 },
  A3: { width: 1123, height: 1587, mmWidth: 297, mmHeight: 420 },
};

export interface Journal {
  id: string;
  title: string;
  issueNumber?: number;
  date: string;
  status: 'draft' | 'review' | 'approved';
  content: JournalContent;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JournalContent {
  format?: PageFormat;
  pages: JournalPage[];
}

export interface JournalPage {
  id: string;
  pageNumber: number;
  templateId: string;
  blocks: JournalBlock[];
}

export type BlockType = 'article' | 'text' | 'heading' | 'image' | 'separator';

export interface JournalBlock {
  id: string;
  type: BlockType;
  zoneId: string;
  order: number;
  content: {
    text?: string;
    articleId?: string;
    articleTitle?: string;
    articleExcerpt?: string;
    imageUrl?: string;
    imageAlt?: string;
  };
  style?: {
    fontSize?: string;
    fontWeight?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    color?: string;
    backgroundColor?: string;
  };
}

export interface EditorTemplate {
  id: string;
  label: string;
  description: string;
  zones: EditorZone[];
}

export interface EditorZone {
  id: string;
  label: string;
  gridArea: string;
  minHeight: number;
  flex?: boolean;
}
