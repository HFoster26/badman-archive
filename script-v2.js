// ================================
// BADMAN EVOLUTION ARCHIVE
// Digital Archive Core v2.0
// ================================

// ================================
// ARCHIVE DATA STRUCTURE
// This is where all your content lives
// ================================

const ARCHIVE = {
    meta: {
        title: "Badman Evolution: Interactive Digital Archive",
        version: "2.0",
        lastUpdated: "2025-09-05",
        status: "Building",
        progress: 65  // percentage complete
    },
    
    // Your actual archive content
    database: {
        phases: {
            folklore: {
                id: "folklore",
                name: "Folklore Foundation",
                period: "1865-1920",
                description: "Post-emancipation folk heroes emerge from oral tradition",
                color: "#39FF14",  // Your green
                entries: [
                    {
                        id: "stag-001",
                        title: "Stagolee",
                        year: 1895,
                        type: "folk-ballad",
                        summary: "The original bad man of Black folklore, Stagolee represents the complete rejection of respectability politics through violent assertion of respect.",
                        primarySources: [
                            {
                                type: "recording",
                                title: "Mississippi John Hurt - Stack O'Lee Blues",
                                year: 1928,
                                url: "#",  // Add real links as you get them
                                rights: "Public Domain"
                            }
                        ],
                        analysis: {
                            performativeLiteracies: ["force-calculus", "respect-management"],
                            mythologicalFunction: "reactive-resistance",
                            scholarlyNotes: "Roberts argues that Stagolee emerged as a direct response to post-Reconstruction violence."
                        },
                        citations: [1, 2]
                    },
                    {
                        id: "railroad-bill-001",
                        title: "Railroad Bill",
                        year: 1896,
                        type: "folk-hero",
                        summary: "Morris Slater, known as Railroad Bill, became a Robin Hood figure robbing trains across Alabama.",
                        primarySources: [],
                        analysis: {
                            performativeLiteracies: ["environmental-scanning", "strategic-irrationality"],
                            mythologicalFunction: "economic-resistance",
                            scholarlyNotes: "Combines trickster elements with badman violence."
                        },
                        citations: [3]
                    }
                    // Add more entries as you research
                ]
            },
            detective: {
                id: "detective",
                name: "Detective Phase",
                period: "1960-1975",
                description: "Blaxploitation era detectives navigate urban landscapes",
                color: "#552583",  // Your purple
                entries: [
                    {
                        id: "shaft-001",
                        title: "John Shaft",
                        year: 1971,
                        type: "film",
                        summary: "Private detective who straddles both Black and white worlds, maintaining autonomy through violence and sexuality.",
                        primarySources: [],
                        analysis: {
                            performativeLiteracies: ["code-switching", "force-calculus"],
                            mythologicalFunction: "institutional-navigation",
                            scholarlyNotes: "Shaft represents the badman's attempt to work within the system while maintaining outsider status."
                        },
                        citations: [4]
                    }
                ]
            },
            revolutionary: {
                id: "revolutionary",
                name: "Revolutionary Phase",
                period: "1965-1975",
                description: "Black Power era militant heroes",
                color: "#FFD700",
                entries: []  // Fill in as you build
            },
            gangsta: {
                id: "gangsta",
                name: "Gangsta Phase",
                period: "1985-2000",
                description: "Hip-hop era street entrepreneurs",
                color: "#FF0000",
                entries: []
            },
            superhero: {
                id: "superhero",
                name: "Superhero Phase",
                period: "2000-Present",
                description: "Comic book and cinematic Black heroes",
                color: "#800080",
                entries: []
            }
        }
    }
};

// ================================
// DIGITAL ARCHIVE CLASS
// This controls everything
// ================================

class DigitalArchive {
    constructor() {
        this.currentView = 'timeline';
        this.activeFilters = {
            phase: 'all'
        };
        this.hasSeenWelcome = localStorage.getItem('archive_visited') === 'true';
    }
    
    // Initialize the archive
    initialize() {
        console.log('%c BADMAN EVOLUTION ARCHIVE ', 'background: #39FF14; color: #000; font-size: 20px; font-weight: bold;');
        console.log('%c Digital Archive v2.0 Initializing... ', 'background: #552583; color: #FDB927; font-size: 16px;');
        
        if (!this.hasSeenWelcome) {
            this.showWelcomeOverlay();
        } else {
            this.loadArchive();
        }
    }
    
    // Welcome screen for first-time visitors
    showWelcomeOverlay() {
        const welcome = document.createElement('div');
        welcome.className = 'welcome-overlay';
        welcome.innerHTML = `
            <div class="welcome-content">
                <h1>Badman Evolution</h1>
                <h2>Interactive Digital Archive</h2>
                
                <div class="welcome-info">
                    <p>Tracing 150 years of Black heroic evolution through primary sources and cultural analysis</p>
                    
                    <div class="archive-stats">
                        <span>${this.countTotalEntries()} documented figures</span>
                        <span>•</span>
                        <span>5 historical phases</span>
                        <span>•</span>
                        <span>${ARCHIVE.meta.progress}% complete</span>
                    </div>
                </div>
                
                <div class="welcome-note">
                    <p>This archive is actively being built. Primary sources are drawn from public archives, 
                    scholarly databases, and cultural institutions.</p>
                </div>
                
                <button class="enter-archive" onclick="archive.enterArchive()">
                    Explore Archive
                </button>
            </div>
        `;
        
        document.body.appendChild(welcome);
        setTimeout(() => welcome.classList.add('active'), 100);
    }
    
    // Enter the main archive
    enterArchive() {
        const welcome = document.querySelector('.welcome-overlay');
        welcome.classList.add('exiting');
        
        localStorage.setItem('archive_visited', 'true');
        
        setTimeout(() => {
            welcome.remove();
            this.loadArchive();
        }, 500);
    }
    
    // Load main archive interface
    loadArchive() {
        // Show your existing HTML structure
        const mainContent = document.querySelector('.hero');
        if (mainContent) {
            mainContent.style.display = 'block';
        }
        
        // Initialize all features
        this.initializeSystems();
        
        // Start particle system
        setInterval(createParticle, 300);
    }
    
    // Set up all interactive features
    initializeSystems() {
        // Set up phase filtering (using your existing buttons)
        this.initPhaseFilters();
        
        // Set up scroll animations
        this.initScrollAnimations();
        
        // Initialize citations if you have them
        if (typeof initCitations === 'function') {
            initCitations();
        }
    }
    
    // Phase filtering (adapts your existing code)
    initPhaseFilters() {
        const phaseBtns = document.querySelectorAll('.phase-btn');
        const timelineItems = document.querySelectorAll('.timeline-item');
        
        phaseBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active button
                phaseBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Filter timeline items
                const selectedPhase = btn.getAttribute('data-phase');
                
                timelineItems.forEach(item => {
                    if (selectedPhase === 'all' || item.getAttribute('data-phase') === selectedPhase) {
                        item.style.display = 'block';
                        setTimeout(() => item.classList.add('visible'), 10);
                    } else {
                        item.style.display = 'none';
                        item.classList.remove('visible');
                    }
                });
            });
        });
    }
    
    // Scroll animations (your existing code)
    initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);
        
        // Observe all timeline items
        document.querySelectorAll('.timeline-item').forEach(item => {
            observer.observe(item);
        });
    }
    
    // Count total entries across all phases
    countTotalEntries() {
        let total = 0;
        Object.values(ARCHIVE.database.phases).forEach(phase => {
            total += phase.entries.length;
        });
        return total;
    }
}

// ================================
// CREATE GLOBAL INSTANCE
// ================================

const archive = new DigitalArchive();

// ================================
// INITIALIZE WHEN PAGE LOADS
// ================================

document.addEventListener('DOMContentLoaded', () => {
    archive.initialize();
});

// ================================
// PARTICLE SYSTEM (From your v1)
// ================================

function createParticle() {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * window.innerWidth + 'px';
    particle.style.animationDelay = Math.random() * 4 + 's';
    particle.style.animationDuration = (Math.random() * 3 + 4) + 's';
    
    // Randomly assign green or purple particles (80% green, 20% purple)
    if (Math.random() > 0.8) {
        particle.style.background = 'var(--mamba-purple)';
        particle.style.boxShadow = '0 0 10px var(--mamba-purple)';
    }
    
    const particleContainer = document.getElementById('particles');
    if (particleContainer) {
        particleContainer.appendChild(particle);
    }
    
    // Remove particle after animation completes
    setTimeout(() => {
        particle.remove();
    }, 7000);
}

// ================================
// CITATIONS (From your v1, expanded)
// ================================

// Duplicate 'citations' declaration removed to fix redeclaration error.

// Your existing citation initialization function
function initCitations() {
    // Your existing citation code from lines 141-174
}
// ===== MIGRATED FROM V1 =====
// ================================
// PARTICLE SYSTEM (From v1 lines 10-29)
// ================================

function createParticle() {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * window.innerWidth + 'px';
    particle.style.animationDelay = Math.random() * 4 + 's';
    particle.style.animationDuration = (Math.random() * 3 + 4) + 's';
    
    if (Math.random() > 0.8) {
        particle.style.background = 'var(--mamba-purple)';
        particle.style.boxShadow = '0 0 10px var(--mamba-purple)';
    }
    
    document.getElementById('particles').appendChild(particle);
    
    setTimeout(() => {
        particle.remove();
    }, 7000);
}

// ================================
// CITATIONS (From v1 lines 126-174)
// ================================

const citations = {
    1: {
        short: "Roberts, <em>From Trickster to Badman</em>, pp. 171-215",
        full: "Roberts, John W. <em>From Trickster to Badman: The Black Folk Hero in Slavery and Freedom</em>. Philadelphia: University of Pennsylvania Press, 1989. pp. 171-215."
    },
    2: {
        short: "Levine, <em>Black Culture and Black Consciousness</em>, pp. 407-420",
        full: "Levine, Lawrence W. <em>Black Culture and Black Consciousness: Afro-American Folk Thought from Slavery to Freedom</em>. Oxford: Oxford University Press, 1977. pp. 407-420."
    }
};

function initCitations() {
    // Your citation popup code from lines 141-174
}

// ================================
// CONSOLE EASTER EGG (From v1 lines 223-224)
// ================================

console.log('%c BADMAN EVOLUTION ARCHIVE ', 'background: #39FF14; color: #000; font-size: 20px; font-weight: bold;');
console.log('%c Reality Architect Edition ', 'background: #552583; color: #FDB927; font-size: 16px;');