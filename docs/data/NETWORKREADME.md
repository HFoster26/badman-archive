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

### Visual Encoding
- **Node color**: Indicates modality (detective = blue `#3388ff`, revolutionary = red `#dc3545`)
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
| `META` | Meta-Creative | Gold (#d4af37) | Real person creates fictional figure (e.g., Goines → Kenyatta) |
| `P2C` | Person to Creator | Red (#dc3545) | Real figure inspires fiction OR fiction inspires real person |
| `C2C` | Creator to Creator | Green (#50c878) | One artist's work influences another's |
| `ORG` | Organizational Affiliation | Blue (#3388ff) | Shared membership, ideology, or institutional connection |

## Evidence Tiers

| Tier | Label | Line Style | Opacity | Description |
|------|-------|------------|---------|-------------|
| 1 | Documented | Solid | 0.8 | Direct archival or published evidence proves the connection |
| 2 | Evidenced | Dashed (8,4) | 0.6 | Strong indicators exist but primary source confirmation is pending |
| 3 | Interpretive | Dotted (2,4) | 0.4 | Scholarly argument based on thematic, geographic, or modality-level analysis |

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
| **Cross-Modality** | Count of edges where source.modality ≠ target.modality | How much detective and revolutionary traditions intersect |

### Selected Figure Metrics (Right Panel)

Populates on node click with figure-specific analysis:

- **Degree**: Total connections with in/out breakdown
- **Influence bar**: Visual bar showing influence value at current year (0–10 scale) with scholarly justification text from the active phase
- **Connections list**: Each connection displays the other figure's name, direction arrow (→ or ←), and a colored tier badge (Documented, Evidenced, or Interpretive)

Populates on edge click with connection details:

- **Direction**: Source → Target (or ↔ for mutual connections)
- **Type**: Connection type with color coding
- **Evidence Tier**: Colored badge
- **Evidence**: Source citation or description text

Clicking the SVG background or the same node again resets both panels to their default state.

---

## File Structure

```
badman-archive/
├── data/
│   ├── detroit.json        # Data source for NVT and Map
│   ├── DATAREADME.md       # Data schema documentation
│   └── NVTREADME.md        # This file
├── network.html            # NVT page (HTML + embedded JS)
├── css/
│   └── styles.css          # Site-wide styles
└── js/
    └── scripts.js          # Site-wide scripts
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
  "modality": "detective | revolutionary",
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

### Required for Dynamic Node Sizing

```json
{
  "influence": {
    "phases": [
      {
        "start": 1941,
        "end": 1967,
        "value": 6,
        "label": "Early activism",
        "justification": "Scholarly description of influence during this period."
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
      "type": "META | P2C | C2C | ORG",
      "tier": 1,
      "direction": "outgoing | incoming | mutual",
      "evidence": "Description of the connection with source citation."
    }
  ]
}
```

Edges are built from the `connections` array. Only `outgoing` and `mutual` directions create edge entries to avoid duplication.

### Required for Evidence Tier Rendering (Top-Level)

```json
{
  "evidence_tiers": {
    "1": { "label": "Documented", "line_style": "solid", "opacity": 0.8 },
    "2": { "label": "Evidenced", "line_style": "dashed", "opacity": 0.6 },
    "3": { "label": "Interpretive", "line_style": "dotted", "opacity": 0.4 }
  }
}
```

---

## Code Structure

The NVT JavaScript is embedded in `network.html` within `<script>` tags at the bottom of the body. It consists of these sections:

### 1. Setup & Color Scales
```javascript
const container = document.getElementById('network-container');
const edgeColors = { 'META': '#d4af37', 'P2C': '#dc3545', ... };
const nodeColors = { 'detective': '#3388ff', 'revolutionary': '#dc3545' };
```
Defines dimensions and color maps for nodes and edges.

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
Creates the drawing surface with zoom/pan behavior and a group element for all visual content. Includes arrowhead marker definitions for each edge type.

### 4. Data Loading & Transformation
```javascript
d3.json('data/detroit.json').then(function(data) { ... });
```
Loads JSON data and transforms figures into `nodes` array (with `influence_phases` pulled into each node object) and `edges` array (with tier, type, direction, and evidence fields).

### 5. Force Simulation
```javascript
const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(edges).id(d => d.id).distance(150))
    .force('charge', d3.forceManyBody().strength(-400))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(...));
```
Creates the physics engine. Collision radius scales with current influence-based node size.

### 6. Edge Hit Areas
```javascript
const edgeHitArea = g.append('g').attr('class', 'edge-hit-areas')...;
```
Invisible 15px-wide lines behind visible edges that capture click events. Solves the problem of thin SVG lines being difficult to click.

### 7. Edge Rendering
```javascript
const edge = g.append('g').attr('class', 'edges')...;
```
Visible connection lines with stroke color by type, stroke-dasharray by tier, opacity by tier, and arrowhead markers for directed edges.

### 8. Node Rendering
```javascript
const node = g.append('g').attr('class', 'nodes')...;
```
Circle elements with radius from `radiusScale(getInfluenceAtYear())`, fill color by modality, white stroke border, and drag behavior.

### 9. Tick Function
```javascript
simulation.on('tick', function() { ... });
```
Updates positions of edge hit areas, visible edges, nodes, and labels on every animation frame.

### 10. Labels
```javascript
const label = g.append('g').attr('class', 'labels')...;
```
Text elements positioned above nodes with vertical offset that scales with node size.

### 11. Click-to-Focus Behavior
```javascript
node.on('click', function(event, d) { ... });
```
Handles node click: highlights clicked node and its connections, fades everything else, updates sidebar Connection Details panel, and populates Selected Figure Metrics panel with degree, influence bar, and connections list.

### 12. Edge Click Behavior
```javascript
edgeHitArea.on('click', function(event, d) { ... });
```
Handles edge click: populates Selected Figure Metrics panel with connection type, evidence tier badge, direction, and evidence text. Highlights clicked edge and fades others.

### 13. Unfocus
```javascript
function unfocus() { ... }
```
Resets all visual elements to default opacity, clears both the sidebar panel and the figure metrics panel.

### 14. Timeline Slider
```javascript
document.getElementById('timeline-slider').addEventListener('input', function() { ... });
```
On slider input: updates node sizes with animated transitions, shows/hides nodes based on `active_start`, shows/hides edges based on both endpoints being active, updates collision radii, restarts simulation, and calls `updateNetworkMetrics()`.

### 15. Network Metrics Calculations
```javascript
function updateNetworkMetrics(year) { ... }
```
Calculates and writes to DOM: Active Figures, Active Connections, Network Density, Reciprocity, and Cross-Modality Connections. Called on initial load and every slider input.

### 16. Selected Figure Metrics
```javascript
function showFigureMetrics(nodeData, year) { ... }
```
Builds HTML for the right panel: degree with in/out breakdown, influence bar with percentage width and justification text, and connections list with tier badges.

---

## Customization

### Changing Colors

Edit the color objects at the top of the script:

```javascript
const edgeColors = {
    'META': '#d4af37',
    'P2C': '#dc3545',
    'C2C': '#50c878',
    'ORG': '#3388ff'
};

const nodeColors = {
    'detective': '#3388ff',
    'revolutionary': '#dc3545'
};
```

Also update the CSS legend classes in the `<style>` block to match.

### Changing Node Size Range

Edit the radius scale:

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

### Adding New Modalities

1. Add color to `nodeColors` object:
```javascript
const nodeColors = {
    'detective': '#3388ff',
    'revolutionary': '#dc3545',
    'gangsta_pimp': '#9b59b6'
};
```

2. Add figures with that modality to `detroit.json`

### Adding New Edge Types

1. Add color to `edgeColors` object
2. Add type string to the arrowhead marker `.data()` array
3. Update the legend in the HTML
4. Update `typeLabels` in the edge click handler

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
3. **Influence data gaps**: Phases use curated scholarly estimates; methodology documented in justification fields
4. **Small network**: With 5 nodes, some network metrics (density, clustering) are less analytically meaningful than they would be at scale

---

## Future Development

### Phase 2: Enhanced Interactivity
- Hover tooltips with quick info
- Search/filter by name or modality
- Keyboard navigation (Escape to unfocus)
- Edge hover preview before click

### Phase 3: Mobile Optimization
- Touch-friendly hit areas
- Responsive panel layout
- Swipe gestures for timeline

### Phase 4: Multi-City Support
- Load different city JSON files
- Cross-city connection visualization
- City selector dropdown
- Shared `evidence_tiers` schema across modules

---

## Troubleshooting

### Graph doesn't appear
1. Check browser console for errors (F12 → Console)
2. Verify `detroit.json` exists in `/data/` folder
3. Confirm JSON syntax is valid (use jsonlint.com)
4. Check that `evidence_tiers` object exists at the top level of the JSON

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
1. Verify `showFigureMetrics(d, currentYear)` is called inside the node click handler after `updatePanel(d)`
2. Confirm `influence_phases` is pulled into each node object during data transformation

### Edges wrong color or style
1. Verify connection `type` in JSON matches exactly: `META`, `P2C`, `C2C`, or `ORG`
2. Verify `tier` values are numbers (1, 2, or 3), not strings
3. Check `evidence_tiers` object has matching keys as strings ("1", "2", "3")

### Labels not visible
1. Check `fill` color contrasts with background
2. Verify labels are added after nodes in code (SVG draw order matters)
3. Label `dy` offset should be negative (above the node)

---

## Contributing

When modifying the NVT:

1. Test with browser console open to catch errors
2. Verify all five figures render correctly at slider value 2020
3. Slide timeline to 1930 and back to 2020 — verify nodes appear/disappear and metrics update
4. Test click-to-focus on each node — verify both sidebar and metrics panels populate
5. Test edge click on each connection — verify connection details panel populates
6. Click empty space — verify all panels reset
7. Test zoom, pan, and drag behavior
8. Update this README if adding features

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
