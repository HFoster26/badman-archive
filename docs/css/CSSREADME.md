# CSS Documentation

## File: `styles.css`

This file contains **only** custom styles for the Detroit Badman Archive. Bootstrap 5 is loaded via CDN in the HTML `<head>` section—it is not bundled in this file.

**Total lines:** ~320 (expanded from ~280 to include accessibility utilities)

---

## Important: Bootstrap CDN Required

Each HTML file must include Bootstrap CSS in the `<head>`:

```html
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link href="css/styles.css" rel="stylesheet" />
```

And Bootstrap JS before the closing `</body>`:

```html
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
```

---

## File Structure

```
styles.css (~320 lines)
├── CSS Variables (Lines 14-41)
├── Base Styles (Lines 43-48)
├── Accessibility Utilities (Lines 50-85)
│   ├── .sr-only / .sr-only-focusable
│   ├── Focus styles
│   └── Reduced motion
├── Header (Lines 87-112)
├── Navigation (Lines 114-140)
├── Page Sections (Lines 142-157)
├── Content Boxes (Lines 159-182)
├── Section Headings (Lines 184-200)
├── Buttons (Lines 202-222)
├── Intro Section (Lines 224-262)
├── Text Colors (Lines 264-272)
├── Footer (Lines 274-278)
├── About Page Styles (Lines 280-292)
├── Legend Styles (Lines 294-320)
└── Utility Classes (Lines 322-340)
```

---

## Color Palette

The archive uses a dark green base with **purple and gold accents as an homage to Kobe Bryant**.

### CSS Variables (Lines 14-41)

All colors are defined as CSS variables in `:root`. Edit these to change colors globally:

```css
:root {
    /* Primary Greens */
    --dba-darkest-green: #0a1f12;
    --dba-dark-green: #0d2818;
    --dba-medium-green: #143d26;
    --dba-content-green: #1a472a;
    --dba-border-green: #2a623d;
    --dba-emerald: #50c878;
    
    /* Kobe Tribute - Purple & Gold */
    --dba-purple: #552583;
    --dba-gold: #d4af37;
    
    /* Text Colors */
    --dba-text-primary: #e8e8e8;
    --dba-text-secondary: #c8c8c8;
    --dba-text-muted: #b0b0b0;
    --dba-white: #ffffff;
    
    /* Modality Colors */
    --dba-detective: #3388ff;
    --dba-revolutionary: #dc3545;
    --dba-folk-hero: #d4af37;
    --dba-gangsta-pimp: #6f42c1;
    --dba-superhero: #20c997;

    /* Focus */
    --dba-focus-ring: #d4af37;
}
```

**Changes from previous version:**
- Added `--dba-text-muted` (#b0b0b0) — Replaces hardcoded `#a0a0a0` in inline styles. The previous value (#a0a0a0) likely fails WCAG 4.5:1 contrast against #1a472a. The new value (#b0b0b0) should be verified with the Deque Color Contrast Analyzer but is closer to passing.
- Added `--dba-focus-ring` (#d4af37) — Used for keyboard focus indicators. Gold on dark green provides high visibility.

**Rule:** No color should be hardcoded in inline styles on HTML elements. If a color is used in the archive, it gets a CSS variable. This keeps the contrast reference table accurate and makes global changes possible.

### Color Contrast Reference Table

All text/background combinations must meet WCAG AA minimums: 4.5:1 for normal text, 3:1 for large text (18pt+ or 14pt bold+). Run each pair through the Deque Color Contrast Analyzer before deploying.

| Element | Foreground | Background | Min Ratio | Verified? |
|---------|-----------|------------|-----------|-----------|
| Primary text | `--dba-text-primary` (#e8e8e8) | `--dba-content-green` (#1a472a) | 4.5:1 | **Needs testing** |
| Secondary text | `--dba-text-secondary` (#c8c8c8) | `--dba-content-green` (#1a472a) | 4.5:1 | **Needs testing** |
| Muted text | `--dba-text-muted` (#b0b0b0) | `--dba-content-green` (#1a472a) | 4.5:1 | **Needs testing** |
| Link text | `--dba-emerald` (#50c878) | `--dba-content-green` (#1a472a) | 4.5:1 | **Needs testing** |
| Link vs. adjacent text | `--dba-emerald` (#50c878) | `--dba-text-primary` (#e8e8e8) | 3:1 | **Needs testing** |
| Heading accent | `--dba-emerald` (#50c878) | `--dba-dark-green` (#0d2818) | 3:1 (large) | **Needs testing** |
| Nav hover/active | `--dba-gold` (#d4af37) | `--dba-darkest-green` (#0a1f12) | 4.5:1 | **Needs testing** |
| Footer text | `--dba-text-primary` (#e8e8e8) | `--dba-darkest-green` (#0a1f12) | 4.5:1 | **Needs testing** |
| Focus ring | `--dba-focus-ring` (#d4af37) | `--dba-content-green` (#1a472a) | 3:1 | **Needs testing** |
| Button text | `--dba-white` (#ffffff) | `--dba-purple` (#552583) | 4.5:1 | **Needs testing** |

**Action required before May launch:** Run every row through the Deque analyzer, record the actual ratio, and mark as verified. If any pair fails, adjust the foreground color and update the CSS variable. This table is the audit trail.

### Modality Colors (for map markers and network nodes)

| Modality | Variable | Hex |
|----------|----------|-----|
| Detective | `--dba-detective` | `#3388ff` (Blue) |
| Revolutionary | `--dba-revolutionary` | `#dc3545` (Red) |
| Folk Hero-Outlaw | `--dba-folk-hero` | `#d4af37` (Gold) |
| Gangsta-Pimp | `--dba-gangsta-pimp` | `#6f42c1` (Purple) |
| Superhero-Villain | `--dba-superhero` | `#20c997` (Teal) |

**Note:** Color alone cannot differentiate modalities (WCAG 1.4.1). Each modality also requires a distinct marker shape and icon. See the Modality Visual Identity System table in HTML_TEMPLATES.md and `getModalityConfig()` in JAVASCRIPT.md for the full specification.

---

## Section Breakdown

### Base Styles (Lines 43-48)
```css
body {
    background-color: var(--dba-dark-green) !important;
    color: var(--dba-text-primary) !important;
    background-image: none !important;
}
```
Sets the dark green page background and removes any background images.

---

### Accessibility Utilities (Lines 50-85)

These classes support WCAG compliance across the archive.

#### Screen-reader-only content

Bootstrap 5 uses `visually-hidden` instead of Bootstrap 4's `sr-only`. The BDA codebase uses `sr-only` for brevity. Both are defined here for compatibility:

```css
.sr-only,
.visually-hidden {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
}

.sr-only-focusable:focus,
.visually-hidden-focusable:focus {
    position: static !important;
    width: auto !important;
    height: auto !important;
    padding: 0.5rem 1rem !important;
    margin: 0 !important;
    overflow: visible !important;
    clip: auto !important;
    white-space: normal !important;
    background-color: var(--dba-gold) !important;
    color: var(--dba-darkest-green) !important;
    z-index: 9999;
    font-weight: bold;
}
```

**Why both names?** Bootstrap 5 renamed `sr-only` to `visually-hidden`. Defining both prevents breakage if code references either convention. The skip-to-content link uses `sr-only sr-only-focusable` — it's invisible until a keyboard user tabs to it, then appears on screen as a gold bar.

**Used by:** Skip-to-content links, "(opens in new tab)" text on external links, data table alternatives for visualizations.

#### Focus styles

```css
*:focus-visible {
    outline: 3px solid var(--dba-focus-ring) !important;
    outline-offset: 2px !important;
}

a:focus-visible {
    outline: 3px solid var(--dba-focus-ring) !important;
    outline-offset: 2px !important;
    text-decoration: underline !important;
}
```

**Why this exists:** The default browser focus outline (thin blue ring) is nearly invisible on dark green backgrounds. WCAG 2.4.7 (Focus Visible) requires a visible focus indicator. The gold ring (#d4af37) on dark green provides high contrast.

**`:focus-visible` vs. `:focus`:** Using `:focus-visible` instead of `:focus` means the ring only appears for keyboard navigation, not for mouse clicks. This is the modern best practice — keyboard users see the ring, mouse users don't.

**Do not remove these styles.** Without them, keyboard users cannot see where they are on the page.

#### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
    }
}
```

**Why this exists:** WCAG 2.3.3 (Animation from Interactions) and the `prefers-reduced-motion` media query. Users who have enabled "Reduce motion" in their OS settings will see no CSS animations or transitions. The D3 network simulation is handled separately in JavaScript (see network.html and JAVASCRIPT.md), but this CSS rule catches any transitions on hover states, nav toggles, or future animated elements.

---

### Header (Lines 87-112)

**Classes:**
- `.site-heading` — Container for the large desktop header
- `.site-heading-upper` — "Detroit Badman Archive" (gold)
- `.site-heading-lower` — Page subtitle (off-white)

**To modify:**
- Change `--dba-gold` to adjust the site title color
- Adjust `font-size` values to resize heading text

---

### Navigation (Lines 114-140)

**Classes:**
- `#mainNav` — The navigation bar container
- `.navbar-brand` — Mobile site title
- `.nav-link` — Individual navigation links
- `.nav-link:hover` — Hover state (gold)
- `.nav-link.active` — Current page (gold)

**To modify:**
- Change `--dba-darkest-green` to adjust nav background
- Change `--dba-gold` to adjust hover/active color

**Accessibility note:** The active link also receives `aria-current="page"` via JavaScript (see JAVASCRIPT.md). The gold color is a visual indicator; `aria-current` is the screen reader indicator. Both are required.

---

### Page Sections (Lines 142-157)

**Classes:**
- `.page-section` — Standard section (dark green background)
- `section.cta` — Call-to-action section (medium green background)

**Pattern:** Alternating these creates visual rhythm on the page.

---

### Content Boxes (Lines 159-182)

**Classes:**
- `.bg-faded` — The green rounded boxes containing content
- `.cta-inner` — Inner box within CTA sections

**Key detail:** `.cta-inner:before` creates a purple border effect around CTA boxes using the `--dba-purple` variable.

**To modify:**
- Change `--dba-content-green` to adjust box background
- Change `--dba-purple` in the `:before` pseudo-element to change accent border

---

### Section Headings (Lines 184-200)

**Classes:**
- `.section-heading` — Container
- `.section-heading-upper` — Small text above title (emerald)
- `.section-heading-lower` — Large title text (off-white)

**To modify:**
- Change `--dba-emerald` to adjust the small heading color

---

### Buttons (Lines 202-222)

**Classes:**
- `.btn-primary` — Standard button (purple outline)
- `.btn-primary:hover` — Hover state (purple fill, gold border)
- `.btn-xl` — Extra large button size

**Key detail:** Buttons use purple border by default and fill with purple on hover, with gold border accent.

**Accessibility note:** Button focus state uses the global `*:focus-visible` gold ring. Verify that button text color (#ffffff) against button background (--dba-purple on hover) passes 4.5:1 contrast.

**To modify:**
- Change `--dba-purple` to adjust button color
- Change `--dba-gold` to adjust hover border color
- Change `border-radius` value to add rounded corners

---

### Intro Section (Lines 224-262)

Home page specific styles for the overlapping image and text layout.

**Classes:**
- `.intro` — Container
- `.intro-img` — The large image
- `.intro-text` — The overlapping text box
- `.intro-button` — The CTA button container

**Responsive behavior:**
- Desktop (992px+): Text box overlaps image
- Mobile: Stacked vertically

---

### Text Colors (Lines 264-272)

```css
p {
    color: var(--dba-text-secondary) !important;
}

.text-faded {
    color: var(--dba-text-primary) !important;
}
```

Paragraphs use lighter gray (`--dba-text-secondary`); `.text-faded` class uses brighter off-white (`--dba-text-primary`).

**Important:** Do not use `#a0a0a0` for any text on `--dba-content-green` backgrounds. That combination likely fails WCAG 4.5:1 contrast. Use `--dba-text-muted` (#b0b0b0) as the minimum for muted text, and verify it passes.

---

### Footer (Lines 274-278)

```css
.footer {
    background-color: var(--dba-darkest-green) !important;
}
```

Matches the navigation bar color for visual consistency.

---

### Legend Styles (Lines 294-320)

Styles for the modality legends on map.html and network.html.

```css
.map-legend,
.network-legend {
    background-color: var(--dba-content-green);
    padding: 1rem;
    border-radius: 0.5rem;
    border: 2px solid var(--dba-border-green);
}

.legend-item {
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
}

/* Modality markers — shape + color */
.legend-marker {
    width: 20px;
    height: 20px;
    margin-right: 10px;
    display: inline-block;
}

.legend-detective {
    background-color: var(--dba-detective);
    border-radius: 50% 50% 50% 0;  /* Pin/teardrop shape */
    transform: rotate(-45deg);
}

.legend-revolutionary {
    background-color: var(--dba-revolutionary);
    clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);  /* Star shape */
}

.legend-folk-hero {
    background-color: var(--dba-folk-hero);
    clip-path: polygon(50% 0%, 0% 100%, 100% 100%);  /* Triangle */
}

.legend-gangsta-pimp {
    background-color: var(--dba-gangsta-pimp);
    border-radius: 2px;  /* Square with slightly rounded corners */
}

.legend-superhero-villain {
    background-color: var(--dba-superhero);
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);  /* Hexagon */
}
```

**Why shapes?** The previous version used identical circles with different colors for each modality. WCAG 1.4.1 (Use of Color) requires a non-color differentiator. Each modality now has a distinct CSS shape that matches the Modality Visual Identity System defined in HTML_TEMPLATES.md and `getModalityConfig()` in JAVASCRIPT.md.

**Shape reference:**

| Modality | CSS Shape | Technique |
|----------|-----------|-----------|
| Detective | Pin/teardrop | `border-radius` + `transform: rotate` |
| Revolutionary | Star | `clip-path: polygon` |
| Folk Hero-Outlaw | Triangle | `clip-path: polygon` |
| Gangsta-Pimp | Square | Default with slight `border-radius` |
| Superhero-Villain | Hexagon | `clip-path: polygon` |

**When adding a new modality:** Add a `.legend-[modality]` class here with the appropriate shape, add the modality to `getModalityConfig()` in scripts.js, and add it to the Modality Visual Identity System table in HTML_TEMPLATES.md. All three must stay in sync.

**Accessibility note:** The legend marker spans use `aria-hidden="true"` in the HTML because they are decorative — the adjacent text label carries the information. See HTML_TEMPLATES.md for the full legend markup pattern.

---

### Utility Classes (Lines 322-340)

Custom utility classes you can add to any element:

```css
.border-purple  /* Adds purple border */
.text-gold      /* Gold text color */
.text-purple    /* Purple text color */
```

**Usage example:**
```html
<h3 class="text-gold">Gold Heading</h3>
<div class="bg-faded border-purple p-4">Purple-bordered box</div>
```

---

## How to Change Colors

### Option 1: Change CSS Variables (Recommended)

Edit the values in the `:root` section at the top of the file. All elements using that variable will update automatically.

```css
:root {
    --dba-purple: #552583;  /* Change this hex value */
}
```

**After any color change:** Re-check the affected rows in the Color Contrast Reference Table above. Run the new value through the Deque Color Contrast Analyzer against every background it appears on. Update the table with the new ratio.

### Option 2: Override Specific Elements

Add new rules at the bottom of the file:

```css
/* Custom override */
.btn-primary {
    border-color: #ff0000 !important;  /* Red buttons */
}
```

---

## Adding New Styles

Add new styles at the end of the file before the closing of the document.

**Best practices:**
1. Use CSS variables for colors — never hardcode hex values in inline styles or new rules
2. Add a comment header for new sections
3. Use `!important` sparingly — only when overriding Bootstrap
4. If adding a new color, add it to `:root` as a variable and add a row to the Color Contrast Reference Table
5. If adding hover/transition effects, verify they respect `prefers-reduced-motion` (the global rule handles most cases, but complex animations may need explicit handling)
6. If adding interactive elements, verify the `*:focus-visible` gold ring is visible against the element's background

**Example:**
```css
/* ============================================
   CUSTOM MAP STYLES
   ============================================ */

.map-container {
    border: 2px solid var(--dba-border-green);
    border-radius: 0.5rem;
}
```

---

## Inline Style Cleanup

The following inline styles in the HTML files should be migrated to CSS variables. These were identified during the accessibility audit as hardcoded values that bypass the variable system:

| File | Element | Current Inline Style | Replace With |
|------|---------|---------------------|-------------|
| map.html | `#info-content` | `color: #c8c8c8` | `color: var(--dba-text-secondary)` |
| map.html | Panel headers | `color: #50c878` | `color: var(--dba-emerald)` |
| map.html | Legend text | `color: #e8e8e8` | `color: var(--dba-text-primary)` |
| network.html | `#figure-metrics-content` | `color: #a0a0a0` | `color: var(--dba-text-muted)` |
| network.html | Panel headers | `color: #50c878` | `color: var(--dba-emerald)` |
| network.html | Labels | `color: #e8e8e8` | `color: var(--dba-text-primary)` |

**Why this matters:** Inline styles cannot be globally updated by changing a CSS variable. If a contrast check reveals that #c8c8c8 fails on #1a472a, you'd have to find and update every inline instance across every HTML file. With variables, you change one value in `:root` and everything updates.

---

## Troubleshooting

### Styles not applying
1. Make sure Bootstrap CSS is loaded BEFORE styles.css
2. Check browser cache — hard refresh with Ctrl+Shift+R
3. Add `!important` if Bootstrap is overriding your style

### Colors not matching
1. Verify you're using the CSS variable correctly: `var(--dba-purple)`
2. Check for typos in variable names
3. Ensure `:root` block is at the top of the file
4. Check for inline styles that override the CSS variable (see Inline Style Cleanup table)

### Focus ring not visible
1. Verify `--dba-focus-ring` is defined in `:root`
2. Check that the element isn't overriding `outline` with `outline: none`
3. Test with keyboard (Tab key) — `:focus-visible` only fires for keyboard navigation

### Mobile display issues
1. Check the `@media` queries in the Intro Section
2. Bootstrap breakpoints: sm(576px), md(768px), lg(992px), xl(1200px)
3. Test with browser dev tools mobile emulation
