/**
 * Detroit Badman Archive
 * Main JavaScript file
 * 
 * This file contains shared functionality across the archive.
 * Page-specific scripts (map, network) are included inline in their respective HTML files.
 * 
 * All functions that touch the DOM follow the accessibility patterns
 * documented in HTML_TEMPLATES.md. Dynamic content updates manage focus,
 * interactive elements are keyboard-operable, and modality identity
 * never relies on color alone.
 */

// ============================================
// Initialize on DOM load
// ============================================

window.addEventListener('DOMContentLoaded', event => {
    
    // Add active state to current nav item
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
            link.style.color = '#d4af37'; // Gold for active link
            link.setAttribute('aria-current', 'page'); // Screen reader: identifies current page
        }
    });
    
    console.log('Detroit Badman Archive initialized');
});

// ============================================
// Data loading
// ============================================

/**
 * Utility function to load JSON data
 * Used by map and network visualizations
 * @param {string} url - Path to JSON file
 * @returns {Promise} - Resolves with parsed JSON data
 */
async function loadArchiveData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error loading archive data:', error);
        return null;
    }
}

// ============================================
// Score and type utilities
// ============================================

/**
 * Calculate total badman score from individual criteria
 * Used by: detail panels, sr-only data tables
 * @param {object} scores - Object containing five criteria scores
 * @returns {number} - Total score out of 25
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
 * Format figure type for display
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
 * WCAG 1.4.1: Color alone cannot differentiate modalities.
 * Each modality has color + marker shape + network shape + icon + accessible label.
 * 
 * @param {string} modality - Modality ID from JSON (e.g., 'detective')
 * @returns {object} - { color, markerShape, networkShape, icon, label }
 */
function getModalityConfig(modality) {
    const config = {
        'detective': {
            color: '#3388ff',
            markerShape: 'circle',
            networkShape: 'circle',
            icon: 'magnifying-glass',
            label: 'Pin marker — Detective Modality'
        },
        'revolutionary': {
            color: '#dc3545',
            markerShape: 'star',
            networkShape: 'star',
            icon: 'raised-fist',
            label: 'Star marker — Revolutionary Modality'
        },
        'folk_hero_outlaw': {
            color: '#d4af37',
            markerShape: 'triangle',
            networkShape: 'triangle',
            icon: 'triangle',
            label: 'Triangle marker — Folk Hero-Outlaw Modality'
        },
        'gangsta_pimp': {
            color: '#6f42c1',
            markerShape: 'square',
            networkShape: 'square',
            icon: 'dollar-sign',
            label: 'Square marker — Gangsta-Pimp Modality'
        },
        'superhero_villain': {
            color: '#fd7e14',
            markerShape: 'hexagon',
            networkShape: 'hexagon',
            icon: 'lightning-bolt',
            label: 'Hexagon marker — Superhero-Villain Modality'
        }
    };

    return config[modality] || {
        color: '#6c757d',
        markerShape: 'circle',
        networkShape: 'circle',
        icon: 'default',
        label: 'Unknown Modality'
    };
}

/**
 * Get modality display color (backward compatibility)
 * Wraps getModalityConfig() for code that only needs the hex color.
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
 * WCAG 1.3.1: Uses semantic <ul>/<li> structure (not <br> separators).
 * WCAG 3.2.5: Links opening in new tabs include sr-only warning text.
 * 
 * @param {Array} sources - Array of { url, title } objects
 * @returns {string} - HTML string containing a <ul> with source links
 */
function buildSourceLinks(sources) {
    if (!sources || sources.length === 0) return '<p style="color: var(--dba-text-muted);">No sources available.</p>';

    var html = '<ul class="list-unstyled">';
    for (var i = 0; i < sources.length; i++) {
        html += '<li style="margin-bottom: 0.3rem;">' +
            '<a href="' + sources[i].url + '" target="_blank" rel="noopener noreferrer" style="color: var(--dba-emerald);">' +
            sources[i].title +
            '<span class="sr-only"> (opens in new tab)</span>' +
            '</a></li>';
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
 * Accessibility features:
 * - Figure name as <h3> (proper heading hierarchy under panel's <h2>)
 * - "Read more" link includes aria-label with figure name (WCAG 2.4.4)
 * - panel.focus() moves focus after update (keyboard/screen reader awareness)
 * - Source links via buildSourceLinks() with list structure and new-tab warnings
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
        '<h3 style="color: var(--dba-text-primary); font-size: 1.1rem; margin-bottom: 0.5rem;">' + figure.name + '</h3>' +
        '<p style="color: var(--dba-text-secondary); margin-bottom: 0.25rem;"><em>Modality:</em> ' + figure.modality + '</p>' +
        '<p style="color: var(--dba-text-secondary); margin-bottom: 0.25rem;"><em>Type:</em> ' + formatFigureType(figure.type, figure.meta_badman) + '</p>' +
        '<p style="color: var(--dba-text-secondary); margin-bottom: 0.25rem;"><em>Years:</em> ' + (figure.years.birth || figure.years.active_start) +
        ' – ' + (figure.years.death || figure.years.active_end || 'present') + '</p>' +
        '<p style="color: var(--dba-text-secondary); margin-bottom: 0.75rem;"><em>Badman Score:</em> ' + totalScore + '/25</p>' +
        '<span id="description-text" style="color: var(--dba-text-secondary);">' + shortDesc + '</span>' +
        '<a href="#" id="read-more-link" style="color: var(--dba-emerald); display: block; margin-top: 0.5rem;"' +
        ' aria-label="Read more about ' + figure.name + '">Read more</a>' +
        '<hr style="border-color: var(--dba-border-green); margin: 1rem 0;">' +
        '<p style="color: var(--dba-text-primary);"><strong>Sources:</strong></p>' +
        sourceLinks;

    document.getElementById(panelContentId).innerHTML = html;

    // Move focus to panel for keyboard/screen reader users
    var panel = document.getElementById(panelId);
    panel.focus();

    // Read more/less toggle
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
