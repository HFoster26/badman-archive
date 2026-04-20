/**
 * bda-figures-viewer.js
 *
 * Page-specific script for individual figure pages at
 * /archive/figures/?id=figure_id.
 *
 * A single template file serves all figures. This script reads the `id`
 * querystring parameter, looks up the figure in /data/detroit.json, and
 * renders the full figure page: header, justification, biography, five-
 * criteria evaluation, connections, geography, primary sources, related
 * figures.
 *
 * Query-based routing (same architecture as sources). Missing id redirects
 * to the figures landing; unknown id renders a not-found state.
 *
 * Runs only on the individual figure page template. Loads after scripts.js
 * and partials.js. Consumes window.getModalityConfig(), calculateBadmanScore(),
 * formatFigureType(), escapeHtml() from scripts.js.
 *
 * WCAG 2.2 Level AA compliant.
 */
(function () {
    'use strict';

    // ---------------------------------------------------------------------
    // Constants
    // ---------------------------------------------------------------------

    var DATA_URL = '/data/detroit.json';
    var FIGURES_LANDING = '/archive/figures/';
    var FIGURE_ROUTE_PREFIX = '/archive/figures/';
    var SOURCE_ROUTE_PREFIX = '/archive/sources/';

    var MODALITY_LABELS_FALLBACK = {
        detective: 'Detective',
        revolutionary: 'Revolutionary',
        superhero_villain: 'Superhero-Villain',
        gangsta_pimp: 'Gangsta-Pimp',
        folk_hero_outlaw: 'Folk Hero-Outlaw'
    };

    var CRITERIA = [
        { key: 'outlaw_relationship', label: 'Outlaw Relationship' },
        { key: 'community_authorization', label: 'Community Authorization' },
        { key: 'violence_as_language', label: 'Violence as Language' },
        { key: 'cultural_preservation', label: 'Cultural Preservation' },
        { key: 'hypermasculine_performance', label: 'Hypermasculine Performance' }
    ];

    // Edge type display labels (mirrors detroit.json edge_types, with
    // human-readable fallback for grouping headings)
    var EDGE_TYPE_LABELS = {
        META: 'Creator \u2192 Creation',
        P2C:  'Person \u2192 Creation',
        C2C:  'Creator \u2194 Creator',
        ORG:  'Organizational / Ideological',
        CC:   'Creation Continuity'
    };

    var TIER_LABELS = {
        1: 'Documented',
        2: 'Evidenced',
        3: 'Interpretive'
    };

    var RELATED_FIGURES_CAP = 8;

    // Thumbnail glyph map for primary sources (same as sources viewer)
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

    // ---------------------------------------------------------------------
    // DOM references
    // ---------------------------------------------------------------------

    var dom = {};

    function cacheDom() {
        dom.main = document.getElementById('bda-main-content');
        dom.header = document.querySelector('.bda-figure-header');
        dom.justification = document.getElementById('bda-figure-justification');
        dom.biography = document.getElementById('bda-figure-biography');
        dom.criteria = document.getElementById('bda-figure-criteria');
        dom.connections = document.getElementById('bda-figure-connections');
        dom.geography = document.getElementById('bda-figure-geography');
        dom.primarySources = document.getElementById('bda-figure-primary-sources');
        dom.related = document.getElementById('bda-figure-related');
    }

    // ---------------------------------------------------------------------
    // State
    // ---------------------------------------------------------------------

    var state = {
        figure: null,
        allFigures: [],
        allSources: [],
        figureById: {},
        sourceById: {}
    };

    // ---------------------------------------------------------------------
    // Helpers (escapeHtml + formatFigureType + calculateBadmanScore come
    // from scripts.js; defensive fallbacks in case of load order issues)
    // ---------------------------------------------------------------------

    function escapeHtmlLocal(s) {
        if (s === null || s === undefined) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    var esc = (typeof window.escapeHtml === 'function') ? window.escapeHtml : escapeHtmlLocal;

    function calcScore(scores) {
        if (typeof window.calculateBadmanScore === 'function') {
            try { return window.calculateBadmanScore(scores); } catch (e) { /* fall through */ }
        }
        if (!scores) return 0;
        var total = 0;
        CRITERIA.forEach(function (c) {
            var entry = scores[c.key];
            if (entry && typeof entry.score === 'number') total += entry.score;
        });
        return total;
    }

    function formatType(figure) {
        if (typeof window.formatFigureType === 'function') {
            try { return window.formatFigureType(figure.type, figure.meta_badman); } catch (e) { /* fall through */ }
        }
        if (figure.meta_badman === true) return 'Meta-Badman';
        if (!figure.type) return '';
        return figure.type.charAt(0).toUpperCase() + figure.type.slice(1);
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

    function eraString(figure) {
        var y = figure.years || {};
        var start = y.birth || y.active_start;
        var end = y.death || y.active_end;
        if (start && end) return start + ' \u2013 ' + end;
        if (start) return start + ' \u2013 present';
        return '';
    }

    function parseQuerystring() {
        var params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    function findFigure(id, figures) {
        for (var i = 0; i < figures.length; i++) {
            if (figures[i] && figures[i].id === id) return figures[i];
        }
        return null;
    }

    // ---------------------------------------------------------------------
    // Data loading
    // ---------------------------------------------------------------------

    function loadData() {
        if (typeof window.loadArchiveData === 'function') {
            return window.loadArchiveData(DATA_URL);
        }
        return fetch(DATA_URL).then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        });
    }

    function processData(data) {
        var figures = (data && Array.isArray(data.figures)) ? data.figures : [];
        state.allFigures = figures.filter(function (f) {
            return f && !f._placeholder && f.id && f.modality;
        });
        state.figureById = {};
        state.allFigures.forEach(function (f) { state.figureById[f.id] = f; });

        var sources = (data && Array.isArray(data.sources)) ? data.sources : [];
        state.allSources = sources.filter(function (s) {
            return s && !s._placeholder && s.id;
        });
        state.sourceById = {};
        state.allSources.forEach(function (s) { state.sourceById[s.id] = s; });
    }

    // ---------------------------------------------------------------------
    // Not-found
    // ---------------------------------------------------------------------

    function renderNotFound() {
        if (!dom.main) return;
        dom.main.innerHTML =
            '<div role="alert" class="bda-figure-not-found">' +
                '<h1>Figure not found</h1>' +
                '<p>The figure you\u2019re looking for doesn\u2019t exist in this archive. ' +
                    '<a href="' + esc(FIGURES_LANDING) + '">Browse all figures</a>.' +
                '</p>' +
            '</div>';
        try {
            document.title = 'Figure not found | Detroit Badman Archive';
        } catch (e) { /* ignore */ }
    }

    // ---------------------------------------------------------------------
    // Section: Header
    // ---------------------------------------------------------------------

    function renderHeader(figure) {
        if (!dom.header) return;

        var cfg = (typeof window.getModalityConfig === 'function')
            ? window.getModalityConfig(figure.modality)
            : null;
        var modalityLabel = getModalityLabel(figure.modality);
        var modalitySuffix = modalityToCssSuffix(figure.modality);
        var typeLabel = formatType(figure);
        var typeClass = figure.type === 'fictional' ? 'bda-type-fictional' : 'bda-type-real';
        var era = eraString(figure);
        var score = calcScore(figure.scores);

        var badges = '';
        badges +=
            '<span class="bda-figure-modality-badge bda-mm-' + esc(modalitySuffix) + '">' +
                '<span class="bda-filter-modality-marker bda-mm-' + esc(modalitySuffix) + '" aria-hidden="true"></span>' +
                esc(modalityLabel) +
            '</span>';
        badges +=
            '<span class="bda-figure-type-badge ' + typeClass + '">' + esc(typeLabel) + '</span>';
        if (figure.meta_badman) {
            badges += '<span class="bda-figure-meta-badge">Meta-Badman</span>';
        }

        var creatorLine = '';
        if (figure.type === 'fictional' && figure.biography && figure.biography.creator) {
            creatorLine =
                '<p class="bda-figure-creator">' +
                    '<strong>Created by:</strong> ' + esc(figure.biography.creator) +
                '</p>';
        }

        dom.header.innerHTML =
            '<div class="bda-figure-header-badges">' + badges + '</div>' +
            '<h1 class="bda-figure-name">' + esc(figure.name) + '</h1>' +
            (era ? '<p class="bda-figure-era">' + esc(era) + '</p>' : '') +
            '<p class="bda-figure-score">' +
                '<span class="bda-figure-score-label">Badman Score</span> ' +
                '<span class="bda-score-value">' + score + '</span>' +
                '<span class="bda-score-total"> / 25</span>' +
            '</p>' +
            creatorLine;

        try {
            document.title = figure.name + ' | Detroit Badman Archive';
        } catch (e) { /* ignore */ }
    }

    // ---------------------------------------------------------------------
    // Section: Justification (short thesis-level framing)
    // ---------------------------------------------------------------------

    function renderJustification(figure) {
        if (!dom.justification) return;
        // No explicit "justification" field in current schema — use the first
        // paragraph of biography.description as justification if distinct
        // framing is later added, this section can be rewired.
        var desc = (figure.biography && figure.biography.description) || '';
        if (!desc) {
            dom.justification.hidden = true;
            return;
        }
        // Take first sentence or up to ~300 characters
        var match = desc.match(/^[^.?!]+[.?!]/);
        var snippet = match ? match[0].trim() : desc;
        if (snippet.length > 300) snippet = snippet.substring(0, 297).trim() + '\u2026';

        dom.justification.innerHTML =
            '<h2 class="sr-only">Justification</h2>' +
            '<p class="bda-figure-justification-text">' + esc(snippet) + '</p>';
    }

    // ---------------------------------------------------------------------
    // Section: Biography (description + timeline)
    // ---------------------------------------------------------------------

    function renderBiography(figure) {
        if (!dom.biography) return;
        var bio = figure.biography || {};
        var desc = bio.description || '';
        var events = Array.isArray(bio.key_events) ? bio.key_events : [];

        var html = '<h2>Biography</h2>';

        if (desc) {
            html +=
                '<div class="bda-figure-biography-description">' +
                    '<p>' + esc(desc) + '</p>' +
                '</div>';
        }

        if (events.length > 0) {
            // Sort events by year ascending
            var sorted = events.slice().sort(function (a, b) {
                return (a.year || 0) - (b.year || 0);
            });
            html += '<div class="bda-figure-biography-timeline">';
            html += '<h3>Key events</h3>';
            html += '<ol class="bda-figure-timeline-list">';
            sorted.forEach(function (ev) {
                html +=
                    '<li class="bda-figure-timeline-item">' +
                        '<span class="bda-figure-timeline-year">' + esc(String(ev.year || '')) + '</span>' +
                        '<div class="bda-figure-timeline-body">' +
                            '<p class="bda-figure-timeline-event">' + esc(ev.event || '') + '</p>' +
                            (ev.location
                                ? '<p class="bda-figure-timeline-location">' + esc(ev.location) + '</p>'
                                : '') +
                        '</div>' +
                    '</li>';
            });
            html += '</ol>';
            html += '</div>';
        }

        dom.biography.innerHTML = html;
    }

    // ---------------------------------------------------------------------
    // Section: Five-criteria evaluation
    // ---------------------------------------------------------------------

    function renderCriteria(figure) {
        if (!dom.criteria) return;
        var scores = figure.scores || {};

        var html = '<h2>Five-Criteria Evaluation</h2>';
        html += '<dl class="bda-figure-criteria-list">';

        CRITERIA.forEach(function (c) {
            var entry = scores[c.key];
            if (!entry) return;
            var scoreVal = typeof entry.score === 'number' ? entry.score : 0;
            var justification = entry.justification || '';

            html +=
                '<div class="bda-figure-criterion">' +
                    '<dt class="bda-figure-criterion-header">' +
                        '<h3 class="bda-figure-criterion-name">' + esc(c.label) + '</h3>' +
                        '<span class="bda-figure-criterion-score">' + scoreVal + ' / 5</span>' +
                    '</dt>' +
                    '<dd class="bda-figure-criterion-body">' +
                        '<div class="bda-criterion-bar" role="progressbar" ' +
                             'aria-valuenow="' + scoreVal + '" aria-valuemin="0" aria-valuemax="5" ' +
                             'aria-label="' + esc(c.label) + ' score ' + scoreVal + ' out of 5">' +
                            '<div class="bda-criterion-bar-fill" style="--criterion-value: ' + scoreVal + ';"></div>' +
                        '</div>' +
                        (justification
                            ? '<p class="bda-figure-criterion-justification">' + esc(justification) + '</p>'
                            : '') +
                    '</dd>' +
                '</div>';
        });

        html += '</dl>';
        dom.criteria.innerHTML = html;
    }

    // ---------------------------------------------------------------------
    // Section: Connections (grouped by edge type)
    // ---------------------------------------------------------------------

    function renderConnections(figure) {
        if (!dom.connections) return;
        var connections = Array.isArray(figure.connections) ? figure.connections : [];

        var html = '<h2>Connections</h2>';

        if (connections.length === 0) {
            html += '<p class="bda-figure-connections-empty">No documented connections.</p>';
            dom.connections.innerHTML = html;
            return;
        }

        // Group by edge type
        var byType = {};
        connections.forEach(function (conn) {
            if (!conn.type) return;
            if (!byType[conn.type]) byType[conn.type] = [];
            byType[conn.type].push(conn);
        });

        // Stable order
        var typeOrder = ['META', 'P2C', 'C2C', 'ORG', 'CC'];
        typeOrder.forEach(function (t) {
            if (!byType[t] || byType[t].length === 0) return;

            var typeLabel = EDGE_TYPE_LABELS[t] || t;
            html += '<div class="bda-figure-connection-group">';
            html += '<h3 class="bda-figure-connection-type-heading">' +
                        '<span class="bda-edge-type-badge bda-edge-' + esc(t.toLowerCase()) + '">' + esc(t) + '</span> ' +
                        esc(typeLabel) +
                    '</h3>';
            html += '<ul class="bda-figure-connection-list">';

            byType[t].forEach(function (conn) {
                var target = state.figureById[conn.target_id];
                var targetName = target ? target.name : conn.target_id;
                var targetHref = FIGURE_ROUTE_PREFIX + '?id=' + encodeURIComponent(conn.target_id);
                var arrow = conn.direction === 'mutual' ? '\u2194' :
                            conn.direction === 'incoming' ? '\u2190' : '\u2192';
                var tierLabel = TIER_LABELS[conn.tier] || 'Unknown';

                var yearRange = '';
                if (conn.start_year && conn.end_year) {
                    yearRange = conn.start_year + '\u2013' + conn.end_year;
                } else if (conn.start_year) {
                    yearRange = conn.start_year + '\u2013present';
                }

                html +=
                    '<li class="bda-figure-connection-item">' +
                        '<div class="bda-figure-connection-header">' +
                            '<span class="bda-figure-connection-arrow" aria-hidden="true">' + arrow + '</span> ' +
                            (target
                                ? '<a href="' + esc(targetHref) + '" class="bda-figure-connection-link">' + esc(targetName) + '</a>'
                                : '<span>' + esc(targetName) + '</span>') +
                            ' <span class="bda-connection-tier bda-tier-' + conn.tier + '">' + esc(tierLabel) + '</span>' +
                            (yearRange ? ' <span class="bda-figure-connection-years">' + esc(yearRange) + '</span>' : '') +
                        '</div>' +
                        (conn.evidence
                            ? '<p class="bda-connection-evidence">' + esc(conn.evidence) + '</p>'
                            : '') +
                    '</li>';
            });

            html += '</ul>';
            html += '</div>';
        });

        dom.connections.innerHTML = html;
    }

    // ---------------------------------------------------------------------
    // Section: Geography
    // ---------------------------------------------------------------------

    function renderGeography(figure) {
        if (!dom.geography) return;
        var geo = figure.geographic;
        if (!geo) {
            dom.geography.hidden = true;
            return;
        }

        var html = '<h2>Geography</h2>';

        if (geo.primary_location) {
            html += '<div class="bda-figure-primary-location">';
            html += '<h3>Primary location</h3>';
            html += '<p class="bda-figure-location-name">' + esc(geo.primary_location.name || '') + '</p>';
            html += '</div>';
        }

        if (geo.territory && geo.territory.description) {
            html += '<div class="bda-figure-territory">';
            html += '<h3>Territory</h3>';
            html += '<p>' + esc(geo.territory.description) + '</p>';
            html += '</div>';
        }

        if (Array.isArray(geo.additional_locations) && geo.additional_locations.length > 0) {
            html += '<div class="bda-figure-additional-locations">';
            html += '<h3>Additional locations</h3>';
            html += '<ul class="bda-figure-additional-list">';
            geo.additional_locations.forEach(function (loc) {
                html +=
                    '<li class="bda-figure-additional-item">' +
                        '<p class="bda-figure-additional-name">' + esc(loc.name || '') + '</p>' +
                        (loc.significance
                            ? '<p class="bda-figure-additional-significance">' + esc(loc.significance) + '</p>'
                            : '') +
                    '</li>';
            });
            html += '</ul>';
            html += '</div>';
        }

        html +=
            '<p class="bda-figure-map-link">' +
                '<a href="/visualizations/map/">View on the interactive map</a>' +
            '</p>';

        dom.geography.innerHTML = html;
    }

    // ---------------------------------------------------------------------
    // Section: Primary sources
    // ---------------------------------------------------------------------

    function renderPrimarySources(figure) {
        if (!dom.primarySources) return;

        var sourceIds = Array.isArray(figure.source_ids) ? figure.source_ids : [];
        var primary = [];
        sourceIds.forEach(function (id) {
            var s = state.sourceById[id];
            if (s && s.category === 'primary') primary.push(s);
        });

        var html = '<h2>Primary Sources</h2>';

        if (primary.length === 0) {
            html += '<p class="bda-figure-sources-empty">No primary sources recorded for this figure.</p>';
            dom.primarySources.innerHTML = html;
            return;
        }

        html += '<ul class="bda-figure-primary-sources-grid">';
        primary.forEach(function (src) {
            var category = src.category || 'primary';
            var categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
            var glyph = TYPE_TO_GLYPH[src.type] || 'doc';
            var typeLabel = src.type
                ? src.type.split('_').map(function (p) { return p ? p.charAt(0).toUpperCase() + p.slice(1) : ''; }).join(' ')
                : '';
            var year = (src.year !== null && src.year !== undefined) ? src.year : '';
            var href = SOURCE_ROUTE_PREFIX + '?id=' + encodeURIComponent(src.id);
            var metaLine = (typeLabel && year !== '') ? typeLabel + ' \u00b7 ' + year
                         : typeLabel || (year !== '' ? String(year) : '');

            var ariaLabel = src.title || 'Untitled source';
            if (year !== '') ariaLabel += ' (' + year + ')';

            html +=
                '<li>' +
                    '<a class="bda-source-card" href="' + esc(href) + '" aria-label="' + esc(ariaLabel) + '">' +
                        '<div class="bda-source-card-thumb">' +
                            '<span class="bda-source-card-category bda-cat-' + esc(category) + '">' +
                                esc(categoryLabel) +
                            '</span>' +
                            '<div class="bda-source-thumb-glyph bda-thumb-' + esc(glyph) + '" aria-hidden="true"></div>' +
                        '</div>' +
                        '<div class="bda-source-card-info">' +
                            '<h3 class="bda-source-card-title">' + esc(src.title || 'Untitled source') + '</h3>' +
                            (metaLine ? '<p class="bda-source-card-meta">' + esc(metaLine) + '</p>' : '') +
                        '</div>' +
                    '</a>' +
                '</li>';
        });
        html += '</ul>';

        dom.primarySources.innerHTML = html;
    }

    // ---------------------------------------------------------------------
    // Section: Related figures
    // ---------------------------------------------------------------------

    function findRelatedFigures(figure) {
        // Direct connections first
        var connectedIds = {};
        if (Array.isArray(figure.connections)) {
            figure.connections.forEach(function (conn) {
                if (conn.target_id && conn.target_id !== figure.id) {
                    connectedIds[conn.target_id] = true;
                }
            });
        }

        // Reverse: other figures whose connections target this one
        state.allFigures.forEach(function (f) {
            if (f.id === figure.id) return;
            if (!Array.isArray(f.connections)) return;
            f.connections.forEach(function (conn) {
                if (conn.target_id === figure.id) connectedIds[f.id] = true;
            });
        });

        var related = Object.keys(connectedIds)
            .map(function (id) { return state.figureById[id]; })
            .filter(function (f) { return !!f; });

        // Sort same-modality first, then by badman score desc, then by name
        related.sort(function (a, b) {
            var aSame = a.modality === figure.modality ? 0 : 1;
            var bSame = b.modality === figure.modality ? 0 : 1;
            if (aSame !== bSame) return aSame - bSame;
            var scoreCmp = calcScore(b.scores) - calcScore(a.scores);
            if (scoreCmp !== 0) return scoreCmp;
            return String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' });
        });

        return related.slice(0, RELATED_FIGURES_CAP);
    }

    function renderRelated(figure) {
        if (!dom.related) return;
        var related = findRelatedFigures(figure);

        var html = '<h2>Related Figures</h2>';

        if (related.length === 0) {
            html += '<p class="bda-figure-related-empty">No related figures in this archive.</p>';
            dom.related.innerHTML = html;
            return;
        }

        html += '<ul class="bda-figure-related-grid">';
        related.forEach(function (f) {
            var cfg = (typeof window.getModalityConfig === 'function')
                ? window.getModalityConfig(f.modality) : null;
            var modalityLabel = getModalityLabel(f.modality);
            var modalitySuffix = modalityToCssSuffix(f.modality);
            var typeLabel = formatType(f);
            var typeClass = f.type === 'fictional' ? 'bda-type-fictional' : 'bda-type-real';
            var era = eraString(f);
            var score = calcScore(f.scores);
            var href = FIGURE_ROUTE_PREFIX + '?id=' + encodeURIComponent(f.id);

            var ariaParts = [f.name];
            if (typeLabel) ariaParts.push('\u2014 ' + typeLabel);
            if (era) ariaParts.push('(' + era + ')');
            ariaParts.push(', ' + modalityLabel + ' modality');
            var ariaLabel = ariaParts.join(' ');

            html +=
                '<li>' +
                    '<a class="bda-figure-card" href="' + esc(href) + '" aria-label="' + esc(ariaLabel) + '">' +
                        '<div class="bda-figure-card-thumb">' +
                            '<span class="bda-figure-card-type-badge ' + typeClass + '">' + esc(typeLabel) + '</span>' +
                            '<span class="bda-filter-modality-marker bda-mm-' + esc(modalitySuffix) + '" aria-hidden="true"></span>' +
                            (f.meta_badman ? '<span class="bda-figure-card-meta-badge">Meta-Badman</span>' : '') +
                        '</div>' +
                        '<div class="bda-figure-card-info">' +
                            '<h3 class="bda-figure-card-title">' + esc(f.name) + '</h3>' +
                            (era ? '<p class="bda-figure-card-era">' + esc(era) + '</p>' : '') +
                            '<p class="bda-figure-card-score">' +
                                '<span class="bda-score-value">' + score + '</span>' +
                                '<span class="bda-score-total"> / 25</span>' +
                            '</p>' +
                        '</div>' +
                    '</a>' +
                '</li>';
        });
        html += '</ul>';

        dom.related.innerHTML = html;
    }

    // ---------------------------------------------------------------------
    // Render all
    // ---------------------------------------------------------------------

    function renderAll(figure) {
        renderHeader(figure);
        renderJustification(figure);
        renderBiography(figure);
        renderCriteria(figure);
        renderConnections(figure);
        renderGeography(figure);
        renderPrimarySources(figure);
        renderRelated(figure);
    }

    // ---------------------------------------------------------------------
    // Init
    // ---------------------------------------------------------------------

    function init() {
        cacheDom();

        var id = parseQuerystring();

        // Missing querystring → redirect to landing (no history pollution)
        if (!id) {
            window.location.replace(FIGURES_LANDING);
            return;
        }

        if (!dom.main) return;

        loadData().then(function (data) {
            if (!data) {
                renderNotFound();
                return;
            }
            processData(data);
            state.figure = findFigure(id, state.allFigures);
            if (!state.figure) {
                renderNotFound();
                return;
            }
            renderAll(state.figure);
        }).catch(function (err) {
            if (window.console && console.error) {
                console.error('bda-figures-viewer.js: failed to load data', err);
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
