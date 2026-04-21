/**
 * bda-source-page.js
 *
 * Page-specific script for individual source pages at
 * /archive/sources/?id=src_[city]_NNNN.
 *
 * A single template file serves all sources. This script reads the `id`
 * querystring parameter, looks up the source in /data/detroit.json, and
 * renders header, viewer, metadata rail, cited-in, related sources, and
 * citation block.
 *
 * Runs only on the individual source page template. Loads after scripts.js
 * and bda-partials-loader.js. Consumes window.getModalityConfig() from
 * scripts.js with an inline fallback.
 *
 * WCAG 2.2 Level AA compliant. See JAVASCRIPT_DOCUMENTATION.md /
 * bda-source-page.js spec for the full accessibility contract.
 */
(function () {
    'use strict';

    // ---------------------------------------------------------------------
    // Constants
    // ---------------------------------------------------------------------

    var DATA_URL = '/data/detroit.json';

    var FIGURE_ROUTE_PREFIX = '/archive/figures/';
    var SOURCE_ROUTE_PREFIX = '/archive/sources/';
    var SOURCES_LANDING = '/archive/sources/';

    var ACTIVE_MODALITIES = ['detective', 'revolutionary', 'superhero_villain'];
    var PENDING_MODALITIES = ['gangsta_pimp', 'folk_hero_outlaw'];

    var RELATED_SOURCES_CAP = 12;

    var MODALITY_LABELS_FALLBACK = {
        detective: 'Detective',
        revolutionary: 'Revolutionary',
        superhero_villain: 'Superhero-Villain',
        gangsta_pimp: 'Gangsta-Pimp',
        folk_hero_outlaw: 'Folk Hero-Outlaw'
    };

    var LANGUAGE_LABELS = {
        en: 'English',
        fr: 'French',
        es: 'Spanish',
        de: 'German',
        it: 'Italian',
        pt: 'Portuguese',
        sw: 'Swahili',
        ar: 'Arabic',
        zh: 'Chinese',
        ja: 'Japanese'
    };

    var NAME_SUFFIXES = ['Jr.', 'Sr.', 'II', 'III', 'IV', 'Jr', 'Sr'];

    // Thumbnail glyph mapping shared with bda-sources.js (related source cards).
    var TYPE_TO_GLYPH = {
        novel: 'book', biography: 'book', academic: 'book', book: 'book',
        nonfiction: 'book', comics: 'book', memoir: 'book',
        article: 'doc', criticism: 'doc', reference: 'doc', interview: 'doc',
        legal: 'doc', institutional: 'doc', digital_archive: 'doc',
        publisher: 'doc', document: 'doc', manuscript: 'doc', letter: 'doc',
        government: 'doc', founding_document: 'doc',
        organizational_document: 'doc', organizational_statement: 'doc',
        newsletter: 'doc', obituary: 'doc',
        newspaper: 'news', news: 'news', magazine: 'news',
        photo: 'photo', photograph: 'photo', image: 'photo', artwork: 'photo',
        audio: 'audio', audio_recording: 'audio', oral_history: 'audio',
        podcast: 'audio',
        film: 'film', video: 'film', television: 'film', tv: 'film',
        documentary: 'film'
    };

    // Text-based source types — get a "View source" external link as the viewer.
    var TEXT_TYPES = [
        'novel', 'book', 'biography', 'academic', 'news', 'newspaper',
        'obituary', 'criticism', 'manuscript', 'letter', 'legal',
        'government', 'founding_document', 'organizational_document',
        'organizational_statement', 'newsletter', 'reference', 'article',
        'publisher', 'institutional', 'digital_archive', 'comics'
    ];

    var IMAGE_TYPES = ['artwork', 'photo', 'image', 'photograph'];
    var AUDIO_TYPES = ['audio_recording', 'audio', 'podcast', 'oral_history'];
    var VIDEO_TYPES = ['film', 'television', 'tv', 'documentary', 'video'];

    // ---------------------------------------------------------------------
    // DOM references
    // ---------------------------------------------------------------------

    var dom = {};

    function cacheDom() {
        dom.main = document.getElementById('main-content');
        dom.header = document.querySelector('.bda-source-header');
        dom.viewer = document.getElementById('bda-source-viewer');
        dom.viewerHeading = document.getElementById('bda-source-viewer-heading');
        dom.metadataList = document.getElementById('bda-source-metadata-list');
        dom.metadataRail = document.querySelector('.bda-source-metadata-rail');
        dom.citedInList = document.getElementById('bda-source-cited-in-list');
        dom.relatedList = document.getElementById('bda-source-related-list');
        dom.citationSection = document.querySelector('.bda-source-citation');
    }

    // ---------------------------------------------------------------------
    // State
    // ---------------------------------------------------------------------

    var state = {
        source: null,
        allSources: [],
        allFigures: [],
        figureById: {},
        citationFormat: 'chicago',
        plainCitationByFormat: { chicago: '', mla: '', apa: '' }
    };

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    function escapeHtml(s) {
        if (s === null || s === undefined) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatTypeLabel(type) {
        if (!type) return '';
        return String(type)
            .split('_')
            .map(function (p) { return p ? p.charAt(0).toUpperCase() + p.slice(1) : ''; })
            .join(' ');
    }

    function capitalize(s) {
        if (!s) return '';
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    function modalityToCssSuffix(mod) {
        return String(mod).replace(/_/g, '-');
    }

    function getModalityLabel(mod) {
        if (typeof window.getModalityConfig === 'function') {
            try {
                var cfg = window.getModalityConfig(mod);
                if (cfg && cfg.displayLabel) return cfg.displayLabel;
            } catch (e) { /* fall through */ }
        }
        return MODALITY_LABELS_FALLBACK[mod] || mod;
    }

    function parseQuerystring() {
        var params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    function findSource(id, sources) {
        for (var i = 0; i < sources.length; i++) {
            if (sources[i] && sources[i].id === id) return sources[i];
        }
        return null;
    }

    function resolveLanguage(code) {
        if (!code) return '';
        return LANGUAGE_LABELS[code] || code;
    }

    /**
     * Extract a sortable last-name token from a figure's `name` field.
     * Handles suffixes, single-name figures, and paired entries.
     */
    function lastName(fullName) {
        if (!fullName) return '';
        var parts = String(fullName).trim().split(/\s+/);

        // Strip trailing suffix (Jr., Sr., III, etc.)
        if (parts.length > 1) {
            var tail = parts[parts.length - 1].replace(/,$/, '');
            if (NAME_SUFFIXES.indexOf(tail) !== -1) {
                parts.pop();
            }
        }

        // Paired entries: "Gaidi & Imari Obadele" -> "Obadele"
        if (parts.indexOf('&') !== -1) {
            return parts[parts.length - 1];
        }

        // Single-name figures: use the whole name
        if (parts.length === 1) {
            return parts[0];
        }

        return parts[parts.length - 1];
    }

    /**
     * Format a figure's name as "Last, First Middle" for scholarly order.
     * Single-name figures are returned as-is.
     */
    function scholarlyName(fullName) {
        if (!fullName) return '';
        var parts = String(fullName).trim().split(/\s+/);
        if (parts.length === 1) return parts[0];
        if (parts.indexOf('&') !== -1) return fullName;

        var suffix = '';
        if (parts.length > 1) {
            var tail = parts[parts.length - 1].replace(/,$/, '');
            if (NAME_SUFFIXES.indexOf(tail) !== -1) {
                suffix = ' ' + parts.pop();
            }
        }
        if (parts.length === 1) return parts[0] + suffix;

        var last = parts.pop();
        return last + ', ' + parts.join(' ') + suffix;
    }

    /**
     * Convert a citation string with *italic* markers to HTML with <em> tags.
     * Input must already be HTML-escaped.
     */
    function italicMarkersToHtml(escapedStr) {
        return escapedStr.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    }

    /**
     * Strip *italic* markers to produce plain-text citation for clipboard.
     */
    function stripItalicMarkers(s) {
        return String(s).replace(/\*([^*]+)\*/g, '$1');
    }

    // ---------------------------------------------------------------------
    // Data loading
    // ---------------------------------------------------------------------

    function loadData() {
        return fetch(DATA_URL).then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        });
    }

    function processData(data) {
        var sources = Array.isArray(data.sources) ? data.sources : [];
        var figures = Array.isArray(data.figures) ? data.figures : [];

        state.allSources = sources.filter(function (s) {
            return s && !s._placeholder && s.id;
        });

        state.allFigures = figures.filter(function (f) {
            return f && !f._placeholder && f.id;
        });

        state.figureById = {};
        state.allFigures.forEach(function (f) {
            state.figureById[f.id] = f;
        });
    }

    // ---------------------------------------------------------------------
    // Not-found state
    // ---------------------------------------------------------------------

    function renderNotFound() {
        if (!dom.main) return;
        dom.main.innerHTML =
            '<div role="alert" class="bda-source-not-found">' +
                '<h1>Source not found</h1>' +
                '<p>The source you\u2019re looking for doesn\u2019t exist in this archive. ' +
                    '<a href="' + escapeHtml(SOURCES_LANDING) + '">Browse all sources</a>.' +
                '</p>' +
            '</div>';
        try {
            document.title = 'Source not found | Detroit Badman Archive';
        } catch (e) { /* ignore */ }
    }

    // ---------------------------------------------------------------------
    // Header
    // ---------------------------------------------------------------------

    function renderHeader(source) {
        if (!dom.header) return;

        var category = source.category || 'primary';
        var categoryLabel = capitalize(category);
        var typeLabel = formatTypeLabel(source.type);
        var year = (source.year !== null && source.year !== undefined) ? source.year : '';

        var parts = [];
        parts.push(
            '<span class="bda-source-card-category bda-cat-' + escapeHtml(category) + '">' +
                escapeHtml(categoryLabel) +
            '</span>'
        );
        if (typeLabel) {
            parts.push('<span class="bda-source-type">' + escapeHtml(typeLabel) + '</span>');
        }
        if (year !== '') {
            parts.push('<span class="bda-source-year">' + escapeHtml(String(year)) + '</span>');
        }
        parts.push(
            '<button type="button" class="bda-source-permalink-btn" ' +
                    'aria-label="Copy permalink to clipboard" ' +
                    'aria-describedby="bda-source-permalink-status">' +
                'Copy permalink' +
            '</button>' +
            '<span id="bda-source-permalink-status" class="sr-only" ' +
                  'role="status" aria-live="polite"></span>'
        );

        dom.header.innerHTML =
            '<h1 class="bda-source-title">' + escapeHtml(source.title || 'Untitled source') + '</h1>' +
            '<div class="bda-source-header-meta">' + parts.join('') + '</div>';

        // Update document title
        try {
            document.title = (source.title || 'Source') + ' | Detroit Badman Archive';
        } catch (e) { /* ignore */ }
    }

    // ---------------------------------------------------------------------
    // Viewer dispatch
    // ---------------------------------------------------------------------

    function renderViewer(source) {
        if (!dom.viewer) return;

        // 1. Access-level gates first
        if (source.access_level === 'embargoed') {
            return renderEmbargoedViewer(source);
        }
        if (source.access_level === 'consent_required') {
            return renderConsentRequiredViewer(source);
        }
        if (source.access_level === 'restricted') {
            return renderRestrictedViewer(source);
        }

        // 2. Multi-asset (reserved)
        if (source.media && Array.isArray(source.media) && source.media.length > 0) {
            return renderMultiAssetViewer(source);
        }

        // 3. Type-based dispatch
        return renderByType(source);
    }

    function setViewerBody(html) {
        // Preserve the sr-only <h2> heading that lives inside the section.
        var headingHtml = '<h2 id="bda-source-viewer-heading" class="sr-only">Source</h2>';
        dom.viewer.innerHTML = headingHtml + html;
    }

    function renderEmbargoedViewer(source) {
        setViewerBody(
            '<div class="bda-source-access-notice" role="note">' +
                '<h3>This source is under embargo</h3>' +
                '<p>This source is temporarily restricted and will be available once the embargo lifts. ' +
                    'See the Notes field in the metadata rail for the expiration date if documented.</p>' +
                '<p>See the metadata rail for repository information if in-person access is available.</p>' +
            '</div>'
        );
    }

    function renderConsentRequiredViewer(source) {
        setViewerBody(
            '<div class="bda-source-access-notice" role="note">' +
                '<h3>This source requires consent to access</h3>' +
                '<p>This source was produced under participant consent terms that restrict open display. ' +
                    'See the metadata rail for the consent scope and contact information.</p>' +
            '</div>'
        );
    }

    function renderRestrictedViewer(source) {
        var repoLine = source.repository
            ? 'This source is held at ' + escapeHtml(source.repository) + ' and requires an institutional affiliation or an on-site visit to access.'
            : 'This source requires an institutional affiliation or an on-site visit to access.';
        setViewerBody(
            '<div class="bda-source-access-notice" role="note">' +
                '<h3>This source requires institutional access</h3>' +
                '<p>' + repoLine + ' See the metadata rail for repository details.</p>' +
            '</div>'
        );
    }

    function renderByType(source) {
        var type = source.type || '';

        if (IMAGE_TYPES.indexOf(type) !== -1) {
            return renderImageViewer(source);
        }
        if (AUDIO_TYPES.indexOf(type) !== -1) {
            return renderAudioViewer(source);
        }
        if (VIDEO_TYPES.indexOf(type) !== -1) {
            return renderVideoViewer(source);
        }
        // Default: text-based external link
        return renderTextViewer(source);
    }

    function renderTextViewer(source) {
        if (source.url) {
            setViewerBody(
                '<div class="bda-source-viewer-text">' +
                    '<a class="btn btn-primary bda-source-view-external" ' +
                       'href="' + escapeHtml(source.url) + '" ' +
                       'target="_blank" rel="noopener noreferrer">' +
                        'View source' +
                        ' <span class="sr-only">(opens in new tab)</span>' +
                    '</a>' +
                '</div>'
            );
        } else {
            // Archival-only text source: no URL
            var repo = source.repository ? escapeHtml(source.repository) : 'the holding institution';
            setViewerBody(
                '<div class="bda-source-viewer-text">' +
                    '<div class="bda-source-access-notice" role="note">' +
                        '<h3>Archival access only</h3>' +
                        '<p>This source is not available online. See the metadata rail for ' +
                            repo + ' and visit in person or request a reproduction.</p>' +
                    '</div>' +
                '</div>'
            );
        }
    }

    function renderImageViewer(source) {
        if (!source.url) {
            return renderTextViewer(source);
        }
        setViewerBody(
            '<figure class="bda-source-viewer-image">' +
                '<img src="' + escapeHtml(source.url) + '" ' +
                     'alt="' + escapeHtml(source.title || 'Source image') + '">' +
                '<figcaption>' + escapeHtml(source.title || '') + '</figcaption>' +
            '</figure>'
        );
    }

    function renderAudioViewer(source) {
        if (!source.url) {
            return renderTextViewer(source);
        }
        setViewerBody(
            '<div class="bda-source-viewer-audio">' +
                '<audio controls>' +
                    '<source src="' + escapeHtml(source.url) + '" type="audio/mpeg">' +
                    'Your browser does not support the audio element.' +
                '</audio>' +
            '</div>'
        );
    }

    function renderVideoViewer(source) {
        // For films/TV, URL usually points to a publisher/streaming page, not a file.
        // Render as external link like text sources.
        return renderTextViewer(source);
    }

    function renderMultiAssetViewer(source) {
        // Reserved — not active at launch. Render a minimal, accessible stub
        // so the code path exists and validates when real media arrays appear.
        var tabs = [];
        var panels = [];
        source.media.forEach(function (asset, i) {
            var tabId = 'bda-asset-tab-' + i;
            var panelId = 'bda-asset-panel-' + i;
            var selected = i === 0 ? 'true' : 'false';
            var hidden = i === 0 ? '' : ' hidden';
            var label = escapeHtml(asset.label || asset.type || ('Asset ' + (i + 1)));

            tabs.push(
                '<button role="tab" id="' + tabId + '" ' +
                        'aria-selected="' + selected + '" ' +
                        'aria-controls="' + panelId + '" ' +
                        'tabindex="' + (i === 0 ? '0' : '-1') + '">' +
                    label +
                '</button>'
            );

            var panelBody = '';
            if (asset.type === 'audio' && asset.url) {
                panelBody =
                    '<audio controls>' +
                        '<source src="' + escapeHtml(asset.url) + '" ' +
                               'type="' + escapeHtml(asset.mime_type || 'audio/mpeg') + '">' +
                    '</audio>';
            } else if (asset.type === 'transcript' && asset.content) {
                panelBody = '<div class="bda-source-transcript">' + escapeHtml(asset.content) + '</div>';
            } else if (asset.url) {
                panelBody =
                    '<a class="btn btn-primary" href="' + escapeHtml(asset.url) + '" ' +
                       'target="_blank" rel="noopener noreferrer">' +
                        'Open ' + label + ' <span class="sr-only">(opens in new tab)</span>' +
                    '</a>';
            }

            panels.push(
                '<div role="tabpanel" id="' + panelId + '" ' +
                     'aria-labelledby="' + tabId + '"' + hidden + '>' +
                    panelBody +
                '</div>'
            );
        });

        setViewerBody(
            '<div class="bda-source-viewer-multi" role="region" aria-label="Source assets">' +
                '<div role="tablist" aria-label="Available formats">' + tabs.join('') + '</div>' +
                panels.join('') +
            '</div>'
        );
    }

    function bindMultiAssetTabs() {
        var viewer = dom.viewer ? dom.viewer.querySelector('.bda-source-viewer-multi') : null;
        if (!viewer) return;
        var tablist = viewer.querySelector('[role="tablist"]');
        if (!tablist) return;
        var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
        if (tabs.length === 0) return;

        function activate(idx) {
            tabs.forEach(function (tab, i) {
                var isActive = i === idx;
                tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
                tab.setAttribute('tabindex', isActive ? '0' : '-1');
                var panelId = tab.getAttribute('aria-controls');
                var panel = panelId ? document.getElementById(panelId) : null;
                if (panel) panel.hidden = !isActive;
            });
            tabs[idx].focus();
        }

        tabs.forEach(function (tab, i) {
            tab.addEventListener('click', function () { activate(i); });
            tab.addEventListener('keydown', function (e) {
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    activate((i + 1) % tabs.length);
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    activate((i - 1 + tabs.length) % tabs.length);
                } else if (e.key === 'Home') {
                    e.preventDefault();
                    activate(0);
                } else if (e.key === 'End') {
                    e.preventDefault();
                    activate(tabs.length - 1);
                }
            });
        });
    }

    // ---------------------------------------------------------------------
    // Metadata rail
    // ---------------------------------------------------------------------

    var ACCESS_BADGES = {
        restricted: { cls: 'bda-access-badge-restricted', label: 'Restricted \u2014 institutional access required' },
        embargoed: { cls: 'bda-access-badge-embargoed', label: 'Embargoed' },
        consent_required: { cls: 'bda-access-badge-consent', label: 'Consent required' }
    };

    function renderMetadataRail(source) {
        if (!dom.metadataList) return;

        var rows = [];

        function row(term, html) {
            rows.push('<dt>' + escapeHtml(term) + '</dt><dd>' + html + '</dd>');
        }

        // Type (always)
        var typeLabel = formatTypeLabel(source.type);
        row('Type', escapeHtml(typeLabel || '\u2014'));

        // Category (always) with badge class
        var category = source.category || 'primary';
        row('Category',
            '<span class="bda-source-card-category bda-cat-' + escapeHtml(category) + '">' +
                escapeHtml(capitalize(category)) +
            '</span>'
        );

        // Year
        if (source.year !== null && source.year !== undefined) {
            row('Year', escapeHtml(String(source.year)));
        } else {
            row('Year', '\u2014');
        }

        if (source.author) row('Author', escapeHtml(source.author));
        if (source.publisher) row('Publisher', escapeHtml(source.publisher));
        if (source.repository) row('Repository', escapeHtml(source.repository));
        if (source.extent) row('Extent', escapeHtml(source.extent));
        if (source.language) row('Language', escapeHtml(resolveLanguage(source.language)));
        if (source.rights) row('Rights', escapeHtml(source.rights));

        // Access level (non-public only)
        if (source.access_level && source.access_level !== 'public') {
            var badge = ACCESS_BADGES[source.access_level];
            if (badge) {
                row('Access',
                    '<span class="' + badge.cls + '">' + escapeHtml(badge.label) + '</span>'
                );
            } else {
                row('Access', escapeHtml(source.access_level));
            }
        }

        // Date accessed
        if (source.date_accessed) {
            row('Date accessed', 'Accessed ' + escapeHtml(source.date_accessed));
        }

        // Permalink (always)
        var permalink = window.location.href;
        row('Permalink',
            '<code class="bda-source-permalink-text">' + escapeHtml(permalink) + '</code> ' +
            '<button type="button" class="bda-source-permalink-copy" ' +
                    'aria-label="Copy permalink to clipboard" ' +
                    'aria-describedby="bda-source-permalink-rail-status">' +
                'Copy' +
            '</button>' +
            '<span id="bda-source-permalink-rail-status" class="sr-only" ' +
                  'role="status" aria-live="polite"></span>'
        );

        dom.metadataList.innerHTML = rows.join('');

        // Notes block (rendered below the <dl>, in the rail)
        renderNotesBlock(source);
    }

    function renderNotesBlock(source) {
        if (!dom.metadataRail) return;

        // Remove any existing notes block so we don't duplicate on re-render.
        var existing = dom.metadataRail.querySelector('.bda-source-notes');
        if (existing) existing.parentNode.removeChild(existing);

        if (!source.notes) return;

        var block = document.createElement('div');
        block.className = 'bda-source-notes';
        block.innerHTML =
            '<h3>Notes</h3>' +
            '<p>' + escapeHtml(source.notes) + '</p>';
        dom.metadataRail.appendChild(block);
    }

    // ---------------------------------------------------------------------
    // Cited In
    // ---------------------------------------------------------------------

    function renderCitedIn(source) {
        if (!dom.citedInList) return;

        var ids = Array.isArray(source.figure_ids) ? source.figure_ids : [];
        var figures = ids
            .map(function (id) { return state.figureById[id]; })
            .filter(function (f) { return !!f; });

        if (figures.length === 0) {
            dom.citedInList.innerHTML =
                '<p class="bda-cited-in-empty">' +
                    'No figures in this archive currently reference this source.' +
                '</p>';
            return;
        }

        // Sort: alphabetical by modality, then alphabetical by last name.
        figures.sort(function (a, b) {
            var aMod = String(a.modality || '');
            var bMod = String(b.modality || '');
            var modCmp = aMod.localeCompare(bMod);
            if (modCmp !== 0) return modCmp;
            return lastName(a.name).localeCompare(lastName(b.name), undefined, { sensitivity: 'base' });
        });

        // Group by modality
        var groups = {};
        var order = [];
        figures.forEach(function (f) {
            var m = f.modality || 'unknown';
            if (!groups[m]) {
                groups[m] = [];
                order.push(m);
            }
            groups[m].push(f);
        });

        var html = order.map(function (mod) {
            var label = getModalityLabel(mod);
            var suffix = modalityToCssSuffix(mod);
            var items = groups[mod].map(function (f) {
                var display = scholarlyName(f.name || f.id);
                var href = FIGURE_ROUTE_PREFIX + '?id=' + encodeURIComponent(f.id);
                return '<li><a href="' + escapeHtml(href) + '">' + escapeHtml(display) + '</a></li>';
            }).join('');
            return '' +
                '<div class="bda-cited-in-modality-group">' +
                    '<h3 class="bda-cited-in-modality-heading">' +
                        '<span class="bda-filter-modality-marker bda-mm-' + escapeHtml(suffix) + '" ' +
                              'aria-hidden="true"></span>' +
                        escapeHtml(label) +
                    '</h3>' +
                    '<ul class="bda-cited-in-list">' + items + '</ul>' +
                '</div>';
        }).join('');

        dom.citedInList.innerHTML = html;
    }

    // ---------------------------------------------------------------------
    // Related sources
    // ---------------------------------------------------------------------

    function findRelatedSources(source) {
        if (!source.figure_ids || source.figure_ids.length === 0) return [];
        var current = {};
        source.figure_ids.forEach(function (id) { current[id] = true; });

        return state.allSources
            .filter(function (o) { return o.id !== source.id; })
            .map(function (o) {
                var ids = Array.isArray(o.figure_ids) ? o.figure_ids : [];
                var overlap = 0;
                for (var i = 0; i < ids.length; i++) {
                    if (current[ids[i]]) overlap++;
                }
                return { source: o, overlap: overlap };
            })
            .filter(function (item) { return item.overlap > 0; })
            .sort(function (a, b) {
                if (b.overlap !== a.overlap) return b.overlap - a.overlap;
                return String(a.source.title || '').localeCompare(String(b.source.title || ''), undefined, { sensitivity: 'base' });
            })
            .slice(0, RELATED_SOURCES_CAP)
            .map(function (item) { return item.source; });
    }

    function relatedFigureLabel(src) {
        if (!src.figure_ids || src.figure_ids.length === 0) return '';
        var names = src.figure_ids
            .map(function (id) {
                var f = state.figureById[id];
                return f ? f.name : null;
            })
            .filter(function (n) { return !!n; });
        if (names.length === 0) return '';
        if (names.length === 1) return names[0];
        if (names.length === 2) return names[0] + ' & ' + names[1];
        return names[0] + ' +' + (names.length - 1);
    }

    function renderRelatedCard(src) {
        var category = src.category || 'primary';
        var categoryLabel = capitalize(category);
        var glyph = TYPE_TO_GLYPH[src.type] || 'doc';
        var typeLabel = formatTypeLabel(src.type);
        var figureLabel = relatedFigureLabel(src);
        var year = (src.year !== null && src.year !== undefined) ? src.year : '';
        var isExternal = !!(src.url && !src.repository);

        var metaParts = [];
        if (typeLabel) metaParts.push(typeLabel);
        if (year !== '') metaParts.push(year);
        var metaLine = metaParts.join(' \u00b7 ');

        var ariaParts = [src.title || 'Untitled source'];
        if (figureLabel) ariaParts.push('\u2014 ' + figureLabel);
        if (year !== '') ariaParts.push('(' + year + ')');
        var ariaLabel = ariaParts.join(' ');

        var href = SOURCE_ROUTE_PREFIX + '?id=' + encodeURIComponent(src.id);

        var externalBadge = isExternal
            ? '<span class="bda-source-card-external">External</span>'
            : '';

        var figureLine = figureLabel
            ? '<p class="bda-source-card-figure">' + escapeHtml(figureLabel) + '</p>'
            : '';

        return '' +
            '<li>' +
                '<a class="bda-source-card" href="' + escapeHtml(href) + '" ' +
                   'aria-label="' + escapeHtml(ariaLabel) + '">' +
                    '<div class="bda-source-card-thumb">' +
                        '<span class="bda-source-card-category bda-cat-' + escapeHtml(category) + '">' +
                            escapeHtml(categoryLabel) +
                        '</span>' +
                        externalBadge +
                        '<div class="bda-source-thumb-glyph bda-thumb-' + escapeHtml(glyph) + '" aria-hidden="true"></div>' +
                    '</div>' +
                    '<div class="bda-source-card-info">' +
                        '<h3 class="bda-source-card-title">' + escapeHtml(src.title || 'Untitled source') + '</h3>' +
                        figureLine +
                        (metaLine ? '<p class="bda-source-card-meta">' + escapeHtml(metaLine) + '</p>' : '') +
                    '</div>' +
                '</a>' +
            '</li>';
    }

    function renderRelatedSources(source) {
        if (!dom.relatedList) return;

        var related = findRelatedSources(source);

        if (related.length === 0) {
            dom.relatedList.innerHTML =
                '<p class="bda-source-related-empty">No related sources in this archive.</p>';
            return;
        }

        dom.relatedList.innerHTML =
            '<ul class="bda-source-related-grid">' +
                related.map(renderRelatedCard).join('') +
            '</ul>';
    }

    // ---------------------------------------------------------------------
    // Citation generation
    // ---------------------------------------------------------------------

    function missing(label) {
        // Bracketed placeholder for missing citation fields.
        return '[' + label + ']';
    }

    function authorForCitation(source, style) {
        // Returns author string formatted for the given style, or a bracketed placeholder.
        if (!source.author) return missing('Author unknown');
        var raw = String(source.author).trim();

        // If the author field contains a parenthetical pseudonym, preserve it.
        // e.g., "Donald Goines (as Al C. Clark)"
        var parenMatch = raw.match(/^(.*?)\s*(\(.+\))\s*$/);
        var baseName = parenMatch ? parenMatch[1].trim() : raw;
        var paren = parenMatch ? ' ' + parenMatch[2] : '';

        if (style === 'chicago' || style === 'mla') {
            return scholarlyName(baseName) + paren;
        }
        if (style === 'apa') {
            // APA: "Last, F."
            var parts = baseName.split(/\s+/);
            if (parts.length === 1) return baseName + paren;
            var last = parts.pop();
            // Strip suffix from last if needed
            if (NAME_SUFFIXES.indexOf(last.replace(/,$/, '')) !== -1 && parts.length > 0) {
                last = parts.pop();
            }
            var initials = parts
                .filter(function (p) { return p.length > 0; })
                .map(function (p) { return p.charAt(0).toUpperCase() + '.'; })
                .join(' ');
            return last + ', ' + initials + paren;
        }
        return raw;
    }

    function generateChicago(source) {
        var author = authorForCitation(source, 'chicago');
        var title = source.title ? '*' + source.title + '*' : missing('Title unknown');
        var year = (source.year !== null && source.year !== undefined) ? source.year : missing('Year unknown');
        var type = source.type || '';

        if (TEXT_TYPES.indexOf(type) !== -1 || type === 'comics' || type === 'biography' || type === 'academic') {
            // Book/novel pattern
            var publisher = source.publisher || missing('Publisher unknown');
            return author + '. ' + title + '. ' + publisher + ', ' + year + '.';
        }

        if (VIDEO_TYPES.indexOf(type) !== -1) {
            var distributor = source.publisher || source.repository || missing('Distributor unknown');
            return title + '. ' + distributor + ', ' + year + '.';
        }

        if (AUDIO_TYPES.indexOf(type) !== -1 || type === 'interview') {
            var repo = source.repository || source.publisher || missing('Repository unknown');
            return author + '. ' + title + '. ' + repo + ', ' + year + '.';
        }

        if (IMAGE_TYPES.indexOf(type) !== -1) {
            var imgRepo = source.repository || source.publisher || missing('Repository unknown');
            return author + '. ' + title + '. ' + imgRepo + ', ' + year + '.';
        }

        if (type === 'legal' || type === 'government' || type === 'institutional' ||
            type === 'founding_document' || type === 'organizational_document' ||
            type === 'organizational_statement' || type === 'digital_archive') {
            var archRepo = source.repository || source.publisher || missing('Repository unknown');
            return title + '. ' + archRepo + (year ? ', ' + year : '') + '.';
        }

        if (source.url && !source.publisher) {
            var accessed = source.date_accessed ? 'Accessed ' + source.date_accessed + '. ' : '';
            return author + '. ' + title + '. ' + accessed + source.url + '.';
        }

        // Fallback: generic
        var fallbackPub = source.publisher || source.repository || missing('Publisher unknown');
        return author + '. ' + title + '. ' + fallbackPub + ', ' + year + '.';
    }

    function generateMLA(source) {
        var author = authorForCitation(source, 'mla');
        var title = source.title ? '*' + source.title + '*' : missing('Title unknown');
        var year = (source.year !== null && source.year !== undefined) ? source.year : missing('Year unknown');
        var type = source.type || '';

        if (VIDEO_TYPES.indexOf(type) !== -1) {
            var studio = source.publisher || source.repository || missing('Studio unknown');
            return title + '. ' + studio + ', ' + year + '.';
        }

        if (type === 'legal' || type === 'government' || type === 'institutional' ||
            type === 'digital_archive' || type === 'founding_document' ||
            type === 'organizational_document' || type === 'organizational_statement') {
            var archRepo = source.repository || source.publisher || missing('Repository unknown');
            var accessed = source.date_accessed ? ', ' + source.date_accessed : '';
            return title + '. ' + archRepo + accessed + '.';
        }

        if (source.url && !source.publisher) {
            var mlaUrl = source.url;
            return author + '. ' + title + ', ' + year + ', ' + mlaUrl + '.';
        }

        // Book / novel / article default
        var publisher = source.publisher || source.repository || missing('Publisher unknown');
        return author + '. ' + title + '. ' + publisher + ', ' + year + '.';
    }

    function generateAPA(source) {
        var author = authorForCitation(source, 'apa');
        var title = source.title ? '*' + source.title + '*' : missing('Title unknown');
        var yearVal = (source.year !== null && source.year !== undefined) ? source.year : 'n.d.';
        var type = source.type || '';

        if (VIDEO_TYPES.indexOf(type) !== -1) {
            var studio = source.publisher || source.repository || missing('Studio unknown');
            return author + ' (Director). (' + yearVal + '). ' + title + ' [Film]. ' + studio + '.';
        }

        if (source.url && !source.publisher) {
            return author + ' (' + yearVal + '). ' + stripItalicMarkers(title) + '. ' + source.url;
        }

        // Book default
        var publisher = source.publisher || source.repository || missing('Publisher unknown');
        return author + ' (' + yearVal + '). ' + title + '. ' + publisher + '.';
    }

    function generateCitations(source) {
        state.plainCitationByFormat = {
            chicago: generateChicago(source),
            mla: generateMLA(source),
            apa: generateAPA(source)
        };
    }

    // ---------------------------------------------------------------------
    // Citation block
    // ---------------------------------------------------------------------

    function renderCitationBlock(source) {
        if (!dom.citationSection) return;

        generateCitations(source);

        dom.citationSection.innerHTML =
            '<h2 id="bda-source-citation-heading">Citation</h2>' +
            '<div class="bda-citation-block">' +
                '<fieldset class="bda-citation-format-group">' +
                    '<legend>Citation format</legend>' +
                    '<label>' +
                        '<input type="radio" name="citation-format" value="chicago" checked> ' +
                        'Chicago' +
                    '</label>' +
                    '<label>' +
                        '<input type="radio" name="citation-format" value="mla"> ' +
                        'MLA' +
                    '</label>' +
                    '<label>' +
                        '<input type="radio" name="citation-format" value="apa"> ' +
                        'APA' +
                    '</label>' +
                '</fieldset>' +
                '<div class="bda-citation-text" id="bda-citation-text"></div>' +
                '<button type="button" class="bda-citation-copy-btn" ' +
                        'aria-describedby="bda-citation-copy-status">' +
                    'Copy citation' +
                '</button>' +
                '<div id="bda-citation-copy-status" class="sr-only" ' +
                     'role="status" aria-live="polite"></div>' +
            '</div>';

        renderCitationText();
    }

    function renderCitationText() {
        var target = document.getElementById('bda-citation-text');
        if (!target) return;
        var raw = state.plainCitationByFormat[state.citationFormat] || '';
        target.innerHTML = italicMarkersToHtml(escapeHtml(raw));
    }

    // ---------------------------------------------------------------------
    // Copy-to-clipboard
    // ---------------------------------------------------------------------

    function announceCopy(statusEl, message) {
        if (!statusEl) return;
        statusEl.textContent = message;
        setTimeout(function () {
            if (statusEl.textContent === message) statusEl.textContent = '';
        }, 3000);
    }

    function copyToClipboard(text, statusEl) {
        function ok() { announceCopy(statusEl, 'Copied to clipboard'); }
        function fail() {
            announceCopy(statusEl, 'Could not copy. Press Ctrl+C or Cmd+C to copy manually.');
        }

        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            return navigator.clipboard.writeText(text).then(ok, fail);
        }

        // Legacy fallback
        try {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.position = 'absolute';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            var success = document.execCommand && document.execCommand('copy');
            document.body.removeChild(ta);
            if (success) { ok(); } else { fail(); }
        } catch (e) {
            fail();
        }
    }

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    function bindEvents() {
        // Header permalink
        if (dom.header) {
            dom.header.addEventListener('click', function (e) {
                var btn = e.target.closest && e.target.closest('.bda-source-permalink-btn');
                if (!btn) return;
                var status = document.getElementById('bda-source-permalink-status');
                copyToClipboard(window.location.href, status);
            });
        }

        // Metadata rail permalink
        if (dom.metadataRail) {
            dom.metadataRail.addEventListener('click', function (e) {
                var btn = e.target.closest && e.target.closest('.bda-source-permalink-copy');
                if (!btn) return;
                var status = document.getElementById('bda-source-permalink-rail-status');
                copyToClipboard(window.location.href, status);
            });
        }

        // Citation format + copy
        if (dom.citationSection) {
            dom.citationSection.addEventListener('change', function (e) {
                var t = e.target;
                if (!t || t.name !== 'citation-format') return;
                state.citationFormat = t.value || 'chicago';
                renderCitationText();
            });

            dom.citationSection.addEventListener('click', function (e) {
                var btn = e.target.closest && e.target.closest('.bda-citation-copy-btn');
                if (!btn) return;
                var plain = state.plainCitationByFormat[state.citationFormat] || '';
                var text = stripItalicMarkers(plain);
                var status = document.getElementById('bda-citation-copy-status');
                copyToClipboard(text, status);
            });
        }

        // Multi-asset viewer tabs (reserved, but wire up if present)
        bindMultiAssetTabs();
    }

    // ---------------------------------------------------------------------
    // Init
    // ---------------------------------------------------------------------

    function renderAll(source) {
        renderHeader(source);
        renderViewer(source);
        renderMetadataRail(source);
        renderCitedIn(source);
        renderRelatedSources(source);
        renderCitationBlock(source);
        bindEvents();
    }

    function init() {
        cacheDom();

        var id = parseQuerystring();

        // Missing querystring: redirect to landing (no history pollution).
        if (!id) {
            window.location.replace(SOURCES_LANDING);
            return;
        }

        // Bail silently if required structural elements are absent.
        if (!dom.main) return;

        loadData()
            .then(function (data) {
                processData(data);
                state.source = findSource(id, state.allSources);
                if (!state.source) {
                    renderNotFound();
                    return;
                }
                renderAll(state.source);
            })
            .catch(function (err) {
                if (window.console && console.error) {
                    console.error('bda-source-page.js: failed to load data', err);
                }
                renderNotFound();
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
