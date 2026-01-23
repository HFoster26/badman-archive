# Detroit Badman Archive - Data Schema Documentation

This document explains the JSON schema used in `detroit.json` and any future city data files. It is intended for graduate students translating spreadsheet data into JSON and for anyone maintaining or expanding the archive.

## Overview

Each city's data lives in a single JSON file (e.g., `detroit.json`, `atlanta.json`). The file contains two top-level fields:

```json
{
  "city": "detroit",
  "figures": [ ... ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `city` | string | City identifier (lowercase, no spaces) |
| `figures` | array | Array of badman figure objects |

---

## Figure Object Structure

Each figure in the `figures` array contains six data buckets:

1. **Identity** — Who they are
2. **Scores** — Five-criteria badman evaluation
3. **Biography** — Description and key events
4. **Geographic** — Location and territory data
5. **Network** — Connections to other figures
6. **Sources** — Primary and secondary references

---

## Bucket 1: Identity

Core identifying information for each figure.

### Required Fields (All Figures)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique identifier (lowercase, underscores) | `"goines_donald"` |
| `name` | string | Display name | `"Donald Goines"` |
| `type` | string | `"real"` or `"fictional"` | `"real"` |
| `modality` | string | Badman modality classification | `"detective"` or `"revolutionary"` |

### Conditional Fields

**For Real Figures:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `meta_badman` | boolean | True if figure is both subject and creator of badman narratives | `true` |
| `years.birth` | integer | Birth year | `1936` |
| `years.death` | integer | Death year | `1974` |
| `years.active_start` | integer | Year badman behavior began | `1955` |
| `years.active_end` | integer | Year badman behavior ended | `1974` |

**For Fictional Figures:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `medium` | string | Origin medium | `"print"`, `"film"`, `"television"`, `"music"`, `"comics"` |
| `years.material_start` | integer | First physical release year | `1974` |
| `years.material_end` | integer | Last physical release year | `1975` |
| `adaptations` | array | Subsequent media appearances (see below) | `[]` |

### Adaptations Array (Fictional Figures Only)

For transmedia figures who appear in multiple media:

```json
"adaptations": [
  {
    "medium": "film",
    "year": 2028,
    "title": "Kenyatta Rising"
  }
]
```

---

## Bucket 2: Scores

The five-criteria badman evaluation system. Each figure is scored 1-5 on five dimensions. Total score (out of 25) is calculated automatically by the visualization code—do not store the total.

```json
"scores": {
  "outlaw_relationship": {
    "score": 5,
    "justification": "Explanation of why this score was assigned..."
  },
  "community_authorization": {
    "score": 5,
    "justification": "..."
  },
  "violence_as_language": {
    "score": 5,
    "justification": "..."
  },
  "cultural_preservation": {
    "score": 5,
    "justification": "..."
  },
  "hypermasculine_performance": {
    "score": 5,
    "justification": "..."
  }
}
```

### Scoring Criteria Definitions

| Criterion | Description | Score 1 | Score 5 |
|-----------|-------------|---------|---------|
| `outlaw_relationship` | Relationship to legal systems | Works within law | Completely outside/against law |
| `community_authorization` | Recognition from Black communities | No community support | Full community authorization |
| `violence_as_language` | Use of force as expression | Non-violent | Violence as primary mode |
| `cultural_preservation` | Role in maintaining Black cultural knowledge | No preservation function | Central to cultural transmission |
| `hypermasculine_performance` | Embodiment of Black masculine heroic ideals | Minimal masculine performance | Peak hypermasculinity |

---

## Bucket 3: Biography

Narrative information about the figure.

### Required Fields (All Figures)

| Field | Type | Description |
|-------|------|-------------|
| `biography.description` | string | 200-300 word biographical overview |
| `biography.key_events` | array | Structured timeline of significant events |

### Key Events Array

Each event is an object with year, event description, and location:

```json
"key_events": [
  {
    "year": 1968,
    "event": "Co-founded Detroit chapter of Black Panther Party",
    "location": "Detroit, MI"
  }
]
```

**Note:** For fictional figures, append `"(fictional)"` to locations that exist only in the narrative.

### Additional Fields (Fictional Figures Only)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `biography.creator` | string | Creator/author name | `"Donald Goines (as Al C. Clark)"` |
| `biography.source_text` | string | Original source title | `"Crime Partners (1974)"` |

---

## Bucket 4: Geographic

Location data for map visualization.

```json
"geographic": {
  "primary_location": {
    "name": "Black Bottom",
    "coordinates": {
      "lat": 42.3355,
      "lng": -83.0370
    }
  },
  "territory": {
    "description": "Plain text explanation of why this territory was assigned...",
    "polygon": [
      [42.3450, -83.0550],
      [42.3450, -83.0250],
      [42.3200, -83.0250],
      [42.3200, -83.0550]
    ]
  }
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `primary_location.name` | string | Human-readable location name |
| `primary_location.coordinates.lat` | float | Latitude (decimal degrees) |
| `primary_location.coordinates.lng` | float | Longitude (decimal degrees) |
| `territory.description` | string | Justification for polygon boundaries |
| `territory.polygon` | array | Array of [lat, lng] coordinate pairs forming closed shape |

### Polygon Guidelines

- Minimum 4 coordinate pairs to form a closed shape
- Coordinates should trace the boundary clockwise or counter-clockwise
- Use key events locations as evidence for polygon boundaries
- Territory description should reference specific locations and time periods

---

## Bucket 5: Network

Connections between figures for network visualization.

```json
"connections": [
  {
    "target_id": "kenyatta",
    "relationship": "creator_to_creation",
    "direction": "one-way",
    "description": "Goines created Kenyatta under pseudonym Al C. Clark."
  }
]
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `target_id` | string | The `id` of the connected figure |
| `relationship` | string | Type of connection (see below) |
| `direction` | string | `"one-way"` or `"two-way"` |
| `description` | string | Explanation of the connection |

### Relationship Types

| Type | Direction | Description |
|------|-----------|-------------|
| `creator_to_creation` | one-way | Author/creator to fictional character |
| `inspiration` | one-way | Real figure inspired fictional character, OR fictional character inspired real person |
| `ideological_alignment` | two-way | Shared politics, movement membership, organizational ties |
| `geographic_convergence` | two-way | Operated in same territory during overlapping time periods |

### Direction Rules

- **One-way connections:** Store on the originating figure only
- **Two-way connections:** Store on one figure only; code infers the reverse

---

## Bucket 6: Sources

References for the figure entry.

```json
"sources": {
  "primary": [
    {
      "title": "Crime Partners",
      "url": "https://www.goodreads.com/book/show/115038.Crime_Partners"
    }
  ],
  "secondary": [
    {
      "title": "Born in a Mighty Bad Land",
      "url": "https://iupress.org/"
    }
  ]
}
```

### Source Types

| Type | Description | Examples |
|------|-------------|----------|
| `primary` | Direct sources documenting the figure | Novels, films, speeches, news articles, archival documents |
| `secondary` | Scholarly analysis about the figure | Academic articles, books, dissertations |

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Source title |
| `url` | string | Link to source (use stable URLs when possible) |

**Note:** Full bibliographic information (author, year, publisher) lives on the Resources page, not in the JSON.

---

## Data Entry Workflow

### For Undergraduates (Spreadsheet Entry)

1. Fill out all fields in plain language
2. For locations, provide street names and neighborhood descriptions
3. For connections, describe relationships in sentences
4. Flag any uncertain information

### For Graduate Students (JSON Translation)

1. Convert spreadsheet data to JSON format
2. Look up coordinates for locations
3. Draw territory polygons based on key events and location descriptions
4. Create proper `target_id` references for connections
5. Validate JSON syntax before committing

---

## Common Errors to Avoid

### JSON Syntax

- **Missing commas:** Every object in an array needs a comma after it, except the last one
- **Extra commas:** No comma after the last item in an array or object
- **Quote marks:** All strings must use double quotes `"`, not single quotes `'`
- **Brackets:** Arrays use `[]`, objects use `{}`

### Data Consistency

- **ID format:** Always lowercase with underscores: `baker_gordon` not `Baker_Gordon`
- **Coordinate order:** Always `[lat, lng]` not `[lng, lat]`
- **Year format:** Use integers `1968` not strings `"1968"`
- **Target IDs:** Must exactly match the `id` field of another figure in the dataset

---

## Validation Checklist

Before committing new entries:

- [ ] JSON syntax validates (use a JSON validator)
- [ ] All required fields present
- [ ] `id` is unique and follows naming convention
- [ ] `type` is either `"real"` or `"fictional"`
- [ ] All five scores have both `score` (1-5) and `justification`
- [ ] `target_id` in connections matches existing figure `id`
- [ ] Coordinates are valid (lat: -90 to 90, lng: -180 to 180)
- [ ] URLs are functional

---

## Adding New Modalities

The current dataset includes `detective` and `revolutionary` modalities. Future expansion may include:

- `folk_hero_outlaw` — Post-Emancipation folk figures
- `gangsta_pimp` — 1970s-present street figures
- `superhero_villain` — Comic and screen superheroes/villains

When adding new modalities, update this documentation and the main README.

---

## Questions?

Contact the project director or consult the main project README for broader context about the Badman Archive and its theoretical framework.
