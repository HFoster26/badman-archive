# Detroit Badman Archive - Data Schema Documentation

This document explains the JSON schema used in `detroit.json` and any future city data files. It is intended for graduate students translating spreadsheet data into JSON and for anyone maintaining or expanding the archive.

---

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

**Design Principle:** This single JSON file feeds both the Map visualization tool and the Network Visualization Tool (NVT). Fields are organized into buckets that each tool reads from. Empty or null values are valid—tools render what's available and gracefully skip what's missing.

---

## Figure Object Structure

Each figure in the `figures` array contains seven data buckets:

1. **Identity** — Who they are
2. **Emergence** — When and why their contentious relationship with law began
3. **Scores** — Five-criteria badman evaluation
4. **Biography** — Description and key events
5. **Geographic** — Location and territory data (Map tool)
6. **Network** — Connections and influence trajectory (NVT)
7. **Sources** — Primary and secondary references

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
| `meta_badman` | boolean | True if figure is both subject AND creator of badman narratives | `true` |
| `years.birth` | integer \| null | Birth year | `1936` |
| `years.death` | integer \| null | Death year (null if living) | `1974` |

**For Fictional Figures:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `medium` | string | Origin medium | `"print"`, `"film"`, `"television"`, `"music"`, `"comics"` |
| `creator_id` | string \| null | ID of creator figure if in database | `"goines_donald"` |
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

## Bucket 2: Emergence

**This bucket is critical for NVT timeline functionality.**

Emergence captures when and why this figure's contentious relationship with the law began—the moment they became a badman, not when they were born or when a book was published.

```json
"emergence": {
  "year": 1955,
  "context": "First arrest for robbery at age 15; began cycling through Michigan correctional system",
  "source": {
    "title": "Eddie Allen, Low Road: The Life and Legacy of Donald Goines",
    "url": "https://..."
  }
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `year` | integer | Yes | Year contentious relationship with law began |
| `context` | string | Yes | 1-2 sentence explanation of what triggered emergence |
| `source` | object \| null | No | Attribution for emergence claim |

### Emergence Guidelines by Figure Type

| Type | What "Emergence" Means | Example |
|------|------------------------|---------|
| **Real person** | First documented conflict with legal system OR first act of community-authorized resistance | Ron Scott: 1968 (co-founded Detroit BPP) |
| **Fictional character** | Year of first publication/release | Kenyatta: 1974 (Crime Partners published) |
| **Meta-badman** | Year their personal badman behavior began, NOT when they started writing | Goines: 1955 (first arrest), not 1970 (first novel) |

---

## Bucket 3: Scores

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

## Bucket 4: Biography

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

## Bucket 5: Geographic

Location data for Map visualization tool.

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
  },
  "additional_locations": [
    {
      "name": "Highland Park residence",
      "coordinates": { "lat": 42.4056, "lng": -83.0977 },
      "significance": "Site of murder, October 21, 1974"
    }
  ]
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `primary_location.name` | string | Yes | Human-readable location name |
| `primary_location.coordinates.lat` | float | Yes | Latitude (decimal degrees) |
| `primary_location.coordinates.lng` | float | Yes | Longitude (decimal degrees) |
| `territory.description` | string | Yes | Justification for polygon boundaries |
| `territory.polygon` | array | Yes | Array of [lat, lng] coordinate pairs forming closed shape |
| `additional_locations` | array | No | Other significant locations |

### Polygon Guidelines

- Minimum 4 coordinate pairs to form a closed shape
- Coordinates should trace the boundary clockwise or counter-clockwise
- Use key events locations as evidence for polygon boundaries
- Territory description should reference specific locations and time periods

---

## Bucket 6: Network

**This bucket powers the Network Visualization Tool (NVT).**

Contains two sub-sections: connections (edges between figures) and influence trajectory (material footprint over time).

### 6a: Connections

```json
"connections": [
  {
    "target_id": "kenyatta",
    "type": "META",
    "direction": "outgoing",
    "evidence": "Goines created Kenyatta character under pseudonym Al C. Clark in Crime Partners (1974)"
  }
]
```

### Connection Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `target_id` | string | Yes | The `id` of the connected figure |
| `type` | string | Yes | Connection type code (see below) |
| `direction` | string | Yes | `"outgoing"`, `"incoming"`, or `"mutual"` |
| `evidence` | string | Yes | Documented proof of connection |

### Connection Types

| Code | Name | Direction | Description | Example |
|------|------|-----------|-------------|---------|
| `P2C` | Person ↔ Creator | outgoing or incoming | Real figure inspires fiction OR fiction inspires real person's actions | Malcolm X → Dan Freeman |
| `C2C` | Creator ↔ Creator | outgoing, incoming, or mutual | One artist's work directly influences another artist's work | Goines → later street lit authors |
| `GEO` | Geographic Inspiration | outgoing | Place/events shape a person's actions or an artist's creative output | 1967 Rebellion → Ron Scott's radicalization |
| `META` | Meta-Badman → Creation | outgoing | Real person creates fictional figure (subset of P2C but distinct) | Goines → Kenyatta |

### Direction Rules

- **Outgoing:** This figure influenced/created the target
- **Incoming:** This figure was influenced by the target
- **Mutual:** Bidirectional influence (rare; use sparingly)

**Storage rule:** Store connections on the originating figure. The NVT code will infer reverse connections for display.

### 6b: Influence Trajectory

**This is the "material footprint" data—how much cultural space the badman occupied over time.**

```json
"influence_trajectory": [
  {
    "year": 1971,
    "metric_type": "copies_sold",
    "value": 15000,
    "value_label": "15,000 copies",
    "geography": ["Detroit", "Chicago"],
    "confidence": "estimated",
    "source": {
      "title": "Low Road: The Life and Legacy of Donald Goines",
      "url": "https://..."
    }
  },
  {
    "year": 1974,
    "metric_type": "copies_sold",
    "value": 125000,
    "value_label": "125,000 copies",
    "geography": ["national"],
    "confidence": "reported",
    "source": {
      "title": "Goines obituary, Jet Magazine",
      "url": null
    }
  }
]
```

### Influence Trajectory Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `year` | integer | Yes | Year of this data point |
| `metric_type` | string | Yes | Type of metric (see below) |
| `value` | integer | Yes | Numeric value for calculations/visualization |
| `value_label` | string | Yes | Human-readable display string |
| `geography` | array | No | Where this influence was felt |
| `confidence` | string | Yes | Data quality flag (see below) |
| `source` | object | Yes | Attribution (url can be null) |

### Metric Types

| Code | Description | Typical Figures |
|------|-------------|-----------------|
| `copies_sold` | Book/comic sales | Print figures (Goines, Kenyatta) |
| `copies_printed` | Print run size (when sales unknown) | Print figures |
| `box_office` | Theatrical revenue | Film figures (Action Jackson) |
| `tv_ratings` | Viewership numbers | Television figures |
| `event_attendance` | Rally/speech/event turnout | Revolutionary figures (Scott, Baker) |
| `newspaper_mentions` | Coverage volume in press | All figures |
| `arrests` | Number of arrests (real figures) | Real figures with documented records |
| `strikes_participation` | Workers involved in labor actions | Labor figures (Baker) |

### Confidence Levels

| Level | Meaning | Example |
|-------|---------|---------|
| `verified` | Hard data from official source | Box office from Box Office Mojo |
| `reported` | Cited in reliable secondary source | "Over 500,000 sold" per obituary |
| `estimated` | Scholarly estimate or extrapolation | Academic source calculates based on print runs |
| `unknown` | Placeholder awaiting research | Value set to 0 or null |

---

## Bucket 7: Sources

References for the figure entry.

```json
"sources": {
  "primary": [
    {
      "title": "Crime Partners",
      "type": "novel",
      "year": 1974,
      "url": "https://www.goodreads.com/book/show/115038.Crime_Partners"
    }
  ],
  "secondary": [
    {
      "title": "Born in a Mighty Bad Land: The Violent Man in African American Folklore and Fiction",
      "type": "academic",
      "year": 2003,
      "url": "https://iupress.org/"
    }
  ],
  "archival": [
    {
      "title": "COINTELPRO Files - Detroit Field Office",
      "type": "government",
      "repository": "National Archives",
      "url": null,
      "notes": "Requires in-person visit; relevant to Scott entry"
    }
  ]
}
```

### Source Categories

| Category | Description | Examples |
|----------|-------------|----------|
| `primary` | Direct sources documenting the figure | Novels, films, speeches, news articles |
| `secondary` | Scholarly analysis about the figure | Academic books, journal articles, dissertations |
| `archival` | Materials requiring institutional access | COINTELPRO files, Reuther Library collections, museum holdings |

### Source Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Source title |
| `type` | string | Yes | Source format (novel, film, academic, news, government, etc.) |
| `year` | integer | No | Publication/release year |
| `url` | string \| null | Yes | Link to source (null if no web access) |
| `repository` | string | No | Physical location for archival sources |
| `notes` | string | No | Access notes, relevance explanation |

---

## Handling Incomplete Data

**Core principle:** Empty or null values are valid. The archive is designed for incremental completion.

### Nullable Fields

These fields accept `null` when data is unavailable:

- `years.death` (for living figures)
- `creator_id` (if creator not in database)
- `source.url` (for archival/physical sources)
- `influence_trajectory` (can be empty array `[]`)
- `additional_locations` (can be empty array `[]`)
- `adaptations` (can be empty array `[]`)

### Placeholder Pattern

For fields requiring future research, use this pattern:

```json
"influence_trajectory": [
  {
    "year": 1968,
    "metric_type": "event_attendance",
    "value": 0,
    "value_label": "Unknown - requires archival research",
    "geography": ["Detroit"],
    "confidence": "unknown",
    "source": {
      "title": "Pending: Reuther Library visit",
      "url": null
    }
  }
]
```

This creates a visible placeholder that:
1. Shows up in data audits
2. Documents what research is needed
3. Doesn't break visualization code

---

## Data Entry Workflow

### For Undergraduates (Spreadsheet Entry)

1. Fill out all fields in plain language
2. For locations, provide street names and neighborhood descriptions
3. For connections, describe relationships in sentences
4. For influence metrics, note what you found and where
5. Flag uncertain information with "NEEDS VERIFICATION"
6. Note sources for every claim

### For Graduate Students (JSON Translation)

1. Convert spreadsheet data to JSON format
2. Look up coordinates for locations using Google Maps or OpenStreetMap
3. Draw territory polygons based on key events and location descriptions
4. Create proper `target_id` references for connections
5. Assign appropriate `confidence` levels to influence data
6. Validate JSON syntax before committing
7. Run through validation checklist

### For Project Director (Quality Control)

1. Review all new entries against five-criteria framework
2. Verify connection evidence is documented
3. Check that influence trajectory sources are cited
4. Approve entries for public dataset

---

## Common Errors to Avoid

### JSON Syntax

- **Missing commas:** Every object in an array needs a comma after it, except the last one
- **Extra commas:** No comma after the last item in an array or object
- **Quote marks:** All strings must use double quotes `"`, not single quotes `'`
- **Brackets:** Arrays use `[]`, objects use `{}`
- **Null values:** Use `null` (no quotes), not `"null"`

### Data Consistency

- **ID format:** Always lowercase with underscores: `baker_gordon` not `Baker_Gordon`
- **Coordinate order:** Always `lat, lng` in objects; `[lat, lng]` in polygon arrays
- **Year format:** Use integers `1968` not strings `"1968"`
- **Target IDs:** Must exactly match the `id` field of another figure in the dataset
- **Connection direction:** Store on originating figure with `"outgoing"`

---

## Validation Checklist

Before committing new entries:

### Required Fields
- [ ] `id` is unique and follows naming convention
- [ ] `name` is present
- [ ] `type` is either `"real"` or `"fictional"`
- [ ] `modality` is valid (`detective`, `revolutionary`, etc.)
- [ ] `emergence.year` and `emergence.context` are present

### Scores
- [ ] All five scores present with `score` (1-5) and `justification`

### Geographic
- [ ] `primary_location` has name and valid coordinates
- [ ] `territory.polygon` has at least 4 coordinate pairs
- [ ] Coordinates are valid (lat: -90 to 90, lng: -180 to 180)

### Network
- [ ] All `target_id` values match existing figure `id` fields
- [ ] All connections have `type`, `direction`, and `evidence`
- [ ] Influence trajectory entries have `confidence` and `source`

### Technical
- [ ] JSON syntax validates (use jsonlint.com or similar)
- [ ] URLs are functional (or explicitly `null`)
- [ ] No trailing commas

---

## Tool Data Requirements

Quick reference for which buckets each visualization tool requires:

| Bucket | Map Tool | NVT | Notes |
|--------|----------|-----|-------|
| Identity | ✅ Required | ✅ Required | Both tools need basic identification |
| Emergence | ❌ Not used | ✅ Required | NVT timeline axis |
| Scores | ❌ Not used | ⚠️ Optional | Can size nodes by total score |
| Biography | ⚠️ Optional | ⚠️ Optional | Detail panels in both tools |
| Geographic | ✅ Required | ❌ Not used | Map markers and polygons |
| Network | ❌ Not used | ✅ Required | Connections and trajectory |
| Sources | ⚠️ Optional | ⚠️ Optional | Attribution in detail panels |

---

## Adding New Modalities

The current dataset includes `detective` and `revolutionary` modalities. Future expansion may include:

- `folk_hero_outlaw` — Post-Emancipation folk figures
- `gangsta_pimp` — 1970s-present street figures  
- `superhero_villain` — Comic and screen superheroes/villains

When adding new modalities:
1. Update this documentation
2. Update the main project README
3. Add color coding to both visualization tools
4. Create at least one example entry

---

## Adding New Cities

When expanding beyond Detroit:

1. Create new JSON file: `[city].json`
2. Follow identical schema structure
3. Update any cross-city connections with full `city:id` references
4. Add city to main site navigation

---

## Questions?

Contact the project director or consult the main project README for broader context about the Badman Archive and its theoretical framework.
