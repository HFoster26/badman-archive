/**
 * BDA Partial Loader
 *
 * The site's page lifecycle bootstrapper. Runs on every page.
 *
 * Responsibilities:
 *   1. Fetch navbar.html into #bda-navbar (required on every page)
 *   2. Fetch footer.html into #bda-footer (required on every page)
 *   3. Fetch credentialing-rail.html into #bda-credentialing-rail
 *      if and only if that placeholder exists on the page
 *   4. Set aria-current="page" and .active on the nav link matching
 *      the current top-level route
 *   5. Build the "On this page" TOC in the credentialing rail from
 *      h2 headings in <main>
 *   6. Set the footer copyright year from the current date
 *   7. Dispatch the `bda:partials-loaded` event on document so
 *      downstream scripts (notably scripts.js's Bootstrap dropdown
 *      re-init listener) can react
 *
 * The partial loader is the site's navigation authority. No other
 * script should manipulate nav state, partial content, or the TOC.
 *
 * No framework dependencies. Vanilla JS. Works on any static host.
 *
 * FOUC mitigation: placeholders have min-heights in styles.css so the
 * page doesn't reflow when partials arrive. Do not remove those rules.
 *
 * See JAVASCRIPT_DOCUMENTATION.md § "File 2: bda-partials-loader.js"
 * for the full specification.
 */

(function () {
  'use strict';

  const PARTIALS = {
    '#bda-navbar': '/partials/navbar.html',
    '#bda-footer': '/partials/footer.html',
    '#bda-credentialing-rail': '/partials/credentialing-rail.html'
  };

  /**
   * Fetch a partial HTML file and inject it into a placeholder element.
   *
   * Behavior:
   *   - If the placeholder selector matches nothing, returns null
   *     (graceful skip — not every page has every partial).
   *   - On non-2xx response or network error, logs a warning and returns null.
   *   - On success, sets element.innerHTML and returns the element.
   *
   * @param {string} selector - Placeholder selector (e.g., '#bda-navbar')
   * @param {string} url - Partial URL (e.g., '/partials/navbar.html')
   * @returns {Promise<HTMLElement|null>}
   */
  async function loadPartial(selector, url) {
    const el = document.querySelector(selector);
    if (!el) return null; // Placeholder not present on this page; skip.

    try {
      const res = await fetch(url, { cache: 'default' });
      if (!res.ok) {
        console.warn(`BDA partials: ${url} returned ${res.status}`);
        return null;
      }
      const html = await res.text();
      el.innerHTML = html;
      return el;
    } catch (err) {
      console.warn(`BDA partials: failed to load ${url}`, err);
      return null;
    }
  }

  /**
   * Determine the top-level route segment of the current page for nav matching.
   *
   *   /                              → /
   *   /index.html                    → /
   *   /about/project/                → /about/
   *   /archive/figures/baker_gordon/ → /archive/
   *
   * Highlighting the top-level nav parent (not the dropdown child) is
   * intentional — matches how scholarly sites handle deep-page navigation
   * and keeps the visible active-state stable as users navigate within
   * a section.
   *
   * @returns {string}
   */
  function topLevelRoute() {
    const path = window.location.pathname;
    if (path === '/' || path === '/index.html') return '/';
    const match = path.match(/^\/([^/]+)\/?/);
    return match ? `/${match[1]}/` : '/';
  }

  /**
   * After the navbar partial is injected, set aria-current="page" and
   * .active on the nav item whose data-route matches the current top-level route.
   *
   * WCAG 2.4.8 (Location): aria-current="page" is the programmatic signal;
   * the .active class provides the visual one (handled by styles.css —
   * never inline color).
   *
   * Contract: every top-level nav link in navbar.html must carry a
   * data-route attribute. Links without data-route are ignored, which
   * lets dropdown child links exist without competing with their parent
   * for active-state.
   */
  function markCurrentNavItem() {
    const current = topLevelRoute();
    const navLinks = document.querySelectorAll('#bda-navbar [data-route]');
    navLinks.forEach((link) => {
      const route = link.getAttribute('data-route');
      if (route === current) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('active');
      }
    });
  }

  /**
   * Build the "On this page" TOC in the credentialing rail by scanning
   * the page's <main> element for h2 headings.
   *
   * Exits silently if:
   *   - #bda-page-toc-list does not exist (TOC not wanted on this page)
   *   - <main> does not exist
   *
   * If <main> contains no h2 elements, hides #bda-page-toc and exits.
   *
   * Otherwise: for each h2, generates an anchor id from its text content
   * if one is not already set (lowercased, non-alphanumerics → hyphens,
   * trimmed, truncated to 50 chars), then appends a <li><a> entry to
   * the TOC list.
   *
   * Known edge case: duplicate h2 text produces duplicate auto-IDs,
   * and the second anchor will not resolve reliably. Page authors should
   * give duplicate headings explicit unique IDs.
   *
   * WCAG basis: 2.4.1 Bypass Blocks, 2.4.5 Multiple Ways, 2.4.6 Headings
   * and Labels.
   */
  function buildPageTOC() {
    const tocList = document.querySelector('#bda-page-toc-list');
    if (!tocList) return; // Credentialing rail not present.

    const main = document.querySelector('main');
    if (!main) return;

    const headings = main.querySelectorAll('h2');
    if (!headings.length) {
      // Hide the whole TOC nav if there are no headings
      const toc = document.querySelector('#bda-page-toc');
      if (toc) toc.style.display = 'none';
      return;
    }

    // Clear any existing list items in case init() runs more than once.
    tocList.innerHTML = '';

    headings.forEach((h) => {
      if (!h.id) {
        h.id = h.textContent
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 50);
      }
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${h.id}`;
      a.textContent = h.textContent;
      li.appendChild(a);
      tocList.appendChild(li);
    });
  }

  /**
   * Populate the footer's copyright year with the current year.
   *
   * Contract: footer.html must contain <span id="bda-footer-year"></span>.
   */
  function setFooterYear() {
    const yearEl = document.querySelector('#bda-footer-year');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }
  }

  /**
   * Entry point. Runs on DOMContentLoaded, or immediately if the document
   * has already loaded past that point.
   *
   * Order:
   *   1. Fire all three partial loads in parallel via Promise.all
   *   2. Once all have resolved, run post-load wiring:
   *      markCurrentNavItem → buildPageTOC → setFooterYear
   *   3. Dispatch `bda:partials-loaded` on document
   *
   * Order matters: nav marking must run after navbar injection; TOC
   * building must run after credentialing rail injection. Promise.all
   * ensures all three injections complete before any wiring runs.
   *
   * The `bda:partials-loaded` event signals downstream scripts that
   * the full DOM (including injected partials) is ready. The Bootstrap
   * dropdown re-init listener in scripts.js depends on this event —
   * without it, every navbar dropdown is dead.
   */
  async function init() {
    const tasks = Object.entries(PARTIALS).map(([sel, url]) => loadPartial(sel, url));
    await Promise.all(tasks);

    // Post-load wiring. Order matters: navbar must be in DOM before markCurrentNavItem.
    markCurrentNavItem();
    buildPageTOC();
    setFooterYear();

    // Dispatch a custom event so page-specific scripts can react
    // (e.g., scripts.js re-initializes Bootstrap dropdowns on this signal).
    document.dispatchEvent(new CustomEvent('bda:partials-loaded'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
