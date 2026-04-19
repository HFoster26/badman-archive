# Sources Landing Page JavaScript Documentation

## File: `bda-sources.js`

Page-specific script for the Primary Sources landing page at `/archive/sources/`. Renders a filterable, sortable grid of every source in the archive with five filter dimensions, six sort orders, and URL-synced filter state for shareable deep links.

This document describes the **intended state** of `bda-sources.js` post-cleanup. The key correction from current code is the separation of `displayLabel` vs. `legendLabel` on the return value of `getModalityConfig()` — filter UI uses `displayLabel` now, not `label`.

---

## Page Purpose

The Primary Sources landing exists to **declutter the map and network tools**. Sources browsing happens here, so the visualization tools can stay focused on figures and their relationships without trying to also be a source catalog.

The page serves three audiences:

1. **Scholars** browsing all sources by type, year, or repository
2. **Community members** finding sources associated with a particular figure or modality
3. **Researchers** building a citation list from filtered results

Every filter and sort interaction is mirrored in the URL querystring so that any filter state is a shareable link.

---

## Accessibility Standards

`bda-sources.js` must comply with:

- **WCAG 2.2 Level AA**
- **MSU Digital Accessibility Policy** (webaccess.msu.edu/policy/technical-guidelines)
- **MSU Basic Checklist** (webaccess.msu.edu/basiclist)

The WCAG success criteria that govern this file:

- **1.1.1 Non-text Content** — every visual element has a text alternative
- **1.3.1 Info and Relationships** — filter groups use semantic `<fieldset>`/`<legend>`, grid uses semantic list structure
- **1.4.1 Use of Color** — modality identity is conveyed via shape + color + text label, never color alone
- **2.1.1 Keyboard** — every filter, sort, chip, and card is keyboard-operable
- **2.4.3 Focus Order** — focus does not jump unexpectedly when filters change; focus returns to a sensible location after actions
- **2.4.4 Link Purpose (In Context)** — every card's link text fully describes the destination source
- **3.2.2 On Input** — changing a filter checkbox does not trigger navigation or unexpected context changes; it only updates the grid
- **4.1.2 Name, Role, Value** — every interactive element has accessible name and appropriate role
- **4.1.3 Status Messages** — the results count announces via `aria-live` when filters change

---

## Authority Boundaries

- `bda-sources.js` **does not** handle site-wide nav, partials, or footer. Those are the partial loader's responsibility.
- `bda-sources.js` **does not** define `getModalityConfig()`. It consumes the version defined in `scripts.js`, with an inline fallback for modality display labels if `scripts.js` has not yet loaded.
- `bda-sources.js` **does** own the filtering, sorting, rendering, URL sync, and mobile filter toggle on the sources landing page.
- `bda-sources.js` **only runs** on the sources landing page (`/archive/sources/`). It must not be included on any other page.

---

## Style Rule

No hardcoded hex color values. Every color must resolve to a CSS variable defined in `styles.css`. Every visual property applied to DOM elements must come from a CSS class, not from inline `style="..."` attributes.

All classes referenced in this file must be defined in `styles.css`. The full class inventory is documented in the "CSS Class Contract" section below and must stay synchronized with `CSS_DOCUMENTATION.md`.

---

## Script Loading

`bda-sources.js` loads on the sources landing page only, after `scripts.js` and `bda-partials-loader.js`:

```html
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="/js/scripts.js"></script>
<script src="/js/bda-partials-loader.js"></script>
<script src="/archive/sources/bda-sources.js"></script>
```

The script is wrapped in an IIFE so it does not leak globals. It waits for `DOMContentLoaded`, caches DOM references, fetches `/data/detroit.json`, and renders. It does not wait for `bda:partials-loaded` because the sources page does not interact with partial content — only with the main content area.

---

## Data Requirements

Reads from `/data/detroit.json`, consuming two top-level fields:

- `data.sources` — the flat array of source objects documented in `DATAREADME.md`
- `data.figures` — used to resolve `figure_ids` back-references to figure names for card labels and filter UI

### Required fields on every source object

| Field | Type | Purpose |
|-------|------|---------|
| `id` | string | Unique source ID in `src_[city]_NNNN` format |
| `title` | string | Displayed on card; used for title sort |
| `category` | string | `"primary"` / `"secondary"` / `"archival"` — drives category filter |
| `type` | string | Source format (`novel`, `film`, etc.) — drives type filter and thumbnail glyph |
| `figure_ids` | array | Back-references to figures — drives figure filter and "Cited in" labeling |

### Optional fields consumed

| Field | Type | Purpose |
|-------|------|---------|
| `year` | integer \| null | Displayed on card; used for year sort |
| `url` | string \| null | Triggers "External" badge when present without a repository |
| `repository` | string \| null | Drives repository filter |

Other source fields (`author`, `publisher`, `extent`, `language`, `rights`, `access_level`, `date_accessed`, `notes`) are not consumed by the landing page — they belong to the individual source page (`bda-source-page.js`).

---

## Module Configuration

### Constants

```javascript
var DATA_URL = '/data/detroit.json';

var ACTIVE_MODALITIES = ['detective', 'revolutionary', 'superhero_villain'];
var PENDING_MODALITIES = ['gangsta_pimp', 'folk_hero_outlaw'];

var FIGURE_ROUTE_PREFIX = '/archive/figures/';
var SOURCE_ROUTE_PREFIX = '/archive/sources/';
```

**`ACTIVE_MODALITIES` / `PENDING_MODALITIES`:** The filter UI shows active modalities as live checkboxes and pending modalities as disabled entries with a "(pending)" annotation. These arrays must stay synchronized with the `activeModalities` array in `map.html` and `network.html` — when Gangsta-Pimp or Folk Hero-Outlaw activates, move the string from `PENDING_MODALITIES` to `ACTIVE_MODALITIES` here and in the visualization pages simultaneously.

**Route prefixes:** Match the route convention locked in the README repository structure (`/archive/figures/[slug]/`, `/archive/sources/[slug]/`). Do not hardcode these prefixes elsewhere in the file — always reference the constants.

### Modality display labels — fallback

```javascript
var MODALITY_LABELS_FALLBACK = {
    detective: 'Detective',
    revolutionary: 'Revolutionary',
    superhero_villain: 'Superhero-Villain',
    gangsta_pimp: 'Gangsta-Pimp',
    folk_hero_outlaw: 'Folk Hero-Outlaw'
};
```

Used only when `window.getModalityConfig()` is unavailable (e.g., `scripts.js` failed to load). The normal path uses `getModalityConfig(mod).displayLabel` — see the "Modality Label Resolution" section below.

### Type-to-glyph map

```javascript
var TYPE_TO_GLYPH = { /* see existing code */ };
```

Maps source `type` strings to a glyph category (`'book'`, `'doc'`, `'news'`, `'photo'`, `'audio'`, `'film'`) for thumbnail rendering. Glyphs are CSS classes (`.bda-thumb-book`, `.bda-thumb-doc`, etc.) — the JS only selects which class to apply. When a new source type is added to the archive, add it to this map. Types not in the map fall back to `'doc'`.

---

## State

The module maintains a single `state` object. No global leaks; all mutations go through functions that call `render()` and `updateUrlFromState()` afterward.

```javascript
var state = {
    sources: [],        // All sources loaded from JSON
    figures: [],        // All figures (filtered to active-modality only)
    figureById: {},     // { figure.id → figure } for O(1) lookup
    filters: {
        modality:   new Set(),  // modality codes
        category:   new Set(),  // 'primary' | 'secondary' | 'archival'
        figure:     new Set(),  // figure IDs
        type:       new Set(),  // source type strings
        repository: new Set()   // repository names
    },
    sort: 'figure-az',          // See Sort Orders below
    typeSearchQuery: ''         // Free-text filter inside the type filter list
};
```

**Why `Set`?** Filters are conceptually "multi-select of unique values." `Set` enforces uniqueness and provides fast `add` / `delete` / `has` — the three operations the filter UI needs.

**What's NOT in state:** DOM references (live in `dom`), constants (live at module top), derived values (computed per render via `applyFilters()` / `applySort()`). State is the minimum data needed to reconstruct the current view.

---

## DOM References

Cached once on `DOMContentLoaded` via `cacheDom()`. All DOM queries happen at cache time — no ad-hoc `document.querySelector` calls inside render functions. This avoids repeated queries on every render and makes the contract with the page HTML explicit.

### Required IDs in the page HTML

The landing page HTML must contain these elements with exactly these IDs:

| ID | Element | Purpose |
|----|---------|---------|
| `bda-sources-grid` | `<div>` or `<ul>` | Card grid container |
| `bda-sources-count` | `<p>` with `aria-live="polite"` | Results count announcement |
| `bda-sources-empty` | `<div>` | Empty-state message (initially hidden) |
| `bda-sources-empty-reset` | `<button>` | Reset button inside empty state |
| `bda-sources-sort` | `<select>` | Sort dropdown |
| `bda-sources-active-filters` | `<div>` | Active filter chip container |
| `bda-sources-sr-tbody` | `<tbody>` | Screen-reader data table body |
| `bda-filter-reset` | `<button>` | Filter-rail reset button |
| `bda-sources-active-count` | `<span>` | Mobile filter toggle badge count |
| `bda-filter-modality` | `<div>` inside `<fieldset>` | Modality filter options container |
| `bda-filter-category` | `<div>` inside `<fieldset>` | Category filter options container |
| `bda-filter-figure-options` | `<div>` inside `<fieldset>` | Figure filter options container |
| `bda-filter-type-options` | `<div>` inside `<fieldset>` | Type filter wrapper (contains search + list) |
| `bda-filter-type-list` | `<div>` | Type filter options list |
| `bda-filter-type-search` | `<input type="text">` | Type filter search input |
| `bda-filter-repository-options` | `<div>` inside `<fieldset>` | Repository filter options container |
| `bda-filter-figure-count` | `<span>` | Count badge in figure fieldset legend |
| `bda-filter-type-count` | `<span>` | Count badge in type fieldset legend |
| `bda-filter-repository-count` | `<span>` | Count badge in repository fieldset legend |
| `bda-sources-filter-toggle` | `<button>` | Mobile filter panel toggle |
| `bda-sources-filter-rail` | `<aside>` | Filter rail container |

Missing any of these breaks the page. The landing page template is not free-form — IDs are load-bearing.

---

## Initialization Flow

```
DOMContentLoaded
  ↓
cacheDom()
  ↓
loadData() → fetch /data/detroit.json
  ↓
processData(data)
  ↓
hydrateFiltersFromURL()
  ↓
buildFilterRail()   ← builds the five filter groups
  ↓
bindEvents()        ← attaches all event listeners (once)
  ↓
render()            ← first paint
```

`render()` is called again (without rebuilding the filter rail) every time a filter, sort, or chip changes. The filter rail is only rebuilt when the type-search input changes (which filters the type list in place) or when `resetFilters()` is called.

### Error handling at load

If `/data/detroit.json` fails to fetch or parse, the grid shows a user-visible error message with `role="alert"`:

```html
<p class="bda-sources-loading" role="alert">
    Could not load sources. Please try again.
</p>
```

The error is also logged to the browser console. No filter rail is built if data load failed — the error message is the only content.

---

## Modality Label Resolution

The `getModalityLabel(mod)` helper resolves a modality code to its display label with graceful degradation:

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

**Key detail — `displayLabel` not `label`:** The filter UI needs a clean modality name (`"Detective"`, `"Revolutionary"`). The legend label format (`"Circle marker — Detective Modality"`) is wrong for a checkbox. `getModalityConfig()` returns both — `displayLabel` for filter UI and prose, `legendLabel` for map/network legend entries. This file uses `displayLabel` exclusively.

If an older version of `scripts.js` returns only a single `label` field (pre-split), this function falls back to the inline map, which is correct for filter UI. This graceful degradation ensures the sources page does not break during the `scripts.js` update rollout.

---

## Filter Rail Construction

Five filter groups, built in order:

1. **Modality** — active checkboxes + disabled pending entries
2. **Category** — primary / secondary / archival with counts
3. **Figure** — alphabetical list of figures that have at least one source
4. **Type** — source types sorted by count descending, with search input
5. **Repository** — repositories alphabetical (with "Unknown" variants sorted to end)

### Modality filter — accessibility pattern

Every modality option uses a modality-shape marker (`.bda-filter-modality-marker.bda-mm-[modality]`) so the filter visually matches the legend in the map and network tools. This is **non-color differentiation**: users see the shape AND the label text, so color vision differences do not obscure which modality they are toggling.

Pending modalities render as disabled checkboxes with `aria-disabled="true"` and a `.is-pending` class on the marker. They are not filterable — they exist in the UI to signal that those modalities are coming.

```html
<label class="bda-filter-option">
    <input type="checkbox" data-filter="modality" value="detective">
    <span class="bda-filter-modality-marker bda-mm-detective" aria-hidden="true"></span>
    <span>Detective</span>
</label>

<label class="bda-filter-option is-disabled">
    <input type="checkbox" disabled aria-disabled="true">
    <span class="bda-filter-modality-marker bda-mm-gangsta-pimp is-pending" aria-hidden="true"></span>
    <span>Gangsta-Pimp <span class="bda-filter-pending-tag">(pending)</span></span>
</label>
```

`aria-hidden="true"` on the marker span is correct because the marker is decorative — the adjacent text label carries the identity.

### Count badges in filter legends

Each filter fieldset's `<legend>` contains a small count badge (`<span id="bda-filter-X-count">`) that displays the number of currently-selected options in that group, or nothing if zero. This gives a compact visual signal of how many filters are active without scanning the entire rail.

### Counts on filter options

Counts next to each option show how many sources match that value **across the full source set**, not the currently-filtered set. This is the Airbnb / Zillow convention: counts stay stable as users toggle filters, so users can predict what each toggle will do. Changing this to dynamic counts would create the opposite effect — toggling one filter would reshuffle all other filters' counts, which is disorienting.

---

## Filtering Logic

`applyFilters()` iterates `state.sources` and keeps sources that pass all five filter gates. Gates are combined with AND (a source must pass every active filter).

Within a single filter group (e.g., three modalities checked), values combine with OR: a source matches if it is associated with any of the checked modalities. This matches the standard "multi-select" mental model — users expect "detective OR revolutionary" from checking both, not "detective AND revolutionary."

### Modality filter behavior

A source matches the modality filter if ANY of its `figure_ids` resolves to a figure whose modality is in the selected set. Sources not associated with any figure (`figure_ids: []`) never match a modality filter.

### Figure filter behavior

A source matches the figure filter if ANY of its `figure_ids` is in the selected set. Same ORing logic as modality.

### Category, type, repository filters

Each source has a single value for these fields, so matching is a straightforward `set.has(source.field)` check.

### Empty filter = no filter

If a filter set is empty (`state.filters.modality.size === 0`), that gate always passes. This matches user expectation: "I haven't selected anything" means "don't filter by this dimension."

---

## Sort Orders

Six sort orders, exposed via the `<select id="bda-sources-sort">`:

| Value | Behavior | Tiebreaker |
|-------|----------|------------|
| `figure-az` | Primary associated figure name, A–Z | Source title A–Z |
| `figure-za` | Primary associated figure name, Z–A | Source title A–Z |
| `title-az` | Source title, A–Z | — |
| `title-za` | Source title, Z–A | — |
| `year-asc` | Year ascending (oldest first) | Source title A–Z |
| `year-desc` | Year descending (newest first) | Source title A–Z |

**Default:** `figure-az` — this is the scholarly browsing mode (see all of Goines's sources, then all of Kenyatta's, etc.).

**Handling missing data:**
- Sources with no `year` sort last in both year orders (treated as `-Infinity`)
- Sources with no `figure_ids` sort last in both figure orders (fallback string `'zzz'` during comparison)
- `localeCompare` handles accented characters and case-insensitivity

**Primary associated figure:** Uses `source.figure_ids[0]` — the first figure in the array. This is an editorial convention: whoever maintains the JSON should order `figure_ids` with the "most associated" figure first when the association is lopsided (e.g., *Never Die Alone* is primarily about Goines even if it's also referenced in a secondary entry).

---

## URL State Synchronization

Every filter and sort change updates the querystring via `history.replaceState`. Loading a URL with querystring parameters hydrates state on first render. This is the deep-link mechanism.

### Querystring parameters

| Param | Filter | Format |
|-------|--------|--------|
| `m` | modality | Comma-separated modality codes |
| `c` | category | Comma-separated categories |
| `f` | figure | Comma-separated figure IDs |
| `t` | type | Comma-separated type strings |
| `r` | repository | Comma-separated repository names (URL-encoded) |
| `sort` | sort order | Single sort value (only present if not default) |

**Example:**
```
/archive/sources/?m=revolutionary,detective&c=primary&sort=year-desc
```
= "show me primary sources associated with revolutionary or detective figures, newest first."

**`history.replaceState` not `pushState`:** Filter changes do not create new history entries. The back button returns to the previous page, not to a previous filter state. This is a deliberate UX choice — filtering is an in-page adjustment, not a navigation event.

**`popstate` listener:** When the user navigates forward/back to a URL with different querystring params, the filter state and UI rebuild from the URL. This makes bookmarks and shared links work correctly.

---

## Active Filter Chips

Every active filter renders as a removable chip above the grid:

```html
<span class="bda-filter-chip">
    <span class="bda-filter-chip-label">Modality:</span>
    Detective
    <button type="button" class="bda-filter-chip-remove"
            data-filter="modality" data-value="detective"
            aria-label="Remove Modality filter: Detective">
        ×
    </button>
</span>
```

### Accessibility details

- Each chip's remove button has an `aria-label` that names both the filter dimension and the value. Screen reader users hear "Remove Modality filter: Detective, button" rather than an unlabeled "×".
- The `×` character is visual only; screen readers rely on the `aria-label`.
- Removing a chip unchecks the corresponding checkbox in the filter rail (two-way sync), re-renders the grid, and updates the URL.

### Event delegation

Chip removal uses a single delegated listener on the active-filters container. This is correct because chips are created and destroyed on every render — attaching listeners to individual chip buttons would leak handlers.

---

## Grid Rendering

Each source renders as a card via `renderCard(src)`. Cards are `<a>` elements wrapping the entire card content so the whole card is clickable.

### Card accessibility

The `<a>` element has an `aria-label` combining the title, primary figure, and year:

```html
<a class="bda-source-card" href="/archive/sources/src-dt-0002/"
   aria-label="Crime Partners — Donald Goines & Kenyatta (1974)">
    <div class="bda-source-card-thumb">
        <span class="bda-source-card-category bda-cat-primary">Primary</span>
        <div class="bda-source-thumb-glyph bda-thumb-book" aria-hidden="true"></div>
    </div>
    <div class="bda-source-card-info">
        <h3 class="bda-source-card-title">Crime Partners</h3>
        <p class="bda-source-card-figure">Donald Goines &amp; Kenyatta</p>
        <p class="bda-source-card-meta">Novel · 1974</p>
    </div>
</a>
```

- `<h3>` for the source title — fits inside the page's heading hierarchy (`<h1>` page title, `<h2>` grid section, `<h3>` card titles)
- `aria-hidden="true"` on the thumbnail glyph (decorative — the card's text carries the identity)
- `aria-label` on the `<a>` provides a complete, descriptive link purpose for screen readers even though the visible card text is split across multiple elements

### Slug format

The URL segment `src-dt-0002` is derived from the source's `id` (`src_dt_0002`) by converting underscores to hyphens. This is a URL aesthetics convention — underscores are legal in URLs but hyphens are the web standard. The individual source page's routing must handle the reverse conversion when looking up the source.

### Figure label formatting

- 0 figures → label omitted
- 1 figure → figure name
- 2 figures → `"Name A & Name B"`
- 3+ figures → `"Name A +2"` (first figure, plus count of remaining)

This prevents card overflow when a source is associated with many figures.

### External badge

Cards display an "External" badge in the thumbnail area when a source has a `url` but no `repository` — signaling that clicking the card goes to an external site (the individual source page will redirect or embed). This is informational; the card's main link still targets the individual source page, not the external URL directly.

### Empty-state rendering

If `applyFilters()` returns zero results:

- The grid is emptied and hidden (`dom.grid.hidden = true`)
- The empty-state `<div>` is shown (`dom.emptyState.hidden = false`)
- The empty-state contains a reset button (`#bda-sources-empty-reset`) that clears all filters

Both the empty state and the grid use the `hidden` attribute (native HTML), which is screen-reader-aware. Do not use `style="display: none"` here — `hidden` is the accessible equivalent.

---

## Screen-Reader Data Table

Every source also appears in a visually hidden `<table class="sr-only">` in the page HTML. `bda-sources.js` populates the table body (`#bda-sources-sr-tbody`) in sync with the grid.

```html
<tr>
    <th scope="row">Crime Partners</th>
    <td>Donald Goines & Kenyatta</td>
    <td>Novel</td>
    <td>1974</td>
    <td>—</td>
</tr>
```

**Why this exists:** WCAG 1.1.1 / 1.3.3 — the visual card grid is not accessible to screen readers in its native form (images, icons, spatial layout). The sr-only table provides the same data in a structure that screen readers can navigate row-by-row with standard table navigation commands.

**Synchronization rule:** The table body is repopulated every time the grid renders. The two surfaces are always in sync. If filtered results are zero, the table body is empty — the empty-state message is announced via the grid's empty state, which has `role="alert"` in the page HTML.

**No interactivity on rows:** Unlike the map and network sr-only tables (where rows are clickable to trigger detail panel updates), sr-only rows on the sources landing are informational only. Users navigate to individual sources via the card links, which are already accessible.

---

## Events

All event binding happens once in `bindEvents()` after initial render. No ad-hoc listener attachment inside render functions.

### Event summary

| Event | Target | Action |
|-------|--------|--------|
| `change` | Filter checkboxes (delegated on `#bda-sources-filter-rail`) | Toggle filter value, re-render, update URL |
| `click` | Filter group collapse toggles (delegated) | Expand/collapse fieldset contents |
| `input` | `#bda-filter-type-search` | Update type search query, rebuild type filter list |
| `change` | `#bda-sources-sort` | Update sort, re-render, update URL |
| `click` | `#bda-filter-reset` | Clear all filters, rebuild rail, re-render, update URL |
| `click` | `#bda-sources-empty-reset` | Same as above |
| `click` | `#bda-sources-filter-toggle` (mobile) | Toggle mobile filter rail open/closed |
| `click` | Chip remove buttons (delegated on `#bda-sources-active-filters`) | Remove filter, sync checkbox, re-render, update URL |
| `popstate` | `window` | Rehydrate from URL, rebuild rail, re-render |

### Keyboard accessibility

All filter checkboxes and sort dropdowns are native form controls, which provide keyboard operability by default. The filter group collapse toggles are `<button>` elements with `aria-expanded`. Chip remove buttons are `<button>` elements, activatable by Enter/Space. No custom keyboard handling is required.

### Focus management

- Removing a chip does not move focus. The chip disappears; focus remains on the document (or on whatever had focus before the click). The re-rendered chip list still has the remaining chips, so keyboard navigation through the chip bar continues naturally.
- Resetting filters does not move focus. The reset button receives focus (browser default after click) and the grid updates below it.
- Opening the mobile filter rail does not move focus into the rail. Users reach the rail via Tab order after the toggle button, which is natural.

These choices are deliberate: aggressive focus management can disorient keyboard users. The page lets native focus flow handle most cases and only intervenes when an interaction truly changes context (e.g., showing the empty state — no focus change needed because the grid element is replaced in place).

---

## CSS Class Contract

Every class emitted by this file must be defined in `styles.css`. The classes used are:

### Filter rail

- `.bda-filter-option` — filter checkbox row container
- `.bda-filter-option.is-disabled` — pending modality (disabled) state
- `.bda-filter-modality-marker` — shape marker next to modality checkbox
- `.bda-mm-detective` / `.bda-mm-revolutionary` / `.bda-mm-superhero-villain` / `.bda-mm-gangsta-pimp` / `.bda-mm-folk-hero-outlaw` — per-modality shape + color
- `.bda-filter-modality-marker.is-pending` — pending-state marker styling (muted)
- `.bda-filter-pending-tag` — small parenthesized tag text (for "(pending)" and count badges inline)
- `.bda-filter-collapse-btn` — fieldset collapse toggle button
- `.bda-filter-chip` — active filter chip
- `.bda-filter-chip-label` — chip dimension label ("Modality:")
- `.bda-filter-chip-remove` — chip remove button

### Source grid

- `.bda-source-card` — card wrapper
- `.bda-source-card-thumb` — thumbnail zone
- `.bda-source-card-category` — category badge
- `.bda-cat-primary` / `.bda-cat-secondary` / `.bda-cat-archival` — per-category badge color
- `.bda-source-card-external` — "External" badge
- `.bda-source-thumb-glyph` — glyph container
- `.bda-thumb-book` / `.bda-thumb-doc` / `.bda-thumb-news` / `.bda-thumb-photo` / `.bda-thumb-audio` / `.bda-thumb-film` — per-glyph category
- `.bda-source-card-info` — card text zone
- `.bda-source-card-title` — `<h3>` title
- `.bda-source-card-figure` — associated figure label
- `.bda-source-card-meta` — type + year line

### Page chrome

- `.bda-sources-loading` — loading / error message
- `.bda-sources-grid` — grid container layout

**Documentation gap:** As of April 2026, CSS_DOCUMENTATION.md does not document this class vocabulary. Adding the full `.bda-*` sources-page class inventory to CSS_DOCUMENTATION.md is a pending task. Until that's done, `styles.css` is the source of truth — grep for `.bda-` to confirm class definitions.

---

## Contrast Requirements

All text/background color combinations used by this page must meet WCAG AA minimums (4.5:1 for normal text, 3:1 for large text and UI components). Because the sources page inherits the archive's dark green theme, all card text, filter labels, and chip text use the archive's established text color variables:

- `--dba-text-primary` (`#e8e8e8`) for main labels and titles — 8.66:1 on `--dba-content-green`
- `--dba-text-secondary` (`#c8c8c8`) for meta lines — 6.34:1 on `--dba-content-green`
- `--dba-text-muted` (`#b0b0b0`) for de-emphasized elements — 4.89:1 on `--dba-content-green`

Never use `#a0a0a0` for any text — it fails contrast on the content green background.

The per-category badge colors (`.bda-cat-primary`, `.bda-cat-secondary`, `.bda-cat-archival`) must be verified against their background at contrast-check time. These values are defined in `styles.css` and are the responsibility of the CSS layer, not this JS file.

---

## Helpers

### `escapeHtml(s)`

Escapes five HTML-significant characters (`&`, `<`, `>`, `"`, `'`). Every user-facing string interpolated into HTML must pass through this function. Source titles, figure names, repository names — all escaped.

**Why this matters:** Source titles occasionally contain ampersands ("Red, Black & Green"). Without escaping, the ampersand breaks the HTML. More importantly, if any source metadata ever comes from user submissions (e.g., community-contributed sources), unescaped HTML injection is an XSS vulnerability. Escaping at the render boundary eliminates the entire class of issues.

### `cssEscape(s)`

Used only for CSS attribute selectors (`[data-filter="modality"][value="..."]`) when syncing chip removal with the filter rail checkboxes. Wraps `CSS.escape()` with a polyfill for browsers that don't support it.

### `slugifyId(id)`

Converts a source ID (`src_dt_0002`) to a URL slug (`src-dt-0002`) by replacing underscores with hyphens.

### `formatTypeLabel(type)`

Converts snake_case type strings to Title Case (`"audio_recording"` → `"Audio Recording"`).

### `primaryFigureName(src)`

Returns the name of the first figure in `src.figure_ids`, or the string `'zzz'` if no figures are associated. The `'zzz'` fallback pushes unattached sources to the end of A–Z sorts without a special-case branch in the sort comparator.

---

## Accessibility Checklist

Before committing any change to this file, verify:

- [ ] No hardcoded hex color values
- [ ] No inline `style="..."` attributes in any emitted HTML
- [ ] Every emitted class exists in `styles.css`
- [ ] Filter checkboxes are real `<input type="checkbox">` elements, not custom widgets
- [ ] Sort dropdown is a real `<select>` element
- [ ] Every modality option includes a shape marker (not color alone)
- [ ] Pending modality options have `disabled` AND `aria-disabled="true"`
- [ ] Every chip remove button has a descriptive `aria-label`
- [ ] Every card link has a descriptive `aria-label`
- [ ] Decorative icons (glyphs, markers) use `aria-hidden="true"`
- [ ] Results count is in an `aria-live="polite"` region (set in page HTML)
- [ ] Error states use `role="alert"`
- [ ] Empty states use the `hidden` attribute, not `display: none`
- [ ] All user-facing strings interpolated into HTML pass through `escapeHtml()`
- [ ] URL updates use `history.replaceState`, not `pushState`
- [ ] Screen-reader table (`#bda-sources-sr-tbody`) stays synchronized with the visual grid
- [ ] Modality filter labels use `displayLabel` from `getModalityConfig()`, never `legendLabel`

---

## Troubleshooting

### Grid shows "Could not load sources"
- Check the browser console for a 404 on `/data/detroit.json`
- Verify the file exists at that path and has valid JSON syntax
- Confirm the fetch URL in `DATA_URL` matches your hosting setup (absolute path `/data/detroit.json` assumes the site is served from domain root)

### Filter checkboxes render without shape markers
- Verify `.bda-mm-[modality]` CSS classes exist in `styles.css`
- Hard-refresh to rule out CSS cache

### Modality filter labels show "Pin marker — Detective Modality" (legend format)
- `scripts.js` is returning `label` instead of `displayLabel` from `getModalityConfig()`
- Update `scripts.js` to return the two-label split documented in `JAVASCRIPT_DOCUMENTATION.md`
- As a temporary fix, the inline `MODALITY_LABELS_FALLBACK` provides the correct labels if `window.getModalityConfig` is undeleted

### Filter counts keep changing as I toggle filters
- This file uses the stable-count convention (counts reflect the full dataset, not the filtered set). If counts are changing, someone has modified `countByField()` or `countSourcesForFigure()` to filter first — revert that.

### URL querystring doesn't update on filter change
- Verify `updateUrlFromState()` is being called at the end of every filter-change handler
- Check the browser console for errors during `history.replaceState`

### Back button jumps to an unexpected page
- The page uses `replaceState`, not `pushState` — filter changes do not create history entries. If you need multi-step filter history, that is a separate feature request.

### Pending modality options look clickable
- Verify `disabled` attribute is present on the `<input>` AND `aria-disabled="true"` is set
- Confirm `.bda-filter-option.is-disabled` CSS styles the row as visually muted

### Mobile filter toggle doesn't expand the rail
- Verify `#bda-sources-filter-rail` has CSS that responds to `.is-open` class on mobile breakpoints
- Confirm the toggle button's `aria-expanded` attribute flips on click

### Screen reader doesn't announce results count change
- Verify `#bda-sources-count` has `aria-live="polite"` in the page HTML (this is set in the template, not by JS)
- Confirm the count text actually changes when filters change (inspect the element after filter toggle)

### Cards don't link to individual source pages
- Verify `SOURCE_ROUTE_PREFIX` constant matches your actual route (`/archive/sources/`)
- Verify `slugifyId(src.id)` produces the slug format your routing expects
- Check that individual source pages exist at those URLs

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | April 2026 | Initial documentation. Documents intended state of `bda-sources.js` post-cleanup: `displayLabel` separation in `getModalityConfig()` consumption, full class contract inventory, accessibility criteria mapped to WCAG success criteria. |
