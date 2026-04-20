/**
 * Detroit Badman Archive
 * Site-wide shared utilities
 *
 * This file is a utility library, not a page bootstrapper.
 * Functions are consumed by page-specific scripts and by the
 * inline scripts in map.html and network.html.
 *
 * Authority boundaries:
 *   - scripts.js does NOT handle navigation active-state
 *     (that is bda-partials-loader.js's job — the navbar is
 *     not in the DOM when scripts.js runs).
 *   - scripts.js does NOT render site chrome.
 *   - scripts.js DOES provide shared utilities and builds
 *     dynamic detail panel content.
 *
 * All functions that touch the DOM follow the accessibility
 * patterns documented in JAVASCRIPT_DOCUMENTATION.md and
 * HTML_TEMPLATES.md. No hardcoded hex colors; no inline styles.
 * All visual properties come from CSS classes defined in styles.css.
 *
 * See JAVASCRIPT_DOCUMENTATION.md for the full specification.
 */

// ============================================
// Initialize on DOM load
// ============================================

window.addEventListener('DOMContentLoaded', () => {
    console.log('Detroit Badman Archive: scripts.js loaded');
});

// ============================================
// Bootstrap dropdown re-initialization
// ============================================

/**
 * Bootstrap's dropdown JS scans the DOM on page load. Because the
 * navbar is injected asynchronously by bda-partials-loader.js, the
 * dropdown toggles in navbar.html don't exist yet when Bootstrap runs.
 * This listener re-wires them once the partials have been injected.
 *
 * Without this block, every dropdown in the navbar is dead — a
 * WCAG 2.1.1 Keyboard and 2.4.3 Focus Order failure.
 *
 * See JAVASCRIPT_DOCUMENTATION.md § "The bda:partials-loaded event".
 */
document.addEventListener('bda:partials-loaded', () => {
    const dropdownToggles = document.querySelectorAll('#bda-navbar [data-bs-toggle="dropdown"]');
    dropdownToggles.forEach((toggle) => {
        new bootstrap.Dropdown(toggle);
    });
});

// ============================================
// Data loading
// ============================================

/**
 * Utility function to load JSON data.
 * Used by map, network, figures landing, sources landing, and individual figure pages.
 *
 * Returns null on any failure (network, non-2xx, parse error).
 * Downstream consumers must handle null by rendering a user-visible
 * error message with role="alert" or aria-live="assertive".
 *
 * @param {string} url - Path to JSON file
 * @returns {Promise<object|null>} - Parsed JSON data or null on failure
 */
async function loadArchiveData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading archive data:', error);
        return null;
    }
}

// ============================================
// Score and type utilities
// ============================================

/**
 * Calculate total badman score from individual criteria.
 * Used by: detail panels, sr-only data tables, figure landing cards.
 *
 * Pure computation; callers must supply unit context ("15/25") when displaying
 * the result so screen readers announce it meaningfully.
 *
 * @param {object} scores - Object containing five criteria scores
 * @returns {number} - Total score, 5–25
 */
function calculateBadmanScore(scores) {
    return (
        scores.outlaw_relationship.score +
        scores.community_authorization.score +
        scores.violence_as_language.score +
        scores.cultural_preservation.score +
        scores.hypermasculine_performance.score
    );
}

/**
 * Format figure type for display.
 *
 * @param {string} type - 'real' or 'fictional'
 * @param {boolean} metaBadman - Whether figure is a meta-badman
 * @returns {string} - Formatted display string
 */
function formatFigureType(type, metaBadman = false) {
    if (metaBadman) {
        return 'Meta-Badman';
    }
    return type.charAt(0).toUpperCase() + type.slice(1);
}

// ============================================
// Modality configuration
// ============================================

/**
 * Get full visual identity configuration for a modality.
 * Single source of truth for how modalities are represented visually.
 *
 * WCAG 1.4.1 (Use of Color): Color alone cannot differentiate modalities.
 * Each modality has color + marker shape + network shape + icon + two
 * distinct label strings for different UI contexts.
 *
 * Label split:
 *   - displayLabel → clean name for filter checkboxes, card badges, prose
 *     (e.g., "Detective")
 *   - legendLabel  → descriptive shape-first label for map/network legends
 *     (e.g., "Circle marker — Detective Modality"). Shape comes first
 *     because color is not a reliable identifier for users with color
 *     vision differences.
 *
 * Callers rendering a legend use legendLabel. Callers rendering filter UI
 * use displayLabel.
 *
 * This table must stay in sync with .legend-[modality] and
 * .legend-node-[modality] in styles.css, the Modality Visual Identity
 * table in HTML_TEMPLATES.md, and the Modality Reference in DATAREADME.md.
 *
 * @param {string} modality - Modality ID from JSON (e.g., 'detective')
 * @returns {object} - { color, markerShape, networkShape, icon, displayLabel, legendLabel }
 */
function getModalityConfig(modality) {
    const config = {
        'detective': {
            color: '#3388ff',
            markerShape: 'circle',
            networkShape: 'circle',
            icon: 'magnifying-glass',
            displayLabel: 'Detective',
            legendLabel: 'Circle marker — Detective Modality'
        },
        'revolutionary': {
            color: '#dc3545',
            markerShape: 'star',
            networkShape: 'diamond',
            icon: 'raised-fist',
            displayLabel: 'Revolutionary',
            legendLabel: 'Star marker — Revolutionary Modality'
        },
        'superhero_villain': {
            color: '#fd7e14',
            markerShape: 'hexagon',
            networkShape: 'hexagon',
            icon: 'lightning-bolt',
            displayLabel: 'Superhero-Villain',
            legendLabel: 'Hexagon marker — Superhero-Villain Modality'
        },
        'gangsta_pimp': {
            color: '#6f42c1',
            markerShape: 'square',
            networkShape: 'square',
            icon: 'dollar-sign',
            displayLabel: 'Gangsta-Pimp',
            legendLabel: 'Square marker — Gangsta-Pimp Modality'
        },
        'folk_hero_outlaw': {
            color: '#d4af37',
            markerShape: 'triangle',
            networkShape: 'triangle',
            icon: 'triangle',
            displayLabel: 'Folk Hero-Outlaw',
            legendLabel: 'Triangle marker — Folk Hero-Outlaw Modality'
        }
    };

    return config[modality] || {
        color: '#6c757d',
        markerShape: 'circle',
        networkShape: 'circle',
        icon: 'default',
        displayLabel: 'Unknown Modality',
        legendLabel: 'Unknown Modality'
    };
}

/**
 * Get modality display color (backward compatibility shim).
 * Wraps getModalityConfig() for legacy code paths that need only the color.
 * New code should call getModalityConfig() directly and destructure.
 *
 * @param {string} modality - Modality ID
 * @returns {string} - Hex color code
 */
function getModalityColor(modality) {
    return getModalityConfig(modality).color;
}

// ============================================
// Accessible source link builder
// ============================================

/**
 * Build an accessible list of source links for detail panels.
 *
 * WCAG 1.3.1 (Info and Relationships): Uses semantic <ul>/<li>, never <br>.
 * WCAG 2.4.4 (Link Purpose): Link text is the source title — descriptive.
 * WCAG 3.2.5 (Change on Request): new-tab links include sr-only warning.
 *
 * All styling comes from CSS classes (.source-links, .source-link-item,
 * .source-links-empty) defined in styles.css. No inline styles.
 *
 * @param {Array} sources - Array of { url, title } objects
 * @returns {string} - HTML string containing a <ul> with source links, or empty-state <p>
 */
function buildSourceLinks(sources) {
    if (!sources || sources.length === 0) {
        return '<p class="source-links-empty">No sources available.</p>';
    }

    var html = '<ul class="source-links list-unstyled">';
    for (var i = 0; i < sources.length; i++) {
        html +=
            '<li class="source-link-item">' +
                '<a href="' + sources[i].url + '" target="_blank" rel="noopener noreferrer">' +
                    sources[i].title +
                    '<span class="sr-only"> (opens in new tab)</span>' +
                '</a>' +
            '</li>';
    }
    html += '</ul>';
    return html;
}

// ============================================
// Shared detail panel builder
// ============================================

/**
 * Build and inject detail panel content when a figure is selected.
 * Called by: map marker clicks, network node clicks, sr-only table row activations.
 *
 * Accessibility:
 *   - Figure name as <h3> (proper hierarchy under panel's <h2>)
 *   - "Read more" toggle has aria-label that names the figure (WCAG 2.4.4)
 *     and updates that aria-label when toggled
 *   - panel.focus() moves focus after update (WCAG 2.4.3)
 *   - Source links via buildSourceLinks() — semantic list + new-tab warnings
 *   - Panel container must have aria-live="polite" and aria-atomic="true"
 *     set in the page HTML (per HTML_TEMPLATES.md)
 *
 * Styling: all visual properties come from CSS classes defined in styles.css.
 * No inline style attributes.
 *
 * Source resolution: caller is responsible for resolving figure.source_ids
 * into full source objects on figure.sources.primary before calling this
 * function. See JAVASCRIPT_DOCUMENTATION.md § "Source resolution".
 *
 * @param {object} figure - Full figure object from JSON data
 * @param {string} panelContentId - ID of the content element (e.g., 'info-content')
 * @param {string} panelId - ID of the panel container (e.g., 'info-panel')
 */
function showFigureDetails(figure, panelContentId, panelId) {
    var totalScore = calculateBadmanScore(figure.scores);

    var shortDesc = figure.biography.description.substring(0, 200) + '...';
    var fullDesc = figure.biography.description;

    var sourceLinks = buildSourceLinks(figure.sources.primary);

    var html =
        '<h3 class="figure-detail-name">' + figure.name + '</h3>' +
        '<p><em>Modality:</em> ' + figure.modality + '</p>' +
        '<p><em>Type:</em> ' + formatFigureType(figure.type, figure.meta_badman) + '</p>' +
        '<p><em>Years:</em> ' + (figure.years.birth || figure.years.active_start) +
        ' – ' + (figure.years.death || figure.years.active_end || 'present') + '</p>' +
        '<p><em>Badman Score:</em> ' + totalScore + '/25</p>' +
        '<span id="description-text">' + shortDesc + '</span>' +
        '<a href="#" id="read-more-link" class="read-more-toggle"' +
        ' aria-label="Read more about ' + figure.name + '">Read more</a>' +
        '<hr class="panel-divider">' +
        '<p><strong>Sources:</strong></p>' +
        sourceLinks;

    document.getElementById(panelContentId).innerHTML = html;

    // Move focus to panel for keyboard/screen reader users
    var panel = document.getElementById(panelId);
    panel.focus();

    // Read more/less toggle — `expanded` is local to each call, so listener
    // state does not survive rebuilds when a different figure is selected.
    var expanded = false;
    document.getElementById('read-more-link').addEventListener('click', function(e) {
        e.preventDefault();
        expanded = !expanded;
        document.getElementById('description-text').innerHTML = expanded ? fullDesc : shortDesc;
        this.innerHTML = expanded ? 'Show less' : 'Read more';
        this.setAttribute('aria-label', expanded ?
            'Show less about ' + figure.name :
            'Read more about ' + figure.name);
    });
}
