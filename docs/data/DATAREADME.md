# Detroit Badman Archive — Data Schema Documentation

**Last Updated:** April 2026
**Version:** 2.2
**Change Log:**
- **v2.2 (April 2026):** Sources migrated from nested per-figure arrays to a flat top-level `sources` array. Each source now carries an ID (`src_[city]_NNNN`), a `category` field (primary / secondary / archival), and a `figure_ids` back-reference. Figures reference sources via `source_ids` array and `emergence.source_id` string. Added reserved optional fields (`media`, `interview`) to the source schema to accommodate post-IRB interview integration without future migration. Documented `access_level` enum. Added `_related_sources` as an internal flag.
- **v2.1 (earlier 2026):** Removed GEO edge type. Added CC (Creation Continuity) edge type. Flipped SVM modality from "Staged" to "Active." Added Special Entry Types section documenting `_placeholder` / `_instructions` pattern. Updated modality status to reflect three-modality launch (Detective, Revolutionary, Superhero-Villain). Hex codes normalized to uppercase. Figure-by-figure modality tables removed; live site is source of truth for roster.

---

This document explains the JSON schema used in `detroit.json` and any future city data files. It is intended for graduate students translating spreadsheet data into JSON and for anyone maintaining or expanding the archive.

---

## Launch State

At launch (May 2026), the Detroit module includes **15 rendering figures across 3 active modalities**, plus one dormant figure:

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

Each city's data lives in a single JSON file (e.g., `detroit.json`, `atlanta.json`). The file contains five top-level fields:

```json
{
  "city": "detroit",
  "edge_types": { ... },
  "evidence_tiers": { ... },
  "sources": [ ... ],
  "figures": [ ... ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `city` | string | City identifier (lowercase, no spaces) |
| `edge_types` | object | Network edge type definitions (color, label) — used by NVT |
| `evidence_tiers` | object | Evidence tier definitions (line style, opacity) — used by NVT |
| `sources` | array | All primary, secondary, and archival sources for the city (flat array, ID-referenced by figures) |
| `figures` | array | Array of badman figure objects |

**Design Principle:** Sources are stored once at the top level and referenced by figures via ID. A single source can be cited by multiple figures without duplication (e.g., Goines and Kenyatta both cite *Crime Partners*). This normalization enables the Primary Sources landing page, filterable source views, and per-source "Cited in" listings without re-scanning every figure entry.

### Top-Level: Edge Types

Defines the visual styling for connection types in the Network Visualization Tool:

```json
"edge_types": {
  "META": { "label": "Creator → Creation", "color": "#d4af37" },
  "P2C":  { "label": "Person → Creation",  "color": "#dc3545" },
  "C2C":  { "label": "Creator ↔ Creator",  "color": "#50c878" },
  "ORG":  { "label": "Organizational / Ideological", "color": "#3388ff" },
  "CC":   { "label": "Creation Continuity", "color": "#e83e8c" }
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

### Top-Level: Sources

See the "Sources" section later in this document for the full schema. Sources live at the top level as a flat array; each figure references sources via a `source_ids` array.

---

## Special Entry Types

Beyond standard figure objects, the `figures` array includes two special entry types that serve file-navigation and workflow purposes. Both are filtered out during rendering and have no effect on visualizations.

### Placeholder Entries

Each modality section in the JSON contains a placeholder entry marking where new figure entries should be inserted. Placeholders use this exact structure:

```json
{
  "_divider": "────────── [MODALITY]: ADD NEW ENTRY HERE ──────────",
  "_placeholder": true,
  "_instructions": "Copy a complete figure object from an existing entry, replace all fields, and remove _placeholder and _instructions fields. Refer to DATAREADME.md for field requirements."
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
7. **Source References** — IDs pointing into the top-level `sources` array

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
| `_related_sources` | array | Traceability hint linking a sub-object (typically an `influence` block) back to source IDs used in its justifications. Ignored by visualization code. |
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
  "source_id": "src_dt_0004"
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `year` | integer | Yes | Year contentious relationship with law began |
| `context` | string | Yes | 1–2 sentence explanation of what triggered emergence |
| `source_id` | string \| null | No | ID of the source in the top-level `sources` array that supports the emergence claim |

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
| `source` | string | Yes | Citation for the evidence claim (free-text; for structured source references use the `source_ids` array on the figure) |

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
  "_related_sources": ["src_dt_0004", "src_dt_0005"],
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
| `influence._related_sources` | array | No | Optional array of source IDs that back the phase justifications. Traceability hint only; ignored by visualizations. |
| `influence.phases` | array | Yes | Array of time-phase objects |

### Phase Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `start` | integer | Yes | Start year of this phase |
| `end` | integer | Yes | End year of this phase |
| `value` | integer | Yes | Influence score (1–10) assigned by Project Director |
| `justification` | string | Yes | Explanation of score — cite specific evidence where possible |
| `source` | string | Yes | Citation (free-text; use `"TBD"` or `"TBD — [description of needed research]"` for placeholders) |

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

## Bucket 7: Source References

Figures reference sources via a `source_ids` array. Sources themselves live at the top level (see the "Sources" section below).

```json
"source_ids": [
  "src_dt_0001",
  "src_dt_0002",
  "src_dt_0004"
]
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `source_ids` | array of strings | Yes | IDs of sources in the top-level `sources` array that document this figure. Order is not significant. |

### Rules

- Every ID in `source_ids` must match an `id` in the top-level `sources` array
- A single source can be referenced by multiple figures (e.g., *Crime Partners* is referenced by both Goines and Kenyatta)
- Do not store source metadata (title, URL, etc.) on the figure — only the ID reference
- If a source has not yet been added to the top-level `sources` array, add it there first, then reference it here

### Why This Structure

The previous schema (v2.0 and earlier) nested sources inside each figure under `sources.primary`, `sources.secondary`, and `sources.archival`. The current schema stores sources once at the top level and references them by ID from figures. This normalization:

- Eliminates duplication when one source documents multiple figures
- Enables the Primary Sources landing page to render every source in the archive in a single filterable grid
- Allows per-source "Cited in" listings (which figures reference this source?)
- Makes it possible to edit source metadata in one place and have all references update

---

## Sources (Top-Level Array)

The `sources` array contains every primary, secondary, and archival source referenced by any figure in the city. Sources are stored as a flat array; the `category` field on each source determines its classification.

### Source Object

```json
{
  "id": "src_dt_0002",
  "title": "Crime Partners",
  "category": "primary",
  "type": "novel",
  "year": 1974,
  "url": "https://www.kensingtonbooks.com/9781496733283/crime-partners/",
  "author": "Donald Goines (as Al C. Clark)",
  "publisher": "Holloway House",
  "repository": null,
  "extent": null,
  "language": "en",
  "rights": null,
  "access_level": "public",
  "date_accessed": null,
  "notes": null,
  "figure_ids": [
    "goines_donald",
    "kenyatta"
  ]
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique source identifier in `src_[city]_NNNN` format (see ID Convention below) |
| `title` | string | Source title |
| `category` | string | Source classification: `"primary"`, `"secondary"`, or `"archival"` (see Categories below) |
| `type` | string | Source format (see Common Source Types below) |
| `figure_ids` | array of strings | IDs of figures in the `figures` array that reference this source. Back-reference for filtering and "Cited in" views. |

### Optional Fields (Nullable)

All other fields accept `null` when data is unavailable. Do not omit — set to `null` explicitly so the schema shape is consistent across all sources.

| Field | Type | Description |
|-------|------|-------------|
| `year` | integer \| null | Publication/release/creation year |
| `url` | string \| null | Link to source. Null for sources requiring physical or institutional access. For multi-asset sources (audio + transcript), see the reserved `media` field below. |
| `author` | string \| null | Source author, creator, or originating person. For interviews, the interviewer. |
| `publisher` | string \| null | Publishing entity (press, studio, label, network) |
| `repository` | string \| null | Physical or institutional location for archival sources |
| `extent` | string \| null | Physical or temporal extent (e.g., `"45 min"`, `"320 pages"`, `"3 boxes"`) |
| `language` | string \| null | ISO 639-1 code (e.g., `"en"`, `"fr"`) |
| `rights` | string \| null | Rights statement. Accommodates both copyright terms (for published works) and consent-based terms (for interviews and participant-generated content). |
| `access_level` | string \| null | Who can access this source — see Access Level Enum below |
| `date_accessed` | string \| null | ISO 8601 date (`"2026-04-15"`) when the source was last accessed or verified |
| `notes` | string \| null | Free-text notes: access warnings, methodological caveats, transcription status, institutional holdings context |

### Source Categories

| Category | Description | Examples |
|----------|-------------|----------|
| `primary` | Direct sources documenting or produced by the figure | Novels, films, speeches, news articles, founding documents, audio recordings, original interviews |
| `secondary` | Scholarly or journalistic analysis about the figure | Academic books, journal articles, dissertations, biographies, obituaries, criticism |
| `archival` | Materials requiring institutional access | COINTELPRO files, Reuther Library collections, museum holdings, personal papers, publisher records |

### Access Level Enum

The `access_level` field takes one of four values:

| Value | Description |
|-------|-------------|
| `"public"` | Source is freely accessible (published work, public website, open digital archive) |
| `"restricted"` | Source requires institutional affiliation, subscription, or on-site visit (paywalled journals, closed archives) |
| `"embargoed"` | Source is time-restricted; access opens on a specific date (use `notes` to document the embargo period) |
| `"consent_required"` | Source requires explicit consent from the subject or rights-holder to display or share (reserved for post-IRB interview material) |

Current archive state: every source at launch is `"public"`. The other three values are reserved for post-launch expansion — particularly `"consent_required"` for IRB-approved interview material.

### Source ID Convention

Source IDs follow the format: **`src_[city_code]_[4-digit number]`**

- `src_` — fixed prefix
- `[city_code]` — two-letter city abbreviation (Detroit = `dt`, Atlanta = `atl`, New Orleans = `no`, etc.)
- `[4-digit number]` — zero-padded sequential number starting at `0001`

**Detroit examples:** `src_dt_0001`, `src_dt_0042`, `src_dt_0091`

**Rules:**
- IDs are assigned sequentially as sources are added. Do not reuse an ID if a source is deleted — skip the number.
- IDs do not carry semantic meaning (they are not grouped by category or figure). Do not reorder the `sources` array to make IDs contiguous by category.
- Four digits accommodate up to 9,999 sources per city. If a city approaches that ceiling, expand to five digits and document the transition in the change log.

### Common Source Types

The `type` field is free-text but should be drawn from the following list when possible. Display formatting (converting snake_case to Title Case) is handled by the Primary Sources landing page.

`novel`, `film`, `television`, `documentary`, `academic`, `biography`, `news`, `obituary`, `government`, `institutional`, `organizational`, `organizational_document`, `organizational_statement`, `personal`, `letter`, `audio_recording`, `founding_document`, `newspaper`, `book`, `video`, `website`, `digital_archive`, `publisher`, `comics`, `artwork`, `manuscript`, `newsletter`, `interview`, `reference`, `legal`, `podcast`, `criticism`

If a new type is needed, use snake_case and add it to this list in a future change log entry.

### Reserved Fields (Post-IRB Interview Integration)

The following fields are reserved in the schema and are NOT YET IN USE at launch. They are documented here so that interview sources can be added after IRB approval without a breaking schema change. Current visualization code and the Primary Sources landing page ignore these fields if present.

#### `media` (reserved)

Optional array of media assets associated with a single source. When present, `media` supersedes the bare `url` field for multi-asset sources (e.g., an interview with both audio and transcript).

```json
"media": [
  {
    "format": "audio",
    "url": "/sources/interviews/src_dt_0200/audio.mp3",
    "duration": 2715,
    "mime_type": "audio/mpeg"
  },
  {
    "format": "transcript",
    "url": "/sources/interviews/src_dt_0200/transcript.pdf",
    "mime_type": "application/pdf"
  }
]
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `format` | string | Yes | One of: `"audio"`, `"video"`, `"transcript"`, `"image"`, `"document"` |
| `url` | string | Yes | Path or URL to the asset |
| `duration` | integer | No | Duration in seconds (audio/video only) |
| `mime_type` | string | No | MIME type (e.g., `"audio/mpeg"`, `"video/mp4"`, `"application/pdf"`) |

**Rule:** When `media` is present, the top-level `url` field should be `null`. When `media` is absent, `url` behaves as documented above.

#### `interview` (reserved)

Optional object containing interview-specific metadata. Present only when `type: "interview"`.

```json
"interview": {
  "interviewee": "Anonymized — see rights",
  "interviewer": "Harry M. Foster",
  "date_conducted": "2027-03-15",
  "location": "Detroit, MI",
  "consent_scope": "Audio and transcript public release; name anonymized at interviewee request.",
  "irb_protocol": "MSU-IRB-2027-0142"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `interviewee` | string | Yes | Name of interviewee, or anonymization marker (see `consent_scope`) |
| `interviewer` | string | Yes | Name of interviewer |
| `date_conducted` | string | Yes | ISO 8601 date of the interview |
| `location` | string | No | City, state, or specific venue |
| `consent_scope` | string | Yes | Plain-language summary of what the interviewee consented to (full public release, anonymization terms, redaction requirements, embargo period) |
| `irb_protocol` | string | No | IRB protocol number under which the interview was conducted |

**Rule:** When an interview source uses `access_level: "consent_required"` or `access_level: "embargoed"`, the `consent_scope` field must document the terms.

---

## Handling Incomplete Data

**Core principle:** Empty or null values are valid. The archive is designed for incremental completion.

### Nullable Fields

These fields accept `null` when data is unavailable:

- `years.death` (for living figures)
- `creator_id` (if creator not in database)
- `emergence.source_id` (if emergence claim is not yet source-backed)
- `influence.phases` (can be empty array `[]`)
- `additional_locations` (can be empty array `[]`)
- `adaptations` (can be empty array `[]`)
- `connections` (can be empty array `[]`)
- `source_ids` (can be empty array `[]` — figure exists but sources not yet cataloged)
- All optional source fields (see Sources section above)

---

## Data Entry Workflow

### For Undergraduates (Spreadsheet Entry)

1. Fill out all fields in plain language
2. For locations, provide street names and neighborhood descriptions
3. For connections, describe relationships in sentences
4. For influence, note what you found and where
5. List sources in a separate sheet: title, category, type, year, URL, author, publisher, repository, notes — and which figures they relate to
6. Flag uncertain information with `"NEEDS VERIFICATION"`
7. Note sources for every claim

### For Graduate Students (JSON Translation)

1. **Add new sources first.** Assign each new source the next sequential `src_[city]_NNNN` ID. Fill in all required fields and any optional fields with known data. Set unknown optional fields to `null` (do not omit). Populate the `figure_ids` array with the IDs of figures that reference this source.
2. Convert spreadsheet figure data to JSON format
3. Look up coordinates for locations using Google Maps or OpenStreetMap
4. Draw territory polygons based on key events and location descriptions
5. Create proper `target_id` references for connections
6. Assign appropriate `tier` levels (1–3) to connections based on evidence quality
7. Add the new figure's ID to the `figure_ids` array of each source it references
8. Populate the figure's `source_ids` array with the IDs of sources that document it
9. Populate `emergence.source_id` with the single source that best supports the emergence claim (or `null` if none)
10. Add `_divider` field for visual separation between entries
11. Insert new figure objects **above** the `_placeholder` entry for the appropriate modality
12. Do NOT remove the placeholder — it stays as the insertion point for the next entry
13. Validate JSON syntax before committing
14. Run through validation checklist

### For Project Director (Quality Control)

1. Review all new entries against five-criteria framework
2. Assign influence phase values (1–10 scale)
3. Verify connection evidence is documented and tier is appropriate
4. Verify source `figure_ids` back-references match figure `source_ids`
5. Approve entries for public dataset

---

## Validation Checklist

Before committing new entries:

### Required Fields (Figure)
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

### Source References
- [ ] `source_ids` array is present (can be empty `[]` if no sources yet cataloged)
- [ ] Every ID in `source_ids` matches an `id` in the top-level `sources` array
- [ ] `emergence.source_id` (if present) matches an `id` in the top-level `sources` array

### Sources (Top-Level Array)
- [ ] `id` follows `src_[city_code]_NNNN` format and is unique
- [ ] `title`, `category`, `type`, and `figure_ids` are present
- [ ] `category` is one of: `"primary"`, `"secondary"`, `"archival"`
- [ ] `access_level` (if present) is one of: `"public"`, `"restricted"`, `"embargoed"`, `"consent_required"`
- [ ] Every ID in `figure_ids` matches an `id` of a figure in the `figures` array
- [ ] Unused optional fields are set to `null`, not omitted

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

Quick reference for which buckets and top-level fields each visualization or page requires:

| Bucket / Field | Map Tool | NVT | Figures Landing | Figure Page | Sources Landing | Source Page |
|----------------|----------|-----|----------------|-------------|-----------------|-------------|
| Identity (figure) | Required | Required | Required | Required | — | — |
| Emergence | Not used | Required | Not used | Required | — | — |
| Scores | Not used | Optional | Optional | Required | — | — |
| Biography | Optional | Optional | Optional | Required | — | — |
| Geographic | Required | Not used | Optional | Required | — | — |
| Network | Not used | Required | Not used | Required | — | — |
| Figure `source_ids` | Optional | Optional | Not used | Required | — | — |
| Top-level `sources` array | Optional | Optional | — | Required (for figure's cited sources) | Required | Required |
| `sources[].figure_ids` | — | — | — | — | Required (for modality/figure filtering) | Required (for "Cited in") |

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
| Detective | Blue | `#3388ff` |
| Revolutionary | Red | `#dc3545` |
| Superhero-Villain | Orange | `#fd7e14` |
| Gangsta-Pimp | Purple | `#6f42c1` |
| Folk Hero-Outlaw | Gold | `#d4af37` |

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
2. Follow identical schema structure, including top-level `edge_types`, `evidence_tiers`, and `sources`
3. Assign the city a two-letter code for source IDs (e.g., Atlanta = `atl`, New Orleans = `no`)
4. Update any cross-city connections with full `city:id` references
5. Add city to main site navigation
6. Create city subdomain: `[city].badmandigitalarchive.com`

---

## Common Errors to Avoid

### JSON Syntax

- **Missing commas:** Every object in an array needs a comma after it, except the last one
- **Extra commas:** No comma after the last item in an array or object
- **Quote marks:** All strings must use double quotes `"`, not single quotes `'`
- **Brackets:** Arrays use `[]`, objects use `{}`
- **Null values:** Use `null` (no quotes), not `"null"`

### Data Consistency

- **ID format (figures):** Always lowercase with underscores: `baker_gordon` not `Baker_Gordon`
- **ID format (sources):** Always `src_[city_code]_NNNN` with four-digit zero-padded number
- **Coordinate order:** Always `lat, lng` in objects; `[lat, lng]` in polygon arrays
- **Year format:** Use integers `1968` not strings `"1968"`
- **Target IDs:** Must exactly match the `id` field of another figure in the dataset
- **Source IDs:** Must exactly match an `id` in the top-level `sources` array
- **Bidirectional references:** When a figure's `source_ids` includes a source ID, that source's `figure_ids` must include the figure's ID. Both sides must stay in sync.
- **Connection direction:** Store on originating figure with `"outgoing"`
- **Evidence tier:** Integer `1`, `2`, or `3` — not strings
- **Placeholder preservation:** Never remove `_placeholder: true` entries when adding new figures — insert new entries above them
- **Omitting vs. nulling optional fields:** For source objects, set unused fields to `null` explicitly. Do not omit. This keeps the schema shape consistent across all sources and simplifies the sources landing page logic.

---

## Questions?

Contact the Project Director or consult the Modality Sorting Framework for broader context about the Badman Archive and its theoretical framework.
