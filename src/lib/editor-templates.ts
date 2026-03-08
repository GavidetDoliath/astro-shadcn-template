import type { CSSProperties } from 'react';
import type { EditorTemplate } from '@/types/journal';

export const EDITOR_TEMPLATES: EditorTemplate[] = [
  {
    id: 'manchette',
    label: 'Manchette',
    description: 'Bandeau titre en haut + 3 colonnes',
    zones: [
      { id: 'manchette', label: 'Manchette (titre)', gridArea: 'manchette', minHeight: 120 },
      { id: 'col1', label: 'Colonne 1', gridArea: 'col1', minHeight: 300 },
      { id: 'col2', label: 'Colonne 2', gridArea: 'col2', minHeight: 300 },
      { id: 'col3', label: 'Colonne 3', gridArea: 'col3', minHeight: 300 },
    ],
  },
  {
    id: 'une-colonne',
    label: 'Une colonne',
    description: 'Pleine largeur',
    zones: [{ id: 'main', label: 'Contenu', gridArea: 'main', minHeight: 600 }],
  },
  {
    id: 'deux-colonnes',
    label: 'Deux colonnes',
    description: '50% / 50%',
    zones: [
      { id: 'col1', label: 'Colonne gauche', gridArea: 'col1', minHeight: 600 },
      { id: 'col2', label: 'Colonne droite', gridArea: 'col2', minHeight: 600 },
    ],
  },
  {
    id: 'trois-colonnes',
    label: 'Trois colonnes',
    description: '33% / 33% / 33%',
    zones: [
      { id: 'col1', label: 'Colonne 1', gridArea: 'col1', minHeight: 600 },
      { id: 'col2', label: 'Colonne 2', gridArea: 'col2', minHeight: 600 },
      { id: 'col3', label: 'Colonne 3', gridArea: 'col3', minHeight: 600 },
    ],
  },
  {
    id: 'une-plus-deux',
    label: 'Une + Deux',
    description: 'Grande colonne + 2 petites',
    zones: [
      { id: 'main', label: 'Article principal', gridArea: 'main', minHeight: 600 },
      { id: 'side1', label: 'Colonne droite 1', gridArea: 'side1', minHeight: 280 },
      { id: 'side2', label: 'Colonne droite 2', gridArea: 'side2', minHeight: 280 },
    ],
  },
  {
    id: 'feature',
    label: 'Feature',
    description: 'Grande image + 2 colonnes texte',
    zones: [
      { id: 'hero', label: 'Image principale', gridArea: 'hero', minHeight: 280 },
      { id: 'col1', label: 'Texte gauche', gridArea: 'col1', minHeight: 280 },
      { id: 'col2', label: 'Texte droite', gridArea: 'col2', minHeight: 280 },
    ],
  },
];

export function getTemplate(id: string): EditorTemplate | undefined {
  return EDITOR_TEMPLATES.find((t) => t.id === id);
}

export const TEMPLATE_GRID_STYLES: Record<string, CSSProperties & { gridTemplateAreas: string }> = {
  manchette: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gridTemplateRows: 'auto 1fr',
    gridTemplateAreas: `"manchette manchette manchette" "col1 col2 col3"`,
    gap: '8px',
    height: '100%',
  },
  'une-colonne': {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gridTemplateAreas: `"main"`,
    gap: '8px',
    height: '100%',
  },
  'deux-colonnes': {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateAreas: `"col1 col2"`,
    gap: '8px',
    height: '100%',
  },
  'trois-colonnes': {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gridTemplateAreas: `"col1 col2 col3"`,
    gap: '8px',
    height: '100%',
  },
  'une-plus-deux': {
    display: 'grid',
    gridTemplateColumns: '3fr 1fr',
    gridTemplateRows: '1fr 1fr',
    gridTemplateAreas: `"main side1" "main side2"`,
    gap: '8px',
    height: '100%',
  },
  feature: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: '1fr 1fr',
    gridTemplateAreas: `"hero hero" "col1 col2"`,
    gap: '8px',
    height: '100%',
  },
};
