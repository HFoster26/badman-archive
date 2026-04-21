# Individual Figure Page JavaScript Documentation

## File: `bda-figure-page.js`

Page-specific script for individual figure pages at `/archive/figures/?id=[figure_id]`. A single template file serves every figure; `bda-figure-page.js` reads the `id` querystring parameter, looks up the figure in `detroit.json`, and renders the full figure page — the archive's heaviest single template.

This document describes the intended state of the file — no implementation exists yet. When the file is built, it must match this spec.

---

## Page Purpose

The individual figure page is the archive's core scholarly artifact. Every other view — the map, the network, the figures landing, the sources landing — exists to route users here. This page is where the archive's five-criteria scoring, biographical narrative, network connections, geographic footprint, and primary sources converge for a single figure.

The page serves three audiences:

1. **Scholars** using the figure page as a citable resource in their own work
2. **Community members** learning about the figure in depth
3. **Peer reviewers and grant funders** evaluating the archive's methodology through any single figure's full treatment

The page is deep-linkable. A figure's URL is a stable permalink suitable for external scholarly citation.

---

## Why Query-Based Routing

Same reasoning as the individual source page. The archive will grow to hundreds of figures across multiple cities. One template file serves them all. Query-based routing at `/archive/figures/?id=[figure_id]` matches the figures landing page's card links and the source page's cited-in links.

---

## Accessibility Standards

`bda-figure-page.js` must comply with:

- **WCAG 2.2 Level AA**
- **MSU Digital Accessibility Policy** (webaccess.msu.edu/policy/technical-guidelines)
- **MSU Basic Checklist** (webaccess.msu.edu/basiclist)

The WCAG success criteria that govern this file:

- **1.1.1 Non-text Content** — map preview has `role="img"` and descriptive `aria-label`
- **1.3.1 Info and Relationships** — five-criteria uses `<dl>`/`<dt>`/`<dd>`; connections grouped by edge type with headings; credentialing rail TOC uses proper list structure
- **1.4.1 Use of Color** — modality identity, edge type identity, and tier identity all use shape/pattern + color + text
- **2.1.1 Keyboard** — read-more toggles, `<details>` expansions, citation format toggle, copy-to-clipboard, scroll-spy TOC links — all keyboard operable
- **2.4.1 Bypass Blocks** — the credentialing rail TOC (built by the partial loader) provides a secondary skip mechanism
- **2.4.3 Focus Order** — focus does not jump unexpectedly; TOC links preserve focus after scroll
- **2.4.4 Link Purpose (In Context)** — connection figure links, source card links, related figure links all descriptive
- **3.2.2 On Input** — citation format toggle and filter-like controls update content without navigation
- **4.1.2 Name, Role, Value** — all interactive elements have accessible names
- **4.1.3 Status Messages** — copy-to-clipboard and section-change announcements use `aria-live`

---

## Authority Boundaries

- `bda-figure-page.js` **does not** render the navbar, footer, or credentialing rail. Those are the partial loader's responsibility.
- `bda-figure-page.js` **does not** build the "On this page" TOC — that's done by the partial loader's `buildPageTOC()`.
- `bda-figure-page.js` **does** ensure its `<h2>` section headings match the TOC that `buildPageTOC()` will build (the contract is: emit `<h2>` elements with stable IDs, and the partial loader will find them).
- `bda-figure-page.js` **does** add scroll-spy behavior on top of the partial-loader-built TOC.
- `bda-figure-page.js` **only runs** on the figure page template. It must not be included on any other page.

---

## Style Rule

No hardcoded hex color values. Every color must resolve to a CSS variable defined in `styles.css`. Every visual property applied to DOM elements must come from a CSS class, not from inline `style="..."` attributes.

All classes referenced in this file must be defined in `styles.css`. The full class inventory is documented in the "CSS Class Contract" section below.

---

## Script Loading

```html
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="/js/scripts.js"></script>
<script src="/js/bda-partials-loader.js"></script>
<script src="/archive/figures/bda-figure-page.js"></script>
```

Leaflet is required for the map preview. It is loaded here (and not site-wide in `scripts.js`) because only the figure page and the full map page use it.

The script is wrapped in an IIFE. It waits for both `DOMContentLoaded` **and** the `bda:partials-loaded` event — because the credentialing rail's TOC must be built by the partial loader before scroll-spy can attach to it.

```javascript
(function () {
    'use strict';

    var initialized = false;
    var partialsLoaded = false;
    var domReady = false;

    function tryInit() {
        if (!partialsLoaded || !domReady || initialized) return;
        initialized = true;
        init();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            domReady = true;
            tryInit();
        });
    } else {
        domReady = true;
    }

    document.addEventListener('bda:partials-loaded', function() {
        partialsLoaded = true;
        tryInit();
    });

    // Fallback: if bda:partials-loaded never fires (partial loader failed),
    // init after a 2s timeout so the page still renders content.
    setTimeout(function() {
        if (!partialsLoaded) {
            console.warn('bda-figure-page.js: bda:partials-loaded did not fire; initializing without TOC scroll-spy');
            partialsLoaded = true;
            tryInit();
        }
    }, 2000);

    function init() {
        // ... rest of initialization
    }
})();
```

The 2-second timeout ensures the figure page still renders even if the partial loader fails. The credentialing rail is a progressive enhancement — the core scholarly content must always load.

---

## Data Requirements

Reads `/data/detroit.json` and consumes:

- `data.figures` — finds the figure matching the querystring `id`
- `data.sources` — resolves the figure's `source_ids` for the Primary Sources section and citations
- `data.edge_types` — for connection edge type colors and labels
- `data.evidence_tiers` — for connection tier rendering

### Required fields on the figure

Every field documented in `DATAREADME.md` as required for a figure. If any required field is missing, the page renders a graceful error for that section rather than failing to render entirely.

### Optional fields consumed

| Field | Used For |
|-------|----------|
| `years.birth` / `years.death` | Header era display (real figures) |
| `medium` / `genre` | Header metadata (fictional figures) |
| `creator_id` | Header "Created by" link (fictional figures) |
| `adaptations` | Biography section sidebar (fictional figures with adaptations) |
| `geographic.additional_locations` | Map preview additional markers |
| `biography.creator` / `biography.source_text` | Biography section footer (fictional figures) |
| `influence.phases` | Not used on this page — belongs to the network visualization |

The `influence` bucket is intentionally omitted from the figure page. Influence is a time-based visualization tool, not a scholarly document element. Users wanting to see a figure's cultural footprint over time go to `/visualizations/network.html`.

---

## Initialization Flow

```
DOMContentLoaded
  + bda:partials-loaded
  ↓
cacheDom()
  ↓
parseQuerystring() → extract id
  ↓
loadData() → fetch /data/detroit.json
  ↓
findFigure(id) → locate figure in data.figures
  ↓
  ┌─ figure not found → renderNotFound() → exit
  └─ figure found:
       ↓
     renderHeader(figure)
     renderJustificationEssay(figure)
     renderBiography(figure)
     renderCriteria(figure)
     renderConnections(figure, data.figures, data.edge_types, data.evidence_tiers)
     renderGeography(figure)             ← initializes Leaflet map preview
     renderPrimarySources(figure, data.sources)
     renderRelatedFigures(figure, data.figures)
     renderCitationBlock(figure)
     bindEvents()
     attachScrollSpy()
```

### Not-found handling

If the querystring `id` does not match any figure:

```html
<div role="alert" class="bda-figure-not-found">
    <h1>Figure not found</h1>
    <p>The figure you're looking for doesn't exist in this archive.
       <a href="/archive/figures/">Browse all figures</a>.</p>
</div>
```

### Missing querystring

```javascript
if (!figureId) {
    window.location.replace('/archive/figures/');
    return;
}
```

Redirects to the figures landing. `replace` (not `assign`) avoids polluting history.

### Dormant figure handling

If a user directly links to a dormant-modality figure (Goines today), the page loads and renders normally. The figure page itself does not enforce dormancy — that's the landing and visualization tools' job. This allows direct scholarly links to work regardless of activation status.

---

## Page Structure

```html
<main id="main-content">
    <div class="bda-figure-layout">
        <article class="bda-figure-content">
            <header class="bda-figure-header" id="figure-header">
                <!-- renderHeader -->
            </header>

            <section id="justification"
                     aria-labelledby="bda-h-justification">
                <h2 id="bda-h-justification">Why This Figure</h2>
                <!-- renderJustificationEssay -->
            </section>

            <section id="biography"
                     aria-labelledby="bda-h-biography">
                <h2 id="bda-h-biography">Biography</h2>
                <!-- renderBiography -->
            </section>

            <section id="evaluation"
                     aria-labelledby="bda-h-evaluation">
                <h2 id="bda-h-evaluation">Five-Criteria Evaluation</h2>
                <!-- renderCriteria -->
            </section>

            <section id="connections"
                     aria-labelledby="bda-h-connections">
                <h2 id="bda-h-connections">Connections</h2>
                <!-- renderConnections -->
            </section>

            <section id="geography"
                     aria-labelledby="bda-h-geography">
                <h2 id="bda-h-geography">Geography</h2>
                <!-- renderGeography -->
            </section>

            <section id="primary-sources"
                     aria-labelledby="bda-h-primary-sources">
                <h2 id="bda-h-primary-sources">Primary Sources</h2>
                <!-- renderPrimarySources -->
            </section>

            <section id="related-figures"
                     aria-labelledby="bda-h-related-figures">
                <h2 id="bda-h-related-figures">Related Figures</h2>
                <!-- renderRelatedFigures -->
            </section>

            <section id="citation"
                     aria-labelledby="bda-h-citation">
                <h2 id="bda-h-citation">Cite This Entry</h2>
                <!-- renderCitationBlock -->
            </section>
        </article>

        <aside id="bda-credentialing-rail" aria-label="About the author">
            <!-- Populated by bda-partials-loader.js -->
        </aside>
    </div>
</main>
```

### Contract with the credentialing rail partial

The partial loader's `buildPageTOC()` scans `<main>` for `<h2>` elements and builds the TOC. For this to work correctly:

- Every `<h2>` in the figure page must have a stable, unique `id`
- The IDs use the format `bda-h-[section]` (e.g., `bda-h-biography`)
- Each `<section>` wrapping content uses a shorter, semantic `id` (`biography`) for anchor links — these are the hash fragments the TOC links to (`#biography`)
- `<section>` uses `aria-labelledby` pointing to the `<h2>` id inside it, which satisfies the accessible-name requirement for a labeled region

This dual-ID pattern (section id = anchor target, h2 id = label target) keeps hash-fragment URLs clean (`#biography` is user-readable) while still giving screen readers the right heading as the region's accessible name.

### Heading hierarchy

- `<h1>` is the figure name (set in `renderHeader()`)
- `<h2>` is each section heading
- `<h3>` is subsections within a section (individual criteria, individual connections, source cards)
- `<h4>` is rarely used — only within the Biography section for adaptation sub-entries on fictional figures

No level is skipped.

---

## Mobile Credentialing Rail Pattern

The credentialing rail is sticky-scroll alongside the main content on desktop. On mobile, the rail moves above the content and is not sticky — author info is visible at the top of the page, and the TOC becomes a collapsed `<details>` element the user can expand.

### Partial markup for mobile-awareness

The `credentialing-rail.html` partial renders with a structure that supports both layouts via CSS alone:

```html
<div class="bda-cred-rail-inner">
    <div class="bda-cred-author">
        <!-- Headshot, name, pronouns, affiliation, bio blurb, link to About -->
    </div>
    <nav class="bda-cred-toc" id="bda-page-toc" aria-label="On this page">
        <!-- Desktop: always visible -->
        <!-- Mobile: wrapped in <details> via CSS-only responsive rule -->
        <h3 class="bda-cred-toc-heading">On this page</h3>
        <ul id="bda-page-toc-list">
            <!-- Populated by bda-partials-loader.js -->
        </ul>
    </nav>
</div>
```

On mobile, the TOC is wrapped in a `<details>` element via progressive enhancement in the partial loader. **This is the one deviation from "partial loader owns the TOC entirely"** — on mobile, the loader must wrap the TOC `<nav>` in a `<details>` for collapsibility.

Alternative: the partial HTML can include the `<details>` structure directly, with CSS hiding/showing the `<summary>` based on viewport. This is cleaner than JS-based progressive enhancement. Recommended approach:

```html
<details class="bda-cred-toc-details" open>
    <summary class="bda-cred-toc-summary">On this page</summary>
    <ul id="bda-page-toc-list"></ul>
</details>
```

CSS hides the `<summary>` on desktop (`@media (min-width: 992px) { .bda-cred-toc-summary { display: none; } }`) and sets the `<details>` to always-open. On mobile, the `<summary>` is visible and the user can collapse/expand.

**Accessibility:** Native `<details>`/`<summary>` provides keyboard operation (Enter/Space to toggle) and screen reader announcement ("On this page, expanded/collapsed") for free. No ARIA augmentation needed.

---

## Rendering Functions

### `renderHeader(figure)`

Renders the page header: figure name, modality badge with shape marker, type badge, era/medium, creator link (fictional), total badman score.

```html
<header class="bda-figure-header">
    <div class="bda-figure-header-badges">
        <span class="bda-figure-modality-badge bda-mm-revolutionary">
            <span class="bda-filter-modality-marker bda-mm-revolutionary" aria-hidden="true"></span>
            Revolutionary
        </span>
        <span class="bda-figure-type-badge bda-type-real">Real</span>
        <span class="bda-figure-meta-badge" aria-hidden="true">Meta-Badman</span>
    </div>
    <h1 class="bda-figure-name">Ron Scott</h1>
    <p class="bda-figure-era">1949–2015</p>
    <p class="bda-figure-score" aria-label="Badman score: 23 out of 25">
        Badman Score: <span class="bda-score-value">23</span><span class="bda-score-total">/25</span>
    </p>
</header>
```

**Fictional figures** have an additional `<p>` with the creator link:

```html
<p class="bda-figure-creator">
    Created by <a href="/archive/figures/?id=goines_donald">Donald Goines</a>,
    appeared in <em>Crime Partners</em> (1974)
</p>
```

**Document title update:** `document.title` is set to `[Figure Name] | Detroit Badman Archive` after the header renders.

---

### `renderJustificationEssay(figure)`

The justification essay is the scholarly argument for why this figure belongs in the archive. It is the most prose-heavy section on the page and uses a serif typeface with a constrained max-width (~640px) for readability.

**Source:** This content is NOT in the current JSON schema. The justification essay is a field that either needs to be added to the figure schema OR is stored separately per figure and loaded by a secondary fetch.

**Pending decision:** Whether the justification essay lives in the main JSON as a new figure field (`figure.justification.essay`) or in separate per-figure markdown files loaded on demand.

Until that decision is made, `renderJustificationEssay()` falls back to:

```html
<div class="bda-figure-justification">
    <p class="bda-figure-justification-placeholder">
        Justification essay pending.
        Contact the Project Director for the full scholarly argument for this figure's inclusion.
    </p>
</div>
```

When the essay field is added, the renderer uses a markdown-to-HTML pipeline (any standard library; the function takes markdown and returns safe HTML).

**Accessibility rule regardless of source:** The essay must be wrapped in an `<article class="essay">` so the in-prose link underline rule from `styles.css` applies.

---

### `renderBiography(figure)`

Renders the biography: a two-column layout with the description on the left and the key events timeline on the right. On mobile, columns stack vertically.

```html
<div class="bda-figure-biography">
    <div class="bda-figure-biography-description">
        <p>[first 200 words of description]</p>
        <a href="#" class="read-more-toggle"
           aria-label="Read more about Ron Scott">Read more</a>
        <div class="bda-figure-biography-description-rest" hidden>
            <p>[rest of description]</p>
        </div>
    </div>

    <div class="bda-figure-biography-timeline">
        <h3>Key Events</h3>
        <ol class="bda-figure-timeline-list">
            <li class="bda-figure-timeline-event">
                <span class="bda-figure-timeline-year">1968</span>
                <div class="bda-figure-timeline-content">
                    <p>Co-founded Detroit chapter of Black Panther Party</p>
                    <p class="bda-figure-timeline-location">Detroit, MI</p>
                </div>
            </li>
            <!-- ... -->
        </ol>
    </div>
</div>
```

### Read more behavior

Uses the `.read-more-toggle` class from `CSS_DOCUMENTATION.md`. On click:

1. Toggles the `hidden` attribute on the rest-container
2. Toggles the link text between "Read more" and "Show less"
3. Updates the link's `aria-label`
4. `preventDefault()` on the click to suppress the `#` jump

No focus change. Keyboard users stay on the toggle after expansion; screen readers announce the new content via DOM change (no `aria-live` needed because the content was always in the DOM, just hidden — screen readers will discover it on next navigation).

### Timeline as ordered list

`<ol>` is correct — key events are chronological and their order is meaningful. Year labels are visual aids; the list order carries the semantics.

### Fictional figure adaptations

If `figure.adaptations` is populated, append an Adaptations subsection:

```html
<div class="bda-figure-biography-adaptations">
    <h3>Adaptations</h3>
    <ul>
        <li>
            <strong>Film (2028):</strong> <em>Kenyatta Rising</em>
        </li>
    </ul>
</div>
```

### Fictional figure creator/source_text footer

If `figure.biography.creator` and/or `figure.biography.source_text` exist:

```html
<p class="bda-figure-biography-credits">
    <strong>Creator:</strong> [creator]<br>
    <strong>Source text:</strong> [source_text]
</p>
```

---

### `renderCriteria(figure)`

Renders the five-criteria evaluation as a definition list with score bars and collapsible justifications.

```html
<dl class="bda-figure-criteria">
    <div class="bda-figure-criterion">
        <dt>
            <span class="bda-criterion-name">Outlaw Relationship to Law</span>
            <span class="bda-criterion-score" aria-label="Score: 5 out of 5">5/5</span>
        </dt>
        <dd>
            <div class="bda-criterion-bar" aria-hidden="true">
                <div class="bda-criterion-bar-fill" style="--criterion-value: 5;"></div>
            </div>
            <details class="bda-criterion-details">
                <summary>Show justification</summary>
                <p>[justification text]</p>
            </details>
        </dd>
    </div>
    <!-- ... four more criteria ... -->
    <div class="bda-figure-criterion-total">
        <dt>Total Badman Score</dt>
        <dd><strong>23/25</strong></dd>
    </div>
</dl>
```

### Accessibility details

- `<dl>` with `<div class="bda-figure-criterion">` wrapping each `<dt>`/`<dd>` pair — this is a documented accessible pattern for definition lists where each term-definition pair needs a container
- `<dt>` announces the criterion name; `<dd>` contains the score bar and collapsible justification
- Score announces via explicit `aria-label` ("Score: 5 out of 5")
- Score bar has `aria-hidden="true"` — it's decorative; the score number carries the value
- Justification uses native `<details>`/`<summary>` for keyboard-accessible collapse
- CSS custom property `--criterion-value` drives the fill width via CSS (no inline width styles). The one inline `style` attribute allowed in the emitted HTML is the custom property declaration — it's a value, not a style override.

### `_REVIEW_NEEDED` flag handling

If `figure.scores._REVIEW_NEEDED` is present (set on dormant or revised figures), render a review banner above the criteria:

```html
<div class="bda-figure-criteria-review-notice" role="note">
    <p><strong>Review note:</strong> [_REVIEW_NEEDED text]</p>
</div>
```

`role="note"` because this is editorial context, not a warning or error.

---

### `renderConnections(figure, allFigures, edgeTypes, evidenceTiers)`

Renders the figure's connections grouped by edge type. Each group shows the edge type's label, color swatch (shape, not a raw color block), and the list of connections of that type.

### Structure

```html
<div class="bda-figure-connections">
    <div class="bda-connection-group" data-edge-type="META">
        <h3 class="bda-connection-group-heading">
            <span class="bda-edge-legend-marker bda-edge-meta" aria-hidden="true"></span>
            Creator → Creation
            <span class="bda-connection-group-count">(1)</span>
        </h3>
        <ul class="bda-connection-list">
            <li class="bda-connection-item">
                <span class="bda-connection-direction" aria-hidden="true">→</span>
                <a href="/archive/figures/?id=kenyatta" class="bda-connection-name">Kenyatta</a>
                <span class="bda-connection-tier bda-tier-1"
                      aria-label="Tier 1: Documented">Documented</span>
                <p class="bda-connection-evidence">
                    Goines created Kenyatta character under pseudonym Al C. Clark in Crime Partners (1974).
                </p>
            </li>
        </ul>
    </div>
    <!-- ... more edge type groups ... -->
</div>
```

### Edge type grouping

Groups render in a fixed order: META, P2C, C2C, ORG, CC. Groups with zero connections are hidden entirely.

### Direction rendering

| `direction` | Visual | Screen reader |
|-------------|--------|---------------|
| `outgoing` | `→` | "connects outward to" |
| `incoming` | `←` | "received influence from" |
| `mutual` | `↔` | "mutual connection with" |

The arrow character is `aria-hidden`; the directional meaning is carried by a class that screen readers don't announce. If a figure connects to another figure in both directions, the arrow alone would be ambiguous — adding an `aria-label` on the `<li>` with the direction spelled out resolves this:

```html
<li class="bda-connection-item"
    aria-label="Outgoing connection to Kenyatta, tier 1 documented">
```

### Tier badges

| Tier | Class | Label | Color (from `data.evidence_tiers`) |
|------|-------|-------|-----------------------------------|
| 1 | `.bda-tier-1` | Documented | Archive green |
| 2 | `.bda-tier-2` | Evidenced | Archive gold |
| 3 | `.bda-tier-3` | Interpretive | Archive muted |

Tier badge text announces via `aria-label` so screen readers hear "Tier 1: Documented" (the tier number provides ordering context that "Documented" alone doesn't convey).

### Dangling target handling

If `connection.target_id` does not resolve to a figure in `data.figures`:

```html
<li class="bda-connection-item bda-connection-dangling">
    <span class="bda-connection-direction" aria-hidden="true">→</span>
    <span class="bda-connection-name bda-connection-name-missing">[Figure not in archive: kenyatta]</span>
    <!-- ... -->
</li>
```

Dangling connections are rare (the target was removed but the connection wasn't cleaned up). Rendering them visibly signals the data integrity issue to the editor.

### Edge type legend colors

Legend marker colors come from `data.edge_types[edgeType].color`. Classes use CSS variables for these colors to match what's in the JSON:

```css
.bda-edge-meta { background-color: var(--dba-gold); }
.bda-edge-p2c { background-color: var(--dba-revolutionary); }
.bda-edge-c2c { background-color: var(--dba-emerald); }
.bda-edge-org { background-color: var(--dba-detective); }
.bda-edge-cc { background-color: #e83e8c; } /* TODO: --dba-cc-pink variable */
```

The missing CC variable is a known issue flagged in `CSS_DOCUMENTATION.md` — same status as in every other file.

---

### `renderGeography(figure)`

Renders a map preview showing the figure's primary location, territory polygon, and additional locations. A small Leaflet instance initialized inside the section.

```html
<div class="bda-figure-geography">
    <div id="bda-figure-map-preview"
         role="img"
         aria-label="Map showing Ron Scott's primary location and territory in Detroit"
         style="height: 400px;"></div>

    <div class="bda-figure-geography-meta">
        <p class="bda-figure-geography-primary">
            <strong>Primary location:</strong> [primary_location.name]
        </p>
        <div class="bda-figure-geography-territory">
            <h3>Territory</h3>
            <p>[territory.description]</p>
        </div>
        <div class="bda-figure-geography-additional" hidden>
            <!-- Rendered only if additional_locations.length > 0 -->
            <h3>Additional Locations</h3>
            <ul>
                <li>
                    <strong>[location.name]</strong>: [location.significance]
                </li>
            </ul>
        </div>
        <p class="bda-figure-geography-view-full">
            <a href="/visualizations/map.html?focus=[figure.id]">
                View on the full archive map
                <span class="sr-only">(opens the full map page)</span>
            </a>
        </p>
    </div>
</div>
```

### Leaflet preview initialization

```javascript
function initMapPreview(figure) {
    var coords = figure.geographic.primary_location.coordinates;
    var map = L.map('bda-figure-map-preview', {
        zoomControl: true,
        scrollWheelZoom: false  // Prevent accidental zoom while scrolling the page
    }).setView([coords.lat, coords.lng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // Primary marker — modality-shaped, full config
    var config = getModalityConfig(figure.modality);
    L.marker([coords.lat, coords.lng], {
        alt: figure.name + ' — ' + figure.modality + ' modality'
    }).addTo(map);

    // Territory polygon
    if (figure.geographic.territory && figure.geographic.territory.polygon) {
        L.polygon(figure.geographic.territory.polygon, {
            color: config.color,
            fillColor: config.color,
            fillOpacity: 0.2
        }).addTo(map);
    }

    // Additional markers
    if (figure.geographic.additional_locations) {
        figure.geographic.additional_locations.forEach(function(loc) {
            L.circleMarker([loc.coordinates.lat, loc.coordinates.lng], {
                radius: 6,
                color: config.color,
                fillColor: config.color,
                fillOpacity: 0.5
            })
            .bindPopup('<strong>' + escapeHtml(loc.name) + '</strong><br>' + escapeHtml(loc.significance))
            .addTo(map);
        });
    }
}
```

### scrollWheelZoom disabled

The map preview has `scrollWheelZoom: false` because users scrolling down the page should not accidentally zoom the map. Pan and zoom-via-controls still work. This matches the pattern used by most publisher-embedded maps.

### Screen-reader alternative

The map preview has `role="img"` with a descriptive `aria-label`. The text metadata below the map (primary location, territory description, additional locations) provides the full information in non-visual form. Screen reader users do not miss information by not being able to interact with the map.

### Full map link

The link to `/visualizations/map.html?focus=[figure.id]` assumes the full map page will eventually support a `focus` querystring param that centers on and highlights a specific figure. At launch, if this param isn't implemented, the link still works (goes to the map; the user has to find the figure manually). Add a `focus` handler to `map.html` when the infrastructure is ready.

---

### `renderPrimarySources(figure, allSources)`

Renders a grid of this figure's primary sources. Reuses the source card pattern from `bda-sources.js`.

### Source filtering

Only sources where:

1. `source.figure_ids` contains the current figure's ID
2. `source.category === "primary"`

```javascript
function getPrimarySources(figure, allSources) {
    return allSources.filter(function(s) {
        return (s.figure_ids || []).indexOf(figure.id) !== -1 &&
               s.category === 'primary';
    });
}
```

### Rendering

```html
<div class="bda-figure-primary-sources">
    <ul class="bda-source-grid">
        <li>
            <!-- Source card, identical pattern to bda-sources.js renderCard -->
        </li>
    </ul>
    <p class="bda-figure-all-sources-link">
        <a href="/archive/sources/?f=[figure.id]">
            View all sources for [figure.name] (primary, secondary, and archival)
        </a>
    </p>
</div>
```

The "View all sources" link goes to the sources landing with the figure pre-filtered. This handles secondary and archival sources without cluttering the figure page with sources that aren't the figure's own work.

### Empty state

If the figure has no primary sources:

```html
<p class="bda-figure-primary-sources-empty">
    No primary sources cataloged yet for this figure.
    <a href="/engagement/submit">Suggest a source</a>.
</p>
```

The submit link directs community members to the submission page.

### Shared card pattern

The source cards on the figure page should use the exact same CSS classes (`.bda-source-card`, `.bda-source-card-thumb`, `.bda-source-card-info`, etc.) as `bda-sources.js`. The card-rendering function should be consolidated into `scripts.js` (see "Helper Consolidation" below) so both pages use the same implementation.

---

### `renderRelatedFigures(figure, allFigures)`

Renders figures connected to this figure via the `connections` array. Deduplicated (each figure appears once even if connected by multiple edges). Sorted alphabetically by modality, then by last name.

### Collection

```javascript
function getRelatedFigures(figure, allFigures) {
    var seen = new Set();
    var related = [];

    (figure.connections || []).forEach(function(conn) {
        if (seen.has(conn.target_id)) return;
        seen.add(conn.target_id);
        var target = allFigures.find(function(f) { return f.id === conn.target_id; });
        if (target) related.push(target);
    });

    return related.sort(function(a, b) {
        var modalityCmp = a.modality.localeCompare(b.modality);
        if (modalityCmp !== 0) return modalityCmp;
        return lastName(a.name).localeCompare(lastName(b.name));
    });
}
```

Same modality-alphabetical + last-name-alphabetical sort as the cited-in section on the source page.

### Rendering

Related figures render as compact cards (smaller than the figures landing cards, since they're a secondary element on this page):

```html
<ul class="bda-figure-related-grid">
    <li>
        <a class="bda-figure-related-card" href="/archive/figures/?id=baker_gordon"
           aria-label="General Gordon Baker Jr., Revolutionary, Real, badman score 24 out of 25">
            <span class="bda-filter-modality-marker bda-mm-revolutionary" aria-hidden="true"></span>
            <span class="bda-figure-related-card-name">General Gordon Baker Jr.</span>
            <span class="bda-figure-related-card-score">24/25</span>
        </a>
    </li>
</ul>
```

### Empty state

If a figure has no connections:

```html
<p class="bda-figure-related-empty">
    No connections cataloged yet for this figure.
</p>
```

---

### `renderCitationBlock(figure)`

Generates a citation for the archive entry itself (not for a source). Chicago default, MLA and APA alternates. Copy-to-clipboard.

### Citation formats

The citation cites the figure's archive entry, with the archive as the container:

**Chicago (default):**
```
Foster, Harry M. "[Figure Name]." *Detroit Badman Archive*. Accessed [access date]. [current URL].
```

Example:
```
Foster, Harry M. "Ron Scott." *Detroit Badman Archive*. Accessed April 19, 2026. https://detroit.badmandigitalarchive.com/archive/figures/?id=scott_ron.
```

**MLA:**
```
Foster, Harry M. "[Figure Name]." *Detroit Badman Archive*, [current URL]. Accessed [access date].
```

**APA:**
```
Foster, H. M. ([current year]). [Figure Name]. *Detroit Badman Archive*. [current URL]
```

### Access date

The access date is the current date (`new Date()`) at render time. Users citing the page at different times get different access dates, which is correct per citation standards.

### Structure

Uses the same block pattern as the source page citation. See `BDA_SOURCE_PAGE_JS.md` for the full accessibility requirements.

---

## Scroll-Spy on the Credentialing Rail TOC

When the user scrolls, the current section in the credentialing rail TOC is highlighted. This requires adding behavior on top of the TOC that the partial loader built.

### Implementation

```javascript
function attachScrollSpy() {
    var tocList = document.getElementById('bda-page-toc-list');
    if (!tocList) return;  // TOC not present; skip

    var sectionIds = Array.from(document.querySelectorAll('main section[id]'))
        .map(function(s) { return s.id; });

    if (sectionIds.length === 0) return;

    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            var link = tocList.querySelector('a[href="#' + entry.target.id + '"]');
            if (!link) return;
            if (entry.isIntersecting) {
                // Clear previous active state
                tocList.querySelectorAll('a').forEach(function(a) {
                    a.removeAttribute('aria-current');
                    a.classList.remove('is-active');
                });
                // Set new active state
                link.setAttribute('aria-current', 'true');
                link.classList.add('is-active');
            }
        });
    }, {
        // Trigger when the section's top enters the viewport's upper third
        rootMargin: '0px 0px -66% 0px',
        threshold: 0
    });

    sectionIds.forEach(function(id) {
        var section = document.getElementById(id);
        if (section) observer.observe(section);
    });
}
```

### Accessibility details

- `aria-current="true"` on the active TOC link is the screen-reader signal
- `.is-active` class drives the visual highlight (via `styles.css`)
- IntersectionObserver is used instead of scroll-event listeners for performance (no reflow on every scroll frame)
- `rootMargin: '0px 0px -66% 0px'` triggers when a section's top reaches the top third of the viewport, which matches user expectation ("which section am I reading?")

### Reduced motion

If the user has `prefers-reduced-motion: reduce` enabled, smooth-scroll behavior on TOC link clicks is disabled via the global CSS rule in `styles.css`. IntersectionObserver itself doesn't animate, so the scroll-spy works identically regardless of motion preference.

### Fallback for missing TOC

If the partial loader failed and the TOC is missing, `attachScrollSpy()` exits cleanly. The figure page still works; only the in-page navigation aid is missing.

---

## Copy-to-Clipboard

Same pattern as `bda-source-page.js`. Citation copy and permalink copy both use the shared `copyToClipboard(text, statusElement)` helper. See `BDA_SOURCE_PAGE_JS.md` for the full spec.

---

## Events

All event binding happens in `bindEvents()` after initial render.

| Event | Target | Action |
|-------|--------|--------|
| `click` | `.read-more-toggle` (biography) | Toggle description expansion |
| `click` | TOC links (delegated on `#bda-page-toc-list`) | Default anchor behavior; scroll-spy handles highlight |
| `change` | `input[name="citation-format"]` | Regenerate citation |
| `click` | `.bda-citation-copy-btn` | Copy citation |
| `click` | `.bda-figure-permalink-btn` | Copy figure permalink |

### Native behaviors relied on

- `<details>`/`<summary>` elements handle their own keyboard operation (Enter/Space to toggle)
- Leaflet handles its own map interaction including keyboard pan (arrow keys when map has focus) and zoom (+/- keys)
- Anchor links handle their own navigation; scroll-spy observes the result

No custom keyboard handlers are required in this file beyond the read-more toggle.

---

## CSS Class Contract

All classes referenced by this file must be defined in `styles.css`. The inventory:

### Page chrome

- `.bda-figure-layout`, `.bda-figure-content`
- `.bda-figure-header`, `.bda-figure-header-badges`
- `.bda-figure-modality-badge`, `.bda-figure-type-badge`, `.bda-figure-meta-badge`
- `.bda-figure-name` (h1)
- `.bda-figure-era`, `.bda-figure-score`, `.bda-figure-creator`
- `.bda-figure-not-found`

### Sections

- `.bda-figure-justification`, `.bda-figure-justification-placeholder`
- `.bda-figure-biography`, `.bda-figure-biography-description`, `.bda-figure-biography-description-rest`
- `.bda-figure-biography-timeline`, `.bda-figure-timeline-list`, `.bda-figure-timeline-event`
- `.bda-figure-timeline-year`, `.bda-figure-timeline-content`, `.bda-figure-timeline-location`
- `.bda-figure-biography-adaptations`, `.bda-figure-biography-credits`
- `.bda-figure-criteria`, `.bda-figure-criterion`, `.bda-figure-criterion-total`
- `.bda-criterion-name`, `.bda-criterion-score`, `.bda-criterion-bar`, `.bda-criterion-bar-fill`
- `.bda-criterion-details`
- `.bda-figure-criteria-review-notice`

### Connections

- `.bda-figure-connections`
- `.bda-connection-group`, `.bda-connection-group-heading`, `.bda-connection-group-count`
- `.bda-connection-list`, `.bda-connection-item`, `.bda-connection-dangling`
- `.bda-connection-direction`, `.bda-connection-name`, `.bda-connection-name-missing`
- `.bda-connection-tier`, `.bda-tier-1`, `.bda-tier-2`, `.bda-tier-3`
- `.bda-connection-evidence`
- `.bda-edge-legend-marker`, `.bda-edge-meta`, `.bda-edge-p2c`, `.bda-edge-c2c`, `.bda-edge-org`, `.bda-edge-cc`

### Geography

- `.bda-figure-geography`, `.bda-figure-geography-meta`
- `.bda-figure-geography-primary`, `.bda-figure-geography-territory`, `.bda-figure-geography-additional`
- `.bda-figure-geography-view-full`

### Primary sources

- `.bda-figure-primary-sources`, `.bda-figure-primary-sources-empty`
- `.bda-figure-all-sources-link`
- (reuses source card classes from `bda-sources.js`)

### Related figures

- `.bda-figure-related-grid`, `.bda-figure-related-card`
- `.bda-figure-related-card-name`, `.bda-figure-related-card-score`
- `.bda-figure-related-empty`

### Citation

Reuses `.bda-citation-block` and related classes from `bda-source-page.js`.

### Credentialing rail (defined in partial, referenced here)

- `.bda-cred-rail-inner`, `.bda-cred-author`
- `.bda-cred-toc`, `.bda-cred-toc-details`, `.bda-cred-toc-summary`, `.bda-cred-toc-heading`
- `.is-active` (TOC active state from scroll-spy)

**Documentation gap:** Figure-page classes are not yet in `CSS_DOCUMENTATION.md`. Tracking with the sources-landing and source-page gaps as a single pending documentation task.

---

## Contrast Requirements

Same archive theme variables. No hardcoded colors (except the CC edge color `#e83e8c` until the `--dba-cc-pink` variable is added).

The criterion bars fill with the figure's modality color at full opacity on an empty background — contrast requirements apply only if text is overlaid on the bar, which it isn't. The numeric score next to the bar is the accessible score readout.

---

## Helpers

### `calculateBadmanScore(scores)`

Consumed from `scripts.js`.

### `getModalityConfig(modality)`

Consumed from `scripts.js`.

### `parseQuerystring()`, `findFigure(id, figures)`, `escapeHtml(s)`, `lastName(fullName)`, `formatTypeLabel(type)`, `copyToClipboard()`, `announceCopy()`

All documented in `BDA_SOURCE_PAGE_JS.md`. These are the primary candidates for consolidation into `scripts.js`.

### Helper Consolidation

Across the four page-specific JS files, the following helpers are duplicated:

- `escapeHtml`
- `formatTypeLabel`
- `lastName`
- `parseQuerystring`
- `copyToClipboard` + `announceCopy` (source and figure pages only)

**Recommendation:** Migrate all of these to `scripts.js` during the JS cleanup pass. Update this readme and the other three page readmes to reference `scripts.js` as the source. Keep the inline fallbacks for `getModalityLabel()` since that one depends on `getModalityConfig()` and is resilience-oriented, not a pure utility.

---

## Accessibility Checklist

Before committing any change to this file, verify:

- [ ] No hardcoded hex color values (CC pink is known exception pending variable)
- [ ] No inline `style="..."` attributes in emitted HTML (CSS custom property declarations allowed — `style="--criterion-value: 5;"`)
- [ ] Every emitted class exists in `styles.css`
- [ ] `<h1>` is the figure name, unique per page
- [ ] Every `<section>` has an `id` (anchor target) and `aria-labelledby` pointing to its heading
- [ ] Every `<h2>` has an `id` in `bda-h-*` format (TOC target)
- [ ] Heading hierarchy is sequential — `<h1>` → `<h2>` → `<h3>`, no skipped levels
- [ ] Map preview has `role="img"` and descriptive `aria-label`
- [ ] Map preview has `scrollWheelZoom: false` to prevent accidental zoom during page scroll
- [ ] Text metadata under map provides the same information the map shows visually
- [ ] Five-criteria uses semantic `<dl>` with `<dt>`/`<dd>` pairs
- [ ] Score bars have `aria-hidden="true"` (score number carries the value)
- [ ] Connection tier badges have `aria-label` spelling out "Tier N: [Label]"
- [ ] Connection direction arrows are `aria-hidden`; `<li>` has `aria-label` with direction
- [ ] `<details>`/`<summary>` used for content-driven collapsibility (criteria justifications, timeline, etc.)
- [ ] Read-more toggles update their `aria-label` when state changes
- [ ] TOC links get `aria-current="true"` when active via scroll-spy
- [ ] IntersectionObserver used for scroll-spy (not scroll event listeners)
- [ ] Copy-to-clipboard announces via `aria-live="polite"` status region
- [ ] Citation format toggle is native radio group inside `<fieldset>`/`<legend>`
- [ ] All user-facing strings pass through `escapeHtml()`
- [ ] Dangling connection targets render visibly as data-integrity signals
- [ ] Related figures sort alphabetically by modality, then by last name
- [ ] Fallback renders if `bda:partials-loaded` doesn't fire within 2 seconds
- [ ] Mobile credentialing rail uses `<details>` for collapsible TOC
- [ ] Leaflet map destroyed/reinitialized correctly if the page re-renders (unlikely on a query-based SPA-less page, but good hygiene)

---

## Troubleshooting

### Page shows "Figure not found" on a figure that exists
- Check querystring `id` matches the figure's `id` exactly (case-sensitive, underscores)
- Confirm `data/detroit.json` loaded successfully
- Verify the figure ID is spelled correctly in the JSON

### Credentialing rail shows no TOC
- Confirm `bda-partials-loader.js` loaded and fired `bda:partials-loaded`
- Verify `credentialing-rail.html` contains the TOC markup structure
- Check that `<main>` contains at least one `<h2>` inside a `<section>` — the TOC won't have entries if there are no qualifying headings

### TOC scroll-spy doesn't highlight as I scroll
- Verify section IDs in the HTML match the `href="#..."` targets in the TOC
- Check browser console for IntersectionObserver errors
- Confirm each `<section>` has an `id` attribute (not just the `<h2>` inside it)

### Map preview is blank or tiny
- Confirm Leaflet JS and CSS are loaded in the page HTML
- Check that `#bda-figure-map-preview` has an explicit height (`style="height: 400px;"` or CSS rule)
- Verify `figure.geographic.primary_location.coordinates` exists with valid lat/lng

### Map preview pans but doesn't scroll the page
- `scrollWheelZoom: false` is working correctly — the map doesn't zoom on scroll. Scroll continues normally outside the map element.
- If scroll gets stuck INSIDE the map, the pan-handling may be consuming scroll events. Verify no CSS `overflow: hidden` is applied to the map's parent.

### Criterion bars show wrong fill width
- Confirm `--criterion-value` CSS custom property is set on each `.bda-criterion-bar-fill` element
- Verify `styles.css` has a rule like `.bda-criterion-bar-fill { width: calc(var(--criterion-value) * 20%); }`

### Read-more toggle doesn't expand
- Check that the rest-container's `hidden` attribute toggles on click
- Verify `preventDefault()` is called on the click handler to suppress `#` jump

### Connections group headers repeat
- Render the edge type groups only once, not once per connection. `renderConnections()` should iterate edge types and filter the figure's connections to each type.

### Citation copies HTML tags instead of text
- The copy function must copy `.textContent` of the rendered citation element, not the HTML. Italicization via Unicode characters (𝐼𝑡𝑎𝑙𝑖𝑐) is out of scope — standard citations use plain text italics only in rendered form.

### Primary sources section shows secondary sources
- Verify filter is `category === "primary"` AND `figure_ids.indexOf(figure.id) !== -1`
- Check that the sources array in the JSON has `category` set correctly

### Related figures list is empty for a figure with connections
- Verify `figure.connections` array is populated
- Check that `connection.target_id` values resolve to figures in `data.figures`
- Dangling targets (IDs that don't resolve) are skipped in the related-figures list but should appear in the connections section as dangling entries — verify this behavior

### The page renders before partials load (TOC is empty)
- This can happen if `bda:partials-loaded` never fires. The 2-second timeout fallback should trigger initialization anyway.
- Check browser console for partial loader errors.
- The page still works; only the TOC-based scroll-spy is unavailable.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | April 2026 | Initial documentation. Documents intended state of `bda-figure-page.js` — no implementation yet. Spec covers query-based routing, nine sections (header, justification, biography, criteria, connections, geography, primary sources, related figures, citation), Leaflet map preview with scrollWheelZoom disabled, scroll-spy on credentialing rail TOC via IntersectionObserver, mobile-collapsible TOC via `<details>`, citation generation for archive entries (Chicago/MLA/APA), reserved handling for justification essay source (JSON field vs. per-figure markdown pending). Flags helper consolidation candidates across all four page scripts. |
