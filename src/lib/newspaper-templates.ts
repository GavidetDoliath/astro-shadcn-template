/**
 * Chicago Sentinel Template
 * Classic newspaper layout with grid-based zone system
 */

import type { NewspaperTemplate, NewspaperZone, NewspaperPageTemplate } from '@/types/newspaper';

// Cover page zones
const COVER_ZONES: NewspaperZone[] = [
  {
    id: 'masthead',
    type: 'masthead',
    gridArea: 'masthead',
    label: 'Titre journal',
    required: true,
  },
  {
    id: 'meta',
    type: 'meta',
    gridArea: 'meta',
    label: 'Métadonnées',
    required: false,
  },
  {
    id: 'left',
    type: 'article',
    gridArea: 'left',
    label: 'Article gauche',
    sectionTag: 'OPINION',
    required: false,
  },
  {
    id: 'center',
    type: 'article',
    gridArea: 'center',
    label: 'Article principal',
    required: false,
  },
  {
    id: 'right',
    type: 'article',
    gridArea: 'right',
    label: 'Article droite',
    sectionTag: 'CULTURE',
    required: false,
  },
  {
    id: 't1',
    type: 'teaser',
    gridArea: 't1',
    label: 'Teaser 1',
    required: false,
  },
  {
    id: 't2',
    type: 'teaser',
    gridArea: 't2',
    label: 'Teaser 2',
    required: false,
  },
  {
    id: 't3',
    type: 'teaser',
    gridArea: 't3',
    label: 'Teaser 3',
    required: false,
  },
];

const COVER_PAGE: NewspaperPageTemplate = {
  id: 'cover',
  label: 'Couverture',
  gridTemplateAreas: '"masthead masthead masthead" "meta meta meta" "left center right" "left center right" "t1 t2 t3"',
  gridTemplateColumns: '1fr 2fr 1fr',
  gridTemplateRows: 'auto auto 1fr 1fr auto',
  zones: COVER_ZONES,
};

// Inner page zones
const INNER_ZONES: NewspaperZone[] = [
  {
    id: 'header',
    type: 'meta',
    gridArea: 'header',
    label: 'Entête',
    required: false,
  },
  {
    id: 'main',
    type: 'article',
    gridArea: 'main',
    label: 'Article principal',
    required: false,
  },
  {
    id: 'side',
    type: 'article',
    gridArea: 'side',
    label: 'Article latéral',
    sectionTag: 'CHRONIQUE',
    required: false,
  },
];

const INNER_PAGE: NewspaperPageTemplate = {
  id: 'inner',
  label: 'Page intérieure',
  gridTemplateAreas: '"header header header" "main main side" "main main side"',
  gridTemplateColumns: '1fr 1fr 1fr',
  gridTemplateRows: 'auto 1fr 1fr',
  zones: INNER_ZONES,
};

export const CHICAGO_SENTINEL: NewspaperTemplate = {
  id: 'chicago-sentinel',
  name: 'Chicago Sentinel',
  description: 'Classic broadsheet layout with 3-column grid, masthead, and teasers',
  pages: [COVER_PAGE, INNER_PAGE],
};

// Pamphlet Marat zones
const PAMPHLET_ZONES: NewspaperZone[] = [
  {
    id: 'titre',
    type: 'masthead',
    gridArea: 'titre',
    label: 'Titre du pamphlet',
    required: true,
  },
  {
    id: 'bandeau',
    type: 'meta',
    gridArea: 'bandeau',
    label: 'Bandeau éditorial',
    required: false,
  },
  {
    id: 'corps',
    type: 'article',
    gridArea: 'corps',
    label: 'Corps du pamphlet',
    required: false,
  },
  {
    id: 'marge',
    type: 'article',
    gridArea: 'marge',
    label: 'Marginalia',
    required: false,
  },
  {
    id: 'citation',
    type: 'teaser',
    gridArea: 'citation',
    label: 'Citation / épigraphe',
    required: false,
  },
  {
    id: 'colophon',
    type: 'meta',
    gridArea: 'colophon',
    label: 'Colophon',
    required: false,
  },
];

const PAMPHLET_PAGE: NewspaperPageTemplate = {
  id: 'pamphlet',
  label: 'Pamphlet',
  gridTemplateAreas: '"titre titre" "bandeau bandeau" "corps marge" "corps marge" "citation citation" "colophon colophon"',
  gridTemplateColumns: '2fr 1fr',
  gridTemplateRows: 'auto auto 1fr 1fr auto auto',
  zones: PAMPHLET_ZONES,
};

export const PAMPHLET_MARAT: NewspaperTemplate = {
  id: 'pamphlet-marat',
  name: 'Pamphlet Marat',
  description: 'Single-page pamphlet layout optimized for long-form text with marginalia and citations',
  pages: [PAMPHLET_PAGE],
};

/**
 * Get template by ID
 */
export function getNewspaperTemplate(templateId: string): NewspaperTemplate | null {
  if (templateId === 'chicago-sentinel') {
    return CHICAGO_SENTINEL;
  }
  if (templateId === 'pamphlet-marat') {
    return PAMPHLET_MARAT;
  }
  return null;
}

/**
 * Get all available templates
 */
export function getAvailableTemplates(): NewspaperTemplate[] {
  return [CHICAGO_SENTINEL, PAMPHLET_MARAT];
}
