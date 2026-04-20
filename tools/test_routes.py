#!/usr/bin/env python3
"""
Test harness for the route scaffold.

Verifies that for every URL in the inventory:
  1. The corresponding file exists on disk in the output tree
  2. The file contains the required structural elements:
     - <!DOCTYPE html>
     - Skip link
     - #bda-navbar placeholder
     - #bda-main-content
     - #bda-footer placeholder
     - partials.js reference
  3. Figure and source pages contain #bda-credentialing-rail placeholder
  4. Non-figure/source pages do NOT contain the rail placeholder
  5. Canonical URL is set and matches the route
  6. Page title matches the route's title field

Also verifies that the partials and assets exist in the output tree.

Usage:
    python3 test_routes.py [site_dir] [detroit_json_path]
"""

import json
import sys
from pathlib import Path

from route_inventory import all_routes


REQUIRED_STRUCTURE = [
    "<!DOCTYPE html>",
    'class="bda-skip-link"',
    'id="bda-navbar"',
    'id="bda-main-content"',
    'id="bda-footer"',
    "/assets/js/partials.js",
    "/assets/css/styles.css",
]

REQUIRED_ASSETS = [
    "assets/css/styles.css",
    "assets/js/partials.js",
    "partials/navbar.html",
    "partials/footer.html",
    "partials/credentialing-rail.html",
]


def test_route(route, site_dir):
    """Return list of failures for this route (empty = pass)."""
    failures = []
    file_path = site_dir / route["file"]

    if not file_path.exists():
        return [f"FILE MISSING: {route['file']}"]

    html = file_path.read_text(encoding="utf-8")

    # Structural checks
    for required in REQUIRED_STRUCTURE:
        if required not in html:
            failures.append(f"missing structural element: {required}")

    # Rail placeholder presence/absence
    has_rail = 'id="bda-credentialing-rail"' in html
    if route["rail"] and not has_rail:
        failures.append("expected credentialing rail placeholder, missing")
    if not route["rail"] and has_rail:
        failures.append("unexpected credentialing rail placeholder present")

    # Canonical URL
    expected_canonical = f'href="https://detroit.badmandigitalarchive.com{route["url"]}"'
    if expected_canonical not in html:
        failures.append(f"canonical URL does not match {route['url']}")

    # Title check (title can contain special chars, so be lenient)
    if f"<title>{route['title']}" not in html:
        failures.append(f"<title> does not start with {route['title']!r}")

    return failures


def test_assets(site_dir):
    """Verify partials and assets exist in the output tree."""
    failures = []
    for asset in REQUIRED_ASSETS:
        path = site_dir / asset
        if not path.exists():
            failures.append(f"missing asset: {asset}")
        elif path.stat().st_size == 0:
            failures.append(f"empty asset: {asset}")
    return failures


def main():
    site_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("site")
    json_path = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("/mnt/user-data/outputs/detroit.json")

    if not site_dir.exists():
        print(f"ERROR: site directory not found: {site_dir}")
        print("Run generate_stubs.py first.")
        sys.exit(1)

    with open(json_path) as f:
        data = json.load(f)

    routes = all_routes(data)

    # Test assets
    asset_failures = test_assets(site_dir)

    # Test each route
    total_pass = 0
    total_fail = 0
    route_failures = []
    for route in routes:
        failures = test_route(route, site_dir)
        if failures:
            total_fail += 1
            route_failures.append((route, failures))
        else:
            total_pass += 1

    # Report
    print(f"{'='*70}")
    print(f"BDA Route Scaffold Test")
    print(f"{'='*70}")
    print()
    print(f"Routes tested: {len(routes)}")
    print(f"  ✓ Passed: {total_pass}")
    print(f"  ✗ Failed: {total_fail}")
    print()

    if asset_failures:
        print(f"Asset failures: {len(asset_failures)}")
        for f in asset_failures:
            print(f"  ✗ {f}")
        print()
    else:
        print(f"Assets: all {len(REQUIRED_ASSETS)} required files present")
        print()

    if route_failures:
        print(f"Route failure details:")
        for route, failures in route_failures[:10]:  # cap at 10 for readability
            print(f"\n  {route['url']}  ({route['file']})")
            for f in failures:
                print(f"    ✗ {f}")
        if len(route_failures) > 10:
            print(f"\n  ... and {len(route_failures) - 10} more failing routes")

    # Summary by status
    print()
    print(f"{'='*70}")
    by_status = {}
    for r in routes:
        by_status.setdefault(r["status"], 0)
        by_status[r["status"]] += 1
    print(f"Route count by status: {by_status}")

    by_phase = {}
    for r in routes:
        by_phase.setdefault(r["phase"], 0)
        by_phase[r["phase"]] += 1
    print(f"Route count by phase:  {dict(sorted(by_phase.items()))}")
    print(f"{'='*70}")

    if total_fail or asset_failures:
        sys.exit(1)


if __name__ == "__main__":
    main()
