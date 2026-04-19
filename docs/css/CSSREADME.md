# CSS Documentation

## File: `styles.css`

Site-wide stylesheet for the Detroit Badman Archive. Contains **only** custom styles; Bootstrap 5 is loaded via CDN in each page's `<head>`, not bundled here.

This document describes the **intended state** of `styles.css` — the destination the file is being updated to match. Where current code diverges (hardcoded `#e83e8c`, missing `.bda-*` class definitions, incomplete network legend classes), the file gets brought in line with this spec during the CSS cleanup pass.

---

## Important: Bootstrap CDN Required

Each HTML file must include Bootstrap CSS before `styles.css`:

```html
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link href="/css/styles.css" rel="stylesheet">
```

And Bootstrap JS before the closing `</body>`:

```html
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
```

---

## Standards

- **WCAG 2.2 Level AA** — minimum compliance target
- **MSU Digital Accessibility Policy** — webaccess.msu.edu/policy/technical-guidelines
- **MSU Basic Checklist** — webaccess.msu.edu/basiclist

All text/background combinations in this file must meet WCAG AA contrast minimums: 4.5:1 for normal text, 3:1 for large text (18pt+ or 14pt bold) and UI components. Every new color combination added to the stylesheet must be verified via the WebAIM Contrast Checker (webaim.org/resources/contrastchecker) before committing, and the result must be added to the Color Contrast Reference Table below.

---

## Core Rules

1. **No hardcoded hex values outside `:root`.** Every color used anywhere in the stylesheet must resolve to a CSS variable defined in `:root`. No exceptions — if a color appears in a rule, it needs a variable.

2. **No inline `style="..."` attributes in HTML.** All visual properties come from classes defined in this file. The only exception is CSS custom property declarations used as runtime values (e.g., `style="--criterion-value: 5;"` for the figure page's score bars). Those are *values*, not style overrides.

3. **Shape, not color, is the identity carrier.** Modality identity, edge type identity, evidence tier identity, and access level identity all use shape + color + text. Color is a reinforcing signal, never the sole signal (WCAG 1.4.1).

4. **Every class this document names must exist in `styles.css`.** This is the source of truth for the class vocabulary. When a new class is added to a page, JS file, or partial, it must be documented here and defined in the stylesheet simultaneously.

---

## File Structure

```
styles.css
├── CSS Variables (:root)
├── Base Styles (body, headings)
├── Accessibility Utilities
│   ├── .sr-only / .visually-hidden
│   ├── Focus styles
│   └── Reduced motion
├── In-Prose Link Underlines
├── Partial Placeholder Min-Heights (FOUC mitigation)
├── Site Chrome
│   ├── Header
│   ├── Navigation
│   ├── Footer
├── Page Sections & Content Boxes
├── Section Headings
├── Buttons
├── Intro Section (home page)
├── Detail Panel Classes
├── Legend Styles
│   ├── Map legend (shape markers)
│   ├── Network legend (shape nodes)
│   └── Edge type legend (dash patterns)
├── Figures Landing (.bda-figures-*)
├── Sources Landing (.bda-sources-* / .bda-source-card-* / .bda-filter-*)
├── Source Page (.bda-source-viewer-* / metadata rail / citation)
├── Figure Page (.bda-figure-*)
├── Credentialing Rail
└── Utility Classes
```

---

## CSS Variables (`:root`)

All colors are defined as variables at the top of the file. Editing a variable updates every use globally.

### Core palette

```css
:root {
    /* Primary Greens — the archive's dominant visual field */
    --dba-darkest-green: #0a1f12;
    --dba-dark-green: #0d2818;
    --dba-medium-green: #143d26;
    --dba-content-green: #1a472a;
    --dba-border-green: #2a623d;
    --dba-emerald: #50c878;
    --dba-network-bg: #0a1a0f;

    /* Kobe Tribute — Purple & Gold accent system */
    --dba-purple: #552583;
    --dba-gold: #d4af37;

    /* Text Colors */
    --dba-text-primary: #e8e8e8;
    --dba-text-secondary: #c8c8c8;
    --dba-text-muted: #b0b0b0;
    --dba-white: #ffffff;

    /* Modality Colors */
    --dba-detective: #3388ff;
    --dba-revolutionary: #dc3545;
    --dba-shv: #fd7e14;
    --dba-gangsta-pimp: #6f42c1;
    --dba-folk-hero: #d4af37;

    /* Edge Type Colors (decoupled from modality variables) */
    --dba-edge-meta: #d4af37;
    --dba-edge-p2c: #dc3545;
    --dba-edge-c2c: #50c878;
    --dba-edge-org: #3388ff;
    --dba-edge-cc: #e83e8c;

    /* Focus */
    --dba-focus-ring: #d4af37;
}
```

### Why edge variables are decoupled

Previously, edge type rules referenced modality variables (`--dba-revolutionary`, `--dba-detective`) and core palette variables (`--dba-gold`, `--dba-emerald`) for their colors. This was accidental coupling — a modality color change would also change an unrelated edge color.

The five `--dba-edge-*` variables decouple edges from the other layers. They happen to use the same initial hex values as their predecessors, but future changes to modality or palette colors no longer propagate to edges.

**Rule:** Legend classes, arrowhead markers, and anything else coloring an edge references `--dba-edge-*`, never `--dba-revolutionary` or `--dba-gold` directly.

### `--dba-network-bg`

`#0a1a0f` — intentionally darker than `--dba-darkest-green` (`#0a1f12`) — is used only as the background for the D3 network visualization SVG in `network.html`. Darker background increases contrast with node colors for readability. Do not use this variable outside the network visualization.

### `--dba-text-muted` — known migration requirement

`--dba-text-muted` resolves to `#b0b0b0`, which provides a verified 4.89:1 contrast against `--dba-content-green` — just above the WCAG AA threshold for normal text.

A prior value of `#a0a0a0` (approximately 3.9:1 on the same background) fails AA. The migration of `#a0a0a0` references to `--dba-text-muted` is a **launch-blocker requirement**. At launch, no hardcoded `#a0a0a0` values may exist anywhere in the codebase. Current known instances are tracked in the Inline Style Cleanup table below.

---

## Color Contrast Reference Table

All text/background combinations must meet WCAG AA minimums. Contrast ratios verified via WebAIM Contrast Checker in April 2026.

| Element | Foreground | Background | Ratio | AA | Status |
|---------|-----------|------------|-------|----|----|
| Primary text | `--dba-text-primary` | `--dba-content-green` | 8.66:1 | Pass | ✅ |
| Secondary text | `--dba-text-secondary` | `--dba-content-green` | 6.34:1 | Pass | ✅ |
| Muted text | `--dba-text-muted` | `--dba-content-green` | 4.89:1 | Pass | ✅ |
| Link text (in-prose) | `--dba-emerald` | `--dba-dark-green` | 7.4:1 | Pass | ✅ |
| Link vs. adjacent primary text | `--dba-emerald` | `--dba-text-primary` | 1.73:1 | Fail | ✅ via underline* |
| Heading accent | `--dba-emerald` | `--dba-dark-green` | 7.4:1 | Pass | ✅ |
| Nav hover / active | `--dba-gold` | `--dba-darkest-green` | 8.2:1 | Pass | ✅ |
| Footer text | `--dba-text-primary` | `--dba-darkest-green` | 14.07:1 | Pass | ✅ |
| Focus ring | `--dba-focus-ring` | `--dba-content-green` | 5.04:1 | Pass | ✅ |
| Button text | `--dba-white` | `--dba-purple` | 10.61:1 | Pass | ✅ |

*\* **Link vs. adjacent primary text:** The emerald link color fails adjacent-text contrast against `--dba-text-primary` in isolation (1.73:1). This is mitigated by applying `text-decoration: underline` to all in-prose links, satisfying WCAG 1.4.1 via non-color differentiation. See the "In-Prose Link Underlines" section. Do not remove underlines in body-text contexts.*

**Rule:** When adding any new color combination, run it through the WebAIM Contrast Checker before committing. Add the result to this table with the status icon.

---

## Modality Visual Identity

Color alone does not differentiate modalities (WCAG 1.4.1). Every modality has three distinguishable properties: color, marker shape, and icon.

| Modality | Color | Variable | Hex | Map Marker | Network Shape | Icon |
|----------|-------|----------|-----|------------|---------------|------|
| Detective | Blue | `--dba-detective` | `#3388ff` | Circle | Circle | Magnifying glass |
| Revolutionary | Red | `--dba-revolutionary` | `#dc3545` | Star | Diamond | Raised fist |
| Superhero-Villain | Orange | `--dba-shv` | `#fd7e14` | Hexagon | Hexagon | Lightning bolt |
| Gangsta-Pimp | Purple | `--dba-gangsta-pimp` | `#6f42c1` | Square | Square | Dollar sign |
| Folk Hero-Outlaw | Gold | `--dba-folk-hero` | `#d4af37` | Triangle | Triangle | Star |

At launch, three modalities render (Detective, Revolutionary, Superhero-Villain). Gangsta-Pimp and Folk Hero-Outlaw are defined in all visual systems but filtered out via the `activeModalities` array pending activation.

This table is synchronized with:
- `getModalityConfig()` in `scripts.js`
- Modality Reference in `DATAREADME.md`
- Modality Visual Identity System in `HTML_TEMPLATES.md`

Revolutionary uses a star on the map and a diamond in the network. D3 force-directed graphs render cleaner with diamond nodes than star polygons at small sizes. All other modalities share the same shape across map and network.

---

## Edge Type Visual Identity

Five edge types, each with a color variable and a dash pattern. The dash pattern is the non-color differentiator (WCAG 1.4.1). Color reinforces; shape carries.

| Edge Type | Variable | Hex | Dash Pattern |
|-----------|----------|-----|--------------|
| META (Creator → Creation) | `--dba-edge-meta` | `#d4af37` | Solid |
| P2C (Person → Creation) | `--dba-edge-p2c` | `#dc3545` | Long dash (12,6) |
| C2C (Creator ↔ Creator) | `--dba-edge-c2c` | `#50c878` | Short dash (6,4) |
| ORG (Organizational / Ideological) | `--dba-edge-org` | `#3388ff` | Dot-dash (2+4+8+4) |
| CC (Creation Continuity) | `--dba-edge-cc` | `#e83e8c` | Dotted (2,2) |

**Note on evidence tiers:** Evidence tier rendering (documented / evidenced / interpretive) uses its own dash patterns in the actual SVG network edges, driven by `data.evidence_tiers[tier].line_style`. The edge type dash patterns in this CSS apply only to **legend markers** — the flat indicators in legends and inline edge-type callouts. The network graph SVG edges themselves use edge color + evidence tier dash, not edge type dash. This separation is documented in `NVTREADME.md`.

---

## Evidence Tier Visual Identity

Three tiers with dash patterns, opacity, and badge color. Used by network SVG edges and tier badges on source/figure pages.

| Tier | Label | Line Style | Opacity | Badge Color |
|------|-------|------------|---------|-------------|
| 1 | Documented | Solid | 0.9 | `--dba-emerald` |
| 2 | Evidenced (unverified) | Dashed (8,4) | 0.6 | `--dba-gold` |
| 3 | Interpretive | Dotted (2,4) | 0.35 | `--dba-text-muted` |

Badge colors must have 4.5:1 contrast when used as text on `--dba-content-green`. All three pass.

---

## Access Level Badge Identity

Four access levels with badge styling for the source page metadata rail:

| Access Level | Class | Display |
|--------------|-------|---------|
| `public` | *(no badge — default state)* | No visual element |
| `restricted` | `.bda-access-badge-restricted` | Amber/gold badge — "Restricted" |
| `embargoed` | `.bda-access-badge-embargoed` | Red badge — "Embargoed" |
| `consent_required` | `.bda-access-badge-consent` | Purple badge — "Consent required" |

At launch, every source is `public`. The other three classes are defined in CSS so post-IRB interview integration does not require a stylesheet change.

---

## Base Styles

```css
body {
    background-color: var(--dba-dark-green) !important;
    color: var(--dba-text-primary) !important;
    background-image: none !important;
}
```

Sets the dark green page background. Removes any background images that might be introduced by Bootstrap or inherited from the theme template.

Heading styles inherit from Bootstrap defaults with custom section-heading overrides documented below.

---

## Accessibility Utilities

### Screen-reader-only content

Bootstrap 5 renamed `.sr-only` to `.visually-hidden`. The BDA codebase uses both. Both are defined here for compatibility.

```css
.sr-only,
.visually-hidden {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
}

.sr-only-focusable:focus,
.visually-hidden-focusable:focus {
    position: static !important;
    width: auto !important;
    height: auto !important;
    padding: 0.5rem 1rem !important;
    margin: 0 !important;
    overflow: visible !important;
    clip: auto !important;
    white-space: normal !important;
    background-color: var(--dba-gold) !important;
    color: var(--dba-darkest-green) !important;
    z-index: 9999;
    font-weight: bold;
}
```

**Used by:** skip-to-content links, "(opens in new tab)" text on external links, data-table alternatives for visualizations, sr-only table body rows, hidden labels for search inputs where placeholder is not accessible name.

### Focus styles

```css
*:focus-visible {
    outline: 3px solid var(--dba-focus-ring) !important;
    outline-offset: 2px !important;
}

a:focus-visible {
    outline: 3px solid var(--dba-focus-ring) !important;
    outline-offset: 2px !important;
    text-decoration: underline !important;
}
```

**Why `:focus-visible` not `:focus`:** The ring appears only for keyboard navigation, not mouse clicks. This is the modern best practice — keyboard users see the ring, mouse users don't.

**Why this exists:** WCAG 2.4.7 (Focus Visible) requires a visible focus indicator. The default browser ring is nearly invisible on dark green backgrounds. Gold ring against dark green is verified 5.04:1 on content backgrounds and 8.2:1 on the darkest-green nav background.

**Rule:** Do not remove these styles and do not override with `outline: none` without providing an equivalent focus indicator.

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
    }
}
```

**Why this exists:** WCAG 2.3.3 and the `prefers-reduced-motion` OS preference. Users with motion sensitivity see no CSS animations or transitions. The D3 network simulation handles motion separately in JavaScript (see `NVTREADME.md`); this CSS rule handles hover transitions, nav toggles, dropdown animations, and any other CSS-driven motion.

---

## In-Prose Link Underlines

```css
.essay a,
p a,
.bio-overview a,
.data-section a,
.cited-in-desc a,
.bda-figure-biography a,
.bda-source-notes a,
.bda-connection-evidence a,
.source-link-item a {
    text-decoration: underline;
    text-underline-offset: 2px;
}
```

**Why this exists:** Emerald link color against primary text color measures 1.73:1, below the WCAG 1.4.11 non-text contrast threshold. Without an underline, a color-blind user reading body prose cannot distinguish a green word from regular text.

The underline is the non-color cue that satisfies WCAG 1.4.1 (Use of Color). Industry-standard pattern used by NYT, JSTOR, Wikipedia, and academic journals.

**Contexts that get underlines:**
- Essay paragraphs
- Biography body text
- Source notes
- Connection evidence descriptions
- Cited-in description contexts
- Source link items in detail panels

**Contexts that do NOT get underlines** (signaled by structure, not color):
- Navigation links
- Buttons
- "Read more" toggles — signaled as controls
- Heading accent text (`.section-heading-upper`) — not a link
- Card links — signaled as cards via layout

**Rule:** When a new in-prose context is introduced, add its selector to this rule. Do not remove the underline globally — it is a WCAG compliance requirement.

---

## Partial Placeholder Min-Heights (FOUC Mitigation)

The partial loader injects navbar, footer, and credentialing rail content asynchronously. Without min-heights on the placeholders, page content reflows when partials arrive — jarring for users, especially keyboard users whose scroll position can jump.

```css
#bda-navbar {
    min-height: 84px;  /* Match rendered navbar height at lg breakpoint */
}

#bda-footer {
    min-height: 72px;
}

#bda-credentialing-rail {
    min-height: 400px;  /* Desktop only; see mobile rules below */
}

@media (max-width: 991px) {
    #bda-credentialing-rail {
        min-height: 120px;  /* Mobile: smaller because rail collapses */
    }
}
```

**Rule:** If a partial's content changes height materially, update the corresponding min-height here. These values are documented so that future template changes don't inadvertently reintroduce FOUC reflow.

---

## Site Chrome

### Header (home page and legacy pages)

```css
.site-heading { /* ... */ }
.site-heading-upper {
    color: var(--dba-gold);
    /* ... */
}
.site-heading-lower {
    color: var(--dba-text-primary);
    /* ... */
}
```

Used on the home page's large desktop header. Hidden on mobile (`d-none d-lg-block` via Bootstrap).

### Navigation

Applies to the navbar partial injected by `bda-partials-loader.js`:

```css
#mainNav { /* ... */ }

.nav-link {
    color: var(--dba-text-primary);
    /* ... */
}

.nav-link:hover {
    color: var(--dba-gold);
}

.nav-link.active {
    color: var(--dba-gold);
    font-weight: bold;  /* Non-color signal per WCAG 1.4.1 */
}
```

**Accessibility rule:** The `.active` class provides the visual active-state signal; `aria-current="page"` (set by `markCurrentNavItem()` in `bda-partials-loader.js`) provides the programmatic signal. Both are required.

The `font-weight: bold` on `.nav-link.active` is the non-color signal — without it, color vision differences could obscure which nav item is current.

### Footer

```css
.footer {
    background-color: var(--dba-darkest-green) !important;
    color: var(--dba-text-primary);
}
```

Matches the nav background for visual consistency. The `#bda-footer-year` span inside is populated by JS and inherits from the footer's color rules.

---

## Page Sections & Content Boxes

```css
.page-section {
    padding: 5rem 0;
}

.page-section.cta {
    background-color: var(--dba-medium-green);
}

.bg-faded {
    background-color: var(--dba-content-green);
}

.cta-inner {
    background-color: var(--dba-content-green);
    position: relative;
}

.cta-inner::before {
    /* Purple accent border effect */
    border: 2px solid var(--dba-purple);
    /* ... */
}
```

Alternating `page-section` and `page-section.cta` creates visual rhythm on long pages.

---

## Section Headings

```css
.section-heading { /* ... */ }

.section-heading-upper {
    color: var(--dba-emerald);
    /* Smaller text above the main heading */
}

.section-heading-lower {
    color: var(--dba-text-primary);
    /* Large main heading text */
}
```

The emerald color on `.section-heading-upper` measures 7.4:1 against content-green — WCAG AAA.

---

## Buttons

```css
.btn-primary {
    background-color: transparent;
    color: var(--dba-text-primary);
    border: 2px solid var(--dba-purple);
}

.btn-primary:hover {
    background-color: var(--dba-purple);
    color: var(--dba-white);
    border-color: var(--dba-gold);
}

.btn-xl {
    /* Extra large variant */
}
```

Button text color on fill (`--dba-white` on `--dba-purple`) measures 10.61:1 — WCAG AAA.

Focus state inherits from the global `*:focus-visible` rule — gold ring at 5.04:1 on any background.

---

## Intro Section (Home Page)

```css
.intro { /* ... */ }
.intro-img { /* ... */ }
.intro-text { /* Overlapping text box */ }
.intro-button { /* ... */ }

@media (min-width: 992px) {
    /* Desktop: text box overlaps image */
}

@media (max-width: 991px) {
    /* Mobile: stacked vertically */
}
```

---

## Detail Panel Classes

Used by `showFigureDetails()` and `buildSourceLinks()` in `scripts.js` for the shared detail panel on the map and network pages.

```css
.figure-detail-name {
    color: var(--dba-text-primary);
    font-size: 1.5rem;
    font-weight: 600;
    margin-top: 0;
    margin-bottom: 1rem;
}

.read-more-toggle {
    color: var(--dba-emerald);
    display: block;
    margin-top: 0.5rem;
    cursor: pointer;
    /* In-prose context — inherits underline from the in-prose link rule */
}

.read-more-toggle:hover,
.read-more-toggle:focus {
    color: var(--dba-gold);
}

.panel-divider {
    border: 0;
    border-top: 1px solid var(--dba-border-green);
    margin: 1rem 0;
}

.source-links {
    margin-top: 0.5rem;
    margin-bottom: 0;
}

.source-link-item {
    margin-bottom: 0.3rem;
}

.source-link-item a {
    color: var(--dba-emerald);
    /* In-prose — gets underline from the in-prose link rule */
}

.source-link-item a:hover,
.source-link-item a:focus {
    color: var(--dba-gold);
}

.source-links-empty {
    color: var(--dba-text-muted);
    font-style: italic;
    margin: 0.5rem 0;
}
```

**Rule:** `showFigureDetails()` and `buildSourceLinks()` must emit these classes and nothing else for color/typography. No inline `style="color: ..."` attributes in the JS-emitted HTML.

---

## Legend Styles

### Container

```css
.map-legend,
.network-legend {
    background-color: var(--dba-content-green);
    padding: 1rem;
    border-radius: 0.5rem;
    border: 2px solid var(--dba-border-green);
}

.legend-item {
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
}
```

### Map legend markers (shape + color)

All five modalities defined. At launch, only three render (the others are filtered out of the legend HTML by the page, not by CSS).

```css
.legend-marker {
    width: 20px;
    height: 20px;
    margin-right: 10px;
    display: inline-block;
}

.legend-detective {
    background-color: var(--dba-detective);
    border-radius: 50%;  /* Circle */
}

.legend-revolutionary {
    background-color: var(--dba-revolutionary);
    clip-path: polygon(
        50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%,
        50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%
    );  /* Star */
}

.legend-superhero-villain {
    background-color: var(--dba-shv);
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);  /* Hexagon */
}

.legend-gangsta-pimp {
    background-color: var(--dba-gangsta-pimp);
    border-radius: 2px;  /* Square */
}

.legend-folk-hero {
    background-color: var(--dba-folk-hero);
    clip-path: polygon(50% 0%, 0% 100%, 100% 100%);  /* Triangle */
}
```

### Network legend markers (shape + color — network-specific shapes)

All five modalities defined, not just the three that render at launch. Scaffolded so dormant modality activation requires no CSS changes.

```css
.legend-node-detective {
    background-color: var(--dba-detective);
    border-radius: 50%;  /* Circle */
}

.legend-node-revolutionary {
    background-color: var(--dba-revolutionary);
    clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);  /* Diamond */
}

.legend-node-shv {
    background-color: var(--dba-shv);
    clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);  /* Hexagon */
}

.legend-node-gangsta-pimp {
    background-color: var(--dba-gangsta-pimp);
    border-radius: 2px;  /* Square */
}

.legend-node-folk-hero {
    background-color: var(--dba-folk-hero);
    clip-path: polygon(50% 0%, 0% 100%, 100% 100%);  /* Triangle */
}
```

### Shape reference (map vs. network)

| Modality | Map Legend | Network Legend |
|----------|-----------|----------------|
| Detective | Circle | Circle |
| Revolutionary | Star | Diamond |
| Superhero-Villain | Hexagon | Hexagon |
| Gangsta-Pimp | Square | Square |
| Folk Hero-Outlaw | Triangle | Triangle |

Only Revolutionary differs between map and network (star vs. diamond) — D3 force-directed graphs render cleaner with diamond polygons at small sizes.

### Edge type legend (dash patterns)

```css
.legend-line {
    width: 30px;
    height: 3px;
    margin-right: 10px;
}

.legend-meta {
    background-color: var(--dba-edge-meta);
}

.legend-p2c {
    background-color: transparent;
    background-image: repeating-linear-gradient(
        90deg,
        var(--dba-edge-p2c) 0px,
        var(--dba-edge-p2c) 12px,
        transparent 12px,
        transparent 18px
    );
}

.legend-c2c {
    background-color: transparent;
    background-image: repeating-linear-gradient(
        90deg,
        var(--dba-edge-c2c) 0px,
        var(--dba-edge-c2c) 6px,
        transparent 6px,
        transparent 10px
    );
}

.legend-org {
    background-color: transparent;
    background-image: repeating-linear-gradient(
        90deg,
        var(--dba-edge-org) 0px,
        var(--dba-edge-org) 2px,
        transparent 2px,
        transparent 6px,
        var(--dba-edge-org) 6px,
        var(--dba-edge-org) 14px,
        transparent 14px,
        transparent 18px
    );
}

.legend-cc {
    background-color: transparent;
    background-image: repeating-linear-gradient(
        90deg,
        var(--dba-edge-cc) 0px,
        var(--dba-edge-cc) 2px,
        transparent 2px,
        transparent 4px
    );
}
```

**Pattern sync rule:** These dash patterns must match the `edgeDashPatterns` object in `network.html`'s inline script. When a dash pattern changes, both must update simultaneously.

---

## Sources & Figures Landing — Shared Filter Rail

The sources landing (`bda-sources.js`) and figures landing (`bda-figures.js`) share a filter rail vocabulary. These classes are defined once and used by both.

### Filter option rows

```css
.bda-filter-option {
    display: flex;
    align-items: center;
    padding: 0.4rem 0.5rem;
    cursor: pointer;
    border-radius: 4px;
}

.bda-filter-option:hover {
    background-color: var(--dba-medium-green);
}

.bda-filter-option input[type="checkbox"] {
    margin-right: 0.5rem;
    /* Native checkbox, inherits browser styling */
}

.bda-filter-option.is-disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.bda-filter-option.is-disabled:hover {
    background-color: transparent;
}
```

### Modality shape markers (used in filter rail, cited-in headings, figure cards)

All five modalities, matching the map legend shapes:

```css
.bda-filter-modality-marker {
    display: inline-block;
    width: 14px;
    height: 14px;
    margin-right: 0.5rem;
    vertical-align: middle;
}

.bda-mm-detective {
    background-color: var(--dba-detective);
    border-radius: 50%;
}

.bda-mm-revolutionary {
    background-color: var(--dba-revolutionary);
    clip-path: polygon(
        50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%,
        50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%
    );
}

.bda-mm-superhero-villain {
    background-color: var(--dba-shv);
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
}

.bda-mm-gangsta-pimp {
    background-color: var(--dba-gangsta-pimp);
    border-radius: 2px;
}

.bda-mm-folk-hero-outlaw {
    background-color: var(--dba-folk-hero);
    clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
}

.bda-filter-modality-marker.is-pending {
    opacity: 0.5;
}
```

### Pending tag / count badges

```css
.bda-filter-pending-tag {
    color: var(--dba-text-muted);
    font-size: 0.85em;
    margin-left: 0.25em;
}
```

### Filter collapse buttons

```css
.bda-filter-collapse-btn {
    display: block;
    width: 100%;
    text-align: left;
    background: transparent;
    border: none;
    color: var(--dba-text-primary);
    padding: 0.5rem 0;
    cursor: pointer;
}

.bda-filter-collapse-btn[aria-expanded="true"]::after {
    content: "▾";
}

.bda-filter-collapse-btn[aria-expanded="false"]::after {
    content: "▸";
}
```

### Active filter chips

```css
.bda-filter-chip {
    display: inline-flex;
    align-items: center;
    background-color: var(--dba-medium-green);
    color: var(--dba-text-primary);
    padding: 0.3rem 0.6rem;
    border-radius: 1rem;
    margin: 0.2rem;
    font-size: 0.9em;
}

.bda-filter-chip-label {
    color: var(--dba-text-secondary);
    margin-right: 0.25rem;
}

.bda-filter-chip-remove {
    background: transparent;
    border: none;
    color: var(--dba-text-primary);
    margin-left: 0.5rem;
    font-size: 1.2em;
    line-height: 1;
    cursor: pointer;
    padding: 0 0.25rem;
}

.bda-filter-chip-remove:hover,
.bda-filter-chip-remove:focus {
    color: var(--dba-gold);
}
```

---

## Sources Landing

### Page layout

```css
.bda-sources-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
}

.bda-sources-loading {
    color: var(--dba-text-muted);
    text-align: center;
    padding: 2rem;
}

.bda-sources-loading[role="alert"] {
    color: var(--dba-revolutionary);
}
```

### Source cards (used on sources landing, source page related, figure page primary sources)

```css
.bda-source-card {
    display: flex;
    flex-direction: column;
    background-color: var(--dba-content-green);
    border: 2px solid var(--dba-border-green);
    border-radius: 0.5rem;
    overflow: hidden;
    text-decoration: none;
    color: var(--dba-text-primary);
    transition: border-color 0.2s, transform 0.2s;
}

.bda-source-card:hover {
    border-color: var(--dba-emerald);
    transform: translateY(-2px);
}

.bda-source-card:focus-visible {
    /* Inherits global focus ring */
}

.bda-source-card-thumb {
    position: relative;
    background-color: var(--dba-darkest-green);
    padding: 2rem 1rem;
    text-align: center;
}

.bda-source-card-category {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    padding: 0.2rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75em;
    font-weight: bold;
    text-transform: uppercase;
}

.bda-cat-primary {
    background-color: var(--dba-emerald);
    color: var(--dba-darkest-green);
}

.bda-cat-secondary {
    background-color: var(--dba-gold);
    color: var(--dba-darkest-green);
}

.bda-cat-archival {
    background-color: var(--dba-purple);
    color: var(--dba-white);
}

.bda-source-card-external {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    /* Similar styling */
}

.bda-source-thumb-glyph {
    font-size: 3rem;
    color: var(--dba-emerald);
}

.bda-thumb-book::before { content: "📖"; }
.bda-thumb-doc::before { content: "📄"; }
.bda-thumb-news::before { content: "📰"; }
.bda-thumb-photo::before { content: "🖼"; }
.bda-thumb-audio::before { content: "🎧"; }
.bda-thumb-film::before { content: "🎞"; }

.bda-source-card-info {
    padding: 1rem;
}

.bda-source-card-title {
    font-size: 1.1rem;
    font-weight: bold;
    color: var(--dba-text-primary);
    margin: 0 0 0.5rem 0;
}

.bda-source-card-figure {
    font-size: 0.9em;
    color: var(--dba-emerald);
    margin: 0 0 0.25rem 0;
}

.bda-source-card-meta {
    font-size: 0.85em;
    color: var(--dba-text-muted);
    margin: 0;
}
```

### Empty state

```css
.bda-figures-empty,
.bda-sources-empty {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--dba-text-secondary);
}
```

---

## Source Page

### Header

```css
.bda-source-header {
    margin-bottom: 2rem;
}

.bda-source-title {
    color: var(--dba-text-primary);
    font-size: 2rem;
}

.bda-source-header-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
}

.bda-source-type,
.bda-source-year {
    color: var(--dba-text-secondary);
}

.bda-source-permalink-btn {
    background-color: transparent;
    border: 1px solid var(--dba-border-green);
    color: var(--dba-text-primary);
    padding: 0.25rem 0.75rem;
    border-radius: 0.25rem;
}
```

### Layout (viewer + metadata rail)

```css
.bda-source-layout {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
    margin-bottom: 3rem;
}

@media (max-width: 991px) {
    .bda-source-layout {
        grid-template-columns: 1fr;
    }
}
```

### Viewer variants

```css
.bda-source-viewer {
    background-color: var(--dba-content-green);
    border: 2px solid var(--dba-border-green);
    border-radius: 0.5rem;
    padding: 2rem;
}

.bda-source-viewer-text { /* Layout for external-link sources */ }
.bda-source-viewer-image { /* Figure with image */ }
.bda-source-viewer-image img {
    max-width: 100%;
    height: auto;
}

.bda-source-viewer-audio { /* Audio player wrapper */ }
.bda-source-viewer-multi { /* Tab UI for multi-asset — reserved */ }

.bda-source-view-external {
    /* Uses .btn-primary via markup */
}

.bda-source-access-notice {
    background-color: var(--dba-medium-green);
    border-left: 4px solid var(--dba-gold);
    padding: 1.5rem;
    border-radius: 0.5rem;
}
```

### Metadata rail

```css
.bda-source-metadata-rail {
    background-color: var(--dba-content-green);
    border: 2px solid var(--dba-border-green);
    border-radius: 0.5rem;
    padding: 1.5rem;
}

.bda-source-metadata-list {
    margin: 0;
}

.bda-source-metadata-list dt {
    font-weight: bold;
    color: var(--dba-emerald);
    margin-top: 0.75rem;
    font-size: 0.85em;
    text-transform: uppercase;
}

.bda-source-metadata-list dd {
    margin-left: 0;
    color: var(--dba-text-primary);
}

.bda-source-permalink-text {
    font-family: monospace;
    font-size: 0.85em;
    color: var(--dba-text-muted);
    word-break: break-all;
}

.bda-source-permalink-copy {
    /* Compact copy button */
}

.bda-source-notes {
    background-color: var(--dba-medium-green);
    padding: 1rem;
    border-radius: 0.25rem;
    margin-top: 1rem;
}
```

### Access level badges

```css
.bda-access-badge-restricted {
    background-color: var(--dba-gold);
    color: var(--dba-darkest-green);
    /* "Restricted" label */
}

.bda-access-badge-embargoed {
    background-color: var(--dba-revolutionary);
    color: var(--dba-white);
}

.bda-access-badge-consent {
    background-color: var(--dba-purple);
    color: var(--dba-white);
}
```

All three meet WCAG AA contrast on their backgrounds — verified at commit time via WebAIM Contrast Checker.

### Cited in (modality-grouped)

```css
.bda-source-cited-in {
    margin: 3rem 0;
}

.bda-cited-in-modality-group {
    margin-bottom: 1.5rem;
}

.bda-cited-in-modality-heading {
    display: flex;
    align-items: center;
    color: var(--dba-text-primary);
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
}

.bda-cited-in-list {
    list-style: none;
    padding-left: 1.5rem;  /* Visual indent from modality heading */
}

.bda-cited-in-list li {
    margin: 0.25rem 0;
}

.bda-cited-in-empty {
    color: var(--dba-text-muted);
    font-style: italic;
}
```

### Related sources

```css
.bda-source-related-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1rem;
    list-style: none;
    padding: 0;
}

.bda-source-related-empty {
    color: var(--dba-text-muted);
    font-style: italic;
}
```

### Citation block

```css
.bda-citation-block {
    background-color: var(--dba-medium-green);
    border-radius: 0.5rem;
    padding: 1.5rem;
}

.bda-citation-format-group {
    border: none;
    padding: 0;
    margin-bottom: 1rem;
}

.bda-citation-format-group legend {
    font-weight: bold;
    color: var(--dba-emerald);
    margin-bottom: 0.5rem;
}

.bda-citation-format-group label {
    margin-right: 1rem;
}

.bda-citation-text {
    background-color: var(--dba-darkest-green);
    padding: 1rem;
    border-radius: 0.25rem;
    font-family: Georgia, serif;
    line-height: 1.6;
    color: var(--dba-text-primary);
    margin-bottom: 1rem;
}

.bda-citation-copy-btn {
    /* Uses .btn-primary */
}
```

### Interview panel (reserved)

```css
.bda-source-interview-panel {
    background-color: var(--dba-medium-green);
    border-left: 4px solid var(--dba-purple);
    padding: 1.5rem;
    border-radius: 0.5rem;
    margin-top: 2rem;
}
```

---

## Figures Landing

### Grid layouts

```css
.bda-figures-grid {
    margin-bottom: 3rem;
}

.bda-figures-grouped .bda-figure-modality-group {
    margin-bottom: 3rem;
}

.bda-figure-modality-heading {
    display: flex;
    align-items: center;
    color: var(--dba-text-primary);
    border-bottom: 2px solid var(--dba-border-green);
    padding-bottom: 0.5rem;
    margin-bottom: 1rem;
}

.bda-figure-modality-count {
    color: var(--dba-text-muted);
    font-size: 0.9em;
    margin-left: 0.5rem;
}

.bda-figure-card-list {
    list-style: none;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
}

.bda-figures-flat .bda-figure-card-list {
    /* Same grid; no modality grouping visually */
}
```

### Figure cards

```css
.bda-figure-card {
    display: flex;
    flex-direction: column;
    background-color: var(--dba-content-green);
    border: 2px solid var(--dba-border-green);
    border-radius: 0.5rem;
    overflow: hidden;
    text-decoration: none;
    color: var(--dba-text-primary);
    transition: border-color 0.2s, transform 0.2s;
}

.bda-figure-card:hover {
    border-color: var(--dba-emerald);
    transform: translateY(-2px);
}

.bda-figure-card-thumb {
    position: relative;
    background-color: var(--dba-darkest-green);
    padding: 2rem 1rem 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
}

.bda-figure-card-type-badge {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    padding: 0.2rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75em;
    font-weight: bold;
    text-transform: uppercase;
}

.bda-type-real {
    background-color: var(--dba-detective);
    color: var(--dba-white);
}

.bda-type-fictional {
    background-color: var(--dba-purple);
    color: var(--dba-white);
}

.bda-figure-card-meta-badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background-color: var(--dba-gold);
    color: var(--dba-darkest-green);
    padding: 0.2rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75em;
    font-weight: bold;
}

.bda-figure-card-info {
    padding: 1rem;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.bda-figure-card-title {
    font-size: 1.1rem;
    color: var(--dba-text-primary);
    margin: 0 0 0.25rem 0;
}

.bda-figure-card-era {
    font-size: 0.9em;
    color: var(--dba-text-muted);
    margin: 0 0 0.5rem 0;
}

.bda-figure-card-descriptor {
    font-size: 0.9em;
    color: var(--dba-text-secondary);
    flex: 1;
    margin: 0 0 0.5rem 0;
}

.bda-figure-card-score {
    color: var(--dba-emerald);
    font-weight: bold;
    margin: 0;
}

.bda-score-value {
    font-size: 1.2em;
}

.bda-score-total {
    color: var(--dba-text-muted);
    font-weight: normal;
}
```

### Loading state

```css
.bda-figures-loading {
    color: var(--dba-text-muted);
    text-align: center;
    padding: 2rem;
}

.bda-figures-loading[role="alert"] {
    color: var(--dba-revolutionary);
}
```

---

## Figure Page

### Layout (content + credentialing rail)

```css
.bda-figure-layout {
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: 2rem;
}

@media (max-width: 991px) {
    .bda-figure-layout {
        grid-template-columns: 1fr;
    }

    /* Mobile: credentialing rail appears ABOVE main content */
    .bda-figure-layout {
        display: flex;
        flex-direction: column;
    }

    #bda-credentialing-rail {
        order: -1;
    }
}
```

### Header

```css
.bda-figure-header {
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 2px solid var(--dba-border-green);
}

.bda-figure-header-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
}

.bda-figure-modality-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.3rem 0.75rem;
    background-color: var(--dba-medium-green);
    border-radius: 1rem;
    font-size: 0.9em;
}

.bda-figure-type-badge {
    /* Reuses .bda-type-real / .bda-type-fictional */
}

.bda-figure-meta-badge {
    /* Reuses card meta-badge styling */
}

.bda-figure-name {
    font-size: 2.5rem;
    color: var(--dba-text-primary);
    margin: 0.5rem 0;
}

.bda-figure-era {
    color: var(--dba-text-muted);
    font-size: 1.1em;
}

.bda-figure-score {
    color: var(--dba-emerald);
    font-size: 1.2em;
    font-weight: bold;
}

.bda-figure-creator {
    color: var(--dba-text-secondary);
    font-style: italic;
}

.bda-figure-not-found {
    text-align: center;
    padding: 4rem 1rem;
}
```

### Justification

```css
.bda-figure-justification {
    max-width: 640px;
    margin: 0 auto 3rem;
    font-family: Georgia, serif;
    line-height: 1.8;
}

.bda-figure-justification-placeholder {
    color: var(--dba-text-muted);
    font-style: italic;
}
```

### Biography

```css
.bda-figure-biography {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
    margin-bottom: 3rem;
}

@media (max-width: 768px) {
    .bda-figure-biography {
        grid-template-columns: 1fr;
    }
}

.bda-figure-biography-description { /* Left column */ }
.bda-figure-biography-timeline {
    background-color: var(--dba-medium-green);
    padding: 1.5rem;
    border-radius: 0.5rem;
}

.bda-figure-timeline-list {
    list-style: none;
    padding-left: 0;
    margin: 0;
}

.bda-figure-timeline-event {
    display: flex;
    margin-bottom: 1rem;
    padding-left: 0;
}

.bda-figure-timeline-year {
    font-weight: bold;
    color: var(--dba-emerald);
    min-width: 4rem;
    flex-shrink: 0;
}

.bda-figure-timeline-content {
    flex: 1;
}

.bda-figure-timeline-location {
    font-size: 0.85em;
    color: var(--dba-text-muted);
    font-style: italic;
    margin: 0.25rem 0 0 0;
}

.bda-figure-biography-adaptations,
.bda-figure-biography-credits {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--dba-border-green);
}
```

### Criteria (five-criteria evaluation)

```css
.bda-figure-criteria {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    margin-bottom: 3rem;
}

.bda-figure-criterion {
    background-color: var(--dba-content-green);
    padding: 1.5rem;
    border-radius: 0.5rem;
    border: 1px solid var(--dba-border-green);
}

.bda-figure-criterion dt {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
}

.bda-criterion-name {
    color: var(--dba-text-primary);
    font-weight: bold;
    font-size: 1.1rem;
}

.bda-criterion-score {
    color: var(--dba-emerald);
    font-size: 1.2em;
    font-weight: bold;
}

.bda-criterion-bar {
    width: 100%;
    height: 8px;
    background-color: var(--dba-darkest-green);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.75rem;
}

.bda-criterion-bar-fill {
    height: 100%;
    background-color: var(--dba-emerald);
    /* Width driven by --criterion-value CSS custom property */
    width: calc(var(--criterion-value, 0) * 20%);
    transition: width 0.3s;
}

.bda-criterion-details summary {
    cursor: pointer;
    color: var(--dba-emerald);
    font-size: 0.9em;
}

.bda-criterion-details[open] summary {
    margin-bottom: 0.5rem;
}

.bda-figure-criterion-total {
    background-color: var(--dba-medium-green);
    font-size: 1.3em;
}

.bda-figure-criteria-review-notice {
    background-color: var(--dba-medium-green);
    border-left: 4px solid var(--dba-gold);
    padding: 1rem 1.5rem;
    margin-bottom: 1.5rem;
}
```

### Connections

```css
.bda-figure-connections {
    margin-bottom: 3rem;
}

.bda-connection-group {
    margin-bottom: 2rem;
}

.bda-connection-group-heading {
    display: flex;
    align-items: center;
    color: var(--dba-text-primary);
    font-size: 1.15rem;
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--dba-border-green);
}

.bda-connection-group-count {
    color: var(--dba-text-muted);
    font-size: 0.9em;
    margin-left: 0.5rem;
}

.bda-edge-legend-marker {
    display: inline-block;
    width: 16px;
    height: 4px;
    margin-right: 0.5rem;
    vertical-align: middle;
}

.bda-edge-meta { background-color: var(--dba-edge-meta); }
.bda-edge-p2c {
    background-color: transparent;
    background-image: repeating-linear-gradient(
        90deg,
        var(--dba-edge-p2c) 0, var(--dba-edge-p2c) 6px,
        transparent 6px, transparent 10px
    );
}
.bda-edge-c2c {
    background-color: transparent;
    background-image: repeating-linear-gradient(
        90deg,
        var(--dba-edge-c2c) 0, var(--dba-edge-c2c) 4px,
        transparent 4px, transparent 7px
    );
}
.bda-edge-org {
    background-color: transparent;
    background-image: repeating-linear-gradient(
        90deg,
        var(--dba-edge-org) 0, var(--dba-edge-org) 1px,
        transparent 1px, transparent 3px,
        var(--dba-edge-org) 3px, var(--dba-edge-org) 7px,
        transparent 7px, transparent 9px
    );
}
.bda-edge-cc {
    background-color: transparent;
    background-image: repeating-linear-gradient(
        90deg,
        var(--dba-edge-cc) 0, var(--dba-edge-cc) 1px,
        transparent 1px, transparent 2px
    );
}

.bda-connection-list {
    list-style: none;
    padding: 0;
}

.bda-connection-item {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0.75rem;
    align-items: start;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    background-color: var(--dba-content-green);
    border-radius: 0.25rem;
}

.bda-connection-direction {
    font-size: 1.3em;
    color: var(--dba-text-muted);
}

.bda-connection-name {
    color: var(--dba-emerald);
    font-weight: bold;
    /* In-prose context — gets underline */
}

.bda-connection-name-missing {
    color: var(--dba-text-muted);
    font-style: italic;
}

.bda-connection-dangling {
    opacity: 0.6;
    border-left: 3px solid var(--dba-revolutionary);
}

.bda-connection-tier {
    padding: 0.2rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.8em;
    font-weight: bold;
}

.bda-tier-1 {
    background-color: var(--dba-emerald);
    color: var(--dba-darkest-green);
}

.bda-tier-2 {
    background-color: var(--dba-gold);
    color: var(--dba-darkest-green);
}

.bda-tier-3 {
    background-color: var(--dba-text-muted);
    color: var(--dba-darkest-green);
}

.bda-connection-evidence {
    grid-column: 2 / -1;
    color: var(--dba-text-secondary);
    font-size: 0.9em;
    margin: 0;
}
```

### Geography

```css
.bda-figure-geography {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
    margin-bottom: 3rem;
}

@media (max-width: 991px) {
    .bda-figure-geography {
        grid-template-columns: 1fr;
    }
}

#bda-figure-map-preview {
    min-height: 400px;
    border-radius: 0.5rem;
    border: 2px solid var(--dba-border-green);
}

.bda-figure-geography-meta {
    background-color: var(--dba-content-green);
    padding: 1.5rem;
    border-radius: 0.5rem;
    border: 1px solid var(--dba-border-green);
}

.bda-figure-geography-additional ul {
    list-style: none;
    padding-left: 0;
}

.bda-figure-geography-additional li {
    margin-bottom: 0.75rem;
    padding-left: 1rem;
    border-left: 3px solid var(--dba-emerald);
}

.bda-figure-geography-view-full {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--dba-border-green);
}
```

### Primary sources & related figures on figure page

Reuses `.bda-source-card` styling. Adds:

```css
.bda-figure-primary-sources {
    margin-bottom: 3rem;
}

.bda-figure-primary-sources-empty {
    color: var(--dba-text-muted);
    font-style: italic;
    text-align: center;
    padding: 2rem;
}

.bda-figure-all-sources-link {
    text-align: center;
    margin-top: 1.5rem;
}

.bda-figure-related-grid {
    list-style: none;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
}

.bda-figure-related-card {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background-color: var(--dba-content-green);
    border: 1px solid var(--dba-border-green);
    border-radius: 0.25rem;
    text-decoration: none;
    color: var(--dba-text-primary);
}

.bda-figure-related-card:hover {
    border-color: var(--dba-emerald);
}

.bda-figure-related-card-name {
    flex: 1;
    font-size: 0.95em;
}

.bda-figure-related-card-score {
    color: var(--dba-emerald);
    font-weight: bold;
    font-size: 0.9em;
}

.bda-figure-related-empty {
    color: var(--dba-text-muted);
    font-style: italic;
}
```

---

## Credentialing Rail

The rail is injected by `bda-partials-loader.js` into `#bda-credentialing-rail`. These styles apply to the rail content.

### Desktop: sticky side rail

```css
#bda-credentialing-rail {
    position: sticky;
    top: 2rem;
    align-self: start;
}

.bda-cred-rail-inner {
    background-color: var(--dba-content-green);
    padding: 1.5rem;
    border-radius: 0.5rem;
    border: 1px solid var(--dba-border-green);
}

.bda-cred-author {
    margin-bottom: 1.5rem;
}

.bda-cred-toc-heading {
    color: var(--dba-emerald);
    font-size: 1rem;
    text-transform: uppercase;
    margin-bottom: 0.75rem;
    letter-spacing: 0.05em;
}

.bda-cred-toc ul {
    list-style: none;
    padding-left: 0;
    margin: 0;
}

.bda-cred-toc a {
    display: block;
    padding: 0.35rem 0.5rem;
    color: var(--dba-text-secondary);
    text-decoration: none;
    border-left: 3px solid transparent;
    font-size: 0.9em;
}

.bda-cred-toc a:hover {
    color: var(--dba-text-primary);
    border-left-color: var(--dba-border-green);
}

.bda-cred-toc a.is-active,
.bda-cred-toc a[aria-current="true"] {
    color: var(--dba-emerald);
    border-left-color: var(--dba-emerald);
    font-weight: bold;
}
```

### Mobile: collapsible TOC via `<details>`

The TOC partial includes a native `<details>` wrapper. On desktop, the `<summary>` is hidden and `<details>` is always-open. On mobile, `<summary>` is visible and collapsibility works natively.

```css
.bda-cred-toc-details {
    /* No custom styling on desktop — behaves as always-open */
}

.bda-cred-toc-summary {
    display: none;  /* Hidden on desktop */
}

@media (max-width: 991px) {
    /* Mobile: rail is not sticky, appears above content */
    #bda-credentialing-rail {
        position: static;
        top: auto;
    }

    .bda-cred-toc-summary {
        display: block;
        cursor: pointer;
        padding: 0.5rem 0;
        color: var(--dba-emerald);
        font-weight: bold;
    }

    .bda-cred-toc-summary::marker {
        /* Hide default disclosure triangle for cleaner look */
        display: none;
    }

    .bda-cred-toc-summary::after {
        content: "▾";
        float: right;
    }

    .bda-cred-toc-details:not([open]) .bda-cred-toc-summary::after {
        content: "▸";
    }
}
```

**Accessibility:** The native `<details>`/`<summary>` provides keyboard operation (Enter/Space to toggle) and screen reader announcement for free. No ARIA augmentation.

---

## Utility Classes

```css
.border-purple { border: 2px solid var(--dba-purple); }
.text-gold { color: var(--dba-gold); }
.text-purple { color: var(--dba-purple); }
.text-emerald { color: var(--dba-emerald); }
```

Usage:

```html
<h3 class="text-gold">Gold Heading</h3>
<div class="bg-faded border-purple p-4">Purple-bordered box</div>
```

---

## Inline Style Cleanup (Launch-Blocker)

The following inline styles must be migrated from HTML/JS to CSS variables before launch. Each is tracked here to prevent reintroduction.

| Location | Current | Must Become |
|----------|---------|-------------|
| `scripts.js` `showFigureDetails()` — any remaining inline `style` attributes | `style="color: var(--dba-...);..."` | `.figure-detail-name` / `.read-more-toggle` / `.panel-divider` classes |
| `scripts.js` `buildSourceLinks()` — any remaining inline `style` attributes | `style="color: var(--dba-emerald);"` | `.source-links` / `.source-link-item` classes |
| `scripts.js` DOMContentLoaded nav block | `link.style.color = '#d4af37';` | Delete the whole block — partial loader owns nav active state |
| `network.html` inline `#figure-metrics-content` | `color: #a0a0a0;` | `color: var(--dba-text-muted);` |
| Any `#a0a0a0` anywhere in the codebase | `#a0a0a0` | `var(--dba-text-muted)` |

**Critical row:** `#a0a0a0` on `--dba-content-green` yields approximately 3.9:1 — fails AA for normal text. This is a compliance issue, not a style preference. Must be resolved before launch.

---

## How to Add a New Style

1. **Check if a variable covers the color you need.** If yes, use it via `var(--dba-...)`. If no, add a variable to `:root` first.
2. **Add a comment header** naming the section the rule belongs to.
3. **Verify contrast** via WebAIM Contrast Checker for any new text/background combination. Add the result to the Color Contrast Reference Table.
4. **Use `!important` sparingly** — only when overriding Bootstrap. Do not use `!important` to beat other custom rules; refactor instead.
5. **Check focus states.** If the element is interactive, verify the global `*:focus-visible` gold ring is visible against its background.
6. **Check in-prose contexts.** If links inside this element should be underlined, add the selector to the in-prose link underlines rule.
7. **Check `prefers-reduced-motion`.** If the rule animates, verify the global reduced-motion rule catches it, or add explicit handling.
8. **Document the class here** in the appropriate section. Class definitions in `styles.css` must be mirrored in this document.

---

## Accessibility Checklist for CSS Changes

Before committing any change to `styles.css`:

- [ ] No hardcoded hex values added outside `:root`
- [ ] Any new color combination verified at WCAG AA contrast minimums
- [ ] Any interactive element's focus state visible and ≥3:1 against its background
- [ ] Any animation respects `prefers-reduced-motion`
- [ ] Any color-carrying identity (modality, edge type, tier, access level) has a non-color signal alongside it
- [ ] Any `!important` usage justified by Bootstrap override, not custom-rule conflict
- [ ] Class inventory in this document updated to match new classes in the stylesheet
- [ ] Inline-style cleanup table updated if any known migration was completed
- [ ] New classes have been tested against keyboard navigation (Tab, Enter, Space)
- [ ] If the change affects layout, tested at both desktop and mobile breakpoints

---

## Troubleshooting

### Styles not applying

1. Verify Bootstrap CSS loads BEFORE `styles.css` in the page `<head>`
2. Hard refresh to clear the browser CSS cache (Ctrl+Shift+R)
3. Check for typos in variable names (`var(--dba-detecitve)` vs. `var(--dba-detective)`)

### Colors not matching documented values

1. Inspect the element in DevTools and check which rule is winning
2. Check for inline `style="..."` attributes overriding the class — see Inline Style Cleanup table
3. Confirm the `:root` variable declaration at the top of the stylesheet hasn't been inadvertently modified

### Focus ring not visible

1. Verify `--dba-focus-ring` is defined in `:root`
2. Check that the element isn't overriding with `outline: none`
3. Test with Tab key (mouse clicks don't trigger `:focus-visible` by design)
4. For Safari: verify `-webkit-` prefixed alternatives aren't masking the outline

### Underlines appearing where they shouldn't

1. The in-prose link underline rule targets specific selectors. Check if the new context's parent matches one of them accidentally.
2. Exclude with `:not()` rather than removing underlines from the main rule.

### Underlines missing where they should appear

1. The new in-prose context's selector is not in the underline rule. Add it.
2. A descendant rule with `text-decoration: none` is overriding. Find and remove it.

### Mobile layout breaks

1. Check `@media` queries — Bootstrap breakpoints are sm(576), md(768), lg(992), xl(1200)
2. Test with browser DevTools responsive mode
3. Verify the credentialing rail `order: -1` rule is still active on mobile for figure pages

### Legend shapes wrong or missing

1. Verify the `clip-path` polygon coordinates haven't been corrupted
2. Check the modality's variable resolves to the expected color
3. Confirm `.is-pending` class applies `opacity: 0.5` correctly for dormant modalities

### Criterion bars fill wrong width

1. Verify the `--criterion-value` custom property is set on each `.bda-criterion-bar-fill` inline via `style="--criterion-value: N;"`
2. Confirm the CSS calculation `calc(var(--criterion-value, 0) * 20%)` handles edge cases (score 0, score > 5)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 3.0 | April 2026 | Full rewrite documenting the intended state post-cleanup. Added five `--dba-edge-*` variables decoupling edges from modality and palette variables. Scaffolded all five network node legend classes (not just three). Documented `.bda-*` vocabulary for sources landing, figures landing, source page, figure page, credentialing rail. Added partial placeholder min-heights section, mobile credentialing rail collapsible TOC pattern. Locked `--dba-text-muted` at `#b0b0b0`. Documented `#a0a0a0` migration as launch-blocker. |
| 2.x | Earlier 2026 | Detail panel classes, in-prose link underlines, modality shape markers, edge type dash patterns. |
| 1.0 | Project inception | Initial dark-green theme with Kobe tribute (purple/gold) accent system. |
