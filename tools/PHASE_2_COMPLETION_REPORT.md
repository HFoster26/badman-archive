# Phase 2 Completion Report — Structure

**Date:** April 16, 2026
**Phase:** 2 (Structure)
**Sprint items closed:** 2.1 Navigation restructure · 2.2 URL/route structure · 2.3 Template/partial architecture
**Test harness:** 121/121 routes passing · 5/5 required assets present · 0 failures

---

## Summary

Phase 2 builds the container the content will live in. It does not author content. Every page exists, every URL works, the navbar and footer appear on every page via a shared partial loader, and a test harness verifies all 121 URLs structurally.

## What was built

### Partials
- `partials/navbar.html` — top-level nav with dropdowns: Home · About (Project / Tradition / Methodology) · Archive (Figures / Primary Sources) · Visualizations (Map / Network) · Engagement (Submit / Events) · Contact
- `partials/footer.html` — institutional affiliation block, partner acknowledgment stub, resource links, compilation-copyright notice, build version
- `partials/credentialing-rail.html` — sticky right-rail author block with headshot, name/pronouns/affiliation, short bio, link to About; also holds the "On this page" TOC populated at runtime
- `partials/_page-template.html` — canonical HTML skeleton every page inherits from

### Loader and styles
- `assets/js/partials.js` — the one runtime script every page loads. Does: (1) fetches navbar/footer into every page, (2) fetches credentialing rail into pages that include the placeholder, (3) sets `aria-current="page"` on the active nav item, (4) builds the TOC from the page's `<main>` h2 headings, (5) sets the footer year, (6) dispatches a `bda:partials-loaded` event for page-specific scripts to listen for
- `assets/css/styles.css` — structural stylesheet. CSS variables for the audited dark-green theme, skip-to-content link, `.sr-only` and `.visually-hidden` both defined per audit item 3, partial placeholder min-heights (so the page doesn't reflow when partials arrive), two-column layout for pages with the rail, reduced-motion support per audit item 11

### Route inventory and generator
- `route_inventory.py` — **single source of truth for every URL at launch.** 14 static routes defined explicitly; 107 dynamic routes (16 figures + 91 sources) generated from `detroit.json`. Each route carries title, description, rail flag, phase tag, and status (stub / in-progress / live). Can be imported as a module or invoked as a CLI to print the inventory as a table.
- `generate_stubs.py` — reads the inventory, stamps a complete HTML file at every URL using the canonical template. Idempotent. Re-run whenever `detroit.json` changes and the route tree stays in sync with the data.
- `test_routes.py` — verifies every URL: file exists, DOCTYPE present, skip link present, navbar/footer/main placeholders present, rail placeholder present if and only if expected, canonical URL matches, title matches. Also verifies required partials and assets exist. Exits non-zero on any failure.

### Generated site tree
- `site/` — 121 stub HTML files organized by URL hierarchy, plus copies of `assets/` and `partials/` so the tree is self-contained and directly deployable to any static host.

---

## Route inventory summary

**Total: 121 URLs**

| Category | Count | Phase |
|---|---|---|
| Figure detail pages (from detroit.json) | 16 | 3.1 |
| Source detail pages (from detroit.json) | 91 | 3.3 |
| Figures landing | 1 | 3.4 |
| Primary Sources landing | 1 | 3.2 |
| Map visualization | 1 | 3.5 |
| Network visualization | 1 | 3.5 |
| Submit a Figure | 1 | 3.7 |
| Events | 1 | 3.7 |
| About: The Project | 1 | 3.6 |
| About: The Badman Tradition | 1 | 3.6 |
| About: Methodology | 1 | 3.6 |
| Homepage | 1 | 3.8 |
| Contact | 1 | 4.4 |
| How to Cite | 1 | 4.5 |
| Accessibility | 1 | 4.4 |
| 404 | 1 | 4.3 |

---

## Decisions made this phase

### Per your direction
- **ID-based URLs.** Figure pages live at `/archive/figures/baker_gordon/`. Source pages live at `/archive/sources/src_dt_0001/`. No slug logic, no collision handling, no legacy redirects to maintain.
- **Fetch() at runtime for partials.** Per the sprint doc. No build step required. FOUC mitigated via CSS min-heights on placeholder divs.

### Made inline (flag if any are wrong)
- **Trailing slashes on every URL.** Directory-with-`index.html` pattern. Works on any static host (GitHub Pages, Netlify, Apache, Nginx). Lets underlying file names change without breaking links.
- **Map and Network nested under `/visualizations/`.** Sprint doc says `/map` and `/network` in one spot and "Visualizations" as the nav grouping elsewhere. Unified these by putting the URLs under the IA grouping so nav and URL match.
- **Accessibility page added at `/accessibility/`.** Wasn't explicitly on the sprint doc route list but the footer's accessibility statement needed a destination, and the audit PDF implies we'll want to publish an accessibility statement. Added it with stub status and Phase 4.4 tag.
- **Stub banner on every generated page.** A dashed-border note at the top of each stub says *"Stub page. Content scheduled for Phase X.Y."* with the specific phase number. Helps during the sprint and gets removed per-page when that page's real content lands. Banner has `role="note"` for screen readers.
- **h2 autogeneration for TOC ids.** The partial loader auto-assigns IDs to h2 elements that don't have them (slug-style, first 50 chars). Avoids hand-authoring IDs on every heading in every stub. Explicit IDs override the auto-gen.

---

## Test harness

Running `python3 test_routes.py site detroit.json`:

```
======================================================================
BDA Route Scaffold Test
======================================================================

Routes tested: 121
  ✓ Passed: 121
  ✗ Failed: 0

Assets: all 5 required files present
```

The harness exits non-zero if any check fails, so it can be wired into a CI workflow or pre-commit hook later.

It checks for:
1. File exists at the expected path
2. `<!DOCTYPE html>` present
3. Skip link class present
4. Navbar placeholder present
5. Main content element present
6. Footer placeholder present
7. partials.js script reference present
8. styles.css link present
9. Credentialing rail placeholder present if and only if route expects one
10. Canonical URL matches the route
11. Title matches the route

---

## Bugs caught during the build

1. **Template doc comment leaking into output.** The `{{TITLE}}` / `{{DESCRIPTION}}` / etc. slot tokens originally appeared inside an HTML comment block documenting the template. Naive `.replace()` replaced them there too, producing mangled comment blocks at the top of every generated file. Fix: removed the doc comment from the template itself; template documentation now lives in this report and in `generate_stubs.py` itself.
2. **Meta descriptions truncated mid-word at 160 chars.** First pass used `biography.description[:160]` which cut mid-sentence and mid-word, sometimes in awkward places. Fix: new `_trim_description()` helper prefers first-sentence trim if it fits, falls back to word-boundary trim with ellipsis. Also normalizes em-dashes to `", "` and strips smart quotes — they don't display well in meta tags.

---

## Not done this phase (deferred per sprint scope)

- **Visual design polish.** Phase 2 establishes structure, not aesthetics. Hero layouts, typography scale, card designs, filter UIs — all Phase 3.
- **Actual page content.** Every page is a stub. Phase 3 authors the content.
- **Search.** Phase 4.2.
- **Empty-state UX and 404 "did you mean" suggestions.** Phase 4.3. The 404 page exists as a stub but doesn't yet consult the inventory for fuzzy matching.
- **Map/network schema adapter.** The existing `map.html` and `network.html` still expect the old nested-source JSON structure. My Phase 1 report recommended folding that adapter into Phase 3.5 when we're already in that code for the modality filter UI. Restating that here so it isn't forgotten.
- **Partial acknowledgment text in footer.** Left as a placeholder `<li>` with italic note. Will populate once outreach confirmations are in hand from the Wright Museum, Reuther, and Hackley Collection.

---

## Workflow for Phase 3

When a Phase 3 task picks up a specific page:

1. Edit the generated stub directly at `site/[path]/index.html` (or edit the generator's `render_main_content()` to improve the generic scaffold for a whole class of page).
2. Update the route's `status` in `route_inventory.py` from `"stub"` to `"in-progress"` to `"live"` as the page matures.
3. Re-run `test_routes.py` to make sure nothing regressed structurally.

For figure and source detail pages specifically: Phase 3.1 and 3.3 will likely want to enrich `generate_stubs.py` to render the full template populated from `detroit.json` (biography, scores, connections, citation block, etc.) rather than editing 16 + 91 = 107 files by hand. The generator is set up for this — just expand `render_main_content()` with the data-driven rendering logic.

---

## Handoff state

Every deliverable is in `/home/claude/bda_phase2/` and packaged in `/mnt/user-data/outputs/bda_phase2_scaffold.zip`:

```
bda_phase2/
├── partials/
│   ├── _page-template.html
│   ├── navbar.html
│   ├── footer.html
│   └── credentialing-rail.html
├── assets/
│   ├── css/styles.css
│   └── js/partials.js
├── route_inventory.py
├── generate_stubs.py
├── test_routes.py
├── site/                          (generated, 121 stubs)
│   ├── [14 static page dirs]
│   ├── assets/                    (copied from ../assets)
│   ├── partials/                  (copied from ../partials)
│   └── [107 dynamic page dirs]
└── PHASE_2_COMPLETION_REPORT.md
```

Phase 2 is closed. Ready for Phase 3.
