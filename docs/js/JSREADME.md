# JavaScript Documentation

## File: `scripts.js`

This file contains shared functionality used across all pages of the Detroit Badman Archive. Page-specific scripts (Leaflet map initialization, D3 network visualization) are included inline in their respective HTML files.

All shared functions that touch the DOM must follow the accessibility patterns documented in HTML_TEMPLATES.md. In particular: dynamic content updates must manage focus, interactive elements must be keyboard-operable, and modality identity must never rely on color alone.

**CSS class convention:** Shared functions reference CSS classes rather than hardcoded hex values. This keeps color authority in `styles.css` (where CSS variables and the Color Contrast Reference Table live) rather than scattered across function bodies. See `CSS_DOCUMENTATION.md` for the corresponding class definitions.

---

## Structure Overview

```
scripts.js
├── DOMContentLoaded Event Listener
│   └── Navigation active state highlighting + aria-current
├── loadArchiveData()
│   └── Async JSON data fetcher
├── calculateBadmanScore()
│   └── Score calculator from criteria object
├── formatFigureType()
│   └── Display formatter for figure types
├── getModalityConfig()
│   └── Color, shape, and icon mapping for modalities
├── showFigureDetails()
│   └── Shared detail panel builder with focus management
└── buildSourceLinks()
    └── Accessible source link list builder
```

---

## Detailed Breakdown

### DOM Initialization
```javascript
window.addEventListener('DOMContentLoaded', event => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });

    console.log('Detroit Badman Archive initialized');
});
```

**Purpose:** Runs when the page loads. Highlights the current page in the navigation bar and marks it for screen readers.

**How it works:**
1. `window.location.pathname.split('/').pop()` — Gets the current filename (e.g., `map.html`)
2. `querySelectorAll('.nav-link')` — Selects all navigation links
3. Compares each link's `href` to current page
4. Adds `active` class and `aria-current="page"` to matching link

**Color authority:** The `.active` class applies the gold color via CSS (`styles.css` — see the Navigation section). JavaScript does not set color directly. Previously this function also applied `link.style.color = '#d4af37'` inline; that line has been removed because it duplicates the CSS rule and violates the "no hardcoded hex in JS" convention.

**Accessibility:** `aria-current="page"` tells screen readers which navigation link corresponds to the current page. Without it, a screen reader user has no way to know where they are in the site structure. This is a WCAG 2.4.8 (Location) best practice.

**Modification notes:**
- To change the active link color, edit the `.nav-link.active` rule in `styles.css`, not this function
- Add additional initialization code inside this event listener
- Do not remove the `aria-current` attribute

---

### Data Loading Function
```javascript
async function loadArchiveData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error loading archive data:', error);
        return null;
    }
}
```

**Purpose:** Fetches JSON data files (like `detroit.json`) for use in map and network visualizations.

**How it works:**
1. `fetch(url)` — Makes HTTP request to the JSON file
2. `response.json()` — Parses the response as JSON
3. Returns parsed data or `null` if error occurs

**Usage example:**
```javascript
const data = await loadArchiveData('data/detroit.json');
if (data) {
    // Use data.figures array
    // Use data.edge_types for NVT edge styling
    // Use data.evidence_tiers for NVT tier rendering
}
```

**Modification notes:**
- Add caching logic here if performance becomes an issue
- Add loading indicators by dispatching custom events

---

### Score Calculator
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

**Purpose:** Calculates the total badman score (out of 25) from a figure's individual criteria scores.

**Input:** A `scores` object matching the JSON schema structure:
```javascript
{
    outlaw_relationship: { score: 5, justification: "..." },
    community_authorization: { score: 5, justification: "..." },
    // etc.
}
```

**Output:** Integer from 5 to 25.

**Used by:** Detail panel builder (`showFigureDetails()`), sr-only data tables in map.html and network.html.

**Modification notes:**
- If you add new criteria, add them here
- Consider adding validation to ensure scores are 1-5

---

### Figure Type Formatter
```javascript
function formatFigureType(type, metaBadman = false) {
    if (metaBadman) {
        return 'Meta-Badman';
    }
    return type.charAt(0).toUpperCase() + type.slice(1);
}
```

**Purpose:** Converts the JSON `type` field into display-friendly text.

**Input:**
- `type` — String: `"real"` or `"fictional"`
- `metaBadman` — Boolean: whether figure is a meta-badman (optional, defaults to `false`)

**Output:**
- `"Meta-Badman"` if metaBadman is true
- `"Real"` or `"Fictional"` otherwise

**Usage example:**
```javascript
formatFigureType("real", true)   // Returns "Meta-Badman"
formatFigureType("real", false)  // Returns "Real"
formatFigureType("fictional")    // Returns "Fictional"
```

**Note on Meta-Badman figures in the archive:** At launch, two figures are flagged as meta-badmen: Donald Goines (dormant, Gangsta-Pimp modality not yet active) and Glanton Dowdell (active, Political Revolutionary modality). Meta-badman status applies regardless of whether the figure is currently rendering.

**Modification notes:**
- Add additional type handling if you introduce new figure categories

---

### Modality Configuration
```javascript
function getModalityConfig(modality) {
    const config = {
        'detective': {
            color: '#3388FF',
            markerShape: 'pin',
            networkShape: 'circle',
            icon: 'magnifying-glass',
            label: 'Pin marker — Detective Modality'
        },
        'revolutionary': {
            color: '#DC3545',
            markerShape: 'star',
            networkShape: 'diamond',
            icon: 'raised-fist',
            label: 'Star marker — Revolutionary Modality'
        },
        'superhero_villain': {
            color: '#FD7E14',
            markerShape: 'hexagon',
            networkShape: 'hexagon',
            icon: 'lightning-bolt',
            label: 'Hexagon marker — Superhero-Villain Modality'
        },
        'gangsta_pimp': {
            color: '#6F42C1',
            markerShape: 'square',
            networkShape: 'square',
            icon: 'dollar-sign',
            label: 'Square marker — Gangsta-Pimp Modality'
        },
        'folk_hero_outlaw': {
            color: '#D4AF37',
            markerShape: 'triangle',
            networkShape: 'triangle',
            icon: 'star',
            label: 'Triangle marker — Folk Hero-Outlaw Modality'
        }
    };

    return config[modality] || {
        color: '#6C757D',
        markerShape: 'pin',
        networkShape: 'circle',
        icon: 'default',
        label: 'Unknown Modality'
    };
}
```

**Purpose:** Returns the full visual identity configuration for a given modality. This is the single source of truth for how modalities are represented visually across the archive.

**Why this replaces an older color-only function:** WCAG 1.4.1 (Use of Color) requires that color is never the sole differentiator. An earlier `getModalityColor()` function returned only a color hex value, which meant map markers, network nodes, and legend items had no non-color distinction between modalities. This function returns color, shape, icon, and a text label that describes the marker by shape rather than color.

**Input:** String matching modality ID from JSON (e.g., `"detective"`, `"superhero_villain"`).

**Output:** Object with properties:

| Property | Type | Purpose |
|----------|------|---------|
| `color` | String (hex) | Fill/stroke color for visual rendering |
| `markerShape` | String | Leaflet map marker shape identifier |
| `networkShape` | String | D3 network node shape identifier |
| `icon` | String | Icon identifier for overlay inside markers/nodes |
| `label` | String | Accessible text label describing the marker by shape, not color |

**Configuration table (single source of truth for modality visual identity):**

| Modality | Color | Hex | Map Marker | Network Shape | Icon |
|----------|-------|-----|------------|---------------|------|
| Detective | Blue | `#3388FF` | Pin | Circle | Magnifying glass |
| Revolutionary | Red | `#DC3545` | Star | Diamond | Raised fist |
| Superhero-Villain | Orange | `#FD7E14` | Hexagon | Hexagon | Lightning bolt |
| Gangsta-Pimp | Purple | `#6F42C1` | Square | Square | Dollar sign |
| Folk Hero-Outlaw | Gold | `#D4AF37` | Triangle | Triangle | Star |
| Unknown/Default | Gray | `#6C757D` | Pin | Circle | Default |

**Launch state:** At launch, three modalities render: Detective, Revolutionary, and Superhero-Villain. The Gangsta-Pimp and Folk Hero-Outlaw configurations remain in the function because they are defined and ready for activation — the `activeModalities` array in map.html and network.html controls which modalities actually render. Do not remove these configurations.

**Modification notes:**
- This table must stay in sync with the Modality Visual Identity System table in HTML_TEMPLATES.md and the legend classes in CSS_DOCUMENTATION.md
- When updating any modality's color, shape, or icon, update all three documents simultaneously
- When a new modality goes live, add its string to the `activeModalities` array in map.html and network.html — that controls rendering, this function controls appearance

---

### Shared Detail Panel Builder
```javascript
function showFigureDetails(figure, panelContentId, panelId) {
    var totalScore = calculateBadmanScore(figure.scores);

    var shortDesc = figure.biography.description.substring(0, 200) + '...';
    var fullDesc = figure.biography.description;

    var sourceLinks = buildSourceLinks(figure.sources.primary);

    var html =
        '<h3 class="figure-detail-name">' + figure.name + '</h3>' +
        '<p><em>Modality:</em> ' + figure.modality + '</p>' +
        '<p><em>Type:</em> ' + formatFigureType(figure.type, figure.meta_badman) + '</p>' +
        '<p><em>Years:</em> ' + (figure.years.birth || figure.years.active_start) +
        ' – ' + (figure.years.death || figure.years.active_end || 'present') + '</p>' +
        '<p><em>Badman Score:</em> ' + totalScore + '/25</p>' +
        '<span id="description-text">' + shortDesc + '</span>' +
        '<a href="#" id="read-more-link" class="read-more-toggle"' +
        ' aria-label="Read more about ' + figure.name + '">Read more</a>' +
        '<hr class="panel-divider">' +
        '<p><strong>Sources:</strong></p>' +
        sourceLinks;

    document.getElementById(panelContentId).innerHTML = html;

    // Move focus to panel for keyboard/screen reader users
    var panel = document.getElementById(panelId);
    panel.focus();

    // Read more/less toggle
    var expanded = false;
    document.getElementById('read-more-link').addEventListener('click', function(e) {
        e.preventDefault();
        expanded = !expanded;
        document.getElementById('description-text').innerHTML = expanded ? fullDesc : shortDesc;
        this.innerHTML = expanded ? 'Show less' : 'Read more about ' + figure.name;
        this.setAttribute('aria-label', expanded ?
            'Show less about ' + figure.name :
            'Read more about ' + figure.name);
    });
}
```

**Purpose:** Builds and injects the detail panel content when a figure is selected. This is the single function called by map marker clicks, network node clicks, and sr-only data table row activations.

**Why this is shared:** The detail panel update logic was previously duplicated inline in map.html and network.html. The sr-only data tables (accessibility requirement) add a third interaction path that triggers the same panel update. Extracting it prevents three copies of the same code from drifting out of sync.

**Input:**
- `figure` — The figure object from the JSON data
- `panelContentId` — The ID of the content element inside the panel (e.g., `"info-content"` on the map, `"figure-metrics-content"` on the network)
- `panelId` — The ID of the panel container element (e.g., `"info-panel"`)

**CSS class convention (not hardcoded hex):**

| Element | Class | Defined in |
|---------|-------|------------|
| Figure name heading | `.figure-detail-name` | styles.css |
| "Read more" toggle | `.read-more-toggle` | styles.css |
| Panel divider | `.panel-divider` | styles.css |

Previously this function hardcoded `style="color: #e8e8e8"` on the figure name, `style="color: #50c878"` on the "Read more" link, and `style="border-color: #2a623d"` on the divider. These inline styles have been replaced with CSS classes that reference the appropriate CSS variables in styles.css. This keeps color authority centralized.

**Accessibility features built in:**
- Figure name is rendered as `<h3>` (proper heading hierarchy under the panel's `<h2>`)
- "Read more" link includes `aria-label` with figure name for screen reader context (WCAG 2.4.4)
- `panel.focus()` moves focus to the panel after content update, so keyboard and screen reader users know content has changed
- Source links are built via `buildSourceLinks()` with proper list structure and new-tab warnings
- The "Read more" toggle sits inside the panel's in-prose context, so its underline is applied via the CSS in-prose underline rule (see CSS_DOCUMENTATION.md)

**Modification notes:**
- If the panel layout changes, update the HTML template string here — it is the single source for all three interaction paths
- The panel container must have `tabindex="-1"` in the HTML for `panel.focus()` to work
- The panel container must have `aria-live="polite"` and `aria-atomic="true"` for screen reader announcements
- Never reintroduce hardcoded hex colors; always use CSS classes

---

### Accessible Source Link Builder
```javascript
function buildSourceLinks(sources) {
    if (!sources || sources.length === 0) return '<p>No sources available.</p>';

    var html = '<ul class="list-unstyled source-links">';
    for (var i = 0; i < sources.length; i++) {
        html += '<li class="source-link-item">' +
            '<a href="' + sources[i].url + '" target="_blank" rel="noopener noreferrer">' +
            sources[i].title +
            '<span class="sr-only"> (opens in new tab)</span>' +
            '</a></li>';
    }
    html += '</ul>';
    return html;
}
```

**Purpose:** Builds a properly structured, accessible list of source links for the detail panel.

**Why this exists:** A previous implementation concatenated `<a>` tags separated by `<br>` elements. This fails two accessibility requirements: the links are not in a semantic list structure (WCAG 1.3.1), and links opening in new tabs had no warning (WCAG 3.2.5 best practice).

**Input:** Array of source objects, each with `url` and `title` properties.

**Output:** HTML string containing a `<ul>` with one `<li>` per source.

**CSS class convention:**

| Element | Class | Defined in |
|---------|-------|------------|
| Source list container | `.list-unstyled source-links` | Bootstrap + styles.css |
| Source list item | `.source-link-item` | styles.css |

The source links themselves are unstyled by this function — they inherit their green color from the `color: var(--dba-emerald)` rule in styles.css and their underline from the in-prose link rule (see CSS_DOCUMENTATION.md). Previously this function hardcoded `style="color: #50c878"` on each anchor, which duplicated the CSS rule and bypassed the variable system.

**Accessibility features built in:**
- Semantic `<ul>`/`<li>` list structure (screen readers announce "list of N items")
- `target="_blank"` paired with `rel="noopener noreferrer"` (security + accessibility)
- sr-only "(opens in new tab)" text (screen readers announce the new-tab behavior)
- Source links are in-prose context within the detail panel, so they receive the underline automatically via the in-prose link CSS rule (WCAG 1.4.1 non-color differentiation)

**Modification notes:**
- If source objects gain additional fields (author, date), update the link text here
- Do not remove the sr-only span — it is required for screen reader users
- Do not reintroduce hardcoded hex colors on the anchors

---

## Working With Edge Types and Evidence Tiers

The archive's JSON includes top-level `edge_types` and `evidence_tiers` objects that the Network Visualization Tool reads directly for styling. The shared scripts.js does not currently expose helper functions for these, but page-specific code in network.html uses them.

### Edge Types (at launch)

| Code | Name | Color | Default Dash Pattern |
|------|------|-------|---------------------|
| META | Creator → Creation | `#D4AF37` (Gold) | Solid |
| P2C | Person → Creation | `#DC3545` (Red) | Long dash (12,6) |
| C2C | Creator ↔ Creator | `#50C878` (Green) | Short dash (6,4) |
| ORG | Organizational / Ideological | `#3388FF` (Blue) | Dot-dash (2,4,8,4) |
| CC | Creation Continuity | `#E83E8C` (Pink) | Dotted (2,2) |

**Note on CC:** The CC edge type ("Creation Continuity") captures relationships between fictional characters sharing a universe or continuity (e.g., Static ↔ Hardware in the Milestone universe, Firestorm ↔ Cyborg across DC Detroit settings). This type is new as of the SHV modality integration. If adding future functions that iterate edge types, include CC in the iteration.

### Evidence Tiers (at launch)

| Tier | Label | Line Style | Opacity |
|------|-------|------------|---------|
| 1 | Documented | Solid | 0.9 |
| 2 | Evidenced (unverified) | Dashed | 0.6 |
| 3 | Interpretive | Dotted | 0.35 |

See `NVTREADME.md` for the full edge-type and tier rendering specification.

---

## Adding New Functions

When adding new shared functionality:

1. Add the function after existing functions
2. Include a JSDoc-style comment explaining purpose, parameters, and return value
3. Update this README with the new function's documentation
4. If the function is page-specific, consider adding it inline in that HTML file instead
5. If the function touches the DOM, verify it follows the accessibility patterns in HTML_TEMPLATES.md:
   - Dynamic content updates manage focus
   - Interactive elements are keyboard-operable
   - Color is not the sole differentiator
6. If the function applies styles, use CSS classes — never hardcode hex values in JS. Color authority lives in `styles.css`.

---

## Dependencies

This file has no external dependencies. It uses vanilla JavaScript only.

The map and network pages load their own libraries:
- **map.html** — Leaflet.js 1.9.4
- **network.html** — D3.js v7

---

## Troubleshooting

### Active nav link not highlighting
1. Verify the current page filename matches an `href` value in the nav exactly (case-sensitive)
2. Confirm the `.active` class styling exists in `styles.css` under the Navigation section
3. Check browser console for errors in the DOMContentLoaded listener

### Detail panel doesn't update on marker or node click
1. Verify `showFigureDetails()` is imported/available in the calling page
2. Confirm the panel element IDs passed to `showFigureDetails()` match the IDs in the HTML
3. Check that the panel container has `tabindex="-1"` — required for `panel.focus()` to work
4. Verify `aria-live="polite"` and `aria-atomic="true"` are set on the panel container

### Source links appear as plain text (not clickable)
1. Verify the `sources.primary` array in the JSON has `url` properties populated
2. Check for JavaScript errors in `buildSourceLinks()` — likely a malformed source object
3. Confirm `innerHTML` is being assigned, not `textContent`

### Source links appear without underlines
1. Verify the in-prose link underline rule in `styles.css` includes `.source-link-item a` or the detail panel selector
2. Confirm the detail panel container matches the selector pattern used by the rule
3. Check for inline styles overriding `text-decoration: none`

### Modality configuration returns Unknown
1. Verify the figure's `modality` field exactly matches a key in `getModalityConfig()` (lowercase, underscores: `"superhero_villain"` not `"superhero-villain"`)
2. Check for typos in the JSON — the Unknown fallback returns when a modality string isn't recognized

### Figure name appears as plain text instead of heading
1. Verify `showFigureDetails()` wraps the name in `<h3>` tags, not `<strong>`
2. Confirm the `.figure-detail-name` class is defined in `styles.css`
3. Check heading hierarchy in the surrounding panel — the panel's own heading should be `<h2>` so the figure name `<h3>` is the correct subsequent level
