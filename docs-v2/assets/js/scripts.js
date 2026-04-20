/**
 * scripts.js
 *
 * Site-wide shared JavaScript for the Detroit Badman Digital Archive.
 *
 * This file is a utility library, not a page bootstrapper. Functions are
 * defined on the window/global scope for use by page-specific scripts and
 * inline scripts in map.html / network.html. Nothing here runs on
 * DOMContentLoaded except a debug confirmation log and the Bootstrap
 * dropdown re-init listener that wires into bda:partials-loaded.
 *
 * Authority boundaries:
 *   - scripts.js does NOT handle nav highlighting (partials loader owns that)
 *   - scripts.js does NOT render site chrome (partials loader owns that)
 *   - scripts.js DOES provide utilities page scripts call
 *   - scripts.js DOES build detail panel content for map/network/sr-table
 *
 * Style rule: No hardcoded hex colors anywhere. All colors resolve to CSS
 * variables via classes defined in styles.css. No inline style="..." on any
 * emitted HTML.
 *
 * WCAG 2.2 Level AA compliant. See JAVASCRIPT_DOCUMENTATION.md for the full
 * contract this file implements.
 */

// =============================================================================
// loadArchiveData — JSON fetch utility
// =============================================================================

/**
 * Fetch the archive JSON file.
 *
 * Returns parsed JSON on success; null on any failure. Downstream consumers
 * must handle the null return by rendering a user-visible error message
 * with role="alert" or aria-live="assertive".
 *
 * @param {string} url - Path to the JSON file (e.g., '/data/detroit.json')
 * @returns {Promise<object|null>}
 */
async function loadArchiveData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('HTTP error! status: ' + response.status);
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading archive data:', error);
        return null;
    }
}

// =============================================================================
// calculateBadmanScore — sum the five-criteria scores
// =============================================================================

/**
 * Sum the five badman criteria scores into a 1–25 total.
 *
 * Callers displaying the result must include unit context ("15/25") so
 * screen readers announce it meaningfully.
 *
 * @param {object} scores - Five-criteria scoring object from a figure
 * @returns {number} Integer 5–25
 */
function calculateBadmanScore(scores) {
    if (!scores) return 0;
    const criteria = [
        'outlaw_relationship',
        'community_authorization',
        'violence_as_language',
        'cultural_preservation',
        'hypermasculine_performance'
    ];
    let total = 0;
    for (let i = 0; i < criteria.length; i++) {
        const c = scores[criteria[i]];
        if (c && typeof c.score === 'number') {
            total += c.score;
        }
    }
    return total;
}

// =============================================================================
// formatFigureType — display string for type + meta_badman
// =============================================================================

/**
 * Format a figure's type for display.
 *
 * meta_badman=true takes precedence over type.
 *
 * @param {string} type - "real" | "fictional"
 * @param {boolean} [metaBadman=false]
 * @returns {string}
 */
function formatFigureType(type, metaBadman) {
    if (metaBadman === true) return 'Meta-Badman';
    if (!type) return '';
    return type.charAt(0).toUpperCase() + type.slice(1);
}

// =============================================================================
// getModalityConfig — single source of truth for modality visual identity
// =============================================================================

/**
 * Return the full visual identity configuration for a modality.
 *
 * This is the authoritative mapping of modality code → color, shape, icon,
 * and labels. The return object is consumed by:
 *   - Map marker generation (markerShape, color, icon)
 *   - Network node rendering (networkShape, color)
 *   - Filter UI (displayLabel)
 *   - Legends (legendLabel — shape-first description, WCAG 1.4.1)
 *   - Sources and figures landing pages (displayLabel for filter checkboxes)
 *
 * Why two labels? displayLabel is the clean name for filter UI and prose
 * contexts. legendLabel is the descriptive shape-first label required for
 * legend accessibility. Splitting them lets each surface use the right
 * string without compromise.
 *
 * Unknown modality codes return a neutral fallback with
 * displayLabel="Unknown Modality". Callers should not rely on the fallback;
 * all modalities in the archive should resolve to a real entry.
 *
 * @param {string} modality - Modality code from detroit.json
 * @returns {{color: string, markerShape: string, networkShape: string, icon: string, displayLabel: string, legendLabel: string}}
 */
function getModalityConfig(modality) {
    const configs = {
        detective: {
            color: '#3388ff',
            markerShape: 'circle',
            networkShape: 'circle',
            icon: 'magnifying-glass',
            displayLabel: 'Detective',
            legendLabel: 'Circle marker — Detective Modality'
        },
        revolutionary: {
            color: '#dc3545',
            markerShape: 'star',
            networkShape: 'diamond',
            icon: 'raised-fist',
            displayLabel: 'Revolutionary',
            legendLabel: 'Star marker — Revolutionary Modality'
        },
        superhero_villain: {
            color: '#fd7e14',
            markerShape: 'hexagon',
            networkShape: 'hexagon',
            icon: 'lightning-bolt',
            displayLabel: 'Superhero-Villain',
            legendLabel: 'Hexagon marker — Superhero-Villain Modality'
        },
        gangsta_pimp: {
            color: '#6f42c1',
            markerShape: 'square',
            networkShape: 'square',
            icon: 'dollar-sign',
            displayLabel: 'Gangsta-Pimp',
            legendLabel: 'Square marker — Gangsta-Pimp Modality'
        },
        folk_hero_outlaw: {
            color: '#d4af37',
            markerShape: 'triangle',
            networkShape: 'triangle',
            icon: 'triangle',
            displayLabel: 'Folk Hero-Outlaw',
            legendLabel: 'Triangle marker — Folk Hero-Outlaw Modality'
        }
    };

    return configs[modality] || {
        color: '#888888',
        markerShape: 'circle',
        networkShape: 'circle',
        icon: 'question',
        displayLabel: 'Unknown Modality',
        legendLabel: 'Unknown Modality'
    };
}

// =============================================================================
// getModalityColor — backward-compatibility shim
// =============================================================================

/**
 * Return just the hex color for a modality.
 *
 * Legacy shim for code paths that need only the color. New code should
 * call getModalityConfig() directly and destructure what it needs.
 *
 * @param {string} modality
 * @returns {string} Hex color
 */
function getModalityColor(modality) {
    return getModalityConfig(modality).color;
}

// =============================================================================
// escapeHtml — shared HTML-escape helper for user-facing strings
// =============================================================================

/**
 * Escape the five HTML-significant characters. Every user-facing string
 * interpolated into HTML must pass through this function.
 *
 * @param {*} s
 * @returns {string}
 */
function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// =============================================================================
// buildSourceLinks — accessible <ul> of source links
// =============================================================================

/**
 * Build an accessible HTML list of source links for detail panels.
 *
 * Output uses semantic <ul>/<li> (never <br> separators). Every link has
 * target="_blank", rel="noopener noreferrer", and an sr-only "(opens in
 * new tab)" span. Empty state renders a .source-links-empty paragraph.
 *
 * No inline styles. Link appearance is controlled by the in-prose link
 * rule in styles.css, which targets .source-link-item a.
 *
 * @param {Array<{url: string, title: string}>} sources
 * @returns {string} HTML string
 */
function buildSourceLinks(sources) {
    if (!sources || sources.length === 0) {
        return '<p class="source-links-empty">No sources available.</p>';
    }

    let html = '<ul class="source-links list-unstyled">';
    for (let i = 0; i < sources.length; i++) {
        const s = sources[i] || {};
        const url = s.url || '#';
        const title = s.title || 'Untitled source';
        html +=
            '<li class="source-link-item">' +
                '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">' +
                    escapeHtml(title) +
                    '<span class="sr-only"> (opens in new tab)</span>' +
                '</a>' +
            '</li>';
    }
    html += '</ul>';
    return html;
}

// =============================================================================
// showFigureDetails — shared detail panel builder
// =============================================================================

/**
 * Build and inject figure detail content into a shared detail panel.
 *
 * Called from:
 *   - Map marker clicks
 *   - Network node clicks
 *   - Sr-only data table row activations
 *
 * The panel container is expected to have aria-live="polite" and
 * aria-atomic="true" set in the page HTML (per HTML_TEMPLATES.md).
 * Content changes are announced automatically.
 *
 * After injection, programmatic focus moves to the panel so keyboard
 * users are oriented to the new content (WCAG 2.4.3 Focus Order).
 *
 * No inline styles anywhere in the output. Every class referenced must
 * be defined in styles.css:
 *   .figure-detail-name       — figure name <h3>
 *   .figure-detail-meta       — modality/type/era line container
 *   .figure-detail-score      — badman score line
 *   .figure-detail-short      — truncated description span
 *   .figure-detail-full       — full description span (hidden by default)
 *   .read-more-toggle         — expansion control
 *   .panel-divider            — <hr> before sources
 *   .panel-sources-heading    — "Sources" sub-heading
 *   .source-links             — <ul> list (via buildSourceLinks)
 *   .source-link-item         — <li> per source
 *   .source-links-empty       — no-sources <p>
 *
 * Source resolution: figure.sources.primary is expected to be an array of
 * full source objects the caller has already resolved from source_ids.
 * This separation keeps showFigureDetails() free of data-loading duties.
 *
 * @param {object} figure - Full figure object
 * @param {string} panelContentId - ID of inner content element (e.g., 'info-content')
 * @param {string} panelId - ID of outer panel container (e.g., 'info-panel')
 */
function showFigureDetails(figure, panelContentId, panelId) {
    const content = document.getElementById(panelContentId);
    const panel = document.getElementById(panelId);
    if (!content) return;

    const totalScore = calculateBadmanScore(figure.scores);
    const config = getModalityConfig(figure.modality);

    // Biography description and truncation
    const fullDesc = (figure.biography && figure.biography.description) || '';
    const shortDesc = fullDesc.length > 200 ? fullDesc.substring(0, 200) + '...' : fullDesc;
    const needsToggle = fullDesc.length > 200;

    // Era string
    const birth = figure.years && (figure.years.birth || figure.years.active_start);
    const death = figure.years && (figure.years.death || figure.years.active_end);
    const era = (birth ? birth : '?') + ' – ' + (death ? death : 'present');

    // Source resolution: caller may provide figure.sources.primary as an array
    // of source objects. If figure.sources is missing, buildSourceLinks handles
    // the empty case.
    let primarySources = [];
    if (figure.sources && Array.isArray(figure.sources.primary)) {
        primarySources = figure.sources.primary;
    } else if (Array.isArray(figure.sources)) {
        // Fallback: some callers pass a flat array already filtered to primary
        primarySources = figure.sources;
    }

    const typeLabel = formatFigureType(figure.type, figure.meta_badman);
    const metaBadmanLine = figure.meta_badman
        ? '<p class="figure-detail-meta-badman"><em>Meta-Badman</em></p>'
        : '';

    // Build panel HTML — no inline styles
    let html = '';
    html +=
        '<h3 class="figure-detail-name">' + escapeHtml(figure.name || 'Unknown figure') + '</h3>' +
        '<p class="figure-detail-meta">' +
            '<span class="figure-detail-modality">' + escapeHtml(config.displayLabel) + '</span>' +
            ' &middot; ' +
            '<span class="figure-detail-type">' + escapeHtml(typeLabel) + '</span>' +
            ' &middot; ' +
            '<span class="figure-detail-era">' + escapeHtml(era) + '</span>' +
        '</p>' +
        metaBadmanLine +
        '<p class="figure-detail-score">' +
            '<strong>Badman Score:</strong> ' + totalScore + '/25' +
        '</p>';

    // Description with read-more toggle
    if (fullDesc) {
        html +=
            '<p class="figure-detail-description">' +
                '<span class="figure-detail-short">' + escapeHtml(shortDesc) + '</span>' +
                '<span class="figure-detail-full" hidden>' + escapeHtml(fullDesc) + '</span>';
        if (needsToggle) {
            html +=
                ' <a href="#" class="read-more-toggle" ' +
                    'aria-label="Read more about ' + escapeHtml(figure.name || 'this figure') + '" ' +
                    'aria-expanded="false">' +
                    'Read more' +
                '</a>';
        }
        html += '</p>';
    }

    html +=
        '<hr class="panel-divider">' +
        '<h4 class="panel-sources-heading">Sources</h4>' +
        buildSourceLinks(primarySources);

    content.innerHTML = html;

    // Wire up the read-more toggle. `expanded` is local to this call — no
    // external state survives rebuilds.
    const toggle = content.querySelector('.read-more-toggle');
    if (toggle) {
        let expanded = false;
        const shortEl = content.querySelector('.figure-detail-short');
        const fullEl = content.querySelector('.figure-detail-full');
        const figureName = figure.name || 'this figure';

        toggle.addEventListener('click', function (e) {
            e.preventDefault();
            expanded = !expanded;
            if (expanded) {
                if (shortEl) shortEl.hidden = true;
                if (fullEl) fullEl.hidden = false;
                toggle.textContent = 'Show less';
                toggle.setAttribute('aria-label', 'Show less about ' + figureName);
                toggle.setAttribute('aria-expanded', 'true');
            } else {
                if (shortEl) shortEl.hidden = false;
                if (fullEl) fullEl.hidden = true;
                toggle.textContent = 'Read more';
                toggle.setAttribute('aria-label', 'Read more about ' + figureName);
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Move focus to the panel container so keyboard/screen reader users are
    // oriented to the new content.
    if (panel && typeof panel.focus === 'function') {
        panel.focus();
    }
}

// =============================================================================
// Bootstrap dropdown re-initialization after partials load
// =============================================================================
//
// The navbar partial is injected asynchronously by bda-partials-loader.js.
// Bootstrap's dropdown JavaScript scans the DOM on page load, which means any
// dropdown toggles inside the injected navbar are not wired. This listener
// re-initializes them once the partials-loaded event fires.
//
// WCAG 2.1.1 Keyboard + 2.4.3 Focus Order: without this, users cannot reach
// any page linked through a dropdown. Non-negotiable.

document.addEventListener('bda:partials-loaded', function () {
    if (typeof bootstrap === 'undefined' || !bootstrap.Dropdown) {
        console.warn('scripts.js: Bootstrap Dropdown unavailable; navbar dropdowns will not initialize');
        return;
    }
    const toggles = document.querySelectorAll('#bda-navbar [data-bs-toggle="dropdown"]');
    toggles.forEach(function (toggle) {
        try {
            new bootstrap.Dropdown(toggle);
        } catch (err) {
            console.warn('scripts.js: failed to initialize dropdown', err);
        }
    });
});

// =============================================================================
// Debug confirmation
// =============================================================================

window.addEventListener('DOMContentLoaded', function () {
    console.log('Detroit Badman Archive: scripts.js loaded');
});
