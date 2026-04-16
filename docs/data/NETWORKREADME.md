# Network Visualization Tool (NVT) Documentation

## Overview

The Network Visualization Tool (NVT) is a D3.js-powered force-directed graph that visualizes relationships between badman figures in the Detroit Badman Archive. It displays how figures influenced each other across time, with dynamic node sizing based on curated scholarly influence estimates, evidence-tiered edge rendering, interactive metrics panels, and a timeline slider that drives the entire visualization.

---

## Features

### Core Functionality
- **Force-directed layout**: Nodes float and cluster organically based on their connections
- **Drag interaction**: Click and drag any node to rearrange the graph; connected nodes respond
- **Zoom and pan**: Scroll to zoom, drag empty space to pan
- **Click-to-focus**: Click a node to highlight it and its connections; everything else fades
- **Click edges**: Click any connection line to view its evidence and classification
- **Detail panels**: Sidebar panel shows figure info on click; metrics panels show network statistics and figure-level analysis
- **Timeline slider**: Scrub through time to see figures emerge, grow, and persist based on cultural influence
- **Modality filtering**: Toggle modalities on and off via the `activeModalities` array to isolate parts of the network
- **Keyboard accessible**: D3 nodes receive `tabindex="0"` and `role="button"` for keyboard operability (WCAG 2.1.1)

### Visual Encoding
- **Node color and shape**: Indicates modality — values pulled from `getModalityConfig()` in scripts.js (single source of truth). At launch: Detective (blue pin/circle), Revolutionary (red star/diamond), Superhero-Villain (orange hexagon).
- **Node size**: Scales dynamically with influence value at the current timeline year (square root scale, 0–45px radius)
- **Edge color**: Indicates connection type (see Connection Types below)
- **Edge line style**: Indicates evidence tier (solid = Documented, dashed = Evidenced, dotted = Interpretive)
- **Edge opacity**: Decreases with lower evidence tiers
- **Arrowheads**: Directed connections display arrowhead markers colored by edge type
- **Labels**: Figure names displayed above each node, offset scales with node size

---

## Connection Types

| Code | Name | Color | Description |
|------|------|-------|-------------|
| `META` | Creator → Creation | Gold (`#D4AF37`) | Real person creates fictional figure (e.g., Goines → Kenyatta) |
| `P2C` | Person → Creation | Red (`#DC3545`) | Real figure inspires fiction OR fiction inspires real person |
| `C2C` | Creator ↔ Creator | Green (`#50C878`) | One artist's work influences another's |
| `ORG` | Organizational / Ideological | Blue (`#3388FF`) | Shared membership, ideology, or institutional connection |
| `CC` | Creation Continuity | Pink (`#E83E8C`) | Fictional characters sharing a universe or continuity (e.g., Static ↔ Hardware) |

Edge type definitions are stored in the `edge_types` object at the top of `detroit.json` and read directly by the visualization. See DATAREADME.md for the full schema.

## Evidence Tiers

| Tier | Label | Line Style | Opacity | Description |
|------|-------|------------|---------|-------------|
| 1 | Documented | Solid | 0.9 | Direct archival or published evidence proves the connection |
| 2 | Evidenced (unverified) | Dashed (8,4) | 0.6 | Strong indicators exist but primary source confirmation is pending |
| 3 | Interpretive | Dotted (2,4) | 0.35 | Scholarly argument based on thematic, geographic, or modality-level analysis |

Tier rendering rules are stored in the `evidence_tiers` object in `detroit.json` and read directly by the visualization.

---

## Metrics Panels

Two metrics panels span the full page width below the visualization and timeline slider.

### Network Summary (Left Panel)

Displays five network-level statistics that recalculate every time the timeline slider moves:

| Metric | Calculation | What It Shows |
|--------|-------------|---------------|
| **Active Figures** | Count of nodes where `getInfluenceAtYear()` > 0 | How many figures are culturally active at the selected year |
| **Active Connections** | Count of edges where both endpoints are active | How many relationships exist at the selected year |
| **Network Density** | Active connections ÷ possible connections (n × (n-1) for directed) | How interconnected the active network is |
| **Reciprocity** | Mutual directed pairs ÷ total directed edges | Whether influence flows both ways or is one-directional |
| **Cross-Modality** | Count of edges where source.modality ≠ target.modality | How much the active modalities intersect with each other |

### Selected Figure Metrics (Right Panel)

Populates on node click with figure-specific analysis:

- **Degree**: Total connections with in/out breakdown
- **Influence bar**: Visual bar showing influence value at current year (0–10 scale) with scholarly justification text from the active phase
- **Connections list**: Each connection displays the other figure's name, direction arrow (→ or ←), and a colored tier badge (Documented, Evidenced, or Interpretive)

Populates on edge click with connection details:

- **Direction**: Source → Target (or ↔ for mutual connections)
- **Type**: Connection type with color coding (five types at launch: META, P2C, C2C, ORG, CC)
- **Evidence Tier**: Colored badge
- **Evidence**: Source citation or description text

Clicking the SVG background or the same node again resets both panels to their default state.

---

## File Structure

```
badman-archive/
├── data/
│   ├── detroit.json        # Data source for NVT and Map
│   └── DATAREADME.md       # Data schema documentation
├── visualizations/
│   ├── network.html        # NVT page (HTML + embedded JS)
│   └── map.html            # Map tool page
├── css/
│   └── styles.css          # Site-wide styles including legend classes
├── js/
│   └── scripts.js          # Site-wide scripts including getModalityConfig() and showFigureDetails()
└── docs/
    ├── NVTREADME.md        # This file
    ├── MAPREADME.md        # Map Visualization Tool docs
    └── HTML_TEMPLATES.md   # Page template and accessibility patterns
```

---

## Data Requirements

The NVT reads from `data/detroit.json`. Each figure requires the following fields:

### Required for Node Display

```json
{
  "id": "figure_id",
  "name": "Display Name",
  "type": "real | fictional",
  "modality": "detective | revolutionary | superhero_villain",
  "meta_badman": false,
  "emergence": {
    "year": 1968
  },
  "years": {
    "active_start": 1941,
    "active_end": 2014
  }
}
```

At launch, only figures with modality `detective`, `revolutionary`, or `superhero_villain` render. Figures with modality `gangsta_pimp` or `folk_hero_outlaw` are filtered out via the `activeModalities` array.

### Required for Dynamic Node Sizing

```json
{
  "influence": {
    "scale": "1-10",
    "metric_type": "curated_scholarly_estimate",
    "phases": [
      {
        "start": 1941,
        "end": 1967,
        "value": 6,
        "justification": "Scholarly description of influence during this period.",
        "source": "Citation or TBD"
      }
    ]
  }
}
```

Each phase defines a time range and an influence value (1–10 scale). The `getInfluenceAtYear()` function checks the current timeline year against these phases. If the year falls past all defined phases, the last phase's value persists (posthumous legacy).

### Required for Edge Display

```json
{
  "connections": [
    {
      "target_id": "other_figure_id",
      "type": "META | P2C | C2C | ORG | CC",
      "tier": 1,
      "direction": "outgoing | incoming | mutual",
      "start_year": 1974,
      "end_year": 1975,
      "evidence": "Description of the connection with source citation.",
      "source": "Citation"
    }
  ]
}
```

Edges are built from the `connections` array. Only `outgoing` and `mutual` directions create edge entries to avoid duplication.

### Required for Evidence Tier Rendering (Top-Level)

```json
{
  "evidence_tiers": {
    "1": { "label": "Documented",             "line_style": "solid",  "opacity": 0.9  },
    "2": { "label": "Evidenced (unverified)", "line_style": "dashed", "opacity": 0.6  },
    "3": { "label": "Interpretive",           "line_style": "dotted", "opacity": 0.35 }
  }
}
```

### Required for Edge Type Styling (Top-Level)

```json
{
  "edge_types": {
    "META": { "label": "Creator → Creation",          "color": "#D4AF37" },
    "P2C":  { "label": "Person → Creation",           "color": "#DC3545" },
    "C2C":  { "label": "Creator ↔ Creator",           "color": "#50C878" },
    "ORG":  { "label": "Organizational / Ideological","color": "#3388FF" },
    "CC":   { "label": "Creation Continuity",         "color": "#E83E8C" }
  }
}
```

---

## Code Structure

The NVT JavaScript is embedded in `network.html` within `<script>` tags at the bottom of the body. It consists of these sections:

### 1. Setup & Configuration Access
```javascript
const container = document.getElementById('network-container');
// Modality styling comes from getModalityConfig() in scripts.js — no local nodeColors object.
// Edge colors and evidence tiers come from data.edge_types and data.evidence_tiers in the JSON.
```
Defines the container and establishes that modality and edge styling are pulled from their authoritative sources rather than duplicated locally.

### 2. Utility: Influence Lookup
```javascript
function getInfluenceAtYear(node, year) { ... }
```
Returns the influence value (0–10) for a given node at a given year by checking against the node's `influence_phases` array. Returns 0 if the year precedes `active_start`. Returns the last phase's value if the year exceeds all defined phases.

### 3. SVG Canvas
```javascript
const svg = d3.select('#network-container').append('svg')...;
const g = svg.append('g');
```
Creates the drawing surface with zoom/pan behavior and a group element for all visual content. Includes arrowhead marker definitions for each edge type (META, P2C, C2C, ORG, CC).

### 4. Data Loading & Transformation
```javascript
d3.json('data/detroit.json').then(function(data) { ... });
```
Loads JSON data and transforms figures into `nodes` array (with `influence_phases` pulled into each node object) and `edges` array (with tier, type, direction, and evidence fields). The `edge_types` and `evidence_tiers` objects from the JSON are made available to all subsequent rendering functions.

### 5. Modality Filter
```javascript
const activeModalities = ['detective', 'revolutionary', 'superhero_villain'];
nodes = nodes.filter(n => activeModalities.includes(n.modality));
```
Filters nodes by modality before rendering. At launch, three modalities are active. When Gangsta-Pimp or Folk Hero-Outlaw go live, add their string to this array.

### 6. Force Simulation
```javascript
const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(edges).id(d => d.id).distance(150))
    .force('charge', d3.forceManyBody().strength(-400))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(...));
```
Creates the physics engine. Collision radius scales with current influence-based node size.

### 7. Reduced Motion Handling
```javascript
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (var i = 0; i < 300; i++) simulation.tick();
    simulation.stop();
}
```
Respects the user's OS-level motion preference. If reduced motion is enabled, runs one batch of simulation ticks to establish node positions, then stops the simulation immediately. See HTML_TEMPLATES.md for the full WCAG 2.3.3 requirement.

### 8. Edge Hit Areas
```javascript
const edgeHitArea = g.append('g').attr('class', 'edge-hit-areas')...;
```
Invisible 15px-wide lines behind visible edges that capture click events. Solves the problem of thin SVG lines being difficult to click.

### 9. Edge Rendering
```javascript
const edge = g.append('g').attr('class', 'edges')...;
```
Visible connection lines with stroke color pulled from `data.edge_types[edge.type].color`, stroke-dasharray from `data.evidence_tiers[edge.tier].line_style`, opacity from `data.evidence_tiers[edge.tier].opacity`, and arrowhead markers for directed edges.

### 10. Node Rendering
```javascript
const node = g.append('g').attr('class', 'nodes')...;
```
Circle or shape elements with radius from `radiusScale(getInfluenceAtYear())`, fill color from `getModalityConfig(d.modality).color`, shape from `getModalityConfig(d.modality).networkShape`, accessible label from `getModalityConfig(d.modality).label`, white stroke border, and drag behavior. Also sets `tabindex="0"`, `role="button"`, and `aria-label` for keyboard/screen reader access.

### 11. Tick Function
```javascript
simulation.on('tick', function() { ... });
```
Updates positions of edge hit areas, visible edges, nodes, and labels on every animation frame.

### 12. Labels
```javascript
const label = g.append('g').attr('class', 'labels')...;
```
Text elements positioned above nodes with vertical offset that scales with node size.

### 13. Click-to-Focus Behavior
```javascript
node.on('click', function(event, d) { ... });
```
Handles node click: highlights clicked node and its connections, fades everything else, updates sidebar Connection Details panel via `showFigureDetails()`, and populates Selected Figure Metrics panel with degree, influence bar, and connections list.

### 14. Keyboard Handler (WCAG 2.1.1)
```javascript
node.on('keydown', function(event, d) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        node.dispatch('click', { detail: d });
    }
});
```
Triggers the same click behavior on keyboard activation. Required because D3 nodes are not natively keyboard-operable.

### 15. Edge Click Behavior
```javascript
edgeHitArea.on('click', function(event, d) { ... });
```
Handles edge click: populates Selected Figure Metrics panel with connection type, evidence tier badge, direction, and evidence text. Highlights clicked edge and fades others.

### 16. Unfocus
```javascript
function unfocus() { ... }
```
Resets all visual elements to default opacity, clears both the sidebar panel and the figure metrics panel.

### 17. Timeline Slider
```javascript
document.getElementById('timeline-slider').addEventListener('input', function() { ... });
```
On slider input: updates node sizes with animated transitions (respecting reduced-motion), shows/hides nodes based on `active_start`, shows/hides edges based on both endpoints being active, updates collision radii, restarts simulation, and calls `updateNetworkMetrics()`.

### 18. Network Metrics Calculations
```javascript
function updateNetworkMetrics(year) { ... }
```
Calculates and writes to DOM: Active Figures, Active Connections, Network Density, Reciprocity, and Cross-Modality Connections. Called on initial load and every slider input.

### 19. Selected Figure Metrics
```javascript
function showFigureMetrics(nodeData, year) { ... }
```
Builds HTML for the right panel: degree with in/out breakdown, influence bar with percentage width and justification text, and connections list with tier badges.

### 20. Pause/Resume Button
```javascript
document.getElementById('pause-animation').addEventListener('click', function() { ... });
```
Toggles the force simulation pause state. Required by WCAG 2.2.2 (Pause, Stop, Hide) for auto-animating content.

---

## Customization

### Changing Modality Colors or Shapes

Modality styling is controlled by `getModalityConfig()` in `scripts.js` — the single source of truth. Do not hardcode modality colors in network.html. To change a modality's color or shape:

1. Update the CSS variable in `styles.css` (e.g., `--dba-detective`)
2. Update the corresponding `color`, `markerShape`, `networkShape`, or `icon` value in `getModalityConfig()` in `scripts.js`
3. Update the Modality Visual Identity System table in `HTML_TEMPLATES.md`
4. Re-run the Color Contrast Reference Table verification

### Changing Edge Colors or Styling

Edge styling is stored in the JSON's top-level `edge_types` object. To change:

1. Update the color hex in `detroit.json`'s `edge_types` block
2. Update the Connection Types table in this README and DATAREADME
3. Update legend items in network.html to match
4. Verify contrast against the dark background (WCAG AA minimum 3:1 for non-text contrast)

### Changing Node Size Range

Edit the radius scale in network.html:

```javascript
var radiusScale = d3.scaleSqrt().domain([0, 10]).range([0, 45]);
```

- `domain([0, 10])` — maps to influence values (1–10 scale)
- `range([0, 45])` — minimum and maximum pixel radius

### Changing Force Behavior

Adjust these values in the simulation setup:

| Parameter | Effect | Default |
|-----------|--------|---------|
| `.distance(150)` | Edge length | 150px |
| `.strength(-400)` | Node repulsion | -400 (negative = repel) |
| Collision `.radius()` | Buffer around nodes | `radiusScale(influence) + 5` |

### Activating a Dormant Modality

When a currently-dormant modality (Gangsta-Pimp, Folk Hero-Outlaw) goes live:

1. Verify `getModalityConfig()` already includes the modality (it should — all five are scaffolded)
2. Add the modality string to the `activeModalities` array in network.html
3. Verify legend entries exist in the network.html legend markup
4. Verify the legend CSS classes exist in `styles.css`
5. Test that the new modality's figures render with correct color and shape

No code changes to network.html's core rendering are required — the `getModalityConfig()` lookup and `activeModalities` filter handle activation automatically.

### Adding New Edge Types

1. Add the type object to `edge_types` in `detroit.json` with label and color
2. Add the type to the arrowhead marker `.data()` array in the SVG setup
3. Update legend entries in network.html
4. Update `typeLabels` in the edge click handler
5. Update Connection Types table in this README and DATAREADME

### Adding New Evidence Tiers

1. Add tier object to `evidence_tiers` in `detroit.json`
2. The visualization reads line style and opacity directly from the data — no code changes needed for rendering
3. Update `tierBadge()` functions in both `showFigureMetrics` and the edge click handler to include the new tier label and color

---

## Dependencies

| Library | Version | CDN |
|---------|---------|-----|
| D3.js | 7.x | `https://d3js.org/d3.v7.min.js` |
| Bootstrap | 5.2.3 | `https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js` |

No additional dependencies. All visualization logic is vanilla JavaScript.

---

## Browser Support

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires JavaScript enabled. SVG support required.

---

## Known Limitations

1. **Mobile**: Functional but not optimized for touch interaction or small screens
2. **Edge hit areas on zoom**: Hit area width is fixed at 15px regardless of zoom level
3. **Influence data gaps**: Phases use curated scholarly estimates; methodology documented in justification fields. Some phases remain marked `PLACEHOLDER` with `TBD` sources pending archival verification.
4. **Network scale**: At launch, the network contains 15 rendering figures across three modalities. Metrics like density, clustering, and cross-modality reciprocity become more analytically meaningful as the network grows.

---

## Future Development

### Phase 2: Enhanced Interactivity
- Hover tooltips with quick info
- Search/filter by name or modality
- Edge hover preview before click
- Additional keyboard shortcuts (Escape to unfocus)

### Phase 3: Mobile Optimization
- Touch-friendly hit areas
- Responsive panel layout
- Swipe gestures for timeline

### Phase 4: Multi-City Support
- Load different city JSON files
- Cross-city connection visualization
- City selector dropdown
- Shared `evidence_tiers` and `edge_types` schema across modules

### Phase 5: Modality Activation
- Gangsta-Pimp modality activation (when GPM figures beyond Goines enter the archive)
- Folk Hero-Outlaw modality activation (when first FHOM figures are documented)

---

## Troubleshooting

### Graph doesn't appear
1. Check browser console for errors (F12 → Console)
2. Verify `detroit.json` exists in `/data/` folder
3. Confirm JSON syntax is valid (use jsonlint.com)
4. Check that `edge_types` and `evidence_tiers` objects exist at the top level of the JSON

### Nodes cluster in corner
1. Check container has explicit height in CSS (`#network-container { height: 600px; }`)
2. Verify `width` and `height` variables are not 0

### Metrics panel shows all zeros
1. Confirm `influence.phases` arrays exist for each figure in the JSON
2. Verify `active_start` values are within the slider range (1930–2020)
3. Check that `updateNetworkMetrics()` is called after data loads

### Edge click doesn't work
1. Verify `edgeHitArea` is created before visible `edge` in the code
2. Confirm `edgeHitArea` positions update in the tick function
3. Check console for `event.stopPropagation()` errors

### Node click doesn't populate figure metrics
1. Verify `showFigureMetrics(d, currentYear)` is called inside the node click handler after `showFigureDetails(d, ...)`
2. Confirm `influence_phases` is pulled into each node object during data transformation

### Edges wrong color or style
1. Verify connection `type` in JSON matches exactly one of: `META`, `P2C`, `C2C`, `ORG`, `CC`
2. Verify `tier` values are numbers (1, 2, or 3), not strings
3. Check `evidence_tiers` object has matching keys as strings ("1", "2", "3")
4. Check `edge_types` object has the type key defined with color property

### CC edges don't render
1. Verify `CC` is present in `edge_types` at top of JSON
2. Check that connections using `"type": "CC"` have all required fields
3. Verify arrowhead marker for CC is defined in SVG marker definitions

### Nodes wrong color or shape
1. Verify figure's `modality` field exactly matches a key in `getModalityConfig()` (lowercase, underscores: `"superhero_villain"` not `"superhero-villain"`)
2. Check that the modality is in the `activeModalities` array
3. Verify `getModalityConfig()` in scripts.js is loaded before network.html's inline script runs

### Labels not visible
1. Check `fill` color contrasts with background
2. Verify labels are added after nodes in code (SVG draw order matters)
3. Label `dy` offset should be negative (above the node)

### Keyboard navigation doesn't work on nodes
1. Verify each node has `tabindex="0"` and `role="button"` attributes
2. Confirm the keydown handler is attached and checks for Enter/Space keys
3. Test with Tab key to see focus ring; test with Enter/Space to trigger node action

### Animation doesn't pause for reduced-motion users
1. Verify the `prefers-reduced-motion` media query check runs before `simulation.start()`
2. Confirm simulation ticks run to establish positions before `.stop()` is called
3. Test by enabling "Reduce motion" in OS accessibility settings

---

## Contributing

When modifying the NVT:

1. Test with browser console open to catch errors
2. Verify all figures from all active modalities render correctly at slider value 2020
3. Slide timeline to 1930 and back to 2020 — verify nodes appear/disappear and metrics update
4. Test click-to-focus on each modality's nodes — verify both sidebar and metrics panels populate
5. Test edge click on each connection type (META, P2C, C2C, ORG, CC) — verify connection details panel populates
6. Click empty space — verify all panels reset
7. Test zoom, pan, and drag behavior
8. Test keyboard navigation — Tab to nodes, Enter/Space to activate, verify focus ring visible
9. Test with OS "Reduce motion" enabled — verify simulation settles immediately
10. Run WAVE and axe on network.html — address any new violations
11. Update this README if adding features

---

## Credits

- **D3.js**: Mike Bostock and contributors (BSD license)
- **Force-directed layout**: Standard D3 pattern
- **Design**: Detroit Badman Archive project, CHI Fellowship, Michigan State University

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | January 2026 | Initial implementation: force layout, focus behavior, detail panel |
| 2.0 | February 2026 | Phase-based dynamic node sizing, evidence-tiered edge rendering with arrowheads, timeline slider driving node/edge visibility, network summary metrics panel, selected figure metrics panel with degree/influence/connections, edge click behavior with hit areas, unfocus reset for all panels |
| 3.0 | April 2026 | Three-modality launch (Detective, Revolutionary, Superhero-Villain). Added CC (Creation Continuity) edge type. Migrated modality styling to `getModalityConfig()` single source of truth. Added keyboard operability (WCAG 2.1.1) and reduced-motion support (WCAG 2.3.3). Fifteen figures at launch. |
