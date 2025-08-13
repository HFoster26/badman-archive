// ================================
// BADMAN EVOLUTION ARCHIVE
// Reality Architect JavaScript
// ================================

// ================================
// PARTICLE SYSTEM
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
    
    document.getElementById('particles').appendChild(particle);
    
    // Remove particle after animation completes
    setTimeout(() => {
        particle.remove();
    }, 7000);
}

// Generate particles periodically
setInterval(createParticle, 300);

// ================================
// PHASE FILTERING
// ================================

const phaseBtns = document.querySelectorAll('.phase-btn');
const timelineItems = document.querySelectorAll('.timeline-item');

phaseBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active button in phase selector only
        document.querySelectorAll('.phase-selector .phase-btn').forEach(b => b.classList.remove('active'));
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

// ================================
// SCROLL ANIMATIONS
// ================================

// Intersection Observer for timeline animations
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
timelineItems.forEach(item => {
    observer.observe(item);
});

// ================================
// SMOOTH SCROLLING
// ================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ================================
// PLACEHOLDER FUNCTIONALITY
// ================================

// Analysis card buttons
document.querySelectorAll('.analysis-card button').forEach(btn => {
    btn.addEventListener('click', () => {
        alert('This feature will be implemented as you add research data!');
    });
});

// Submission button
const submissionBtn = document.querySelector('.submission-btn');
if (submissionBtn) {
    submissionBtn.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Community submission portal coming soon!');
    });
}

// ================================
// LOGO EFFECTS
// ================================

// Add glow effect to logo on page load
window.addEventListener('load', () => {
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.classList.add('glow');
        setTimeout(() => {
            logo.classList.remove('glow');
        }, 2000);
    }
});

// ================================
// PERFORMANCE OPTIMIZATION
// ================================

// Throttle function for scroll events
function throttle(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add parallax effect to hero section (optional enhancement)
const hero = document.querySelector('.hero');
if (hero) {
    window.addEventListener('scroll', throttle(() => {
        const scrolled = window.pageYOffset;
        const parallax = scrolled * 0.5;
        hero.style.transform = `translateY(${parallax}px)`;
    }, 10));
}

// ================================
// MOBILE MENU TOGGLE (Future Enhancement)
// ================================

// Placeholder for mobile menu functionality
// This can be implemented when you add a hamburger menu icon
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
}

// ================================
// DEBUG MODE
// ================================

// Console easter egg
console.log('%c BADMAN EVOLUTION ARCHIVE ', 'background: #39FF14; color: #000; font-size: 20px; font-weight: bold;');
console.log('%c Reality Architect Edition ', 'background: #552583; color: #FDB927; font-size: 16px;');