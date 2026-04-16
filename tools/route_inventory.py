"""
Route inventory for the Detroit Badman Archive.

This is the single source of truth for:
  - Every URL that exists at launch
  - What page file serves each URL
  - Whether the page has a credentialing rail
  - What the page's <title>, <h1>, and meta description are
  - The current build status (stub / in-progress / live)

Consumed by:
  - generate_stubs.py (builds HTML files at every URL)
  - (Phase 3/4) test_routes.py (test harness verifying every URL returns 200
    and contains the expected nav)
  - (Phase 4.3) 404 page (uses the inventory to offer "did you mean" suggestions)

Status codes:
  'stub'        — Empty scaffold with nav/footer but no content
  'in-progress' — Partial content, not ready for public viewing
  'live'        — Fully authored, ready for launch

"""

# Static routes — every page at launch except figure/source detail pages
# (which are generated dynamically from detroit.json).
STATIC_ROUTES = [
    # --- Root ---
    {
        "url": "/",
        "file": "index.html",
        "title": "Home",
        "h1": "Detroit Badman Digital Archive",
        "description": "A digital humanities archive documenting Black masculine heroism in Detroit. Built at Michigan State University's Cultural Heritage Informatics Fellowship.",
        "rail": False,
        "status": "stub",
        "phase": "3.8",
    },

    # --- About ---
    {
        "url": "/about/project/",
        "file": "about/project/index.html",
        "title": "The Project",
        "h1": "The Project",
        "description": "What the Detroit Badman Digital Archive is, who runs it, and what it is trying to do.",
        "rail": False,
        "status": "stub",
        "phase": "3.6",
    },
    {
        "url": "/about/tradition/",
        "file": "about/tradition/index.html",
        "title": "The Badman Tradition",
        "h1": "The Badman Tradition",
        "description": "The five criteria that define a badman, explained in plain language.",
        "rail": False,
        "status": "stub",
        "phase": "3.6",
    },
    {
        "url": "/about/methodology/",
        "file": "about/methodology/index.html",
        "title": "Methodology",
        "h1": "Methodology",
        "description": "Research questions, theoretical framework, sources and data, analytical approach, critical approach, limitations, and transparency.",
        "rail": False,
        "status": "stub",
        "phase": "3.6",
    },

    # --- Archive landings ---
    {
        "url": "/archive/figures/",
        "file": "archive/figures/index.html",
        "title": "Figures",
        "h1": "Figures",
        "description": "Browse badman figures documented in the Detroit archive, organized by modality.",
        "rail": False,
        "status": "stub",
        "phase": "3.4",
    },
    {
        "url": "/archive/sources/",
        "file": "archive/sources/index.html",
        "title": "Primary Sources",
        "h1": "Primary Sources",
        "description": "Browse the archive's primary source collection — novels, films, speeches, and archival materials documenting Detroit's badman tradition.",
        "rail": False,
        "status": "stub",
        "phase": "3.2",
    },

    # --- Visualizations ---
    {
        "url": "/visualizations/map/",
        "file": "visualizations/map/index.html",
        "title": "Map",
        "h1": "Map",
        "description": "Interactive geospatial visualization of badman figures and territories across Detroit.",
        "rail": False,
        "status": "stub",
        "phase": "3.5",
    },
    {
        "url": "/visualizations/network/",
        "file": "visualizations/network/index.html",
        "title": "Network",
        "h1": "Network",
        "description": "Interactive network visualization of connections between badman figures.",
        "rail": False,
        "status": "stub",
        "phase": "3.5",
    },

    # --- Engagement ---
    {
        "url": "/engagement/submit/",
        "file": "engagement/submit/index.html",
        "title": "Submit a Figure",
        "h1": "Submit a Figure",
        "description": "Contribute your knowledge to the Detroit Badman Digital Archive. Community submissions are reviewed through a two-stage process.",
        "rail": False,
        "status": "stub",
        "phase": "3.7",
    },
    {
        "url": "/engagement/events/",
        "file": "engagement/events/index.html",
        "title": "Events",
        "h1": "Events",
        "description": "Community collection events, digitization days, and oral history sessions hosted in partnership with Detroit cultural institutions.",
        "rail": False,
        "status": "stub",
        "phase": "3.7",
    },

    # --- Top-level utility pages ---
    {
        "url": "/contact/",
        "file": "contact/index.html",
        "title": "Contact",
        "h1": "Contact",
        "description": "Get in touch with the Detroit Badman Digital Archive team.",
        "rail": False,
        "status": "stub",
        "phase": "4.4",
    },
    {
        "url": "/cite/",
        "file": "cite/index.html",
        "title": "How to Cite",
        "h1": "How to Cite This Archive",
        "description": "Citation formats for the Detroit Badman Digital Archive in Chicago, MLA, and APA styles.",
        "rail": False,
        "status": "stub",
        "phase": "4.5",
    },
    {
        "url": "/accessibility/",
        "file": "accessibility/index.html",
        "title": "Accessibility",
        "h1": "Accessibility Statement",
        "description": "The Detroit Badman Digital Archive's commitment to WCAG 2.2 AA conformance and MSU Digital Accessibility Policy compliance.",
        "rail": False,
        "status": "stub",
        "phase": "4.4",
    },

    # --- 404 ---
    {
        "url": "/404.html",
        "file": "404.html",
        "title": "Page Not Found",
        "h1": "Page Not Found",
        "description": "The page you requested could not be found.",
        "rail": False,
        "status": "stub",
        "phase": "4.3",
    },
]


def _trim_description(text, max_len=155):
    """
    Trim a description string for use in <meta description>.
    Prefers the first sentence if it fits; falls back to word-boundary trim.
    Strips em-dashes and quote marks that display awkwardly in meta tags.
    """
    if not text:
        return ""
    # Normalize: replace em-dash with comma-space, strip smart quotes
    clean = text.replace("—", ", ").replace("'", "'").replace("'", "'")
    clean = clean.replace('"', '"').replace('"', '"')
    clean = " ".join(clean.split())

    # Try first sentence
    for punct in [". ", "! ", "? "]:
        idx = clean.find(punct)
        if 0 < idx <= max_len:
            return clean[: idx + 1]

    # Fall back to word-boundary trim
    if len(clean) <= max_len:
        return clean
    cut = clean[:max_len].rsplit(" ", 1)[0]
    return cut + "…"


def dynamic_routes_from_data(detroit_json):
    """
    Generate figure and source detail routes from detroit.json.

    Returns a list of route dicts in the same shape as STATIC_ROUTES.
    Excludes placeholder entries (those with _placeholder: true and no id).
    """
    routes = []

    # Figure detail pages
    for fig in detroit_json.get("figures", []):
        if fig.get("_placeholder") or not fig.get("id"):
            continue
        fid = fig["id"]
        bio = fig.get("biography", {}).get("description", "")
        description = _trim_description(bio) or f"Archive entry for {fig['name']}."
        routes.append({
            "url": f"/archive/figures/{fid}/",
            "file": f"archive/figures/{fid}/index.html",
            "title": fig["name"],
            "h1": fig["name"],
            "description": description,
            "rail": True,
            "status": "stub",
            "phase": "3.1",
            "figure_id": fid,
        })

    # Source detail pages
    for src in detroit_json.get("sources", []):
        sid = src["id"]
        title = src.get("title", sid)
        routes.append({
            "url": f"/archive/sources/{sid}/",
            "file": f"archive/sources/{sid}/index.html",
            "title": title,
            "h1": title,
            "description": f"Source: {title}. {src.get('type', 'source')} supporting archive entries.",
            "rail": True,
            "status": "stub",
            "phase": "3.3",
            "source_id": sid,
        })

    return routes


def all_routes(detroit_json=None):
    """Return STATIC_ROUTES plus all dynamic routes if detroit.json is provided."""
    if detroit_json is None:
        return list(STATIC_ROUTES)
    return list(STATIC_ROUTES) + dynamic_routes_from_data(detroit_json)


if __name__ == "__main__":
    # CLI mode: print the inventory as a table
    import json
    import sys
    from pathlib import Path

    detroit_path = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    if detroit_path and detroit_path.exists():
        with open(detroit_path) as f:
            data = json.load(f)
        routes = all_routes(data)
    else:
        routes = all_routes()

    print(f"{'URL':<45} {'PHASE':<8} {'RAIL':<5} {'STATUS'}")
    print("-" * 80)
    for r in routes:
        print(f"{r['url']:<45} {r['phase']:<8} {'Y' if r['rail'] else '-':<5} {r['status']}")
    print()
    print(f"Total routes: {len(routes)}")
