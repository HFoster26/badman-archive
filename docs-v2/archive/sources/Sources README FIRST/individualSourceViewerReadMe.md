# Individual Source Page JavaScript Documentation

## File: `bda-source-page.js`

Page-specific script for individual source pages at `/archive/sources/?id=src_[city]_NNNN`. A single template file serves all sources; `bda-source-page.js` reads the `id` querystring parameter, looks up the source in `detroit.json`, and renders the full source viewer page.

This document describes the intended state of the file — no implementation exists yet. When the file is built, it must match this spec.

---

## Page Purpose

The individual source page is the full scholarly view of a single source. It serves three functions:

1. **Source viewer** — display or link to the actual source material (text, image, audio, video, archival description)
2. **Metadata surface** — expose every field on the source object in a scholarly metadata rail
3. **Citation generator** — produce properly formatted citations in Chicago, MLA, and APA

The page also shows which figures reference this source ("Cited in") and surfaces related sources (those that share at least one figure with the current source).

Source pages are deep-linkable: a source's URL is a stable permalink that can be cited in external scholarship.

---

## Why Query-Based Routing

Sources are path-based conceptually but query-based technically. A source's canonical URL is `/archive/sources/?id=src_dt_0002`, not `/archive/sources/src-dt-0002/`.

**Reasoning:**
- The archive will grow into hundreds of sources per city and thousands across cities. Generating an HTML file per source is build-time overhead with no user-facing benefit.
- A single template file is easier to update. Accessibility fixes, citation format changes, or viewer improvements deploy to every source immediately.
- The sources landing page and individual source pages share the same JSON load, the same modality config, and the same figure back-references. One template keeps that shared logic unified.

**Tradeoff:** Query-string URLs are slightly less clean than path URLs for citation purposes. This is acceptable because external scholarly citations of the archive will cite the compilation (the archive as a whole) rather than individual source pages. If a future requirement demands path URLs, a Python build step can generate redirect files without rewriting this JS.

---

## Accessibility Standards

`bda-source-page.js` must comply with:

- **WCAG 2.2 Level AA**
- **MSU Digital Accessibility Policy** (webaccess.msu.edu/policy/technical-guidelines)
- **MSU Basic Checklist** (webaccess.msu.edu/basiclist)

The WCAG success criteria that govern this file:

- **1.1.1 Non-text Content** — source media (images, audio, video) has text alternatives
- **1.2.1 / 1.2.2 / 1.2.3 Time-based Media** — audio and video sources require transcripts and captions when available
- **1.3.1 Info and Relationships** — metadata rail uses semantic `<dl>`/`<dt>`/`<dd>` structure
- **1.4.1 Use of Color** — modality identity on cited-in figures uses shape + color + text, never color alone
- **2.1.1 Keyboard** — all controls (citation format toggle, copy-to-clipboard, media playback) are keyboard-operable
- **2.4.4 Link Purpose (In Context)** — cited-in figure links and related-source links describe their destinations
- **3.2.2 On Input** — changing citation format does not trigger unexpected navigation
- **4.1.2 Name, Role, Value** — citation format toggle is a proper radio group or button group with accessible names
- **4.1.3 Status Messages** — copy-to-clipboard confirms via `aria-live` region

---

## Authority Boundaries

- `bda-source-page.js` **does not** handle site-wide nav, partials, or footer. Those are the partial loader's responsibility.
- `bda-source-page.js` **does not** define `getModalityConfig()`. It consumes the version from `scripts.js`.
- `bda-source-page.js` **does** own the querystring parsing, source lookup, viewer dispatch, metadata rendering, cited-in rendering, related-sources rendering, citation generation, and copy-to-clipboard.
- `bda-source-page.js` **only runs** on the individual source page template. It must not be included on any other page.

---

## Style Rule

No hardcoded hex color values. Every color must resolve to a CSS variable defined in `styles.css`. Every visual property applied to DOM elements must come from a CSS class, not from inline `style="..."` attributes.

All classes referenced in this file must be defined in `styles.css`. The full class inventory is documented in the "CSS Class Contract" section below.

---

## Script Loading

Loads on the source page template only, after `scripts.js` and `bda-partials-loader.js`:

```html
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="/js/scripts.js"></script>
<script src="/js/bda-partials-loader.js"></script>
<script src="/archive/sources/bda-source-page.js"></script>
```

The script is wrapped in an IIFE. It waits for `DOMContentLoaded`, reads the querystring, fetches `/data/detroit.json`, and renders.

---

## Data Requirements

Reads `/data/detroit.json` and consumes:

- `data.sources` — finds the source matching the querystring `id`
- `data.figures` — resolves `source.figure_ids` to figure names/modalities for the "Cited in" section and surfaces related sources

### Required source fields

The source object must have (at minimum):

- `id`, `title`, `category`, `type`, `figure_ids` — required on every source

### Optional source fields consumed for rendering

| Field | Used For |
|-------|----------|
| `year` | Metadata rail; citation |
| `url` | Viewer (external link mode); metadata rail (permalink row) |
| `author` | Metadata rail; citation |
| `publisher` | Metadata rail; citation |
| `repository` | Metadata rail; citation (archival format); viewer (when no URL) |
| `extent` | Metadata rail |
| `language` | Metadata rail |
| `rights` | Metadata rail; citation footer |
| `access_level` | Viewer dispatch; access notice rendering |
| `date_accessed` | Citation (when accessing online sources) |
| `notes` | Metadata rail (expanded notes section) |
| `media` (reserved) | Viewer dispatch for multi-asset sources |
| `interview` (reserved) | Interview metadata panel (post-IRB) |

Fields set to `null` are either omitted from the rail or rendered as "—" depending on the field. The rendering rules are documented per-field below.

---

## Initialization Flow

```
DOMContentLoaded
  ↓
cacheDom()
  ↓
parseQuerystring() → extract id
  ↓
loadData() → fetch /data/detroit.json
  ↓
findSource(id) → locate source in data.sources
  ↓
  ┌─ source not found → renderNotFound() → exit
  └─ source found:
       ↓
     renderHeader(source)
     renderViewer(source)         ← dispatches by type / media / access_level
     renderMetadataRail(source)
     renderCitedIn(source, data.figures)
     renderRelatedSources(source, data.sources, data.figures)
     renderCitationBlock(source)
     bindEvents()
```

### Not-found handling

If the querystring `id` does not match any source, the page renders a not-found state:

```html
<div role="alert" class="bda-source-not-found">
    <h1>Source not found</h1>
    <p>The source you're looking for doesn't exist in this archive.
       <a href="/archive/sources/">Browse all sources</a>.</p>
</div>
```

The `role="alert"` ensures screen readers announce the not-found state immediately.

### Missing querystring

If the URL has no `id` parameter at all, the page redirects to `/archive/sources/` (the landing page):

```javascript
if (!sourceId) {
    window.location.replace('/archive/sources/');
    return;
}
```

`replace` (not `assign`) avoids polluting browser history with the broken URL.

---

## Page Structure

The page template must contain these structural elements:

```html
<main id="main-content">
    <header class="bda-source-header">
        <!-- Title, category badge, type, permalink — rendered by renderHeader() -->
    </header>

    <div class="bda-source-layout">
        <section class="bda-source-viewer" id="bda-source-viewer"
                 aria-labelledby="bda-source-viewer-heading">
            <h2 id="bda-source-viewer-heading" class="sr-only">Source</h2>
            <!-- Rendered by renderViewer() -->
        </section>

        <aside class="bda-source-metadata-rail"
               aria-labelledby="bda-source-metadata-heading">
            <h2 id="bda-source-metadata-heading">Metadata</h2>
            <dl id="bda-source-metadata-list">
                <!-- Rendered by renderMetadataRail() -->
            </dl>
        </aside>
    </div>

    <section class="bda-source-cited-in"
             aria-labelledby="bda-source-cited-in-heading">
        <h2 id="bda-source-cited-in-heading">Cited In</h2>
        <div id="bda-source-cited-in-list">
            <!-- Rendered by renderCitedIn() -->
        </div>
    </section>

    <section class="bda-source-related"
             aria-labelledby="bda-source-related-heading">
        <h2 id="bda-source-related-heading">Related Sources</h2>
        <div id="bda-source-related-list">
            <!-- Rendered by renderRelatedSources() -->
        </div>
    </section>

    <section class="bda-source-citation"
             aria-labelledby="bda-source-citation-heading">
        <h2 id="bda-source-citation-heading">Citation</h2>
        <!-- Rendered by renderCitationBlock() -->
    </section>
</main>
```

### Heading hierarchy

- `<h1>` — source title (set in `renderHeader()`)
- `<h2>` — section headings (Source viewer [sr-only], Metadata, Cited In, Related Sources, Citation)
- `<h3>` — subsections within sections (figure names in Cited In, related source card titles)

Never skip heading levels. The source title `<h1>` must be unique per page — no other `<h1>` elements exist.

---

## Rendering Functions

### `renderHeader(source)`

Renders the page header: source title, category badge, type label, and a copy-permalink button.

**Structure:**

```html
<h1 class="bda-source-title">Crime Partners</h1>
<div class="bda-source-header-meta">
    <span class="bda-source-card-category bda-cat-primary">Primary</span>
    <span class="bda-source-type">Novel</span>
    <span class="bda-source-year">1974</span>
    <button type="button" class="bda-source-permalink-btn"
            aria-label="Copy permalink to clipboard">
        Copy permalink
    </button>
</div>
```

**Page title update:** After rendering the header, update `document.title` to `[Source Title] | Detroit Badman Archive` so the browser tab and screen reader announcements reflect the source.

**Permalink behavior:** Clicking the button copies the full URL (including the `?id=...` querystring) to the clipboard. Uses the same `copyToClipboard()` helper as the citation block — see below.

---

### `renderViewer(source)`

Dispatches to a type-specific viewer based on the source's `type`, `media`, and `access_level` fields. The viewer is the dominant visual element on the page.

### Viewer dispatch logic

```javascript
function renderViewer(source) {
    // 1. Check access_level first — some sources are restricted entirely
    if (source.access_level === 'embargoed') {
        return renderEmbargoedViewer(source);
    }
    if (source.access_level === 'consent_required') {
        return renderConsentRequiredViewer(source);
    }
    if (source.access_level === 'restricted') {
        return renderRestrictedViewer(source);
    }

    // 2. Check for multi-asset media (reserved — not active at launch)
    if (source.media && source.media.length > 0) {
        return renderMultiAssetViewer(source);
    }

    // 3. Fall through to type-based dispatch
    return renderByType(source);
}
```

### Access-level viewers

Each restricted-access viewer shows a clear message explaining the restriction and what the user can do.

**`renderEmbargoedViewer(source)`:**
```html
<div class="bda-source-access-notice" role="note">
    <h3>This source is under embargo</h3>
    <p>This source is temporarily restricted and will be available on [date].</p>
    <p>See the metadata rail for repository information if in-person access is available.</p>
</div>
```

**`renderConsentRequiredViewer(source)`:**
```html
<div class="bda-source-access-notice" role="note">
    <h3>This source requires consent to access</h3>
    <p>This source was produced under participant consent terms that restrict open display.
       See the metadata rail for the consent scope and contact information.</p>
</div>
```

**`renderRestrictedViewer(source)`:**
```html
<div class="bda-source-access-notice" role="note">
    <h3>This source requires institutional access</h3>
    <p>This source is held at [repository] and requires an institutional affiliation
       or an on-site visit to access. See the metadata rail for repository details.</p>
</div>
```

Each notice uses `role="note"` (secondary context that's still part of the main content). Do not use `role="alert"` — these notices are not time-critical and auto-announcing them would be noisy.

### Type-based viewers (`renderByType`)

Based on the source's `type` field:

**Text-based sources (`novel`, `book`, `biography`, `academic`, `news`, `newspaper`, `obituary`, `criticism`, `manuscript`, `letter`, `legal`, `government`, `founding_document`, `organizational_document`, `organizational_statement`, `newsletter`, `reference`):**

```html
<div class="bda-source-viewer-text">
    <a class="btn btn-primary bda-source-view-external"
       href="[source.url]" target="_blank" rel="noopener noreferrer">
        View source
        <span class="sr-only">(opens in new tab)</span>
    </a>
    <!-- Optional: embedded description from notes if present -->
</div>
```

If `source.url` is null (archival-only text source), show a repository-access message pointing to the metadata rail.

**Visual sources (`artwork`, `photo`, `image`):**

```html
<figure class="bda-source-viewer-image">
    <img src="[source.url]" alt="[source.title]">
    <figcaption>[source.title]</figcaption>
</figure>
```

The `alt` text is the source title. If the artwork requires extended description, place it in the `notes` field; the metadata rail renders `notes` below the viewer.

**Audio sources (`audio_recording`, `podcast`, `interview` when no `media` array):**

```html
<div class="bda-source-viewer-audio">
    <audio controls>
        <source src="[source.url]" type="audio/mpeg">
        Your browser does not support the audio element.
    </audio>
    <!-- Transcript section renders only if available in media array or notes -->
</div>
```

**Video sources (`film`, `television`, `documentary`, `video`):**

- If `source.url` points to a publisher page (Kanopy, Criterion, vendor streaming), render a "View on [publisher]" external link like text sources
- If `source.url` is a direct video file (rare), render `<video controls>` with captions track if available via `media` array
- Never auto-play

**Publisher / archival / institutional / website / digital_archive:**

Render a "Visit source" external link. For `publisher` type with `repository: "Unknown - company defunct"` (like the Holloway House records), render the restricted-access pattern instead.

**Comics:**

Treat as text source with external link to publisher, unless a `media` array provides page scans.

### Multi-asset viewer (reserved)

When `source.media` is populated (post-IRB interviews, multi-format archival sources), render a tabbed interface with one tab per asset:

```html
<div class="bda-source-viewer-multi" role="region"
     aria-label="Source assets">
    <div role="tablist" aria-label="Available formats">
        <button role="tab" aria-selected="true"
                id="bda-asset-tab-0" aria-controls="bda-asset-panel-0">
            Audio
        </button>
        <button role="tab" aria-selected="false"
                id="bda-asset-tab-1" aria-controls="bda-asset-panel-1">
            Transcript
        </button>
    </div>
    <div role="tabpanel" id="bda-asset-panel-0"
         aria-labelledby="bda-asset-tab-0">
        <audio controls>
            <source src="[media[0].url]" type="[media[0].mime_type]">
        </audio>
    </div>
    <div role="tabpanel" id="bda-asset-panel-1"
         aria-labelledby="bda-asset-tab-1" hidden>
        <!-- Transcript content -->
    </div>
</div>
```

**Tab keyboard behavior (WCAG 2.1.1, 2.4.3):**
- Tab key: moves focus into and out of the tablist
- Arrow keys: cycle between tabs when tablist has focus
- Enter/Space: activate the focused tab
- Follows the WAI-ARIA Authoring Practices pattern for tabs

**Status:** The multi-asset viewer and interview metadata panel are **reserved — not active at launch**. Document as code paths to be implemented when the first source with a `media` array is added to the JSON.

### Interview metadata panel (reserved)

When `source.interview` is populated (post-IRB), render a dedicated interview panel below the metadata rail:

```html
<section class="bda-source-interview-panel"
         aria-labelledby="bda-source-interview-heading">
    <h2 id="bda-source-interview-heading">Interview Details</h2>
    <dl>
        <dt>Interviewee</dt><dd>[interviewee]</dd>
        <dt>Interviewer</dt><dd>[interviewer]</dd>
        <dt>Date conducted</dt><dd>[date_conducted]</dd>
        <dt>Location</dt><dd>[location]</dd>
        <dt>Consent scope</dt><dd>[consent_scope]</dd>
        <dt>IRB protocol</dt><dd>[irb_protocol]</dd>
    </dl>
</section>
```

Uses `<dl>` semantics so screen readers announce term-definition pairs.

---

### `renderMetadataRail(source)`

Renders the source's scholarly metadata in a definition list. The rail is the aside on the right side of the source viewer layout.

### Field rendering rules

| Field | Rendered When | Display |
|-------|---------------|---------|
| `type` | Always | Title-cased ("Audio Recording") |
| `category` | Always | Capitalized with color badge class |
| `year` | Not null | Integer as-is; "—" if null |
| `author` | Not null | As-is; omitted if null |
| `publisher` | Not null | As-is; omitted if null |
| `repository` | Not null | As-is; omitted if null |
| `extent` | Not null | As-is; omitted if null |
| `language` | Not null | Resolved from ISO 639-1 (`"en"` → `"English"`); omitted if null |
| `rights` | Not null | As-is; omitted if null |
| `access_level` | Not `"public"` | Badge + human label; omitted when `"public"` |
| `date_accessed` | Not null | Formatted as "Accessed [date]"; omitted if null |
| `permalink` | Always | Full current URL as copyable text with copy button |
| `notes` | Not null | Rendered below the `<dl>` as a separate block; omitted if null |

**Structure:**

```html
<dl id="bda-source-metadata-list">
    <dt>Type</dt><dd>Novel</dd>
    <dt>Category</dt><dd><span class="bda-source-card-category bda-cat-primary">Primary</span></dd>
    <dt>Year</dt><dd>1974</dd>
    <dt>Author</dt><dd>Donald Goines (as Al C. Clark)</dd>
    <dt>Publisher</dt><dd>Holloway House</dd>
    <dt>Language</dt><dd>English</dd>
    <dt>Permalink</dt>
    <dd>
        <code class="bda-source-permalink-text">https://detroit.badmandigitalarchive.com/archive/sources/?id=src_dt_0002</code>
        <button type="button" class="bda-source-permalink-copy"
                aria-label="Copy permalink to clipboard">
            Copy
        </button>
    </dd>
</dl>

<!-- Rendered only if notes exist -->
<div class="bda-source-notes">
    <h3>Notes</h3>
    <p>[escaped notes text]</p>
</div>
```

### Language resolution

The `language` field stores ISO 639-1 codes (`"en"`, `"fr"`, `"es"`, etc.). Render as the full English language name for readability. A small lookup map in the file handles the common cases:

```javascript
var LANGUAGE_LABELS = {
    en: 'English',
    fr: 'French',
    es: 'Spanish',
    de: 'German',
    it: 'Italian'
    // Extend as needed
};
```

Unknown codes fall back to the raw code so missing entries remain visible rather than silent.

### Access-level badge

Non-public access levels render a badge + human-readable label in the metadata rail:

| `access_level` | Badge class | Human label |
|----------------|-------------|-------------|
| `restricted` | `.bda-access-badge-restricted` | "Restricted — institutional access required" |
| `embargoed` | `.bda-access-badge-embargoed` | "Embargoed" |
| `consent_required` | `.bda-access-badge-consent` | "Consent required" |

`public` is not rendered (default state, no badge needed).

---

### `renderCitedIn(source, figures)`

Renders the list of figures that reference this source. Order is **alphabetical by modality, then alphabetical by last name within modality.**

### Sorting

```javascript
function sortCitedInFigures(figureIds, figuresById) {
    return figureIds
        .map(id => figuresById[id])
        .filter(f => f) // drop any dangling IDs
        .sort((a, b) => {
            // First: alphabetical by modality
            var modalityCmp = a.modality.localeCompare(b.modality);
            if (modalityCmp !== 0) return modalityCmp;
            // Within modality: alphabetical by last name
            return lastName(a.name).localeCompare(lastName(b.name));
        });
}
```

### Last-name extraction

Figure names in the archive vary:
- `"Donald Goines"` → last name `"Goines"`
- `"General Gordon Baker Jr."` → last name `"Baker"` (strip suffix, take the last remaining token)
- `"Kenyatta"` → single-name figures use the full name as the sort key (fictional characters often have single names)
- `"Gaidi & Imari Obadele"` → paired entries use the shared surname `"Obadele"`

The `lastName()` helper handles these cases:

```javascript
function lastName(fullName) {
    var SUFFIXES = ['Jr.', 'Sr.', 'II', 'III', 'IV'];
    var parts = fullName.split(/\s+/);

    // Strip suffix if present
    if (parts.length > 1 && SUFFIXES.includes(parts[parts.length - 1])) {
        parts.pop();
    }

    // Paired entries ("X & Y Surname") — use final token
    if (parts.includes('&')) {
        return parts[parts.length - 1];
    }

    // Single-name figures — return the only token
    if (parts.length === 1) {
        return parts[0];
    }

    // Standard — last token is last name
    return parts[parts.length - 1];
}
```

Edge cases that don't match these patterns (rare) sort by their final token, which may occasionally be imperfect. When a figure is added whose sort behavior is wrong, the fix is to special-case it here rather than rewriting the sort.

### Rendering structure

Figures are rendered grouped by modality, with a modality heading and then the sorted list within:

```html
<div id="bda-source-cited-in-list">
    <div class="bda-cited-in-modality-group">
        <h3 class="bda-cited-in-modality-heading">
            <span class="bda-filter-modality-marker bda-mm-detective" aria-hidden="true"></span>
            Detective
        </h3>
        <ul class="bda-cited-in-list">
            <li>
                <a href="/archive/figures/?id=action_jackson">Jackson, Action</a>
            </li>
            <!-- ... -->
        </ul>
    </div>
    <div class="bda-cited-in-modality-group">
        <h3 class="bda-cited-in-modality-heading">
            <span class="bda-filter-modality-marker bda-mm-revolutionary" aria-hidden="true"></span>
            Revolutionary
        </h3>
        <!-- ... -->
    </div>
</div>
```

### Figure link format

Each figure links to `/archive/figures/?id=[figure_id]`. The link text is `"[Last Name], [First Name(s)]"` for standard scholarly ordering. Single-name figures are rendered as the name alone.

### Empty state

If `source.figure_ids` is empty or all IDs are dangling:

```html
<p class="bda-cited-in-empty">No figures in this archive currently reference this source.</p>
```

No `role="alert"` — this is an informational state, not an error.

---

### `renderRelatedSources(source, allSources, allFigures)`

Renders a grid of sources that share at least one figure with the current source.

### Relatedness calculation

```javascript
function findRelatedSources(source, allSources) {
    if (!source.figure_ids || source.figure_ids.length === 0) return [];

    var currentFigureIds = new Set(source.figure_ids);

    return allSources
        .filter(other => other.id !== source.id)
        .map(other => ({
            source: other,
            overlap: (other.figure_ids || []).filter(id => currentFigureIds.has(id)).length
        }))
        .filter(item => item.overlap > 0)
        .sort((a, b) => {
            // Most figure overlap first
            if (b.overlap !== a.overlap) return b.overlap - a.overlap;
            // Tiebreak: alphabetical by title
            return a.source.title.localeCompare(b.source.title);
        })
        .map(item => item.source);
}
```

### Result cap

Cap the related list at **12 sources** to keep the page from becoming unwieldy when a source is associated with a heavily-cited figure. Beyond 12, the user can navigate to the figure's page and browse all its sources.

### Card format

Related sources render as compact cards matching the sources landing page pattern (same CSS classes, same card markup):

```html
<ul class="bda-source-related-grid">
    <li>
        <a class="bda-source-card" href="/archive/sources/?id=src_dt_0004"
           aria-label="Low Road: The Life and Legacy of Donald Goines (2004)">
            <!-- Standard card content per bda-sources.js renderCard() -->
        </a>
    </li>
</ul>
```

### Empty state

```html
<p class="bda-source-related-empty">No related sources in this archive.</p>
```

---

### `renderCitationBlock(source)`

Renders a citation in one of three formats: Chicago (default), MLA, APA. Includes a format toggle and a copy-to-clipboard button.

### Structure

```html
<div class="bda-citation-block">
    <fieldset class="bda-citation-format-group">
        <legend>Citation format</legend>
        <label>
            <input type="radio" name="citation-format" value="chicago" checked>
            Chicago
        </label>
        <label>
            <input type="radio" name="citation-format" value="mla">
            MLA
        </label>
        <label>
            <input type="radio" name="citation-format" value="apa">
            APA
        </label>
    </fieldset>

    <div class="bda-citation-text" id="bda-citation-text">
        <!-- Formatted citation rendered here -->
    </div>

    <button type="button" class="bda-citation-copy-btn"
            aria-describedby="bda-citation-copy-status">
        Copy citation
    </button>

    <div id="bda-citation-copy-status" class="sr-only" role="status" aria-live="polite">
        <!-- Populated briefly after copy -->
    </div>
</div>
```

### Citation generation

Each format has its own generator function. The generators consume source fields and produce plain-text citation strings.

### Chicago (default)

The archive's humanities domain standard. Chicago has two styles: notes-and-bibliography (NB) and author-date. Humanities scholarship uses NB. The archive generates the bibliography form (reversed-name, period-separated).

**Novel / book format:**
```
[Author Last, First]. *[Title]*. [Publisher], [Year].
```

Example: `Goines, Donald. *Dopefiend*. Holloway House, 1971.`

**Academic book / biography — same as novel format.**

**Journal article / news article format:**
```
[Author Last, First]. "[Title]." *[Publication]*, [Date if known].
```

**Film / television format:**
```
*[Title]*. Directed by [Director if known]. [Publisher/Distributor], [Year].
```

**Archival / government format:**
```
[Title]. [Repository], [Collection/Box if in notes].
```

**Interview format (post-IRB):**
```
[Interviewee Last, First]. Interview by [Interviewer]. [Repository/Archive], [Date conducted].
```

**Web source (when URL is present and source has no publisher):**
```
[Author Last, First]. "[Title]." [Site name or "Accessed"]. [URL].
```

### MLA

MLA 9th edition. Core template: Author. "Source Title." *Container*, Publisher, Date, Location.

**Novel / book format:**
```
[Author Last, First]. *[Title]*. [Publisher], [Year].
```

**Journal article format:**
```
[Author Last, First]. "[Title]." *[Journal]*, [Year], [URL or DOI].
```

**Film format:**
```
*[Title]*. [Publisher/Studio], [Year].
```

**Archival format:**
```
[Author Last, First, or "Untitled"]. [Description of item]. [Repository], [Date accessed].
```

### APA

APA 7th edition.

**Novel / book format:**
```
[Author Last, F.] ([Year]). *[Title]*. [Publisher].
```

**Journal article format:**
```
[Author Last, F.] ([Year]). [Title]. *[Journal]*. [URL]
```

**Film format:**
```
[Director Last, F.] (Director). ([Year]). *[Title]* [Film]. [Studio].
```

### Citation generator contract

Each generator returns a plain text string. The rendered citation in `#bda-citation-text` uses formatting conversions:

- Italic markers (`*Title*`) in the source string become `<em>Title</em>` in the rendered DOM
- Line breaks are preserved
- Escaping: all source fields pass through `escapeHtml()` before interpolation

When the user copies the citation, the clipboard receives the rendered text content (with italics preserved via Unicode italic characters, not HTML tags). Use `getComputedStyle` + text selection to capture the rendered form, or maintain a separate plain-text version alongside the HTML.

### Missing field handling

If a citation format requires a field the source lacks (e.g., MLA novel without an author), the citation still renders but with a bracketed placeholder:

```
[Author unknown]. *Dopefiend*. Holloway House, 1971.
```

This signals the missing data to the user rather than silently producing a misleading citation. Do not fabricate fields.

### Format toggle behavior

Radio buttons: selecting a different format regenerates the citation text in-place. The copy button always copies the currently-displayed format. No focus is moved when format changes — the user stays on the radio group.

Keyboard operation: Tab enters the radio group, arrow keys cycle formats (native radio behavior), Tab exits.

---

## Copy-to-Clipboard

Used by three buttons: header permalink, metadata rail permalink, citation copy. All share a single helper.

```javascript
function copyToClipboard(text, statusElement) {
    return navigator.clipboard.writeText(text)
        .then(() => {
            announceCopy(statusElement, 'Copied to clipboard');
        })
        .catch(() => {
            announceCopy(statusElement, 'Could not copy. Press Ctrl+C or Cmd+C to copy manually.');
        });
}

function announceCopy(statusElement, message) {
    statusElement.textContent = message;
    setTimeout(() => {
        statusElement.textContent = '';
    }, 3000);
}
```

### Accessibility (WCAG 4.1.3)

- Each copy button has an adjacent `aria-live="polite"` region that announces the copy result
- Status message is cleared after 3 seconds so repeated copies are announced each time
- Keyboard Enter/Space on the button triggers the same copy as mouse click (native button behavior)

### Browser support fallback

If `navigator.clipboard` is unavailable (very old browsers, non-HTTPS contexts), fall back to the legacy `document.execCommand('copy')` path or instruct the user to press Ctrl+C / Cmd+C manually. The archive targets modern browsers, so the modern path is the expected code path.

---

## Events

All event binding happens in `bindEvents()` after initial render.

| Event | Target | Action |
|-------|--------|--------|
| `click` | `.bda-source-permalink-btn` (header) | Copy full page URL |
| `click` | `.bda-source-permalink-copy` (metadata rail) | Copy full page URL |
| `change` | `input[name="citation-format"]` | Regenerate citation text for selected format |
| `click` | `.bda-citation-copy-btn` | Copy current citation to clipboard |
| `keydown` | Tab buttons in multi-asset viewer (reserved) | Arrow-key navigation per WAI-ARIA tabs pattern |

### No event listeners on navigation

The page does not manipulate nav state. That's the partial loader's job.

---

## CSS Class Contract

All classes referenced by this file must be defined in `styles.css`. The class inventory:

### Page chrome

- `.bda-source-header`
- `.bda-source-title`
- `.bda-source-header-meta`
- `.bda-source-type`
- `.bda-source-year`
- `.bda-source-permalink-btn`
- `.bda-source-layout`
- `.bda-source-not-found`

### Viewer

- `.bda-source-viewer`
- `.bda-source-viewer-text`
- `.bda-source-viewer-image`
- `.bda-source-viewer-audio`
- `.bda-source-viewer-multi`
- `.bda-source-view-external`
- `.bda-source-access-notice`

### Metadata rail

- `.bda-source-metadata-rail`
- `.bda-source-metadata-list` (on the `<dl>`)
- `.bda-source-permalink-text`
- `.bda-source-permalink-copy`
- `.bda-source-notes`

### Access-level badges

- `.bda-access-badge-restricted`
- `.bda-access-badge-embargoed`
- `.bda-access-badge-consent`

### Cited-in

- `.bda-source-cited-in`
- `.bda-cited-in-modality-group`
- `.bda-cited-in-modality-heading`
- `.bda-cited-in-list`
- `.bda-cited-in-empty`

### Related sources

- `.bda-source-related`
- `.bda-source-related-grid`
- `.bda-source-related-empty`
- (reuses `.bda-source-card` and related classes from `bda-sources.js`)

### Citation

- `.bda-citation-block`
- `.bda-citation-format-group`
- `.bda-citation-text`
- `.bda-citation-copy-btn`

### Interview panel (reserved)

- `.bda-source-interview-panel`

**Documentation gap:** These classes are not yet in `CSS_DOCUMENTATION.md`. Adding the full `.bda-*` source-page class inventory to that doc is a pending task alongside the sources-landing inventory.

---

## Contrast Requirements

All text uses the archive's theme variables (`--dba-text-primary`, `--dba-text-secondary`, `--dba-text-muted`). No hardcoded colors.

The access-level badges use their own color scheme defined in CSS — each badge color must be contrast-verified against its background at 4.5:1 minimum for text, 3:1 for non-text UI elements. Defined in `styles.css`.

---

## Helpers

### `parseQuerystring()`

Reads the current URL's querystring via `URLSearchParams` and returns the `id` parameter:

```javascript
function parseQuerystring() {
    var params = new URLSearchParams(window.location.search);
    return params.get('id');
}
```

### `findSource(id, sources)`

Linear scan through the sources array for an exact ID match. Returns the source object or `null`.

### `escapeHtml(s)`

Same as the helper in `bda-sources.js`. Every user-facing string interpolated into HTML must pass through this.

### `formatTypeLabel(type)`

Same as the helper in `bda-sources.js`. Converts snake_case to Title Case.

### `lastName(fullName)`

Documented above in the "Cited In" section.

### Shared helper consolidation

`escapeHtml`, `formatTypeLabel`, and any other helper used by both `bda-sources.js` and `bda-source-page.js` should be considered for migration to `scripts.js` during the JS cleanup. Duplicating helper functions across page scripts creates sync risk. The pattern used at launch determines the pattern for future page scripts.

---

## Accessibility Checklist

Before committing any change to this file, verify:

- [ ] No hardcoded hex color values
- [ ] No inline `style="..."` attributes in emitted HTML
- [ ] Every emitted class exists in `styles.css`
- [ ] Page title (`document.title`) is updated to reflect the source
- [ ] `<h1>` is the source title, unique per page
- [ ] Section headings (`<h2>`) are sequential; no skipped levels
- [ ] Cited-in figure markers use `aria-hidden="true"` (decorative)
- [ ] All external links have `target="_blank"` + `rel="noopener noreferrer"` + sr-only "(opens in new tab)"
- [ ] Metadata rail uses `<dl>`/`<dt>`/`<dd>` (not a `<table>` or list of `<p>` tags)
- [ ] Access notices use `role="note"`, not `role="alert"`
- [ ] Not-found state uses `role="alert"`
- [ ] Copy-to-clipboard announces success via `aria-live="polite"` status region
- [ ] Citation format toggle is a native `<input type="radio">` group inside a `<fieldset>`/`<legend>`
- [ ] Source field strings all pass through `escapeHtml()` before interpolation
- [ ] Multi-asset viewer tabs follow WAI-ARIA Authoring Practices for tabs (reserved)
- [ ] Audio/video elements have `controls` and do not auto-play
- [ ] Language codes resolve to full English names
- [ ] Cited-in sort is alphabetical by modality, then alphabetical by last name
- [ ] Related sources cap at 12 results
- [ ] Missing citation fields render as bracketed placeholders, never silently omitted

---

## Troubleshooting

### Page shows "Source not found" on a source that exists
- Check that the querystring `id` parameter matches the source `id` exactly (case-sensitive, underscores not hyphens)
- Confirm `data/detroit.json` loaded successfully (network tab)
- Verify the source ID is spelled correctly in the sources array

### Citation shows [Author unknown] or [Publisher unknown]
- The source object's `author` or `publisher` field is null. This is correct behavior — the bracket signals missing data. Fix by adding the field to the JSON.

### Copy-to-clipboard silently fails
- `navigator.clipboard` requires HTTPS in modern browsers. Confirm the site is served over HTTPS.
- Check the browser console for permission errors
- Fall back to `document.execCommand('copy')` for legacy contexts

### Cited-in figures appear in wrong order
- Verify the sort is alphabetical by modality first, then by last name
- Check the `lastName()` helper's handling of the specific figure — suffixes, single names, and paired entries each have special handling

### Related sources list is empty despite obvious connections
- The relatedness calculation requires shared `figure_ids`. If two sources are conceptually related but don't share any figure, they are not surfaced. This is intentional — the relationship must be traceable through the data.
- Verify `source.figure_ids` is populated in the JSON

### Access-level badge doesn't appear
- The badge only renders for non-public access levels. Confirm `source.access_level` is set to `"restricted"`, `"embargoed"`, or `"consent_required"`.

### Audio player doesn't work
- Verify the `url` points to a file with a supported MIME type
- Check browser console for CORS errors if the file is hosted on a different domain
- Confirm the file exists at the URL

### Embargoed viewer shows without an expiration date
- The embargo message should reference `notes` for the expiration date. Add the date to `notes` in the JSON.

### Permalink button copies the wrong URL
- `window.location.href` includes the current querystring — this is correct behavior. If the page was reached via a redirect, the URL may differ from the canonical permalink. Verify the user arrived at the canonical URL.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | April 2026 | Initial documentation. Documents intended state of `bda-source-page.js` — no implementation yet. Spec covers query-based routing, viewer dispatch (type + access + media), metadata rail, cited-in with modality grouping and last-name sort, related sources, Chicago/MLA/APA citation toggle, copy-to-clipboard, reserved handlers for post-IRB interview integration. |
