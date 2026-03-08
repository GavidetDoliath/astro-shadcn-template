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
