/**
 * Detroit Badman Archive — Individual Figure Page
 *
 * Renders a single figure page at /archive/figures/?id=[figure_id].
 * One template file serves every figure.
 *
 * Runs ONLY on the individual figure page template — do not include on any other page.
 *
 * Authority boundaries:
 *   - Does NOT render site chrome (navbar, footer, credentialing rail).
 *   - Does NOT build the "On this page" TOC (partial loader owns that).
 *   - DOES ensure <h2> sections have stable IDs matching the TOC contract.
 *   - DOES add scroll-spy highlighting to the TOC the partial loader builds.
 *   - Consumes getModalityConfig() and calculateBadmanScore() from scripts.js.
 *
 * Style rule: no inline styles, no hardcoded hex values. The ONE exception
 * is CSS custom property declarations used as values (--criterion-value)
 * per the style rule in CSS_DOCUMENTATION.md.
 *
 * Waits for both DOMContentLoaded AND bda:partials-loaded before initializing,
 * with a 2-second timeout fallback if the partial loader never fires.
 *
 * See BDA_FIGURE_PAGE_JS.md for the full specification.
 */

(function () {
    'use strict';

    // ============================================
    // Constants
    // ============================================

    var DATA_URL = '/data/detroit.json';

    var FIGURE_ROUTE_PREFIX = '/archive/figures/';
    var SOURCE_ROUTE_PREFIX = '/archive/sources/';
    var MAP_ROUTE = '/visualizations/map/';
    var SOURCES_LANDING = '/archive/sources/';

    var EDGE_TYPE_ORDER = ['META', 'P2C', 'C2C', 'ORG', 'CC'];

    var EDGE_TYPE_CLASS = {
        META: 'bda-edge-meta',
        P2C:  'bda-edge-p2c',
        C2C:  'bda-edge-c2c',
        ORG:  'bda-edge-org',
        CC:   'bda-edge-cc'
    };

    var DIRECTION_GLYPH = {
        outgoing: '→',
        incoming: '←',
        mutual:   '↔'
    };

    var DIRECTION_LABEL = {
        outgoing: 'Outgoing connection to',
        incoming: 'Incoming connection from',
        mutual:   'Mutual connection with'
    };

    var TIER_LABEL = {
        1: 'Documented',
        2: 'Evidenced',
        3: 'Interpretive'
    };

    var TYPE_LABELS = {
        real: 'Real',
        fictional: 'Fictional'
    };

    var MEDIUM_LABELS = {
        print: 'Print',
        film: 'Film',
        television: 'Television',
        music: 'Music',
        comics: 'Comics'
    };

    var MODALITY_LABELS_FALLBACK = {
        detective: 'Detective',
        revolutionary: 'Revolutionary',
        superhero_villain: 'Superhero-Villain',
        gangsta_pimp: 'Gangsta-Pimp',
        folk_hero_outlaw: 'Folk Hero-Outlaw'
    };

    var BIO_TRUNCATE_WORDS = 200;

    var PARTIALS_TIMEOUT_MS = 2000;

    // ============================================
    // Module state
    // ============================================

    var initialized = false;
    var partialsLoaded = false;
    var domReady = false;

    var data = null;
    var figure = null;

    // ============================================
    // Helpers
    // TODO: consolidate with bda-figures.js and move to scripts.js
    // ============================================

    function escapeHtml(s) {
        if (s == null) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function lastName(fullName) {
        if (!fullName) return '';
        var primary = String(fullName).split('/')[0].trim();
        var tokens = primary.split(/\s+/);
        if (tokens.length === 1) return tokens[0];

        var SUFFIXES = /^(jr|sr|ii|iii|iv|v|esq)\.?$/i;
        while (tokens.length > 1 && SUFFIXES.test(tokens[tokens.length - 1])) {
            tokens.pop();
        }
        return tokens[tokens.length - 1];
    }

    function parseQuerystring() {
        var params = new URLSearchParams(window.location.search);
        var obj = {};
        params.forEach(function (v, k) { obj[k] = v; });
        return obj;
    }

    function getModalityLabel(modality) {
        if (typeof window.getModalityConfig === 'function') {
            try {
                var cfg = window.getModalityConfig(modality);
                if (cfg && cfg.displayLabel) return cfg.displayLabel;
            } catch (e) { /* fall through */ }
        }
        return MODALITY_LABELS_FALLBACK[modality] || modality;
    }

    function getModalityConfigSafe(modality) {
        if (typeof window.getModalityConfig === 'function') {
            try { return window.getModalityConfig(modality); }
            catch (e) { /* fall through */ }
        }
        return null;
    }

    function modalityShapeClass(modality) {
        // Returns the .bda-mm-* class name with hyphen separators.
        if (modality === 'superhero_villain') return 'bda-mm-superhero-villain';
        if (modality === 'gangsta_pimp')      return 'bda-mm-gangsta-pimp';
        if (modality === 'folk_hero_outlaw')  return 'bda-mm-folk-hero-outlaw';
        return 'bda-mm-' + modality.replace(/_/g, '-');
    }

    function getScore(fig) {
        if (typeof window.calculateBadmanScore === 'function') {
            try { return window.calculateBadmanScore(fig.scores); }
            catch (e) { /* fall through */ }
        }
        var s = fig.scores || {};
        return (s.outlaw_relationship && s.outlaw_relationship.score || 0) +
               (s.community_authorization && s.community_authorization.score || 0) +
               (s.violence_as_language && s.violence_as_language.score || 0) +
               (s.cultural_preservation && s.cultural_preservation.score || 0) +
               (s.hypermasculine_performance && s.hypermasculine_performance.score || 0);
    }

    function buildEraLabel(fig) {
        var y = fig.years || {};
        if (fig.type === 'real') {
            if (y.birth != null) {
                return y.birth + '–' + (y.death != null ? y.death : 'present');
            }
            return 'Active ' + y.active_start + '–' + y.active_end;
        }
        var medium = MEDIUM_LABELS[fig.medium] || fig.medium || '';
        var range = (y.active_start === y.active_end)
            ? String(y.active_start)
            : y.active_start + '–' + y.active_end;
        return medium ? range + ' (' + medium + ')' : range;
    }

    function truncateWords(text, n) {
        if (!text) return '';
        var words = String(text).split(/\s+/);
        if (words.length <= n) return { short: text, rest: '' };
        return {
            short: words.slice(0, n).join(' ') + '…',
            rest:  words.slice(n).join(' ')
        };
    }

    function formatAccessDate(d) {
        var months = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
        return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
    }

    // ============================================
    // Initialization gate — wait for DOM + partials
    // ============================================

    function tryInit() {
        if (!partialsLoaded || !domReady || initialized) return;
        initialized = true;
        init();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            domReady = true;
            tryInit();
        });
    } else {
        domReady = true;
    }

    document.addEventListener('bda:partials-loaded', function () {
        partialsLoaded = true;
        tryInit();
    });

    setTimeout(function () {
        if (!partialsLoaded) {
            console.warn('bda-figure-page.js: bda:partials-loaded did not fire; initializing without TOC scroll-spy');
            partialsLoaded = true;
            tryInit();
        }
    }, PARTIALS_TIMEOUT_MS);

    // ============================================
    // init()
    // ============================================

    function init() {
        var qs = parseQuerystring();
        var figureId = qs.id;

        if (!figureId) {
            window.location.replace(FIGURE_ROUTE_PREFIX);
            return;
        }

        fetch(DATA_URL)
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(function (d) {
                data = d;
                figure = (data.figures || []).find(function (f) {
                    return f.id === figureId && !f._placeholder;
                });

                if (!figure) {
                    renderNotFound(figureId);
                    return;
                }

                document.title = figure.name + ' | Detroit Badman Archive';

                renderHeader();
                renderJustificationEssay();
                renderBiography();
                renderCriteria();
                renderConnections();
                renderGeography();
                renderPrimarySources();
                renderRelatedFigures();
                renderCitationBlock();
                bindEvents();
                attachScrollSpy();
            })
            .catch(function (err) {
                console.error('bda-figure-page.js: failed to load data', err);
                renderLoadError();
            });
    }

    // ============================================
    // Error states
    // ============================================

    function renderNotFound(id) {
        var main = document.getElementById('main-content');
        if (!main) return;
        main.innerHTML =
            '<div role="alert" class="bda-figure-not-found">' +
                '<h1>Figure not found</h1>' +
                '<p>The figure you\'re looking for (' + escapeHtml(id) + ') doesn\'t exist in this archive. ' +
                '<a href="' + FIGURE_ROUTE_PREFIX + '">Browse all figures</a>.</p>' +
            '</div>';
    }

    function renderLoadError() {
        var main = document.getElementById('main-content');
        if (!main) return;
        main.innerHTML =
            '<div role="alert" class="bda-figure-not-found">' +
                '<h1>Could not load figure</h1>' +
                '<p>There was a problem loading the archive data. Please try again. ' +
                '<a href="' + FIGURE_ROUTE_PREFIX + '">Browse all figures</a>.</p>' +
            '</div>';
    }

    // ============================================
    // Header
    // ============================================

    function renderHeader() {
        var el = document.getElementById('figure-header');
        if (!el) return;

        var shapeClass = modalityShapeClass(figure.modality);
        var modalityLabel = getModalityLabel(figure.modality);
        var typeLabel = TYPE_LABELS[figure.type] || figure.type;
        var typeBadgeClass = 'bda-type-' + figure.type;
        var score = getScore(figure);
        var eraLabel = buildEraLabel(figure);

        var metaBadge = figure.meta_badman
            ? '<span class="bda-figure-meta-badge" aria-hidden="true">Meta-Badman</span>'
            : '';

        var creatorLine = '';
        if (figure.type === 'fictional') {
            var parts = [];
            if (figure.creator_id) {
                var creator = (data.figures || []).find(function (f) { return f.id === figure.creator_id; });
                if (creator) {
                    parts.push('Created by <a href="' + FIGURE_ROUTE_PREFIX + '?id=' +
                        encodeURIComponent(creator.id) + '">' + escapeHtml(creator.name) + '</a>');
                } else if (figure.biography && figure.biography.creator) {
                    parts.push('Created by ' + escapeHtml(figure.biography.creator));
                }
            } else if (figure.biography && figure.biography.creator) {
                parts.push('Created by ' + escapeHtml(figure.biography.creator));
            }
            if (figure.biography && figure.biography.source_text) {
                parts.push('appeared in <em>' + escapeHtml(figure.biography.source_text) + '</em>');
            }
            if (parts.length > 0) {
                creatorLine = '<p class="bda-figure-creator">' + parts.join(', ') + '</p>';
            }
        }

        el.innerHTML =
            '<div class="bda-figure-header-badges">' +
                '<span class="bda-figure-modality-badge">' +
                    '<span class="bda-filter-modality-marker ' + shapeClass + '" aria-hidden="true"></span>' +
                    escapeHtml(modalityLabel) +
                '</span>' +
                '<span class="bda-figure-type-badge ' + typeBadgeClass + '">' + escapeHtml(typeLabel) + '</span>' +
                metaBadge +
            '</div>' +
            '<h1 class="bda-figure-name">' + escapeHtml(figure.name) + '</h1>' +
            '<p class="bda-figure-era">' + escapeHtml(eraLabel) + '</p>' +
            '<p class="bda-figure-score" aria-label="Badman score: ' + score + ' out of 25">' +
                'Badman Score: <span class="bda-score-value">' + score + '</span>' +
                '<span class="bda-score-total">/25</span>' +
            '</p>' +
            creatorLine;
    }

    // ============================================
    // Justification essay (placeholder fallback)
    // ============================================

    function renderJustificationEssay() {
        var section = document.getElementById('justification');
        if (!section) return;
        // Preserve the <h2> heading; replace content after it.
        var heading = section.querySelector('h2');
        var headingHtml = heading ? heading.outerHTML : '<h2 id="bda-h-justification">Why This Figure</h2>';

        section.innerHTML = headingHtml +
            '<article class="essay bda-figure-justification">' +
                '<p class="bda-figure-justification-placeholder">' +
                    'Justification essay pending. ' +
                    'Contact the Project Director for the full scholarly argument for this figure\'s inclusion.' +
                '</p>' +
            '</article>';
    }

    // ============================================
    // Biography
    // ============================================

    function renderBiography() {
        var section = document.getElementById('biography');
        if (!section) return;
        var heading = section.querySelector('h2');
        var headingHtml = heading ? heading.outerHTML : '<h2 id="bda-h-biography">Biography</h2>';

        var bio = figure.biography || {};
        var description = bio.description || '';
        var split = truncateWords(description, BIO_TRUNCATE_WORDS);

        var descHtml;
        if (split.rest) {
            descHtml =
                '<div class="bda-figure-biography-description">' +
                    '<p>' + escapeHtml(split.short) + '</p>' +
                    '<a href="#" class="read-more-toggle" ' +
                       'aria-label="Read more about ' + escapeHtml(figure.name) + '">Read more</a>' +
                    '<div class="bda-figure-biography-description-rest" hidden>' +
                        '<p>' + escapeHtml(split.rest) + '</p>' +
                    '</div>' +
                '</div>';
        } else {
            descHtml =
                '<div class="bda-figure-biography-description">' +
                    '<p>' + escapeHtml(description) + '</p>' +
                '</div>';
        }

        var eventsHtml = '';
        if (bio.key_events && bio.key_events.length > 0) {
            var items = bio.key_events.map(function (ev) {
                var locHtml = ev.location
                    ? '<p class="bda-figure-timeline-location">' + escapeHtml(ev.location) + '</p>'
                    : '';
                return (
                    '<li class="bda-figure-timeline-event">' +
                        '<span class="bda-figure-timeline-year">' + escapeHtml(String(ev.year)) + '</span>' +
                        '<div class="bda-figure-timeline-content">' +
                            '<p>' + escapeHtml(ev.event) + '</p>' +
                            locHtml +
                        '</div>' +
                    '</li>'
                );
            }).join('');
            eventsHtml =
                '<div class="bda-figure-biography-timeline">' +
                    '<h3>Key Events</h3>' +
                    '<ol class="bda-figure-timeline-list">' + items + '</ol>' +
                '</div>';
        }

        var adaptationsHtml = '';
        if (figure.adaptations && figure.adaptations.length > 0) {
            var adaptItems = figure.adaptations.map(function (a) {
                var medium = MEDIUM_LABELS[a.medium] || a.medium;
                return '<li><strong>' + escapeHtml(medium) + ' (' + escapeHtml(String(a.year)) + '):</strong> ' +
                    '<em>' + escapeHtml(a.title) + '</em></li>';
            }).join('');
            adaptationsHtml =
                '<div class="bda-figure-biography-adaptations">' +
                    '<h3>Adaptations</h3>' +
                    '<ul>' + adaptItems + '</ul>' +
                '</div>';
        }

        var creditsHtml = '';
        if (figure.type === 'fictional' && (bio.creator || bio.source_text)) {
            var lines = [];
            if (bio.creator)     lines.push('<strong>Creator:</strong> ' + escapeHtml(bio.creator));
            if (bio.source_text) lines.push('<strong>Source text:</strong> ' + escapeHtml(bio.source_text));
            creditsHtml = '<p class="bda-figure-biography-credits">' + lines.join('<br>') + '</p>';
        }

        section.innerHTML = headingHtml +
            '<div class="bda-figure-biography">' +
                descHtml +
                eventsHtml +
            '</div>' +
            adaptationsHtml +
            creditsHtml;
    }

    // ============================================
    // Five-criteria evaluation
    // ============================================

    function renderCriteria() {
        var section = document.getElementById('evaluation');
        if (!section) return;
        var heading = section.querySelector('h2');
        var headingHtml = heading ? heading.outerHTML : '<h2 id="bda-h-evaluation">Five-Criteria Evaluation</h2>';

        var scores = figure.scores || {};
        var total = getScore(figure);

        var criteria = [
            { key: 'outlaw_relationship',       label: 'Outlaw Relationship to Law' },
            { key: 'community_authorization',   label: 'Community Authorization' },
            { key: 'violence_as_language',      label: 'Violence as Language' },
            { key: 'cultural_preservation',     label: 'Cultural Preservation' },
            { key: 'hypermasculine_performance', label: 'Hypermasculine Performance' }
        ];

        var reviewNotice = '';
        if (scores._REVIEW_NEEDED) {
            reviewNotice =
                '<div class="bda-figure-criteria-review-notice" role="note">' +
                    '<p><strong>Review note:</strong> ' + escapeHtml(scores._REVIEW_NEEDED) + '</p>' +
                '</div>';
        }

        var rows = criteria.map(function (c) {
            var entry = scores[c.key] || {};
            var score = entry.score != null ? entry.score : 0;
            var justification = entry.justification || 'No justification provided.';

            return (
                '<div class="bda-figure-criterion">' +
                    '<dt>' +
                        '<span class="bda-criterion-name">' + escapeHtml(c.label) + '</span>' +
                        '<span class="bda-criterion-score" aria-label="Score: ' + score + ' out of 5">' +
                            score + '/5' +
                        '</span>' +
                    '</dt>' +
                    '<dd>' +
                        '<div class="bda-criterion-bar" aria-hidden="true">' +
                            '<div class="bda-criterion-bar-fill" style="--criterion-value: ' + score + ';"></div>' +
                        '</div>' +
                        '<details class="bda-criterion-details">' +
                            '<summary>Show justification</summary>' +
                            '<p>' + escapeHtml(justification) + '</p>' +
                        '</details>' +
                    '</dd>' +
                '</div>'
            );
        }).join('');

        section.innerHTML = headingHtml + reviewNotice +
            '<dl class="bda-figure-criteria">' +
                rows +
                '<div class="bda-figure-criterion-total">' +
                    '<dt>Total Badman Score</dt>' +
                    '<dd><strong>' + total + '/25</strong></dd>' +
                '</div>' +
            '</dl>';
    }

    // ============================================
    // Connections
    // ============================================

    function renderConnections() {
        var section = document.getElementById('connections');
        if (!section) return;
        var heading = section.querySelector('h2');
        var headingHtml = heading ? heading.outerHTML : '<h2 id="bda-h-connections">Connections</h2>';

        var connections = figure.connections || [];

        if (connections.length === 0) {
            section.innerHTML = headingHtml +
                '<p class="bda-figure-related-empty">No connections cataloged yet for this figure.</p>';
            return;
        }

        // Bucket by edge type
        var buckets = {};
        connections.forEach(function (conn) {
            var t = conn.type;
            if (!buckets[t]) buckets[t] = [];
            buckets[t].push(conn);
        });

        // Edge type labels from data.edge_types if available
        var edgeTypes = (data && data.edge_types) || {};

        var groupsHtml = EDGE_TYPE_ORDER.map(function (type) {
            var group = buckets[type];
            if (!group || group.length === 0) return '';

            var edgeLabel = (edgeTypes[type] && edgeTypes[type].label) || type;
            var edgeClass = EDGE_TYPE_CLASS[type] || 'bda-edge-meta';

            var itemsHtml = group.map(function (conn) {
                return renderConnectionItem(conn);
            }).join('');

            return (
                '<div class="bda-connection-group" data-edge-type="' + escapeHtml(type) + '">' +
                    '<h3 class="bda-connection-group-heading">' +
                        '<span class="bda-edge-legend-marker ' + edgeClass + '" aria-hidden="true"></span>' +
                        escapeHtml(edgeLabel) +
                        ' <span class="bda-connection-group-count">(' + group.length + ')</span>' +
                    '</h3>' +
                    '<ul class="bda-connection-list">' + itemsHtml + '</ul>' +
                '</div>'
            );
        }).join('');

        section.innerHTML = headingHtml +
            '<div class="bda-figure-connections">' + groupsHtml + '</div>';
    }

    function renderConnectionItem(conn) {
        var target = (data.figures || []).find(function (f) { return f.id === conn.target_id; });
        var direction = conn.direction || 'outgoing';
        var glyph = DIRECTION_GLYPH[direction] || '→';
        var dirLabel = DIRECTION_LABEL[direction] || 'Connection to';
        var tier = conn.tier || 1;
        var tierLabel = TIER_LABEL[tier] || 'Documented';

        var nameHtml, targetNameForAria;
        var danglingClass = '';
        if (target) {
            targetNameForAria = target.name;
            nameHtml = '<a href="' + FIGURE_ROUTE_PREFIX + '?id=' + encodeURIComponent(target.id) + '"' +
                       ' class="bda-connection-name">' + escapeHtml(target.name) + '</a>';
        } else {
            targetNameForAria = conn.target_id;
            danglingClass = ' bda-connection-dangling';
            nameHtml = '<span class="bda-connection-name bda-connection-name-missing">' +
                       '[Figure not in archive: ' + escapeHtml(conn.target_id) + ']</span>';
        }

        var ariaLabel = dirLabel + ' ' + targetNameForAria + ', tier ' + tier + ' ' + tierLabel.toLowerCase();

        var evidenceHtml = '';
        if (conn.evidence) {
            evidenceHtml = '<p class="bda-connection-evidence">' + escapeHtml(conn.evidence) + '</p>';
        }

        return (
            '<li class="bda-connection-item' + danglingClass + '" aria-label="' + escapeHtml(ariaLabel) + '">' +
                '<span class="bda-connection-direction" aria-hidden="true">' + glyph + '</span>' +
                nameHtml +
                '<span class="bda-connection-tier bda-tier-' + tier + '" aria-label="Tier ' + tier + ': ' + escapeHtml(tierLabel) + '">' +
                    escapeHtml(tierLabel) +
                '</span>' +
                evidenceHtml +
            '</li>'
        );
    }

    // ============================================
    // Geography (Leaflet map preview)
    // ============================================

    function renderGeography() {
        var section = document.getElementById('geography');
        if (!section) return;
        var heading = section.querySelector('h2');
        var headingHtml = heading ? heading.outerHTML : '<h2 id="bda-h-geography">Geography</h2>';

        var geo = figure.geographic;
        if (!geo || !geo.primary_location || !geo.primary_location.coordinates) {
            section.innerHTML = headingHtml +
                '<p class="bda-figure-related-empty">No geographic data cataloged yet for this figure.</p>';
            return;
        }

        var primary = geo.primary_location;
        var territory = geo.territory || {};
        var additional = geo.additional_locations || [];

        var additionalHtml = '';
        if (additional.length > 0) {
            var items = additional.map(function (loc) {
                return '<li><strong>' + escapeHtml(loc.name) + ':</strong> ' +
                    escapeHtml(loc.significance || '') + '</li>';
            }).join('');
            additionalHtml =
                '<div class="bda-figure-geography-additional">' +
                    '<h3>Additional Locations</h3>' +
                    '<ul>' + items + '</ul>' +
                '</div>';
        }

        var territoryHtml = '';
        if (territory.description) {
            territoryHtml =
                '<div class="bda-figure-geography-territory">' +
                    '<h3>Territory</h3>' +
                    '<p>' + escapeHtml(territory.description) + '</p>' +
                '</div>';
        }

        section.innerHTML = headingHtml +
            '<div class="bda-figure-geography">' +
                '<div id="bda-figure-map-preview" role="img" ' +
                    'aria-label="Map showing ' + escapeHtml(figure.name) + '\'s primary location and territory in Detroit"></div>' +
                '<div class="bda-figure-geography-meta">' +
                    '<p class="bda-figure-geography-primary">' +
                        '<strong>Primary location:</strong> ' + escapeHtml(primary.name) +
                    '</p>' +
                    territoryHtml +
                    additionalHtml +
                    '<p class="bda-figure-geography-view-full">' +
                        '<a href="' + MAP_ROUTE + '?focus=' + encodeURIComponent(figure.id) + '">' +
                            'View on the full archive map' +
                            '<span class="sr-only"> (opens the full map page)</span>' +
                        '</a>' +
                    '</p>' +
                '</div>' +
            '</div>';

        initMapPreview();
    }

    function initMapPreview() {
        if (typeof L === 'undefined') {
            console.warn('bda-figure-page.js: Leaflet not loaded; map preview skipped');
            return;
        }
        var coords = figure.geographic.primary_location.coordinates;
        var territory = figure.geographic.territory || {};
        var additional = figure.geographic.additional_locations || [];
        var config = getModalityConfigSafe(figure.modality);
        var color = (config && config.color) || '#50c878';

        var map = L.map('bda-figure-map-preview', {
            zoomControl: true,
            scrollWheelZoom: false
        }).setView([coords.lat, coords.lng], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        L.marker([coords.lat, coords.lng], {
            alt: figure.name + ' — ' + figure.modality + ' modality'
        }).addTo(map);

        if (territory.polygon && territory.polygon.length >= 3) {
            L.polygon(territory.polygon, {
                color: color,
                fillColor: color,
                fillOpacity: 0.2
            }).addTo(map);
        }

        additional.forEach(function (loc) {
            if (!loc.coordinates) return;
            L.circleMarker([loc.coordinates.lat, loc.coordinates.lng], {
                radius: 6,
                color: color,
                fillColor: color,
                fillOpacity: 0.5
            })
            .bindPopup('<strong>' + escapeHtml(loc.name) + '</strong><br>' + escapeHtml(loc.significance || ''))
            .addTo(map);
        });
    }

    // ============================================
    // Primary sources
    // ============================================

    function renderPrimarySources() {
        var section = document.getElementById('primary-sources');
        if (!section) return;
        var heading = section.querySelector('h2');
        var headingHtml = heading ? heading.outerHTML : '<h2 id="bda-h-primary-sources">Primary Sources</h2>';

        var allSources = (data && data.sources) || [];
        var primary = allSources.filter(function (s) {
            return (s.figure_ids || []).indexOf(figure.id) !== -1 &&
                   s.category === 'primary';
        });

        if (primary.length === 0) {
            section.innerHTML = headingHtml +
                '<div class="bda-figure-primary-sources">' +
                    '<p class="bda-figure-primary-sources-empty">' +
                        'No primary sources cataloged yet for this figure. ' +
                        '<a href="/engagement/submit/">Suggest a source</a>.' +
                    '</p>' +
                '</div>';
            return;
        }

        var cardsHtml = primary.map(renderSourceCard).join('');

        section.innerHTML = headingHtml +
            '<div class="bda-figure-primary-sources">' +
                '<ul class="bda-source-grid bda-sources-grid">' + cardsHtml + '</ul>' +
                '<p class="bda-figure-all-sources-link">' +
                    '<a href="' + SOURCES_LANDING + '?f=' + encodeURIComponent(figure.id) + '">' +
                        'View all sources for ' + escapeHtml(figure.name) +
                        ' (primary, secondary, and archival)' +
                    '</a>' +
                '</p>' +
            '</div>';
    }

    function renderSourceCard(source) {
        // Shared card pattern with bda-sources.js.
        // TODO: consolidate to scripts.js when bda-sources.js is implemented.
        var category = source.category || 'primary';
        var categoryClass = 'bda-cat-' + category;
        var categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);

        var thumbClass = thumbClassForType(source.type);
        var meta = [];
        if (source.year)   meta.push(escapeHtml(String(source.year)));
        if (source.author) meta.push(escapeHtml(source.author));

        var ariaLabel = source.title +
            (source.year   ? ', ' + source.year   : '') +
            (source.author ? ', by ' + source.author : '') +
            ', ' + categoryLabel + ' source';

        return (
            '<li>' +
                '<a class="bda-source-card" href="' + SOURCE_ROUTE_PREFIX + '?id=' + encodeURIComponent(source.id) + '"' +
                   ' aria-label="' + escapeHtml(ariaLabel) + '">' +
                    '<div class="bda-source-card-thumb">' +
                        '<span class="bda-source-card-category ' + categoryClass + '">' +
                            escapeHtml(categoryLabel) +
                        '</span>' +
                        '<span class="bda-source-thumb-glyph ' + thumbClass + '" aria-hidden="true"></span>' +
                    '</div>' +
                    '<div class="bda-source-card-info">' +
                        '<h3 class="bda-source-card-title">' + escapeHtml(source.title) + '</h3>' +
                        (meta.length > 0
                            ? '<p class="bda-source-card-meta">' + meta.join(' · ') + '</p>'
                            : '') +
                    '</div>' +
                '</a>' +
            '</li>'
        );
    }

    function thumbClassForType(type) {
        // Maps source type to thumbnail glyph class defined in styles.css.
        var t = (type || '').toLowerCase();
        if (t.indexOf('novel') !== -1 || t.indexOf('book') !== -1 || t === 'biography' || t === 'academic') return 'bda-thumb-book';
        if (t.indexOf('news') !== -1 || t === 'newspaper' || t === 'obituary') return 'bda-thumb-news';
        if (t === 'photo' || t === 'artwork' || t === 'image') return 'bda-thumb-photo';
        if (t === 'audio_recording' || t === 'podcast' || t === 'interview') return 'bda-thumb-audio';
        if (t === 'film' || t === 'television' || t === 'video' || t === 'documentary') return 'bda-thumb-film';
        return 'bda-thumb-doc';
    }

    // ============================================
    // Related figures
    // ============================================

    function renderRelatedFigures() {
        var section = document.getElementById('related-figures');
        if (!section) return;
        var heading = section.querySelector('h2');
        var headingHtml = heading ? heading.outerHTML : '<h2 id="bda-h-related-figures">Related Figures</h2>';

        var connections = figure.connections || [];
        var seen = new Set();
        var related = [];

        connections.forEach(function (conn) {
            if (seen.has(conn.target_id)) return;
            seen.add(conn.target_id);
            var target = (data.figures || []).find(function (f) { return f.id === conn.target_id; });
            if (target && !target._placeholder) related.push(target);
        });

        if (related.length === 0) {
            section.innerHTML = headingHtml +
                '<p class="bda-figure-related-empty">No connections cataloged yet for this figure.</p>';
            return;
        }

        related.sort(function (a, b) {
            var cmp = a.modality.localeCompare(b.modality);
            if (cmp !== 0) return cmp;
            return lastName(a.name).localeCompare(lastName(b.name));
        });

        var itemsHtml = related.map(function (f) {
            var shapeClass = modalityShapeClass(f.modality);
            var modalityLabel = getModalityLabel(f.modality);
            var typeLabel = TYPE_LABELS[f.type] || f.type;
            var score = getScore(f);
            var ariaLabel = f.name + ', ' + modalityLabel + ', ' + typeLabel + ', badman score ' + score + ' out of 25';

            return (
                '<li>' +
                    '<a class="bda-figure-related-card" href="' + FIGURE_ROUTE_PREFIX + '?id=' + encodeURIComponent(f.id) + '"' +
                       ' aria-label="' + escapeHtml(ariaLabel) + '">' +
                        '<span class="bda-filter-modality-marker ' + shapeClass + '" aria-hidden="true"></span>' +
                        '<span class="bda-figure-related-card-name">' + escapeHtml(f.name) + '</span>' +
                        '<span class="bda-figure-related-card-score">' + score + '/25</span>' +
                    '</a>' +
                '</li>'
            );
        }).join('');

        section.innerHTML = headingHtml +
            '<ul class="bda-figure-related-grid">' + itemsHtml + '</ul>';
    }

    // ============================================
    // Citation block
    // ============================================

    function renderCitationBlock() {
        var section = document.getElementById('citation');
        if (!section) return;
        var heading = section.querySelector('h2');
        var headingHtml = heading ? heading.outerHTML : '<h2 id="bda-h-citation">Cite This Entry</h2>';

        section.innerHTML = headingHtml +
            '<div class="bda-citation-block">' +
                '<fieldset class="bda-citation-format-group">' +
                    '<legend>Citation format</legend>' +
                    '<label><input type="radio" name="citation-format" value="chicago" checked> Chicago</label> ' +
                    '<label><input type="radio" name="citation-format" value="mla"> MLA</label> ' +
                    '<label><input type="radio" name="citation-format" value="apa"> APA</label>' +
                '</fieldset>' +
                '<p id="bda-citation-text" class="bda-citation-text"></p>' +
                '<button type="button" id="bda-citation-copy-btn" class="btn-primary bda-citation-copy-btn">' +
                    'Copy citation' +
                '</button>' +
                '<span id="bda-citation-copy-status" class="sr-only" role="status" aria-live="polite"></span>' +
            '</div>';

        updateCitationText('chicago');
    }

    function buildCitation(format) {
        var now = new Date();
        var accessDate = formatAccessDate(now);
        var year = now.getFullYear();
        var url = window.location.origin + window.location.pathname + '?id=' + encodeURIComponent(figure.id);
        var name = figure.name;

        switch (format) {
            case 'mla':
                return 'Foster, Harry M. "' + name + '." *Detroit Badman Archive*, ' +
                    url + '. Accessed ' + accessDate + '.';
            case 'apa':
                return 'Foster, H. M. (' + year + '). ' + name + '. *Detroit Badman Archive*. ' + url;
            case 'chicago':
            default:
                return 'Foster, Harry M. "' + name + '." *Detroit Badman Archive*. ' +
                    'Accessed ' + accessDate + '. ' + url + '.';
        }
    }

    function updateCitationText(format) {
        var el = document.getElementById('bda-citation-text');
        if (!el) return;
        el.textContent = buildCitation(format);
    }

    function copyCitation() {
        var el = document.getElementById('bda-citation-text');
        var status = document.getElementById('bda-citation-copy-status');
        if (!el) return;
        var text = el.textContent;

        var announce = function (msg) {
            if (status) {
                status.textContent = msg;
                setTimeout(function () { status.textContent = ''; }, 3000);
            }
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(function () { announce('Citation copied to clipboard'); })
                .catch(function () { announce('Copy failed; please select and copy manually'); });
        } else {
            // Fallback for older browsers
            try {
                var tmp = document.createElement('textarea');
                tmp.value = text;
                tmp.setAttribute('readonly', '');
                tmp.style.position = 'absolute';
                tmp.style.left = '-9999px';
                document.body.appendChild(tmp);
                tmp.select();
                document.execCommand('copy');
                document.body.removeChild(tmp);
                announce('Citation copied to clipboard');
            } catch (e) {
                announce('Copy failed; please select and copy manually');
            }
        }
    }

    // ============================================
    // Events
    // ============================================

    function bindEvents() {
        // Read-more toggle in biography — delegated since DOM rebuilt
        document.addEventListener('click', function (e) {
            var toggle = e.target.closest('.read-more-toggle');
            if (toggle) {
                e.preventDefault();
                var container = toggle.closest('.bda-figure-biography-description');
                if (!container) return;
                var rest = container.querySelector('.bda-figure-biography-description-rest');
                if (!rest) return;
                var isHidden = rest.hasAttribute('hidden');
                if (isHidden) {
                    rest.removeAttribute('hidden');
                    toggle.textContent = 'Show less';
                    toggle.setAttribute('aria-label', 'Show less about ' + figure.name);
                } else {
                    rest.setAttribute('hidden', '');
                    toggle.textContent = 'Read more';
                    toggle.setAttribute('aria-label', 'Read more about ' + figure.name);
                }
                return;
            }

            // Citation copy
            if (e.target.closest('#bda-citation-copy-btn')) {
                copyCitation();
                return;
            }
        });

        // Citation format toggle
        document.addEventListener('change', function (e) {
            if (e.target.matches('input[name="citation-format"]')) {
                updateCitationText(e.target.value);
            }
        });
    }

    // ============================================
    // Scroll-spy on credentialing rail TOC
    // ============================================

    function attachScrollSpy() {
        var tocList = document.getElementById('bda-page-toc-list');
        if (!tocList) return;

        var sections = Array.from(document.querySelectorAll('main section[id]'));
        if (sections.length === 0) return;

        if (!('IntersectionObserver' in window)) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var link = tocList.querySelector('a[href="#' + entry.target.id + '"]');
                if (!link) return;
                tocList.querySelectorAll('a').forEach(function (a) {
                    a.removeAttribute('aria-current');
                    a.classList.remove('is-active');
                });
                link.setAttribute('aria-current', 'true');
                link.classList.add('is-active');
            });
        }, {
            rootMargin: '0px 0px -66% 0px',
            threshold: 0
        });

        sections.forEach(function (s) { observer.observe(s); });
    }

})();
