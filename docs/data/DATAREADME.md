# Detroit Badman Archive — Data Schema Documentation

**Last Updated:** April 2026
**Version:** 3.0
**Change Log:** Phase 1.1 schema refactor. Sources promoted to top-level objects with unique IDs (`src_dt_####`). Figures reference sources via `source_ids` arrays. Emergence references source by `source_id`. Added Source ID Convention subsection. New source metadata fields: `access_level`, `date_accessed`, `author`, `publisher`, `extent`, `language`, `rights`, `figure_ids`. Many-to-many figure↔source linking now enforced via bidirectional validation. `_related_sources` hint field introduced for `_REVIEW_NEEDED` flags to aid revision workflows. Previous change log preserved below.

**Prior versions:**
- v2.1: Removed GEO edge type. Added CC (Creation Continuity) edge type. Flipped SVM modality from "Staged" to "Active." Added Special Entry Types section documenting `_placeholder` / `_instructions` pattern. Updated modality status to reflect three-modality launch (Detective, Revolutionary, Superhero-Villain). Hex codes normalized to uppercase. Figure-by-figure modality tables removed; live site is source of truth for roster.

---

This document explains the JSON schema used in `detroit.json` and any future city data files. It is intended for graduate students translating spreadsheet data into JSON and for anyone maintaining or expanding the archive.

---

## Launch State

At launch (May 2026), the Detroit module includes **15 figures across 3 active modalities** (plus 1 dormant figure):

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

Each city's data lives in a single JSON file (e.g., `detroit.json`, `atlanta.json`). The file contains two top-level fields plus two visualization configuration objects and two data arrays:

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
| `sources` | array | Top-level array of source objects, each with a unique `id` |
| `figures` | array | Array of badman figure objects, each referencing sources by `id` |

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

Top-level array containing every unique source cited anywhere in the archive. See **Bucket 7: Sources** for the full schema. Sources are referenced by figures via the `source_ids` array on each figure.

**Design Principle:** This single JSON file feeds both the Map visualization tool and the Network Visualization Tool (NVT). Fields are organized into buckets that each tool reads from. Empty or null values are valid — tools render what's available and gracefully skip what's missing. Sources exist as top-level objects so that the same source can support multiple figures without duplication.

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
5. Add any new sources to the top-level `sources` array and reference them by ID in the new figure's `source_ids`

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
- `"────────── [MODALITY_CODE]: [figure name] ──────────"` — Individual figure separator within a modality group (modality codes: GPM, PRM, DET, SHV, FHOM)

---

## Figure Object Structure

Each figure in the `figures` array contains seven data buckets:

1. **Identity** — Who they are
2. **Emergence** — When and why their contentious relationship with law began
3. **Scores** — Five-criteria badman evaluation
4. **Biography** — Description and key events
5. **Geographic** — Location and territory data (Map tool)
6. **Network** — Connections and influence phases (NVT)
7. **Source References** — An array of source IDs linking to the top-level sources array

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
| `_related_sources` | array of source IDs | Hint field paired with `_REVIEW_NEEDED` — lists source IDs most relevant to the flagged content, so revision work can locate supporting material quickly |
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
| `source_id` | string \| null | No | Reference to a source ID in the top-level `sources` array (use `null` if no specific source supports the emergence claim) |

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

A `_REVIEW_NEEDED` string (optionally paired with `_related_sources`) can be added at the same level as the score fields to flag entries requiring re-evaluation:

```json
"scores": {
  "outlaw_relationship": { ... },
  ...
  "_REVIEW_NEEDED": "All scores require re-evaluation against GPM modality criteria.",
  "_related_sources": ["src_dt_0005", "src_dt_0004"]
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

A `_REVIEW_NEEDED` string (optionally paired with `_related_sources`) can be added to the `influence` object to flag the entire influence trajectory for revision:

```json
"influence": {
  "scale": "1-10",
  "metric_type": "curated_scholarly_estimate",
  "_REVIEW_NEEDED": "HARRY — these are placeholder estimates. Review and revise all values.",
  "_related_sources": ["src_dt_0016", "src_dt_0017"],
  "phases": [ ... ]
}
```

---

## Bucket 7: Sources

### Architecture Overview

Sources are stored as top-level objects in the `sources` array, each with a unique `id`. Figures reference sources by ID via a `source_ids` array. This many-to-many relationship allows a single source to support multiple figures without duplication.

```json
{
  "sources": [
    {
      "id": "src_dt_0001",
      "title": "Dopefiend",
      "category": "primary",
      "type": "novel",
      "year": 1971,
      "url": "https://...",
      "author": "Donald Goines",
      "publisher": "Holloway House",
      "figure_ids": ["goines_donald"]
      ...
    }
  ],
  "figures": [
    {
      "id": "goines_donald",
      ...
      "source_ids": ["src_dt_0001", "src_dt_0002", "src_dt_0003"]
    }
  ]
}
```

### Source ID Convention

Every source in the archive has a unique identifier following the format `src_[city]_####`, where:

- `src` is the constant prefix identifying the entry as a source
- `[city]` is a short lowercase city code (`dt` for Detroit, `atl` for Atlanta, `chi` for Chicago, etc.)
- `####` is a four-digit zero-padded sequential number (`0001` through `9999`)

**Examples:**
- `src_dt_0001` — First source added to the Detroit archive
- `src_dt_0247` — 247th source added to the Detroit archive
- `src_atl_0001` — First source added to the Atlanta archive (when it launches)

**Why this format:**

- **Opacity is intentional.** Source IDs are stable handles, not descriptive labels. Every source has a `title` field that carries human-readable identification.
- **City-prefixed** because the national AI Curator will eventually index sources across all cities; the city prefix preserves provenance without requiring a separate lookup.
- **Four-digit numeric** accommodates up to 9,999 unique sources per city. If a city archive exceeds this ceiling, migration to five digits is non-trivial — but also a signal that the archive has reached significant scale.
- **Not slug-based** because slug logic varies by source type (books vs. articles vs. photographs vs. oral histories), requires disambiguation for same-year same-author collisions, and adds complexity to automated intake workflows.
- **Not modality-prefixed** because sources have many-to-many relationships with figures across modalities; embedding modality in the source ID would misrepresent this relationship.

**ID assignment:**

New source IDs are assigned sequentially when entries are added to the top-level `sources` array. IDs are never reused, even if a source is deleted. Gaps in the sequence are acceptable and expected.

### Source Object Schema

```json
{
  "id": "src_dt_0001",
  "title": "Dopefiend",
  "category": "primary",
  "type": "novel",
  "year": 1971,
  "url": "https://www.kensingtonbooks.com/9781496733290/dopefiend/",
  "author": "Donald Goines",
  "publisher": "Holloway House",
  "repository": null,
  "extent": null,
  "language": "en",
  "rights": null,
  "access_level": "public",
  "date_accessed": null,
  "notes": null,
  "figure_ids": ["goines_donald"]
}
```

### Source Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier in `src_[city]_####` format |
| `title` | string | Yes | Source title |
| `category` | string | Yes | `"primary"`, `"secondary"`, or `"archival"` (see Source Categories below) |
| `type` | string | Yes | Source format (see Common Source Types below) |
| `year` | integer \| null | No | Publication/release year |
| `url` | string \| null | No | Link to source (null if no web access) |
| `author` | string \| null | No | Author, creator, or director of the source |
| `publisher` | string \| null | No | Publisher, studio, network, or producing organization |
| `repository` | string \| null | No | Physical location for archival sources |
| `extent` | string \| null | No | Length/duration/dimensions (e.g., `"320 pages"`, `"94 min"`, `"18 x 9 ft"`) |
| `language` | string | Yes | ISO 639-1 code. Default `"en"` |
| `rights` | string \| null | No | Rights statement or license |
| `access_level` | string | Yes | `"public"`, `"scholar-only"`, `"embargoed"`, or `"restricted"`. Default `"public"` |
| `date_accessed` | string \| null | No | ISO 8601 date when the URL was verified (for external links) |
| `notes` | string \| null | No | Access notes, relevance explanation |
| `figure_ids` | array of strings | Yes | Figure IDs this source supports. Enables back-references. |

### Source Categories

| Category | Description | Examples |
|----------|-------------|---------|
| `primary` | Direct sources documenting the figure | Novels, films, speeches, news articles, founding documents, audio recordings |
| `secondary` | Scholarly analysis about the figure | Academic books, journal articles, dissertations, biographies, obituaries |
| `archival` | Materials requiring institutional access | COINTELPRO files, Reuther Library collections, museum holdings, personal papers |

### Access Levels

| Level | Description | Rendering |
|-------|-------------|-----------|
| `public` | Freely available to anyone | Shown on public site with full metadata |
| `scholar-only` | Requires credentialed access (e.g., IRB-governed interviews) | Metadata shown, content gated behind auth |
| `embargoed` | Public access delayed until a future date | Metadata shown with embargo notice |
| `restricted` | Private material (e.g., unpublished family papers) | Listed with minimal metadata only |

At launch, all sources default to `"public"`. The field exists for forward compatibility when IRB-governed oral history material and embargoed scholarly work enter the archive.

### Common Source Types

`novel`, `film`, `television`, `documentary`, `academic`, `biography`, `news`, `obituary`, `government`, `institutional`, `organizational`, `organizational_statement`, `organizational_document`, `personal`, `letter`, `audio_recording`, `founding_document`, `newspaper`, `newsletter`, `book`, `video`, `website`, `digital_archive`, `publisher`, `comics`, `artwork`, `manuscript`, `interview`, `reference`, `legal`, `podcast`, `criticism`

### Figure Source References

Every figure has a `source_ids` array listing the sources that support its entry:

```json
"source_ids": ["src_dt_0001", "src_dt_0002", "src_dt_0003", "src_dt_0004"]
```

Render-side grouping (primary/secondary/archival) is derived from each source's `category` field. The figure itself does not categorize its sources — the category lives on the source.

### Bidirectional Integrity

For every figure-source relationship, both sides of the reference must be populated:

- If figure `X` lists source `Y` in `source_ids`, then source `Y` must list figure `X` in `figure_ids`.
- If source `Y` lists figure `X` in `figure_ids`, then figure `X` must list source `Y` in `source_ids`.

The build pipeline enforces this bidirectional integrity. Schema validation will fail if either side is missing.

---

## Handling Incomplete Data

**Core principle:** Empty or null values are valid. The archive is designed for incremental completion.

### Nullable Fields

These fields accept `null` when data is unavailable:

- `years.death` (for living figures)
- `creator_id` (if creator not in database)
- `emergence.source_id` (if no specific source supports the claim)
- `source.url` (for archival/physical sources)
- `source.author`, `source.publisher`, `source.repository`, `source.extent`, `source.rights`, `source.date_accessed`, `source.notes` (all nullable per source)
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
5. For sources, list title, type, year, author, publisher, and URL — do NOT assign source IDs (that's done at JSON translation)
6. Flag uncertain information with `"NEEDS VERIFICATION"`
7. Note sources for every claim

### For Graduate Students (JSON Translation)

1. Convert spreadsheet data to JSON format
2. **For each source:** check the existing top-level `sources` array first. If the source already exists, reuse its `id`. If new, assign the next sequential `src_[city]_####` ID and add the full source object to the top-level array.
3. **For each figure:** populate `source_ids` with the source IDs (new and existing) that support the entry. Also update each source's `figure_ids` to include the new figure.
4. Look up coordinates for locations using Google Maps or OpenStreetMap
5. Draw territory polygons based on key events and location descriptions
6. Create proper `target_id` references for connections
7. Assign appropriate `tier` levels (1–3) to connections based on evidence quality
8. Add `_divider` field for visual separation between entries
9. Insert new figure objects **above** the `_placeholder` entry for the appropriate modality
10. Do NOT remove the placeholder — it stays as the insertion point for the next entry
11. Validate JSON syntax before committing
12. Run through validation checklist

### For Project Director (Quality Control)

1. Review all new entries against five-criteria framework
2. Assign influence phase values (1–10 scale)
3. Verify connection evidence is documented and tier is appropriate
4. Verify source metadata is complete and bidirectional links are intact
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

### Sources
- [ ] Every source has a unique `id` in `src_[city]_####` format
- [ ] Every source has `title`, `category`, `type`, `language`, `access_level`, and `figure_ids`
- [ ] Every `source_id` in a figure's `source_ids` array exists in the top-level `sources` array
- [ ] Every `figure_id` in a source's `figure_ids` array exists in the `figures` array
- [ ] Bidirectional integrity: if figure X references source Y, source Y references figure X
- [ ] `emergence.source_id` (if present) references an existing source
- [ ] `_related_sources` hints (if present) reference existing source IDs

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
| Sources | Optional | Optional | Detail panels fetch source objects by ID from top-level array |

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
2. Follow identical schema structure, including top-level `edge_types`, `evidence_tiers`, `sources`, and `figures`
3. Use a distinct city code in the source ID prefix (e.g., `src_atl_####` for Atlanta, `src_chi_####` for Chicago)
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

- **ID format:** Always lowercase with underscores: `baker_gordon` not `Baker_Gordon`
- **Source ID format:** Always `src_[city]_####` with four-digit zero-padded number: `src_dt_0001` not `src_dt_1`
- **Coordinate order:** Always `lat, lng` in objects; `[lat, lng]` in polygon arrays
- **Year format:** Use integers `1968` not strings `"1968"`
- **Target IDs:** Must exactly match the `id` field of another figure in the dataset
- **Source IDs:** Must exactly match the `id` field of a source in the top-level `sources` array
- **Connection direction:** Store on originating figure with `"outgoing"`
- **Evidence tier:** Integer `1`, `2`, or `3` — not strings
- **Placeholder preservation:** Never remove `_placeholder: true` entries when adding new figures — insert new entries above them
- **Bidirectional source/figure links:** Always update both sides when adding a source-figure relationship

---

## Questions?

Contact the Project Director or consult the Modality Sorting Framework for broader context about the Badman Archive and its theoretical framework.
