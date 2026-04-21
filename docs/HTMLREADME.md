# HTML Templates Documentation

**Version:** 2.0
**Last Updated:** April 2026

## Overview

The Detroit Badman Archive consists of multiple HTML pages sharing a common architectural pattern. This document describes the page-level template vocabulary — what every page must contain, what page-specific templates look like, and how pages interact with the partials system and site-wide JavaScript.

This document is the destination the code is being synced to match. Page HTML that diverges (inline `style="..."` attributes, hardcoded hex values, `<h1>` wrapped in `<header>` outside `<main>`, missing partial placeholders, flat-file routes) gets brought in line with this spec during the HTML cleanup pass.

All pages conform to **WCAG 2.2 Level AA** and the **MSU Digital Accessibility Basic Checklist** (webaccess.msu.edu/basiclist). Accessibility is structural, not decorative — every template pattern in this document includes the required accessible markup. Do not strip ARIA attributes, skip heading levels, or remove `sr-only` elements when modifying pages.

### Authority contracts

This document is one of four interlocking specs. Each owns a surface of the system:

| Document | Owns |
|----------|------|
| `HTML_TEMPLATES.md` (this document) | Page-level structure, heading hierarchy, landmark usage, page-specific templates |
| `CSS_DOCUMENTATION.md` | The `styles.css` class vocabulary, color variables, visual identity systems |
| `JAVASCRIPT_DOCUMENTATION.md` | Site-wide JS behavior (`scripts.js`, `bda-partials-loader.js`), partial placeholder contracts |
| `DATAREADME.md` | The JSON schema (`detroit.json`), source/figure data model |

When a class, ID, or data contract is referenced here, the authoritative definition lives in the file that owns it. Cross-references are called out inline.

---

## Accessibility Reference

### Standards

- **WCAG 2.2 Level AA** — Minimum compliance target
- **MSU Digital Accessibility Policy** — webaccess.msu.edu/policy/technical-guidelines
- **MSU Basic Checklist** — webaccess.msu.edu/basiclist

### Testing Tools

Run these on every page before any deployment:

- **WebAIM Contrast Checker** — webaim.org/resources/contrastchecker
- **WAVE Browser Extension** — wave.webaim.org
- **axe DevTools** — Chrome extension
- **NVDA** — Free Windows screen reader for manual verification
- **Keyboard-only navigation** — Tab through the entire page with no mouse

### Color Contrast

The authoritative contrast reference table lives in `CSS_DOCUMENTATION.md` under "Color Contrast Reference Table." When adding a new color combination to page HTML, (1) the color must resolve to a CSS variable defined in `:root`, (2) the combination must be verified at WCAG AA minimums via the WebAIM Contrast Checker, and (3) the result must be added to the table in the CSS doc.

---

## Core Rules

These four rules apply to every page, partial, and dynamic HTML fragment emitted by JavaScript.

1. **No inline `style="..."` attributes.** All visual properties come from CSS classes defined in `styles.css`. The only exception is CSS custom property declarations used as runtime values (e.g., `style="--criterion-value: 5;"` for the figure-page score bars). Those are *values* passed to CSS, not style overrides.

2. **No hardcoded hex values anywhere in HTML.** If a color appears in page source, it's in a CSS class.

3. **Shape, not color, is the identity carrier.** Modality identity, edge type identity, evidence tier identity, and access level identity all use shape + color + text. Color is a reinforcing signal, never the sole signal (WCAG 1.4.1).

4. **Partials own site chrome. Pages own placeholders.** The navbar, footer, and credentialing rail are not written into page HTML. Pages include placeholder elements; `bda-partials-loader.js` injects content. When navigation changes, edit `navbar.html` — not every page.

---

## Modality Visual Identity System

Color alone cannot differentiate modalities (WCAG 1.4.1). Every modality requires three distinguishable properties: color, marker shape, and icon.

| Modality | Color | Hex | Map Marker | Network Shape | Icon |
|----------|-------|-----|------------|---------------|------|
| Detective | Blue | `#3388ff` | Circle | Circle | Magnifying glass |
| Revolutionary | Red | `#dc3545` | Star | Diamond | Raised fist |
| Superhero-Villain | Orange | `#fd7e14` | Hexagon | Hexagon | Lightning bolt |
| Gangsta-Pimp | Purple | `#6f42c1` | Square | Square | Dollar sign |
| Folk Hero-Outlaw | Gold | `#d4af37` | Triangle | Triangle | Star |

This table is synchronized with:

- `getModalityConfig()` in `scripts.js`
- The `.legend-[modality]` and `.legend-node-[modality]` classes in `styles.css`
- The Modality Visual Identity table in `CSS_DOCUMENTATION.md`
- The Modality Reference in `DATAREADME.md`

At launch, three modalities render: Detective, Revolutionary, Superhero-Villain. Gangsta-Pimp and Folk Hero-Outlaw are defined in the visual identity system but filtered out via the `activeModalities` array in `map.html` and `network.html` pending activation.

### Legend label vocabulary

`getModalityConfig()` returns two label strings per modality:

- **`displayLabel`** — clean modality name for filter UI, card badges, and prose (`"Detective"`, `"Revolutionary"`)
- **`legendLabel`** — descriptive shape-first label for map/network legends (`"Circle marker — Detective Modality"`)

Page HTML that renders a legend uses `legendLabel`. Page HTML that renders filter UI uses `displayLabel`. These strings come from `getModalityConfig()` — do not hardcode them in page source.

---

## Edge Type and Evidence Tier Visual Identity

The full edge type table (META, P2C, C2C, ORG, CC) and evidence tier table (1/Documented, 2/Evidenced, 3/Interpretive) are documented in `CSS_DOCUMENTATION.md`. When rendering an edge-type legend or an evidence tier badge in page HTML, reference the documented classes (`.legend-meta`, `.legend-p2c`, etc. for legend markers; `.bda-tier-1`, `.bda-tier-2`, `.bda-tier-3` for badges on connection items).

---

## Access Level Badges

Source pages render an access level badge when the source's `access_level` is not `public`. The badge classes are defined in `styles.css`:

| Access Level | Class | Display |
|--------------|-------|---------|
| `public` | *(no badge)* | No visual element |
| `restricted` | `.bda-access-badge-restricted` | Gold badge — "Restricted" |
| `embargoed` | `.bda-access-badge-embargoed` | Red badge — "Embargoed" |
| `consent_required` | `.bda-access-badge-consent` | Purple badge — "Consent required" |

At launch, every source is `public`. The other three are scaffolded for post-IRB interview integration.

---

## The Partials System

Three partials are injected on every page where placeholders exist. `bda-partials-loader.js` handles injection, active-state marking, TOC building, and footer-year population. Page HTML's job is to (1) include the right placeholders, (2) include the loader script, and (3) wait for the `bda:partials-loaded` event if downstream JS depends on partial content.

### Required placeholders

Every page must include:

```html
<div id="bda-navbar"></div>
<!-- page content -->
<div id="bda-footer"></div>
```

Pages that warrant a credentialing rail (individual figure pages and individual source pages) also include:

```html
<aside id="bda-credentialing-rail" aria-label="About the author"></aside>
```

**Important:** The `aria-label` on the `<aside>` is applied in the page HTML, not injected by the loader. Screen readers announce the landmark with this label before the partial arrives. Do not add a second `<aside>` inside the partial — that creates nested landmarks.

### FOUC mitigation

Placeholder elements have `min-height` values defined in `styles.css` matching the expected partial heights. This prevents page reflow when partials arrive. Do not remove these CSS rules.

### `bda:partials-loaded` event

`bda-partials-loader.js` dispatches a `bda:partials-loaded` event on `document` once all partials have been injected and post-load wiring (active-state marking, TOC building, footer-year population) is complete. The most important consumer — Bootstrap dropdown re-initialization — lives in `scripts.js`. Page-specific scripts that interact with navbar, footer, or credentialing rail content must also wait for this event.

See `JAVASCRIPT_DOCUMENTATION.md` for the full loader spec.

---

## Common Structure (All Pages)

Every HTML file follows this structure:

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <!-- Meta tags, title, stylesheets -->
    </head>
    <body>
        <!-- Skip-to-content link (WCAG 2.4.1) -->
        <a href="#main-content" class="visually-hidden-focusable">Skip to main content</a>

        <!-- Navbar injected here by bda-partials-loader.js -->
        <div id="bda-navbar"></div>

        <main id="main-content">
            <!-- Page content — h1 lives here, at the top -->
        </main>

        <!-- Footer injected here by bda-partials-loader.js -->
        <div id="bda-footer"></div>

        <!-- Bootstrap JS (must load before scripts.js) -->
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
        <!-- Site-wide JS -->
        <script src="/js/scripts.js"></script>
        <script src="/js/bda-partials-loader.js"></script>
        <!-- Page-specific scripts -->
    </body>
</html>
```

### What changed from the prior template

The prior template wrapped the page title in a `<header>` element above `<nav>`. That `<header>` is gone. The page's `<h1>` lives inside `<main>` (at the top of the primary content) — not above or beside the nav landmark. This keeps heading hierarchy flat under `<main>` and matches the landmark structure screen readers expect: navigation via the navbar partial, main content wrapped by `<main>`, contentinfo via the footer partial.

Also removed: `.bda-skip-link` (use `.visually-hidden-focusable` instead), inline style attributes on content blocks, the inline navbar markup that used to be duplicated across every page.

### Accessibility scaffolding

1. **Skip-to-content link** — First element inside `<body>`. Uses `.visually-hidden-focusable` (or the Bootstrap-compatible alias `.sr-only-focusable`): invisible until focused via keyboard, then appears on screen. Required by WCAG 2.4.1 (Bypass Blocks).
2. **`<main id="main-content">`** — Target of the skip link. Screen readers use the `<main>` landmark to jump directly to content.
3. **Landmark structure** — Every page exposes: navigation (via the navbar partial's `<nav>`), main content (the `<main>` element), and contentinfo (via the footer partial's `<footer>`). Pages with a credentialing rail add a complementary landmark (the `<aside>`).

### Script loading order

Scripts must load in this order:

```html
<!-- Bootstrap JS bundle first -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
<!-- scripts.js next (contains bda:partials-loaded listener for Bootstrap dropdown re-init) -->
<script src="/js/scripts.js"></script>
<!-- Partial loader last — it fires bda:partials-loaded once partials inject -->
<script src="/js/bda-partials-loader.js"></script>
<!-- Page-specific scripts, if any, after the loader -->
```

---

## Head Section (All Pages)

```html
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <meta name="description" content="Page-specific description" />
    <meta name="author" content="Harry Foster" />
    <title>Page Title | Detroit Badman Archive</title>
    <link rel="icon" type="image/x-icon" href="/assets/favicon.ico" />
    <!-- Bootstrap CSS (must load before styles.css) -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet" />
    <!-- Site stylesheet -->
    <link href="/css/styles.css" rel="stylesheet" />
</head>
```

**To modify:**

- Update `<meta name="description">` for each page (SEO + accessibility — screen readers can surface this)
- Update `<title>` — Format: `Page Name | Detroit Badman Archive` (first thing a screen reader announces)
- **Add page-specific libraries** — Leaflet for `map/`, D3 for `network/` — load before `styles.css`

**Known inconsistency:** Prior templates included `<link>` elements for Google Fonts (Raleway, Lora). The current `styles.css` does not reference those families — it inherits Bootstrap's default stack. This is a flagged inconsistency, not resolved in the current pass. Either the font links should be removed from page templates, or `styles.css` should declare `font-family` rules using the loaded families. Pick a direction before launch.

---

## Heading Hierarchy

Every page must follow a sequential heading order.

```
<h1> — Page title (one per page, inside <main>)
  <h2> — Major sections
    <h3> — Subsections within panels
      <h4> — Sub-subsections if needed (rare)
```

**Rules:**

- Never skip a level (no `<h1>` → `<h4>`)
- Never use heading tags for styling — use CSS classes instead
- One `<h1>` per page, at the top of `<main>`
- Dynamically injected content (detail panels) must include proper heading structure — figure names are `<h3>`, not `<strong>`

**Partial heading levels:** The footer and credentialing rail partials use `<h3>` for their internal section headings, so they don't compete with page `<h2>`s in screen-reader heading navigation.

---

## Content Sections

### Standard content block (`bg-faded`)

```html
<section class="page-section">
    <div class="container">
        <div class="row">
            <div class="col-xl-9 mx-auto">
                <div class="bg-faded rounded p-5">
                    <h2 class="section-heading mb-4">
                        <span class="section-heading-upper">Small Heading</span>
                        <span class="section-heading-lower">Large Heading</span>
                    </h2>
                    <p>Content goes here...</p>
                </div>
            </div>
        </div>
    </div>
</section>
```

**Classes explained:**

- `.page-section` — Vertical rhythm (padding top/bottom)
- `.bg-faded` — Content-green background
- `.section-heading` / `.section-heading-upper` / `.section-heading-lower` — Two-line heading pattern

### Call-to-action block (`cta`)

```html
<section class="page-section cta">
    <div class="container">
        <div class="row">
            <div class="col-xl-9 mx-auto">
                <div class="cta-inner bg-faded text-center rounded">
                    <!-- Content -->
                </div>
            </div>
        </div>
    </div>
</section>
```

The `.cta` modifier adds the alternate medium-green background for visual rhythm between sections. `.cta-inner::before` draws the purple accent border.

---

## Dynamic Content Panels — Accessibility Requirements

The map and network pages share a detail panel that updates when a user clicks a marker, node, or screen-reader data table row. The panel content is built by `showFigureDetails()` in `scripts.js`. Page HTML defines the panel container.

### Panel container setup

```html
<div id="info-panel" tabindex="-1" aria-live="polite" aria-atomic="true" class="bg-faded rounded p-4">
    <h2>Figure Details</h2>
    <p id="info-content">
        Select a figure from the map or the figures list below to view details.
    </p>
</div>
```

**Required attributes:**

- `tabindex="-1"` — Allows the panel to receive programmatic focus (not tab-focusable, but focusable via JavaScript)
- `aria-live="polite"` — Screen readers announce content changes when the panel updates
- `aria-atomic="true"` — Screen reader re-reads the entire panel, not just the changed portion

### Behavior contract with `scripts.js`

`showFigureDetails(figure, 'info-content', 'info-panel')`:

1. Rebuilds the panel content HTML using the documented class vocabulary (`.figure-detail-name`, `.read-more-toggle`, `.panel-divider`, `.source-links`, `.source-link-item`, `.source-links-empty`)
2. Injects the HTML into `#info-content` via `innerHTML`
3. Moves programmatic focus to `#info-panel` via `.focus()`
4. Wires up the Read more / Show less toggle

Page HTML must not hand-assemble detail panel content — use `showFigureDetails()` exclusively. See `JAVASCRIPT_DOCUMENTATION.md` for the function spec.

### Default panel text

Default instructions must not assume visual interaction:

- **Map panel:** "Select a figure from the map or the figures list below to view details."
- **Network panel:** "Select a figure from the network graph or the figures list below to view metrics."

Wording like "Click a marker on the map" assumes the user can see and click a visual element. The above wording provides a non-visual path (WCAG 1.3.3).

---

## Screen-Reader Data Tables

Both `map/` and `network/` include a visually hidden data table that provides the same information as the visualization in a screen-reader-accessible format (WCAG 1.1.1).

### Placement

Place the table after each visualization container, inside the same `<section>`:

```html
<!-- After #map-container or #network-container -->
<table class="sr-only" aria-label="Detroit badman figures data">
    <caption>Figures in the Detroit Badman Archive with modality, location, and scores</caption>
    <thead>
        <tr>
            <th scope="col">Name</th>
            <th scope="col">Modality</th>
            <th scope="col">Type</th>
            <th scope="col">Location</th>
            <th scope="col">Badman Score</th>
        </tr>
    </thead>
    <tbody id="sr-figures-table-body">
        <!-- Populated dynamically from the same JSON fetch -->
    </tbody>
</table>
```

### Population

Build the table rows inside the same `fetch('/data/detroit.json')` callback that builds the map markers or network nodes. Use `calculateBadmanScore()` from `scripts.js` for the total rather than inlining the arithmetic:

```javascript
const tableBody = document.getElementById('sr-figures-table-body');
data.figures
    .filter(figure => !figure._placeholder && activeModalities.includes(figure.modality))
    .forEach(function (figure) {
        const row = document.createElement('tr');
        const totalScore = calculateBadmanScore(figure.scores);
        row.innerHTML =
            '<th scope="row">' + figure.name + '</th>' +
            '<td>' + figure.modality + '</td>' +
            '<td>' + figure.type + '</td>' +
            '<td>' + figure.geographic.primary_location.name + '</td>' +
            '<td>' + totalScore + '/25</td>';
        tableBody.appendChild(row);
    });
```

Note the `_placeholder` filter — placeholder entries in `detroit.json` are workflow artifacts (see `DATAREADME.md` § "Special Entry Types") and must be excluded from rendering.

### Making table rows interactive

Each row should be clickable/keyboard-selectable to trigger the same detail panel update as clicking a marker:

```javascript
row.setAttribute('tabindex', '0');
row.setAttribute('role', 'button');
row.setAttribute('aria-label', 'View details for ' + figure.name);
row.addEventListener('click', function () { showFigureDetails(figure, 'info-content', 'info-panel'); });
row.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showFigureDetails(figure, 'info-content', 'info-panel');
    }
});
```

This provides the alternative interaction path required by WCAG 1.3.3 (Sensory Characteristics).

---

## Links — Accessibility Requirements

All links on the site must follow these rules (WCAG 2.4.4, 1.4.1).

### Descriptive link text

- Every link's text must describe its destination. Never use "click here" or "read more" alone.
- If a generic label is unavoidable, add an `aria-label` with full context: `<a href="#" aria-label="Read more about Ron Scott">Read more</a>`

### In-prose link underlines (required)

- Any link appearing inside body text must have `text-decoration: underline`.
- The in-prose underline rule in `styles.css` targets specific selectors (`.essay a`, `p a`, `.bda-figure-biography a`, `.bda-source-notes a`, `.bda-connection-evidence a`, `.source-link-item a`, and others).
- Navigation links, buttons, card links, and Read more toggles do NOT get underlines — structure signals link-ness.
- Do not apply underline styling inline. If a new in-prose context is introduced, add its selector to the in-prose rule in `CSS_DOCUMENTATION.md` and the stylesheet.

### External links opening in new tabs

- Any link with `target="_blank"` must warn the user.
- Add sr-only text and `rel="noopener noreferrer"`:

```html
<a href="https://example.com" target="_blank" rel="noopener noreferrer">
    Source Title
    <span class="sr-only">(opens in new tab)</span>
</a>
```

### Source links in detail panels

- Source links are built by `buildSourceLinks()` in `scripts.js`. Do not hand-assemble source link HTML in page source.
- Pass the filtered source objects to `buildSourceLinks(sources)` and insert the returned HTML string into the panel.
- See `JAVASCRIPT_DOCUMENTATION.md` for the function spec.

---

## Credentialing Rail

The credentialing rail is a sticky right-side component that appears on individual figure pages and individual source pages. It contains an author identity block and an auto-generated "On this page" TOC.

### Page contract

Pages that include the rail must contain this placeholder:

```html
<aside id="bda-credentialing-rail" aria-label="About the author"></aside>
```

Placement: inside the page's two-column layout wrapper (`.bda-figure-layout` or `.bda-source-layout`), as the right-hand child. Mobile CSS collapses the grid to a single column; the rail's `order: -1` rule on figure pages moves it above main content on mobile.

The `aria-label` is set in page HTML because the partial loader injects content into the aside — not the aside itself. Screen readers have the landmark labeled even before the partial arrives.

### Partial content

`credentialing-rail.html` is injected into the placeholder by `bda-partials-loader.js`. The partial uses this class vocabulary (all defined in `styles.css`):

- `.bda-cred-rail-inner` — root wrapper inside the aside
- `.bda-cred-author` — author block
- `.bda-cred-author-photo`, `.bda-cred-author-meta` — author block sub-containers
- `.bda-cred-author-name`, `.bda-cred-author-pronouns`, `.bda-cred-author-affiliation`, `.bda-cred-author-bio`, `.bda-cred-author-link` — author metadata
- `.bda-cred-toc-details` (native `<details>`), `.bda-cred-toc-summary` (native `<summary>`) — mobile collapsible
- `.bda-cred-toc` — TOC nav, must include `aria-label="On this page"`
- `.bda-cred-toc-heading` — TOC section heading
- `#bda-page-toc-list` — TOC `<ul>`, target of `buildPageTOC()`

### TOC behavior contract with `bda-partials-loader.js`

`buildPageTOC()`:

1. Queries `<main>` for `<h2>` elements
2. Auto-generates an `id` for any `<h2>` missing one (lowercased text, non-alphanumerics → hyphens, truncated to 50 chars)
3. Appends a `<li><a href="#[id]">[heading text]</a></li>` to `#bda-page-toc-list` for each
4. Hides `#bda-page-toc` entirely if no `<h2>`s exist in `<main>`

Pages that want a populated TOC must ensure their `<main>` content uses `<h2>` for section headings. Figure pages and source pages both follow this pattern by default.

**Known edge case:** Duplicate `<h2>` text produces duplicate auto-IDs. The second anchor will resolve to whichever heading the browser picks first. Give duplicate headings explicit unique IDs if this matters.

---

## Route Structure

Pages use folder-based routes with trailing slashes. This matches the `data-route` values in `navbar.html` and the `topLevelRoute()` matcher in `bda-partials-loader.js`.

| Nav Item | Route | Page section in this doc |
|----------|-------|--------------------------|
| Home | `/` | `index` |
| About → The Project | `/about/project/` | `about/project/` |
| About → The Badman Tradition | `/about/tradition/` | `about/tradition/` |
| About → Methodology | `/about/methodology/` | `about/methodology/` |
| Archive → Figures | `/archive/figures/` | `archive/figures/` (landing) |
| Archive → Primary Sources | `/archive/sources/` | `archive/sources/` (landing) |
| Visualizations → Map | `/visualizations/map/` | `visualizations/map/` |
| Visualizations → Network | `/visualizations/network/` | `visualizations/network/` |
| Engagement → Submit a Figure | `/engagement/submit/` | `engagement/submit/` |
| Engagement → Events | `/engagement/events/` | `engagement/events/` |
| Contact | `/contact/` | `contact/` |

Individual figure and source pages follow the pattern `/archive/figures/[slug]/` and `/archive/sources/[slug]/` respectively. These are linked from the Figures and Primary Sources landing pages, not from the top navigation.

Top-level navigation active-state is set by `markCurrentNavItem()` in `bda-partials-loader.js` based on the page's top-level route segment. `/archive/figures/baker_gordon/` → Archive nav item is active. Dropdown child items don't compete for active-state (they don't carry `data-route`).

---

## Page-Specific Templates

### `/` (Home — `index.html`)

**Purpose:** Entry point. Intro section with hero image and overlapping text box; subsequent sections linking into archive.

**Unique structure:** Uses the `.intro` / `.intro-img` / `.intro-text` / `.intro-button` pattern for the hero:

```html
<main id="main-content">
    <section class="page-section clearfix">
        <div class="container">
            <div class="intro">
                <img class="intro-img img-fluid mb-3 mb-lg-0 rounded"
                     src="/assets/img/hero.jpg"
                     alt="Descriptive alt text for the hero image" />
                <div class="intro-text bg-faded p-5 rounded">
                    <h1 class="site-heading">
                        <span class="site-heading-upper">Detroit</span>
                        <span class="site-heading-lower">Badman Digital Archive</span>
                    </h1>
                    <!-- Lede and intro button -->
                </div>
            </div>
        </div>
    </section>
    <!-- Further page sections -->
</main>
```

**To modify:**

- Update the hero `<img>` `src` and `alt`. Decorative images: `alt=""` (empty string, not omitted).
- Home page `<h1>` uses `.site-heading` / `.site-heading-upper` / `.site-heading-lower` for the large two-line treatment. Other pages use plain `<h1>` styled by Bootstrap defaults.

**Heading hierarchy:**

```
<h1> Detroit / Badman Digital Archive (inside <main>)
  <h2> Section headings within content blocks
```

---

### `/about/project/`, `/about/tradition/`, `/about/methodology/`

Three pages under the About dropdown.

- **Project:** what the BDA is, who runs it, what it's trying to do. Plain language.
- **Tradition:** the five criteria explained in plain language. Community-facing.
- **Methodology:** the scholarly apparatus. Research Questions, Theoretical Framework, Sources & Data, Analytical Approach, Critical Approach, Limitations, Transparency statement.

**Heading hierarchy (all three):**

```
<h1> Page Title (inside <main>)
  <h2> Major section headings specific to each page
    <h3> Subsections as needed
```

**Template structure** (same for all three — differs only in content):

```html
<main id="main-content">
    <section class="page-section">
        <div class="container">
            <div class="row">
                <div class="col-xl-9 mx-auto">
                    <h1>[Page Title]</h1>
                    <!-- Content sections as h2/h3 -->
                </div>
            </div>
        </div>
    </section>
</main>
```

**To modify:**

- Each page is independently editable
- Keep the three pages thematically distinct: Project (the what), Tradition (the why), Methodology (the how)
- When methodology content references the modality framework, cross-check against `BDA_Modality_Sorting_Framework.pdf`

---

### `/archive/figures/` (Figures Landing)

Filterable grid of all figures organized by modality, alphabetical within modality.

**Structure:**

- `<h1>` Figures
- Filter rail (shared vocabulary with sources landing — see "Shared Filter Rail" below)
- Grid of figure cards: name, dates/era, modality badge, one-line descriptor
- Each card links to `/archive/figures/[slug]/`
- Pending modalities (Gangsta-Pimp, Folk Hero-Outlaw) appear grayed out in the modality filter with `.is-pending` and a `.bda-filter-pending-tag`

**Grid wrapper class:** `.bda-figures-grid` or `.bda-figures-grouped` (for modality-grouped display) with `.bda-figure-modality-group` children containing `.bda-figure-modality-heading`, `.bda-figure-modality-count`, and `.bda-figure-card-list`.

**Card class vocabulary** (all defined in `styles.css`):

- `.bda-figure-card` — card link wrapper
- `.bda-figure-card-thumb` — top zone
- `.bda-figure-card-type-badge` with `.bda-type-real` or `.bda-type-fictional` — top-left badge
- `.bda-figure-card-meta-badge` — top-right gold meta-badman badge
- `.bda-figure-card-info` — content zone
- `.bda-figure-card-title`, `.bda-figure-card-era`, `.bda-figure-card-descriptor`, `.bda-figure-card-score`
- `.bda-score-value`, `.bda-score-total` — score rendered as "18 / 25"

**Heading hierarchy:**

```
<h1> Figures
  <h2> Modality section headings (Detective, Revolutionary, Superhero-Villain)
    <h3> Individual figure card headings (figure name)
```

**Accessibility:**

- Modality filter uses accessible `<fieldset>` / `<legend>` / `<input type="checkbox">` pattern
- Grid renders as semantic list (`<ul class="bda-figure-card-list">` with `<li>` per figure) for screen reader navigation
- Pending modality controls have `aria-disabled="true"` with accompanying text

**To modify:**

- Adding a figure: appears automatically once the figure entry is added to `detroit.json` — no template changes required. See `DATAREADME.md` § "Data Entry Workflow."

---

### `/archive/figures/[slug]/` (Individual Figure Page)

The heaviest template in the system. Renders a single figure with full biographical, scored, networked, and sourced detail, plus the credentialing rail.

**Layout wrapper:** `.bda-figure-layout` — two-column grid (content + credentialing rail) on desktop; flex column on mobile with `order: -1` on the rail so it appears above main content.

**Required placeholder for rail:** `<aside id="bda-credentialing-rail" aria-label="About the author"></aside>` is one child of `.bda-figure-layout`; `<main id="main-content">` is the other.

**Page sections, in order:**

1. Header (`.bda-figure-header`): modality badge, type badge, meta-badman badge, name, era, score, creator (for fictional)
2. Justification (`.bda-figure-justification`): serif, ~640px max-width essay
3. Biography (`.bda-figure-biography`): description + timeline in a two-column grid that stacks at mobile
4. Five-criteria evaluation (`.bda-figure-criteria`) with justifications
5. Connections (`.bda-figure-connections`) grouped by edge type
6. Geography (`.bda-figure-geography`) with map preview
7. Primary sources (`.bda-figure-primary-sources`) — grid of `.bda-source-card` elements
8. Related figures (`.bda-figure-related-grid`)

**Heading hierarchy:**

```
<h1> Figure Name (inside <main>, wrapped by .bda-figure-header)
  <h2> Justification
  <h2> Biography
  <h2> Five-Criteria Evaluation
  <h2> Connections
  <h2> Geography
  <h2> Primary Sources
  <h2> Related Figures
    <h3> Individual criteria names within the evaluation section
    <h3> Edge type group headings within connections
```

**Criterion bars — the one allowed inline style pattern.** Each criterion's `.bda-criterion-bar-fill` element sets its fill width via the `--criterion-value` CSS custom property, passed inline:

```html
<div class="bda-criterion-bar">
    <div class="bda-criterion-bar-fill" style="--criterion-value: 5;"></div>
</div>
```

The CSS rule `width: calc(var(--criterion-value, 0) * 20%);` in `styles.css` handles rendering. This is a *value* passed to CSS, not a style override — it's the one exception in Core Rule 1.

**Connection items — evidence tier badges.** Each connection in the `.bda-connection-list` renders with a `.bda-connection-tier` badge whose modifier class is `.bda-tier-1`, `.bda-tier-2`, or `.bda-tier-3` per the connection's `tier` value from `detroit.json`. See `DATAREADME.md` § "Evidence Tiers" for data contract.

**Accessibility:**

- Five-criteria scores use a definition list (`<dl>`) with `<dt>` per criterion name+score and `<dd>` per justification — semantic, not tabular
- Map preview uses the same `role="img"` + `aria-label` pattern as the full map page
- The `<aside>` landmark is labeled `"About the author"` via page HTML
- TOC in the credentialing rail auto-generates from these `<h2>` headings via `buildPageTOC()`

**Data contract:** `DATAREADME.md` § "Figure Object Structure" is the authoritative source for what data each section renders. Template structure is stable — modifications to content happen in `detroit.json`, not in the HTML template.

---

### `/archive/sources/` (Primary Sources Landing)

Filterable grid of primary sources with three-zone layout.

**Structure:**

1. Intro strip: breadcrumb, title, lede
2. Layout wrapper: `.bda-sources-layout` — two-column grid (filter rail + main) on desktop, stacks at mobile
3. Filter rail (`.bda-sources-filter-rail`): figure, modality, type, repository filters, using the shared filter rail vocabulary
4. Main zone (`.bda-sources-main`): results header, active filter chips, sources grid, empty state

**Card class vocabulary** (all defined in `styles.css`, shared with figure-page primary sources and source-page related sources):

- `.bda-source-card` — card link wrapper
- `.bda-source-card-thumb` — top zone with glyph
- `.bda-source-card-category` with `.bda-cat-primary` / `.bda-cat-secondary` / `.bda-cat-archival` — category badge
- `.bda-source-card-external` — "opens externally" badge
- `.bda-source-thumb-glyph` with `.bda-thumb-book` / `.bda-thumb-doc` / `.bda-thumb-news` / `.bda-thumb-photo` / `.bda-thumb-audio` / `.bda-thumb-film` — type glyph
- `.bda-source-card-info` — content zone
- `.bda-source-card-title`, `.bda-source-card-figure`, `.bda-source-card-meta`

**Heading hierarchy:**

```
<h1> Primary Sources
  <h2> Filter section heading (visually hidden with .sr-only if not shown)
  <h2> Source grid heading (optional)
    <h3> Individual source card headings (source title)
```

**Accessibility:**

- Modality filter checkboxes use the shape markers (`.bda-mm-*`) alongside the modality name — WCAG 1.4.1 non-color signal
- Pending modality options have `.is-pending` and `.bda-filter-pending-tag`
- Active filter chips are removable via keyboard (`.bda-filter-chip-remove` is a `<button>`, not a div)
- Search input has a visible `<label>` (or `<label class="sr-only">` with descriptive text if visually the placeholder is sufficient — but prefer visible labels)

**Data contract:** Each rendered card corresponds to one entry in the top-level `sources` array of `detroit.json`. Filters operate on the `category`, `type`, and modality-derived-from-figure-ids fields. See `DATAREADME.md` § "Sources (Top-Level Array)."

---

### `/archive/sources/[slug]/` (Individual Source Page)

Source viewer as dominant element with metadata rail.

**Layout wrapper:** `.bda-source-layout` — two-column grid (viewer + metadata rail) on desktop; single column on mobile.

**Required placeholder for rail** (same as figure page): `<aside id="bda-credentialing-rail" aria-label="About the author"></aside>`.

**Page sections, in order:**

1. Header (`.bda-source-header`): title, type, year, permalink button, category badge, access level badge if non-public
2. Source viewer (`.bda-source-viewer`): variant depends on source `type` — see Viewer Variants below
3. Metadata rail (`.bda-source-metadata-rail`): `<dl>` of type, date, author, publisher, repository, rights, extent, language, permalink
4. Cited in (`.bda-source-cited-in`): modality-grouped list of figures that reference this source
5. Related sources (`.bda-source-related-grid`): grid of `.bda-source-card` elements
6. Citation block (`.bda-citation-block`): format toggle, citation text, copy-to-clipboard button

**Viewer variants** (all defined in `styles.css`):

- `.bda-source-viewer-text` — default; external link with `.btn-primary` to original
- `.bda-source-viewer-image` — hosted image with `<img>` (max-width 100%, height auto)
- `.bda-source-viewer-audio` — reserved for post-IRB interview integration
- `.bda-source-viewer-multi` — reserved for multi-asset sources (audio + transcript)

**Access notice:** When source `access_level` is not `public`, render `.bda-source-access-notice` at the top of the viewer zone with plain-language explanation of access requirements.

**Heading hierarchy:**

```
<h1> Source Title (inside <main>, wrapped by .bda-source-header)
  <h2> Source Viewer (visually hidden if the viewer is self-evident)
  <h2> Metadata
  <h2> Cited In
    <h3> Modality group headings (e.g., "Detective", "Revolutionary")
  <h2> Related Sources
  <h2> Citation
```

**Cited in structure:**

```html
<section class="bda-source-cited-in">
    <h2>Cited In</h2>
    <div class="bda-cited-in-modality-group">
        <h3 class="bda-cited-in-modality-heading">
            <span class="bda-filter-modality-marker bda-mm-detective" aria-hidden="true"></span>
            Detective
        </h3>
        <ul class="bda-cited-in-list">
            <li><a href="/archive/figures/[slug]/">Figure Name</a></li>
        </ul>
    </div>
    <!-- Additional modality groups -->
    <!-- If no figures cite this source: -->
    <p class="bda-cited-in-empty">No figures currently cite this source.</p>
</section>
```

**Accessibility:**

- Source viewer includes alt text for images and (when implemented) transcript for audio/video
- Copy-to-clipboard button includes an `aria-live` region that announces "Citation copied" on success
- Cited-in links use in-prose underline per the WCAG 1.4.1 mitigation
- The `<aside>` landmark is labeled via page HTML

**Reserved fields (post-IRB):** The schema's `media` and `interview` objects (see `DATAREADME.md` § "Reserved Fields") are not used at launch. When activated, they populate `.bda-source-viewer-multi` / `.bda-source-viewer-audio` and `.bda-source-interview-panel` respectively. Page template is scaffolded to accept these without breaking changes.

**Data contract:** Each rendered source page corresponds to one entry in the top-level `sources` array. Cited-in groupings are derived from the source's `figure_ids` back-reference. See `DATAREADME.md` § "Sources (Top-Level Array)."

---

### `/visualizations/map/` (Map Tool)

Interactive geospatial map of badman figures using Leaflet.js.

**Additional head elements:**

```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="[integrity hash]" crossorigin="" />
```

**Page-specific inline JS** handles Leaflet initialization, marker rendering, legend rendering, and screen-reader data table population. All shared utilities come from `scripts.js`.

**Map container accessibility:**

```html
<div id="map-container" role="img"
     aria-label="Interactive map showing locations of Detroit badman figures across the city">
    <!-- Leaflet map initialized here -->
</div>
```

- `role="img"` — Tells screen readers this is a graphical element
- `aria-label` — Text description of what the visualization shows

**Legend structure** (three active modalities at launch — Gangsta-Pimp and Folk Hero-Outlaw are filtered out of the legend HTML by the page, not by CSS):

```html
<div class="map-legend">
    <h2>Legend</h2>
    <ul class="list-unstyled">
        <li class="legend-item">
            <span class="legend-marker legend-detective" aria-hidden="true"></span>
            <span>Circle marker — Detective Modality</span>
        </li>
        <li class="legend-item">
            <span class="legend-marker legend-revolutionary" aria-hidden="true"></span>
            <span>Star marker — Revolutionary Modality</span>
        </li>
        <li class="legend-item">
            <span class="legend-marker legend-superhero-villain" aria-hidden="true"></span>
            <span>Hexagon marker — Superhero-Villain Modality</span>
        </li>
    </ul>
</div>
```

**Accessibility patterns:**

- Legend heading is `<h2>`, styled smaller by CSS
- Legend items use `<ul>` / `<li>` (semantic list)
- Legend label text uses `legendLabel` strings from `getModalityConfig()` — shape-first descriptions, not color-first
- `aria-hidden="true"` on the colored indicator spans (decorative — text label carries the information)

**Marker alt text:** Leaflet's default marker alt text is "Marker." Override with the figure's name and modality in JS:

```javascript
const marker = L.marker([lat, lng], {
    icon: icon,
    alt: figure.name + ' — ' + figure.modality + ' modality'
});
```

**Detail panel:** See § "Dynamic Content Panels" above.
**SR data table:** See § "Screen-Reader Data Tables" above.

**Active modalities array:** Pages filter rendering to active modalities only:

```javascript
const activeModalities = ['detective', 'revolutionary', 'superhero_villain'];
// When a dormant modality goes live, add its string here AND in network.html's inline JS
```

This array is synchronized with the `Status` column in `DATAREADME.md` § "Modality Reference."

---

### `/visualizations/network/` (Network Tool)

Force-directed network graph of figure connections using D3.js.

**Page-specific inline JS** handles D3 setup, node/edge rendering, timeline slider, pause/resume controls, and screen-reader data table population.

**Network container accessibility:**

```html
<div id="network-container">
    <!-- D3 SVG appended here -->
</div>
```

After SVG creation, inject accessibility elements:

```javascript
const svg = d3.select('#network-container')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('role', 'img')
    .attr('aria-label', 'Network visualization of Detroit badman figure relationships');

svg.append('title').text('Network visualization of Detroit badman figure relationships');
svg.append('desc').text('Force-directed graph showing connections between badman figures. Nodes represent figures sized by influence. Edges represent documented relationships typed as META, P2C, C2C, ORG, or CC.');
```

**D3 node keyboard accessibility:**

D3 nodes are only interactable via mouse by default. Add keyboard support:

```javascript
const node = g.append('g')
    .attr('class', 'nodes')
    .selectAll('circle')
    .data(nodes)
    .enter()
    .append('circle')
    .attr('tabindex', '0')
    .attr('role', 'button')
    .attr('aria-label', function (d) { return d.name + ', ' + d.modality + ' modality'; })
    .on('keydown', function (event, d) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            showFigureDetails(d, 'info-content', 'info-panel');
        }
    });
```

**Reduced motion support:**

CSS handles CSS-driven animation via the global `prefers-reduced-motion` rule. The D3 simulation is JS-driven and must check separately:

```javascript
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Run one tick to establish positions, then stop
    for (let i = 0; i < 300; i++) simulation.tick();
    simulation.stop();
} else {
    // Normal animated simulation
}
```

**Pause/Resume button:**

```html
<button id="pause-animation" class="btn btn-primary btn-sm">Pause Animation</button>
```

```javascript
let paused = false;
document.getElementById('pause-animation').addEventListener('click', function () {
    paused = !paused;
    if (paused) {
        simulation.stop();
        this.textContent = 'Resume Animation';
    } else {
        simulation.alpha(0.3).restart();
        this.textContent = 'Pause Animation';
    }
});
```

**Network legend structure:**

Same pattern as map legend, using `.network-legend` container and `.legend-node-*` classes. The Revolutionary node uses a diamond in the network (vs. star on the map) — see `CSS_DOCUMENTATION.md` § "Shape reference (map vs. network)" for the full comparison.

**Edge type legend:** Uses `.legend-line` markers with `.legend-meta` / `.legend-p2c` / `.legend-c2c` / `.legend-org` / `.legend-cc` dash patterns. The pattern values must match the `edgeDashPatterns` object in this page's inline JS. See `CSS_DOCUMENTATION.md` § "Edge Type Visual Identity" for the full table.

**Timeline slider:**

```html
<label for="timeline-slider" class="sr-only">Timeline year selector</label>
<input type="range" id="timeline-slider"
       min="1930" max="2020" value="2020" step="5"
       aria-valuemin="1930" aria-valuemax="2020" aria-valuenow="2020"
       aria-label="Select year to filter network by time period">
<span id="timeline-year" aria-live="polite">2020</span>
```

- The `<label class="sr-only">` is invisible but gives the slider an accessible name
- `aria-live="polite"` on the year display announces the current year as the slider moves

**Detail panel:** See § "Dynamic Content Panels" above.
**SR data table:** See § "Screen-Reader Data Tables" above.

---

### `/engagement/submit/` (Submit a Figure)

Community submission page with two-stage review process.

**Structure:**

1. `<h1>` Submit a Figure
2. `<h2>` What We're Looking For — five criteria in submission-guidance language
3. `<h2>` What to Include — submission form fields overview
4. `<h2>` Cultural Sensitivity — trust-building protections (access levels, anonymization options, community controls)
5. `<h2>` Review Process — two-stage callout explaining the eight-stage curation pipeline in plain language
6. `<h2>` Submit Your Figure — embedded or linked Google Form

**Submission button:**

```html
<a class="btn btn-primary btn-xl" href="[google-form-url]" target="_blank" rel="noopener noreferrer">
    Submit a Figure
    <span class="sr-only">(opens in new tab)</span>
</a>
```

**To modify:**

- Replace `href="[google-form-url]"` with the actual Google Form URL when available
- Update "What We're Looking For" language only if the five criteria are revised

**Future accessibility note:** When the custom submission form replaces the Google Form, it must meet WCAG form accessibility requirements: visible labels for all inputs, error identification, required field indicators, keyboard operability.

---

### `/engagement/events/` (Events)

Program description and upcoming events calendar.

**Heading hierarchy:**

```
<h1> Events
  <h2> About the Events Program
  <h2> Partner Institutions
  <h2> What to Expect
  <h2> Upcoming Events
```

**To modify:**

- Adding an event: add entry to upcoming events section
- When events are past, move to a separate "Past Events" section (future enhancement)

---

### `/contact/` (Contact)

Contact page with multiple pathways.

**Heading hierarchy:**

```
<h1> Contact
  <h2> Project Director
  <h2> General Inquiries
  <h2> Press and Media
  <h2> Community Partnerships
  <h2> Submissions
```

**Accessibility:**

- Email addresses use `mailto:` links with descriptive text, not bare email strings
- Phone numbers (if added later) use `tel:` links

---

## Shared Filter Rail Vocabulary

The Sources Landing and Figures Landing share a filter rail class vocabulary defined in `styles.css`. Use these classes when building filter UI on either page:

- `.bda-filter-option` — row containing a checkbox and label
- `.bda-filter-option.is-disabled` — dormant modality option (pending activation)
- `.bda-filter-modality-marker` + modifier (`.bda-mm-detective`, `.bda-mm-revolutionary`, etc.) — shape marker inside filter options
- `.bda-filter-modality-marker.is-pending` — opacity-reduced marker for dormant modalities
- `.bda-filter-pending-tag` — "(pending)" annotation
- `.bda-filter-collapse-btn` — expand/collapse toggle for filter groups
- `.bda-filter-chip`, `.bda-filter-chip-label`, `.bda-filter-chip-remove` — active filter chips with removable `<button>` children

All markers are defined for all five modalities so activating a dormant modality requires no CSS changes.

---

## Adding a New Page

1. Copy an existing page of the same type (e.g., `about/project/index.html` when adding a new About page)
2. Update `<title>` and `<meta description>`
3. Verify the skip-to-content link targets `#main-content` and uses `.visually-hidden-focusable`
4. Verify the `<main id="main-content">` wrapper is present
5. Verify the partial placeholders (`<div id="bda-navbar">`, `<div id="bda-footer">`, and `<aside id="bda-credentialing-rail">` if applicable) are present
6. Place the `<h1>` inside `<main>` at the top of the primary content
7. Establish correct heading hierarchy (`<h1>` for the page, `<h2>` for sections, `<h3>` for subsections)
8. If adding to navigation, edit `navbar.html` — not individual page files. Add a `data-route` attribute matching the new route's top-level segment to the top-level nav link if needed.
9. Run WAVE and axe on the new page before deploying

---

## Accessibility Checklist for Every Page Edit

Before committing changes to any page, verify:

- [ ] One `<h1>` per page, inside `<main>`, headings in sequential order (no skipped levels)
- [ ] Skip-to-content link present, uses `.visually-hidden-focusable`, targets `#main-content`
- [ ] `<main id="main-content">` wraps content sections
- [ ] Partial placeholders present: `<div id="bda-navbar">`, `<div id="bda-footer">`, and `<aside id="bda-credentialing-rail" aria-label="About the author">` on figure/source pages
- [ ] No inline `style="..."` attributes added to HTML (the `--criterion-value` custom property pattern is the one exception)
- [ ] No hardcoded hex color values added to HTML
- [ ] All images have descriptive `alt` text (or `alt=""` if decorative)
- [ ] All links have descriptive text (no "click here" without context)
- [ ] All in-prose links get underlines via the in-prose link rule in `styles.css` (no inline underline styling)
- [ ] All `target="_blank"` links include sr-only "(opens in new tab)" text and `rel="noopener noreferrer"`
- [ ] Color is not the sole differentiator for any information
- [ ] Any new text/background color combinations verified at WCAG AA contrast minimums and added to the table in `CSS_DOCUMENTATION.md`
- [ ] Dynamic content panels have `aria-live="polite"` and `aria-atomic="true"`
- [ ] Interactive elements are keyboard-operable (Tab, Enter, Space)
- [ ] No auto-playing animation without a pause mechanism and `prefers-reduced-motion` check

---

## Bootstrap Classes Quick Reference

| Class | Effect |
|-------|--------|
| `container` | Centered, max-width container |
| `row` | Flexbox row |
| `col-xl-9` | 75% width on XL screens |
| `mx-auto` | Center horizontally |
| `mb-4` | Margin bottom (1.5rem) |
| `mt-2` | Margin top (0.5rem) |
| `p-5` | Padding all sides (3rem) |
| `text-center` | Center text |
| `text-uppercase` | UPPERCASE TEXT |
| `rounded` | Rounded corners |
| `d-none` | Hidden |
| `d-lg-block` | Visible on large screens |
| `img-fluid` | Responsive image |
| `sr-only` / `visually-hidden` | Visually hidden, screen-reader accessible |
| `sr-only-focusable` / `visually-hidden-focusable` | Hidden until focused (for skip links) |
| `list-unstyled` | Removes default list styling |

---

## Known Inconsistencies (Not Resolved This Pass)

These are flagged for a future pass. Document here so they don't get lost.

1. **Google Fonts — Raleway and Lora.** Prior page templates loaded these fonts via `<link>` in the head. The current `styles.css` does not declare any `font-family` rules that reference them; the site inherits Bootstrap's default sans stack. Either remove the font links from page templates or add `font-family` rules to `styles.css` using the loaded families. Pick a direction before launch.

2. **`#bda-footer-build` version string.** The footer partial contains `<span id="bda-footer-build">v1.0</span>`. There is no JS populator for this element. Either (a) manually update on each release, (b) add a JS populator reading from a build-info file, or (c) remove the element if build version isn't needed in the public footer.

3. **`#bda-footer-partners` list.** Contains a placeholder `<li>` at launch. Populate with confirmed partner acknowledgments as outreach confirmations come in from Wright Museum, Reuther Library, and Hackley Collection.

4. **Sources landing glyph rendering.** The live `styles.css` uses emoji glyphs (`content: "📖"` etc.) for source card thumbnails. Appended earlier CSS used elaborate CSS-drawn glyphs. Spec is currently the emoji version; the CSS-drawn version is a visual upgrade that would need to be added to `CSS_DOCUMENTATION.md` first.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | April 2026 | Full rewrite synced to CSS_DOCUMENTATION.md v3.1, JAVASCRIPT_DOCUMENTATION.md v1.0, DATAREADME.md v2.2. Restructured around partials-first architecture. Replaced inline navbar/footer markup with placeholder contracts. Renamed page sections to folder-based routes. Moved `<h1>` inside `<main>`. Added credentialing rail as top-level section. Removed inline styles and hardcoded hex values from all examples. Added individual source page template, access level badges, evidence tier badge references, criterion bar custom property pattern, cited-in structure, shared filter rail vocabulary. Flagged known inconsistencies (fonts, build version, partners list, glyph rendering) for future resolution. |
| 1.x | Earlier 2026 | Pre-partials version: inline navbar/footer markup on every page, flat-file routes (`map.html`, `figures.html`), `<h1>` inside `<header>` above nav, inline styles in map legend and detail panel examples. |
