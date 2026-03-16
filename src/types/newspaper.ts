/**
 * Newspaper Edition System Types
 * Defines data structures for newspaper template editor
 */

// Format
export type NewspaperFormat = 'A4';
export const NEWSPAPER_FORMATS = {
  A4: { label: 'A4', widthMm: 210, heightMm: 297, widthPx: 794, heightPx: 1123 },
} as const;

// Templates
export type NewspaperTemplateId = 'chicago-sentinel' | 'pamphlet-marat';

export interface NewspaperZone {
  id: string;
  type: 'masthead' | 'meta' | 'article' | 'image' | 'teaser';
  gridArea: string;
  label: string;
  sectionTag?: string;
  required: boolean;
}

export interface NewspaperPageTemplate {
  id: string;
  label: string;
  gridTemplateAreas: string;
  gridTemplateColumns: string;
  gridTemplateRows: string;
  zones: NewspaperZone[];
}

export interface NewspaperTemplate {
  id: NewspaperTemplateId;
  name: string;
  description: string;
  pages: NewspaperPageTemplate[];
}

// Content types
export interface MastheadContent {
  journalTitle: string;
  date?: string;
  volume?: string;
  tagline?: string;
}

export interface ArticleContent {
  mode: 'db' | 'free';
  articleId?: string;
  sectionLabel?: string;
  headline?: string;
  subheadline?: string;
  byline?: string;
  body?: string;
  imageUrl?: string;
  imageCaption?: string;
}

export interface ImageContent {
  imageUrl?: string;
  caption?: string;
  alt?: string;
}

export interface TeaserContent {
  headline?: string;
  summary?: string;
  pageRef?: string;
}

export type ZoneContent =
  | { type: 'masthead'; data: MastheadContent }
  | { type: 'meta'; data: { text?: string } }
  | { type: 'article'; data: ArticleContent }
  | { type: 'image'; data: ImageContent }
  | { type: 'teaser'; data: TeaserContent };

// Edition
export interface NewspaperEditionPage {
  id: string;
  pageNumber: number;
  templatePageId: string;
  zones: Record<string, ZoneContent>;
}

export interface NewspaperEdition {
  id: string;
  title: string;
  templateId: NewspaperTemplateId;
  format: NewspaperFormat;
  date: string;
  status: 'draft' | 'ready';
  pages: NewspaperEditionPage[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}
