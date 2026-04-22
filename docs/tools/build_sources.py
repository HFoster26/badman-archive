#!/usr/bin/env python3
"""
build_sources.py — Detroit Badman Archive source page generator (v1)

Reads docs/data/detroit.json and writes each non-stub source's page into
docs/archive/sources/entries/[source_id]/index.html, creating missing
folders as needed. Parallels build_figures.py in architecture.

IMPLEMENTS: SOURCE_SCHEMA.md v2

Co-located assets: source pages that have original assets (audio,
transcript, image, etc.) expect those files to live in an assets/
subdirectory inside the source's entry folder. The build script
validates that referenced assets exist; missing files fail the build.

ARCHITECTURE
------------
  - URL pattern: /archive/sources/entries/[source_id]/
  - Partials auto-loaded by /partials/partials.js into:
      #bda-navbar, #bda-footer, #bda-credentialing-rail
  - CSS: /assets/css/styles.css
  - Canonical URL base: https://detroit.badmandigitalarchive.com
  - "On this page" TOC auto-built from <h2> in <main> by partials.js,
    so every major section uses <h2> and sub-sections use <h3>

BEHAVIOR (parallels build_figures.py)
-------------------------------------
  status == "stub"      -> skipped (left untouched if folder exists)
  status == "live"      -> full page generated (folder created if missing)
  status unset          -> full page generated (folder created if missing)
  _placeholder: true    -> skipped
  missing referenced
  asset file            -> BUILD FAILS (fatal)

USAGE
-----
From repo root:
    python3 tools/build_sources.py

With explicit paths:
    python3 tools/build_sources.py --data docs/data/detroit.json --out docs/archive/sources

Options:
    --dry-run       Show what would be written without modifying files
    --quiet         Suppress per-source output
    --skip-validate Skip asset-existence validation (useful when drafting)
"""

import argparse
import html
import json
import re
import sys
from datetime import datetime
from pathlib import Path

# =============================================================================
# CONFIG
# =============================================================================

# Type families drive viewer dispatch and citation rules. A source's `type`
# is looked up in this table; unknown types fall back to "text".
TYPE_FAMILIES = {
    # Book family — long-form published works
    "novel":                    "book",
    "book":                     "book",
    "biography":                "book",
    "memoir":                   "book",
    "comics":                   "book",
    "nonfiction":               "book",

    # Text family — articles, criticism, institutional docs
    "article":                  "text",
    "academic":                 "text",
    "criticism":                "text",
    "reference":                "text",
    "institutional":            "text",
    "digital_archive":          "text",
    "publisher":                "text",
    "document":                 "text",
    "letter":                   "text",
    "manuscript":               "text",
    "founding_document":        "text",
    "organizational_document":  "text",
    "organizational_statement": "text",
    "organizational":           "text",
    "newsletter":               "text",
    "obituary":                 "text",
    "website":                  "text",
    "personal":                 "text",

    # News family
    "news":                     "news",
    "newspaper":                "news",
    "magazine":                 "news",

    # Image family
    "photograph":               "image",
    "photo":                    "image",
    "image":                    "image",
    "artwork":                  "image",

    # Audio family
    "audio":                    "audio",
    "audio_recording":          "audio",
    "oral_history":             "audio",
    "podcast":                  "audio",

    # Video family
    "film":                     "video",
    "video":                    "video",
    "television":               "video",
    "tv":                       "video",
    "documentary":              "video",

    # Interview — treated specially for rendering
    "interview":                "interview",

    # Legal / government
    "legal":                    "legal",
    "government":               "legal",
}

# Active modalities — figures in dormant modalities still get cited-in
# mentions but as inactive spans, not live anchors.
ACTIVE_MODALITIES = {"detective", "revolutionary", "superhero_villain", "gangsta_pimp"}

# Modality display config (parallels build_figures.py MODALITY_CONFIG)
MODALITY_CONFIG = {
    "detective":         {"label": "Detective",               "slug": "detective"},
    "revolutionary":     {"label": "Political Revolutionary", "slug": "revolutionary"},
    "gangsta_pimp":      {"label": "Gangsta-Pimp",            "slug": "gangsta-pimp"},
    "superhero_villain": {"label": "Superhero-Villain",       "slug": "shv"},
    "folk_hero_outlaw":  {"label": "Folk Hero-Outlaw",        "slug": "folk-hero"},
}

# Language code → display name lookup
LANGUAGE_LABELS = {
    "en": "English",
    "fr": "French",
    "es": "Spanish",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "sw": "Swahili",
    "ar": "Arabic",
    "zh": "Chinese",
    "ja": "Japanese",
}

# Name suffixes for scholarly-name parsing
NAME_SUFFIXES = {"Jr.", "Sr.", "II", "III", "IV", "Jr", "Sr"}

# Access-level display config
ACCESS_BADGES = {
    "restricted": {
        "class":  "bda-access-badge-restricted",
        "label":  "Restricted — institutional access required",
        "notice": "This source requires institutional access",
    },
    "embargoed": {
        "class":  "bda-access-badge-embargoed",
        "label":  "Embargoed",
        "notice": "This source is under embargo",
    },
    "consent_required": {
        "class":  "bda-access-badge-consent",
        "label":  "Consent required",
        "notice": "This source requires consent to access",
    },
}

# Cap on related sources displayed per source page
RELATED_SOURCES_CAP = 12

# Subdirectory that holds per-source folders, relative to out_dir.
# /archive/sources/entries/[source_id]/index.html
ENTRIES_SUBDIR = "entries"

CANONICAL_BASE = "https://detroit.badmandigitalarchive.com"

SITE_PATHS = {
    "css":           "/assets/css/styles.css",
    "partials_js":   "/partials/partials.js",
    "source_page_js":"/assets/js/bda-source-page.js",
    "bootstrap_css": "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css",
    "bootstrap_js":  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js",
    "sources_landing": "/archive/sources/sources.html",
    "figures_route_prefix": "/archive/figures/entries/",
    "sources_route_prefix": "/archive/sources/entries/",
}


def source_url_path(source_id):
    """Canonical absolute path for a source page."""
    return f"{SITE_PATHS['sources_route_prefix']}{source_id}/"


def figure_url_path(figure_id):
    """Canonical absolute path for a figure page (consistent with build_figures.py)."""
    return f"{SITE_PATHS['figures_route_prefix']}{figure_id}/"


# =============================================================================
# HELPERS
# =============================================================================

def esc(value):
    """HTML-escape for attribute and text contexts."""
    if value is None:
        return ""
    return html.escape(str(value), quote=True)


def format_type_label(type_str):
    """novel -> 'Novel', audio_recording -> 'Audio Recording'."""
    if not type_str:
        return ""
    return " ".join(
        part.capitalize() if part else ""
        for part in str(type_str).split("_")
    )


def capitalize_first(s):
    if not s:
        return ""
    return s[0].upper() + s[1:]


def modality_slug(mod):
    """Lookup CSS slug for a modality (detective, revolutionary, shv, etc.)."""
    cfg = MODALITY_CONFIG.get(mod)
    return cfg["slug"] if cfg else str(mod).replace("_", "-")


def modality_label(mod):
    """Lookup display label for a modality."""
    cfg = MODALITY_CONFIG.get(mod)
    return cfg["label"] if cfg else mod


def get_type_family(type_str):
    """Return the type family for a given type string, defaulting to 'text'."""
    return TYPE_FAMILIES.get(type_str, "text")


def scholarly_name(full_name):
    """
    Format a name as 'Last, First Middle' for scholarly citation.

    Single-name figures returned as-is. Paired entries ('Gaidi & Imari Obadele')
    returned as-is. Suffixes (Jr., Sr., III) preserved after the first name.
    """
    if not full_name:
        return ""
    parts = str(full_name).strip().split()
    if len(parts) == 1:
        return parts[0]
    if "&" in parts:
        return full_name

    suffix = ""
    # Strip trailing suffix
    if len(parts) > 1:
        tail = parts[-1].rstrip(",")
        if tail in NAME_SUFFIXES:
            suffix = " " + parts.pop()

    if len(parts) == 1:
        return parts[0] + suffix

    last = parts.pop()
    return f"{last}, {' '.join(parts)}{suffix}"


def last_name(full_name):
    """Extract a sortable last-name token."""
    if not full_name:
        return ""
    parts = str(full_name).strip().split()
    if len(parts) > 1:
        tail = parts[-1].rstrip(",")
        if tail in NAME_SUFFIXES:
            parts.pop()
    if "&" in parts:
        return parts[-1]
    if len(parts) == 1:
        return parts[0]
    return parts[-1]


def resolve_language(code):
    """'en' -> 'English'; unknown codes returned as-is."""
    if not code:
        return ""
    return LANGUAGE_LABELS.get(code, code)


def italic_markers_to_html(text):
    """
    Convert *italic* markers to <em> tags. Input must already be HTML-escaped.
    Used in citation rendering (titles wrapped in *...*).
    """
    return re.sub(r"\*([^*]+)\*", r"<em>\1</em>", text)


def strip_italic_markers(text):
    """Remove *italic* markers for plain-text clipboard copy."""
    return re.sub(r"\*([^*]+)\*", r"\1", str(text))


def primary_creator(source):
    """
    Return (name, role) for the primary creator. Prefers creators[0]
    if present, falls back to `author` string, else (None, None).
    """
    creators = source.get("creators")
    if creators and isinstance(creators, list) and len(creators) > 0:
        first = creators[0]
        if isinstance(first, dict):
            return (first.get("name"), first.get("role"))
    author = source.get("author")
    if author:
        return (author, None)
    return (None, None)


def get_creators_for_role(source, role):
    """Return list of creator names matching a role (e.g., 'interviewer')."""
    creators = source.get("creators") or []
    return [
        c.get("name", "") for c in creators
        if isinstance(c, dict) and c.get("role") == role
    ]


# =============================================================================
# CITATION GENERATION
# =============================================================================
#
# Three formats: Chicago (notes-bibliography), MLA (9th ed.), APA (7th ed.).
# Title is wrapped in *asterisks* as italic-marker. The build script calls
# italic_markers_to_html() when embedding in HTML and strip_italic_markers()
# when building the copy-to-clipboard payload.
# =============================================================================

def missing(label):
    """Bracketed placeholder for missing citation fields."""
    return f"[{label}]"


def _author_for_citation(source, style):
    """Format author by citation style."""
    name, _role = primary_creator(source)
    if not name:
        return missing("Author unknown")

    # Preserve parenthetical pseudonyms: "Donald Goines (as Al C. Clark)"
    m = re.match(r"^(.*?)\s*(\(.+\))\s*$", name)
    base = m.group(1).strip() if m else name
    paren = " " + m.group(2) if m else ""

    if style in ("chicago", "mla"):
        return scholarly_name(base) + paren

    if style == "apa":
        parts = base.split()
        if len(parts) == 1:
            return base + paren
        last = parts.pop()
        # Strip suffix if present
        if last.rstrip(",") in NAME_SUFFIXES and parts:
            last = parts.pop()
        initials = " ".join(
            p[0].upper() + "."
            for p in parts if p
        )
        return f"{last}, {initials}{paren}"

    return name


def generate_chicago(source):
    """Chicago-style citation. Returns string with *italic* markers for titles."""
    author = _author_for_citation(source, "chicago")
    title = f"*{source['title']}*" if source.get("title") else missing("Title unknown")
    year = source.get("year") if source.get("year") is not None else missing("Year unknown")
    type_str = source.get("type", "")
    family = get_type_family(type_str)

    if family == "book":
        publisher = source.get("publisher") or missing("Publisher unknown")
        return f"{author}. {title}. {publisher}, {year}."

    if family == "video":
        distributor = source.get("publisher") or source.get("repository") or missing("Distributor unknown")
        return f"{title}. {distributor}, {year}."

    if family == "audio" or family == "interview":
        repo = source.get("repository") or source.get("publisher") or missing("Repository unknown")
        return f"{author}. {title}. {repo}, {year}."

    if family == "image":
        repo = source.get("repository") or source.get("publisher") or missing("Repository unknown")
        return f"{author}. {title}. {repo}, {year}."

    if family == "legal":
        repo = source.get("repository") or source.get("publisher") or missing("Repository unknown")
        year_clause = f", {year}" if year and not str(year).startswith("[") else ""
        return f"{title}. {repo}{year_clause}."

    if source.get("url") and not source.get("publisher"):
        accessed = f"Accessed {source['date_accessed']}. " if source.get("date_accessed") else ""
        return f"{author}. {title}. {accessed}{source['url']}."

    publisher = source.get("publisher") or source.get("repository") or missing("Publisher unknown")
    return f"{author}. {title}. {publisher}, {year}."


def generate_mla(source):
    """MLA-style citation (9th ed.). Returns string with *italic* markers."""
    author = _author_for_citation(source, "mla")
    title = f"*{source['title']}*" if source.get("title") else missing("Title unknown")
    year = source.get("year") if source.get("year") is not None else missing("Year unknown")
    type_str = source.get("type", "")
    family = get_type_family(type_str)

    if family == "video":
        studio = source.get("publisher") or source.get("repository") or missing("Studio unknown")
        return f"{title}. {studio}, {year}."

    if family == "legal":
        repo = source.get("repository") or source.get("publisher") or missing("Repository unknown")
        accessed = f", {source['date_accessed']}" if source.get("date_accessed") else ""
        return f"{title}. {repo}{accessed}."

    if source.get("url") and not source.get("publisher"):
        return f"{author}. {title}, {year}, {source['url']}."

    publisher = source.get("publisher") or source.get("repository") or missing("Publisher unknown")
    return f"{author}. {title}. {publisher}, {year}."


def generate_apa(source):
    """APA-style citation (7th ed.). Returns string with *italic* markers."""
    author = _author_for_citation(source, "apa")
    title = f"*{source['title']}*" if source.get("title") else missing("Title unknown")
    year = source.get("year") if source.get("year") is not None else "n.d."
    type_str = source.get("type", "")
    family = get_type_family(type_str)

    if family == "video":
        studio = source.get("publisher") or source.get("repository") or missing("Studio unknown")
        return f"{author} (Director). ({year}). {title} [Film]. {studio}."

    if source.get("url") and not source.get("publisher"):
        plain_title = strip_italic_markers(title)
        return f"{author} ({year}). {plain_title}. {source['url']}"

    publisher = source.get("publisher") or source.get("repository") or missing("Publisher unknown")
    return f"{author} ({year}). {title}. {publisher}."


# =============================================================================
# TRANSCRIPT RENDERING
# =============================================================================
#
# Transcripts are Markdown files. The build script reads the Markdown at
# build time, does a minimal parse (no external deps needed for the simple
# conventions the schema defines), and embeds the resulting HTML.
#
# Supported Markdown subset:
#   - ## heading
#   - **bold** and *italic* inline
#   - Paragraphs separated by blank lines
#   - Speaker turns: line starts with **XX:** (bolded speaker label)
#
# No link parsing for now — transcripts can include raw HTML anchors if
# cross-references are needed.
# =============================================================================

def render_transcript_markdown(md_text):
    """
    Minimal Markdown-to-HTML for transcript conventions.
    Returns HTML string ready for embedding.
    """
    if not md_text:
        return ""

    lines = md_text.split("\n")
    out = []
    paragraph_buffer = []

    def flush_paragraph():
        if not paragraph_buffer:
            return
        joined = " ".join(paragraph_buffer).strip()
        if joined:
            # Check if it's a speaker turn (starts with **Label:**)
            m = re.match(r"^\*\*([^*]+):\*\*\s*(.*)$", joined)
            if m:
                speaker = m.group(1)
                rest = m.group(2)
                rest_html = _inline_markdown_to_html(esc(rest))
                out.append(
                    f'<p class="bda-transcript-turn">'
                    f'<span class="bda-transcript-speaker">{esc(speaker)}:</span> '
                    f'{rest_html}</p>'
                )
            else:
                out.append(f'<p>{_inline_markdown_to_html(esc(joined))}</p>')
        paragraph_buffer.clear()

    for raw_line in lines:
        line = raw_line.rstrip()
        if not line.strip():
            flush_paragraph()
            continue

        # Heading
        if line.startswith("## "):
            flush_paragraph()
            heading_text = line[3:].strip()
            out.append(
                f'<h3 class="bda-transcript-heading">'
                f'{_inline_markdown_to_html(esc(heading_text))}</h3>'
            )
            continue

        paragraph_buffer.append(line.strip())

    flush_paragraph()
    return "\n".join(out)


def _inline_markdown_to_html(text):
    """Apply **bold** and *italic* to already-escaped text."""
    # Bold first (greedy-safe pattern), then italic
    text = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"\*([^*]+)\*", r"<em>\1</em>", text)
    return text


# =============================================================================
# SECTION RENDERERS
# =============================================================================

def render_header(source):
    """
    Source page header: title + category badge + type + year + permalink button.
    """
    category = source.get("category") or "primary"
    category_label = capitalize_first(category)
    type_label = format_type_label(source.get("type"))
    year = source.get("year")
    year_str = esc(year) if year is not None else ""

    type_span = (
        f'<span class="bda-source-type">{esc(type_label)}</span>'
        if type_label else ""
    )
    year_span = (
        f'<span class="bda-source-year">{year_str}</span>'
        if year_str else ""
    )

    return f'''      <header class="bda-source-header">
        <h1 class="bda-source-title">{esc(source.get("title", "Untitled source"))}</h1>
        <div class="bda-source-header-meta">
          <span class="bda-source-card-category bda-cat-{esc(category)}">{esc(category_label)}</span>
          {type_span}
          {year_span}
          <button type="button" class="bda-source-permalink-btn"
                  aria-label="Copy permalink to clipboard"
                  aria-describedby="bda-source-permalink-status">Copy permalink</button>
          <span id="bda-source-permalink-status" class="sr-only" role="status" aria-live="polite"></span>
        </div>
      </header>'''


def render_descriptor(source):
    """One-sentence scholarly summary under the header, if present."""
    desc = source.get("descriptor")
    if not desc:
        return ""
    return f'      <p class="bda-source-descriptor lead">{esc(desc)}</p>'


def render_viewer(source, entry_dir):
    """
    Viewer dispatch — access-gated first, then type-based.

    entry_dir is the path to the source's entry folder (needed for reading
    transcript assets at build time).
    """
    # Access-level gates take precedence
    access = source.get("access_level")
    if access == "embargoed":
        return _render_access_notice(source, "embargoed")
    if access == "consent_required":
        return _render_access_notice(source, "consent_required")
    if access == "restricted":
        return _render_access_notice(source, "restricted")

    # Multi-asset viewer if assets array is present and non-empty
    assets = source.get("assets") or []
    if assets:
        return _render_asset_viewer(source, assets, entry_dir)

    # Type-based dispatch for no-asset sources (external pointers)
    family = get_type_family(source.get("type", ""))
    if family == "image" and source.get("url"):
        return _render_image_viewer(source)
    # Everything else: external link (or archival notice if no URL)
    return _render_text_viewer(source)


def _render_access_notice(source, access_type):
    """Render an access-gated notice panel instead of a viewer."""
    badge = ACCESS_BADGES.get(access_type, {})
    notice = badge.get("notice", "This source has restricted access")

    if access_type == "restricted":
        repo = source.get("repository")
        body = (
            f"This source is held at {esc(repo)} and requires an institutional "
            f"affiliation or an on-site visit to access."
            if repo else
            "This source requires an institutional affiliation or an on-site visit to access."
        )
    elif access_type == "embargoed":
        body = (
            "This source is temporarily restricted and will be available once the "
            "embargo lifts. See the Notes field in the metadata rail for the "
            "expiration date if documented."
        )
    elif access_type == "consent_required":
        body = (
            "This source was produced under participant consent terms that restrict "
            "open display. See the metadata rail for the consent scope and contact "
            "information."
        )
    else:
        body = "Access to this source is restricted."

    return f'''      <section class="bda-source-viewer" id="bda-source-viewer">
        <h2 id="bda-source-viewer-heading" class="sr-only">Source</h2>
        <div class="bda-source-access-notice" role="note">
          <h3>{esc(notice)}</h3>
          <p>{body}</p>
        </div>
      </section>'''


def _render_asset_viewer(source, assets, entry_dir):
    """
    Render the viewer for a source with original assets. Handles the common
    case (one audio + one transcript) with a dedicated layout, and falls
    back to a tabbed multi-asset viewer for anything else.
    """
    # Filter out assets with asset-level access_level='private' for public rendering
    visible = [
        a for a in assets
        if isinstance(a, dict) and a.get("access_level") != "private"
    ]

    if not visible:
        # All assets private — show an access notice
        return _render_access_notice(source, "restricted")

    # Classify visible assets by type
    audio_assets = [a for a in visible if a.get("type") == "audio"]
    transcript_assets = [a for a in visible if a.get("type") == "transcript"]
    image_assets = [a for a in visible if a.get("type") == "image"]
    video_assets = [a for a in visible if a.get("type") == "video"]
    document_assets = [a for a in visible if a.get("type") == "document"]

    # Common interview case: one audio + one transcript
    if len(audio_assets) == 1 and len(transcript_assets) == 1 and len(visible) <= 3:
        return _render_audio_transcript_viewer(
            source, audio_assets[0], transcript_assets[0], entry_dir
        )

    # Single image asset
    if len(image_assets) == 1 and len(visible) == 1:
        return _render_image_asset_viewer(image_assets[0])

    # Single video asset
    if len(video_assets) == 1 and len(visible) == 1:
        return _render_video_asset_viewer(video_assets[0])

    # Single document asset (PDF, etc.)
    if len(document_assets) == 1 and len(visible) == 1:
        return _render_document_asset_viewer(document_assets[0])

    # Fallback: multi-asset tabbed viewer
    return _render_multi_asset_tabs(visible, entry_dir)


def _resolve_asset_url(asset, source_id):
    """Convert a relative asset path to an absolute site URL."""
    file_path = asset.get("file", "")
    if not file_path:
        return ""
    # If the path is already absolute (starts with /), leave it alone
    if file_path.startswith("/"):
        return file_path
    return f"{SITE_PATHS['sources_route_prefix']}{source_id}/{file_path}"


def _render_audio_transcript_viewer(source, audio_asset, transcript_asset, entry_dir):
    """
    The signature oral-history layout: audio player on top, transcript below.
    """
    source_id = source.get("id", "")
    audio_url = _resolve_asset_url(audio_asset, source_id)
    audio_mime = esc(audio_asset.get("mime_type") or "audio/mpeg")
    audio_label = esc(audio_asset.get("label") or "Interview audio")

    # Read and parse transcript markdown at build time
    transcript_rel = transcript_asset.get("file", "")
    transcript_html = ""
    transcript_path = entry_dir / transcript_rel if transcript_rel else None
    if transcript_path and transcript_path.exists():
        try:
            md_text = transcript_path.read_text(encoding="utf-8")
            transcript_html = render_transcript_markdown(md_text)
        except Exception as e:
            transcript_html = (
                f'<p class="bda-transcript-error">'
                f'Transcript could not be rendered: {esc(str(e))}</p>'
            )
    else:
        transcript_html = (
            '<p class="bda-transcript-error">Transcript file not found.</p>'
        )

    duration = audio_asset.get("duration")
    duration_str = ""
    if duration:
        mins = duration // 60
        secs = duration % 60
        duration_str = (
            f'<span class="bda-audio-duration">'
            f'{mins}:{secs:02d}</span>'
        )

    word_count = transcript_asset.get("word_count")
    word_count_str = (
        f' <span class="bda-transcript-wordcount">'
        f'({word_count:,} words)</span>'
        if word_count else ""
    )

    return f'''      <section class="bda-source-viewer bda-source-viewer-interview" id="bda-source-viewer">
        <h2 id="bda-source-viewer-heading" class="sr-only">Interview</h2>

        <div class="bda-source-audio-block">
          <div class="bda-source-audio-header">
            <h3 class="bda-source-audio-title">{audio_label}</h3>
            {duration_str}
          </div>
          <audio controls preload="metadata" class="bda-source-audio-player">
            <source src="{esc(audio_url)}" type="{audio_mime}">
            Your browser does not support the audio element.
            <a href="{esc(audio_url)}">Download the audio file.</a>
          </audio>
        </div>

        <div class="bda-source-transcript-block">
          <div class="bda-source-transcript-header">
            <h3 class="bda-source-transcript-title">Transcript{word_count_str}</h3>
          </div>
          <div class="bda-source-transcript-body">
{transcript_html}
          </div>
        </div>
      </section>'''


def _render_image_asset_viewer(asset):
    """Render a single inline image asset with caption."""
    source_url = asset.get("file", "")
    # If file is relative, it needs resolution — but we don't have source_id
    # in this path. Image assets should be passed through the source_id-aware
    # resolver at the call site. For now, assume the caller resolved already.
    # (This is fine because _render_asset_viewer resolves via source.id.)
    alt = esc(asset.get("alt") or asset.get("label") or "Source image")
    caption = asset.get("caption") or asset.get("label") or ""

    caption_html = (
        f'<figcaption>{esc(caption)}</figcaption>' if caption else ''
    )

    return f'''      <section class="bda-source-viewer bda-source-viewer-image" id="bda-source-viewer">
        <h2 id="bda-source-viewer-heading" class="sr-only">Image</h2>
        <figure class="bda-source-image-figure">
          <img src="{esc(source_url)}" alt="{alt}">
          {caption_html}
        </figure>
      </section>'''


def _render_video_asset_viewer(asset):
    """Render a single inline video asset."""
    video_url = asset.get("file", "")
    mime = esc(asset.get("mime_type") or "video/mp4")
    label = esc(asset.get("label") or "Video")
    return f'''      <section class="bda-source-viewer bda-source-viewer-video" id="bda-source-viewer">
        <h2 id="bda-source-viewer-heading" class="sr-only">Video</h2>
        <div class="bda-source-video-block">
          <h3 class="bda-source-video-title">{label}</h3>
          <video controls preload="metadata" class="bda-source-video-player">
            <source src="{esc(video_url)}" type="{mime}">
            Your browser does not support the video element.
            <a href="{esc(video_url)}">Download the video file.</a>
          </video>
        </div>
      </section>'''


def _render_document_asset_viewer(asset):
    """Render a link to a document asset (PDF, etc.) with download affordance."""
    url = asset.get("file", "")
    label = esc(asset.get("label") or "Document")
    pages = asset.get("page_count")
    pages_str = (
        f' <span class="bda-source-doc-pages">({pages} pages)</span>'
        if pages else ""
    )
    return f'''      <section class="bda-source-viewer bda-source-viewer-document" id="bda-source-viewer">
        <h2 id="bda-source-viewer-heading" class="sr-only">Document</h2>
        <div class="bda-source-document-block">
          <h3 class="bda-source-document-title">{label}{pages_str}</h3>
          <a class="btn btn-primary bda-source-document-link" href="{esc(url)}"
             target="_blank" rel="noopener noreferrer">
            Open document <span class="sr-only">(opens in new tab)</span>
          </a>
        </div>
      </section>'''


def _render_multi_asset_tabs(assets, entry_dir):
    """
    Fallback for source pages with 2+ heterogeneous assets. Renders a tabbed
    widget; the tab switching is activated by bda-source-page.js at runtime.

    The `dir` parameter is passed through because transcript assets need
    build-time Markdown resolution.
    """
    tabs = []
    panels = []

    for i, asset in enumerate(assets):
        if not isinstance(asset, dict):
            continue
        tab_id = f"bda-asset-tab-{i}"
        panel_id = f"bda-asset-panel-{i}"
        selected = "true" if i == 0 else "false"
        hidden_attr = "" if i == 0 else " hidden"
        tabindex = "0" if i == 0 else "-1"
        label = esc(asset.get("label") or asset.get("type") or f"Asset {i+1}")

        tabs.append(
            f'<button role="tab" id="{tab_id}" '
            f'aria-selected="{selected}" aria-controls="{panel_id}" '
            f'tabindex="{tabindex}" class="bda-source-asset-tab">{label}</button>'
        )

        # Render the panel body based on asset type
        atype = asset.get("type")
        url = asset.get("file", "")
        if atype == "audio" and url:
            mime = esc(asset.get("mime_type") or "audio/mpeg")
            body = (
                f'<audio controls preload="metadata" class="bda-source-audio-player">'
                f'<source src="{esc(url)}" type="{mime}">'
                f'</audio>'
            )
        elif atype == "transcript" and url:
            tpath = entry_dir / url
            if tpath.exists():
                try:
                    body = (
                        '<div class="bda-source-transcript-body">'
                        + render_transcript_markdown(tpath.read_text(encoding="utf-8"))
                        + '</div>'
                    )
                except Exception:
                    body = '<p class="bda-transcript-error">Transcript could not be rendered.</p>'
            else:
                body = '<p class="bda-transcript-error">Transcript file not found.</p>'
        elif atype == "image" and url:
            alt = esc(asset.get("alt") or asset.get("label") or "Asset image")
            body = f'<img src="{esc(url)}" alt="{alt}">'
        elif url:
            body = (
                f'<a class="btn btn-primary" href="{esc(url)}" '
                f'target="_blank" rel="noopener noreferrer">'
                f'Open {label} <span class="sr-only">(opens in new tab)</span>'
                f'</a>'
            )
        else:
            body = '<p class="bda-source-asset-empty">No URL or file available for this asset.</p>'

        panels.append(
            f'<div role="tabpanel" id="{panel_id}" aria-labelledby="{tab_id}"'
            f'{hidden_attr} class="bda-source-asset-panel">{body}</div>'
        )

    tabs_html = "\n".join(tabs)
    panels_html = "\n".join(panels)

    return f'''      <section class="bda-source-viewer bda-source-viewer-multi" id="bda-source-viewer">
        <h2 id="bda-source-viewer-heading" class="sr-only">Source assets</h2>
        <div class="bda-source-asset-tabs" role="region" aria-label="Source assets">
          <div role="tablist" aria-label="Available formats" class="bda-source-asset-tablist">
{tabs_html}
          </div>
{panels_html}
        </div>
      </section>'''


def _render_text_viewer(source):
    """
    Fallback viewer for external / text sources. Shows external link if URL
    present, otherwise an archival-access notice.
    """
    if source.get("url"):
        return f'''      <section class="bda-source-viewer bda-source-viewer-text" id="bda-source-viewer">
        <h2 id="bda-source-viewer-heading" class="sr-only">Source</h2>
        <div class="bda-source-external-link-block">
          <a class="btn btn-primary bda-source-view-external"
             href="{esc(source["url"])}"
             target="_blank" rel="noopener noreferrer">
            View source <span class="sr-only">(opens in new tab)</span>
          </a>
        </div>
      </section>'''

    repo = source.get("repository")
    repo_line = (
        f"See the metadata rail for {esc(repo)} and visit in person or request a reproduction."
        if repo else
        "See the metadata rail for repository information if available."
    )
    return f'''      <section class="bda-source-viewer bda-source-viewer-text" id="bda-source-viewer">
        <h2 id="bda-source-viewer-heading" class="sr-only">Source</h2>
        <div class="bda-source-access-notice" role="note">
          <h3>Archival access only</h3>
          <p>This source is not available online. {repo_line}</p>
        </div>
      </section>'''


def _render_image_viewer(source):
    """External image viewer — URL points to a hosted image."""
    alt = esc(source.get("title") or "Source image")
    return f'''      <section class="bda-source-viewer bda-source-viewer-image" id="bda-source-viewer">
        <h2 id="bda-source-viewer-heading" class="sr-only">Image</h2>
        <figure class="bda-source-image-figure">
          <img src="{esc(source["url"])}" alt="{alt}">
          <figcaption>{esc(source.get("title", ""))}</figcaption>
        </figure>
      </section>'''


def render_metadata_rail(source):
    """
    Metadata rail as a <dl>. Fields omitted cleanly when absent.
    The "Notes" block renders separately below the dl.
    """
    rows = []

    def add_row(term, body_html):
        rows.append(f'        <dt>{esc(term)}</dt>\n        <dd>{body_html}</dd>')

    # Type
    type_label = format_type_label(source.get("type"))
    add_row("Type", esc(type_label) if type_label else "—")

    # Category
    category = source.get("category") or "primary"
    add_row(
        "Category",
        f'<span class="bda-source-card-category bda-cat-{esc(category)}">'
        f'{esc(capitalize_first(category))}</span>'
    )

    # Year
    year = source.get("year")
    add_row("Year", esc(year) if year is not None else "—")

    # Primary creator / author
    primary_name, primary_role = primary_creator(source)
    if primary_name:
        role_str = f" ({esc(primary_role)})" if primary_role else ""
        add_row("Author", esc(primary_name) + role_str)

    # Additional creators (multi-creator sources)
    creators = source.get("creators") or []
    if len(creators) > 1:
        other_creators = []
        for c in creators[1:]:
            if not isinstance(c, dict):
                continue
            name = c.get("name", "")
            role = c.get("role", "")
            role_str = f" ({esc(role)})" if role else ""
            other_creators.append(esc(name) + role_str)
        if other_creators:
            add_row("Additional creators", "; ".join(other_creators))

    # Publisher
    if source.get("publisher"):
        add_row("Publisher", esc(source["publisher"]))

    # Repository
    if source.get("repository"):
        add_row("Repository", esc(source["repository"]))

    # Extent
    if source.get("extent"):
        add_row("Extent", esc(source["extent"]))

    # Language
    if source.get("language"):
        add_row("Language", esc(resolve_language(source["language"])))

    # Rights
    if source.get("rights"):
        add_row("Rights", esc(source["rights"]))

    # Access level (non-public only)
    access = source.get("access_level")
    if access and access != "public":
        badge = ACCESS_BADGES.get(access)
        if badge:
            add_row(
                "Access",
                f'<span class="{badge["class"]}">{esc(badge["label"])}</span>'
            )
        else:
            add_row("Access", esc(access))

    # Date accessed
    if source.get("date_accessed"):
        add_row("Date accessed", f"Accessed {esc(source['date_accessed'])}")

    # Interview-specific metadata (if present)
    im = source.get("interview_metadata")
    if im and isinstance(im, dict):
        if im.get("date"):
            add_row("Interview date", esc(im["date"]))
        if im.get("location"):
            add_row("Location", esc(im["location"]))
        if im.get("duration_minutes"):
            add_row("Duration", f'{im["duration_minutes"]} minutes')
        if im.get("consent_scope"):
            add_row("Consent", esc(im["consent_scope"]))

    # Permalink (always)
    permalink = f"{CANONICAL_BASE}{source_url_path(source.get('id', ''))}"
    add_row(
        "Permalink",
        f'<code class="bda-source-permalink-text">{esc(permalink)}</code> '
        f'<button type="button" class="bda-source-permalink-copy" '
        f'data-permalink="{esc(permalink)}" '
        f'aria-label="Copy permalink to clipboard" '
        f'aria-describedby="bda-source-permalink-rail-status">Copy</button> '
        f'<span id="bda-source-permalink-rail-status" class="sr-only" role="status" aria-live="polite"></span>'
    )

    rows_html = "\n".join(rows)

    # Notes block (after the dl)
    notes_block = ""
    if source.get("notes"):
        notes_block = f'''
      <div class="bda-source-notes">
        <h3>Notes</h3>
        <p>{esc(source["notes"])}</p>
      </div>'''

    return f'''      <aside class="bda-source-metadata-rail">
        <h2 class="bda-source-metadata-heading">About this source</h2>
        <dl id="bda-source-metadata-list" class="bda-source-metadata-list">
{rows_html}
        </dl>{notes_block}
      </aside>'''


def render_justification(source):
    """Justification paragraph — why this source is in the archive."""
    j = source.get("justification")
    if not j:
        return ""
    return f'''      <section class="bda-source-section bda-source-justification-section">
        <h2>Archival Justification</h2>
        <div class="bda-source-justification">
          <p>{esc(j)}</p>
        </div>
      </section>'''


def render_cited_in(source, figures_by_id):
    """
    Cited-in block — which figures reference this source. Grouped by
    modality with shape markers; dormant-modality figures rendered as
    inactive spans.
    """
    fig_ids = source.get("figure_ids") or []
    cited_figures = []
    for fid in fig_ids:
        fig = figures_by_id.get(fid)
        if fig and not fig.get("_placeholder"):
            cited_figures.append(fig)

    if not cited_figures:
        return '''      <section class="bda-source-section bda-source-cited-in-section">
        <h2>Cited In</h2>
        <p class="bda-cited-in-empty">No figures in this archive currently reference this source.</p>
      </section>'''

    # Group by modality, sort within group by last name
    groups = {}
    order = []
    for f in sorted(cited_figures, key=lambda x: (x.get("modality", ""), last_name(x.get("name", "")))):
        mod = f.get("modality") or "unknown"
        if mod not in groups:
            groups[mod] = []
            order.append(mod)
        groups[mod].append(f)

    group_blocks = []
    for mod in order:
        label = modality_label(mod)
        slug = modality_slug(mod)
        items = []
        for f in groups[mod]:
            display_name = scholarly_name(f.get("name") or f.get("id", ""))
            fid = f.get("id", "")
            if mod in ACTIVE_MODALITIES:
                items.append(
                    f'          <li><a href="{figure_url_path(fid)}">{esc(display_name)}</a></li>'
                )
            else:
                items.append(
                    f'          <li><span class="inactive-link">{esc(display_name)}</span></li>'
                )
        items_html = "\n".join(items)
        group_blocks.append(
            f'''        <div class="bda-cited-in-modality-group">
          <h3 class="bda-cited-in-modality-heading">
            <span class="bda-filter-modality-marker bda-mm-{esc(slug)}" aria-hidden="true"></span>
            {esc(label)}
          </h3>
          <ul class="bda-cited-in-list">
{items_html}
          </ul>
        </div>'''
        )
    groups_html = "\n".join(group_blocks)

    return f'''      <section class="bda-source-section bda-source-cited-in-section">
        <h2>Cited In</h2>
{groups_html}
      </section>'''


def render_related_sources(source, all_sources, figures_by_id):
    """
    Related sources — other sources sharing at least one figure_id, sorted
    by overlap count. Capped at RELATED_SOURCES_CAP.
    """
    current_fig_ids = set(source.get("figure_ids") or [])
    current_id = source.get("id")

    if not current_fig_ids:
        return '''      <section class="bda-source-section bda-source-related-section">
        <h2>Related Sources</h2>
        <p class="bda-source-related-empty">No related sources in this archive.</p>
      </section>'''

    scored = []
    for other in all_sources:
        if not isinstance(other, dict):
            continue
        if other.get("id") == current_id:
            continue
        if other.get("_placeholder"):
            continue
        if other.get("status") == "stub":
            continue
        other_fids = set(other.get("figure_ids") or [])
        overlap = len(current_fig_ids & other_fids)
        if overlap > 0:
            scored.append((overlap, other))

    # Sort by overlap desc, then title asc
    scored.sort(key=lambda t: (-t[0], str(t[1].get("title", "")).lower()))
    related = [t[1] for t in scored[:RELATED_SOURCES_CAP]]

    if not related:
        return '''      <section class="bda-source-section bda-source-related-section">
        <h2>Related Sources</h2>
        <p class="bda-source-related-empty">No related sources in this archive.</p>
      </section>'''

    cards = []
    for r in related:
        cards.append(_render_related_card(r, figures_by_id))
    cards_html = "\n".join(cards)

    return f'''      <section class="bda-source-section bda-source-related-section">
        <h2>Related Sources</h2>
        <ul class="bda-source-related-grid">
{cards_html}
        </ul>
      </section>'''


def _render_related_card(src, figures_by_id):
    """Single card in the related-sources grid."""
    category = src.get("category") or "primary"
    cat_label = capitalize_first(category)
    type_label = format_type_label(src.get("type"))
    year = src.get("year")
    year_str = str(year) if year is not None else ""

    # Figure label
    fig_ids = src.get("figure_ids") or []
    fig_names = [
        figures_by_id[fid].get("name", "")
        for fid in fig_ids
        if fid in figures_by_id and not figures_by_id[fid].get("_placeholder")
    ]
    if not fig_names:
        figure_label = ""
    elif len(fig_names) == 1:
        figure_label = fig_names[0]
    elif len(fig_names) == 2:
        figure_label = f"{fig_names[0]} & {fig_names[1]}"
    else:
        figure_label = f"{fig_names[0]} +{len(fig_names)-1}"

    # Meta line
    meta_parts = []
    if type_label:
        meta_parts.append(type_label)
    if year_str:
        meta_parts.append(year_str)
    meta_line = " · ".join(meta_parts)

    # aria-label
    aria = [src.get("title") or "Untitled source"]
    if figure_label:
        aria.append(f"— {figure_label}")
    if year_str:
        aria.append(f"({year_str})")
    aria_label = " ".join(aria)

    href = source_url_path(src.get("id", ""))
    figure_line = (
        f'<p class="bda-source-card-figure">{esc(figure_label)}</p>'
        if figure_label else ""
    )
    meta_html = (
        f'<p class="bda-source-card-meta">{esc(meta_line)}</p>'
        if meta_line else ""
    )

    return f'''          <li>
            <a class="bda-source-card" href="{esc(href)}" aria-label="{esc(aria_label)}">
              <div class="bda-source-card-thumb">
                <span class="bda-source-card-category bda-cat-{esc(category)}">{esc(cat_label)}</span>
              </div>
              <div class="bda-source-card-info">
                <h3 class="bda-source-card-title">{esc(src.get("title", "Untitled source"))}</h3>
                {figure_line}
                {meta_html}
              </div>
            </a>
          </li>'''


def render_citation_block(source):
    """
    Citation block — all three formats pre-rendered. JS toggles visibility.
    Chicago is visible by default (first radio checked).
    """
    chicago = generate_chicago(source)
    mla = generate_mla(source)
    apa = generate_apa(source)

    # HTML-escape, then convert italic markers to <em>
    def fmt(raw):
        return italic_markers_to_html(esc(raw))

    # Plain text for copy-to-clipboard
    def plain(raw):
        return esc(strip_italic_markers(raw))

    return f'''      <section class="bda-source-section bda-source-citation" id="bda-source-citation" aria-labelledby="bda-source-citation-heading">
        <h2 id="bda-source-citation-heading">Citation</h2>
        <div class="bda-citation-block">
          <fieldset class="bda-citation-format-group">
            <legend>Citation format</legend>
            <label>
              <input type="radio" name="citation-format" value="chicago" checked>
              Chicago
            </label>
            <label>
              <input type="radio" name="citation-format" value="mla">
              MLA
            </label>
            <label>
              <input type="radio" name="citation-format" value="apa">
              APA
            </label>
          </fieldset>

          <div class="bda-citation-text" id="bda-citation-text-chicago"
               data-citation-format="chicago"
               data-citation-plain="{plain(chicago)}">{fmt(chicago)}</div>
          <div class="bda-citation-text" id="bda-citation-text-mla"
               data-citation-format="mla"
               data-citation-plain="{plain(mla)}"
               hidden>{fmt(mla)}</div>
          <div class="bda-citation-text" id="bda-citation-text-apa"
               data-citation-format="apa"
               data-citation-plain="{plain(apa)}"
               hidden>{fmt(apa)}</div>

          <button type="button" class="bda-citation-copy-btn"
                  aria-describedby="bda-citation-copy-status">Copy citation</button>
          <span id="bda-citation-copy-status" class="sr-only" role="status" aria-live="polite"></span>
        </div>
      </section>'''


def render_breadcrumb(source):
    """Home / Archive / Primary Sources / [Title]"""
    title = esc(source.get("title", "Source"))
    return f'''      <nav class="bda-source-breadcrumb" aria-label="Breadcrumb">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a href="/">Home</a></li>
          <li class="breadcrumb-item"><a href="/archive/figures/figures.html">Archive</a></li>
          <li class="breadcrumb-item"><a href="{esc(SITE_PATHS["sources_landing"])}">Primary Sources</a></li>
          <li class="breadcrumb-item active" aria-current="page">{title}</li>
        </ol>
      </nav>'''


# =============================================================================
# PAGE TEMPLATE
# =============================================================================

def render_source_page(source, figures_by_id, all_sources, entry_dir):
    """Render the complete HTML document for one source."""
    source_id = source.get("id", "")
    title = source.get("title", "Untitled source")
    descriptor = source.get("descriptor") or f"Source entry for {title} in the Detroit Badman Archive."
    canonical = f"{CANONICAL_BASE}{source_url_path(source_id)}"
    build_date = datetime.now().isoformat(timespec="seconds")

    # Body sections
    breadcrumb     = render_breadcrumb(source)
    header         = render_header(source)
    descriptor_p   = render_descriptor(source)
    viewer         = render_viewer(source, entry_dir)
    metadata_rail  = render_metadata_rail(source)
    justification  = render_justification(source)
    cited_in       = render_cited_in(source, figures_by_id)
    related        = render_related_sources(source, all_sources, figures_by_id)
    citation       = render_citation_block(source)

    return f'''<!DOCTYPE html>
<!--
  Detroit Badman Archive \u2014 source page
  Generated: {build_date}
  Source: /data/detroit.json (id: {esc(source_id)})
  DO NOT EDIT THIS FILE DIRECTLY. Regenerate via tools/build_sources.py.
-->
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(title)} &middot; Detroit Badman Digital Archive</title>
  <meta name="description" content="{esc(descriptor)}">
  <link rel="canonical" href="{canonical}">

  <!-- Bootstrap 5 CSS -->
  <link rel="stylesheet" href="{SITE_PATHS["bootstrap_css"]}">

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
{breadcrumb}

{header}
{descriptor_p}

{viewer}

{metadata_rail}

{justification}

{cited_in}

{related}

{citation}
    </main>
    <div id="bda-credentialing-rail"></div>
  </div>

  <!-- Footer (loaded by partials.js) -->
  <div id="bda-footer"></div>

  <!-- Bootstrap 5 JS (for dropdowns, collapse) -->
  <script src="{SITE_PATHS["bootstrap_js"]}"></script>

  <!-- BDA partial loader -->
  <script src="{SITE_PATHS["partials_js"]}"></script>

  <!-- Source page interactivity (citation toggle, copy buttons, multi-asset tabs) -->
  <script src="{SITE_PATHS["source_page_js"]}"></script>

</body>
</html>
'''


# =============================================================================
# ASSET VALIDATION
# =============================================================================

def validate_assets(source, entry_dir):
    """
    Check that every referenced asset file exists on disk. Returns a list
    of missing files; empty list means all assets are present.

    Asset paths are relative to the entry folder.
    """
    missing_files = []
    assets = source.get("assets") or []
    for asset in assets:
        if not isinstance(asset, dict):
            continue
        file_path = asset.get("file")
        if not file_path:
            continue
        # Absolute paths bypass validation (they're site-rooted, not repo-rooted)
        if file_path.startswith("/"):
            continue
        full_path = entry_dir / file_path
        if not full_path.exists():
            missing_files.append(str(full_path))
    return missing_files


# =============================================================================
# BUILD LOOP
# =============================================================================

def build(data_path, out_dir, dry_run=False, quiet=False, skip_validate=False):
    if not data_path.exists():
        print(f"ERROR: Data file not found: {data_path}", file=sys.stderr)
        return 1

    try:
        with data_path.open("r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"ERROR: Malformed JSON in {data_path}: {e}", file=sys.stderr)
        return 1

    all_sources = data.get("sources") or []
    sources_by_id = {s["id"]: s for s in all_sources if isinstance(s, dict) and s.get("id")}

    all_figures = data.get("figures") or []
    figures_by_id = {f["id"]: f for f in all_figures if isinstance(f, dict) and f.get("id")}

    entries_dir = out_dir / ENTRIES_SUBDIR

    if not quiet:
        print(f"Loaded {len(sources_by_id)} sources and {len(figures_by_id)} figures from {data_path.name}")
        print(f"Output directory: {entries_dir}")
        print()

    rendered = 0
    untouched_stubs = 0
    untouched_placeholders = 0
    folders_created = 0
    asset_errors = []

    for source in all_sources:
        if not isinstance(source, dict):
            continue
        sid = source.get("id")
        if not sid:
            continue

        if source.get("_placeholder"):
            untouched_placeholders += 1
            if not quiet:
                print(f"  SKIP (placeholder)  : {sid}")
            continue

        if source.get("status") == "stub":
            untouched_stubs += 1
            if not quiet:
                print(f"  SKIP (stub)         : {sid}")
            continue

        entry_dir = entries_dir / sid
        folder_was_new = not entry_dir.exists()

        if not dry_run:
            entry_dir.mkdir(parents=True, exist_ok=True)

        if folder_was_new:
            folders_created += 1

        # Validate assets before rendering (fail fast)
        if not skip_validate:
            missing = validate_assets(source, entry_dir)
            if missing:
                asset_errors.append((sid, missing))
                if not quiet:
                    print(f"  ASSET ERROR         : {sid}")
                    for m in missing:
                        print(f"    missing: {m}")
                continue

        out_path = entry_dir / "index.html"
        html_doc = render_source_page(source, figures_by_id, all_sources, entry_dir)

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
    print(f"  Source pages generated : {rendered}")
    print(f"  Folders created        : {folders_created}")
    print(f"  Stubs untouched        : {untouched_stubs}")
    print(f"  Placeholders skipped   : {untouched_placeholders}")
    if asset_errors:
        print(f"  Asset errors           : {len(asset_errors)}")
    if dry_run:
        print("  (DRY RUN \u2014 no files were written)")

    return 0 if not asset_errors else 2


def main():
    parser = argparse.ArgumentParser(
        description="Generate Detroit Badman Archive source pages from detroit.json."
    )
    parser.add_argument("--data", default="./docs/data/detroit.json",
                        help="Path to detroit.json (default: ./docs/data/detroit.json)")
    parser.add_argument("--out", default="./docs/archive/sources",
                        help="Output base dir; entries/ is created within (default: ./docs/archive/sources)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Show what would be written without modifying files.")
    parser.add_argument("--quiet", action="store_true",
                        help="Suppress per-source output.")
    parser.add_argument("--skip-validate", action="store_true",
                        help="Skip asset-existence validation (useful when drafting).")
    args = parser.parse_args()

    data_path = Path(args.data).resolve()
    out_dir = Path(args.out).resolve()

    return build(
        data_path=data_path,
        out_dir=out_dir,
        dry_run=args.dry_run,
        quiet=args.quiet,
        skip_validate=args.skip_validate,
    )


if __name__ == "__main__":
    sys.exit(main())
