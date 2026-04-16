/**
 * BDA Partial Loader
 *
 * Every page loads this script. It:
 *   1. Fetches navbar.html into #bda-navbar  (required on every page)
 *   2. Fetches footer.html into #bda-footer  (required on every page)
 *   3. Fetches credentialing-rail.html into #bda-credentialing-rail
 *      if and only if that placeholder exists on the page.
 *   4. Sets aria-current="page" on the nav link that matches the current URL.
 *   5. Populates the credentialing rail's "On this page" TOC from h2 headings
 *      in the <main> element.
 *   6. Sets the footer year from the current date.
 *
 * No framework dependencies. Vanilla JS. Works on any static host.
 *
 * FOUC mitigation: placeholders have min-heights in styles.css so the
 * page doesn't reflow when partials arrive.
 */

(function () {
  'use strict';

  const PARTIALS = {
    '#bda-navbar': '/partials/navbar.html',
    '#bda-footer': '/partials/footer.html',
    '#bda-credentialing-rail': '/partials/credentialing-rail.html'
  };

  /**
   * Fetch a partial and inject it into the placeholder element.
   * Returns a Promise that resolves when injection is complete.
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
   * Determine the top-level route for the current page.
   * For URL /archive/figures/baker_gordon/ returns "/archive/"
   * For URL /about/project/ returns "/about/"
   * For URL / returns "/"
   */
  function topLevelRoute() {
    const path = window.location.pathname;
    if (path === '/' || path === '/index.html') return '/';
    const match = path.match(/^\/([^/]+)\/?/);
    return match ? `/${match[1]}/` : '/';
  }

  /**
   * After the navbar is injected, mark the current top-level item
   * with aria-current="page" and a visible active class.
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
   * Build the "On this page" TOC in the credentialing rail
   * by scanning <main> for h2 elements. Each h2 gets an id (if missing)
   * so anchor links work.
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
   * Update the footer copyright year to the current year.
   */
  function setFooterYear() {
    const yearEl = document.querySelector('#bda-footer-year');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }
  }

  /**
   * Main: load all partials in parallel, then run post-load wiring.
   */
  async function init() {
    const tasks = Object.entries(PARTIALS).map(([sel, url]) => loadPartial(sel, url));
    await Promise.all(tasks);

    // Post-load wiring. Order matters: navbar must be in DOM before markCurrentNavItem.
    markCurrentNavItem();
    buildPageTOC();
    setFooterYear();

    // Dispatch a custom event so page-specific scripts can react
    // (e.g., re-init Bootstrap dropdowns now that the navbar markup exists).
    document.dispatchEvent(new CustomEvent('bda:partials-loaded'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
