/**
 * bda-sources.js
 *
 * Page-specific script for the Primary Sources landing page at /archive/sources/.
 * Renders a filterable, sortable grid of every source in the archive with five
 * filter dimensions, six sort orders, and URL-synced filter state for shareable
 * deep links.
 *
 * Runs only on the sources landing page. Loads after scripts.js and
 * bda-partials-loader.js. Consumes window.getModalityConfig() from scripts.js
 * with an inline fallback for modality display labels.
 *
 * WCAG 2.2 Level AA compliant. See JAVASCRIPT_DOCUMENTATION.md / sources spec
 * for the full accessibility contract.
 */
(function () {
    'use strict';

    // ---------------------------------------------------------------------
    // Constants
    // ---------------------------------------------------------------------

    var DATA_URL = '/data/detroit.json';

    var ACTIVE_MODALITIES = ['detective', 'revolutionary', 'superhero_villain'];
    var PENDING_MODALITIES = ['gangsta_pimp', 'folk_hero_outlaw'];

    var FIGURE_ROUTE_PREFIX = '/archive/figures/entries';
    var SOURCE_ROUTE_PREFIX = '/archive/sources/entries';

    var MODALITY_LABELS_FALLBACK = {
        detective: 'Detective',
        revolutionary: 'Revolutionary',
        superhero_villain: 'Superhero-Villain',
        gangsta_pimp: 'Gangsta-Pimp',
        folk_hero_outlaw: 'Folk Hero-Outlaw'
    };

    // Maps source `type` strings to thumbnail glyph category. Unknown types
    // fall back to 'doc'. When a new source type is added to the archive,
    // add it here.
    var TYPE_TO_GLYPH = {
        novel: 'book',
        biography: 'book',
        academic: 'book',
        book: 'book',
        nonfiction: 'book',
        comics: 'book',
        memoir: 'book',

        article: 'doc',
        criticism: 'doc',
        reference: 'doc',
        interview: 'doc',
        legal: 'doc',
        institutional: 'doc',
        digital_archive: 'doc',
        publisher: 'doc',
        document: 'doc',

        newspaper: 'news',
        news: 'news',
        magazine: 'news',

        photo: 'photo',
        photograph: 'photo',
        image: 'photo',

        audio: 'audio',
        audio_recording: 'audio',
        oral_history: 'audio',
        podcast: 'audio',

        film: 'film',
        video: 'film',
        television: 'film',
        tv: 'film',
        documentary: 'film'
    };

    var DEFAULT_SORT = 'figure-az';

    // Evidence: used for figure-sort fallback so unattached sources sort last.
    var SORT_MISSING_NAME = 'zzz';

    // ---------------------------------------------------------------------
    // State
    // ---------------------------------------------------------------------

    var state = {
        sources: [],
        figures: [],
        figureById: {},
        filters: {
            modality: new Set(),
            category: new Set(),
            figure: new Set(),
            type: new Set(),
            repository: new Set()
        },
        sort: DEFAULT_SORT,
        typeSearchQuery: ''
    };

    // ---------------------------------------------------------------------
    // DOM references (populated by cacheDom())
    // ---------------------------------------------------------------------

    var dom = {};

    function cacheDom() {
        dom.grid = document.getElementById('bda-sources-grid');
        dom.count = document.getElementById('bda-sources-count');
        dom.emptyState = document.getElementById('bda-sources-empty');
        dom.emptyReset = document.getElementById('bda-sources-empty-reset');
        dom.sort = document.getElementById('bda-sources-sort');
        dom.activeFilters = document.getElementById('bda-sources-active-filters');
        dom.srTableBody = document.getElementById('bda-sources-sr-tbody');
        dom.filterReset = document.getElementById('bda-filter-reset');
        dom.activeCount = document.getElementById('bda-sources-active-count');

        dom.filterModality = document.getElementById('bda-filter-modality');
        dom.filterCategory = document.getElementById('bda-filter-category');
        dom.filterFigureOptions = document.getElementById('bda-filter-figure-options');
        dom.filterTypeOptions = document.getElementById('bda-filter-type-options');
        dom.filterTypeList = document.getElementById('bda-filter-type-list');
        dom.filterTypeSearch = document.getElementById('bda-filter-type-search');
        dom.filterRepositoryOptions = document.getElementById('bda-filter-repository-options');

        dom.filterFigureCount = document.getElementById('bda-filter-figure-count');
        dom.filterTypeCount = document.getElementById('bda-filter-type-count');
        dom.filterRepositoryCount = document.getElementById('bda-filter-repository-count');

        dom.filterToggle = document.getElementById('bda-sources-filter-toggle');
        dom.filterRail = document.getElementById('bda-sources-filter-rail');
    }

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

    function cssEscape(s) {
        if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
            return CSS.escape(s);
        }
        // Minimal polyfill: escape non-word characters.
        return String(s).replace(/([^\w-])/g, '\\$1');
    }

    function slugifyId(id) {
        return String(id).replace(/_/g, '-');
    }

    function formatTypeLabel(type) {
        if (!type) return '';
        return String(type)
            .split('_')
            .map(function (part) {
                if (!part) return '';
                return part.charAt(0).toUpperCase() + part.slice(1);
            })
            .join(' ');
    }

    function primaryFigureName(src) {
        if (!src.figure_ids || src.figure_ids.length === 0) return SORT_MISSING_NAME;
        var fig = state.figureById[src.figure_ids[0]];
        return fig && fig.name ? fig.name : SORT_MISSING_NAME;
    }

    function modalityToCssSuffix(mod) {
        // superhero_villain -> superhero-villain
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

    // ---------------------------------------------------------------------
    // Data loading
    // ---------------------------------------------------------------------

    function loadData() {
        return fetch(DATA_URL)
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            });
    }

    function processData(data) {
        var sources = Array.isArray(data.sources) ? data.sources : [];
        var figures = Array.isArray(data.figures) ? data.figures : [];

        // Filter out placeholder source and figure entries.
        state.sources = sources.filter(function (s) {
            return s && !s._placeholder && s.id;
        });

        // Keep only active-modality figures; placeholder entries excluded.
        state.figures = figures.filter(function (f) {
            return f && !f._placeholder && f.id &&
                ACTIVE_MODALITIES.indexOf(f.modality) !== -1;
        });

        state.figureById = {};
        state.figures.forEach(function (f) {
            state.figureById[f.id] = f;
        });
    }

    function renderLoadError() {
        if (!dom.grid) return;
        dom.grid.innerHTML =
            '<p class="bda-sources-loading" role="alert">' +
            'Could not load sources. Please try again.' +
            '</p>';
        dom.grid.hidden = false;
        if (dom.emptyState) dom.emptyState.hidden = true;
    }

    // ---------------------------------------------------------------------
    // URL state sync
    // ---------------------------------------------------------------------

    var URL_PARAM_MAP = {
        modality: 'm',
        category: 'c',
        figure: 'f',
        type: 't',
        repository: 'r'
    };

    function hydrateFiltersFromURL() {
        var params = new URLSearchParams(window.location.search);

        Object.keys(URL_PARAM_MAP).forEach(function (dim) {
            var key = URL_PARAM_MAP[dim];
            var raw = params.get(key);
            if (!raw) return;
            raw.split(',').forEach(function (val) {
                var v = val.trim();
                if (v) state.filters[dim].add(v);
            });
        });

        var sortParam = params.get('sort');
        if (sortParam) state.sort = sortParam;
    }

    function updateUrlFromState() {
        var params = new URLSearchParams();

        Object.keys(URL_PARAM_MAP).forEach(function (dim) {
            var key = URL_PARAM_MAP[dim];
            var values = Array.from(state.filters[dim]);
            if (values.length > 0) {
                params.set(key, values.join(','));
            }
        });

        if (state.sort && state.sort !== DEFAULT_SORT) {
            params.set('sort', state.sort);
        }

        var qs = params.toString();
        var newUrl = window.location.pathname + (qs ? '?' + qs : '');
        try {
            history.replaceState(null, '', newUrl);
        } catch (e) {
            // Non-fatal; filter state still works in-page.
        }
    }

    // ---------------------------------------------------------------------
    // Counts
    // ---------------------------------------------------------------------

    function countByField(field) {
        // Returns { value: count } across the FULL source set (stable counts).
        var counts = {};
        state.sources.forEach(function (s) {
            var v = s[field];
            if (v === null || v === undefined || v === '') return;
            counts[v] = (counts[v] || 0) + 1;
        });
        return counts;
    }

    function countSourcesForFigure(figureId) {
        var n = 0;
        state.sources.forEach(function (s) {
            if (s.figure_ids && s.figure_ids.indexOf(figureId) !== -1) n++;
        });
        return n;
    }

    function countSourcesForModality(modality) {
        var n = 0;
        state.sources.forEach(function (s) {
            if (!s.figure_ids || s.figure_ids.length === 0) return;
            for (var i = 0; i < s.figure_ids.length; i++) {
                var fig = state.figureById[s.figure_ids[i]];
                if (fig && fig.modality === modality) { n++; return; }
            }
        });
        return n;
    }

    // ---------------------------------------------------------------------
    // Filter rail construction
    // ---------------------------------------------------------------------

    function buildFilterRail() {
        if (!dom.filterRail) return;
        buildModalityFilter();
        buildCategoryFilter();
        buildFigureFilter();
        buildTypeFilter();
        buildRepositoryFilter();
        updateFilterCountBadges();
    }

    function buildModalityFilter() {
        if (!dom.filterModality) return;
        var html = '';

        ACTIVE_MODALITIES.forEach(function (mod) {
            var label = getModalityLabel(mod);
            var suffix = modalityToCssSuffix(mod);
            var count = countSourcesForModality(mod);
            var checked = state.filters.modality.has(mod) ? ' checked' : '';
            html +=
                '<label class="bda-filter-option">' +
                    '<input type="checkbox" data-filter="modality" value="' + escapeHtml(mod) + '"' + checked + '>' +
                    '<span class="bda-filter-modality-marker bda-mm-' + escapeHtml(suffix) + '" aria-hidden="true"></span>' +
                    '<span>' + escapeHtml(label) + ' <span class="bda-filter-pending-tag">(' + count + ')</span></span>' +
                '</label>';
        });

        PENDING_MODALITIES.forEach(function (mod) {
            var label = getModalityLabel(mod);
            var suffix = modalityToCssSuffix(mod);
            html +=
                '<label class="bda-filter-option is-disabled">' +
                    '<input type="checkbox" disabled aria-disabled="true">' +
                    '<span class="bda-filter-modality-marker bda-mm-' + escapeHtml(suffix) + ' is-pending" aria-hidden="true"></span>' +
                    '<span>' + escapeHtml(label) + ' <span class="bda-filter-pending-tag">(pending)</span></span>' +
                '</label>';
        });

        dom.filterModality.innerHTML = html;
    }

    function buildCategoryFilter() {
        if (!dom.filterCategory) return;
        var categories = ['primary', 'secondary', 'archival'];
        var counts = countByField('category');
        var html = '';

        categories.forEach(function (cat) {
            var count = counts[cat] || 0;
            var checked = state.filters.category.has(cat) ? ' checked' : '';
            var label = cat.charAt(0).toUpperCase() + cat.slice(1);
            html +=
                '<label class="bda-filter-option">' +
                    '<input type="checkbox" data-filter="category" value="' + escapeHtml(cat) + '"' + checked + '>' +
                    '<span>' + escapeHtml(label) + ' <span class="bda-filter-pending-tag">(' + count + ')</span></span>' +
                '</label>';
        });

        dom.filterCategory.innerHTML = html;
    }

    function buildFigureFilter() {
        if (!dom.filterFigureOptions) return;

        // Figures that have at least one source, sorted A–Z.
        var figuresWithSources = state.figures
            .map(function (f) {
                return { id: f.id, name: f.name || f.id, count: countSourcesForFigure(f.id) };
            })
            .filter(function (f) { return f.count > 0; })
            .sort(function (a, b) {
                return String(a.name).localeCompare(String(b.name), undefined, { sensitivity: 'base' });
            });

        var html = '';
        figuresWithSources.forEach(function (f) {
            var checked = state.filters.figure.has(f.id) ? ' checked' : '';
            html +=
                '<label class="bda-filter-option">' +
                    '<input type="checkbox" data-filter="figure" value="' + escapeHtml(f.id) + '"' + checked + '>' +
                    '<span>' + escapeHtml(f.name) + ' <span class="bda-filter-pending-tag">(' + f.count + ')</span></span>' +
                '</label>';
        });

        dom.filterFigureOptions.innerHTML = html;
    }

    function buildTypeFilter() {
        if (!dom.filterTypeList) return;

        // Types sorted by count descending.
        var counts = countByField('type');
        var types = Object.keys(counts)
            .map(function (t) { return { value: t, count: counts[t] }; })
            .sort(function (a, b) {
                if (b.count !== a.count) return b.count - a.count;
                return a.value.localeCompare(b.value);
            });

        // Apply type search filter.
        var query = (state.typeSearchQuery || '').trim().toLowerCase();
        if (query) {
            types = types.filter(function (t) {
                var label = formatTypeLabel(t.value).toLowerCase();
                return label.indexOf(query) !== -1 || t.value.toLowerCase().indexOf(query) !== -1;
            });
        }

        var html = '';
        types.forEach(function (t) {
            var checked = state.filters.type.has(t.value) ? ' checked' : '';
            html +=
                '<label class="bda-filter-option">' +
                    '<input type="checkbox" data-filter="type" value="' + escapeHtml(t.value) + '"' + checked + '>' +
                    '<span>' + escapeHtml(formatTypeLabel(t.value)) + ' <span class="bda-filter-pending-tag">(' + t.count + ')</span></span>' +
                '</label>';
        });

        dom.filterTypeList.innerHTML = html;
    }

    function buildRepositoryFilter() {
        if (!dom.filterRepositoryOptions) return;

        var counts = countByField('repository');
        var repos = Object.keys(counts).map(function (r) {
            return { value: r, count: counts[r] };
        });

        // Alphabetical, with "Unknown" variants pushed to end.
        repos.sort(function (a, b) {
            var aUnknown = /^unknown/i.test(a.value) ? 1 : 0;
            var bUnknown = /^unknown/i.test(b.value) ? 1 : 0;
            if (aUnknown !== bUnknown) return aUnknown - bUnknown;
            return a.value.localeCompare(b.value, undefined, { sensitivity: 'base' });
        });

        var html = '';
        repos.forEach(function (r) {
            var checked = state.filters.repository.has(r.value) ? ' checked' : '';
            html +=
                '<label class="bda-filter-option">' +
                    '<input type="checkbox" data-filter="repository" value="' + escapeHtml(r.value) + '"' + checked + '>' +
                    '<span>' + escapeHtml(r.value) + ' <span class="bda-filter-pending-tag">(' + r.count + ')</span></span>' +
                '</label>';
        });

        dom.filterRepositoryOptions.innerHTML = html;
    }

    function updateFilterCountBadges() {
        // Each fieldset legend has a count badge showing number of selected values.
        var pairs = [
            { size: state.filters.modality.size, el: document.getElementById('bda-filter-modality-count') },
            { size: state.filters.category.size, el: document.getElementById('bda-filter-category-count') },
            { size: state.filters.figure.size, el: dom.filterFigureCount },
            { size: state.filters.type.size, el: dom.filterTypeCount },
            { size: state.filters.repository.size, el: dom.filterRepositoryCount }
        ];
        pairs.forEach(function (p) {
            if (!p.el) return;
            p.el.textContent = p.size > 0 ? '(' + p.size + ')' : '';
        });

        // Mobile toggle badge: total number of selected filters across all dimensions.
        if (dom.activeCount) {
            var total = 0;
            Object.keys(state.filters).forEach(function (dim) {
                total += state.filters[dim].size;
            });
            dom.activeCount.textContent = total > 0 ? '(' + total + ')' : '';
        }
    }

    // ---------------------------------------------------------------------
    // Filtering and sorting
    // ---------------------------------------------------------------------

    function sourceMatchesModalityFilter(src) {
        if (state.filters.modality.size === 0) return true;
        if (!src.figure_ids || src.figure_ids.length === 0) return false;
        for (var i = 0; i < src.figure_ids.length; i++) {
            var fig = state.figureById[src.figure_ids[i]];
            if (fig && state.filters.modality.has(fig.modality)) return true;
        }
        return false;
    }

    function sourceMatchesFigureFilter(src) {
        if (state.filters.figure.size === 0) return true;
        if (!src.figure_ids || src.figure_ids.length === 0) return false;
        for (var i = 0; i < src.figure_ids.length; i++) {
            if (state.filters.figure.has(src.figure_ids[i])) return true;
        }
        return false;
    }

    function applyFilters() {
        return state.sources.filter(function (src) {
            if (!sourceMatchesModalityFilter(src)) return false;
            if (state.filters.category.size > 0 && !state.filters.category.has(src.category)) return false;
            if (!sourceMatchesFigureFilter(src)) return false;
            if (state.filters.type.size > 0 && !state.filters.type.has(src.type)) return false;
            if (state.filters.repository.size > 0 && !state.filters.repository.has(src.repository)) return false;
            return true;
        });
    }

    function applySort(sources) {
        var sorted = sources.slice();

        function byTitle(a, b) {
            return String(a.title || '').localeCompare(String(b.title || ''), undefined, { sensitivity: 'base' });
        }

        switch (state.sort) {
            case 'figure-az':
                sorted.sort(function (a, b) {
                    var cmp = primaryFigureName(a).localeCompare(primaryFigureName(b), undefined, { sensitivity: 'base' });
                    return cmp !== 0 ? cmp : byTitle(a, b);
                });
                break;
            case 'figure-za':
                sorted.sort(function (a, b) {
                    var cmp = primaryFigureName(b).localeCompare(primaryFigureName(a), undefined, { sensitivity: 'base' });
                    return cmp !== 0 ? cmp : byTitle(a, b);
                });
                break;
            case 'title-az':
                sorted.sort(byTitle);
                break;
            case 'title-za':
                sorted.sort(function (a, b) { return byTitle(b, a); });
                break;
            case 'year-asc':
                sorted.sort(function (a, b) {
                    var ay = (a.year === null || a.year === undefined) ? Infinity : a.year;
                    var by = (b.year === null || b.year === undefined) ? Infinity : b.year;
                    if (ay !== by) return ay - by;
                    return byTitle(a, b);
                });
                break;
            case 'year-desc':
                sorted.sort(function (a, b) {
                    var ay = (a.year === null || a.year === undefined) ? -Infinity : a.year;
                    var by = (b.year === null || b.year === undefined) ? -Infinity : b.year;
                    if (ay !== by) return by - ay;
                    return byTitle(a, b);
                });
                break;
        }

        return sorted;
    }

    // ---------------------------------------------------------------------
    // Rendering
    // ---------------------------------------------------------------------

    function figureLabelForCard(src) {
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

    function renderCard(src) {
        var category = src.category || 'primary';
        var categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
        var glyph = TYPE_TO_GLYPH[src.type] || 'doc';
        var typeLabel = formatTypeLabel(src.type);
        var figureLabel = figureLabelForCard(src);
        var year = (src.year !== null && src.year !== undefined) ? src.year : '';
        var isExternal = !!(src.url && !src.repository);

        // Compose meta line: "Type · Year" (omit year if missing)
        var metaParts = [];
        if (typeLabel) metaParts.push(typeLabel);
        if (year !== '') metaParts.push(year);
        var metaLine = metaParts.join(' \u00b7 ');

        // Compose aria-label: "Title — Figure (Year)" with fallbacks.
        var ariaParts = [src.title || 'Untitled source'];
        if (figureLabel) ariaParts.push('\u2014 ' + figureLabel);
        if (year !== '') ariaParts.push('(' + year + ')');
        var ariaLabel = ariaParts.join(' ');

        var href = SOURCE_ROUTE_PREFIX + src.id + '/';

        var externalBadge = isExternal
            ? '<span class="bda-source-card-external">External</span>'
            : '';

        var figureLine = figureLabel
            ? '<p class="bda-source-card-figure">' + escapeHtml(figureLabel) + '</p>'
            : '';

        return '' +
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
            '</a>';
    }

    function renderSrTableRow(src) {
        var figureLabel = figureLabelForCard(src) || '\u2014';
        var typeLabel = formatTypeLabel(src.type) || '\u2014';
        var year = (src.year !== null && src.year !== undefined) ? src.year : '\u2014';
        var repo = src.repository || '\u2014';

        return '' +
            '<tr>' +
                '<th scope="row">' + escapeHtml(src.title || 'Untitled source') + '</th>' +
                '<td>' + escapeHtml(figureLabel) + '</td>' +
                '<td>' + escapeHtml(typeLabel) + '</td>' +
                '<td>' + escapeHtml(String(year)) + '</td>' +
                '<td>' + escapeHtml(repo) + '</td>' +
            '</tr>';
    }

    function renderActiveChips() {
        if (!dom.activeFilters) return;

        var chips = [];

        function addChips(dim, labelPrefix, getLabel) {
            var values = Array.from(state.filters[dim]);
            values.forEach(function (val) {
                var label = getLabel ? getLabel(val) : val;
                chips.push(
                    '<span class="bda-filter-chip">' +
                        '<span class="bda-filter-chip-label">' + escapeHtml(labelPrefix) + ':</span> ' +
                        escapeHtml(label) + ' ' +
                        '<button type="button" class="bda-filter-chip-remove" ' +
                                'data-filter="' + escapeHtml(dim) + '" ' +
                                'data-value="' + escapeHtml(val) + '" ' +
                                'aria-label="Remove ' + escapeHtml(labelPrefix) + ' filter: ' + escapeHtml(label) + '">' +
                            '\u00d7' +
                        '</button>' +
                    '</span>'
                );
            });
        }

        addChips('modality', 'Modality', function (v) { return getModalityLabel(v); });
        addChips('category', 'Category', function (v) { return v.charAt(0).toUpperCase() + v.slice(1); });
        addChips('figure', 'Figure', function (v) {
            var f = state.figureById[v];
            return f && f.name ? f.name : v;
        });
        addChips('type', 'Type', function (v) { return formatTypeLabel(v); });
        addChips('repository', 'Repository', function (v) { return v; });

        dom.activeFilters.innerHTML = chips.join('');
    }

    function updateCount(n, total) {
        if (!dom.count) return;
        if (n === total) {
            dom.count.textContent = 'Showing all ' + total + ' source' + (total === 1 ? '' : 's') + '.';
        } else {
            dom.count.textContent = 'Showing ' + n + ' of ' + total + ' sources.';
        }
    }

    function render() {
        if (!dom.grid) return;

        var filtered = applyFilters();
        var sorted = applySort(filtered);

        updateCount(sorted.length, state.sources.length);
        renderActiveChips();
        updateFilterCountBadges();

        if (sorted.length === 0) {
            dom.grid.innerHTML = '';
            dom.grid.hidden = true;
            if (dom.emptyState) dom.emptyState.hidden = false;
        } else {
            dom.grid.innerHTML = sorted.map(renderCard).join('');
            dom.grid.hidden = false;
            if (dom.emptyState) dom.emptyState.hidden = true;
        }

        if (dom.srTableBody) {
            dom.srTableBody.innerHTML = sorted.map(renderSrTableRow).join('');
        }
    }

    // ---------------------------------------------------------------------
    // Filter mutations
    // ---------------------------------------------------------------------

    function toggleFilter(dim, value, checked) {
        if (!state.filters[dim]) return;
        if (checked) {
            state.filters[dim].add(value);
        } else {
            state.filters[dim].delete(value);
        }
        render();
        updateUrlFromState();
    }

    function removeFilter(dim, value) {
        if (!state.filters[dim]) return;
        state.filters[dim].delete(value);

        // Two-way sync: uncheck the matching checkbox in the rail.
        if (dom.filterRail) {
            var selector =
                'input[type="checkbox"][data-filter="' + cssEscape(dim) + '"]' +
                '[value="' + cssEscape(value) + '"]';
            var input = dom.filterRail.querySelector(selector);
            if (input) input.checked = false;
        }

        render();
        updateUrlFromState();
    }

    function resetFilters() {
        Object.keys(state.filters).forEach(function (dim) {
            state.filters[dim].clear();
        });
        state.typeSearchQuery = '';
        if (dom.filterTypeSearch) dom.filterTypeSearch.value = '';

        buildFilterRail();
        render();
        updateUrlFromState();
    }

    // ---------------------------------------------------------------------
    // Event binding (once, on init)
    // ---------------------------------------------------------------------

    function bindEvents() {
        // Delegated filter checkbox change on the rail.
        if (dom.filterRail) {
            dom.filterRail.addEventListener('change', function (e) {
                var t = e.target;
                if (!t || t.tagName !== 'INPUT' || t.type !== 'checkbox') return;
                var dim = t.getAttribute('data-filter');
                if (!dim || !state.filters[dim]) return;
                toggleFilter(dim, t.value, t.checked);
            });

            // Delegated fieldset collapse toggle.
            dom.filterRail.addEventListener('click', function (e) {
                var btn = e.target.closest && e.target.closest('.bda-filter-collapse-btn');
                if (!btn) return;
                var expanded = btn.getAttribute('aria-expanded') === 'true';
                btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
                var controlsId = btn.getAttribute('aria-controls');
                if (controlsId) {
                    var controlled = document.getElementById(controlsId);
                    if (controlled) controlled.hidden = expanded;
                }
            });
        }

        // Type search input.
        if (dom.filterTypeSearch) {
            dom.filterTypeSearch.addEventListener('input', function (e) {
                state.typeSearchQuery = e.target.value || '';
                buildTypeFilter();
            });
        }

        // Sort dropdown.
        if (dom.sort) {
            dom.sort.addEventListener('change', function (e) {
                state.sort = e.target.value || DEFAULT_SORT;
                render();
                updateUrlFromState();
            });
        }

        // Filter-rail reset.
        if (dom.filterReset) {
            dom.filterReset.addEventListener('click', function () {
                resetFilters();
            });
        }

        // Empty-state reset.
        if (dom.emptyReset) {
            dom.emptyReset.addEventListener('click', function () {
                resetFilters();
            });
        }

        // Mobile filter toggle.
        if (dom.filterToggle && dom.filterRail) {
            dom.filterToggle.addEventListener('click', function () {
                var isOpen = dom.filterRail.classList.toggle('is-open');
                dom.filterToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            });
        }

        // Delegated chip removal on the active filters container.
        if (dom.activeFilters) {
            dom.activeFilters.addEventListener('click', function (e) {
                var btn = e.target.closest && e.target.closest('.bda-filter-chip-remove');
                if (!btn) return;
                var dim = btn.getAttribute('data-filter');
                var val = btn.getAttribute('data-value');
                if (!dim || val === null) return;
                removeFilter(dim, val);
            });
        }

        // popstate: rehydrate from URL on forward/back navigation.
        window.addEventListener('popstate', function () {
            Object.keys(state.filters).forEach(function (dim) {
                state.filters[dim].clear();
            });
            state.sort = DEFAULT_SORT;
            state.typeSearchQuery = '';
            if (dom.filterTypeSearch) dom.filterTypeSearch.value = '';

            hydrateFiltersFromURL();
            if (dom.sort) dom.sort.value = state.sort;
            buildFilterRail();
            render();
        });
    }

    // ---------------------------------------------------------------------
    // Init
    // ---------------------------------------------------------------------

    function init() {
        cacheDom();

        // Bail silently if the page isn't the sources landing (required IDs absent).
        if (!dom.grid || !dom.filterRail) return;

        loadData()
            .then(function (data) {
                processData(data);
                hydrateFiltersFromURL();

                // Reflect hydrated sort into the dropdown.
                if (dom.sort && state.sort) {
                    dom.sort.value = state.sort;
                }

                buildFilterRail();
                bindEvents();
                render();
            })
            .catch(function (err) {
                if (window.console && console.error) {
                    console.error('bda-sources.js: failed to load data', err);
                }
                renderLoadError();
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
