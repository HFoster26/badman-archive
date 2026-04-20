#!/usr/bin/env python3
"""
Generate HTML stubs for every route in the inventory.

Usage:
    python3 generate_stubs.py [output_dir] [detroit_json_path]

Default paths:
    output_dir = ./site/
    detroit_json = /mnt/user-data/outputs/detroit.json

Every stub is a complete HTML file using the canonical template with:
  - Nav placeholder (populated at runtime by partials.js)
  - Footer placeholder (populated at runtime by partials.js)
  - Credentialing rail placeholder (on figure/source pages only)
  - A <main> with h1, stub banner, and a content skeleton
  - Correct <title>, meta description, canonical URL
"""

import json
import sys
from pathlib import Path

from route_inventory import all_routes

SITE_DOMAIN = "https://detroit.badmandigitalarchive.com"
TEMPLATE_PATH = Path(__file__).parent / "partials" / "_page-template.html"


def read_template():
    return TEMPLATE_PATH.read_text(encoding="utf-8")


def render_stub(template, route):
    """Render a single route into a complete HTML file."""
    # Canonical URL. For 404.html, use the path as-is.
    canonical = f"{SITE_DOMAIN}{route['url']}"

    # Layout class and rail slot
    if route["rail"]:
        layout_class = "bda-page-with-rail"
        rail_slot = '<div id="bda-credentialing-rail"></div>'
    else:
        layout_class = "bda-page-main"
        rail_slot = ""

    # Main content body — a minimal scaffold the authoring work will replace.
    # The stub banner signals that this page is not yet fully authored.
    main_content = render_main_content(route)

    # Page-specific scripts (none at stub stage; figure/source pages will add
    # data-loading scripts in Phase 3).
    page_scripts = ""

    return (
        template
        .replace("{{TITLE}}", route["title"])
        .replace("{{DESCRIPTION}}", route["description"])
        .replace("{{CANONICAL}}", canonical)
        .replace("{{LAYOUT_CLASS}}", layout_class)
        .replace("{{RAIL_SLOT}}", rail_slot)
        .replace("{{MAIN_CONTENT}}", main_content)
        .replace("{{PAGE_SCRIPTS}}", page_scripts)
    )


def render_main_content(route):
    """Build the <main> body for a stub page."""
    h1 = route["h1"]
    phase = route.get("phase", "?")

    lines = [
        f'      <div class="bda-stub-banner" role="note">',
        f'        <strong>Stub page.</strong> Content for this page is scheduled '
        f'for Phase {phase} of the pre-launch sprint.',
        f'      </div>',
        f'      <h1>{h1}</h1>',
    ]

    # Figure-specific scaffold
    if route.get("figure_id"):
        fid = route["figure_id"]
        lines += [
            f'      <p class="bda-stub-note">',
            f'        Figure record: <code>{fid}</code>',
            f'      </p>',
            f'      <h2>Justification Essay</h2>',
            f'      <p><em>Essay in development.</em></p>',
            f'      <h2>Biography</h2>',
            f'      <p><em>Pulled from <code>detroit.json</code> at build time in Phase 3.1.</em></p>',
            f'      <h2>Five-Criteria Evaluation</h2>',
            f'      <p><em>Renders from <code>scores</code> bucket in Phase 3.1.</em></p>',
            f'      <h2>Connections</h2>',
            f'      <p><em>Renders from <code>connections</code> bucket in Phase 3.1.</em></p>',
            f'      <h2>Geography</h2>',
            f'      <p><em>Map preview renders in Phase 3.1.</em></p>',
            f'      <h2>Primary Sources</h2>',
            f'      <p><em>Source cards render from <code>source_ids</code> in Phase 3.1.</em></p>',
            f'      <h2>How to Cite This Entry</h2>',
            f'      <p><em>Generated citation block in Phase 4.5.</em></p>',
        ]
    # Source-specific scaffold
    elif route.get("source_id"):
        sid = route["source_id"]
        lines += [
            f'      <p class="bda-stub-note">',
            f'        Source record: <code>{sid}</code>',
            f'      </p>',
            f'      <h2>Source Viewer</h2>',
            f'      <p><em>Viewer with zoom/description/download controls renders in Phase 3.3.</em></p>',
            f'      <h2>Metadata</h2>',
            f'      <p><em>Metadata rail renders from source fields in Phase 3.3.</em></p>',
            f'      <h2>Cited In</h2>',
            f'      <p><em>Back-references render from <code>figure_ids</code> in Phase 3.3.</em></p>',
            f'      <h2>Related Sources</h2>',
            f'      <p><em>Related sources grid renders in Phase 3.3.</em></p>',
            f'      <h2>How to Cite This Source</h2>',
            f'      <p><em>Generated citation block in Phase 4.5.</em></p>',
        ]
    # 404 page
    elif route["url"] == "/404.html":
        lines = [
            '      <h1>Page Not Found</h1>',
            '      <p>',
            '        The page you requested does not exist at this URL.',
            '      </p>',
            '      <p>',
            '        Try the <a href="/archive/figures/">Figures landing</a>,',
            '        the <a href="/archive/sources/">Primary Sources landing</a>, or',
            '        <a href="/">return home</a>.',
            '      </p>',
            '      <p class="bda-stub-note">',
            '        <em>"Did you mean" suggestions from the route inventory in Phase 4.3.</em>',
            '      </p>',
        ]
    # Default scaffold for any other static page
    else:
        lines += [
            f'      <p>',
            f'        {route["description"]}',
            f'      </p>',
            f'      <p class="bda-stub-note">',
            f'        <em>Full content lands in Phase {phase}.</em>',
            f'      </p>',
        ]

    return "\n".join(lines)


def main():
    out_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("site")
    json_path = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("/mnt/user-data/outputs/detroit.json")

    with open(json_path) as f:
        data = json.load(f)

    routes = all_routes(data)
    template = read_template()

    out_dir.mkdir(parents=True, exist_ok=True)

    # Copy assets and partials into the output directory so the generated
    # site is self-contained and testable.
    import shutil
    source_root = Path(__file__).parent
    for subdir in ["assets", "partials"]:
        dst = out_dir / subdir
        if dst.exists():
            shutil.rmtree(dst)
        shutil.copytree(source_root / subdir, dst)

    count = 0
    for route in routes:
        html = render_stub(template, route)
        out_path = out_dir / route["file"]
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(html, encoding="utf-8")
        count += 1

    print(f"Generated {count} stubs in {out_dir}/")
    print(f"  - {sum(1 for r in routes if r.get('figure_id'))} figure pages")
    print(f"  - {sum(1 for r in routes if r.get('source_id'))} source pages")
    print(f"  - {sum(1 for r in routes if not r.get('figure_id') and not r.get('source_id'))} static pages")


if __name__ == "__main__":
    main()
