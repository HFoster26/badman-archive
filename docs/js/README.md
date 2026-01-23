# JavaScript Documentation

## File: `scripts.js`

This file contains shared functionality used across all pages of the Detroit Badman Archive. Page-specific scripts (Leaflet map initialization, D3 network visualization) are included inline in their respective HTML files.

---

## Structure Overview

```
scripts.js
├── DOMContentLoaded Event Listener (Lines 10-23)
│   └── Navigation active state highlighting
├── loadArchiveData() (Lines 25-40)
│   └── Async JSON data fetcher
├── calculateBadmanScore() (Lines 42-53)
│   └── Score calculator from criteria object
├── formatFigureType() (Lines 55-64)
│   └── Display formatter for figure types
└── getModalityColor() (Lines 66-80)
    └── Color mapping for modalities
```

---

## Detailed Breakdown

### Lines 1-8: File Header
```javascript
/**
 * Detroit Badman Archive
 * Main JavaScript file
 * ...
 */
```
**Purpose:** Documentation header explaining the file's role.

**Modification notes:** Update this comment if you add major new functionality.

---

### Lines 10-23: DOM Initialization
```javascript
window.addEventListener('DOMContentLoaded', event => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
            link.style.color = '#d4af37';
        }
    });
    
    console.log('Detroit Badman Archive initialized');
});
```

**Purpose:** Runs when the page loads. Highlights the current page in the navigation bar.

**How it works:**
1. `window.location.pathname.split('/').pop()` — Gets the current filename (e.g., `map.html`)
2. `querySelectorAll('.nav-link')` — Selects all navigation links
3. Compares each link's `href` to current page
4. Adds `active` class and gold color (`#d4af37`) to matching link

**Modification notes:**
- Change `#d4af37` to update the active link color
- Add additional initialization code inside this event listener

---

### Lines 25-40: Data Loading Function
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

### Lines 42-53: Score Calculator
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

**Modification notes:**
- If you add new criteria, add them here
- Consider adding validation to ensure scores are 1-5

---

### Lines 55-64: Figure Type Formatter
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

### Lines 66-80: Modality Color Mapping
```javascript
function getModalityColor(modality) {
    const colors = {
        'detective': '#3388ff',
        'revolutionary': '#dc3545',
        'folk_hero_outlaw': '#d4af37',
        'gangsta_pimp': '#6f42c1',
        'superhero_villain': '#20c997'
    };
    return colors[modality] || '#6c757d';
}
```

**Purpose:** Returns the hex color code for a given modality. Used by both map markers and network nodes.

**Input:** String matching modality ID from JSON (e.g., `"detective"`)

**Output:** Hex color string

**Color mapping:**
| Modality | Color | Hex |
|----------|-------|-----|
| Detective | Blue | `#3388ff` |
| Revolutionary | Red | `#dc3545` |
| Folk Hero-Outlaw | Gold | `#d4af37` |
| Gangsta-Pimp | Purple | `#6f42c1` |
| Superhero-Villain | Teal | `#20c997` |
| Unknown/Default | Gray | `#6c757d` |

**Modification notes:**
- Update hex values to change modality colors globally
- Colors should match the legend in map.html and network.html
- If you change colors here, also update CSS in those files

---

## Adding New Functions

When adding new shared functionality:

1. Add the function after existing functions
2. Include JSDoc-style comment explaining purpose, parameters, and return value
3. Update this README with the new function's documentation
4. If the function is page-specific, consider adding it inline in that HTML file instead

---

## Dependencies

This file has no external dependencies. It uses vanilla JavaScript only.

The map and network pages load their own libraries:
- **map.html** — Leaflet.js
- **network.html** — D3.js v7
