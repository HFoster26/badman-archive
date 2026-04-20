/**
 * Detroit Badman Archive — Figures Landing Page
 *
 * Renders a filterable, sortable grid of every figure in the archive
 * organized by modality. Three filters (modality, type, era), name search,
 * four sort orders, URL-synced state.
 *
 * Runs ONLY on /archive/figures/ — do not include on any other page.
 *
 * Authority boundaries:
 *   - Does NOT render site chrome (navbar, footer, credentialing rail).
 *   - Does NOT own nav active-state.
 *   - Consumes getModalityConfig() and calculateBadmanScore() from scripts.js.
 *
 * Style rule: no inline styles, no hardcoded hex values. All visual
 * properties come from CSS classes defined in styles.css.
 *
 * See BDA_FIGURES_JS.md for the full specification.
 */

(function () {
    'use strict';

    // ============================================
    // Constants
    // ============================================

    var DATA_URL = '/data/detroit.json';

    var ACTIVE_MODALITIES = ['detective', 'revolutionary', 'superhero_villain'];
    var PENDING_MODALITIES = ['gangsta_pimp', 'folk_hero_outlaw'];

    var FIGURE_ROUTE_PREFIX = '/archive/figures/';

    // Default within-modality order: earliest emergence first.
    // Cross-modality display order for the default sort.
    var MODALITY_ORDER = [
        'gangsta_pimp',
        'revolutionary',
        'detective',
        'superhero_villain',
        'folk_hero_outlaw'
    ];

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

    // Fallback when scripts.js / getModalityConfig() is unavailable at module load.
    var MODALITY_LABELS_FALLBACK = {
        detective: 'Detective',
        revolutionary: 'Revolutionary',
        superhero_villain: 'Superhero-Villain',
        gangsta_pimp: 'Gangsta-Pimp',
        folk_hero_outlaw: 'Folk Hero-Outlaw'
    };

    // Era buckets — keyed by bucket ID, values are display labels.
    // Must stay in sync with getEraBucket() below.
    var ERA_BUCKETS = [
        { key: 'pre-1950',   label: 'Before 1950' },
        { key: '1950-1970',  label: '1950–1970' },
        { key: '1970-1990',  label: '1970s–1980s' },
        { key: '1990-2010',  label: '1990s–2000s' },
        { key: 'post-2010',  label: '2010 onward' }
    ];

    var SORT_DEFAULT = 'modality-emergence';

    var SEARCH_DEBOUNCE_MS = 150;

    // ============================================
    // State
    // ============================================

    var state = {
        figures: [],
        filters: {
            modality: new Set(),
            type:     new Set(),
            era:      new Set()
        },
        sort: SORT_DEFAULT,
        nameSearchQuery: ''
    };

    var dom = {};

    // ============================================
    // Helpers
    // TODO: consolidate escapeHtml, lastName into scripts.js
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

    /**
     * Extract a last name for alphabetical sorting.
     * Handles suffixes (Jr., Sr., III), single-name figures, and paired entries.
     *
     *   "Ron Scott"                   → "Scott"
     *   "General Gordon Baker Jr."    → "Baker"
     *   "Kenyatta"                    → "Kenyatta"
     *   "Gaidi & Imari Obadele"       → "Obadele"
     */
    function lastName(fullName) {
        if (!fullName) return '';
        // Strip anything after a slash (e.g., "Victor Stone / Cyborg" → "Victor Stone")
        var primary = String(fullName).split('/')[0].trim();
        var tokens = primary.split(/\s+/);
        if (tokens.length === 1) return tokens[0];

        // Strip trailing suffixes
        var SUFFIXES = /^(jr|sr|ii|iii|iv|v|esq)\.?$/i;
        while (tokens.length > 1 && SUFFIXES.test(tokens[tokens.length - 1])) {
            tokens.pop();
        }
        return tokens[tokens.length - 1];
    }

    /**
     * Get display label for a modality. Prefer getModalityConfig() from scripts.js;
     * fall back to a local map if scripts.js hasn't loaded or returned nothing useful.
     */
    function getModalityLabel(modality) {
        if (typeof window.getModalityConfig === 'function') {
            try {
                var cfg = window.getModalityConfig(modality);
                if (cfg && cfg.displayLabel) return cfg.displayLabel;
            } catch (e) { /* fall through */ }
        }
        return MODALITY_LABELS_FALLBACK[modality] || modality;
    }

    /**
     * Map an emergence year to an era bucket key.
     * Returns null for missing/invalid years.
     */
    function getEraBucket(year) {
        if (typeof year !== 'number' || isNaN(year)) return null;
        if (year < 1950) return 'pre-1950';
        if (year <= 1970) return '1950-1970';
        if (year <= 1990) return '1970-1990';
        if (year <= 2010) return '1990-2010';
        return 'post-2010';
    }

    function getEraBucketLabel(key) {
        for (var i = 0; i < ERA_BUCKETS.length; i++) {
            if (ERA_BUCKETS[i].key === key) return ERA_BUCKETS[i].label;
        }
        return key;
    }

    /**
     * One-line descriptor for card display.
     * First sentence of biography, clamped to 120 chars.
     */
    function buildDescriptor(figure) {
        var desc = figure.biography && figure.biography.description;
        if (!desc) return '';
        var firstSentence = String(desc).split(/[.!?]/)[0];
        if (firstSentence.length > 120) {
            return firstSentence.substring(0, 117) + '…';
        }
        return firstSentence + '.';
    }

    /**
     * Era label for card display.
     * Real, deceased:          "1936–1974"
     * Real, living:            "1945–present"
     * Real, no birth year:     "Active 1968–2015"
     * Fictional, multi-year:   "1974–1986 (Print)"
     * Fictional, single year:  "1988 (Film)"
     */
    function buildEraLabel(figure) {
        var y = figure.years || {};
        if (figure.type === 'real') {
            if (y.birth != null) {
                return y.birth + '–' + (y.death != null ? y.death : 'present');
            }
            return 'Active ' + y.active_start + '–' + y.active_end;
        }
        // Fictional
        var medium = MEDIUM_LABELS[figure.medium] || figure.medium || '';
        var range = (y.active_start === y.active_end)
            ? String(y.active_start)
            : y.active_start + '–' + y.active_end;
        return medium ? range + ' (' + medium + ')' : range;
    }

    /**
     * Calculate badman score. Prefer the site-wide helper from scripts.js;
     * inline fallback handles the unlikely case where scripts.js hasn't loaded.
     */
    function getScore(figure) {
        if (typeof window.calculateBadmanScore === 'function') {
            try { return window.calculateBadmanScore(figure.scores); }
            catch (e) { /* fall through */ }
        }
        var s = figure.scores || {};
        return (s.outlaw_relationship && s.outlaw_relationship.score || 0) +
               (s.community_authorization && s.community_authorization.score || 0) +
               (s.violence_as_language && s.violence_as_language.score || 0) +
               (s.cultural_preservation && s.cultural_preservation.score || 0) +
               (s.hypermasculine_performance && s.hypermasculine_performance.score || 0);
    }

    // ============================================
    // DOM caching
    // ============================================

    function cacheDom() {
        dom.grid              = document.getElementById('bda-figures-grid');
        dom.count             = document.getElementById('bda-figures-count');
        dom.empty             = document.getElementById('bda-figures-empty');
        dom.emptyReset        = document.getElementById('bda-figures-empty-reset');
        dom.sort              = document.getElementById('bda-figures-sort');
        dom.activeFilters     = document.getElementById('bda-figures-active-filters');
        dom.srTbody           = document.getElementById('bda-figures-sr-tbody');
        dom.filterReset       = document.getElementById('bda-filter-reset');
        dom.activeCount       = document.getElementById('bda-figures-active-count');
        dom.filterModality    = document.getElementById('bda-filter-modality');
        dom.filterType        = document.getElementById('bda-filter-type');
        dom.filterEra         = document.getElementById('bda-filter-era');
        dom.filterNameSearch  = document.getElementById('bda-filter-name-search');
        dom.filterToggle      = document.getElementById('bda-figures-filter-toggle');
        dom.filterRail        = document.getElementById('bda-figures-filter-rail');
    }

    // ============================================
    // Data loading
    // ============================================

    function loadData() {
        return fetch(DATA_URL)
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(function (data) {
                processData(data);
                return data;
            });
    }

    function processData(data) {
        state.figures = (data.figures || []).filter(function (f) {
            if (f._placeholder) return false;
            if (!ACTIVE_MODALITIES.includes(f.modality)) return false;
            return f.id && f.name && f.modality;
        });
    }

    function renderLoadError() {
        if (dom.grid) {
            dom.grid.innerHTML =
                '<p class="bda-figures-loading" role="alert">' +
                'Could not load figures. Please try again.' +
                '</p>';
        }
    }

    // ============================================
    // URL state sync
    // ============================================

    function hydrateFiltersFromURL() {
        var params = new URLSearchParams(window.location.search);

        var m = params.get('m');
        if (m) m.split(',').forEach(function (v) { state.filters.modality.add(v); });

        var t = params.get('t');
        if (t) t.split(',').forEach(function (v) { state.filters.type.add(v); });

        var e = params.get('e');
        if (e) e.split(',').forEach(function (v) { state.filters.era.add(v); });

        var q = params.get('q');
        if (q) state.nameSearchQuery = q;

        var sort = params.get('sort');
        if (sort) state.sort = sort;
    }

    function updateUrlFromState() {
        var params = new URLSearchParams();

        if (state.filters.modality.size > 0) {
            params.set('m', Array.from(state.filters.modality).join(','));
        }
        if (state.filters.type.size > 0) {
            params.set('t', Array.from(state.filters.type).join(','));
        }
        if (state.filters.era.size > 0) {
            params.set('e', Array.from(state.filters.era).join(','));
        }
        if (state.nameSearchQuery) {
            params.set('q', state.nameSearchQuery);
        }
        if (state.sort !== SORT_DEFAULT) {
            params.set('sort', state.sort);
        }

        var qs = params.toString();
        var newUrl = window.location.pathname + (qs ? '?' + qs : '') + window.location.hash;
        history.replaceState(null, '', newUrl);
    }

    // ============================================
    // Filter counts (stable — reflects full dataset, not filtered set)
    // ============================================

    function countByModality() {
        var counts = {};
        state.figures.forEach(function (f) {
            counts[f.modality] = (counts[f.modality] || 0) + 1;
        });
        return counts;
    }

    function countByType() {
        var counts = { real: 0, fictional: 0 };
        state.figures.forEach(function (f) {
            if (counts.hasOwnProperty(f.type)) counts[f.type]++;
        });
        return counts;
    }

    function countByEra() {
        var counts = {};
        state.figures.forEach(function (f) {
            var bucket = getEraBucket(f.emergence && f.emergence.year);
            if (bucket) counts[bucket] = (counts[bucket] || 0) + 1;
        });
        return counts;
    }

    // ============================================
    // Filter rail construction
    // ============================================

    function buildFilterRail() {
        buildModalityFilter();
        buildTypeFilter();
        buildEraFilter();
        // Name search input exists in page HTML; only value needs hydration.
        if (dom.filterNameSearch) {
            dom.filterNameSearch.value = state.nameSearchQuery;
        }
    }

    function buildModalityFilter() {
        if (!dom.filterModality) return;
        var counts = countByModality();
        var html = '';

        ACTIVE_MODALITIES.forEach(function (mod) {
            var isChecked = state.filters.modality.has(mod);
            var shapeClass = 'bda-mm-' + mod.replace(/_/g, '-');
            // .bda-mm-superhero-villain, not .bda-mm-superhero_villain
            if (mod === 'superhero_villain') shapeClass = 'bda-mm-superhero-villain';
            if (mod === 'gangsta_pimp')      shapeClass = 'bda-mm-gangsta-pimp';
            if (mod === 'folk_hero_outlaw')  shapeClass = 'bda-mm-folk-hero-outlaw';

            html +=
                '<label class="bda-filter-option">' +
                    '<input type="checkbox" data-filter="modality" value="' + escapeHtml(mod) + '"' +
                        (isChecked ? ' checked' : '') + '>' +
                    '<span class="bda-filter-modality-marker ' + shapeClass + '" aria-hidden="true"></span>' +
                    '<span>' + escapeHtml(getModalityLabel(mod)) +
                        ' <span class="bda-filter-pending-tag">(' + (counts[mod] || 0) + ')</span>' +
                    '</span>' +
                '</label>';
        });

        PENDING_MODALITIES.forEach(function (mod) {
            var shapeClass = 'bda-mm-' + mod.replace(/_/g, '-');
            if (mod === 'gangsta_pimp')     shapeClass = 'bda-mm-gangsta-pimp';
            if (mod === 'folk_hero_outlaw') shapeClass = 'bda-mm-folk-hero-outlaw';

            html +=
                '<label class="bda-filter-option is-disabled">' +
                    '<input type="checkbox" disabled aria-disabled="true" data-filter="modality" value="' + escapeHtml(mod) + '">' +
                    '<span class="bda-filter-modality-marker ' + shapeClass + ' is-pending" aria-hidden="true"></span>' +
                    '<span>' + escapeHtml(getModalityLabel(mod)) +
                        ' <span class="bda-filter-pending-tag">(pending)</span>' +
                    '</span>' +
                '</label>';
        });

        dom.filterModality.innerHTML = html;
    }

    function buildTypeFilter() {
        if (!dom.filterType) return;
        var counts = countByType();
        var html = '';

        ['real', 'fictional'].forEach(function (t) {
            var isChecked = state.filters.type.has(t);
            html +=
                '<label class="bda-filter-option">' +
                    '<input type="checkbox" data-filter="type" value="' + t + '"' +
                        (isChecked ? ' checked' : '') + '>' +
                    '<span>' + TYPE_LABELS[t] +
                        ' <span class="bda-filter-pending-tag">(' + (counts[t] || 0) + ')</span>' +
                    '</span>' +
                '</label>';
        });

        dom.filterType.innerHTML = html;
    }

    function buildEraFilter() {
        if (!dom.filterEra) return;
        var counts = countByEra();
        var html = '';

        ERA_BUCKETS.forEach(function (bucket) {
            var isChecked = state.filters.era.has(bucket.key);
            html +=
                '<label class="bda-filter-option">' +
                    '<input type="checkbox" data-filter="era" value="' + escapeHtml(bucket.key) + '"' +
                        (isChecked ? ' checked' : '') + '>' +
                    '<span>' + escapeHtml(bucket.label) +
                        ' <span class="bda-filter-pending-tag">(' + (counts[bucket.key] || 0) + ')</span>' +
                    '</span>' +
                '</label>';
        });

        dom.filterEra.innerHTML = html;
    }

    // ============================================
    // Filtering & sorting
    // ============================================

    function applyFilters(figures) {
        var q = state.nameSearchQuery.toLowerCase();

        return figures.filter(function (f) {
            if (state.filters.modality.size > 0 && !state.filters.modality.has(f.modality)) {
                return false;
            }
            if (state.filters.type.size > 0 && !state.filters.type.has(f.type)) {
                return false;
            }
            if (state.filters.era.size > 0) {
                var bucket = getEraBucket(f.emergence && f.emergence.year);
                if (!bucket || !state.filters.era.has(bucket)) return false;
            }
            if (q) {
                if (f.name.toLowerCase().indexOf(q) === -1) return false;
            }
            return true;
        });
    }

    function applySort(figures) {
        var copy = figures.slice();

        switch (state.sort) {
            case 'name-az':
                copy.sort(function (a, b) {
                    var cmp = lastName(a.name).localeCompare(lastName(b.name));
                    if (cmp !== 0) return cmp;
                    return a.name.localeCompare(b.name);
                });
                break;

            case 'emergence-asc':
                copy.sort(function (a, b) {
                    var ya = (a.emergence && a.emergence.year) || 0;
                    var yb = (b.emergence && b.emergence.year) || 0;
                    if (ya !== yb) return ya - yb;
                    return a.name.localeCompare(b.name);
                });
                break;

            case 'score-desc':
                copy.sort(function (a, b) {
                    var cmp = getScore(b) - getScore(a);
                    if (cmp !== 0) return cmp;
                    return a.name.localeCompare(b.name);
                });
                break;

            case 'modality-emergence':
            default:
                copy.sort(function (a, b) {
                    var ia = MODALITY_ORDER.indexOf(a.modality);
                    var ib = MODALITY_ORDER.indexOf(b.modality);
                    if (ia !== ib) return ia - ib;
                    var ya = (a.emergence && a.emergence.year) || 0;
                    var yb = (b.emergence && b.emergence.year) || 0;
                    if (ya !== yb) return ya - yb;
                    return a.name.localeCompare(b.name);
                });
                break;
        }

        return copy;
    }

    // ============================================
    // Rendering
    // ============================================

    function render() {
        var filtered = applyFilters(state.figures);
        var sorted = applySort(filtered);

        renderCount(filtered.length);
        renderActiveChips();
        renderActiveCount();
        renderGrid(sorted);
        renderSrTable(sorted);
        renderEmptyState(filtered.length === 0);
    }

    function renderCount(n) {
        if (!dom.count) return;
        dom.count.textContent = n + (n === 1 ? ' figure' : ' figures');
    }

    function renderActiveCount() {
        if (!dom.activeCount) return;
        var total = state.filters.modality.size +
                    state.filters.type.size +
                    state.filters.era.size +
                    (state.nameSearchQuery ? 1 : 0);
        dom.activeCount.textContent = total > 0 ? String(total) : '';
    }

    function renderActiveChips() {
        if (!dom.activeFilters) return;
        var html = '';

        state.filters.modality.forEach(function (mod) {
            html +=
                '<span class="bda-filter-chip">' +
                    '<span class="bda-filter-chip-label">Modality:</span> ' +
                    escapeHtml(getModalityLabel(mod)) +
                    ' <button type="button" class="bda-filter-chip-remove"' +
                        ' data-filter="modality" data-value="' + escapeHtml(mod) + '"' +
                        ' aria-label="Remove Modality filter: ' + escapeHtml(getModalityLabel(mod)) + '">×</button>' +
                '</span>';
        });

        state.filters.type.forEach(function (t) {
            html +=
                '<span class="bda-filter-chip">' +
                    '<span class="bda-filter-chip-label">Type:</span> ' +
                    escapeHtml(TYPE_LABELS[t] || t) +
                    ' <button type="button" class="bda-filter-chip-remove"' +
                        ' data-filter="type" data-value="' + escapeHtml(t) + '"' +
                        ' aria-label="Remove Type filter: ' + escapeHtml(TYPE_LABELS[t] || t) + '">×</button>' +
                '</span>';
        });

        state.filters.era.forEach(function (eraKey) {
            html +=
                '<span class="bda-filter-chip">' +
                    '<span class="bda-filter-chip-label">Era:</span> ' +
                    escapeHtml(getEraBucketLabel(eraKey)) +
                    ' <button type="button" class="bda-filter-chip-remove"' +
                        ' data-filter="era" data-value="' + escapeHtml(eraKey) + '"' +
                        ' aria-label="Remove Era filter: ' + escapeHtml(getEraBucketLabel(eraKey)) + '">×</button>' +
                '</span>';
        });

        if (state.nameSearchQuery) {
            html +=
                '<span class="bda-filter-chip">' +
                    '<span class="bda-filter-chip-label">Name:</span> "' +
                    escapeHtml(state.nameSearchQuery) + '"' +
                    ' <button type="button" class="bda-filter-chip-remove"' +
                        ' data-filter="name" data-value=""' +
                        ' aria-label="Clear name search">×</button>' +
                '</span>';
        }

        dom.activeFilters.innerHTML = html;
    }

    function renderGrid(figures) {
        if (!dom.grid) return;

        if (figures.length === 0) {
            dom.grid.innerHTML = '';
            dom.grid.hidden = true;
            return;
        }
        dom.grid.hidden = false;

        if (state.sort === SORT_DEFAULT) {
            renderGrouped(figures);
        } else {
            renderFlat(figures);
        }
    }

    function renderGrouped(figures) {
        // Bucket by modality
        var buckets = {};
        figures.forEach(function (f) {
            if (!buckets[f.modality]) buckets[f.modality] = [];
            buckets[f.modality].push(f);
        });

        var html = '';
        dom.grid.className = 'bda-figures-grid bda-figures-grouped';

        MODALITY_ORDER.forEach(function (mod) {
            var group = buckets[mod];
            if (!group || group.length === 0) return;

            var shapeClass = 'bda-mm-' + mod.replace(/_/g, '-');
            if (mod === 'superhero_villain') shapeClass = 'bda-mm-superhero-villain';
            if (mod === 'gangsta_pimp')      shapeClass = 'bda-mm-gangsta-pimp';
            if (mod === 'folk_hero_outlaw')  shapeClass = 'bda-mm-folk-hero-outlaw';

            var headingId = 'bda-group-' + mod;

            html +=
                '<section class="bda-figure-modality-group" aria-labelledby="' + headingId + '">' +
                    '<h2 id="' + headingId + '" class="bda-figure-modality-heading">' +
                        '<span class="bda-filter-modality-marker ' + shapeClass + '" aria-hidden="true"></span>' +
                        escapeHtml(getModalityLabel(mod)) +
                        ' <span class="bda-figure-modality-count">(' + group.length + ')</span>' +
                    '</h2>' +
                    '<ul class="bda-figure-card-list">' +
                        group.map(renderCard).join('') +
                    '</ul>' +
                '</section>';
        });

        dom.grid.innerHTML = html;
    }

    function renderFlat(figures) {
        dom.grid.className = 'bda-figures-grid bda-figures-flat';
        dom.grid.innerHTML =
            '<ul class="bda-figure-card-list">' +
                figures.map(renderCard).join('') +
            '</ul>';
    }

    function renderCard(figure) {
        var score = getScore(figure);
        var eraLabel = buildEraLabel(figure);
        var descriptor = buildDescriptor(figure);
        var modalityLabel = getModalityLabel(figure.modality);
        var typeLabel = TYPE_LABELS[figure.type] || figure.type;

        var shapeClass = 'bda-mm-' + figure.modality.replace(/_/g, '-');
        if (figure.modality === 'superhero_villain') shapeClass = 'bda-mm-superhero-villain';
        if (figure.modality === 'gangsta_pimp')      shapeClass = 'bda-mm-gangsta-pimp';
        if (figure.modality === 'folk_hero_outlaw')  shapeClass = 'bda-mm-folk-hero-outlaw';

        var typeBadgeClass = 'bda-type-' + figure.type;

        var ariaLabel = figure.name + ' — ' + modalityLabel + ', ' + typeLabel +
            (eraLabel ? ', ' + eraLabel : '') +
            ', Badman Score ' + score + ' out of 25';

        var metaBadge = figure.meta_badman
            ? '<span class="bda-figure-card-meta-badge" aria-hidden="true">Meta-Badman</span>'
            : '';

        return (
            '<li>' +
                '<a class="bda-figure-card" href="' + FIGURE_ROUTE_PREFIX + '?id=' + encodeURIComponent(figure.id) + '"' +
                   ' aria-label="' + escapeHtml(ariaLabel) + '">' +
                    '<div class="bda-figure-card-thumb">' +
                        '<span class="bda-filter-modality-marker ' + shapeClass + '" aria-hidden="true"></span>' +
                        '<span class="bda-figure-card-type-badge ' + typeBadgeClass + '">' + escapeHtml(typeLabel) + '</span>' +
                        metaBadge +
                    '</div>' +
                    '<div class="bda-figure-card-info">' +
                        '<h3 class="bda-figure-card-title">' + escapeHtml(figure.name) + '</h3>' +
                        '<p class="bda-figure-card-era">' + escapeHtml(eraLabel) + '</p>' +
                        (descriptor ? '<p class="bda-figure-card-descriptor">' + escapeHtml(descriptor) + '</p>' : '') +
                        '<p class="bda-figure-card-score" aria-label="Badman score: ' + score + ' out of 25">' +
                            '<span class="bda-score-value">' + score + '</span>' +
                            '<span class="bda-score-total">/25</span>' +
                        '</p>' +
                    '</div>' +
                '</a>' +
            '</li>'
        );
    }

    function renderSrTable(figures) {
        if (!dom.srTbody) return;
        dom.srTbody.innerHTML = figures.map(function (f) {
            var score = getScore(f);
            return (
                '<tr>' +
                    '<th scope="row">' +
                        '<a href="' + FIGURE_ROUTE_PREFIX + '?id=' + encodeURIComponent(f.id) + '">' +
                            escapeHtml(f.name) +
                        '</a>' +
                    '</th>' +
                    '<td>' + escapeHtml(getModalityLabel(f.modality)) + '</td>' +
                    '<td>' + escapeHtml(TYPE_LABELS[f.type] || f.type) + '</td>' +
                    '<td>' + escapeHtml(buildEraLabel(f)) + '</td>' +
                    '<td>' + score + '/25</td>' +
                '</tr>'
            );
        }).join('');
    }

    function renderEmptyState(isEmpty) {
        if (!dom.empty) return;
        dom.empty.hidden = !isEmpty;
    }

    // ============================================
    // Reset
    // ============================================

    function resetFilters() {
        state.filters.modality.clear();
        state.filters.type.clear();
        state.filters.era.clear();
        state.nameSearchQuery = '';
        if (dom.filterNameSearch) dom.filterNameSearch.value = '';
        buildFilterRail();
        render();
        updateUrlFromState();
    }

    // ============================================
    // Event handlers
    // ============================================

    function onFilterChange(e) {
        var target = e.target;
        if (!target.matches('input[type="checkbox"][data-filter]')) return;

        var dimension = target.getAttribute('data-filter');
        var value = target.value;

        if (!state.filters[dimension]) return;

        if (target.checked) {
            state.filters[dimension].add(value);
        } else {
            state.filters[dimension].delete(value);
        }

        render();
        updateUrlFromState();
    }

    function onSortChange() {
        if (!dom.sort) return;
        state.sort = dom.sort.value || SORT_DEFAULT;
        render();
        updateUrlFromState();
    }

    var searchTimer;
    function onSearchInput(e) {
        clearTimeout(searchTimer);
        var value = e.target.value.trim();
        searchTimer = setTimeout(function () {
            state.nameSearchQuery = value;
            render();
            updateUrlFromState();
        }, SEARCH_DEBOUNCE_MS);
    }

    function onChipRemove(e) {
        var btn = e.target.closest('.bda-filter-chip-remove');
        if (!btn) return;

        var filter = btn.getAttribute('data-filter');
        var value = btn.getAttribute('data-value');

        if (filter === 'name') {
            state.nameSearchQuery = '';
            if (dom.filterNameSearch) dom.filterNameSearch.value = '';
        } else if (state.filters[filter]) {
            state.filters[filter].delete(value);
        }

        buildFilterRail();
        render();
        updateUrlFromState();
    }

    function onMobileFilterToggle() {
        if (!dom.filterRail || !dom.filterToggle) return;
        var isOpen = dom.filterRail.classList.toggle('is-open');
        dom.filterToggle.setAttribute('aria-expanded', String(isOpen));
    }

    function onEmptyReset() {
        resetFilters();
        // Empty-state reset: focus moves to first filter control
        var firstCheckbox = dom.filterRail && dom.filterRail.querySelector('input[type="checkbox"]:not([disabled])');
        if (firstCheckbox) firstCheckbox.focus();
    }

    function onPopState() {
        state.filters.modality.clear();
        state.filters.type.clear();
        state.filters.era.clear();
        state.nameSearchQuery = '';
        state.sort = SORT_DEFAULT;
        hydrateFiltersFromURL();
        if (dom.sort) dom.sort.value = state.sort;
        buildFilterRail();
        render();
    }

    function bindEvents() {
        // Delegated filter changes on the rail
        if (dom.filterRail) {
            dom.filterRail.addEventListener('change', onFilterChange);
        }

        // Sort dropdown
        if (dom.sort) {
            dom.sort.value = state.sort;
            dom.sort.addEventListener('change', onSortChange);
        }

        // Name search
        if (dom.filterNameSearch) {
            dom.filterNameSearch.addEventListener('input', onSearchInput);
        }

        // Reset buttons
        if (dom.filterReset) {
            dom.filterReset.addEventListener('click', resetFilters);
        }
        if (dom.emptyReset) {
            dom.emptyReset.addEventListener('click', onEmptyReset);
        }

        // Mobile filter toggle
        if (dom.filterToggle) {
            dom.filterToggle.addEventListener('click', onMobileFilterToggle);
        }

        // Delegated chip remove
        if (dom.activeFilters) {
            dom.activeFilters.addEventListener('click', onChipRemove);
        }

        // Back/forward navigation
        window.addEventListener('popstate', onPopState);
    }

    // ============================================
    // Initialization
    // ============================================

    function init() {
        cacheDom();
        loadData()
            .then(function () {
                hydrateFiltersFromURL();
                buildFilterRail();
                bindEvents();
                render();
            })
            .catch(function (err) {
                console.error('bda-figures.js: failed to load data', err);
                renderLoadError();
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
