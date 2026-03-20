# JavaScript Documentation

## File: `scripts.js`

This file contains shared functionality used across all pages of the Detroit Badman Archive. Page-specific scripts (Leaflet map initialization, D3 network visualization) are included inline in their respective HTML files.

All shared functions that touch the DOM must follow the accessibility patterns documented in HTML_TEMPLATES.md. In particular: dynamic content updates must manage focus, interactive elements must be keyboard-operable, and modality identity must never rely on color alone.

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
            link.style.color = '#d4af37';
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
4. Adds `active` class, gold color (`#d4af37`), and `aria-current="page"` to matching link

**Accessibility:** `aria-current="page"` tells screen readers which navigation link corresponds to the current page. Without it, a screen reader user has no way to know where they are in the site structure. This is a WCAG 2.4.8 (Location) best practice.

**Modification notes:**
- Change `#d4af37` to update the active link color
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

**Output:** Integer from 5-25

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

**Modification notes:**
- Add additional type handling if you introduce new figure categories

---

### Modality Configuration
```javascript
function getModalityConfig(modality) {
    const config = {
        'detective': {
            color: '#3388ff',
            markerShape: 'pin',
            networkShape: 'circle',
            icon: 'magnifying-glass',
            label: 'Pin marker — Detective Modality'
        },
        'revolutionary': {
            color: '#dc3545',
            markerShape: 'star',
            networkShape: 'diamond',
            icon: 'raised-fist',
            label: 'Star marker — Revolutionary Modality'
        },
        'folk_hero_outlaw': {
            color: '#d4af37',
            markerShape: 'triangle',
            networkShape: 'triangle',
            icon: 'star',
            label: 'Triangle marker — Folk Hero-Outlaw Modality'
        },
        'gangsta_pimp': {
            color: '#6f42c1',
            markerShape: 'square',
            networkShape: 'square',
            icon: 'dollar-sign',
            label: 'Square marker — Gangsta-Pimp Modality'
        },
        'superhero_villain': {
            color: '#20c997',
            markerShape: 'hexagon',
            networkShape: 'hexagon',
            icon: 'lightning-bolt',
            label: 'Hexagon marker — Superhero-Villain Modality'
        }
    };

    return config[modality] || {
        color: '#6c757d',
        markerShape: 'pin',
        networkShape: 'circle',
        icon: 'default',
        label: 'Unknown Modality'
    };
}
```

**Purpose:** Returns the full visual identity configuration for a given modality. This is the single source of truth for how modalities are represented visually across the archive. Replaces the previous `getModalityColor()` function.

**Why this replaces `getModalityColor()`:** WCAG 1.4.1 (Use of Color) requires that color is never the sole differentiator. The previous function only returned a color hex value, which meant map markers, network nodes, and legend items had no non-color distinction between modalities. This function returns color, shape, icon, and a text label that describes the marker by shape rather than color.

**Input:** String matching modality ID from JSON (e.g., `"detective"`)

**Output:** Object with properties:

| Property | Type | Purpose |
|----------|------|---------|
| `color` | String (hex) | Fill/stroke color for visual rendering |
| `markerShape` | String | Leaflet map marker shape identifier |
| `networkShape` | String | D3 network node shape identifier |
| `icon` | String | Icon identifier for overlay inside markers/nodes |
| `label` | String | Accessible text label describing the marker by shape, not color |

**Backward compatibility:** If existing code calls `getModalityColor(modality)`, replace with `getModalityConfig(modality).color`. Search both map.html and network.html for `getModalityColor`, `nodeColors`, and `icons` objects that hardcode color values — these should all reference `getModalityConfig()` instead.

**Configuration table:**

| Modality | Color | Hex | Map Marker | Network Shape | Icon |
|----------|-------|-----|------------|---------------|------|
| Detective | Blue | `#3388ff` | Pin | Circle | Magnifying glass |
| Revolutionary | Red | `#dc3545` | Star | Diamond | Raised fist |
| Folk Hero-Outlaw | Gold | `#d4af37` | Triangle | Triangle | Star |
| Gangsta-Pimp | Purple | `#6f42c1` | Square | Square | Dollar sign |
| Superhero-Villain | Teal | `#20c997` | Hexagon | Hexagon | Lightning bolt |
| Unknown/Default | Gray | `#6c757d` | Pin | Circle | Default |

**Modification notes:**
- Update this function when modality colors or shapes change
- This table must stay in sync with the Modality Visual Identity System table in HTML_TEMPLATES.md
- When a new modality goes live, add its string to the `activeModalities` array in map.html and network.html — that controls rendering, this function controls appearance

---

### Shared Detail Panel Builder
```javascript
function showFigureDetails(figure, panelContentId, panelId) {
    var totalScore = calculateBadmanScore(figure.scores);
    var config = getModalityConfig(figure.modality);

    var shortDesc = figure.biography.description.substring(0, 200) + '...';
    var fullDesc = figure.biography.description;

    var sourceLinks = buildSourceLinks(figure.sources.primary);

    var html =
        '<h3 style="color: #e8e8e8;">' + figure.name + '</h3>' +
        '<p><em>Modality:</em> ' + figure.modality + '</p>' +
        '<p><em>Type:</em> ' + formatFigureType(figure.type, figure.meta_badman) + '</p>' +
        '<p><em>Years:</em> ' + (figure.years.birth || figure.years.active_start) +
        ' – ' + (figure.years.death || figure.years.active_end || 'present') + '</p>' +
        '<p><em>Badman Score:</em> ' + totalScore + '/25</p>' +
        '<span id="description-text">' + shortDesc + '</span>' +
        '<a href="#" id="read-more-link" style="color: #50c878; display: block; margin-top: 0.5rem;"' +
        ' aria-label="Read more about ' + figure.name + '">Read more</a>' +
        '<hr style="border-color: #2a623d; margin: 1rem 0;">' +
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

**Accessibility features built in:**
- Figure name is rendered as `<h3>` (proper heading hierarchy under the panel's `<h2>`)
- "Read more" link includes `aria-label` with figure name for screen reader context (WCAG 2.4.4)
- `panel.focus()` moves focus to the panel after content update, so keyboard and screen reader users know content has changed
- Source links are built via `buildSourceLinks()` with proper list structure and new-tab warnings

**Modification notes:**
- If the panel layout changes, update the HTML template string here — it is the single source for all three interaction paths
- The panel container must have `tabindex="-1"` in the HTML for `panel.focus()` to work
- The panel container must have `aria-live="polite"` and `aria-atomic="true"` for screen reader announcements

---

### Accessible Source Link Builder
```javascript
function buildSourceLinks(sources) {
    if (!sources || sources.length === 0) return '<p>No sources available.</p>';

    var html = '<ul class="list-unstyled">';
    for (var i = 0; i < sources.length; i++) {
        html += '<li style="margin-bottom: 0.3rem;">' +
            '<a href="' + sources[i].url + '" target="_blank" rel="noopener noreferrer" style="color: #50c878;">' +
            sources[i].title +
            '<span class="sr-only"> (opens in new tab)</span>' +
            '</a></li>';
    }
    html += '</ul>';
    return html;
}
```

**Purpose:** Builds a properly structured, accessible list of source links for the detail panel.

**Why this exists:** The previous implementation concatenated `<a>` tags separated by `<br>` elements. This fails two accessibility requirements: the links are not in a semantic list structure (WCAG 1.3.1), and links opening in new tabs had no warning (WCAG 3.2.5 best practice).

**Input:** Array of source objects, each with `url` and `title` properties.

**Output:** HTML string containing a `<ul>` with one `<li>` per source.

**Accessibility features built in:**
- Semantic `<ul>`/`<li>` list structure (screen readers announce "list of N items")
- `target="_blank"` paired with `rel="noopener noreferrer"` (security + accessibility)
- sr-only "(opens in new tab)" text (screen readers announce the new-tab behavior)

**Modification notes:**
- If source objects gain additional fields (author, date), update the link text here
- Do not remove the sr-only span — it is required for screen reader users

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

---

## Dependencies

This file has no external dependencies. It uses vanilla JavaScript only.

The map and network pages load their own libraries:
- **map.html** — Leaflet.js
- **network.html** — D3.js v7
