/**
 * bda-figures-lp.js
 *
 * Page-specific script for the Figures landing page at /archive/figures/.
 * Renders a filterable, sortable, modality-grouped grid of every figure in
 * the archive.
 *
 * Filter: modality (single dimension — active checkboxes + pending disabled)
 * Sort:   name-az (default), name-za, score-desc, emergence-asc
 * Display: modality-grouped (.bda-figures-grouped)
 * Cards:   link to /archive/figures/entries/[figure_id]/  (folder-based routing)
 *
 * Runs only on the figures landing page. Loads after scripts.js and
 * bda-partials-loader.js. Consumes window.getModalityConfig() from
 * scripts.js with an inline fallback.
 *
 * WCAG 2.2 Level AA compliant.
 */
(function () {
    'use strict';

    // ---------------------------------------------------------------------
    // Constants
    // ---------------------------------------------------------------------

    var DATA_URL = '/data/detroit.json';

    var ACTIVE_MODALITIES = ['detective', 'revolutionary', 'superhero_villain'];
    var PENDING_MODALITIES = ['gangsta_pimp', 'folk_hero_outlaw'];

    var FIGURE_ROUTE_PREFIX = '/archive/figures/entries/';

    var MODALITY_LABELS_FALLBACK = {
        detective: 'Detective',
        revolutionary: 'Revolutionary',
        superhero_villain: 'Superhero-Villain',
        gangsta_pimp: 'Gangsta-Pimp',
        folk_hero_outlaw: 'Folk Hero-Outlaw'
    };

    var DEFAULT_SORT = 'name-az';

    // ---------------------------------------------------------------------
    // State
    // ---------------------------------------------------------------------

    var state = {
        figures: [],           // All non-placeholder figures
        filters: {
            modality: new Set()
        },
        sort: DEFAULT_SORT
    };

    // ---------------------------------------------------------------------
    // DOM references
    // ---------------------------------------------------------------------

    var dom = {};

    function cacheDom() {
        dom.grid = document.getElementById('bda-figures-grid');
        dom.count = document.getElementById('bda-figures-count');
        dom.emptyState = document.getElementById('bda-figures-empty');
        dom.emptyReset = document.getElementById('bda-figures-empty-reset');
        dom.sort = document.getElementById('bda-figures-sort');
        dom.activeFilters = document.getElementById('bda-figures-active-filters');
        dom.srTableBody = document.getElementById('bda-figures-sr-tbody');
        dom.filterReset = document.getElementById('bda-filter-reset');
        dom.activeCount = document.getElementById('bda-figures-active-count');

        dom.filterModality = document.getElementById('bda-filter-modality');

        dom.filterToggle = document.getElementById('bda-figures-filter-toggle');
        dom.filterRail = document.getElementById('bda-figures-filter-rail');
    }

    // ---------------------------------------------------------------------
    // Helpers (escapeHtml comes from scripts.js; include defensive inline
    // fallback in case this file loads before scripts.js for any reason)
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

    function cssEscape(s) {
        if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
            return CSS.escape(s);
        }
        return String(s).replace(/([^\w-])/g, '\\$1');
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

    function calcScore(figure) {
        if (typeof window.calculateBadmanScore === 'function') {
            try { return window.calculateBadmanScore(figure.scores); }
            catch (e) { /* fall through */ }
        }
        if (!figure.scores) return 0;
        var criteria = [
            'outlaw_relationship',
            'community_authorization',
            'violence_as_language',
            'cultural_preservation',
            'hypermasculine_performance'
        ];
        var total = 0;
        for (var i = 0; i < criteria.length; i++) {
            var c = figure.scores[criteria[i]];
            if (c && typeof c.score === 'number') total += c.score;
        }
        return total;
    }

    function formatType(figure) {
        if (figure.meta_badman === true) return 'Meta-Badman';
        if (!figure.type) return '';
        return figure.type.charAt(0).toUpperCase() + figure.type.slice(1);
    }

    function eraString(figure) {
        var y = figure.years || {};
        var start = y.birth || y.active_start;
        var end = y.death || y.active_end;
        if (start && end) return start + ' \u2013 ' + end;
        if (start) return start + ' \u2013 present';
        return '';
    }

    function oneLineDescriptor(figure) {
        // Take the first sentence of the biography description, capped at ~140 chars.
        var desc = (figure.biography && figure.biography.description) || '';
        if (!desc) return '';
        // First sentence split on period, question, or em-dash
        var match = desc.match(/^[^.?!]+[.?!]/);
        var sentence = match ? match[0].trim() : desc;
        if (sentence.length > 140) sentence = sentence.substring(0, 137).trim() + '\u2026';
        return sentence;
    }

    function emergenceYear(figure) {
        if (figure.emergence && typeof figure.emergence.year === 'number') return figure.emergence.year;
        if (figure.years && typeof figure.years.active_start === 'number') return figure.years.active_start;
        return Infinity;
    }

    // ---------------------------------------------------------------------
    // Data loading
    // ---------------------------------------------------------------------

    function loadData() {
        if (typeof window.loadArchiveData === 'function') {
            return window.loadArchiveData(DATA_URL);
        }
        // Fallback if scripts.js didn't load
        return fetch(DATA_URL).then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        });
    }

    function processData(data) {
        var figures = (data && Array.isArray(data.figures)) ? data.figures : [];
        state.figures = figures.filter(function (f) {
            return f && !f._placeholder && f.id && f.modality;
        });
    }

    function renderLoadError() {
        if (!dom.grid) return;
        dom.grid.innerHTML =
            '<p class="bda-figures-loading" role="alert">' +
                'Could not load figures. Please try again.' +
            '</p>';
        dom.grid.hidden = false;
        if (dom.emptyState) dom.emptyState.hidden = true;
    }

    // ---------------------------------------------------------------------
    // URL state
    // ---------------------------------------------------------------------

    function hydrateFiltersFromURL() {
        var params = new URLSearchParams(window.location.search);
        var m = params.get('m');
        if (m) {
            m.split(',').forEach(function (v) {
                v = v.trim();
                if (v) state.filters.modality.add(v);
            });
        }
        var sortParam = params.get('sort');
        if (sortParam) state.sort = sortParam;
    }

    function updateUrlFromState() {
        var params = new URLSearchParams();
        var modValues = Array.from(state.filters.modality);
        if (modValues.length > 0) params.set('m', modValues.join(','));
        if (state.sort && state.sort !== DEFAULT_SORT) params.set('sort', state.sort);

        var qs = params.toString();
        var newUrl = window.location.pathname + (qs ? '?' + qs : '');
        try { history.replaceState(null, '', newUrl); }
        catch (e) { /* non-fatal */ }
    }

    // ---------------------------------------------------------------------
    // Counts
    // ---------------------------------------------------------------------

    function countByModality(mod) {
        var n = 0;
        state.figures.forEach(function (f) { if (f.modality === mod) n++; });
        return n;
    }

    // ---------------------------------------------------------------------
    // Filter rail
    // ---------------------------------------------------------------------

    function buildFilterRail() {
        buildModalityFilter();
        updateFilterCountBadges();
    }

    function buildModalityFilter() {
        if (!dom.filterModality) return;
        var html = '';

        ACTIVE_MODALITIES.forEach(function (mod) {
            var label = getModalityLabel(mod);
            var suffix = modalityToCssSuffix(mod);
            var count = countByModality(mod);
            var checked = state.filters.modality.has(mod) ? ' checked' : '';
            html +=
                '<label class="bda-filter-option">' +
                    '<input type="checkbox" data-filter="modality" value="' + esc(mod) + '"' + checked + '>' +
                    '<span class="bda-filter-modality-marker bda-mm-' + esc(suffix) + '" aria-hidden="true"></span>' +
                    '<span>' + esc(label) + ' <span class="bda-filter-pending-tag">(' + count + ')</span></span>' +
                '</label>';
        });

        PENDING_MODALITIES.forEach(function (mod) {
            var label = getModalityLabel(mod);
            var suffix = modalityToCssSuffix(mod);
            html +=
                '<label class="bda-filter-option is-disabled">' +
                    '<input type="checkbox" disabled aria-disabled="true">' +
                    '<span class="bda-filter-modality-marker bda-mm-' + esc(suffix) + ' is-pending" aria-hidden="true"></span>' +
                    '<span>' + esc(label) + ' <span class="bda-filter-pending-tag">(pending)</span></span>' +
                '</label>';
        });

        dom.filterModality.innerHTML = html;
    }

    function updateFilterCountBadges() {
        var badge = document.getElementById('bda-filter-modality-count');
        if (badge) {
            var n = state.filters.modality.size;
            badge.textContent = n > 0 ? '(' + n + ')' : '';
        }
        if (dom.activeCount) {
            var total = state.filters.modality.size;
            dom.activeCount.textContent = total > 0 ? '(' + total + ')' : '';
        }
    }

    // ---------------------------------------------------------------------
    // Filtering + sorting
    // ---------------------------------------------------------------------

    function applyFilters() {
        return state.figures.filter(function (f) {
            if (!ACTIVE_MODALITIES.includes(f.modality)) return false;
            if (state.filters.modality.size > 0 && !state.filters.modality.has(f.modality)) return false;
            return true;
        });
    }

    function applySort(list) {
        var sorted = list.slice();

        function byName(a, b) {
            return String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' });
        }

        switch (state.sort) {
            case 'name-az':
                sorted.sort(byName);
                break;
            case 'name-za':
                sorted.sort(function (a, b) { return byName(b, a); });
                break;
            case 'score-desc':
                sorted.sort(function (a, b) {
                    var cmp = calcScore(b) - calcScore(a);
                    return cmp !== 0 ? cmp : byName(a, b);
                });
                break;
            case 'emergence-asc':
                sorted.sort(function (a, b) {
                    var cmp = emergenceYear(a) - emergenceYear(b);
                    return cmp !== 0 ? cmp : byName(a, b);
                });
                break;
        }

        return sorted;
    }

    // ---------------------------------------------------------------------
    // Card + group rendering
    // ---------------------------------------------------------------------

    function renderCard(figure) {
        var typeLabel = formatType(figure);
        var typeClass = figure.type === 'fictional' ? 'bda-type-fictional' : 'bda-type-real';
        var era = eraString(figure);
        var descriptor = oneLineDescriptor(figure);
        var score = calcScore(figure);

        var metaBadmanBadge = figure.meta_badman
            ? '<span class="bda-figure-card-meta-badge">Meta-Badman</span>'
            : '';

        var href = FIGURE_ROUTE_PREFIX + encodeURIComponent(figure.id) + '/';

        // Composed aria-label: "Name — Type (Era), Badman score X of 25"
        var ariaParts = [figure.name];
        if (typeLabel) ariaParts.push('\u2014 ' + typeLabel);
        if (era) ariaParts.push('(' + era + ')');
        ariaParts.push(', Badman score ' + score + ' of 25');
        var ariaLabel = ariaParts.join(' ');

        return '' +
            '<li>' +
                '<a class="bda-figure-card" href="' + esc(href) + '" aria-label="' + esc(ariaLabel) + '">' +
                    '<div class="bda-figure-card-thumb">' +
                        '<span class="bda-figure-card-type-badge ' + typeClass + '">' + esc(typeLabel) + '</span>' +
                        metaBadmanBadge +
                    '</div>' +
                    '<div class="bda-figure-card-info">' +
                        '<h3 class="bda-figure-card-title">' + esc(figure.name) + '</h3>' +
                        (era ? '<p class="bda-figure-card-era">' + esc(era) + '</p>' : '') +
                        (descriptor ? '<p class="bda-figure-card-descriptor">' + esc(descriptor) + '</p>' : '') +
                        '<p class="bda-figure-card-score">' +
                            '<span class="bda-score-value">' + score + '</span>' +
                            '<span class="bda-score-total"> / 25</span>' +
                        '</p>' +
                    '</div>' +
                '</a>' +
            '</li>';
    }

    function renderGroup(modality, figures) {
        var label = getModalityLabel(modality);
        var suffix = modalityToCssSuffix(modality);

        return '' +
            '<section class="bda-figure-modality-group">' +
                '<h2 class="bda-figure-modality-heading">' +
                    '<span class="bda-filter-modality-marker bda-mm-' + esc(suffix) + '" aria-hidden="true"></span>' +
                    esc(label) + ' ' +
                    '<span class="bda-figure-modality-count">(' + figures.length + ')</span>' +
                '</h2>' +
                '<ul class="bda-figure-card-list">' +
                    figures.map(renderCard).join('') +
                '</ul>' +
            '</section>';
    }

    function renderSrTableRow(figure) {
        return '' +
            '<tr>' +
                '<th scope="row">' + esc(figure.name) + '</th>' +
                '<td>' + esc(getModalityLabel(figure.modality)) + '</td>' +
                '<td>' + esc(formatType(figure)) + '</td>' +
                '<td>' + esc(eraString(figure) || '\u2014') + '</td>' +
                '<td>' + calcScore(figure) + '/25</td>' +
            '</tr>';
    }

    function renderActiveChips() {
        if (!dom.activeFilters) return;
        var chips = [];
        state.filters.modality.forEach(function (val) {
            var label = getModalityLabel(val);
            chips.push(
                '<span class="bda-filter-chip">' +
                    '<span class="bda-filter-chip-label">Modality:</span> ' +
                    esc(label) + ' ' +
                    '<button type="button" class="bda-filter-chip-remove" ' +
                            'data-filter="modality" data-value="' + esc(val) + '" ' +
                            'aria-label="Remove Modality filter: ' + esc(label) + '">' +
                        '\u00d7' +
                    '</button>' +
                '</span>'
            );
        });
        dom.activeFilters.innerHTML = chips.join('');
    }

    function updateCount(shown, total) {
        if (!dom.count) return;
        if (shown === total) {
            dom.count.textContent = 'Showing all ' + total + ' figure' + (total === 1 ? '' : 's') + '.';
        } else {
            dom.count.textContent = 'Showing ' + shown + ' of ' + total + ' figures.';
        }
    }

    // ---------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------

    function render() {
        if (!dom.grid) return;

        var filtered = applyFilters();
        var sorted = applySort(filtered);

        // Group by modality. Preserve ACTIVE_MODALITIES order for stable heading sequence.
        var groups = {};
        ACTIVE_MODALITIES.forEach(function (mod) { groups[mod] = []; });
        sorted.forEach(function (f) {
            if (groups[f.modality]) groups[f.modality].push(f);
        });

        // Total for count display: all ACTIVE_MODALITIES figures regardless of filter
        var totalActive = state.figures.filter(function (f) {
            return ACTIVE_MODALITIES.includes(f.modality);
        }).length;

        updateCount(sorted.length, totalActive);
        renderActiveChips();
        updateFilterCountBadges();

        if (sorted.length === 0) {
            dom.grid.innerHTML = '';
            dom.grid.hidden = true;
            if (dom.emptyState) dom.emptyState.hidden = false;
        } else {
            var html = '';
            ACTIVE_MODALITIES.forEach(function (mod) {
                if (groups[mod].length > 0) {
                    html += renderGroup(mod, groups[mod]);
                }
            });
            dom.grid.innerHTML = html;
            dom.grid.hidden = false;
            if (dom.emptyState) dom.emptyState.hidden = true;
        }

        if (dom.srTableBody) {
            dom.srTableBody.innerHTML = sorted.map(renderSrTableRow).join('');
        }
    }

    // ---------------------------------------------------------------------
    // Mutations
    // ---------------------------------------------------------------------

    function toggleFilter(value, checked) {
        if (checked) state.filters.modality.add(value);
        else state.filters.modality.delete(value);
        render();
        updateUrlFromState();
    }

    function removeFilter(value) {
        state.filters.modality.delete(value);
        if (dom.filterRail) {
            var sel = 'input[type="checkbox"][data-filter="modality"][value="' + cssEscape(value) + '"]';
            var input = dom.filterRail.querySelector(sel);
            if (input) input.checked = false;
        }
        render();
        updateUrlFromState();
    }

    function resetFilters() {
        state.filters.modality.clear();
        buildFilterRail();
        render();
        updateUrlFromState();
    }

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    function bindEvents() {
        if (dom.filterRail) {
            dom.filterRail.addEventListener('change', function (e) {
                var t = e.target;
                if (!t || t.tagName !== 'INPUT' || t.type !== 'checkbox') return;
                var dim = t.getAttribute('data-filter');
                if (dim !== 'modality') return;
                toggleFilter(t.value, t.checked);
            });

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

        if (dom.sort) {
            dom.sort.addEventListener('change', function (e) {
                state.sort = e.target.value || DEFAULT_SORT;
                render();
                updateUrlFromState();
            });
        }

        if (dom.filterReset) {
            dom.filterReset.addEventListener('click', resetFilters);
        }
        if (dom.emptyReset) {
            dom.emptyReset.addEventListener('click', resetFilters);
        }

        if (dom.filterToggle && dom.filterRail) {
            dom.filterToggle.addEventListener('click', function () {
                var isOpen = dom.filterRail.classList.toggle('is-open');
                dom.filterToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            });
        }

        if (dom.activeFilters) {
            dom.activeFilters.addEventListener('click', function (e) {
                var btn = e.target.closest && e.target.closest('.bda-filter-chip-remove');
                if (!btn) return;
                var val = btn.getAttribute('data-value');
                if (val === null) return;
                removeFilter(val);
            });
        }

        window.addEventListener('popstate', function () {
            state.filters.modality.clear();
            state.sort = DEFAULT_SORT;
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
        if (!dom.grid || !dom.filterRail) return;

        loadData().then(function (data) {
            if (!data) {
                renderLoadError();
                return;
            }
            processData(data);
            hydrateFiltersFromURL();
            if (dom.sort && state.sort) dom.sort.value = state.sort;
            buildFilterRail();
            bindEvents();
            render();
        }).catch(function (err) {
            if (window.console && console.error) {
                console.error('bda-figures-lp.js: failed to load data', err);
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
