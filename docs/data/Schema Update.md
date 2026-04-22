# Source Entry Schema — v2

**Status:** Locked design, pre-implementation
**Supersedes:** Implicit v1 schema (fields inferred from existing 91 source entries)
**Last updated:** April 22, 2026
**Author:** Harry M. Foster

---

## Purpose

This document specifies the shape of source entries in `detroit.json` and, by extension, all future city-JSON files. The schema supports two very different kinds of sources:

1. **External sources** — pointers to evidence held elsewhere (novels, published interviews, academic articles, news coverage). These have a URL or a repository citation and no original assets.
2. **Original collections** — primary scholarly publications produced for the archive (oral history interviews, field photographs, scanned archival documents). These have original assets hosted inside the source's entry folder.

Both kinds use the same schema. The presence or absence of certain fields (especially `assets[]`) determines which renderers the build script invokes.

## Design principles

1. **Additive revision.** Every existing field from the 91-source corpus keeps working exactly as-is. New fields are all optional. No migration script required.
2. **Co-location over classification.** A source's entry folder contains its `index.html` and (optionally) an `assets/` subdirectory with original files. No filesystem categorization by type, category, or repository — those are JSON fields that drive UI, not folder names.
3. **Relative asset paths.** Asset file references in JSON are relative to the entry folder (`assets/audio.mp3`), not absolute (`/archive/sources/entries/src_dt_0091/assets/audio.mp3`). This keeps paths short, portable, and safe under folder renames.
4. **Type-specific metadata lives in its own block.** Interview-specific fields don't pollute the root schema; they live in `interview_metadata: {}`. Same pattern for future type-specific extensions.
5. **Status gating parallels figures.** Sources marked `status: "stub"` are skipped by the build script. Sources without an explicit status are assumed live.

---

## Top-level schema

### Required fields

Every source entry MUST have these fields. Entries missing any of them are rejected by the build validator.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Canonical ID, format `src_{city}_{NNNN}`. City code is 2-3 lowercase letters (`dt`, `atl`, `nola`). Sequence is zero-padded to 4 digits. |
| `title` | string | Source title as it appears on publication / in the archive. Use italics-meaningful casing (*Dopefiend*, not *DOPEFIEND*). |
| `category` | enum | `"primary"` \| `"secondary"` \| `"archival"`. Filters on the landing page. |
| `type` | string | Source type. See [Type vocabulary](#type-vocabulary) below. |
| `figure_ids` | string[] | Array of figure IDs this source supports. Bidirectional with figures' `source_ids`. Empty array allowed for sources not yet attached to any figure. |

### Always-present fields (may be null)

These fields MUST be present as keys on every source but MAY be null. The build script treats null the same as absent.

| Field | Type | Notes |
|---|---|---|
| `year` | integer \| null | Publication year. Null for undated sources. Drives year-sort and card meta line. |
| `url` | string \| null | External URL for the source. Null for archival-only sources and original collections. |
| `author` | string \| null | Primary author attribution. See [Author handling](#author-handling) for interaction with `creators[]`. |
| `publisher` | string \| null | Publisher, studio, label, or distributor. |
| `repository` | string \| null | Institutional holding (e.g. "Walter P. Reuther Library, Wayne State University"). Null for originals hosted in the archive. |
| `extent` | string \| null | Free-form description of source extent ("42 minutes audio; 8,234-word transcript", "180 pages", "1 reel"). |
| `language` | string \| null | ISO 639-1 two-letter code (`en`, `fr`, `es`). Rendered to full name on the page via a lookup. |
| `rights` | string \| null | Copyright / licensing statement. For original collections use explicit license names ("CC BY-NC 4.0"). |
| `access_level` | enum \| null | `"public"` \| `"restricted"` \| `"embargoed"` \| `"consent_required"`. Null defaults to `"public"`. |
| `date_accessed` | string \| null | ISO 8601 date (YYYY-MM-DD). Required for web-URL sources per Chicago/MLA practice. |
| `notes` | string \| null | Free-form scholarly notes. Rendered on the source page if present. Supports inline Markdown for emphasis only (`*italic*`, `**bold**`); no block structure. |

### New optional fields (v2 additions)

These fields are all NEW in v2. They're optional — existing sources don't need them. Add them when a source's nature requires them.

| Field | Type | Notes |
|---|---|---|
| `status` | enum | `"live"` \| `"stub"` \| `"draft"`. Defaults to `"live"` if absent. `"stub"` is skipped by the build script. |
| `descriptor` | string | One-sentence scholarly summary. Drives card meta and SEO description. Recommended under 200 characters. |
| `creators` | object[] | Array of named roles for sources with multiple contributors. See [The creators array](#the-creators-array). When present, `author` should be the computed "primary" creator. |
| `justification` | string | Short paragraph (1-3 sentences) explaining why this source is in the archive. Required for original collections; optional for external sources. |
| `assets` | object[] | Original files hosted inside the source's entry folder. See [The assets array](#the-assets-array). Null/empty for external sources. |
| `interview_metadata` | object | Required when `type: "interview"` AND the interview is an original collection. See [Type-specific metadata blocks](#type-specific-metadata-blocks). |
| `film_metadata` | object | Reserved for future use. Structure TBD when first original film source is produced. |
| `scan_metadata` | object | Reserved for future use. Structure TBD when first scan collection is produced. |

---

## Type vocabulary

The `type` field accepts any string, but the build script groups types into **type families** for viewer dispatch and citation rules. A source whose type isn't in any family defaults to `text` family.

### Type families

| Family | Types | Viewer treatment | Citation pattern |
|---|---|---|---|
| **book** | `novel`, `book`, `biography`, `memoir`, `comics`, `nonfiction` | External link or "View source" button | Author. *Title*. Publisher, Year. |
| **text** | `article`, `academic`, `criticism`, `reference`, `institutional`, `digital_archive`, `publisher`, `document`, `letter`, `manuscript`, `founding_document`, `organizational_document`, `organizational_statement`, `newsletter`, `obituary`, `website` | External link or "View source" button | Author. "Title." Publisher, Year. |
| **news** | `news`, `newspaper`, `magazine` | External link | Author. "Title." Publication, Date. |
| **image** | `photograph`, `photo`, `image`, `artwork` | Inline `<img>` with caption, or external link if URL is to a museum/publisher page | Creator. *Title*. Repository, Year. |
| **audio** | `audio`, `audio_recording`, `oral_history`, `podcast` | Inline HTML5 `<audio>` player if asset present, else external link | Creator. "Title." Repository/Publisher, Year. |
| **video** | `film`, `video`, `television`, `tv`, `documentary` | External link (videos rarely hosted directly) | *Title*. Studio, Year. |
| **interview** | `interview` | Inline audio player + transcript if original collection; external link otherwise | Creator. "Title." Publication/Repository, Year. |
| **legal** | `legal`, `government` | External link or repository reference | *Title*. Repository, Year. |

Unknown types fall back to **text** family.

### Type vs. category

Category (`primary` \| `secondary` \| `archival`) and type are orthogonal and both filter independently on the landing page:

- A **primary / novel** is a Donald Goines novel.
- A **primary / interview** is an oral history you conducted.
- A **secondary / academic** is a scholarly article about the subject.
- An **archival / scan** is a scanned document from an institutional holding.

---

## Author handling

For backwards compatibility, `author` stays as the primary string-typed authorship field. For v2 sources with multiple contributors, populate both:

- `author` — the primary creator's name, optionally with a role suffix in parentheses.
- `creators[]` — the full structured list.

The build script uses `creators[]` when present and falls back to `author` when not.

### Examples

**Single-author external source (v1 pattern, unchanged):**
```json
{
  "author": "Donald Goines",
  "creators": null
}
```

**Multi-creator original interview:**
```json
{
  "author": "Harry M. Foster",
  "creators": [
    {
      "name": "Harry M. Foster",
      "role": "interviewer",
      "affiliation": "Michigan State University"
    },
    {
      "name": "Louis Jones",
      "role": "interviewee",
      "affiliation": "Walter P. Reuther Library"
    }
  ]
}
```

**Pseudonym preservation (v1 pattern, unchanged):**
```json
{
  "author": "Donald Goines (as Al C. Clark)",
  "creators": null
}
```

---

## The `creators[]` array

Each creator object:

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | Display name. Formatted for scholarly citation by the build script. |
| `role` | string | Yes | Free-form role descriptor. Common values: `author`, `editor`, `interviewer`, `interviewee`, `director`, `photographer`, `translator`, `narrator`, `composer`. |
| `affiliation` | string | No | Institutional affiliation at the time of the source's creation. |
| `orcid` | string | No | ORCID iD for scholarly creators. Reserved for future linking. |

---

## The `assets[]` array

Each asset represents one original file in the source's `assets/` folder. All asset file paths are **relative** to the entry folder.

### Asset object schema

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | enum | Yes | `"audio"` \| `"transcript"` \| `"image"` \| `"video"` \| `"document"` \| `"data"`. Drives how the asset is rendered. |
| `file` | string | Yes | Relative path: `"assets/audio.mp3"`. Build validator fails if file doesn't exist. |
| `mime_type` | string | Recommended | MIME type for `<audio>` / `<video>` source elements. Inferred from extension when absent. |
| `label` | string | Recommended | Human-readable label. Shown as figcaption, audio-player title, or tab name in multi-asset viewers. |
| `duration` | integer | For audio/video | Duration in seconds. Used in metadata rail and for time-estimate display. |
| `word_count` | integer | For transcripts | Word count. Displayed in extent field if primary asset. |
| `page_count` | integer | For documents | PDF/scan page count. |
| `dimensions` | string | For images | Width × height in pixels ("1920×1080") for sizing reservation. |
| `access_level` | enum | No | Override the source's access_level for this specific asset. Example: audio is public, consent form is private. |
| `caption` | string | No | Longer descriptive caption for images and videos. |
| `alt` | string | For images | Accessibility alt text. Required for images per WCAG 1.1.1. |

### Transcript assets

Transcripts are Markdown files. The build script reads the Markdown at build time, parses it with Python-Markdown (or mistune), and embeds the resulting HTML directly into the source page — they're not loaded separately at runtime.

Transcript Markdown conventions:

- Use `##` for interview section headings ("Early life at Black Bottom", "The STRESS years", etc.)
- Use standard Markdown link syntax for in-transcript cross-references (`[Baldwin](../baldwin_moses/)`)
- Speaker turns use bold leading labels:
  ```
  **HMF:** Can you tell me about the Guardians' early meetings?

  **Jones:** We met in the basement of the Bethel Church mostly. Before that—
  ```
- No front-matter; all metadata lives in the source JSON.

---

## Type-specific metadata blocks

Type-specific blocks carry metadata that doesn't generalize across source types. Only one type-specific block is populated per source (driven by `type`).

### `interview_metadata`

Required for original-collection interviews. Optional for external interviews (e.g. CrimeReads interview with Stephen Mack Jones).

| Field | Type | Required | Notes |
|---|---|---|---|
| `date` | string | Yes | ISO 8601 date of the interview itself (distinct from `year`). |
| `location` | string | No | Where the interview took place. |
| `duration_minutes` | integer | No | Total interview length. Mirrors asset-level `duration` but in minutes. |
| `consent_scope` | string | Required for originals | Summary of consent terms agreed with interviewee. Example: "Full publication; attribution permitted; transcript reviewed and approved by interviewee YYYY-MM-DD." |
| `session_count` | integer | No | For multi-session oral histories. |
| `ethics_approval` | string | No | IRB protocol number if the interview was conducted under institutional ethics review. |

### Future type-specific blocks

Reserved for implementation when the first source of each type is added:

- `film_metadata` — director, studio, runtime, aspect ratio, subtitle language
- `scan_metadata` — provenance, scan resolution, original artifact dimensions, accession number
- `podcast_metadata` — episode number, series, host
- `artwork_metadata` — medium, dimensions, current location, accession number

These will be speced when needed. They are NOT part of v2.

---

## `access_level` semantics

The `access_level` field controls how the source page renders when a user visits it. The field value is authoritative — the build script emits different page structure based on it.

| Value | Rendering |
|---|---|
| `"public"` (or null) | Full viewer + metadata + citation, no restrictions |
| `"restricted"` | Notice panel: "This source requires institutional access." No viewer. Metadata rail shows repository. |
| `"embargoed"` | Notice panel: "This source is under embargo." No viewer. Notes field may contain embargo expiration. |
| `"consent_required"` | Notice panel: "This source requires consent to access." No viewer. Metadata rail shows consent contact. |

An **asset-level** `access_level` in the `assets[]` array can override the source-level setting for individual files. Example: a public oral history interview where the audio and transcript are public but the signed consent form is private. The consent-form asset gets `access_level: "private"` and the build script simply doesn't render it in the assets list, even though the source overall is public.

---

## Canonical example: External source (unchanged from v1)

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

No changes needed. All 91 existing sources render correctly under v2 using their existing fields.

---

## Canonical example: Original collection interview

```json
{
  "id": "src_dt_0092",
  "status": "live",
  "title": "Oral History Interview with Louis Jones",
  "descriptor": "A 42-minute interview with archivist Louis Jones of the Walter P. Reuther Library, conducted August 2026, documenting the library's holdings on Detroit Black labor organizing.",

  "category": "primary",
  "type": "interview",
  "year": 2026,

  "author": "Harry M. Foster",
  "creators": [
    {
      "name": "Harry M. Foster",
      "role": "interviewer",
      "affiliation": "Michigan State University"
    },
    {
      "name": "Louis Jones",
      "role": "interviewee",
      "affiliation": "Walter P. Reuther Library, Wayne State University"
    }
  ],

  "publisher": null,
  "repository": null,
  "url": null,
  "extent": "42 minutes audio; 8,234-word transcript",
  "language": "en",
  "rights": "CC BY-NC 4.0; interviewee retains right of transcript review",
  "access_level": "public",
  "date_accessed": null,

  "interview_metadata": {
    "date": "2026-08-15",
    "location": "Walter P. Reuther Library, Wayne State University, Detroit",
    "duration_minutes": 42,
    "consent_scope": "Full publication; attribution permitted; transcript reviewed and approved by interviewee 2026-09-02."
  },

  "assets": [
    {
      "type": "audio",
      "file": "assets/audio.mp3",
      "mime_type": "audio/mpeg",
      "duration": 2547,
      "label": "Full interview audio"
    },
    {
      "type": "transcript",
      "file": "assets/transcript.md",
      "label": "Full transcript",
      "word_count": 8234
    },
    {
      "type": "image",
      "file": "assets/consent-form.jpg",
      "label": "Signed consent form",
      "access_level": "private",
      "alt": "Scanned signed consent form, not publicly displayed"
    }
  ],

  "justification": "Jones curates the Reuther's Black labor history collections and has intimate knowledge of undigitized holdings related to STRESS-era police organizing. This interview establishes archival provenance for several claims in the Baldwin entry and identifies materials for future Guardians research.",

  "notes": "Transcript conventions: *italics* indicate emphasis as spoken. Bracketed [passages] are interviewer clarifications added for readability. Speaker labels use initials (HMF for interviewer, Jones for interviewee).",

  "figure_ids": ["baldwin_moses"]
}
```

---

## Build script behavior (`build_sources.py`)

The schema is the contract. The build script implements it. Key behaviors:

1. **Folder creation on demand.** For every non-stub source, creates `/archive/sources/entries/[source_id]/` if absent, writes `index.html`.
2. **Asset validation.** For every asset in `assets[]`, resolves the relative path against the entry folder and fails the build if the file is missing.
3. **Transcript rendering.** For transcript assets, reads the Markdown at build time and embeds the rendered HTML into the page.
4. **Citation pre-rendering.** Generates Chicago / MLA / APA citations server-side; all three are present in the HTML. JS toggles visibility between them at runtime.
5. **Access-level gating.** Emits access-notice panels instead of viewers for non-public sources.
6. **Cited-in cross-referencing.** For each source, walks the figures' `source_ids` arrays (not the source's own `figure_ids` — belt and suspenders) to find which figures cite it.
7. **Related-source computation.** For each source, finds other sources that share at least one `figure_id` with the current source, sorted by overlap count.
8. **Status gating.** Skips sources with `status: "stub"`. Generates pages for `status: "live"` and status-unset entries.
9. **Dormant figure filtering.** If a source's `figure_ids` includes figures whose modality is dormant (not in `ACTIVE_MODALITIES`), those figure cross-references link to inactive spans instead of live anchors. Same pattern as `build_figures.py`.

---

## Migration checklist

No migration is required. The 91 existing sources work unchanged under v2.

If you later want to enrich any existing source with v2 fields, add them incrementally:

- To add a scholarly summary: add `descriptor`.
- To add justification language: add `justification`.
- To add multi-creator attribution: add `creators[]`, keep existing `author` as fallback.
- To convert an external source to a full collection entry: add `assets[]` with relative paths and create the `assets/` folder inside the entry directory.

---

## Versioning

This document is **Source Entry Schema v2**. Future schema revisions:

- **v2.x** patches — additive-only field additions that don't require existing sources to change.
- **v3** — breaking changes (renamed fields, restructured arrays). Would require a migration script and a `SCHEMA_MIGRATION.md`.

All v2 sources should declare compatibility implicitly by their structure. No explicit `schema_version` field is added to each source entry; the aggregate `detroit.json` file's top-level metadata can carry a `schema_version: 2` field if desired.

---

**End of schema specification.**
