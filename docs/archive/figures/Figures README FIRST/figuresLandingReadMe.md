# Figures Landing Page JavaScript Documentation

## File: `bda-figures.js`

Page-specific script for the Figures landing page at `/archive/figures/`. Renders a filterable, sortable grid of every figure in the archive organized by modality, with three filter dimensions, four sort orders, and URL-synced filter state for shareable deep links.

This document describes the intended state of the file — no implementation exists yet. When the file is built, it must match this spec.

---

## Page Purpose

The Figures landing exists to **declutter the map and network tools**. Figure browsing happens here, so the visualization tools can stay focused on spatial relationships (map) and influence networks (network) without trying to also be a figure catalog.

The page serves three audiences:

1. **Scholars** browsing figures by modality, era, or badman score
2. **Community members** finding figures by name or type (real vs. fictional)
3. **Educators** building reading lists around a modality or time period

Every filter and sort interaction is mirrored in the URL querystring so that any filter state is a shareable link.

---

## Why Modality-First Organization

The default view groups figures by modality with a modality heading above each group. Within each modality, figures are sorted by emergence year (earliest first) by default — matching the JSON file's ordering convention documented in `DATAREADME.md`.

Unlike the sources landing (which defaults to figure-grouped), figures are inherently modality-defined entities. A detective figure and a superhero-villain figure operate under fundamentally different material and historical conditions. The modality grouping isn't a presentation convenience — it's the archive's analytical architecture made visible. Flattening that into a single grid would erase the framework.

The user can switch to other sort orders (alphabetical, badman score, emergence year across all modalities) via the sort dropdown, but modality grouping is the scholarly default.

---

## Accessibility Standards

`bda-figures.js` must comply with:

- **WCAG 2.2 Level AA**
- **MSU Digital Accessibility Policy** (webaccess.msu.edu/policy/technical-guidelines)
- **MSU Basic Checklist** (webaccess.msu.edu/basiclist)

The WCAG success criteria that govern this file:

- **1.1.1 Non-text Content** — every visual element has a text alternative
- **1.3.1 Info and Relationships** — filter groups use semantic `<fieldset>`/`<legend>`; grid uses semantic list structure; modality groupings use proper heading hierarchy
- **1.4.1 Use of Color** — modality identity is conveyed via shape + color + text, never color alone
- **2.1.1 Keyboard** — every filter, sort, chip, and card is keyboard-operable
- **2.4.3 Focus Order** — focus does not jump unexpectedly when filters change
- **2.4.4 Link Purpose (In Context)** — every card's link text fully describes the destination figure
- **3.2.2 On Input** — changing a filter checkbox updates the grid without navigation
- **4.1.2 Name, Role, Value** — every interactive element has accessible name and appropriate role
- **4.1.3 Status Messages** — results count announces via `aria-live` when filters change

---

## Authority Boundaries

- `bda-figures.js` **does not** handle site-wide nav, partials, or footer. Those are the partial loader's responsibility.
- `bda-figures.js` **does not** define `getModalityConfig()`. It consumes the version defined in `scripts.js`, with an inline fallback if `scripts.js` has not yet loaded.
- `bda-figures.js` **does** own filtering, sorting, rendering, URL sync, and mobile filter toggle on the figures landing page.
- `bda-figures.js` **only runs** on the figures landing page. It must not be included on any other page.

---

## Style Rule

No hardcoded hex color values. Every color must resolve to a CSS variable defined in `styles.css`. Every visual property applied to DOM elements must come from a CSS class, not from inline `style="..."` attributes.

All classes referenced in this file must be defined in `styles.css`. The full class inventory is documented in the "CSS Class Contract" section below.

---

## Script Loading

```html
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="/js/scripts.js"></script>
<script src="/js/bda-partials-loader.js"></script>
<script src="/archive/figures/bda-figures.js"></script>
```

The script is wrapped in an IIFE. It waits for `DOMContentLoaded`, caches DOM references, fetches `/data/detroit.json`, and renders.

---

## Data Requirements

Reads `/data/detroit.json` and consumes one top-level field:

- `data.figures` — the array of figure objects, filtered to exclude entries where `_placeholder === true`

### Required fields on every figure

| Field | Type | Purpose |
|-------|------|---------|
| `id` | string | Card link target; filter value |
| `name` | string | Displayed on card; alphabetical sort |
| `type` | string | `"real"` or `"fictional"` — drives type filter and card label |
| `modality` | string | Drives modality filter and grouping |
| `meta_badman` | boolean | Displayed on card as badge when `true` |
| `years.active_start` | integer | Card label; era sort |
| `years.active_end` | integer | Card label |
| `emergence.year` | integer | Emergence sort; default within-modality sort |
| `scores` | object | Total badman score calculation via `calculateBadmanScore()` from `scripts.js` |

### Optional fields consumed

| Field | Type | Purpose |
|-------|------|---------|
| `years.birth` | integer \| null | Card label when present (real figures) |
| `years.death` | integer \| null | Card label when present (real figures) |
| `medium` | string | Card label (fictional figures: "Print", "Film", etc.) |
| `biography.description` | string | Truncated one-line descriptor on card |

Fields that exist on figures but are NOT consumed by the landing page (`connections`, `influence`, `geographic`, `biography.key_events`, `source_ids`, `sources`) belong to the individual figure page (`bda-figure-page.js`) or the visualization tools.

---

## Module Configuration

### Constants

```javascript
var DATA_URL = '/data/detroit.json';

var ACTIVE_MODALITIES = ['detective', 'revolutionary', 'superhero_villain'];
var PENDING_MODALITIES = ['gangsta_pimp', 'folk_hero_outlaw'];

var FIGURE_ROUTE_PREFIX = '/archive/figures/';
```

**`ACTIVE_MODALITIES` / `PENDING_MODALITIES`:** Matches the sources landing and the visualization pages. When a dormant modality activates, move its string from `PENDING_MODALITIES` to `ACTIVE_MODALITIES` here and in every other file that defines these arrays (`bda-sources.js`, `map.html`, `network.html`) simultaneously.

**Route prefix:** Matches the README repository structure. Figure cards link to `/archive/figures/?id=[figure_id]` (query-based, matching the source page convention).

### Modality ordering

Modality group headings and default sort ordering follow the JSON file's convention from `DATAREADME.md`:

```javascript
var MODALITY_ORDER = [
    'gangsta_pimp',
    'revolutionary',
    'detective',
    'superhero_villain',
    'folk_hero_outlaw'
];
```

At launch, only `revolutionary`, `detective`, and `superhero_villain` render groups (Goines is filtered out as dormant until GPM goes live — see "Dormant Figure Handling" below). When pending modalities activate, they slot into their defined positions.

### Figure type labels

```javascript
var TYPE_LABELS = {
    real: 'Real',
    fictional: 'Fictional'
};
```

Used for card badges and filter UI.

### Medium labels (fictional figures)

```javascript
var MEDIUM_LABELS = {
    print: 'Print',
    film: 'Film',
    television: 'Television',
    music: 'Music',
    comics: 'Comics'
};
```

---

## State

```javascript
var state = {
    figures: [],           // Filtered to real (non-placeholder, non-dormant) figures
    filters: {
        modality: new Set(),   // modality codes
        type:     new Set(),   // 'real' | 'fictional'
        era:      new Set()    // era bucket keys (see Era Filter below)
    },
    sort: 'modality-emergence',  // See Sort Orders below
    nameSearchQuery: ''           // Free-text filter by figure name
};
```

**What's NOT in state:** DOM references (live in `dom`), constants (module-level), derived values (computed per render).

---

## DOM References

Cached once on `DOMContentLoaded` via `cacheDom()`. All DOM queries happen at cache time.

### Required IDs in the page HTML

| ID | Element | Purpose |
|----|---------|---------|
| `bda-figures-grid` | `<div>` | Grid container |
| `bda-figures-count` | `<p>` with `aria-live="polite"` | Results count |
| `bda-figures-empty` | `<div>` | Empty-state message (initially hidden) |
| `bda-figures-empty-reset` | `<button>` | Reset button inside empty state |
| `bda-figures-sort` | `<select>` | Sort dropdown |
| `bda-figures-active-filters` | `<div>` | Active filter chip container |
| `bda-figures-sr-tbody` | `<tbody>` | Screen-reader data table body |
| `bda-filter-reset` | `<button>` | Filter rail reset button |
| `bda-figures-active-count` | `<span>` | Mobile filter toggle badge |
| `bda-filter-modality` | `<div>` inside `<fieldset>` | Modality filter container |
| `bda-filter-type` | `<div>` inside `<fieldset>` | Type (real/fictional) filter container |
| `bda-filter-era` | `<div>` inside `<fieldset>` | Era filter container |
| `bda-filter-name-search` | `<input type="text">` | Name search input |
| `bda-figures-filter-toggle` | `<button>` | Mobile filter panel toggle |
| `bda-figures-filter-rail` | `<aside>` | Filter rail container |

Missing any of these breaks the page. IDs are load-bearing.

---

## Initialization Flow

```
DOMContentLoaded
  ↓
cacheDom()
  ↓
loadData() → fetch /data/detroit.json
  ↓
processData(data)   ← filters out placeholders and dormant-modality figures
  ↓
hydrateFiltersFromURL()
  ↓
buildFilterRail()
  ↓
bindEvents()
  ↓
render()
```

### Error handling at load

If `/data/detroit.json` fails to fetch or parse:

```html
<p class="bda-figures-loading" role="alert">
    Could not load figures. Please try again.
</p>
```

Logged to console. No filter rail is built.

---

## Dormant Figure Handling

The JSON contains figures whose modality is dormant (Goines at launch, `modality: "gangsta_pimp"`). These figures are **filtered out of the figures landing entirely** — they do not appear as cards, do not count toward the grid total, and do not appear in filter options.

```javascript
function processData(data) {
    state.figures = (data.figures || []).filter(function (f) {
        // Skip placeholders
        if (f._placeholder) return false;
        // Skip figures whose modality is not active
        if (!ACTIVE_MODALITIES.includes(f.modality)) return false;
        // Require core fields
        return f.id && f.name && f.modality;
    });
}
```

**Why:** A user landing on `/archive/figures/` and seeing Goines there would expect to be able to filter him, view his page, see him in the map and network — but the rest of the archive treats him as not-yet-live. Showing him on the figures landing but nowhere else creates inconsistency. He returns to visibility when `gangsta_pimp` moves from pending to active.

**On the individual figure page:** If a user has a direct link to a dormant figure's page (e.g., from a preview link or external scholarship), the figure page still loads and displays normally. The dormancy only affects discoverability through the landing page and the visualization tools.

---

## Modality Label Resolution

Same pattern as `bda-sources.js`:

```javascript
function getModalityLabel(mod) {
    if (typeof window.getModalityConfig === 'function') {
        try {
            var cfg = window.getModalityConfig(mod);
            if (cfg && cfg.displayLabel) return cfg.displayLabel;
        } catch (e) { /* fall through */ }
    }
    return MODALITY_LABELS_FALLBACK[mod] || mod;
}
```

Uses `displayLabel` from `getModalityConfig()`, not `legendLabel`. Filter UI needs `"Revolutionary"`, not `"Star marker — Revolutionary Modality"`.

---

## Filter Rail Construction

Three filter groups plus a name search input, built in order:

1. **Modality** — active checkboxes + disabled pending entries
2. **Type** — real / fictional with counts
3. **Era** — pre-defined era buckets

Plus:

4. **Name search** — free-text input that filters figures by name substring

### Modality filter

Identical pattern to the sources landing — shape markers per modality, pending modalities disabled with "(pending)" tag. See `BDA_SOURCES_JS.md` for the markup pattern.

### Type filter

Simple two-option checkbox group:

```html
<label class="bda-filter-option">
    <input type="checkbox" data-filter="type" value="real">
    <span>Real <span class="bda-filter-pending-tag">(9)</span></span>
</label>
<label class="bda-filter-option">
    <input type="checkbox" data-filter="type" value="fictional">
    <span>Fictional <span class="bda-filter-pending-tag">(6)</span></span>
</label>
```

Count reflects the full dataset, not the filtered set (same stable-count convention as sources landing).

### Era filter

Pre-defined era buckets based on `emergence.year`. The buckets reflect the archive's historical scope:

| Era bucket | Year range | Label |
|-----------|------------|-------|
| `pre-1950` | < 1950 | Before 1950 |
| `1950-1970` | 1950–1970 | 1950–1970 |
| `1970-1990` | 1971–1990 | 1970s–1980s |
| `1990-2010` | 1991–2010 | 1990s–2000s |
| `post-2010` | 2011+ | 2010 onward |

**Why buckets, not a year slider:** The network visualization already has a year slider. The figures landing is a catalog, not a temporal exploration tool. Bucketed filters match how scholars actually describe periods in Black cultural history.

A figure matches an era bucket if its `emergence.year` falls in that bucket's range.

### Name search

Free-text input that performs case-insensitive substring match against figure `name`. Updates on every keystroke. Does not rebuild the filter rail — only re-renders the grid.

```html
<input type="text" id="bda-filter-name-search"
       placeholder="Search by name"
       aria-label="Search figures by name">
```

**Accessibility:** The input has an explicit `aria-label` because its label is the placeholder, which disappears on focus. Placeholder alone is not an accessible name.

---

## Filtering Logic

`applyFilters()` iterates `state.figures` and keeps figures that pass all four gates. Gates combine with AND; values within a single gate combine with OR.

### Modality filter

```javascript
if (state.filters.modality.size > 0 &&
    !state.filters.modality.has(figure.modality)) return false;
```

### Type filter

```javascript
if (state.filters.type.size > 0 &&
    !state.filters.type.has(figure.type)) return false;
```

### Era filter

```javascript
if (state.filters.era.size > 0) {
    var bucket = getEraBucket(figure.emergence.year);
    if (!state.filters.era.has(bucket)) return false;
}
```

### Name search

```javascript
if (state.nameSearchQuery) {
    var q = state.nameSearchQuery.toLowerCase();
    if (figure.name.toLowerCase().indexOf(q) === -1) return false;
}
```

Substring match (not word-boundary, not regex). Matches any part of the name — "Obadele" matches "Gaidi & Imari Obadele," "Jr." matches "General Gordon Baker Jr."

---

## Sort Orders

Four sort orders, exposed via the `<select id="bda-figures-sort">`:

| Value | Behavior |
|-------|----------|
| `modality-emergence` | **Default.** Grouped by modality (in `MODALITY_ORDER` sequence), sorted by `emergence.year` ascending within each group |
| `name-az` | Ungrouped, alphabetical by name A–Z (by last name where applicable — see "Last Name Extraction" below) |
| `emergence-asc` | Ungrouped, `emergence.year` ascending (oldest first, across modalities) |
| `score-desc` | Ungrouped, total badman score descending (highest first) |

**Default:** `modality-emergence` — the scholarly default that preserves the archive's analytical framework.

**Ungrouped sorts:** When any non-grouped sort is active, modality headings disappear and cards render as a single flat grid. Each card still displays its modality badge.

### Tiebreakers

- `name-az` ties (identical last names): break by first name A–Z
- `emergence-asc` ties (same emergence year): break by name A–Z
- `score-desc` ties (same total score): break by name A–Z

### Last Name Extraction

Same pattern as `bda-source-page.js`. The `lastName()` helper handles suffixes (Jr., Sr., III), single-name figures (Kenyatta), and paired entries (Gaidi & Imari Obadele → "Obadele").

---

## URL State Synchronization

Filter and sort changes update the querystring via `history.replaceState`. Loading a URL with querystring parameters hydrates state on first render.

### Querystring parameters

| Param | Filter | Format |
|-------|--------|--------|
| `m` | modality | Comma-separated modality codes |
| `t` | type | Comma-separated: `real`, `fictional`, or both |
| `e` | era | Comma-separated era bucket keys |
| `q` | name search | URL-encoded search string |
| `sort` | sort order | Single sort value (only when not default) |

**Example:**
```
/archive/figures/?m=revolutionary&t=real&sort=emergence-asc
```
= "show me real revolutionary figures, oldest emergence first."

**`history.replaceState`** not `pushState`, same rationale as sources landing. Filter changes do not create history entries.

---

## Active Filter Chips

Identical pattern to sources landing. Each active filter (including name search) renders as a removable chip:

```html
<span class="bda-filter-chip">
    <span class="bda-filter-chip-label">Modality:</span>
    Revolutionary
    <button type="button" class="bda-filter-chip-remove"
            data-filter="modality" data-value="revolutionary"
            aria-label="Remove Modality filter: Revolutionary">×</button>
</span>
```

Name search chip:

```html
<span class="bda-filter-chip">
    <span class="bda-filter-chip-label">Name:</span>
    "obadele"
    <button type="button" class="bda-filter-chip-remove"
            data-filter="name" data-value=""
            aria-label="Clear name search">×</button>
</span>
```

Removing a chip unchecks the corresponding filter, clears the search input (for name chips), re-renders, and updates the URL.

---

## Grid Rendering

### Modality-grouped rendering (default sort)

When sort is `modality-emergence`:

```html
<div id="bda-figures-grid" class="bda-figures-grouped">
    <section class="bda-figure-modality-group" aria-labelledby="bda-group-revolutionary">
        <h2 id="bda-group-revolutionary" class="bda-figure-modality-heading">
            <span class="bda-filter-modality-marker bda-mm-revolutionary" aria-hidden="true"></span>
            Revolutionary
            <span class="bda-figure-modality-count">(5)</span>
        </h2>
        <ul class="bda-figure-card-list">
            <li><!-- figure card --></li>
            <!-- ... -->
        </ul>
    </section>
    <section class="bda-figure-modality-group" aria-labelledby="bda-group-detective">
        <!-- ... -->
    </section>
    <!-- ... -->
</div>
```

**Heading hierarchy:**
- `<h1>` is the page title (set in page HTML — "Figures")
- `<h2>` is each modality group heading
- `<h3>` is each figure card title

No heading level is skipped.

**Modality group count:** Shows the number of matching figures in that group after filters apply. Groups with zero matching figures after filtering are hidden entirely (both heading and list).

### Flat rendering (non-default sorts)

When sort is any non-grouped order:

```html
<div id="bda-figures-grid" class="bda-figures-flat">
    <ul class="bda-figure-card-list">
        <li><!-- figure card --></li>
        <!-- ... -->
    </ul>
</div>
```

No modality headings. Cards render in sorted order. Heading hierarchy drops to `<h1>` → `<h3>` (skipping `<h2>`) when there are no modality group headings — this is acceptable because the page's structure is defined by landmarks, not heading levels alone, and the absence of `<h2>` in flat view is logically correct (no subsections exist).

### Figure card

```html
<a class="bda-figure-card" href="/archive/figures/?id=scott_ron"
   aria-label="Ron Scott — Revolutionary, Real, 1968–2015, Badman Score 23 out of 25">
    <div class="bda-figure-card-thumb">
        <span class="bda-filter-modality-marker bda-mm-revolutionary" aria-hidden="true"></span>
        <span class="bda-figure-card-type-badge bda-type-real">Real</span>
        <span class="bda-figure-card-meta-badge" aria-hidden="true">Meta-Badman</span>
        <!-- Meta-Badman badge only renders when meta_badman === true -->
    </div>
    <div class="bda-figure-card-info">
        <h3 class="bda-figure-card-title">Ron Scott</h3>
        <p class="bda-figure-card-era">1968–2015</p>
        <p class="bda-figure-card-descriptor">Co-founder of Detroit Black Panther Party; 47 years of Black liberation organizing.</p>
        <p class="bda-figure-card-score" aria-label="Badman score: 23 out of 25">
            <span class="bda-score-value">23</span>
            <span class="bda-score-total">/25</span>
        </p>
    </div>
</a>
```

**Accessibility details:**

- **Whole card is clickable** via the outer `<a>`, not via JS-bound click handlers — native link behavior keeps keyboard operation trivial
- **`aria-label` on the `<a>`** consolidates the card's disparate text into a single spoken phrase so screen readers don't read each element separately
- **Modality marker and meta-badman badge** use `aria-hidden="true"` (decorative — the `aria-label` carries the identity)
- **Badman score** has an explicit `aria-label` so the visual "23/25" is spoken as "Badman score: 23 out of 25"
- **`<h3>`** for figure title — correct hierarchy below the `<h2>` modality heading (grouped view) or at the top level of card content (flat view)

### Descriptor truncation

The card descriptor shows a one-line summary. It's extracted from `biography.description`:

```javascript
function buildDescriptor(figure) {
    var desc = figure.biography && figure.biography.description;
    if (!desc) return '';
    // First sentence or first 120 characters, whichever is shorter
    var firstSentence = desc.split(/[.!?]/)[0];
    if (firstSentence.length > 120) {
        return firstSentence.substring(0, 117) + '…';
    }
    return firstSentence + '.';
}
```

The truncation is visual — the full description lives on the individual figure page. If the first sentence ends awkwardly, the fix is to adjust the description's first sentence in the JSON to be card-friendly.

### Era label format

| Figure type | Era label format |
|-------------|------------------|
| Real, living | `[birth]–present` |
| Real, deceased | `[birth]–[death]` |
| Real, no birth known | `Active [active_start]–[active_end]` |
| Fictional | `[active_start]–[active_end] ([medium])` |
| Fictional, single work | `[active_start] ([medium])` |

### Meta-Badman badge

Only renders when `figure.meta_badman === true`. Visually distinct from the type badge. The badge has `aria-hidden="true"` because the `aria-label` on the card already encodes the figure's identity — announcing "Meta-Badman" twice is redundant.

### Empty state

If `applyFilters()` returns zero:

```html
<div id="bda-figures-empty" class="bda-figures-empty">
    <p>No figures match your current filters.</p>
    <button type="button" id="bda-figures-empty-reset" class="btn btn-primary">
        Clear all filters
    </button>
</div>
```

Grid is hidden via `hidden` attribute; empty-state is shown. Empty-state reset button clears all filters and refocuses on the filter rail.

---

## Screen-Reader Data Table

Every filtered figure also appears in a visually hidden table synced to the grid. Same pattern as sources landing and the visualization tools:

```html
<table class="sr-only" aria-label="Detroit badman figures data">
    <caption>Figures in the Detroit Badman Archive with modality, type, era, and score</caption>
    <thead>
        <tr>
            <th scope="col">Name</th>
            <th scope="col">Modality</th>
            <th scope="col">Type</th>
            <th scope="col">Era</th>
            <th scope="col">Badman Score</th>
        </tr>
    </thead>
    <tbody id="bda-figures-sr-tbody">
        <!-- Populated by bda-figures.js -->
    </tbody>
</table>
```

### Row structure

```html
<tr>
    <th scope="row">
        <a href="/archive/figures/?id=scott_ron">Ron Scott</a>
    </th>
    <td>Revolutionary</td>
    <td>Real</td>
    <td>1968–2015</td>
    <td>23/25</td>
</tr>
```

**Link in the row header:** The figure name is a link to the figure's page so screen reader users can activate it directly from the table. The map and network sr-only tables use row-level click handlers because they update a detail panel on the same page; the figures landing sr-only table navigates to a new page instead, so native `<a>` semantics are cleaner.

### Synchronization rule

Table body is repopulated every time the grid renders. The two surfaces are always in sync. Dormant figures are excluded from both (filtered out at `processData()` time).

---

## Events

All event binding happens once in `bindEvents()` after initial render.

| Event | Target | Action |
|-------|--------|--------|
| `change` | Filter checkboxes (delegated on filter rail) | Toggle filter value, re-render, update URL |
| `input` | `#bda-filter-name-search` | Update search query, re-render, update URL |
| `change` | `#bda-figures-sort` | Update sort, re-render, update URL |
| `click` | `#bda-filter-reset` | Clear all filters and search, re-render, update URL |
| `click` | `#bda-figures-empty-reset` | Same as above |
| `click` | `#bda-figures-filter-toggle` (mobile) | Toggle filter rail visibility |
| `click` | Chip remove buttons (delegated) | Remove filter, sync UI, re-render, update URL |
| `popstate` | `window` | Rehydrate from URL, rebuild rail, re-render |

### Keyboard accessibility

All filter checkboxes, the sort dropdown, and the name search input are native form controls with built-in keyboard support. Chip remove buttons are `<button>` elements. No custom keyboard handling is required.

### Focus management

- Removing a chip: no focus change (chip disappears; focus flows naturally)
- Resetting filters: focus remains on the reset button (browser default after click)
- Empty-state reset: focus moves to the filter rail's first checkbox after reset so keyboard users can immediately re-filter

The empty-state reset focus shift is intentional — empty state is a disorienting moment, and moving focus to the rail signals "here's where you make changes."

---

## Search Input Debouncing

The name search input filters on every keystroke, which can feel laggy on long typing sessions. Debouncing the search by 150ms balances responsiveness with performance:

```javascript
var searchTimer;
dom.filterNameSearch.addEventListener('input', function(e) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function() {
        state.nameSearchQuery = e.target.value.trim();
        render();
        updateUrlFromState();
    }, 150);
});
```

**Why 150ms:** Fast enough that typing "Obadele" feels instant, slow enough that typing fast doesn't re-render five times per second. This is a common value for search-input debouncing — adjust downward if the archive grows to the point where 150ms feels laggy.

---

## CSS Class Contract

All classes referenced by this file must be defined in `styles.css`. The inventory:

### Filter rail

Shares the sources-landing filter classes:
- `.bda-filter-option`, `.bda-filter-option.is-disabled`
- `.bda-filter-modality-marker`, `.bda-mm-[modality]`, `.is-pending`
- `.bda-filter-pending-tag`
- `.bda-filter-collapse-btn`
- `.bda-filter-chip`, `.bda-filter-chip-label`, `.bda-filter-chip-remove`

### Figures-specific

- `.bda-figures-grid`
- `.bda-figures-grouped` — modality-grouped layout modifier
- `.bda-figures-flat` — ungrouped layout modifier
- `.bda-figure-modality-group`
- `.bda-figure-modality-heading`
- `.bda-figure-modality-count`
- `.bda-figure-card-list` — `<ul>` inside each group
- `.bda-figure-card`
- `.bda-figure-card-thumb`
- `.bda-figure-card-info`
- `.bda-figure-card-title` — `<h3>`
- `.bda-figure-card-era`
- `.bda-figure-card-descriptor`
- `.bda-figure-card-score`
- `.bda-score-value` / `.bda-score-total`
- `.bda-figure-card-type-badge`
- `.bda-type-real` / `.bda-type-fictional`
- `.bda-figure-card-meta-badge`
- `.bda-figures-empty`
- `.bda-figures-loading`

**Documentation gap:** Like the sources landing classes, these are not yet in `CSS_DOCUMENTATION.md`. Adding the full figures-page class inventory to CSS_DOCUMENTATION is a pending task.

---

## Contrast Requirements

All text uses the archive's theme variables (`--dba-text-primary`, `--dba-text-secondary`, `--dba-text-muted`). No hardcoded colors.

The per-modality marker colors come from the CSS variables already defined for the modalities (`--dba-detective`, `--dba-revolutionary`, etc.). These have been contrast-verified per `HTML_TEMPLATES.md`.

The type badge colors (`.bda-type-real`, `.bda-type-fictional`) must be contrast-verified against their background at 3:1 minimum for UI components.

The meta-badman badge uses the archive's gold color (`--dba-gold`) on the archive's dark green background — verified at 8.2:1 in the existing contrast reference table.

---

## Helpers

### `calculateBadmanScore(scores)`

Consumed from `scripts.js` — see `JAVASCRIPT_DOCUMENTATION.md`. Returns the total 1–25 score.

### `getEraBucket(year)`

Returns the era bucket key for a given year:

```javascript
function getEraBucket(year) {
    if (year < 1950) return 'pre-1950';
    if (year <= 1970) return '1950-1970';
    if (year <= 1990) return '1970-1990';
    if (year <= 2010) return '1990-2010';
    return 'post-2010';
}
```

### `lastName(fullName)`

Same implementation as documented in `BDA_SOURCE_PAGE_JS.md`. Should be consolidated to `scripts.js` when duplicate helper cleanup happens.

### `escapeHtml(s)`

Same implementation as `bda-sources.js`. Should be consolidated to `scripts.js`.

### `formatTypeLabel(type)` — not needed here

Unlike the sources landing, figure types are a closed set (`real`, `fictional`) handled via `TYPE_LABELS` constant. No snake_case formatting required.

---

## Accessibility Checklist

Before committing any change to this file, verify:

- [ ] No hardcoded hex color values
- [ ] No inline `style="..."` attributes in emitted HTML
- [ ] Every emitted class exists in `styles.css`
- [ ] Modality group headings are `<h2>`; figure card titles are `<h3>`; no levels skipped
- [ ] In flat sort view, the missing `<h2>` level is acceptable (no subsections exist)
- [ ] Filter checkboxes are real `<input type="checkbox">` elements
- [ ] Sort dropdown is a real `<select>` element
- [ ] Name search has explicit `aria-label` (placeholder is not a label)
- [ ] Every modality filter option includes a shape marker
- [ ] Pending modalities have `disabled` AND `aria-disabled="true"`
- [ ] Every chip remove button has descriptive `aria-label`
- [ ] Every figure card `<a>` has descriptive `aria-label` with name, modality, type, era, and score
- [ ] Decorative icons (markers, badges) use `aria-hidden="true"`
- [ ] Badman score element has `aria-label` spelling out "N out of 25"
- [ ] Results count is in `aria-live="polite"` region (set in page HTML)
- [ ] Error state uses `role="alert"`
- [ ] Empty state uses `hidden` attribute, not `display: none`
- [ ] All user-facing strings pass through `escapeHtml()` before interpolation
- [ ] URL updates use `history.replaceState`
- [ ] Screen-reader table stays synchronized with visible grid
- [ ] Modality filter labels use `displayLabel` from `getModalityConfig()`, not `legendLabel`
- [ ] Dormant figures are filtered out at data processing time (not visible on this page)
- [ ] Empty-state reset moves focus to the first filter rail control

---

## Troubleshooting

### Grid shows "Could not load figures"
- Check browser console for 404 on `/data/detroit.json`
- Verify `detroit.json` is valid JSON
- Confirm `DATA_URL` matches hosting setup (absolute path `/data/detroit.json` assumes root-served site)

### Goines appears on the landing page
- Verify `ACTIVE_MODALITIES` does not include `gangsta_pimp`
- Confirm `processData()` filters on `ACTIVE_MODALITIES`

### Modality groups appear in wrong order
- Verify `MODALITY_ORDER` constant matches the order in `DATAREADME.md`
- Check `renderGrouped()` iterates `MODALITY_ORDER`, not `state.figures`

### Figure cards show "Badman Score: undefined/25"
- A figure is missing one or more score fields. Run the JSON validation checklist from `DATAREADME.md`.
- Verify `calculateBadmanScore()` is defined in `scripts.js` and loaded before `bda-figures.js`

### Era filter doesn't match expected figures
- Check `figure.emergence.year` exists and is an integer
- Verify `getEraBucket()` boundaries match the era labels

### Name search matches case-sensitively
- Confirm both the search query and the figure name are lowercased before comparison in `applyFilters()`

### Modality group heading renders without a marker shape
- Verify `.bda-mm-[modality]` CSS classes exist in `styles.css`
- Hard-refresh to rule out cache

### Filter chips don't appear when filters are active
- Verify `renderActiveChips()` is called inside `render()`
- Check `#bda-figures-active-filters` element exists in page HTML

### Sort dropdown doesn't change grid layout
- Verify the sort value matches one of the four defined sort orders
- Confirm `applySort()` handles the sort value (not falling through to default)

### Screen reader announces modality headings but not figure count
- Verify `#bda-figures-count` has `aria-live="polite"` in the page HTML
- Check that count text actually updates when filters change

### URL querystring has stale parameters after reset
- Verify `resetFilters()` calls `updateUrlFromState()` after clearing all filters
- Confirm `pushParam()` handles empty Sets by not including the param at all

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | April 2026 | Initial documentation. Documents intended state of `bda-figures.js` — no implementation yet. Spec covers modality-grouped default view, three filters (modality, type, era), name search with debouncing, four sort orders, URL sync, dormant figure filtering, accessibility criteria mapped to WCAG success criteria. |
