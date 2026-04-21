#!/usr/bin/env python3
"""
build_figures.py — Detroit Badman Archive figure page generator (v4)

Reads docs/data/detroit.json and writes each non-stub figure's page into
docs/archive/figures/entries/[figure_id]/index.html, creating missing
folders as needed. Pairs with the live site's map.html and network.html
so clicking a marker/node routes to the full figure page.

v4 CHANGES (vs v3)
------------------
  - gangsta_pimp added to ACTIVE_MODALITIES (Goines is live)
  - Folders are created on demand (mkdir parents=True) instead of being
    required beforehand — add a figure to detroit.json, run the script
    once, no manual folder setup
  - Status gating flipped: generate for status="live" OR status unset.
    Only skip when status is explicitly "stub"
  - Default paths now repo-root relative — run from repo root with no
    flags
  - Figure entries nested under /archive/figures/entries/ to keep the
    figures landing page clean and leave room for browse-by pages at
    /archive/figures/by-modality/, /archive/figures/by-decade/ etc.
    URLs: /archive/figures/entries/goines_donald/

v3 RULES (still in force)
-------------------------
  - Modality colors via CSS classes (.modality-badge.modality-{slug}),
    never hardcoded hex
  - SVM slug is `shv` to align with --dba-shv
  - Bare descriptive class names for content (.essay, .bio-overview,
    .data-section, .source-grid)
  - `bda-*` prefix reserved for structural scaffold wrappers
  - `dba-*` prefix reserved for CSS variables
  - CC (Creation Continuity) edge type included
  - No inline `style="..."` attributes anywhere

ARCHITECTURE
------------
  - URL pattern: /archive/figures/entries/[figure_id]/
  - Partials auto-loaded by /partials/partials.js into:
      #bda-navbar, #bda-footer, #bda-credentialing-rail
  - CSS: /assets/css/styles.css
  - Canonical URL base: https://detroit.badmandigitalarchive.com
  - "On this page" TOC auto-built from <h2> in <main> by partials.js,
    so every major section uses <h2> and sub-sections use <h3>

BEHAVIOR
--------
  status == "stub"   -> skipped (left untouched if folder exists)
  status == "live"   -> full page generated (folder created if missing)
  status unset       -> full page generated (folder created if missing)
  dormant modality   -> skipped (not in ACTIVE_MODALITIES)
  _placeholder: true -> skipped

USAGE
-----
From repo root:
    python3 tools/build_figures.py

With explicit paths:
    python3 tools/build_figures.py --data docs/data/detroit.json --out docs/archive/figures

Options:
    --dry-run   Show what would be written without modifying files
    --quiet     Suppress per-figure output
"""

import argparse
import html
import json
import sys
from datetime import datetime
from pathlib import Path

# =============================================================================
# CONFIG
# =============================================================================

# Modality config — class slug is what gets emitted in HTML.
# The slug aligns with the CSS variable name (--dba-{slug}), which is the
# single source of truth for modality color.
MODALITY_CONFIG = {
    "detective":         {"label": "Detective",               "slug": "detective",     "abbr": "DET"},
    "revolutionary":     {"label": "Political Revolutionary", "slug": "revolutionary", "abbr": "PRM"},
    "gangsta_pimp":      {"label": "Gangsta-Pimp",            "slug": "gangsta-pimp",  "abbr": "GPM"},
    "superhero_villain": {"label": "Superhero-Villain",       "slug": "shv",           "abbr": "SVM"},
    "folk_hero_outlaw":  {"label": "Folk Hero-Outlaw",        "slug": "folk-hero",     "abbr": "FHO"},
}

CRITERIA_LABELS = {
    "outlaw_relationship":        "Outlaw Relationship to Law",
    "community_authorization":    "Community Authorization",
    "violence_as_language":       "Violence as Language",
    "cultural_preservation":      "Cultural Preservation Function",
    "hypermasculine_performance": "Hypermasculine Performance",
}

# Edge type labels. CC (Creation Continuity) per DATAREADME v2.1.
EDGE_TYPE_LABELS = {
    "META": "Meta-Badman Connections",
    "P2C":  "Person-to-Character",
    "C2C":  "Character-to-Character",
    "ORG":  "Organizational / Contemporary",
    "CC":   "Creation Continuity",
}

# Active modalities — pages are only generated for figures in these modalities.
# GPM included because Goines is live.
ACTIVE_MODALITIES = {"detective", "revolutionary", "superhero_villain"}

# Subdirectory that holds per-figure folders, relative to out_dir.
# /archive/figures/entries/[figure_id]/index.html
ENTRIES_SUBDIR = "entries"

CANONICAL_BASE = "https://detroit.badmandigitalarchive.com"

SITE_PATHS = {
    "css":           "/assets/css/styles.css",
    "partials_js":   "/partials/partials.js",
    "bootstrap_css": "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css",
    "bootstrap_js":  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js",
    "leaflet_css":   "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
    "leaflet_js":    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
    "figures_list":  "/archive/figures/figures.html",
    "full_map":      "/visualizations/map.html",
}


def figure_url_path(figure_id):
    """Canonical absolute path for a figure page,
    e.g. /archive/figures/entries/scott_ron/"""
    return f"/archive/figures/{ENTRIES_SUBDIR}/{figure_id}/"


# =============================================================================
# HELPERS
# =============================================================================

def esc(value):
    if value is None:
        return ""
    return html.escape(str(value), quote=True)


def para_list(value):
    if value is None:
        return []
    if isinstance(value, list):
        return [str(p) for p in value if str(p).strip()]
    text = str(value)
    parts = [p.strip() for p in text.split("\n\n")]
    return [p for p in parts if p]


def get_coords(figure):
    # Prefer canonical: geographic.primary_location.coordinates
    geo = figure.get("geographic") or {}
    primary = geo.get("primary_location") or {}
    gcoords = primary.get("coordinates")
    if isinstance(gcoords, dict) and "lat" in gcoords and "lng" in gcoords:
        return gcoords

    # Fallbacks
    coords = figure.get("coordinates")
    if isinstance(coords, dict) and "lat" in coords and "lng" in coords:
        return coords
    geo_old = figure.get("geography") or {}
    gcoords_old = geo_old.get("coordinates")
    if isinstance(gcoords_old, dict) and "lat" in gcoords_old and "lng" in gcoords_old:
        return gcoords_old

    if "lat" in figure and "lng" in figure:
        return {"lat": figure["lat"], "lng": figure["lng"]}
    return None


def get_polygon(figure):
    """Return polygon from geographic.territory.polygon with fallbacks."""
    geo = figure.get("geographic") or {}
    territory = geo.get("territory") or {}
    poly = territory.get("polygon")
    if isinstance(poly, list) and len(poly) >= 3:
        return poly

    geo_old = figure.get("geography") or {}
    poly_old = geo_old.get("polygon") or figure.get("polygon")
    if isinstance(poly_old, list) and len(poly_old) >= 3:
        return poly_old

    return None


def get_additional_locations(figure):
    geo = figure.get("geographic") or {}
    locs = geo.get("additional_locations")
    if locs:
        return locs
    geo_old = figure.get("geography") or {}
    return geo_old.get("additional_locations") or figure.get("additional_locations") or []


def get_biography(figure):
    bio = figure.get("biography") or {}
    return {
        "description": bio.get("description") or bio.get("overview") or "",
        "key_events":  bio.get("key_events") or bio.get("timeline") or [],
    }


# =============================================================================
# SECTION RENDERERS
# =============================================================================

def render_modality_badge(figure):
    """Emit a modality badge as <p class="modality-badge modality-{slug}">."""
    mod = MODALITY_CONFIG.get(figure.get("modality"))
    if not mod:
        return ""
    slug = mod["slug"]
    label = esc(mod["label"])
    return (
        f'<p class="modality-badge modality-{slug}">'
        f'<span class="modality-badge-label">{label} Modality</span>'
        f'</p>'
    )


def render_justification(figure):
    """Justification essay wrapper uses class `essay`."""
    paras = para_list(figure.get("justification"))
    if not paras:
        body = "<p><em>Justification essay in development.</em></p>"
    else:
        body = "\n        ".join(f"<p>{esc(p)}</p>" for p in paras)
    return f'''      <h2>Justification Essay</h2>
      <article class="essay">
        {body}
      </article>'''


def render_biography(figure):
    """Biography overview wrapper uses class `bio-overview`."""
    bio = get_biography(figure)
    description = bio["description"]
    events = bio["key_events"]

    overview_inner = (
        f'<p>{esc(description)}</p>' if description
        else '<p><em>Biography in development.</em></p>'
    )
    overview = f'<div class="bio-overview">\n        {overview_inner}\n      </div>'

    if not events:
        timeline_html = ""
    else:
        items = []
        for ev in events:
            year = esc(ev.get("year", ""))
            event = esc(ev.get("event", ""))
            location = ev.get("location", "")
            loc_html = (
                f' <span class="timeline-location">&mdash; {esc(location)}</span>'
                if location else ""
            )
            items.append(
                f'          <li class="timeline-item">'
                f'<span class="timeline-year">{year}</span> '
                f'<span class="timeline-event">{event}</span>'
                f'{loc_html}'
                f'</li>'
            )
        timeline_items = "\n".join(items)
        timeline_html = f'''
      <h3>Timeline</h3>
      <ol class="figure-timeline">
{timeline_items}
      </ol>'''

    return f'''      <h2>Biography</h2>
      {overview}{timeline_html}'''


def render_evaluation(figure):
    """Five-criteria evaluation using <dl class="criteria-evaluation">."""
    scores = figure.get("scores") or {}
    if not scores:
        return '      <h2>Five-Criteria Evaluation</h2>\n      <p><em>Evaluation in development.</em></p>'

    rows = []
    total = 0
    count = 0
    for key, label in CRITERIA_LABELS.items():
        score = scores.get(key)
        if not score or not isinstance(score, dict):
            continue
        try:
            value = int(score.get("score", score.get("value", 0)))
        except (ValueError, TypeError):
            value = 0
        total += value
        count += 1
        justification = esc(score.get("justification", ""))
        rows.append(
            f'''        <dt class="criterion">
          <span class="criterion-label">{esc(label)}</span>
          <span class="criterion-score" aria-label="Score: {value} of 5">{value}<span aria-hidden="true">&nbsp;/&nbsp;5</span></span>
        </dt>
        <dd class="criterion-justification">{justification}</dd>'''
        )

    if count == 0:
        return '      <h2>Five-Criteria Evaluation</h2>\n      <p><em>Evaluation in development.</em></p>'

    total_line = (
        f'      <p class="criteria-total">'
        f'<strong>Total score:</strong> {total}&nbsp;/&nbsp;{count * 5} '
        f'<span class="text-faded">({count} criteria scored)</span></p>'
    )

    return f'''      <h2>Five-Criteria Evaluation</h2>
      <p class="section-intro">Each figure is scored against the five criteria that define the badman tradition. Scores range 1&ndash;5.</p>
      <dl class="criteria-evaluation">
{chr(10).join(rows)}
      </dl>
{total_line}'''


def render_connections(figure, figures_by_id):
    """Connections grouped by edge type. CC included. Cross-figure links
    point to /archive/figures/entries/[target_id]/."""
    connections = figure.get("connections") or []
    if not connections:
        return '      <h2>Connections</h2>\n      <p><em>No documented connections yet.</em></p>'

    groups = {}
    for c in connections:
        ctype = c.get("type", "ORG")
        groups.setdefault(ctype, []).append(c)

    group_blocks = []
    for edge_type, label in EDGE_TYPE_LABELS.items():
        if edge_type not in groups:
            continue
        items = []
        for c in groups[edge_type]:
            target_id = c.get("target_id", "")
            target = figures_by_id.get(target_id)
            target_name = target.get("name") if target else target_id

            if target and target.get("modality") in ACTIVE_MODALITIES:
                link_html = f'<a href="{figure_url_path(target_id)}">{esc(target_name)}</a>'
            else:
                link_html = f'<span class="inactive-link">{esc(target_name)}</span>'

            years = ""
            if c.get("start_year") or c.get("end_year"):
                start = esc(c.get("start_year") or "?")
                end = esc(c.get("end_year") or "present")
                years = f' <span class="connection-years">({start}&ndash;{end})</span>'

            tier = ""
            if c.get("tier"):
                tier_val = esc(c.get("tier"))
                tier = (
                    f' <span class="tier-badge tier-{tier_val}" '
                    f'aria-label="Evidence tier {tier_val}">T{tier_val}</span>'
                )

            evidence = ""
            if c.get("evidence"):
                evidence = f'\n          <p class="connection-evidence">{esc(c["evidence"])}</p>'

            items.append(
                f'        <li class="connection-item">\n'
                f'          <span class="connection-header">{link_html}{years}{tier}</span>'
                f'{evidence}\n'
                f'        </li>'
            )
        group_blocks.append(
            f'''      <h3>{esc(label)}</h3>
      <ul class="connection-list">
{chr(10).join(items)}
      </ul>'''
        )

    return f'''      <h2>Connections</h2>
      <div class="data-section">
      <p class="section-intro">Relationships to other figures in the archive, grouped by edge type.</p>
{chr(10).join(group_blocks)}
      </div>'''


def render_geography(figure):
    """Geography section with Leaflet mini-map preview. The script at the
    bottom of the page hooks #bda-geography-preview and renders the map
    inline."""
    coords = get_coords(figure)
    if not coords:
        return '      <h2>Geography</h2>\n      <p><em>No geographic coordinates recorded.</em></p>'

    lat = coords["lat"]
    lng = coords["lng"]
    figure_id = figure.get("id", "")
    figure_name = esc(figure.get("name", ""))

    polygon = get_polygon(figure)
    polygon_attr = json.dumps(polygon) if polygon else "null"

    extra = get_additional_locations(figure)
    extra_html = ""
    if extra:
        items = []
        for loc in extra:
            name = esc(loc.get("name", ""))
            sig = esc(loc.get("significance", ""))
            items.append(
                f'          <li><strong>{name}</strong>'
                + (f' &mdash; {sig}' if sig else '')
                + '</li>'
            )
        extra_html = f'''
      <h3>Additional Locations</h3>
      <ul class="additional-locations">
{chr(10).join(items)}
      </ul>'''

    return f'''      <h2>Geography</h2>
      <div
        id="bda-geography-preview"
        class="map-preview"
        role="img"
        aria-label="Map preview of {figure_name}'s primary territory"
        data-lat="{lat}"
        data-lng="{lng}"
        data-polygon='{polygon_attr}'></div>
      <p class="map-link">
        <a href="{SITE_PATHS["full_map"]}?focus={esc(figure_id)}">View on the full archive map &rarr;</a>
      </p>{extra_html}'''


def render_sources(figure, sources_by_id):
    """Primary Sources grid. Source links point to
    /archive/sources/entries/[source_id]/ for consistency with the
    figures/entries/ pattern."""
    source_ids = figure.get("source_ids") or figure.get("sources") or []

    if isinstance(source_ids, dict):
        flat = []
        for bucket in ("primary", "secondary", "archival"):
            flat.extend(source_ids.get(bucket, []))
        source_ids = flat

    if not source_ids:
        return '      <h2>Primary Sources</h2>\n      <p><em>No sources catalogued yet.</em></p>'

    cards = []
    for sid in source_ids:
        if isinstance(sid, dict):
            title = esc(sid.get("title", "Untitled source"))
            stype = esc(sid.get("type", ""))
            year = esc(sid.get("year", "") or "")
            link_href = None
        else:
            src = sources_by_id.get(sid)
            if not src:
                continue
            title = esc(src.get("title", "Untitled source"))
            stype = esc(src.get("type", ""))
            year = esc(src.get("year", "") or "")
            link_href = f'/archive/sources/{ENTRIES_SUBDIR}/{esc(sid)}/'

        meta_parts = []
        if stype:
            meta_parts.append(f'<span class="source-type">{stype}</span>')
        if year:
            meta_parts.append(f'<span class="source-year">{year}</span>')
        meta_html = ' &middot; '.join(meta_parts)
        meta_block = f'<span class="source-meta">{meta_html}</span>' if meta_html else ''

        if link_href:
            card = (
                f'        <li class="source-card">\n'
                f'          <a class="source-card-link" href="{link_href}">\n'
                f'            <span class="source-title">{title}</span>\n'
                f'            {meta_block}\n'
                f'          </a>\n'
                f'        </li>'
            )
        else:
            card = (
                f'        <li class="source-card source-card-unlinked">\n'
                f'          <span class="source-title">{title}</span>\n'
                f'          {meta_block}\n'
                f'        </li>'
            )
        cards.append(card)

    return f'''      <h2>Primary Sources</h2>
      <p class="section-intro">Documented sources supporting this figure's entry. Click any source for full metadata and context.</p>
      <ul class="source-grid">
{chr(10).join(cards)}
      </ul>'''


def render_citation(figure):
    """Citation block in Chicago/MLA/APA with copy-to-clipboard buttons."""
    year = datetime.now().year
    name = figure.get("name", "Figure")
    figure_id = figure.get("id", "")
    url = f"{CANONICAL_BASE}{figure_url_path(figure_id)}"

    chicago = (
        f'Foster, Harry M. &ldquo;{esc(name)}.&rdquo; '
        f'<em>Detroit Badman Archive</em>, {year}. {url}.'
    )
    mla = (
        f'Foster, Harry M. &ldquo;{esc(name)}.&rdquo; '
        f'<em>Detroit Badman Archive</em>, {year}, {url}.'
    )
    apa = (
        f'Foster, H. M. ({year}). {esc(name)}. '
        f'<em>Detroit Badman Archive</em>. {url}'
    )

    def cite_block(style, body, cid):
        return (
            f'        <div class="citation-item">\n'
            f'          <div class="citation-header">\n'
            f'            <span class="citation-style">{style}</span>\n'
            f'            <button type="button" class="bda-citation-copy" data-copy-target="{cid}" aria-label="Copy {style} citation">Copy</button>\n'
            f'          </div>\n'
            f'          <p class="citation-text" id="{cid}">{body}</p>\n'
            f'        </div>'
        )

    return f'''      <h2>How to Cite This Entry</h2>
      <div class="citation-block">
{cite_block("Chicago", chicago, "bda-cite-chicago")}
{cite_block("MLA", mla, "bda-cite-mla")}
{cite_block("APA", apa, "bda-cite-apa")}
      </div>'''


# =============================================================================
# PAGE TEMPLATE
# =============================================================================

def render_live_page(figure, figures_by_id, sources_by_id):
    figure_id = figure.get("id", "")
    name = figure.get("name", "Unnamed figure")
    descriptor = figure.get("descriptor") or f"Entry for {name} in the Detroit Badman Archive."
    dates = figure.get("dates", "")
    canonical = f"{CANONICAL_BASE}{figure_url_path(figure_id)}"
    build_date = datetime.now().isoformat(timespec="seconds")

    dates_block = f'\n      <p class="figure-dates">{esc(dates)}</p>' if dates else ""
    descriptor_block = (
        f'\n      <p class="figure-descriptor lead">{esc(descriptor)}</p>'
        if figure.get("descriptor") else ""
    )

    return f'''<!DOCTYPE html>
<!--
  Detroit Badman Archive \u2014 figure page
  Generated: {build_date}
  Source: /data/detroit.json (id: {esc(figure_id)})
  DO NOT EDIT THIS FILE DIRECTLY. Regenerate via tools/build_figures.py.
-->
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(name)} &middot; Detroit Badman Digital Archive</title>
  <meta name="description" content="{esc(descriptor)}">
  <link rel="canonical" href="{canonical}">

  <!-- Bootstrap 5 CSS -->
  <link rel="stylesheet" href="{SITE_PATHS["bootstrap_css"]}">

  <!-- Leaflet CSS (for geography preview) -->
  <link rel="stylesheet" href="{SITE_PATHS["leaflet_css"]}">

  <!-- BDA styles -->
  <link rel="stylesheet" href="{SITE_PATHS["css"]}">
</head>
<body>

  <!-- Skip to content (WCAG 2.4.1) -->
  <a href="#bda-main-content" class="bda-skip-link">Skip to main content</a>

  <!-- Navbar (loaded by partials.js) -->
  <div id="bda-navbar"></div>

  <!-- Page content -->
  <div class="bda-page-with-rail">
    <main id="bda-main-content" tabindex="-1">
      <h1 class="figure-page-name">{esc(name)}</h1>
      {render_modality_badge(figure)}{dates_block}{descriptor_block}

{render_justification(figure)}

{render_biography(figure)}

{render_evaluation(figure)}

{render_connections(figure, figures_by_id)}

{render_geography(figure)}

{render_sources(figure, sources_by_id)}

{render_citation(figure)}
    </main>
    <div id="bda-credentialing-rail"></div>
  </div>

  <!-- Footer (loaded by partials.js) -->
  <div id="bda-footer"></div>

  <!-- Bootstrap 5 JS (for dropdowns, collapse) -->
  <script src="{SITE_PATHS["bootstrap_js"]}"></script>

  <!-- Leaflet JS (for geography preview) -->
  <script src="{SITE_PATHS["leaflet_js"]}"></script>

  <!-- BDA partial loader -->
  <script src="{SITE_PATHS["partials_js"]}"></script>

  <!-- Page-specific: geography preview + citation copy -->
  <script>
    (function () {{
      var el = document.getElementById('bda-geography-preview');
      if (el && el.dataset.lat && typeof L !== 'undefined') {{
        try {{
          var map = L.map(el, {{
            center: [parseFloat(el.dataset.lat), parseFloat(el.dataset.lng)],
            zoom: 13,
            zoomControl: false,
            scrollWheelZoom: false,
            dragging: false,
            keyboard: false
          }});
          L.tileLayer('https://{{s}}.tile.openstreetmap.org/{{z}}/{{x}}/{{y}}.png', {{
            attribution: '&copy; OpenStreetMap contributors'
          }}).addTo(map);
          L.marker([parseFloat(el.dataset.lat), parseFloat(el.dataset.lng)]).addTo(map);
          var poly = el.dataset.polygon;
          if (poly && poly !== 'null') {{
            L.polygon(JSON.parse(poly), {{ color: '#50c878', weight: 2, fillOpacity: 0.15 }}).addTo(map);
          }}
        }} catch (e) {{ console.warn('BDA: map preview failed', e); }}
      }}

      document.querySelectorAll('.bda-citation-copy').forEach(function (btn) {{
        btn.addEventListener('click', function () {{
          var target = document.getElementById(btn.getAttribute('data-copy-target'));
          if (!target) return;
          navigator.clipboard.writeText(target.innerText).then(function () {{
            var original = btn.textContent;
            btn.textContent = 'Copied';
            setTimeout(function () {{ btn.textContent = original; }}, 2000);
          }});
        }});
      }});
    }})();
  </script>

</body>
</html>
'''


# =============================================================================
# BUILD LOOP
# =============================================================================

def build(data_path, out_dir, dry_run=False, quiet=False):
    if not data_path.exists():
        print(f"ERROR: Data file not found: {data_path}", file=sys.stderr)
        return 1

    try:
        with data_path.open("r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"ERROR: Malformed JSON in {data_path}: {e}", file=sys.stderr)
        return 1

    all_figures = data.get("figures") or []
    figures_by_id = {f["id"]: f for f in all_figures if isinstance(f, dict) and f.get("id")}
    sources = data.get("sources") or []
    sources_by_id = {s["id"]: s for s in sources if isinstance(s, dict) and s.get("id")}

    entries_dir = out_dir / ENTRIES_SUBDIR

    if not quiet:
        print(f"Loaded {len(figures_by_id)} figures and {len(sources_by_id)} sources from {data_path.name}")
        print(f"Output directory: {entries_dir}")
        print(f"Active modalities: {', '.join(sorted(ACTIVE_MODALITIES))}")
        print()

    rendered = 0
    untouched_stubs = 0
    untouched_dormant = 0
    untouched_placeholders = 0
    folders_created = 0

    for figure in all_figures:
        if not isinstance(figure, dict):
            continue
        fid = figure.get("id")
        if not fid:
            continue

        if figure.get("_placeholder"):
            untouched_placeholders += 1
            if not quiet:
                print(f"  SKIP (placeholder)      : {fid}")
            continue

        if figure.get("modality") not in ACTIVE_MODALITIES:
            untouched_dormant += 1
            if not quiet:
                print(f"  SKIP (dormant modality) : {fid} [{figure.get('modality')}]")
            continue

        if figure.get("status") == "stub":
            untouched_stubs += 1
            if not quiet:
                print(f"  SKIP (stub)             : {fid}")
            continue

        figure_dir = entries_dir / fid
        folder_was_new = not figure_dir.exists()

        if not dry_run:
            figure_dir.mkdir(parents=True, exist_ok=True)

        if folder_was_new:
            folders_created += 1

        out_path = figure_dir / "index.html"
        html_doc = render_live_page(figure, figures_by_id, sources_by_id)

        if dry_run:
            marker = "WOULD CREATE FOLDER +  " if folder_was_new else "WOULD WRITE            "
            if not quiet:
                print(f"  {marker}: {out_path}  ({len(html_doc):,} bytes)")
        else:
            out_path.write_text(html_doc, encoding="utf-8")
            marker = "WROTE (folder created) " if folder_was_new else "WROTE                  "
            if not quiet:
                print(f"  {marker}: {out_path}  ({len(html_doc):,} bytes)")

        rendered += 1

    print()
    print("Build summary:")
    print(f"  Live pages generated : {rendered}")
    print(f"  Folders created      : {folders_created}")
    print(f"  Stubs untouched      : {untouched_stubs}")
    print(f"  Dormant untouched    : {untouched_dormant}")
    print(f"  Placeholders skipped : {untouched_placeholders}")
    if dry_run:
        print("  (DRY RUN \u2014 no files were written)")

    return 0


def main():
    parser = argparse.ArgumentParser(
        description="Generate Detroit Badman Archive figure pages from detroit.json."
    )
    parser.add_argument("--data", default="./docs/data/detroit.json",
                        help="Path to detroit.json (default: ./docs/data/detroit.json, relative to repo root)")
    parser.add_argument("--out", default="./docs/archive/figures",
                        help="Output base dir; entries/ is created within (default: ./docs/archive/figures)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Show what would be written without modifying files.")
    parser.add_argument("--quiet", action="store_true",
                        help="Suppress per-figure output.")
    args = parser.parse_args()

    data_path = Path(args.data).resolve()
    out_dir = Path(args.out).resolve()

    return build(
        data_path=data_path,
        out_dir=out_dir,
        dry_run=args.dry_run,
        quiet=args.quiet,
    )


if __name__ == "__main__":
    sys.exit(main())
