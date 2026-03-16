# Newspaper Editor Setup

## 1. Create Supabase Table

In your Supabase dashboard, go to **SQL Editor** and run the following SQL:

```sql
CREATE TABLE newspaper_editions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  template_id TEXT NOT NULL DEFAULT 'chicago-sentinel',
  format TEXT NOT NULL DEFAULT 'A4',
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'ready')),
  pages JSONB NOT NULL DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_newspaper_editions_date
  ON newspaper_editions(date DESC);

CREATE INDEX idx_newspaper_editions_created_by
  ON newspaper_editions(created_by);
```

## 2. Verify Table Structure

Check that the table was created by running:

```sql
SELECT * FROM newspaper_editions LIMIT 1;
```

## 3. Access the Editor

- Go to `/admin/newspapers` (requires admin role)
- Create a new edition with title and date
- The editor will open automatically
- Click on zones to edit their content
- Choose between linking Supabase articles or free text
- Export to PDF (client-side via html2canvas)

## How It Works

### Architecture

```
/admin/newspapers          ← List editions (NewspaperList.tsx)
/admin/newspaper-editor    ← Full-page editor (NewspaperEditor.tsx)
  ├── NewspaperCanvas      ← WYSIWYG grid rendering
  ├── ZoneInspector        ← Right panel form editor
  ├── ArticlePicker        ← Combobox to link articles
  └── NewspaperPdfExport   ← PDF export (html2canvas + jsPDF)
```

### Data Model

Each edition has:
- **title** — Edition name (e.g., "Printemps 2026")
- **date** — Publication date
- **status** — draft or ready
- **template_id** — Currently only "chicago-sentinel"
- **format** — A4 (794×1123px)
- **pages** — Array of `NewspaperEditionPage`

Each page has:
- **pageNumber** — 1, 2, 3...
- **templatePageId** — "cover" or "inner"
- **zones** — Object mapping zone ID → zone content

### Template: Chicago Sentinel

#### Cover Page

Grid layout:
```
"masthead masthead masthead"
"meta     meta     meta    "
"left     center   right   "
"left     center   right   "
"t1       t2       t3      "
```

Zones:
- **masthead** — Journal title, date, tagline
- **meta** — Volume/issue info
- **left** — Opinion article
- **center** — Main article
- **right** — Culture article
- **t1, t2, t3** — Teasers

#### Inner Page

Grid layout:
```
"header  header  header"
"main    main    side  "
"main    main    side  "
```

Zones:
- **header** — Page header/issue info
- **main** — Main article
- **side** — Side article (chronique, opinion, etc.)

### Zone Types

Each zone can contain one of these types:

**masthead** — Journal title
- Fields: journalTitle, date, tagline, volume

**meta** — Metadata text
- Fields: text

**article** — Article from DB or free text
- Mode: "db" or "free"
- If db: articleId (links to Supabase article)
- Free fields: headline, subheadline, byline, body (HTML), imageUrl, imageCaption, sectionLabel

**image** — Image with optional caption
- Fields: imageUrl, caption, alt

**teaser** — Brief teaser/callout
- Fields: headline, summary, pageRef

### Export to PDF

Client-side export uses:
- **html2canvas** — Converts DOM to canvas
- **jsPDF** — Creates PDF from images

Server-side export is stubbed (would use Playwright if implemented).

## Fonts

The editor uses:
- **UnifrakturMaguntia** — Masthead (Google Fonts)
- **Georgia** — Body text (system font)

## Troubleshooting

### Table not found error

1. Verify table exists in Supabase: `SELECT * FROM newspaper_editions`
2. Run the SQL creation script above
3. Restart dev server: `pnpm dev`

### Editor won't save

1. Check browser console for errors
2. Verify auth token is valid (login to admin again)
3. Check Supabase logs for INSERT/UPDATE errors

### PDF export blank

1. Ensure canvas element has `data-pdf-page` attribute
2. Check browser console for html2canvas errors
3. Try client-side export from the editor

### Styling issues

- Fonts: Verify Google Fonts is loaded (preconnect in newspaper-editor.astro)
- Colors: Check CSS variables are defined (--noir, --parchemin, --sang)
- Grid: Verify template gridTemplateAreas matches zone gridArea values
