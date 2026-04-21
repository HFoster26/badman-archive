# Map Visualization Tool (MVT) Documentation

## Overview

The Map Visualization Tool (MVT) is a Leaflet.js-powered interactive map that visualizes the geographic footprint of badman figures in the Detroit Badman Archive. It displays each figure's primary location, territory polygon, and additional significant locations across the city, with modality-specific marker shapes, clickable detail panel integration, and a modality filter that controls which figures render.

---

## Features

### Core Functionality
- **Interactive map**: Pan, zoom, and explore Detroit at any scale via standard Leaflet controls
- **Modality-shape markers**: Each figure appears as a distinct shape per modality — color is never the sole differentiator (WCAG 1.4.1)
- **Territory polygons**: Shaded regions showing each figure's documented area of operation
- **Additional location markers**: Secondary significant locations tied to each figure (e.g., residences, institutions, sites of key events)
- **Click-to-detail**: Clicking any marker opens the shared detail panel with biography, score breakdown, connections, and sources
- **Modality filtering**: Toggle modalities on and off to isolate spatial patterns
- **Screen-reader data table**: Non-visual alternative path to all figures and locations (WCAG 1.1.1, 1.3.3)
- **Keyboard accessible**: Full keyboard operability via Leaflet's built-in arrow-key pan and +/- zoom

### Visual Encoding
- **Marker shape**: Indicates modality (circle = Detective, star = Revolutionary, hexagon = Superhero-Villain, square = Gangsta-Pimp, triangle = Folk Hero-Outlaw)
- **Marker color**: Reinforces modality identity (blue, red, teal, purple, gold respectively)
- **Icon overlay**: Each marker includes a modality-specific icon (magnifying glass, raised fist, lightning bolt, dollar sign, star)
- **Territory polygon fill**: Semi-transparent fill in the figure's modality color
- **Territory polygon pattern**: Distinct fill pattern per modality so color-independent distinction is preserved
- **Additional locations**: Rendered as smaller circular markers tied to the primary figure marker via implicit association in the detail panel

---

## Modality Marker System

Every modality is defined by three distinguishable properties: color, shape, and icon. This is the single source of truth for how modalities appear on the map. The configuration is defined in `getModalityConfig()` in `scripts.js` and must stay in sync with the Modality Visual Identity System table in `HTML_TEMPLATES.md` and the legend CSS classes in `styles.css`.

| Modality | Color | Hex | Marker Shape | Icon |
|----------|-------|-----|--------------|------|
| Detective | Blue | `#3388ff` | Circle | Magnifying glass |
| Revolutionary | Red | `#dc3545` | Star | Raised fist |
| Superhero-Villain | Orange | `#fd7e14` | Hexagon | Lightning bolt |
| Gangsta-Pimp | Purple | `#6f42c1` | Square | Dollar sign |
| Folk Hero-Outlaw | Gold | `#d4af37` | Triangle | Star |

Marker shapes are implemented via the `leaflet-extra-markers` or `leaflet-awesome-markers` plugin (or equivalent), with shape selected by the figure's `modality` field in the JSON.

### Marker Alt Text

Leaflet's default marker alt text is just "Marker." Override it with the figure's name and modality for screen reader access:

```javascript
L.marker([lat, lng], {
    icon: icon,
    alt: figure.name + ' — ' + figure.modality + ' modality'
});
```

---

## Territory Polygons

Territory polygons are modality-colored, semi-transparent regions that show each figure's documented area of operation. They are defined in the JSON by an array of `[lat, lng]` coordinate pairs forming a closed shape.

### Rendering Rules

- **Fill color**: The figure's modality color at reduced opacity (typically 0.15–0.25) so underlying map tiles remain legible
- **Fill pattern**: Modality-specific pattern overlay (diagonal stripes, dots, etc.) to preserve distinction when modalities overlap spatially
- **Stroke**: The figure's modality color at full opacity, 2px weight
- **Stroke pattern**: Distinct dash pattern per modality for color-independent differentiation

### Territory Pattern Reference

| Modality | Fill Pattern | Stroke Pattern |
|----------|--------------|----------------|
| Detective | Diagonal stripes (forward) | Solid |
| Revolutionary | Diagonal stripes (back) | Long dash (12,6) |
| Superhero-Villain | Dots | Short dash (6,4) |
| Gangsta-Pimp | Crosshatch | Dot-dash (2,4,8,4) |
| Folk Hero-Outlaw | Wavy line | Double dash (4,2,2,2) |

### Overlapping Territories

Multiple figures frequently operate in the same geographic corridor (e.g., the Linwood corridor for Revolutionary figures). When territories overlap, polygons stack with transparency, and the pattern overlays preserve distinction. The rendering order is modality-stable (Revolutionary always on top of Detective, etc.) to avoid flicker when filters toggle.

---

## Primary Locations and Additional Locations

Each figure has one **primary location** (rendered as the figure's main marker) and zero or more **additional locations** (rendered as smaller secondary markers).

### Primary Location
- The figure's central geographic anchor — often a neighborhood, institution, or landmark
- Rendered with the full modality-shape marker
- Clicking opens the detail panel

### Additional Locations
- Secondary significant locations: residences, workplaces, sites of key events, institutional affiliations
- Rendered as smaller circular markers in the same modality color
- Each additional location has a `significance` field explaining its relevance
- Clicking an additional location opens a small popup with the location name and significance, not the full detail panel

### Locations Outside Detroit

Some figures have significant locations outside Detroit proper (e.g., Goines's time at Jackson State Prison, 80 miles west). These are included as additional locations when relevant. The map defaults to Detroit-centered view but users can pan/zoom to view out-of-city markers.

---

## Detail Panel Integration

Clicking a primary marker updates the shared detail panel on the right side of the page. The panel is the same across map.html, network.html, and any sr-only data table row activation — it is populated by the shared `showFigureDetails()` function in `scripts.js`.

### Panel Update Flow
1. User clicks a marker
2. The marker's figure object is passed to `showFigureDetails(figure, panelContentId, panelId)`
3. Panel innerHTML is rebuilt with biography, score breakdown, connections, and sources
4. Focus moves programmatically to the panel (for keyboard/screen reader users)
5. ARIA live region announces the panel update

See `JAVASCRIPT_DOCUMENTATION.md` for the full `showFigureDetails()` specification.

### Default Panel State

When no marker is selected, the panel displays: **"Select a figure from the map or the figures list below to view details."**

This language is required by WCAG 1.3.3 (Sensory Characteristics) — it does not assume visual interaction.

---

## Modality Filter

The MVT includes a modality filter that controls which figures and territories render. The mechanism is identical to the Network tool's filter.

### The `activeModalities` Array

A module-scoped array in `map.html` defines which modalities are currently rendered:

```javascript
const activeModalities = ['detective', 'revolutionary', 'superhero_villain'];
```

Modalities not in the array have their markers and territories filtered out before rendering. To activate a new modality when it goes live (e.g., Gangsta-Pimp), add the modality string to the array.

### Rendering Filter

Before rendering any marker or polygon, the MVT checks:

```javascript
if (!activeModalities.includes(figure.modality)) return;
```

This is applied consistently in three places:
1. Primary marker rendering loop
2. Territory polygon rendering loop
3. Screen-reader data table population

All three must check the same array, or the sr-only table will drift out of sync with the visual map.

### UI Controls

*[PLACEHOLDER: UI details pending Phase 3.5 filter UI lock. Populate with: checkbox/toggle component specification, placement within map.html, wiring to `activeModalities` array, dynamic re-render on toggle, preservation of detail panel state across filter changes, handling of pending (unrendered) modalities in the filter UI.]*

---

## Screen-Reader Data Table

The MVT includes a visually hidden but screen-reader-accessible data table that provides the same information as the visual map. This is required by WCAG 1.1.1 (Non-text Content) and serves as the non-visual interaction path specified in WCAG 1.3.3.

The table is placed after the `#map-container` element inside the same `<section>`, with class `sr-only` and an accessible label. Each row is keyboard-operable and triggers the same `showFigureDetails()` call as clicking a marker.

For the full table structure, population pattern, and interactive row behavior, see the "Screen-Reader Data Tables" section in `HTML_TEMPLATES.md`.

---

## File Structure

```
badman-archive/
├── data/
│   ├── detroit.json        # Data source for MVT and NVT
│   └── DATAREADME.md       # Data schema documentation
├── visualizations/
│   ├── map.html            # MVT page (HTML + embedded JS)
│   └── network.html        # NVT page
├── css/
│   └── styles.css          # Site-wide styles including legend classes
├── js/
│   └── scripts.js          # Site-wide scripts including showFigureDetails() and getModalityConfig()
└── docs/
    ├── MAPREADME.md        # This file
    ├── NVTREADME.md        # Network Visualization Tool docs
    └── HTML_TEMPLATES.md   # Page template and accessibility patterns
```

---

## Data Requirements

The MVT reads from `data/detroit.json`. Each figure requires the following fields:

### Required for Marker Display

```json
{
  "id": "figure_id",
  "name": "Display Name",
  "type": "real | fictional",
  "modality": "detective | revolutionary | superhero_villain | gangsta_pimp | folk_hero_outlaw",
  "meta_badman": false
}
```

### Required for Geographic Rendering

```json
{
  "geographic": {
    "primary_location": {
      "name": "Black Bottom",
      "coordinates": {
        "lat": 42.3355,
        "lng": -83.0370
      }
    },
    "territory": {
      "description": "Justification for polygon boundaries...",
      "polygon": [
        [42.3450, -83.0550],
        [42.3450, -83.0250],
        [42.3200, -83.0250],
        [42.3200, -83.0550]
      ]
    },
    "additional_locations": [
      {
        "name": "Highland Park residence",
        "coordinates": { "lat": 42.4056, "lng": -83.0977 },
        "significance": "Site of murder, October 21, 1974"
      }
    ]
  }
}
```

### Required for Detail Panel Population

```json
{
  "biography": { "description": "...", "key_events": [...] },
  "scores": { "outlaw_relationship": {...}, ... },
  "sources": { "primary": [...], "secondary": [...], "archival": [...] }
}
```

For the full schema and all field definitions, see `DATAREADME.md`.

---

## Code Structure

The MVT JavaScript is embedded in `map.html` within `<script>` tags at the bottom of the body. It consists of the following sections. *Code-level specifics are placeholders pending Phase 3 map.html refactor.*

### 1. Setup & Configuration
```javascript
// [PLACEHOLDER: container setup, Leaflet map initialization, default view coordinates and zoom]
```
*Purpose: Initialize the Leaflet map instance, set default Detroit-centered view, configure map controls.*

### 2. Tile Layer
```javascript
// [PLACEHOLDER: OpenStreetMap tile layer configuration, attribution, min/max zoom]
```
*Purpose: Add the base map tiles. Default is OpenStreetMap. Future: custom tile provider or historical overlays.*

### 3. Modality Configuration Access
```javascript
// [PLACEHOLDER: getModalityConfig() imports or references, icon definitions]
```
*Purpose: Pull modality marker shape, color, and icon from the single source of truth in scripts.js.*

### 4. Data Loading
```javascript
// [PLACEHOLDER: fetch('data/detroit.json'), error handling, pass data to render functions]
```
*Purpose: Load the JSON data file and pass it to the rendering functions.*

### 5. Modality Filter
```javascript
// [PLACEHOLDER: activeModalities array definition, filter check function]
```
*Purpose: Define which modalities are currently active for rendering. See Modality Filter section above.*

### 6. Primary Marker Rendering
```javascript
// [PLACEHOLDER: forEach figure, filter by activeModalities, build marker with shape/icon from getModalityConfig(), set alt text, attach click handler]
```
*Purpose: Render each figure's primary location as a modality-shaped marker with accessible alt text.*

### 7. Territory Polygon Rendering
```javascript
// [PLACEHOLDER: forEach figure, filter by activeModalities, build L.polygon with modality fill color, pattern overlay, stroke]
```
*Purpose: Render each figure's territory polygon with modality-specific fill pattern and stroke.*

### 8. Additional Location Rendering
```javascript
// [PLACEHOLDER: forEach additional_location, render smaller circular marker with popup showing name and significance]
```
*Purpose: Render secondary significant locations for each figure.*

### 9. Marker Click Handler
```javascript
// [PLACEHOLDER: call showFigureDetails(figure, 'info-content', 'info-panel') from scripts.js]
```
*Purpose: On marker click, delegate detail panel update to the shared function.*

### 10. Screen-Reader Data Table Population
```javascript
// [PLACEHOLDER: inside same JSON callback, build table rows, attach click and keydown handlers, filter by activeModalities]
```
*Purpose: Populate the sr-only data table in sync with the visual map. See HTML_TEMPLATES.md for the row template.*

### 11. Legend Population
```javascript
// [PLACEHOLDER: legend HTML is static but modality items visible/hidden based on activeModalities]
```
*Purpose: Sync the legend with active modalities.*

### 12. Accessibility Attributes
```javascript
// [PLACEHOLDER: aria-label on #map-container, role="img", focus management after panel updates]
```
*Purpose: Ensure accessibility attributes are applied after Leaflet initialization.*

---

## Customization

### Changing Colors

The MVT reads modality colors from `getModalityConfig()` in `scripts.js` and from the CSS variables in `styles.css`. Do not hardcode colors in map.html. To change a modality color:

1. Update the CSS variable in `styles.css` (e.g., `--dba-detective`)
2. Update the corresponding `color` value in `getModalityConfig()` in `scripts.js`
3. Update the Modality Visual Identity System table in `HTML_TEMPLATES.md`
4. Re-run the Color Contrast Reference Table verification

### Changing Marker Shapes

Marker shapes are defined in `getModalityConfig()` via the `markerShape` property. To change a shape:

1. Update the `markerShape` value in `getModalityConfig()` in `scripts.js`
2. Update the corresponding legend class in `styles.css` (`.legend-[modality]`)
3. Update the Modality Visual Identity System table in `HTML_TEMPLATES.md`

### Changing Default Map View

Edit the Leaflet setView call:

```javascript
var map = L.map('map-container').setView([42.3314, -83.0458], 12);
```

- `[42.3314, -83.0458]` — Default center coordinates (Detroit downtown)
- `12` — Default zoom level (higher = more zoomed in, range 1–18)

### Changing Tile Layer

To use different map tiles (e.g., Carto Voyager, Stamen Terrain, a historical overlay):

```javascript
L.tileLayer('[NEW_TILE_URL]', {
    attribution: '[NEW_ATTRIBUTION]',
    maxZoom: 19
}).addTo(map);
```

Verify the new tile layer's contrast against the archive's dark theme before committing.

### Adding New Modalities

When a new modality goes live:

1. Add the modality string to the `activeModalities` array in `map.html`
2. Verify `getModalityConfig()` includes the modality with color, shape, and icon
3. Add the modality's legend entry in map.html (copy the pattern from existing entries)
4. Verify the modality's CSS variables and legend classes exist in `styles.css`
5. Verify figures with the new modality in `detroit.json` have complete `geographic` data
6. Test on desktop and mobile; verify screen-reader data table updates

---

## Dependencies

| Library | Version | CDN |
|---------|---------|-----|
| Leaflet.js | 1.9.4 | `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js` |
| Leaflet CSS | 1.9.4 | `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css` |
| Bootstrap | 5.2.3 | `https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js` |
| Marker plugin | *[PLACEHOLDER: leaflet-extra-markers or leaflet-awesome-markers version]* | *[PLACEHOLDER]* |

No additional dependencies. All visualization logic is vanilla JavaScript.

---

## Browser Support

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires JavaScript enabled. SVG support required for marker rendering.

---

## Known Limitations

1. **Mobile**: Functional but not optimized for touch interaction or small screens. Territory polygon taps can be imprecise on small screens.
2. **Territory polygon overlap**: With three active modalities frequently operating in the same corridor (especially Linwood for Revolutionary figures), overlapping fills can become visually dense. Pattern overlays mitigate but do not eliminate this.
3. **Additional location density**: Figures with many additional locations (Obadele Brothers, Ron Scott) can create marker clutter at lower zoom levels. Marker clustering is not implemented at launch.
4. **Historical tile accuracy**: OpenStreetMap tiles reflect current Detroit geography. Historical landmarks (pre-urban renewal Black Bottom, Hastings Street, pre-I-375 corridors) are not visible as they existed during many figures' active periods. Historical overlays are a post-launch enhancement.
5. **Out-of-city locations**: Some figures have additional locations outside Detroit (Jackson State Prison, Stockholm for Dowdell). The map defaults to Detroit-centered view; users must pan/zoom to see these.

---

## Future Development

### Phase 2: Enhanced Interactivity
- Marker clustering at low zoom levels
- Search/filter by figure name
- Hover tooltips with quick info before click
- Keyboard shortcut (Escape) to close detail panel

### Phase 3: Historical Overlays
- Pre-urban renewal Black Bottom and Paradise Valley overlays
- Pre-1967 Rebellion corridor maps
- Historical tile provider integration (Rumsey, NYPL)

### Phase 4: Multi-City Support
- City selector dropdown
- Cross-city figure visualization (where connections warrant)
- Shared modality configuration across city modules

### Phase 5: Advanced Spatial Analysis
- Heatmap layer showing figure density across the city
- Modality-specific density analysis
- Timeline-based territory evolution (figures' territories changing over time)

---

## Troubleshooting

### Map doesn't appear
1. Check browser console for errors (F12 → Console)
2. Verify Leaflet CSS is loaded in `<head>` before any map-related CSS
3. Verify `#map-container` has explicit height in CSS (`height: 560px` or similar)
4. Confirm `detroit.json` exists in `/data/` folder and JSON validates

### Markers don't appear
1. Verify each figure has `geographic.primary_location.coordinates.lat` and `.lng`
2. Confirm coordinates are within expected bounds (lat 42.2–42.5, lng -83.3 to -82.9 for Detroit)
3. Check that the figure's `modality` is in the `activeModalities` array
4. Verify `getModalityConfig()` returns a valid object for the figure's modality

### Territory polygons don't appear
1. Verify `geographic.territory.polygon` has at least 4 coordinate pairs
2. Confirm each coordinate pair is `[lat, lng]` in array form, not an object
3. Check browser console for Leaflet polygon errors (typically malformed coordinates)
4. Verify the figure's modality is active in `activeModalities`

### Wrong marker shape or color
1. Verify the figure's `modality` string exactly matches a key in `getModalityConfig()` (lowercase, underscores)
2. Confirm CSS variables for that modality exist in `styles.css`
3. Check for cached CSS — hard refresh (Ctrl+Shift+R)

### Detail panel doesn't update on marker click
1. Verify `showFigureDetails()` is defined and imported from `scripts.js`
2. Confirm the panel element IDs passed to `showFigureDetails()` match the IDs in map.html
3. Check that the click handler calls `showFigureDetails(figure, 'info-content', 'info-panel')` with the correct figure object

### Screen-reader data table out of sync with map
1. Verify the table population loop uses the same `activeModalities` filter as the marker loop
2. Confirm table rows have `tabindex="0"`, `role="button"`, and keydown handlers
3. Test with NVDA or VoiceOver to confirm rows are announced and interactive

### Markers appear but alt text is generic ("Marker")
1. Verify `alt` is passed in the marker options: `L.marker([lat, lng], { icon, alt: figure.name + ' — ' + figure.modality + ' modality' })`
2. Confirm the marker plugin supports custom alt text (some plugins override it)

---

## Contributing

When modifying the MVT:

1. Test with browser console open to catch errors
2. Verify all figures from all active modalities render at default zoom
3. Toggle `activeModalities` values and confirm markers/territories/table update correctly
4. Click each figure's marker — verify detail panel populates
5. Tab through the page with keyboard — verify focus is visible and map controls are reachable
6. Run WAVE and axe on map.html — address any new violations
7. Test on mobile (Chrome DevTools responsive mode minimum, real device preferred)
8. Update this README if adding features or changing mechanisms

---

## Credits

- **Leaflet.js**: Vladimir Agafonkin and contributors (BSD-2-Clause)
- **OpenStreetMap tiles**: © OpenStreetMap contributors (ODbL)
- **Design**: Detroit Badman Archive project, CHI Fellowship, Michigan State University

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | *[PLACEHOLDER: date]* | Initial implementation: Leaflet map, primary markers, territory polygons, detail panel integration |
| 1.1 | *[PLACEHOLDER: date]* | Modality shape markers replacing color-only differentiation; accessibility remediation per March 2026 audit |
| 2.0 | *[PLACEHOLDER: date]* | Three-modality launch: Detective, Revolutionary, Superhero-Villain. Modality filter UI (Phase 3.5). Screen-reader data table. |
