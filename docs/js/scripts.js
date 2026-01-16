/**
 * Detroit Badman Archive
 * Main JavaScript file
 * 
 * This file contains shared functionality across the archive.
 * Page-specific scripts (map, network) are included inline in their respective HTML files.
 */

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', event => {
    
    // Add active state to current nav item
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
            link.style.color = '#d4af37'; // Gold for active link
        }
    });
    
    console.log('Detroit Badman Archive initialized');
});

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

/**
 * Calculate total badman score from individual criteria
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

/**
 * Get modality display color
 * @param {string} modality - 'detective' or 'revolutionary'
 * @returns {string} - Hex color code
 */
function getModalityColor(modality) {
    const colors = {
        'detective': '#3388ff',      // Blue
        'revolutionary': '#dc3545',   // Red
        'folk_hero_outlaw': '#d4af37', // Gold (future)
        'gangsta_pimp': '#6f42c1',    // Purple (future)
        'superhero_villain': '#20c997' // Teal (future)
    };
    return colors[modality] || '#6c757d'; // Gray default
}
