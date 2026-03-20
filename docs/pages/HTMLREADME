# HTML Templates Documentation

## Overview

The Detroit Badman Archive consists of seven HTML pages sharing a common structure. This document explains the template architecture and how to modify each page.

All pages conform to **WCAG 2.2 Level AA** and the **MSU Digital Accessibility Basic Checklist** (webaccess.msu.edu/basiclist). Accessibility is structural, not decorative — every template pattern in this document includes the required accessible markup. Do not strip ARIA attributes, skip heading levels, or remove sr-only elements when modifying pages.

---

## Accessibility Reference

### Standards

- **WCAG 2.2 Level AA** — Minimum compliance target
- **MSU Digital Accessibility Policy** — webaccess.msu.edu/policy/technical-guidelines
- **MSU Basic Checklist** — webaccess.msu.edu/basiclist

### Testing Tools

Run these on every page before any deployment:

- **Deque Color Contrast Analyzer** — dequeuniversity.com/color-contrast (contrast verification)
- **WAVE Browser Extension** — wave.webaim.org (automated WCAG scanning)
- **axe DevTools** — Chrome extension (code-level WCAG testing)
- **NVDA** — Free screen reader for manual verification on Windows

### Color Contrast Reference

All text/background combinations must meet WCAG AA minimums: 4.5:1 for normal text, 3:1 for large text (18pt+ or 14pt bold+).

| Element | Foreground | Background | Ratio | Status |
|---------|-----------|------------|-------|--------|
| Primary text | #e8e8e8 | #1a472a | Verify | Needs testing |
| Secondary text | #b0b0b0 | #1a472a | Verify | Upgraded from #a0a0a0 |
| Link text | #50c878 | #1a472a | Verify | Needs testing |
| Heading text | #50c878 | #0d1f12 | Verify | Needs testing |
| Footer text | #c8c8c8 | #0d1f12 | Verify | Needs testing |

**Rule:** When adding any new color combination, run it through the Deque analyzer before committing. Document the result in this table.

### Modality Visual Identity System

Color alone cannot differentiate modalities (WCAG 1.4.1). Every modality requires three distinguishable properties: color, marker shape, and icon/symbol.

| Modality | Color | Hex | Map Marker | Network Shape | Icon |
|----------|-------|-----|------------|---------------|------|
| Detective | Blue | #3388ff | Default pin | Circle | Magnifying glass |
| Revolutionary | Red | #dc3545 | Star | Diamond | Raised fist |
| Gangsta-Pimp | Purple | TBD | Square | Square | Dollar sign |
| Superhero-Villain | Orange | TBD | Hexagon | Hexagon | Lightning bolt |
| Folk Hero-Outlaw | Gold | TBD | Triangle | Triangle | Star |

This table is the single source of truth for modality visual identity. When a new modality goes live, define all three properties here before writing any code. The `activeModalities` array in map.html and network.html controls which modalities render — add the modality string to that array when ready.

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
        <!-- Skip navigation link (accessibility) -->
        <a href="#main-content" class="sr-only sr-only-focusable">Skip to main content</a>

        <header>
            <!-- Site heading (desktop only) -->
        </header>
        <nav>
            <!-- Navigation bar -->
        </nav>
        <main id="main-content">
            <section class="page-section">
                <!-- Main content sections -->
            </section>
        </main>
        <footer>
            <!-- Copyright -->
        </footer>
        <!-- JavaScript includes -->
    </body>
</html>
```

### Differences from previous template

1. **Skip-to-content link** — First element inside `<body>`. Uses Bootstrap's `sr-only sr-only-focusable` classes: invisible until focused via keyboard, then appears on screen. Required by WCAG 2.4.1 (Bypass Blocks).
2. **`<main>` landmark** — Wraps all content sections. The `id="main-content"` is the target of the skip link. Screen readers use the `<main>` landmark to jump directly to content.
3. **Landmark structure** — Every page now has: `<header>`, `<nav>`, `<main>`, `<footer>`. Screen readers expose these as navigable regions.

---

## Head Section (All Pages)

```html
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <meta name="description" content="Page-specific description" />
    <meta name="author" content="Harry Foster" />
    <title>Page Title | Detroit Badman Archive</title>
    <link rel="icon" type="image/x-icon" href="assets/favicon.ico" />
    <!-- Google fonts-->
    <link href="https://fonts.googleapis.com/css?family=Raleway:..." rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css?family=Lora:..." rel="stylesheet" />
    <!-- Core theme CSS (includes Bootstrap)-->
    <link href="css/styles.css" rel="stylesheet" />
</head>
```

**To modify:**
- Update `<meta name="description">` for each page (SEO + accessibility — screen readers can surface this)
- Update `<title>` — Format: `Page Name | Detroit Badman Archive` (title is the first thing a screen reader announces)
- **Add page-specific CSS** — Add `<style>` block after the stylesheet link
- **Add page-specific libraries** — Add before `styles.css` (Leaflet for map.html, D3 for network.html)

---

## Header Section

```html
<header>
    <h1 class="site-heading text-center text-faded d-none d-lg-block">
        <span class="site-heading-upper text-primary mb-3">Detroit Badman Archive</span>
        <span class="site-heading-lower">Page Subtitle</span>
    </h1>
</header>
```

**Classes explained:**
- `d-none d-lg-block` — Hidden on mobile, visible on large screens
- `text-faded` — Cream/off-white color from CSS
- `text-primary` — Gold color from CSS

**To modify:**
- Change the subtitle span for each page (e.g., "Geospatial Map", "Network Analysis")

**Accessibility note:** This `<h1>` is the page's top-level heading. There must be exactly one `<h1>` per page. All subsequent headings must follow sequential order — `<h2>` for major sections, `<h3>` for subsections within those. Never skip from `<h1>` to `<h4>` or `<h5>`.

---

## Navigation Section

```html
<nav class="navbar navbar-expand-lg navbar-dark py-lg-4" id="mainNav" aria-label="Main navigation">
    <div class="container">
        <a class="navbar-brand text-uppercase fw-bold d-lg-none" href="index.html">Detroit Badman Archive</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button>
        <div class="collapse navbar-collapse" id="navbarSupportedContent">
            <ul class="navbar-nav mx-auto">
                <li class="nav-item px-lg-4"><a class="nav-link text-uppercase" href="index.html">Home</a></li>
                <li class="nav-item px-lg-4"><a class="nav-link text-uppercase" href="how-to-use.html">How to Use</a></li>
                <li class="nav-item px-lg-4"><a class="nav-link text-uppercase" href="map.html">Map</a></li>
                <li class="nav-item px-lg-4"><a class="nav-link text-uppercase" href="network.html">Network</a></li>
                <li class="nav-item px-lg-4"><a class="nav-link text-uppercase" href="repository.html">Repository</a></li>
                <li class="nav-item px-lg-4"><a class="nav-link text-uppercase" href="about.html">About</a></li>
                <li class="nav-item px-lg-4"><a class="nav-link text-uppercase" href="resources.html">Resources</a></li>
            </ul>
        </div>
    </div>
</nav>
```

**Key elements:**
- `navbar-brand` — Mobile-only site title (visible when nav is collapsed)
- `navbar-toggler` — Hamburger menu button for mobile
- `navbar-nav` — The navigation links
- `aria-label="Main navigation"` — Identifies this nav region for screen readers (required when a page has multiple `<nav>` elements, good practice always)

**To modify:**
- **Adding a page** — Add new `<li>` element matching the pattern
- **Renaming a page** — Update both the `href` and link text
- **IMPORTANT:** Navigation must be identical across all 7 pages. Edit all files when making changes.

**Accessibility notes:**
- Bootstrap handles keyboard navigation (Tab through links, Enter to activate) — do not override this
- The `aria-controls`, `aria-expanded`, and `aria-label` attributes on the toggler button are required for the mobile menu to be accessible — do not remove them

---

## Heading Hierarchy

Every page must follow a sequential heading order. This is the defined hierarchy for the BDA:

```
<h1> — Page title (one per page, in the <header>)
  <h2> — Major sections (Map, Legend, Figure Details, Network, etc.)
    <h3> — Subsections within panels (figure name in detail panel, metric categories)
      <h4> — Sub-subsections if needed (rare)
```

**Rules:**
- Never skip a level (no `<h1>` → `<h4>`)
- Never use heading tags for styling — use CSS classes instead
- The previous template used `<h5>` for panel headers like "Legend" and "Figure Details." These are now `<h2>` elements styled to match
- Dynamically injected content (detail panels) must include proper heading structure — figure names are `<h3>`, not `<strong>`

---

## Content Sections

### Standard Content Block (bg-faded)
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
- `page-section` — Adds vertical margin (5rem top and bottom)
- `col-xl-9 mx-auto` — 75% width on extra-large screens, centered
- `bg-faded` — Green background box (`#1a472a`)
- `rounded` — Rounded corners
- `p-5` — Padding (3rem)

### Call-to-Action Block (cta)
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

The `cta` class adds a different background color to the section, creating visual alternation.

---

## Footer Section

```html
<footer class="footer text-faded text-center py-5">
    <div class="container">
        <p class="m-0 small">Copyright &copy; Detroit Badman Archive 2026</p>
    </div>
</footer>
```

**To modify:**
- Update copyright year
- Add additional footer content (links, contact info)

---

## JavaScript Includes (End of Body)

```html
<!-- Bootstrap core JS-->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
<!-- Core theme JS-->
<script src="js/scripts.js"></script>
```

**To add page-specific JavaScript:**
Add a `<script>` block after `scripts.js`:
```html
<script>
    // Page-specific code here
</script>
```

See map.html and network.html for examples.

---

## Links — Accessibility Requirements

All links on the site must follow these rules (WCAG 2.4.4):

### Descriptive link text
- Every link's text must describe its destination. Never use "click here" or "read more" alone.
- If a generic label is unavoidable, add an `aria-label` with full context: `<a href="#" aria-label="Read more about Ron Scott">Read more</a>`

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
- Source links are built dynamically via innerHTML. The template for each source link:

```javascript
sourceLinks += '<li><a href="' + source.url + '" target="_blank" rel="noopener noreferrer">' +
    source.title +
    '<span class="sr-only"> (opens in new tab)</span>' +
    '</a></li>';
```

- Wrap the full set in `<ul class="list-unstyled">` ... `</ul>` — not `<br>` separators.

---

## Dynamic Content Panels — Accessibility Requirements

Both the map detail panel and network metrics panel update their content when a user clicks a marker or node. These panels require specific ARIA handling.

### Panel container setup
```html
<div class="bg-faded rounded p-4" id="info-panel" tabindex="-1" aria-live="polite" aria-atomic="true">
    <h2 class="text-uppercase mb-3" style="color: #50c878;">Figure Details</h2>
    <p id="info-content" style="color: #c8c8c8;">
        Select a figure from the map or the figures list below to view details.
    </p>
</div>
```

**Required attributes:**
- `tabindex="-1"` — Allows the panel to receive programmatic focus (not tab-focusable, but focusable via JavaScript)
- `aria-live="polite"` — Screen readers announce content changes when the panel updates
- `aria-atomic="true"` — Screen reader re-reads the entire panel, not just the changed portion

**Required behavior (JavaScript):**
After updating innerHTML, move focus to the panel:
```javascript
var panel = document.getElementById('info-panel');
panel.querySelector('#info-content').innerHTML = newContent;
panel.focus();
```

### Dynamic content heading structure
When a figure is selected, the injected HTML must include proper heading structure:

```javascript
document.getElementById('info-content').innerHTML =
    '<h3 style="color: #e8e8e8;">' + figure.name + '</h3>' +
    '<p><em>Modality:</em> ' + figure.modality + '</p>' +
    // ... rest of content
```

The figure name is an `<h3>` (subsection of the `<h2>` panel heading), not `<strong>`.

### Default panel text
Default instructions must not assume visual interaction:
- **Map panel:** "Select a figure from the map or the figures list below to view details."
- **Network panel:** "Select a figure from the network graph or the figures list below to view metrics."

The previous text ("Click a marker on the map to view details") assumed the user could see and click a visual element. The updated text provides a non-visual path (WCAG 1.3.3).

---

## Screen-Reader Data Tables

Both map.html and network.html must include a visually hidden data table that provides the same information as the visualization in a screen-reader-accessible format (WCAG 1.1.1).

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
Build the table rows inside the same `fetch('data/detroit.json')` callback that builds the map markers or network nodes:

```javascript
var tableBody = document.getElementById('sr-figures-table-body');
data.figures.forEach(function(figure) {
    if (!activeModalities.includes(figure.modality)) return;
    var row = document.createElement('tr');
    row.innerHTML =
        '<th scope="row">' + figure.name + '</th>' +
        '<td>' + figure.modality + '</td>' +
        '<td>' + figure.type + '</td>' +
        '<td>' + figure.geographic.primary_location.name + '</td>' +
        '<td>' + (figure.scores.outlaw_relationship.score +
                   figure.scores.community_authorization.score +
                   figure.scores.violence_as_language.score +
                   figure.scores.cultural_preservation.score +
                   figure.scores.hypermasculine_performance.score) + '/25</td>';
    tableBody.appendChild(row);
});
```

### Making table rows interactive
Each row should be clickable/keyboard-selectable to trigger the same detail panel update as clicking a marker:

```javascript
row.setAttribute('tabindex', '0');
row.setAttribute('role', 'button');
row.setAttribute('aria-label', 'View details for ' + figure.name);
row.addEventListener('click', function() { showFigureDetails(figure); });
row.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showFigureDetails(figure);
    }
});
```

This provides the alternative interaction path required by WCAG 1.3.3 (Sensory Characteristics).

---

## Page-Specific Documentation

### index.html (Home Page)

**Unique structure:** Uses the `intro` class for the hero section with overlapping image and text box.

```html
<section class="page-section clearfix">
    <div class="container">
        <div class="intro">
            <img class="intro-img img-fluid mb-3 mb-lg-0 rounded" src="..." alt="Descriptive alt text for the image" />
            <div class="intro-text left-0 text-center bg-faded p-5 rounded">
                <!-- Content overlapping the image -->
            </div>
        </div>
    </div>
</section>
```

**To modify:**
- Update the image `src` path
- **Always provide descriptive alt text** on the `<img>`. If the image is decorative, use `alt=""` (empty string, not omitted)

**Heading hierarchy:**
```
<h1> Detroit Badman Archive / Home (in header)
  <h2> Section headings within content blocks
```

---

### map.html

**Additional head elements:**
```html
<!-- Leaflet CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" ... />
```

**Page-specific styles (in `<style>` block):**
- `#map-container` — Map dimensions and border
- `.map-legend` — Legend box styling
- `.legend-marker` — Modality indicators in legend (shape + color, not color alone)

**Map container — accessibility attributes:**
```html
<div id="map-container" role="img" aria-label="Interactive map showing locations of Detroit badman figures across the city">
    <!-- Leaflet map initialized here -->
</div>
```

- `role="img"` — Tells screen readers this is a graphical element
- `aria-label` — Provides a text description of what the visualization shows

**Legend structure:**
```html
<div class="map-legend mb-4">
    <h2 class="text-uppercase mb-3" style="color: #50c878; font-size: 1.1rem;">Legend</h2>
    <ul class="list-unstyled">
        <li class="legend-item">
            <span class="legend-marker legend-detective" aria-hidden="true"></span>
            <span style="color: #e8e8e8;">Pin marker — Detective Modality</span>
        </li>
        <li class="legend-item">
            <span class="legend-marker legend-revolutionary" aria-hidden="true"></span>
            <span style="color: #e8e8e8;">Star marker — Revolutionary Modality</span>
        </li>
    </ul>
</div>
```

**Changes from previous template:**
- `<h5>` → `<h2>` (correct heading level, styled smaller with CSS)
- `<div>` legend items → `<ul>` / `<li>` (semantic list structure)
- Legend text describes marker **shape**, not color ("Pin marker" not "Blue marker")
- `aria-hidden="true"` on the colored indicator spans (decorative — the text label carries the information)

**Marker alt text:**
```javascript
var marker = L.marker([lat, lng], {
    icon: icon,
    alt: figure.name + ' — ' + figure.modality + ' modality'
});
```

Leaflet's default alt text is just "Marker." Override it with the figure's name and modality.

**Detail panel:** See [Dynamic Content Panels](#dynamic-content-panels--accessibility-requirements) above.

**SR data table:** See [Screen-Reader Data Tables](#screen-reader-data-tables) above.

**JavaScript includes:**
```html
<!-- Leaflet JS -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" ...></script>
```

**Map initialization:**
```javascript
var map = L.map('map-container').setView([42.3314, -83.0458], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {...}).addTo(map);
```

**To modify:**
- `[42.3314, -83.0458]` — Default center coordinates (Detroit)
- `12` — Default zoom level (higher = more zoomed in)
- Tile layer URL — Change to use different map tiles

---

### network.html

**Page-specific styles:**
- `#network-container` — Visualization container
- `#timeline-container` — Timeline slider wrapper
- `.legend-line` — Colored lines in relationship legend (must include dash pattern, not color alone)

**Network container — accessibility attributes:**
```html
<div id="network-container">
    <!-- D3 SVG will be appended here -->
</div>
```

After the SVG is created in JavaScript, inject accessible elements:
```javascript
const svg = d3.select('#network-container')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('role', 'img')
    .attr('aria-label', 'Network visualization of Detroit badman figure relationships');

// Add title and desc as first children
svg.append('title').text('Network visualization of Detroit badman figure relationships');
svg.append('desc').text('Force-directed graph showing connections between badman figures. Nodes represent figures sized by influence. Edges represent documented relationships typed as META, P2C, C2C, or ORG.');
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
    .attr('aria-label', function(d) { return d.name + ', ' + d.modality + ' modality'; })
    // ... existing attributes ...
    .on('keydown', function(event, d) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            // Trigger the same click handler
            node.dispatch('click', { detail: d });
        }
    });
```

**Reduced motion support:**
```javascript
// Respect OS-level reduced motion preference
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Run one tick to establish positions, then stop
    for (var i = 0; i < 300; i++) simulation.tick();
    simulation.stop();
} else {
    // Normal animated simulation
}
```

**Pause/Resume button:**
```html
<button id="pause-animation" class="btn btn-sm" style="background-color: #2a623d; color: #e8e8e8; border: 1px solid #50c878;">
    Pause Animation
</button>
```

```javascript
var paused = false;
document.getElementById('pause-animation').addEventListener('click', function() {
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
Same pattern as map legend — `<ul>`/`<li>`, `<h2>` heading level, descriptions reference shape/dash pattern not color alone.

**Edge type visual differentiation:**
Edge types must be distinguishable without color. Define a dash pattern per type:

| Edge Type | Color | Dash Pattern |
|-----------|-------|-------------|
| META | Gold (#d4af37) | Solid (no dash) |
| P2C | Red (#dc3545) | Long dash (12,6) |
| C2C | Green (#50c878) | Short dash (6,4) |
| ORG | Blue (#3388ff) | Dot-dash (2,4,8,4) |

Note: Evidence tier dash patterns (documented/evidenced/interpretive) are a separate layer on top of edge type patterns. The two systems must be visually distinguishable from each other.

**Timeline slider:**
```html
<label for="timeline-slider" class="sr-only">Timeline year selector</label>
<input type="range" id="timeline-slider" min="1930" max="2020" value="2020" step="5" aria-valuemin="1930" aria-valuemax="2020" aria-valuenow="2020" aria-label="Select year to filter network by time period">
<span id="timeline-year" aria-live="polite">2020</span>
```

- The `<label>` with `sr-only` is invisible but gives the slider a name for screen readers
- `aria-live="polite"` on the year display announces the current year as the slider moves

**To modify:**
- `min="1930"` — Earliest year in timeline
- `max="2020"` — Latest year in timeline
- `step="5"` — Year increments

**Detail panel, SR data table:** See shared sections above.

---

### repository.html

**Key section:** The submission button (currently placeholder)

```html
<a class="btn btn-primary btn-xl" href="#" target="_blank" rel="noopener noreferrer">
    Submit a Badman
    <span class="sr-only">(opens in new tab)</span>
</a>
```

**To modify:**
- Replace `href="#"` with actual Google Form URL
- Remove the "Google Form link coming soon" note

**Future accessibility note:** When the full Repository submission form is built (not the Google Form placeholder), it must meet WCAG form accessibility requirements: visible labels for all inputs, error identification, required field indicators, and keyboard operability. MSU's full Technical Guidelines go deeper on forms than the Basic Checklist covers.

**Heading hierarchy:**
```
<h1> Detroit Badman Archive / Community Repository (in header)
  <h2> Section headings (What Is the Repository, How to Submit, etc.)
```

---

### resources.html

**Bibliography structure:**
```html
<h2 style="color: #50c878;">Theoretical</h2>
<p>Author. <em>Title</em>. Publisher, Year.</p>

<h2 style="color: #50c878;">Detective Modality</h2>
<!-- Sources for this modality -->
```

**Change from previous template:** Section headings are `<h2>` (not `<h4>`), maintaining the heading hierarchy under the page-level `<h1>`.

**To add new sources:**
1. Find the correct section (Theoretical, Detective, Revolutionary, etc.)
2. Add new `<p>` element with citation in Chicago format
3. Maintain alphabetical order within each section

---

### about.html

**Sections:**
1. Project Background — General archive description
2. Methodology — Five modalities + five criteria
3. About the Creator — Bio
4. Acknowledgments — CHI + community partners

**Heading hierarchy:**
```
<h1> Detroit Badman Archive / About (in header)
  <h2> Project Background
  <h2> Methodology
    <h3> The Five Modalities
    <h3> The Five Criteria
  <h2> About the Creator
  <h2> Acknowledgments
```

---

### how-to-use.html

**Sections:**
1. Getting Started — Overview
2. Using the Map — Markers, colors, polygons, navigation
3. Using the Network — Nodes, edges, timeline, interaction
4. Reading Profiles — Designation, scores, sources

**To modify:**
- Update instructions when visualizations change
- Add screenshots/GIFs when available — **always include alt text on images**
- Instructions must describe interactions without relying on visual references alone. Say "select a figure" not "click the blue marker"

**Heading hierarchy:**
```
<h1> Detroit Badman Archive / How to Use (in header)
  <h2> Getting Started
  <h2> Using the Map
  <h2> Using the Network
  <h2> Reading Profiles
```

---

## Adding a New Page

1. Copy an existing page (e.g., `about.html`)
2. Update `<title>` and `<meta description>`
3. Update header subtitle
4. Verify the skip-to-content link targets `#main-content`
5. Verify the `<main id="main-content">` wrapper is present
6. Establish correct heading hierarchy (`<h1>` for the page, `<h2>` for sections)
7. Replace content sections
8. Add navigation link to ALL existing pages
9. Add navigation link to the new page
10. Run WAVE and axe on the new page before deploying

---

## Accessibility Checklist for Every Page Edit

Before committing changes to any page, verify:

- [ ] One `<h1>` per page, headings in sequential order (no skipped levels)
- [ ] Skip-to-content link present and targets `#main-content`
- [ ] `<main id="main-content">` wraps content sections
- [ ] All images have descriptive `alt` text (or `alt=""` if decorative)
- [ ] All links have descriptive text (no "click here" without context)
- [ ] All `target="_blank"` links include sr-only "(opens in new tab)" text and `rel="noopener noreferrer"`
- [ ] Color is not the sole differentiator for any information
- [ ] Any new text/background color combinations have been tested for contrast (4.5:1 minimum)
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
| `sr-only` | Visually hidden, screen-reader accessible |
| `sr-only sr-only-focusable` | Hidden until focused (for skip links) |
| `list-unstyled` | Removes default list styling |
