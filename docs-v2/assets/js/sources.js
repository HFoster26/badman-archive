/*
 * ============================================================================
 * Primary Sources Landing — /archive/sources/
 * Sprint Phase 3.2
 * ============================================================================
 *
 * Reads sources and figures from /data/detroit.json, renders a filterable
 * grid with five filter dimensions (modality, category, figure, type,
 * repository) plus six sort orders. Filter state is reflected in the URL
 * (querystring) so views are shareable and bookmarkable.
 *
 * Dependencies: none at runtime. `getModalityConfig()` from scripts.js is
 * consulted for modality labels if available; falls back to an inline map.
 *
 * Active modalities at launch: detective, revolutionary, superhero_villain.
 * Pending modalities (gangsta_pimp, folk_hero_outlaw) appear as disabled
 * entries in the modality filter with "(pending)" annotation.
 */

(function () {
    'use strict';

    /* ========================================================================
       Config
       ======================================================================== */

    var DATA_URL = '/data/detroit.json';

    var ACTIVE_MODALITIES = ['detective', 'revolutionary', 'superhero_villain'];
    var PENDING_MODALITIES = ['gangsta_pimp', 'folk_hero_outlaw'];

    // Modality display labels. Prefer getModalityConfig() from scripts.js if
    // present; this is the fallback.
    var MODALITY_LABELS_FALLBACK = {
        detective: 'Detective',
        revolutionary: 'Revolutionary',
        superhero_villain: 'Superhero-Villain',
        gangsta_pimp: 'Gangsta-Pimp',
        folk_hero_outlaw: 'Folk Hero-Outlaw'
    };

    // Figure routes follow /archive/figures/[slug]/. Source routes follow
    // /archive/sources/[slug]/. Slugs are derived from figure id / source id
    // with underscores → hyphens.
    var FIGURE_ROUTE_PREFIX = '/archive/figures/';
    var SOURCE_ROUTE_PREFIX = '/archive/sources/';

    // Source type → thumbnail glyph class. Types not in this map fall back to
    // the generic 'doc' glyph.
    var TYPE_TO_GLYPH = {
        // Print / text
        book: 'book',
        novel: 'book',
        biography: 'book',
        comics: 'book',
        manuscript: 'doc',
        letter: 'doc',
        legal: 'doc',
        government: 'doc',
        founding_document: 'doc',
        organizational_document: 'doc',
        organizational_statement: 'doc',
        newsletter: 'news',
        newspaper: 'news',
        news: 'news',
        obituary: 'news',
        // Academic / reference
        academic: 'doc',
        criticism: 'doc',
        reference: 'doc',
        // Visual
        artwork: 'photo',
        personal: 'photo',
        // Audio / video
        audio_recording: 'audio',
        podcast: 'audio',
        interview: 'audio',
        film: 'film',
        television: 'film',
        video: 'film',
        documentary: 'film',
        // Institutional / digital
        digital_archive: 'doc',
        institutional: 'doc',
        organizational: 'doc',
        publisher: 'doc',
        website: 'doc'
    };

    // Human-readable labels for source types. The schema stores snake_case;
    // we format for display here.
    function formatTypeLabel(type) {
        if (!type) return 'Unknown';
        return type
            .split('_')
            .map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); })
            .join(' ');
    }

    /* ========================================================================
       State
       ======================================================================== */

    var state = {
        sources: [],         // All sources from JSON
        figures: [],         // All figures from JSON (active modalities only)
        figureById: {},      // Lookup: figure.id → figure
        filters: {
            modality: new Set(),     // modality keys
            category: new Set(),     // 'primary' | 'archival' | 'secondary'
            figure: new Set(),       // figure ids
            type: new Set(),         // source types
            repository: new Set()    // repository names
        },
        sort: 'figure-az',
        typeSearchQuery: ''
    };

    /* ========================================================================
       DOM references
       ======================================================================== */

    var dom = {};

    function cacheDom() {
        dom.grid               = document.getElementById('bda-sources-grid');
        dom.count              = document.getElementById('bda-sources-count');
        dom.emptyState         = document.getElementById('bda-sources-empty');
        dom.emptyStateReset    = document.getElementById('bda-sources-empty-reset');
        dom.sortSelect         = document.getElementById('bda-sources-sort');
        dom.activeFilters      = document.getElementById('bda-sources-active-filters');
        dom.srTbody            = document.getElementById('bda-sources-sr-tbody');
        dom.resetBtn           = document.getElementById('bda-filter-reset');
        dom.activeCount        = document.getElementById('bda-sources-active-count');

        // Filter containers
        dom.filterModality     = document.getElementById('bda-filter-modality');
        dom.filterCategory     = document.getElementById('bda-filter-category');
        dom.filterFigure       = document.getElementById('bda-filter-figure-options');
        dom.filterType         = document.getElementById('bda-filter-type-options');
        dom.filterTypeList     = document.getElementById('bda-filter-type-list');
        dom.filterTypeSearch   = document.getElementById('bda-filter-type-search');
        dom.filterRepo         = document.getElementById('bda-filter-repository-options');

        // Filter counts (in legend badges)
        dom.figureCount        = document.getElementById('bda-filter-figure-count');
        dom.typeCount          = document.getElementById('bda-filter-type-count');
        dom.repoCount          = document.getElementById('bda-filter-repository-count');

        // Mobile filter toggle
        dom.mobileToggle       = document.getElementById('bda-sources-filter-toggle');
        dom.filterRail         = document.getElementById('bda-sources-filter-rail');
    }

    /* ========================================================================
       Boot
       ======================================================================== */

    document.addEventListener('DOMContentLoaded', function () {
        cacheDom();
        loadData();
    });

    function loadData() {
        fetch(DATA_URL)
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(function (data) {
                processData(data);
                hydrateFiltersFromURL();
                buildFilterRail();
                bindEvents();
                render();
            })
            .catch(function (err) {
                console.error('Failed to load sources data:', err);
                dom.grid.setAttribute('aria-busy', 'false');
                dom.grid.innerHTML =
                    '<p class="bda-sources-loading" role="alert">' +
                    'Could not load sources. Please try again.' +
                    '</p>';
            });
    }

    function processData(data) {
        // Sources: copy as-is (new schema already has top-level sources array)
        state.sources = (data.sources || []).filter(function (s) {
            return s && s.id && s.title;
        });

        // Figures: filter out divider entries (no id or modality) and keep
        // only those in active modalities. Pending-modality figures (Goines)
        // stay out of the figure filter but remain linkable if referenced.
        state.figures = (data.figures || []).filter(function (f) {
            return f && f.id && f.name && f.modality;
        });

        state.figures.forEach(function (f) {
            state.figureById[f.id] = f;
        });
    }

    /* ========================================================================
       Filter rail construction
       ======================================================================== */

    function buildFilterRail() {
        buildModalityFilter();
        buildCategoryFilter();
        buildFigureFilter();
        buildTypeFilter();
        buildRepositoryFilter();
    }

    function buildModalityFilter() {
        var html = '';

        ACTIVE_MODALITIES.forEach(function (mod) {
            var checked = state.filters.modality.has(mod) ? 'checked' : '';
            html +=
                '<label class="bda-filter-option">' +
                    '<input type="checkbox" data-filter="modality" value="' + mod + '" ' + checked + '>' +
                    '<span class="bda-filter-modality-marker bda-mm-' + mod + '" aria-hidden="true"></span>' +
                    '<span>' + getModalityLabel(mod) + '</span>' +
                '</label>';
        });

        PENDING_MODALITIES.forEach(function (mod) {
            html +=
                '<label class="bda-filter-option is-disabled">' +
                    '<input type="checkbox" disabled aria-disabled="true">' +
                    '<span class="bda-filter-modality-marker bda-mm-' + mod + ' is-pending" aria-hidden="true"></span>' +
                    '<span>' + getModalityLabel(mod) +
                        '<span class="bda-filter-pending-tag">(pending)</span>' +
                    '</span>' +
                '</label>';
        });

        dom.filterModality.innerHTML = html;
    }

    function buildCategoryFilter() {
        // Schema values: primary, archival, secondary
        var cats = ['primary', 'archival', 'secondary'];
        var counts = countByField('category');
        var html = '';

        cats.forEach(function (cat) {
            var n = counts[cat] || 0;
            if (n === 0) return; // Hide empty categories
            var checked = state.filters.category.has(cat) ? 'checked' : '';
            var label = cat.charAt(0).toUpperCase() + cat.slice(1);
            html +=
                '<label class="bda-filter-option">' +
                    '<input type="checkbox" data-filter="category" value="' + cat + '" ' + checked + '>' +
                    '<span>' + label +
                        ' <span class="bda-filter-pending-tag">(' + n + ')</span>' +
                    '</span>' +
                '</label>';
        });

        dom.filterCategory.innerHTML = html;
    }

    function buildFigureFilter() {
        // Sort figures alphabetically by name
        var figs = state.figures.slice().sort(function (a, b) {
            return a.name.localeCompare(b.name);
        });

        var html = '';
        figs.forEach(function (f) {
            var n = countSourcesForFigure(f.id);
            if (n === 0) return;
            var checked = state.filters.figure.has(f.id) ? 'checked' : '';
            html +=
                '<label class="bda-filter-option">' +
                    '<input type="checkbox" data-filter="figure" value="' + f.id + '" ' + checked + '>' +
                    '<span>' + escapeHtml(f.name) +
                        ' <span class="bda-filter-pending-tag">(' + n + ')</span>' +
                    '</span>' +
                '</label>';
        });

        dom.filterFigure.innerHTML = html;
    }

    function buildTypeFilter() {
        var counts = countByField('type');
        var types = Object.keys(counts).sort(function (a, b) {
            // Sort by count desc, then alpha
            if (counts[b] !== counts[a]) return counts[b] - counts[a];
            return a.localeCompare(b);
        });

        var html = '';
        types.forEach(function (type) {
            var label = formatTypeLabel(type);
            // Apply search filter
            if (state.typeSearchQuery &&
                label.toLowerCase().indexOf(state.typeSearchQuery) === -1 &&
                type.toLowerCase().indexOf(state.typeSearchQuery) === -1) {
                return;
            }
            var checked = state.filters.type.has(type) ? 'checked' : '';
            html +=
                '<label class="bda-filter-option">' +
                    '<input type="checkbox" data-filter="type" value="' + type + '" ' + checked + '>' +
                    '<span>' + label +
                        ' <span class="bda-filter-pending-tag">(' + counts[type] + ')</span>' +
                    '</span>' +
                '</label>';
        });

        dom.filterTypeList.innerHTML = html || '<p class="bda-sources-loading">No types match.</p>';
    }

    function buildRepositoryFilter() {
        var counts = countByField('repository');
        var repos = Object.keys(counts).sort(function (a, b) {
            // Put 'Unknown' variants at end, others alpha
            var aUnknown = /unknown/i.test(a);
            var bUnknown = /unknown/i.test(b);
            if (aUnknown !== bUnknown) return aUnknown ? 1 : -1;
            return a.localeCompare(b);
        });

        var html = '';
        repos.forEach(function (repo) {
            var checked = state.filters.repository.has(repo) ? 'checked' : '';
            html +=
                '<label class="bda-filter-option">' +
                    '<input type="checkbox" data-filter="repository" value="' + escapeHtml(repo) + '" ' + checked + '>' +
                    '<span>' + escapeHtml(repo) +
                        ' <span class="bda-filter-pending-tag">(' + counts[repo] + ')</span>' +
                    '</span>' +
                '</label>';
        });

        dom.filterRepo.innerHTML = html;
    }

    /* ========================================================================
       Counts (based on ALL sources — so filter counts stay stable as user
       toggles filters; this is the Airbnb/Zillow convention)
       ======================================================================== */

    function countByField(field) {
        var counts = {};
        state.sources.forEach(function (s) {
            var v = s[field];
            if (v == null || v === '') return;
            counts[v] = (counts[v] || 0) + 1;
        });
        return counts;
    }

    function countSourcesForFigure(figId) {
        var n = 0;
        state.sources.forEach(function (s) {
            if (s.figure_ids && s.figure_ids.indexOf(figId) !== -1) n += 1;
        });
        return n;
    }

    /* ========================================================================
       Event binding
       ======================================================================== */

    function bindEvents() {
        // Delegate checkbox changes on the whole filter rail
        dom.filterRail.addEventListener('change', function (e) {
            var t = e.target;
            if (t.tagName !== 'INPUT' || t.type !== 'checkbox') return;
            var filterKey = t.dataset.filter;
            if (!filterKey) return;
            if (t.checked) state.filters[filterKey].add(t.value);
            else state.filters[filterKey].delete(t.value);
            render();
            updateUrlFromState();
        });

        // Collapsible filter groups
        dom.filterRail.addEventListener('click', function (e) {
            var btn = e.target.closest('.bda-filter-collapse-btn');
            if (!btn) return;
            var targetId = btn.dataset.target;
            var panel = document.getElementById(targetId);
            if (!panel) return;
            var isOpen = btn.getAttribute('aria-expanded') === 'true';
            btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
            panel.hidden = isOpen;
        });

        // Type-search
        if (dom.filterTypeSearch) {
            dom.filterTypeSearch.addEventListener('input', function (e) {
                state.typeSearchQuery = e.target.value.trim().toLowerCase();
                buildTypeFilter();
            });
        }

        // Sort
        dom.sortSelect.addEventListener('change', function (e) {
            state.sort = e.target.value;
            render();
            updateUrlFromState();
        });

        // Reset buttons
        dom.resetBtn.addEventListener('click', resetFilters);
        if (dom.emptyStateReset) {
            dom.emptyStateReset.addEventListener('click', resetFilters);
        }

        // Mobile filter toggle
        if (dom.mobileToggle) {
            dom.mobileToggle.addEventListener('click', function () {
                var isOpen = dom.mobileToggle.getAttribute('aria-expanded') === 'true';
                dom.mobileToggle.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
                dom.filterRail.classList.toggle('is-open', !isOpen);
            });
        }

        // Active-filter chip removal (delegated)
        dom.activeFilters.addEventListener('click', function (e) {
            var btn = e.target.closest('.bda-filter-chip-remove');
            if (!btn) return;
            var filterKey = btn.dataset.filter;
            var value = btn.dataset.value;
            if (state.filters[filterKey]) {
                state.filters[filterKey].delete(value);
                // Sync checkbox state in rail
                var cb = dom.filterRail.querySelector(
                    'input[data-filter="' + filterKey + '"][value="' + cssEscape(value) + '"]'
                );
                if (cb) cb.checked = false;
                render();
                updateUrlFromState();
            }
        });

        // Browser back/forward
        window.addEventListener('popstate', function () {
            hydrateFiltersFromURL();
            // Rebuild filter rail to reflect new checkbox states
            buildFilterRail();
            render();
        });
    }

    function resetFilters() {
        Object.keys(state.filters).forEach(function (k) {
            state.filters[k].clear();
        });
        state.typeSearchQuery = '';
        if (dom.filterTypeSearch) dom.filterTypeSearch.value = '';
        buildFilterRail();
        render();
        updateUrlFromState();
    }

    /* ========================================================================
       Filtering + sorting
       ======================================================================== */

    function applyFilters() {
        return state.sources.filter(function (s) {
            // Modality: keep if ANY associated figure's modality is active-in-filter
            if (state.filters.modality.size > 0) {
                var ok = false;
                if (s.figure_ids) {
                    for (var i = 0; i < s.figure_ids.length; i++) {
                        var fig = state.figureById[s.figure_ids[i]];
                        if (fig && state.filters.modality.has(fig.modality)) {
                            ok = true;
                            break;
                        }
                    }
                }
                if (!ok) return false;
            }

            if (state.filters.category.size > 0 &&
                !state.filters.category.has(s.category)) return false;

            if (state.filters.figure.size > 0) {
                var ok2 = false;
                if (s.figure_ids) {
                    for (var j = 0; j < s.figure_ids.length; j++) {
                        if (state.filters.figure.has(s.figure_ids[j])) {
                            ok2 = true;
                            break;
                        }
                    }
                }
                if (!ok2) return false;
            }

            if (state.filters.type.size > 0 &&
                !state.filters.type.has(s.type)) return false;

            if (state.filters.repository.size > 0 &&
                !state.filters.repository.has(s.repository)) return false;

            return true;
        });
    }

    function applySort(sources) {
        var out = sources.slice();
        var sort = state.sort;

        out.sort(function (a, b) {
            if (sort === 'title-az' || sort === 'title-za') {
                var cmp = (a.title || '').localeCompare(b.title || '');
                return sort === 'title-az' ? cmp : -cmp;
            }
            if (sort === 'year-asc' || sort === 'year-desc') {
                var ya = a.year == null ? -Infinity : a.year;
                var yb = b.year == null ? -Infinity : b.year;
                if (ya === yb) return (a.title || '').localeCompare(b.title || '');
                return sort === 'year-asc' ? ya - yb : yb - ya;
            }
            // figure-az / figure-za
            var fa = primaryFigureName(a);
            var fb = primaryFigureName(b);
            var fcmp = fa.localeCompare(fb);
            if (fcmp !== 0) return sort === 'figure-az' ? fcmp : -fcmp;
            return (a.title || '').localeCompare(b.title || '');
        });

        return out;
    }

    function primaryFigureName(src) {
        if (src.figure_ids && src.figure_ids.length > 0) {
            var fig = state.figureById[src.figure_ids[0]];
            if (fig) return fig.name;
        }
        return 'zzz'; // Sort unattached sources last in A–Z
    }

    /* ========================================================================
       Rendering
       ======================================================================== */

    function render() {
        var filtered = applyFilters();
        var sorted = applySort(filtered);

        renderCount(sorted.length, state.sources.length);
        renderActiveChips();
        renderActiveFilterBadges();
        renderGrid(sorted);
        renderSrTable(sorted);
        updateResetState();
    }

    function renderCount(shown, total) {
        var html;
        if (shown === total) {
            html = 'Showing <strong>' + total + '</strong> sources';
        } else {
            html = 'Showing <strong>' + shown + '</strong> of ' + total + ' sources';
        }
        dom.count.innerHTML = html;
    }

    function renderActiveChips() {
        var chips = [];

        state.filters.modality.forEach(function (v) {
            chips.push(buildChip('modality', v, 'Modality', getModalityLabel(v)));
        });
        state.filters.category.forEach(function (v) {
            chips.push(buildChip('category', v, 'Category',
                v.charAt(0).toUpperCase() + v.slice(1)));
        });
        state.filters.figure.forEach(function (v) {
            var f = state.figureById[v];
            chips.push(buildChip('figure', v, 'Figure', f ? f.name : v));
        });
        state.filters.type.forEach(function (v) {
            chips.push(buildChip('type', v, 'Type', formatTypeLabel(v)));
        });
        state.filters.repository.forEach(function (v) {
            chips.push(buildChip('repository', v, 'Repository', v));
        });

        if (chips.length === 0) {
            dom.activeFilters.hidden = true;
            dom.activeFilters.innerHTML = '';
        } else {
            dom.activeFilters.hidden = false;
            dom.activeFilters.innerHTML = chips.join('');
        }
    }

    function buildChip(filterKey, value, labelKey, labelValue) {
        return (
            '<span class="bda-filter-chip">' +
                '<span class="bda-filter-chip-label">' + labelKey + ':</span> ' +
                escapeHtml(labelValue) +
                '<button type="button" class="bda-filter-chip-remove" ' +
                    'data-filter="' + filterKey + '" data-value="' + escapeHtml(value) + '" ' +
                    'aria-label="Remove ' + labelKey + ' filter: ' + escapeHtml(labelValue) + '">' +
                    '×' +
                '</button>' +
            '</span>'
        );
    }

    function renderActiveFilterBadges() {
        // Legend-badge counts + mobile toggle badge
        var figCt = state.filters.figure.size;
        var typeCt = state.filters.type.size;
        var repoCt = state.filters.repository.size;
        var totalCt = figCt + typeCt + repoCt +
                      state.filters.modality.size + state.filters.category.size;

        dom.figureCount.textContent = figCt > 0 ? figCt : '';
        dom.typeCount.textContent = typeCt > 0 ? typeCt : '';
        dom.repoCount.textContent = repoCt > 0 ? repoCt : '';

        if (dom.activeCount) {
            dom.activeCount.textContent = totalCt > 0 ? totalCt : '';
        }
    }

    function updateResetState() {
        var any =
            state.filters.modality.size +
            state.filters.category.size +
            state.filters.figure.size +
            state.filters.type.size +
            state.filters.repository.size > 0;
        dom.resetBtn.disabled = !any;
    }

    function renderGrid(sources) {
        dom.grid.setAttribute('aria-busy', 'false');

        if (sources.length === 0) {
            dom.grid.innerHTML = '';
            dom.grid.hidden = true;
            dom.emptyState.hidden = false;
            return;
        }

        dom.emptyState.hidden = true;
        dom.grid.hidden = false;
        dom.grid.innerHTML = sources.map(renderCard).join('');
    }

    function renderCard(src) {
        var glyph = TYPE_TO_GLYPH[src.type] || 'doc';
        var figureLabel = buildCardFigureLabel(src);
        var yearLabel = src.year ? src.year : '';
        var typeLabel = formatTypeLabel(src.type);
        var metaLine = [typeLabel, yearLabel].filter(Boolean).join(' · ');

        var href = SOURCE_ROUTE_PREFIX + slugifyId(src.id) + '/';

        var categoryBadge = '';
        if (src.category) {
            categoryBadge =
                '<span class="bda-source-card-category bda-cat-' + src.category + '">' +
                    src.category.charAt(0).toUpperCase() + src.category.slice(1) +
                '</span>';
        }

        var externalBadge = '';
        if (src.url && !src.repository) {
            externalBadge = '<span class="bda-source-card-external" aria-hidden="true">External</span>';
        }

        return (
            '<a class="bda-source-card" href="' + href + '" ' +
               'aria-label="' + escapeHtml(src.title) +
               (figureLabel ? ' — ' + escapeHtml(figureLabel) : '') +
               (yearLabel ? ' (' + yearLabel + ')' : '') + '">' +
                '<div class="bda-source-card-thumb">' +
                    categoryBadge +
                    externalBadge +
                    '<div class="bda-source-thumb-glyph bda-thumb-' + glyph + '" aria-hidden="true"></div>' +
                '</div>' +
                '<div class="bda-source-card-info">' +
                    '<h3 class="bda-source-card-title">' + escapeHtml(src.title) + '</h3>' +
                    (figureLabel
                        ? '<p class="bda-source-card-figure">' + escapeHtml(figureLabel) + '</p>'
                        : '') +
                    (metaLine
                        ? '<p class="bda-source-card-meta">' + escapeHtml(metaLine) + '</p>'
                        : '') +
                '</div>' +
            '</a>'
        );
    }

    function buildCardFigureLabel(src) {
        if (!src.figure_ids || src.figure_ids.length === 0) return '';
        var names = src.figure_ids
            .map(function (id) {
                var f = state.figureById[id];
                return f ? f.name : null;
            })
            .filter(Boolean);
        if (names.length === 0) return '';
        if (names.length === 1) return names[0];
        if (names.length === 2) return names.join(' & ');
        return names[0] + ' +' + (names.length - 1);
    }

    function renderSrTable(sources) {
        var rows = sources.map(function (s) {
            var figLabel = buildCardFigureLabel(s) || '—';
            var typeLabel = formatTypeLabel(s.type);
            var year = s.year || '—';
            var repo = s.repository || '—';
            return (
                '<tr>' +
                    '<th scope="row">' + escapeHtml(s.title) + '</th>' +
                    '<td>' + escapeHtml(figLabel) + '</td>' +
                    '<td>' + escapeHtml(typeLabel) + '</td>' +
                    '<td>' + escapeHtml(String(year)) + '</td>' +
                    '<td>' + escapeHtml(repo) + '</td>' +
                '</tr>'
            );
        }).join('');
        dom.srTbody.innerHTML = rows;
    }

    /* ========================================================================
       URL state (shareable deep links)
       Querystring params: m (modality), c (category), f (figure),
       t (type), r (repository), sort. Multi-value params use commas.
       ======================================================================== */

    function hydrateFiltersFromURL() {
        var params = new URLSearchParams(window.location.search);

        setFromParam(params, 'm', 'modality');
        setFromParam(params, 'c', 'category');
        setFromParam(params, 'f', 'figure');
        setFromParam(params, 't', 'type');
        setFromParam(params, 'r', 'repository');

        var sort = params.get('sort');
        if (sort) {
            state.sort = sort;
            if (dom.sortSelect) dom.sortSelect.value = sort;
        }
    }

    function setFromParam(params, key, filterKey) {
        var raw = params.get(key);
        state.filters[filterKey].clear();
        if (!raw) return;
        raw.split(',').forEach(function (v) {
            if (v) state.filters[filterKey].add(decodeURIComponent(v));
        });
    }

    function updateUrlFromState() {
        var params = new URLSearchParams();
        pushParam(params, 'm', state.filters.modality);
        pushParam(params, 'c', state.filters.category);
        pushParam(params, 'f', state.filters.figure);
        pushParam(params, 't', state.filters.type);
        pushParam(params, 'r', state.filters.repository);
        if (state.sort && state.sort !== 'figure-az') {
            params.set('sort', state.sort);
        }
        var qs = params.toString();
        var newUrl = window.location.pathname + (qs ? '?' + qs : '');
        window.history.replaceState(null, '', newUrl);
    }

    function pushParam(params, key, set) {
        if (set.size === 0) return;
        var values = [];
        set.forEach(function (v) { values.push(encodeURIComponent(v)); });
        params.set(key, values.join(','));
    }

    /* ========================================================================
       Helpers
       ======================================================================== */

    function getModalityLabel(mod) {
        if (typeof window.getModalityConfig === 'function') {
            try {
                var cfg = window.getModalityConfig(mod);
                if (cfg && cfg.label) return cfg.label;
            } catch (e) { /* fall through */ }
        }
        return MODALITY_LABELS_FALLBACK[mod] || mod;
    }

    function slugifyId(id) {
        return String(id).toLowerCase().replace(/_/g, '-');
    }

    function escapeHtml(s) {
        if (s == null) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Minimal CSS.escape polyfill for attribute selectors
    function cssEscape(s) {
        if (window.CSS && window.CSS.escape) return window.CSS.escape(s);
        return String(s).replace(/[^a-zA-Z0-9_-]/g, function (c) {
            return '\\' + c;
        });
    }

})();
