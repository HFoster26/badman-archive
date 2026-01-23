# Network Visualization Tool (NVT) Documentation

## Overview

The Network Visualization Tool (NVT) is a D3.js-powered force-directed graph that visualizes relationships between badman figures in the Detroit Badman Archive. It displays how figures influenced each other across time, with interactive features for exploring connections.

---

## Features

### Core Functionality
- **Force-directed layout**: Nodes float and cluster organically based on their connections
- **Drag interaction**: Click and drag any node to rearrange the graph; connected nodes respond
- **Zoom and pan**: Scroll to zoom, drag empty space to pan
- **Click-to-focus**: Click a node to highlight it and its connections; everything else fades
- **Detail panel**: Displays figure information when a node is selected

### Visual Encoding
- **Node color**: Indicates modality (detective = blue, revolutionary = red)
- **Node size**: Base size 20px (future: scales with influence metrics)
- **Edge color**: Indicates connection type (see Connection Types below)
- **Labels**: Figure names displayed above each node

---

## Connection Types

| Code | Name | Color | Description |
|------|------|-------|-------------|
| `META` | Meta-Badman → Creation | Gold (#d4af37) | Real person creates fictional figure |
| `P2C` | Person ↔ Creator | Red (#dc3545) | Real figure inspires fiction OR fiction inspires real person |
| `C2C` | Creator ↔ Creator | Green (#50c878) | One artist's work influences another's |
| `GEO` | Geographic Inspiration | Blue (#3388ff) | Place/events shape actions or creative output |

---

## File Structure

```
badman-archive/
├── data/
│   ├── detroit.json      # Data source for NVT
│   ├── DATAREADME.md     # Data schema documentation
│   └── NVTREADME.md      # This file
├── network.html          # NVT page
├── css/
│   └── styles.css        # Site-wide styles
└── js/
    └── scripts.js        # Site-wide scripts
```

---

## Data Requirements

The NVT reads from `data/detroit.json`. Each figure requires:

### Required for Node Display
```json
{
  "id": "figure_id",
  "name": "Display Name",
  "type": "real | fictional",
  "modality": "detective | revolutionary",
  "emergence": {
    "year": 1968
  }
}
```

### Required for Edge Display
```json
{
  "network": {
    "connections": [
      {
        "target_id": "other_figure_id",
        "type": "META | P2C | C2C | GEO",
        "direction": "outgoing | incoming | mutual",
        "evidence": "Description of the connection"
      }
    ]
  }
}
```

### Optional (Future Features)
- `meta_badman`: Boolean flag displayed in detail panel
- `influence_trajectory`: Array for timeline-based node sizing

---

## Code Structure

The NVT JavaScript is embedded in `network.html` within `<script>` tags at the bottom of the body. It consists of these sections:

### 1. Setup
```javascript
const container = document.getElementById('network-container');
const width = container.clientWidth;
const height = container.clientHeight;
```
Defines dimensions and color scales for nodes and edges.

### 2. SVG Canvas
```javascript
const svg = d3.select('#network-container')
    .append('svg')
    .attr('width', width)
    .attr('height', height);
```
Creates the drawing surface with zoom/pan enabled.

### 3. Data Loading
```javascript
d3.json('data/detroit.json').then(function(data) { ... });
```
Loads JSON data and transforms it into nodes and edges arrays.

### 4. Force Simulation
```javascript
const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(edges).id(d => d.id).distance(150))
    .force('charge', d3.forceManyBody().strength(-400))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(50));
```
Creates the physics engine that positions nodes.

### 5. Drawing Elements
- **Edges**: Lines colored by connection type
- **Nodes**: Circles colored by modality
- **Labels**: Text positioned above nodes

### 6. Tick Function
```javascript
simulation.on('tick', function() { ... });
```
Updates positions of all elements on every animation frame.

### 7. Focus Behavior
```javascript
node.on('click', function(event, d) { ... });
```
Handles click-to-focus interaction and detail panel updates.

---

## Customization

### Changing Colors

Edit the color objects at the top of the script:

```javascript
const edgeColors = {
    'META': '#d4af37',
    'P2C': '#dc3545',
    'C2C': '#50c878',
    'GEO': '#3388ff'
};

const nodeColors = {
    'detective': '#3388ff',
    'revolutionary': '#dc3545'
};
```

Also update the CSS legend classes in the `<style>` block to match.

### Changing Node Size

Find this line and change the radius value:

```javascript
.attr('r', 20)
```

### Changing Force Behavior

Adjust these values in the simulation setup:

| Parameter | Effect | Default |
|-----------|--------|---------|
| `.distance(150)` | Edge length | 150px |
| `.strength(-400)` | Node repulsion | -400 (negative = repel) |
| `.radius(50)` | Collision buffer | 50px |

### Adding New Modalities

1. Add color to `nodeColors` object:
```javascript
const nodeColors = {
    'detective': '#3388ff',
    'revolutionary': '#dc3545',
    'gangsta_pimp': '#9b59b6'  // New modality
};
```

2. Add figures with that modality to `detroit.json`

---

## Dependencies

| Library | Version | CDN |
|---------|---------|-----|
| D3.js | 7.x | `https://d3js.org/d3.v7.min.js` |
| Bootstrap | 5.2.3 | `https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js` |

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

1. **No timeline filtering yet**: Slider exists but doesn't filter nodes (Phase 2)
2. **Static node size**: All nodes same size regardless of influence (Phase 2)
3. **No edge click**: Only nodes are clickable, not edges (Phase 2)
4. **Mobile**: Functional but not optimized for touch (Phase 3)

---

## Future Development

### Phase 2: Timeline Integration
- Timeline slider filters visible nodes by emergence year
- Node size scales with influence metrics at selected year
- Animated transitions when timeline changes

### Phase 3: Enhanced Interactivity
- Click edges to see connection evidence
- Hover tooltips with quick info
- Search/filter by name or modality
- Keyboard navigation (Escape to unfocus)

### Phase 4: Multi-City Support
- Load different city JSON files
- Cross-city connection visualization
- City selector dropdown

---

## Troubleshooting

### Graph doesn't appear
1. Check browser console for errors (F12 → Console)
2. Verify `detroit.json` exists in `/data/` folder
3. Confirm JSON syntax is valid (use jsonlint.com)

### Nodes cluster in corner
1. Check container has explicit height in CSS
2. Verify `width` and `height` variables are not 0

### Edges wrong color
1. Verify connection `type` in JSON matches exactly: `META`, `P2C`, `C2C`, or `GEO`
2. Check `edgeColors` object has matching keys

### Labels not visible
1. Check `fill` color contrasts with background
2. Verify labels are added after nodes in code (draw order matters)

---

## Contributing

When modifying the NVT:

1. Test with browser console open to catch errors
2. Verify all five figures render correctly
3. Test click-to-focus on each node
4. Test zoom and pan
5. Test drag behavior
6. Update this README if adding features

---

## Credits

- **D3.js**: Mike Bostock and contributors (BSD license)
- **Force-directed layout**: Standard D3 pattern
- **Design**: Detroit Badman Archive project

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | January 2026 | Initial implementation: force layout, focus behavior, detail panel |
