# Detroit Badman Archive — Data Schema Documentation

**Last Updated:** April 2026
**Version:** 2.1
**Change Log:** Removed GEO edge type. Added CC (Creation Continuity) edge type. Flipped SVM modality from "Staged" to "Active." Added Special Entry Types section documenting `_placeholder` / `_instructions` pattern. Updated modality status to reflect three-modality launch (Detective, Revolutionary, Superhero-Villain). Hex codes normalized to uppercase. Figure-by-figure modality tables removed; live site is source of truth for roster.

---

This document explains the JSON schema used in `detroit.json` and any future city data files. It is intended for graduate students translating spreadsheet data into JSON and for anyone maintaining or expanding the archive.

---

## Launch State

At launch (May 2026), the Detroit module includes **15 figures across 3 active modalities**:

| Modality | Status | Figures at Launch | Notes |
|----------|--------|-------------------|-------|
| Detective | Active | 5 | Renders on map and network |
| Political Revolutionary | Active | 5 | Renders on map and network |
| Superhero-Villain | Active | 5 | Renders on map and network |
| Gangsta-Pimp | Dormant | 1 | Entry exists (Goines) but filtered from rendering pending modality activation |
| Folk Hero-Outlaw | Future | 0 | Reserved; no entries yet |

The complete figure roster is available on the [live site](https://detroit.badmandigitalarchive.com). This schema documentation does not maintain a figure-by-figure list because the live site is the source of truth for current archive state.

---

## Overview

Each city's data lives in a single JSON file (e.g., `detroit.json`, `atlanta.json`). The file contains two top-level fields plus two visualization configuration objects:

```json
{
  "city": "detroit",
  "edge_types": { ... },
  "evidence_tiers": { ... },
  "figures": [ ... ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `city` | string | City identifier (lowercase, no spaces) |
| `edge_types` | object | Network edge type definitions (color, label) — used by NVT |
| `evidence_tiers` | object | Evidence tier definitions (line style, opacity) — used by NVT |
| `figures` | array | Array of badman figure objects |

### Top-Level: Edge Types

Defines the visual styling for connection types in the Network Visualization Tool:

```json
"edge_types": {
  "META": { "label": "Creator → Creation", "color": "#D4AF37" },
  "P2C":  { "label": "Person → Creation",  "color": "#DC3545" },
  "C2C":  { "label": "Creator ↔ Creator",  "color": "#50C878" },
  "ORG":  { "label": "Organizational / Ideological", "color": "#3388FF" },
  "CC":   { "label": "Creation Continuity", "color": "#E83E8C" }
}
```

### Top-Level: Evidence Tiers

Defines the visual styling for connection evidence quality in the NVT:

```json
"evidence_tiers": {
  "1": { "label": "Documented",             "line_style": "solid",  "opacity": 0.9  },
  "2": { "label": "Evidenced (unverified)", "line_style": "dashed", "opacity": 0.6  },
  "3": { "label": "Interpretive",           "line_style": "dotted", "opacity": 0.35 }
}
```

**Design Principle:** This single JSON file feeds both the Map visualization tool and the Network Visualization Tool (NVT). Fields are organized into buckets that each tool reads from. Empty or null values are valid — tools render what's available and gracefully skip what's missing.

---

## Special Entry Types

Beyond standard figure objects, the `figures` array includes two special entry types that serve file-navigation and workflow purposes. Both are filtered out during rendering and have no effect on visualizations.

### Placeholder Entries

Each modality section in the JSON contains a placeholder entry marking where new figure entries should be inserted. Placeholders use this exact structure:

```json
{
  "_divider": "────────── [MODALITY]: ADD NEW ENTRY HERE ──────────",
  "_placeholder": true,
  "_instructions": "Copy a complete figure object from an existing entry, replace all fields, and remove _placeholder and _instructions fields. Refer to BDA_Data_Schema_Documentation.md for field requirements."
}
```

**Fields:**

| Field | Type | Purpose |
|-------|------|---------|
| `_divider` | string | Visual separator naming the modality and signaling the insertion point |
| `_placeholder` | boolean | Set to `true` to flag the entry for filtering during rendering |
| `_instructions` | string | Plain-language guidance for graduate students adding new entries |

**Placement convention:** One placeholder per modality group, positioned at the end of that modality's figures. The placeholder sits between the last active figure and the next modality's entries (or the end of the array).

**When you add a new figure:**
1. Copy a complete figure object from an existing same-modality entry
2. Paste it **above** the placeholder (inside the same modality group)
3. Replace all fields with the new figure's data
4. Do NOT remove the placeholder — it stays as the insertion point for the next entry

**Rendering behavior:** Both the map tool and the network tool filter out any entry where `_placeholder === true`. The sr-only data tables also skip these entries. Placeholders are invisible to users.

### Divider-Only Entries

Currently, the FHOM (Folk Hero-Outlaw Modality) section contains a divider-only placeholder because no figures exist in that modality yet:

```json
{
  "_divider": "══════════ FOLK HERO-OUTLAW MODALITY ══════════",
  "_placeholder": true,
  "_instructions": "FHOM modality reserved for future expansion..."
}
```

When the first FHOM figure is added, this entry is replaced with a standard modality opener divider and the new figure object, plus a fresh `ADD NEW ENTRY HERE` placeholder.

---

## Entry Separation and Ordering

### Ordering Convention

Figures in the `figures` array should be grouped by modality in the following order:

1. `gangsta_pimp` (dormant until GPM goes live)
2. `revolutionary`
3. `detective`
4. `superhero_villain`
5. `folk_hero_outlaw`

Within each modality group, order figures by `emergence.year` (earliest first).

### Visual Separation

JSON does not support comments, but each figure object includes a `_divider` field as its first property to create scannable separation when reading the raw file:

```json
{
  "_divider": "══════════ REVOLUTIONARY MODALITY ══════════",
  "id": "scott_ron",
  "name": "Ron Scott",
  ...
}
```

The `_divider` field is ignored by all visualization code. It exists solely to help human editors navigate the file. Use these formats:

- `"══════════ [MODALITY] MODALITY ══════════"` — Major modality section opener (double-bar equals, used for the first figure in each modality group)
- `"────────── [MODALITY]: [figure name] ──────────"` — Individual figure separator within a modality group

---

## Figure Object Structure

Each figure in the `figures` array contains seven data buckets:

1. **Identity** — Who they are
2. **Emergence** — When and why their contentious relationship with law began
3. **Scores** — Five-criteria badman evaluation
4. **Biography** — Description and key events
5. **Geographic** — Location and territory data (Map tool)
6. **Network** — Connections and influence phases (NVT)
7. **Sources** — Primary, secondary, and archival references

---

## Bucket 1: Identity

Core identifying information for each figure.

### Required Fields (All Figures)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique identifier (lowercase, underscores) | `"goines_donald"` |
| `name` | string | Display name | `"Donald Goines"` |
| `type` | string | `"real"` or `"fictional"` | `"real"` |
| `modality` | string | Badman modality classification | `"detective"`, `"revolutionary"`, `"gangsta_pimp"`, `"superhero_villain"`, `"folk_hero_outlaw"` |
| `meta_badman` | boolean | True if figure is both subject AND creator of badman narratives | `true` |

### Conditional Fields

**For Real Figures:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `years.birth` | integer \| null | Birth year | `1936` |
| `years.death` | integer \| null | Death year (null if living) | `1974` |
| `years.active_start` | integer | Year active period begins | `1970` |
| `years.active_end` | integer | Year active period ends | `1974` |

**For Fictional Figures:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `medium` | string | Origin medium | `"print"`, `"film"`, `"television"`, `"music"`, `"comics"` |
| `genre` | string | Specific genre within medium | `"action"`, `"revolutionary_fiction"`, `"detective_fiction"`, `"street_lit"`, `"superhero"`, `"noir"` |
| `creator_id` | string \| null | ID of creator figure if in database | `"goines_donald"` |
| `years.active_start` | integer | Year of first appearance | `1988` |
| `years.active_end` | integer | Year of last appearance (same as start if single work) | `1988` |
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

### Internal Flags (Optional)

These fields are used for project management and are ignored by visualization code:

| Field | Type | Description |
|-------|------|-------------|
| `_divider` | string | Visual separator for human readability in raw JSON |
| `_modality_note` | string | Notes about modality assignment decisions or pending changes |
| `_REVIEW_NEEDED` | string | Flags fields requiring revision (can appear on any object within the figure) |
| `_placeholder` | boolean | Set to `true` on special insertion-point entries (see Special Entry Types) |
| `_instructions` | string | Plain-language guidance accompanying `_placeholder` entries |

---

## Bucket 2: Emergence

**This bucket is critical for NVT timeline functionality.**

Emergence captures when and why this figure's contentious relationship with the law began — the moment they became a badman, not when they were born or when a book was published.

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
| `context` | string | Yes | 1–2 sentence explanation of what triggered emergence |
| `source` | object \| null | No | Attribution for emergence claim |

### Emergence Guidelines by Figure Type

| Type | What "Emergence" Means | Example |
|------|------------------------|---------|
| **Real person** | First documented conflict with legal system OR first act of community-authorized resistance | Ron Scott: 1968 (co-founded Detroit BPP) |
| **Fictional character** | Year of first publication/release | Kenyatta: 1974 (Crime Partners published) |
| **Meta-badman** | Year their personal badman behavior began, NOT when they started writing | Goines: 1955 (first arrest), not 1970 (first novel) |

---

## Bucket 3: Scores

The five-criteria badman evaluation system. Each figure is scored 1–5 on five dimensions. Total score (out of 25) is calculated automatically by the visualization code — do not store the total.

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

A `_REVIEW_NEEDED` string can be added at the same level as the score fields to flag entries requiring re-evaluation:

```json
"scores": {
  "outlaw_relationship": { ... },
  ...
  "_REVIEW_NEEDED": "All scores require re-evaluation against GPM modality criteria."
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
| `biography.description` | string | 200–300 word biographical overview |
| `biography.key_events` | array | Structured timeline of significant events |

### Key Events Array

Each event is an object with year, event description, and (optionally) location:

```json
"key_events": [
  {
    "year": 1968,
    "event": "Co-founded Detroit chapter of Black Panther Party",
    "location": "Detroit, MI"
  }
]
```

**Notes:**
- For fictional figures, append `"(fictional)"` to locations that exist only in the narrative.
- The `location` field is optional — some key events (e.g., for paired figures with extensive timelines) may omit it when the location is implicit or documented in geographic data.

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

Contains two sub-sections: connections (edges between figures) and influence (material footprint over time).

### 6a: Connections

```json
"connections": [
  {
    "target_id": "kenyatta",
    "type": "META",
    "direction": "outgoing",
    "tier": 1,
    "start_year": 1974,
    "end_year": 1975,
    "evidence": "Goines created Kenyatta character under pseudonym Al C. Clark in Crime Partners (1974)",
    "source": "Holloway House publication records; novels carry Al C. Clark pseudonym"
  }
]
```

### Connection Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `target_id` | string | Yes | The `id` of the connected figure |
| `type` | string | Yes | Connection type code (see Connection Types below) |
| `direction` | string | Yes | `"outgoing"`, `"incoming"`, or `"mutual"` |
| `tier` | integer | Yes | Evidence quality tier: `1` (Documented), `2` (Evidenced), `3` (Interpretive) |
| `start_year` | integer | Yes | Year the connection began |
| `end_year` | integer | Yes | Year the connection ended (can equal `start_year` for single events) |
| `evidence` | string | Yes | Documented proof of connection |
| `source` | string | Yes | Citation for the evidence claim |

### Connection Types

| Code | Name | Direction | Description | Example |
|------|------|-----------|-------------|---------|
| `META` | Meta-Badman → Creation | outgoing | Real person creates fictional figure | Goines → Kenyatta |
| `P2C` | Person → Creation | outgoing or incoming | Real figure inspires fiction OR fiction inspires real person's actions | Malcolm X → Dan Freeman |
| `C2C` | Creator ↔ Creator | outgoing, incoming, or mutual | One artist's work directly influences another artist's work | Goines → later street lit authors |
| `ORG` | Organizational / Ideological | outgoing, incoming, or mutual | Shared organizational membership or ideological influence | Scott ↔ Baker (revolutionary contemporaries) |
| `CC` | Creation Continuity | outgoing, incoming, or mutual | Fictional characters sharing a universe or continuity | Static ↔ Hardware (Milestone shared universe) |

### Direction Rules

- **Outgoing:** This figure influenced/created the target
- **Incoming:** This figure was influenced by the target
- **Mutual:** Bidirectional influence (use sparingly — requires evidence in both directions)

**Storage rule:** Store connections on the originating figure. The NVT code will infer reverse connections for display.

### 6b: Influence (Curated Scholarly Estimate Model)

**This is the "material footprint" data — how much cultural space the badman occupied over time.**

The archive uses a curated scholarly estimate model where the Project Director assigns influence values on a 1–10 scale across defined time phases. This replaces raw metric data (copies sold, box office, etc.) with expert judgment, while preserving the ability to cite specific evidence in justifications.

```json
"influence": {
  "scale": "1-10",
  "metric_type": "curated_scholarly_estimate",
  "phases": [
    {
      "start": 1971,
      "end": 1974,
      "value": 8,
      "justification": "Published 16 novels in approximately 5 years through Holloway House. Established street literature as a recognizable genre. Readership concentrated in Black urban communities.",
      "source": "Bryant, Born in a Mighty Bad Land, pp. 112-118"
    },
    {
      "start": 1975,
      "end": 1989,
      "value": 6,
      "justification": "Posthumous reprints sustained cultural presence. Holloway House continued publishing. No mainstream critical attention but consistent community readership.",
      "source": "TBD — needs archival verification"
    }
  ]
}
```

### Influence Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `influence.scale` | string | Yes | Always `"1-10"` |
| `influence.metric_type` | string | Yes | Always `"curated_scholarly_estimate"` |
| `influence.phases` | array | Yes | Array of time-phase objects |

### Phase Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `start` | integer | Yes | Start year of this phase |
| `end` | integer | Yes | End year of this phase |
| `value` | integer | Yes | Influence score (1–10) assigned by Project Director |
| `justification` | string | Yes | Explanation of score — cite specific evidence where possible |
| `source` | string | Yes | Citation (use `"TBD"` or `"TBD — [description of needed research]"` for placeholders) |

### Placeholder Pattern

For influence phases requiring future research, prefix the justification with `"PLACEHOLDER"` and use `"TBD"` for the source:

```json
{
  "start": 1976,
  "end": 1999,
  "value": 3,
  "justification": "PLACEHOLDER — Novels remain in print through Holloway House reprints. Cultural presence sustained but not independently significant.",
  "source": "TBD"
}
```

A `_REVIEW_NEEDED` string can be added to the `influence` object to flag the entire influence trajectory for revision:

```json
"influence": {
  "scale": "1-10",
  "metric_type": "curated_scholarly_estimate",
  "_REVIEW_NEEDED": "HARRY — these are placeholder estimates. Review and revise all values.",
  "phases": [ ... ]
}
```

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
      "url": "https://www.kensingtonbooks.com/9781496733283/crime-partners/"
    }
  ],
  "secondary": [
    {
      "title": "Born in a Mighty Bad Land: The Violent Man in African American Folklore and Fiction",
      "type": "academic",
      "year": 2003,
      "url": "https://iupress.org/9780253215789/born-in-a-mighty-bad-land/"
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
|----------|-------------|---------|
| `primary` | Direct sources documenting the figure | Novels, films, speeches, news articles, founding documents, audio recordings |
| `secondary` | Scholarly analysis about the figure | Academic books, journal articles, dissertations, biographies, obituaries |
| `archival` | Materials requiring institutional access | COINTELPRO files, Reuther Library collections, museum holdings, personal papers |

### Source Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Source title |
| `type` | string | Yes | Source format (see common types below) |
| `year` | integer \| null | No | Publication/release year |
| `url` | string \| null | Yes | Link to source (null if no web access) |
| `repository` | string | No | Physical location for archival sources |
| `notes` | string | No | Access notes, relevance explanation |

### Common Source Types

`novel`, `film`, `television`, `documentary`, `academic`, `biography`, `news`, `obituary`, `government`, `institutional`, `organizational`, `personal`, `letter`, `audio_recording`, `founding_document`, `newspaper`, `book`, `video`, `website`, `digital_archive`, `publisher`, `comics`, `artwork`, `manuscript`, `newsletter`, `interview`, `reference`, `legal`, `podcast`

---

## Handling Incomplete Data

**Core principle:** Empty or null values are valid. The archive is designed for incremental completion.

### Nullable Fields

These fields accept `null` when data is unavailable:

- `years.death` (for living figures)
- `creator_id` (if creator not in database)
- `source.url` (for archival/physical sources)
- `influence.phases` (can be empty array `[]`)
- `additional_locations` (can be empty array `[]`)
- `adaptations` (can be empty array `[]`)
- `connections` (can be empty array `[]`)

---

## Data Entry Workflow

### For Undergraduates (Spreadsheet Entry)

1. Fill out all fields in plain language
2. For locations, provide street names and neighborhood descriptions
3. For connections, describe relationships in sentences
4. For influence, note what you found and where
5. Flag uncertain information with `"NEEDS VERIFICATION"`
6. Note sources for every claim

### For Graduate Students (JSON Translation)

1. Convert spreadsheet data to JSON format
2. Look up coordinates for locations using Google Maps or OpenStreetMap
3. Draw territory polygons based on key events and location descriptions
4. Create proper `target_id` references for connections
5. Assign appropriate `tier` levels (1–3) to connections based on evidence quality
6. Add `_divider` field for visual separation between entries
7. Insert new figure objects **above** the `_placeholder` entry for the appropriate modality
8. Do NOT remove the placeholder — it stays as the insertion point for the next entry
9. Validate JSON syntax before committing
10. Run through validation checklist

### For Project Director (Quality Control)

1. Review all new entries against five-criteria framework
2. Assign influence phase values (1–10 scale)
3. Verify connection evidence is documented and tier is appropriate
4. Approve entries for public dataset

---

## Validation Checklist

Before committing new entries:

### Required Fields
- [ ] `id` is unique and follows naming convention (lowercase, underscores)
- [ ] `name` is present
- [ ] `type` is either `"real"` or `"fictional"`
- [ ] `modality` is valid (`detective`, `revolutionary`, `gangsta_pimp`, `superhero_villain`, `folk_hero_outlaw`)
- [ ] `meta_badman` is present (boolean)
- [ ] `years.active_start` and `years.active_end` are present
- [ ] `emergence.year` and `emergence.context` are present

### Scores
- [ ] All five scores present with `score` (1–5) and `justification`

### Biography
- [ ] `description` is 200–300 words
- [ ] `key_events` array is populated with year and event fields
- [ ] Fictional figures include `creator` and `source_text`

### Geographic
- [ ] `primary_location` has name and valid coordinates
- [ ] `territory.polygon` has at least 4 coordinate pairs
- [ ] `territory.description` justifies the polygon boundaries
- [ ] Coordinates are valid (lat: 42.2–42.5 for Detroit, lng: -83.3 to -82.9 for Detroit)

### Network
- [ ] All `target_id` values match existing figure `id` fields
- [ ] All connections have `type`, `direction`, `tier`, `start_year`, `end_year`, `evidence`, and `source`
- [ ] Connection `type` is one of the five defined types: `META`, `P2C`, `C2C`, `ORG`, `CC`
- [ ] Influence object has `scale`, `metric_type`, and at least one phase
- [ ] Influence phases have `start`, `end`, `value`, `justification`, and `source`

### Placement
- [ ] New figure inserted **above** the `_placeholder` entry for its modality
- [ ] `_placeholder` entry preserved (not removed)
- [ ] `_divider` field present for readability

### Technical
- [ ] JSON syntax validates (use jsonlint.com or similar)
- [ ] URLs are functional (or explicitly `null`)
- [ ] No trailing commas

---

## Tool Data Requirements

Quick reference for which buckets each visualization tool requires:

| Bucket | Map Tool | NVT | Notes |
|--------|----------|-----|-------|
| Identity | Required | Required | Both tools need basic identification |
| Emergence | Not used | Required | NVT timeline axis |
| Scores | Not used | Optional | Can size nodes by total score |
| Biography | Optional | Optional | Detail panels in both tools |
| Geographic | Required | Not used | Map markers and polygons |
| Network | Not used | Required | Connections and influence trajectory |
| Sources | Optional | Optional | Attribution in detail panels |

---

## Modality Reference

The archive currently includes the following modalities:

| Modality | Code | Status at Launch | Rendering |
|----------|------|------------------|-----------|
| Detective | `detective` | Active | Yes |
| Political Revolutionary | `revolutionary` | Active | Yes |
| Superhero-Villain | `superhero_villain` | Active | Yes |
| Gangsta-Pimp | `gangsta_pimp` | Dormant | No (filtered via `activeModalities`) |
| Folk Hero-Outlaw | `folk_hero_outlaw` | Future | No (no entries exist yet) |

### Modality Colors

These are the verified visual identity colors for each modality. See HTML_TEMPLATES.md for the full visual identity system (color + shape + icon).

| Modality | Color | Hex |
|----------|-------|-----|
| Detective | Blue | `#3388FF` |
| Revolutionary | Red | `#DC3545` |
| Superhero-Villain | Orange | `#FD7E14` |
| Gangsta-Pimp | Purple | `#6F42C1` |
| Folk Hero-Outlaw | Gold | `#D4AF37` |

### Activating a Dormant or Future Modality

When a modality goes live:

1. Update the Status column in this table
2. Update the `getModalityConfig()` function in the codebase (single source of truth for modality display properties — already includes all five modalities)
3. Add the modality string to the `activeModalities` array in map.html and network.html
4. Verify at least one figure entry exists with the modality's code
5. Verify the legend CSS class exists in `styles.css` (`.legend-[modality]`)
6. Test modality filtering by toggling in map and network

---

## Adding New Cities

When expanding beyond Detroit:

1. Create new JSON file: `[city].json`
2. Follow identical schema structure, including top-level `edge_types` and `evidence_tiers`
3. Update any cross-city connections with full `city:id` references
4. Add city to main site navigation
5. Create city subdomain: `[city].badmandigitalarchive.com`

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
- **Evidence tier:** Integer `1`, `2`, or `3` — not strings
- **Placeholder preservation:** Never remove `_placeholder: true` entries when adding new figures — insert new entries above them

---

## Questions?

Contact the Project Director or consult the Modality Sorting Framework for broader context about the Badman Archive and its theoretical framework.
