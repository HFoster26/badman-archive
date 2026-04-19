# Site-Wide JavaScript Documentation

## Overview

Two JavaScript files load on every page of the Detroit Badman Archive. Together they provide the runtime foundation that every page — static or interactive — depends on.

| File | Responsibility |
|------|----------------|
| `scripts.js` | Shared utilities: data loading, score calculation, modality configuration, detail panel construction |
| `bda-partials-loader.js` | Page lifecycle: partial injection (navbar, footer, credentialing rail), nav active-state, page TOC generation, footer year |

Page-specific scripts (figures landing, sources landing, individual figure pages, individual source pages) live in the relevant page folders and load only where needed. The map and network visualization tools keep their JS embedded inline in `map.html` and `network.html` per their respective READMEs.

This document describes the **intended state** of both site-wide files. Where current code diverges from this spec (inline styles where classes are documented, dead nav-handling code), the code will be updated to match this document. The spec is the destination; the fix-up work is the path.

---

## Accessibility Standards

Every function in these files that touches the DOM must comply with:

- **WCAG 2.2 Level AA** — Minimum compliance target
- **MSU Digital Accessibility Policy** — webaccess.msu.edu/policy/technical-guidelines
- **MSU Basic Checklist** — webaccess.msu.edu/basiclist

The specific WCAG success criteria that govern these files are called out in each function's documentation below. A function that violates any of them is a bug, not a style preference.

### Testing Tools

Every change to a site-wide JS file must be verified against at least two of:

- **axe DevTools** — Chrome extension, automated WCAG scanning
- **WAVE Browser Extension** — wave.webaim.org, automated WCAG scanning
- **NVDA** — Free Windows screen reader for manual verification
- **VoiceOver** — Built-in macOS/iOS screen reader
- **Keyboard-only navigation** — Tab through the entire page with no mouse

---

## File 1: scripts.js

### Purpose

`scripts.js` is a utility library, not a page bootstrapper. Functions are defined and exported (via the implicit global scope) for use by page-specific scripts and by inline scripts in `map.html` / `network.html`. Nothing in `scripts.js` should run on DOMContentLoaded except a console log confirming the file loaded.

### Authority boundaries

- `scripts.js` **does not** handle navigation highlighting. That is the partial loader's job — the navbar doesn't exist in the DOM when `scripts.js` runs.
- `scripts.js` **does not** render DOM structure for site chrome (navbar, footer, credentialing rail). That is the partial loader's job.
- `scripts.js` **does** provide utilities that page scripts call.
- `scripts.js` **does** build dynamic detail panel content for map markers, network nodes, and screen-reader data table rows.

### Style rule

No hardcoded hex color values in this file. Every color must resolve to a CSS variable (defined in `styles.css`). Every visual property applied to DOM elements must come from a CSS class defined in `styles.css`, not from inline `style="..."` attributes. Inline styles in JavaScript template strings cannot be audited by CSS contrast tooling and cannot be overridden by future theme changes — they are a violation of the single-source-of-truth convention documented in `CSS_DOCUMENTATION.md`.

### Script loading

`scripts.js` must load after Bootstrap's JS bundle and before any page-specific script that depends on it. In each page's HTML:

```html
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="/js/scripts.js"></script>
<script src="/js/bda-partials-loader.js"></script>
<!-- Page-specific scripts, if any, load here -->
```

### Functions

#### `loadArchiveData(url)`

Utility for fetching JSON data.

**Signature:** `async function loadArchiveData(url) → Promise<object | null>`

**Behavior:**
- Fetches the JSON file at `url`
- Returns parsed JSON on success
- Returns `null` on any error (network failure, non-2xx response, parse failure)
- Logs errors to the browser console for developer visibility

**Consumers:** map inline JS, network inline JS, `bda-sources.js`, `bda-figures.js`, individual figure pages.

**Accessibility:** N/A (data loading has no user-facing surface). Downstream consumers must handle the `null` return by rendering a user-visible error message that includes `role="alert"` or `aria-live="assertive"` so screen readers announce the failure.

```javascript
async function loadArchiveData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading archive data:', error);
        return null;
    }
}
```

---

#### `calculateBadmanScore(scores)`

Computes the total 1–25 badman score from a figure's five-criteria object.

**Signature:** `function calculateBadmanScore(scores) → number`

**Behavior:**
- Sums the five `.score` values from the five-criteria scoring object
- Returns an integer 5–25

**Consumers:** detail panels, sr-only data tables, figure landing cards, individual figure pages.

**Accessibility:** N/A (pure computation). Callers that display the result must include unit context ("15/25") so screen readers can announce it meaningfully.

```javascript
function calculateBadmanScore(scores) {
    return (
        scores.outlaw_relationship.score +
        scores.community_authorization.score +
        scores.violence_as_language.score +
        scores.cultural_preservation.score +
        scores.hypermasculine_performance.score
    );
}
```

---

#### `formatFigureType(type, metaBadman)`

Formats a figure's type for display.

**Signature:** `function formatFigureType(type, metaBadman = false) → string`

**Behavior:**
- If `metaBadman === true`, returns `"Meta-Badman"` regardless of `type`
- Otherwise capitalizes the first letter of `type` (`"real"` → `"Real"`, `"fictional"` → `"Fictional"`)

**Consumers:** detail panels, figure cards.

**Accessibility:** N/A.

---

#### `getModalityConfig(modality)`

Returns the full visual identity configuration for a modality. This is the single source of truth for modality display properties.

**Signature:** `function getModalityConfig(modality) → { color, markerShape, networkShape, icon, displayLabel, legendLabel }`

**WCAG basis:**
- **1.4.1 Use of Color** — color alone cannot differentiate modalities. Every modality must have color + shape + icon.

**Return shape:**

| Field | Type | Purpose |
|-------|------|---------|
| `color` | string | Hex value matching the CSS variable for this modality |
| `markerShape` | string | Shape name used by the map's marker library (`"circle"`, `"star"`, `"hexagon"`, `"square"`, `"triangle"`) |
| `networkShape` | string | Shape name used by the D3 network visualization. Differs from `markerShape` for Revolutionary (star on map, diamond in network) because D3 renders diamond polygons more cleanly at small sizes. |
| `icon` | string | Icon identifier rendered inside map markers (`"magnifying-glass"`, `"raised-fist"`, `"lightning-bolt"`, `"dollar-sign"`, `"triangle"`) |
| `displayLabel` | string | Clean modality name for filter checkboxes, card badges, and prose contexts (`"Detective"`, `"Revolutionary"`, etc.) |
| `legendLabel` | string | Descriptive label for map/network legend entries (`"Circle marker — Detective Modality"`). Describes **shape first**, not color, because color is not a reliable identifier for users with color vision differences. |

**Why two labels?** The previous single-label approach forced consumers to choose between a clean name (good for filter UI) and a descriptive one (required for legend accessibility). Splitting them lets both surfaces use the right string for their context.

**Unknown modality fallback:** Returns a neutral gray config with `displayLabel: "Unknown Modality"`. Callers should not rely on this — all modalities in the archive should resolve to a real entry.

**Consumers:** map inline JS, network inline JS, `bda-sources.js`, `bda-figures.js`, individual figure pages.

**Accessibility implications:**
- Callers rendering a legend must use `legendLabel`, not `displayLabel`. The legend must also render the shape (via the `.legend-[modality]` or `.legend-node-[modality]` CSS classes) so shape information is conveyed visually AND in the label text.
- Callers rendering filter UI use `displayLabel`.
- The `color` value is for rendering only. It must never be the sole signal of modality identity anywhere in the UI.

**Reference table:**

| Modality (code) | color | markerShape | networkShape | icon | displayLabel | legendLabel |
|-----------------|-------|-------------|--------------|------|--------------|-------------|
| `detective` | `#3388ff` | circle | circle | magnifying-glass | Detective | Circle marker — Detective Modality |
| `revolutionary` | `#dc3545` | star | diamond | raised-fist | Revolutionary | Star marker — Revolutionary Modality |
| `superhero_villain` | `#fd7e14` | hexagon | hexagon | lightning-bolt | Superhero-Villain | Hexagon marker — Superhero-Villain Modality |
| `gangsta_pimp` | `#6f42c1` | square | square | dollar-sign | Gangsta-Pimp | Square marker — Gangsta-Pimp Modality |
| `folk_hero_outlaw` | `#d4af37` | triangle | triangle | triangle | Folk Hero-Outlaw | Triangle marker — Folk Hero-Outlaw Modality |

This table must stay in sync with:
- The `.legend-[modality]` classes in `styles.css`
- The `.legend-node-[modality]` classes in `styles.css`
- The Modality Visual Identity System table in `HTML_TEMPLATES.md`
- The Modality Reference table in `DATAREADME.md`

When any of these change, all five sources update together or the change is not complete.

---

#### `getModalityColor(modality)`

Backward-compatibility shim that returns only the hex color for a modality.

**Signature:** `function getModalityColor(modality) → string`

**Behavior:** Wraps `getModalityConfig(modality).color`.

**When to use:** Legacy code paths that need only the color. New code should call `getModalityConfig()` directly and destructure what it needs.

---

#### `buildSourceLinks(sources)`

Builds an accessible HTML list of source links for detail panels.

**Signature:** `function buildSourceLinks(sources) → string`

**WCAG basis:**
- **1.3.1 Info and Relationships** — use semantic list structure (`<ul>`/`<li>`), never `<br>` separators, for groups of items.
- **2.4.4 Link Purpose (In Context)** — every link's purpose must be clear from the link text or surrounding context.
- **3.2.5 Change on Request** — links that open in a new tab must warn the user.

**Parameters:**
- `sources` — array of source objects, each with `url` and `title`. If the array is empty or `null`, returns a "No sources available" message.

**Return:** HTML string containing a `<ul class="source-links">` with one `<li class="source-link-item">` per source. Each `<li>` contains an `<a>` with `target="_blank"` and `rel="noopener noreferrer"`, plus a visually hidden "(opens in new tab)" span.

**Style rule:**
- Uses the `.source-links` and `.source-link-item` classes defined in `styles.css`.
- No inline `style="..."` attributes.
- Link color, underline, and hover states are handled by the in-prose link rule in `styles.css` (which includes `.source-link-item a` in its selector chain).

**Empty state:**
- When `sources` is empty, returns a paragraph with class `.source-links-empty` (defined in `styles.css`) rather than inline color styling.

```javascript
function buildSourceLinks(sources) {
    if (!sources || sources.length === 0) {
        return '<p class="source-links-empty">No sources available.</p>';
    }

    let html = '<ul class="source-links list-unstyled">';
    for (let i = 0; i < sources.length; i++) {
        html +=
            '<li class="source-link-item">' +
                '<a href="' + sources[i].url + '" target="_blank" rel="noopener noreferrer">' +
                    sources[i].title +
                    '<span class="sr-only"> (opens in new tab)</span>' +
                '</a>' +
            '</li>';
    }
    html += '</ul>';
    return html;
}
```

**Accessibility checklist (for anyone modifying this function):**
- [ ] Output uses `<ul>`/`<li>`, not `<br>` separators
- [ ] Every `target="_blank"` has `rel="noopener noreferrer"` AND an sr-only "(opens in new tab)" span
- [ ] No inline styles
- [ ] Empty state uses a class, not inline styling
- [ ] Link text is the source title (descriptive), not "click here" or "source"

---

#### `showFigureDetails(figure, panelContentId, panelId)`

Builds and injects figure detail content into a shared detail panel. Called from map marker clicks, network node clicks, and screen-reader data table row activations.

**Signature:** `function showFigureDetails(figure, panelContentId, panelId) → void`

**Parameters:**
- `figure` — full figure object from the JSON data
- `panelContentId` — ID of the content element inside the panel (e.g., `'info-content'`)
- `panelId` — ID of the panel container (e.g., `'info-panel'`)

**WCAG basis:**
- **1.3.1 Info and Relationships** — figure name is an `<h3>` (proper hierarchy under the panel's `<h2>` heading)
- **2.4.4 Link Purpose (In Context)** — "Read more" link includes an `aria-label` that names the figure
- **4.1.3 Status Messages** — panel container has `aria-live="polite"` and `aria-atomic="true"` (set in HTML, see `HTML_TEMPLATES.md`); content updates are announced automatically
- **2.4.3 Focus Order** — after content injection, focus moves to the panel so keyboard users are oriented to the new content
- **1.4.1 Use of Color** — modality identity is conveyed via the modality name text, not color alone

**Behavior:**
1. Compute the figure's total badman score (1–25) via `calculateBadmanScore()`
2. Truncate the biography description to ~200 characters for the default view; retain the full text for expansion
3. Build the source links list via `buildSourceLinks()` using the figure's primary sources (resolved from `source_ids`)
4. Construct the panel HTML using CSS classes — no inline styles
5. Inject the HTML into the content element
6. Move programmatic focus to the panel container
7. Wire up the Read more / Show less toggle

**Required classes in output HTML:**

| Element | Class | Purpose |
|---------|-------|---------|
| `<h3>` figure name | `.figure-detail-name` | Name heading |
| `<a>` read-more toggle | `.read-more-toggle` | Expansion control |
| `<hr>` divider | `.panel-divider` | Visual separator before sources |
| Source list | `.source-links` (via `buildSourceLinks()`) | List container |

**Source resolution:** `figure.source_ids` is an array of source ID strings that reference entries in the top-level `sources` array of the JSON. `showFigureDetails()` expects the caller to have already resolved these IDs to full source objects and passed them as `figure.sources.primary` (the `.primary` filtering happens at the call site, using the `category` field on each source). This separation keeps `showFigureDetails()` free of JSON-loading responsibility.

**Read more / Show less toggle:**
- Uses a single `<a>` element with class `.read-more-toggle` and `href="#"`
- On click: toggles between short and full description; updates the `aria-label` to reflect the new action ("Show less about [name]" / "Read more about [name]")
- `e.preventDefault()` on the click handler prevents the `#` from jumping the page

**Event listener note:** `showFigureDetails()` is called repeatedly as users click different figures. Each call rebuilds the HTML, which means the old `.read-more-toggle` element is removed from the DOM. The listener goes with it. No listener accumulation occurs, but the function must not capture external state that survives rebuilds — the `expanded` boolean must be local to each call.

**Consumers:**
- Map: marker click → `showFigureDetails(figure, 'info-content', 'info-panel')`
- Network: node click → `showFigureDetails(figure, 'info-content', 'info-panel')`
- Sr-only data tables on map.html and network.html: row activation → same call

**Accessibility checklist (for anyone modifying this function):**
- [ ] Figure name is an `<h3>`, never `<strong>` or a styled `<div>`
- [ ] No inline `style="..."` attributes anywhere in the output HTML
- [ ] Every class referenced exists in `styles.css`
- [ ] Panel container receives focus after injection (`panel.focus()`)
- [ ] Read more toggle has `aria-label` that names the figure
- [ ] Read more toggle updates its `aria-label` when state changes
- [ ] Source links are built via `buildSourceLinks()`, not hand-assembled
- [ ] Short description truncation does not cut off mid-sentence in a way that misrepresents the figure

---

### Initialization

`scripts.js` should not attach a DOMContentLoaded listener for anything except a debug confirmation log. All active work happens in functions called by other scripts or inline handlers.

```javascript
window.addEventListener('DOMContentLoaded', () => {
    console.log('Detroit Badman Archive: scripts.js loaded');
});
```

**What was removed and why:** Prior versions of `scripts.js` attached navigation active-state handling on DOMContentLoaded. This was removed because:

1. At DOMContentLoaded, the navbar partial has not yet been injected, so `.nav-link` queries return nothing. The code did no useful work.
2. The partial loader (`bda-partials-loader.js`) owns nav active-state after partials inject. Duplicating the logic created two code paths with different matching rules (flat filename vs. nested route prefix).
3. The prior version also set `link.style.color = '#d4af37'` directly, violating the "no hardcoded hex in JS" convention and making the active color un-themeable via CSS variables.

Navigation active-state is now handled exclusively in `markCurrentNavItem()` in `bda-partials-loader.js`.

---

## File 2: bda-partials-loader.js

### Purpose

`bda-partials-loader.js` is the page lifecycle bootstrapper. It runs on every page and is responsible for:

1. Fetching shared HTML partials (`navbar.html`, `footer.html`, `credentialing-rail.html`) and injecting them into placeholder elements
2. Setting the active-state on the current nav item after the navbar has been injected
3. Building the "On this page" TOC in the credentialing rail (where present) from the `<main>` element's `<h2>` headings
4. Setting the footer copyright year from the current date
5. Dispatching a `bda:partials-loaded` custom event so downstream scripts can react

The partial loader is the site's navigation authority. No other script should manipulate nav state, partial content, or the TOC.

### Partial placeholders

Every page must include three placeholder elements. The loader fills them if present; absent placeholders are silently skipped.

```html
<div id="bda-navbar"></div>
<!-- page content -->
<div id="bda-footer"></div>
```

Pages with a credentialing rail (individual figure pages and others that warrant it) also include:

```html
<aside id="bda-credentialing-rail" aria-label="About the author"></aside>
```

The `aria-label` on the `<aside>` is applied in the page HTML, not injected by the loader, so screen readers have the landmark labeled even before the partial arrives.

### FOUC (flash of unstyled content) mitigation

Placeholder elements have `min-height` values defined in `styles.css` matching the expected partial heights. This prevents content below them from reflowing when the partial arrives. Do not remove these CSS rules.

### Functions

#### `loadPartial(selector, url)`

Fetches a partial HTML file and injects it into a placeholder element.

**Signature:** `async function loadPartial(selector, url) → Promise<HTMLElement | null>`

**Behavior:**
- Queries the DOM for `selector`. If no element is found, returns `null` immediately (placeholder not present on this page — graceful skip).
- Fetches `url`. On non-2xx response, logs a warning and returns `null`.
- On fetch failure (network error), logs a warning and returns `null`.
- On success, sets `element.innerHTML` to the fetched HTML and returns the element.

**Accessibility note:** After injection, the partial's ARIA landmarks (`<nav aria-label="...">`, `<footer>`, etc.) become active. Screen readers that have already announced the page structure will not re-announce these automatically — this is a known limitation of partial-loaded architecture, mitigated by the fact that landmark navigation is a user-initiated action in screen readers and the updated DOM is available the next time the user invokes it.

---

#### `topLevelRoute()`

Determines the top-level route segment of the current page for nav matching.

**Signature:** `function topLevelRoute() → string`

**Behavior:**
- For `/` or `/index.html` → returns `/`
- For `/about/project/` → returns `/about/`
- For `/archive/figures/baker_gordon/` → returns `/archive/`
- For any other nested path → returns `/` + first path segment + `/`

**Design choice:** Highlighting the top-level nav parent (not the dropdown child) is intentional. When a user is on `/archive/figures/baker_gordon/`, the "Archive" nav item gets `aria-current="page"` — the page is under the Archive section, so Archive is the active top-level. Dropdown sub-items (Figures, Sources, Map, Network, etc.) do not receive individual active-state. This matches how most scholarly sites handle deep-page navigation and keeps the visible active-state stable as users navigate within a section.

---

#### `markCurrentNavItem()`

Sets `aria-current="page"` and an `.active` class on the nav item matching the current top-level route.

**Signature:** `function markCurrentNavItem() → void`

**WCAG basis:**
- **2.4.8 Location** — users should be able to determine their location within a set of pages. `aria-current="page"` is the programmatic signal; the `.active` class provides the visual one.
- **1.4.1 Use of Color** — visual active-state must not rely on color alone. The gold color from `.nav-link.active` in `styles.css` is paired with font weight (bold) and should also be signaled by `aria-current` (the programmatic equivalent) so both visual and non-visual users receive the same information.

**Behavior:**
- Queries `#bda-navbar [data-route]` — every nav link in `navbar.html` must have a `data-route` attribute
- For each link, compares its `data-route` to the current top-level route
- On match: sets `aria-current="page"` and adds `.active` class

**Contract with `navbar.html`:** Every top-level nav link must carry a `data-route` attribute whose value is the route prefix it represents:

```html
<a class="nav-link" href="/" data-route="/">Home</a>
<a class="nav-link dropdown-toggle" href="#" data-route="/about/">About</a>
<a class="nav-link dropdown-toggle" href="#" data-route="/archive/">Archive</a>
<a class="nav-link dropdown-toggle" href="#" data-route="/visualizations/">Visualizations</a>
<a class="nav-link dropdown-toggle" href="#" data-route="/engagement/">Engagement</a>
<a class="nav-link" href="/contact/" data-route="/contact/">Contact</a>
```

Links without `data-route` are ignored by the matcher. This is intentional — it lets dropdown child links exist in the markup without competing for active-state with their parent.

**Style rule:** This function does not set inline color. The `.nav-link.active` class in `styles.css` handles the visual appearance.

---

#### `buildPageTOC()`

Builds the "On this page" table of contents inside the credentialing rail by scanning the page's `<main>` element for `<h2>` headings.

**Signature:** `function buildPageTOC() → void`

**WCAG basis:**
- **2.4.1 Bypass Blocks** — the TOC is a secondary skip mechanism alongside the main skip-to-content link
- **2.4.6 Headings and Labels** — auto-generated anchor IDs use the heading text, preserving the heading's identity as its anchor
- **2.4.5 Multiple Ways** — provides an additional way to locate content within a long page

**Behavior:**
- Exits silently if no element with ID `bda-page-toc-list` exists (TOC not wanted on this page)
- Exits silently if no `<main>` element exists
- Finds all `<h2>` elements inside `<main>`
- If no `<h2>`s exist, hides the entire TOC container (`#bda-page-toc`) and exits
- For each `<h2>`:
  - If the `<h2>` has no `id`, generates one from its text content (lowercased, non-alphanumerics replaced with hyphens, trimmed of leading/trailing hyphens, truncated to 50 chars)
  - Creates a `<li>` containing an `<a href="#[id]">[heading text]</a>` and appends it to the TOC list

**Known edge case — duplicate heading IDs:** If two `<h2>` elements have identical text, they generate the same auto-ID and the second one's ID collides with the first. The anchor still works for whichever element the browser resolves first. Page authors should give duplicate headings explicit unique IDs to avoid this. Not currently enforced by the loader.

**Accessibility note:** The TOC `<nav>` element (defined in `credentialing-rail.html`) must carry `aria-label="On this page"` so screen reader users can identify it among other nav regions on the page.

---

#### `setFooterYear()`

Populates the footer's copyright year with the current year.

**Signature:** `function setFooterYear() → void`

**Behavior:**
- Finds the element with ID `bda-footer-year` (defined in `footer.html`)
- Sets its text content to the current four-digit year

**Contract with `footer.html`:** The footer partial must contain `<span id="bda-footer-year"></span>` where the year should appear:

```html
<p class="m-0 small">
    Copyright &copy; Detroit Badman Archive <span id="bda-footer-year"></span>
</p>
```

**Accessibility note:** The year is a text-content update with no interaction implications. No ARIA is required.

---

#### `init()`

The loader's entry point. Runs on DOMContentLoaded (or immediately if the document has already loaded past that point).

**Signature:** `async function init() → void`

**Behavior:**
1. Fire off all three partial loads in parallel via `Promise.all`
2. Once all partials have resolved (successfully or not), run post-load wiring in order:
   - `markCurrentNavItem()` — requires navbar in DOM
   - `buildPageTOC()` — requires credentialing rail in DOM (on pages that have one)
   - `setFooterYear()` — requires footer in DOM
3. Dispatch a `bda:partials-loaded` custom event on `document`

**Order matters:** Nav marking must run after navbar injection; TOC building must run after credentialing rail injection. `Promise.all` ensures all three injections complete before any wiring runs.

**Event dispatch:** The `bda:partials-loaded` event signals downstream scripts that the full DOM (including injected partials) is ready. Any script that interacts with partial content must either run after this event OR verify partial presence itself before acting.

---

### The `bda:partials-loaded` event

Because partials load asynchronously, any code that interacts with navbar, footer, or credentialing rail content must wait for the event:

```javascript
document.addEventListener('bda:partials-loaded', () => {
    // Safe to query navbar, footer, credentialing rail here
});
```

**Required consumer: Bootstrap dropdown re-initialization.** Bootstrap's dropdown JavaScript scans the DOM on page load and wires up `.dropdown-toggle` elements. If the navbar partial loads after Bootstrap initializes, the navbar dropdowns will not function. A listener on `bda:partials-loaded` must re-invoke Bootstrap's dropdown setup. The recommended pattern:

```javascript
document.addEventListener('bda:partials-loaded', () => {
    const dropdownToggles = document.querySelectorAll('#bda-navbar [data-bs-toggle="dropdown"]');
    dropdownToggles.forEach((toggle) => {
        new bootstrap.Dropdown(toggle);
    });
});
```

This listener lives in `scripts.js` (because it applies site-wide) and is wired alongside the other scripts.js initialization. Without it, the dropdown menu system is broken on every page.

**Accessibility consequence of missing this listener:** Users cannot reach any page linked through a dropdown. This is a **WCAG 2.1.1 Keyboard** failure and a **WCAG 2.4.3 Focus Order** failure. Do not ship without it.

---

## Cross-file contracts

The two site-wide files have the following contracts with each other and with the HTML/CSS layers. Violating any of these creates a runtime bug.

### scripts.js ↔ styles.css

- Every class `scripts.js` emits (`.figure-detail-name`, `.read-more-toggle`, `.panel-divider`, `.source-links`, `.source-link-item`, `.source-links-empty`) must be defined in `styles.css`
- Every modality color returned by `getModalityConfig()` must match a CSS variable in `styles.css` (`--dba-detective`, `--dba-revolutionary`, etc.)
- `scripts.js` must not set inline colors or inline styles anywhere

### bda-partials-loader.js ↔ partials

- `navbar.html` must contain nav links with `data-route` attributes for every top-level nav item
- `footer.html` must contain `<span id="bda-footer-year"></span>`
- `credentialing-rail.html` must contain a `<ul id="bda-page-toc-list">` inside a `<nav id="bda-page-toc" aria-label="On this page">`

### bda-partials-loader.js ↔ page HTML

- Every page must include `<div id="bda-navbar"></div>` and `<div id="bda-footer"></div>` at the appropriate positions
- Pages with a credentialing rail include `<aside id="bda-credentialing-rail" aria-label="About the author"></aside>` where the rail belongs
- Placeholders have `min-height` CSS to prevent FOUC reflow

### scripts.js ↔ bda-partials-loader.js

- `scripts.js` does NOT attach any logic to DOMContentLoaded that depends on partial content
- `scripts.js` owns the `bda:partials-loaded` event listener for Bootstrap dropdown re-initialization (documented above)
- The partial loader owns all nav active-state management

---

## Site-wide accessibility checklist

Before committing any change to a site-wide JS file, verify:

- [ ] No hardcoded hex color values anywhere in the file (use CSS variables via classes)
- [ ] No inline `style="..."` attributes in any HTML the script emits
- [ ] All dynamic content that may change is wrapped in an element with appropriate ARIA (`aria-live`, `aria-atomic`, `role="status"` / `role="alert"`)
- [ ] All interactive elements are keyboard-operable (reachable by Tab, activatable by Enter/Space)
- [ ] Focus is managed explicitly after content updates that change context
- [ ] All `target="_blank"` links have `rel="noopener noreferrer"` and sr-only "(opens in new tab)" text
- [ ] Color is never the sole signal of information (WCAG 1.4.1)
- [ ] Headings in injected content follow sequential order (no skipped levels)
- [ ] Alt text and aria-labels are descriptive (no "click here", "link", "image")
- [ ] New CSS classes emitted by JS exist in `styles.css` and have been contrast-verified

---

## Troubleshooting

### Navbar dropdowns don't open
- Confirm the `bda:partials-loaded` event listener in `scripts.js` is present and calls `new bootstrap.Dropdown(toggle)` on each toggle
- Verify `bootstrap.Dropdown` is defined (Bootstrap JS bundle loaded before `scripts.js`)
- Check browser console for errors during `init()`

### Nav active-state doesn't appear on the current page
- Verify the current page's top-level route matches a `data-route` value in `navbar.html`
- Confirm `navbar.html` has been updated to include `data-route` on every top-level link
- Check that the navbar partial loaded successfully (browser console → no 404 on `/partials/navbar.html`)

### TOC doesn't appear in the credentialing rail
- Confirm the page has a `<main>` element
- Confirm the page has at least one `<h2>` inside `<main>`
- Confirm `credentialing-rail.html` contains `<ul id="bda-page-toc-list">`
- If multiple `<h2>`s share the same text, only the first anchor will work — give duplicates explicit unique IDs

### Footer year shows as blank
- Confirm `footer.html` contains `<span id="bda-footer-year"></span>`
- Check the browser console for `init()` errors — if an earlier step threw, `setFooterYear()` may not have run

### Detail panel shows raw HTML
- The caller may be using `.textContent` instead of `.innerHTML` — `showFigureDetails()` returns HTML and expects `innerHTML` assignment (handled internally by the function itself, so this is only an issue if someone has reimplemented it)

### Detail panel is un-themed (all black or unstyled)
- CSS classes referenced by `showFigureDetails()` may be missing from `styles.css`. Verify `.figure-detail-name`, `.read-more-toggle`, `.panel-divider`, `.source-links`, `.source-link-item`, `.source-links-empty` all exist.

### Source links don't have underlines
- The in-prose link underline rule in `styles.css` must include `.source-link-item a` in its selector chain. Verify that rule has not been altered.

### Screen reader doesn't announce panel updates
- Verify the panel container in the page HTML has `aria-live="polite"` and `aria-atomic="true"`
- These attributes are set in the page HTML per `HTML_TEMPLATES.md`, not by `scripts.js`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | April 2026 | Initial site-wide JS documentation. Documents intended state of `scripts.js` and `bda-partials-loader.js` post-cleanup. |
