# CSS Documentation

## File: `styles.css`

This file contains **only** custom styles for the Detroit Badman Archive. Bootstrap 5 is loaded via CDN in the HTML `<head>` section—it is not bundled in this file.

**Total lines:** ~340 (expanded from ~320 to include in-prose link underline rule)

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
styles.css (~340 lines)
├── CSS Variables (Lines 14-41)
├── Base Styles (Lines 43-48)
├── Accessibility Utilities (Lines 50-85)
│   ├── .sr-only / .sr-only-focusable
│   ├── Focus styles
│   └── Reduced motion
├── In-Prose Link Underlines (Lines 87-98)
├── Header (Lines 100-125)
├── Navigation (Lines 127-153)
├── Page Sections (Lines 155-170)
├── Content Boxes (Lines 172-195)
├── Section Headings (Lines 197-213)
├── Buttons (Lines 215-235)
├── Intro Section (Lines 237-275)
├── Text Colors (Lines 277-285)
├── Footer (Lines 287-291)
├── About Page Styles (Lines 293-305)
├── Legend Styles (Lines 307-333)
└── Utility Classes (Lines 335-353)
```

---

## Color Palette

The archive uses a dark green base with **purple and gold accents as an homage to Kobe Bryant**.

### CSS Variables (Lines 14-41)

All colors are defined as CSS variables in `:root`. Edit these to change colors globally:

```css
:root {
    /* Primary Greens */
    --dba-darkest-green: #0A1F12;
    --dba-dark-green: #0D2818;
    --dba-medium-green: #143D26;
    --dba-content-green: #1A472A;
    --dba-border-green: #2A623D;
    --dba-emerald: #50C878;

    /* Kobe Tribute - Purple & Gold */
    --dba-purple: #552583;
    --dba-gold: #D4AF37;

    /* Text Colors */
    --dba-text-primary: #E8E8E8;
    --dba-text-secondary: #C8C8C8;
    --dba-text-muted: #B0B0B0;
    --dba-white: #FFFFFF;

    /* Modality Colors */
    --dba-detective: #3388FF;
    --dba-revolutionary: #DC3545;
    --dba-superhero-villain: #FD7E14;
    --dba-gangsta-pimp: #6F42C1;
    --dba-folk-hero: #D4AF37;

    /* Focus */
    --dba-focus-ring: #D4AF37;
}
```

**Rule:** No color should be hardcoded in inline styles on HTML elements. If a color is used in the archive, it gets a CSS variable. This keeps the contrast reference table accurate and makes global changes possible.

### Color Contrast Reference Table

All text/background combinations meet WCAG AA minimums: 4.5:1 for normal text, 3:1 for large text (18pt+ or 14pt bold) and UI components. Contrast verified via WebAIM Contrast Checker in April 2026.

| Element | Foreground | Background | Ratio | AA | Status |
|---------|-----------|------------|-------|----|----|
| Primary text | `--dba-text-primary` (`#E8E8E8`) | `--dba-content-green` (`#1A472A`) | 8.66:1 | Pass | ✅ |
| Secondary text | `--dba-text-secondary` (`#C8C8C8`) | `--dba-content-green` (`#1A472A`) | 6.34:1 | Pass | ✅ |
| Muted text | `--dba-text-muted` (`#B0B0B0`) | `--dba-content-green` (`#1A472A`) | 4.89:1 | Pass | ✅ |
| Link text (on content bg) | `--dba-emerald` (`#50C878`) | `--dba-dark-green` (`#0D2818`) | 7.4:1 | Pass | ✅ |
| Link vs. adjacent primary text | `--dba-emerald` (`#50C878`) | `--dba-text-primary` (`#E8E8E8`) | 1.73:1 | Fail | ✅ via underline* |
| Heading accent | `--dba-emerald` (`#50C878`) | `--dba-dark-green` (`#0D2818`) | 7.4:1 | Pass | ✅ |
| Nav hover / active | `--dba-gold` (`#D4AF37`) | `--dba-darkest-green` (`#0A1F12`) | 8.2:1 | Pass | ✅ |
| Footer text | `--dba-text-primary` (`#E8E8E8`) | `--dba-darkest-green` (`#0A1F12`) | 14.07:1 | Pass | ✅ |
| Focus ring | `--dba-focus-ring` (`#D4AF37`) | `--dba-content-green` (`#1A472A`) | 5.04:1 | Pass | ✅ |
| Button text | `--dba-white` (`#FFFFFF`) | `--dba-purple` (`#552583`) | 10.61:1 | Pass | ✅ |

*\* **Link vs. adjacent primary text:** The emerald link color fails adjacent-text contrast against `#E8E8E8` primary text in isolation (1.73:1). This is mitigated by applying `text-decoration: underline` to all in-prose links, satisfying WCAG 1.4.1 via non-color differentiation. See "In-Prose Link Underlines" section below for the CSS rule. Do not remove underlines in body text contexts. Navigation links, buttons, and other structurally-signalled link elements do not require underlines.*

**Note on `--dba-text-muted`:** This variable replaced a previously-used hardcoded `#a0a0a0`, which was flagged as a suspected failure in the March 2026 accessibility audit. `#a0a0a0` on `#1A472A` yields approximately 3.9:1 (fails AA for normal text). The upgrade to `#B0B0B0` brought the ratio to a verified 4.89:1, just above the AA threshold. Do not downgrade this value without re-testing.

### Modality Colors (for map markers and network nodes)

| Modality | Variable | Hex |
|----------|----------|-----|
| Detective | `--dba-detective` | `#3388FF` (Blue) |
| Revolutionary | `--dba-revolutionary` | `#DC3545` (Red) |
| Superhero-Villain | `--dba-superhero-villain` | `#FD7E14` (Orange) |
| Gangsta-Pimp | `--dba-gangsta-pimp` | `#6F42C1` (Purple) |
| Folk Hero-Outlaw | `--dba-folk-hero` | `#D4AF37` (Gold) |

At launch, three modalities render: Detective, Revolutionary, and Superhero-Villain. Gangsta-Pimp and Folk Hero-Outlaw variables are defined but filtered out via the `activeModalities` array in map.html and network.html pending post-launch activation.

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

**Why this exists:** The default browser focus outline (thin blue ring) is nearly invisible on dark green backgrounds. WCAG 2.4.7 (Focus Visible) requires a visible focus indicator. The gold ring (`#D4AF37`) on dark green provides verified 5.04:1 contrast on content backgrounds and 8.2:1 on the darkest-green nav background.

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

### In-Prose Link Underlines (Lines 87-98)

```css
.essay a,
p a,
.bio-overview a,
.data-section a,
.cited-in-desc a {
    text-decoration: underline;
    text-underline-offset: 2px;
}
```

**Why this exists:** The emerald link color (`--dba-emerald`, `#50C878`) does not provide sufficient contrast against primary text color (`#E8E8E8`) in isolation — the two colors measure 1.73:1, below the WCAG 1.4.11 non-text contrast threshold. Without an underline, a color-blind user reading body prose cannot tell that a green word is a hyperlink.

The underline is the non-color cue that satisfies WCAG 1.4.1 (Use of Color). This is the industry-standard pattern used by NYT, JSTOR, Wikipedia, and academic journals for in-prose links.

**What gets underlined:**
- Links inside essay paragraphs (`<article class="essay">`, `<p>`)
- Links inside biography overview (`.bio-overview`)
- Links inside data-section content (`.data-section`)
- Links inside cited-in descriptions on source pages

**What does NOT get underlined:**
- Navigation links — structurally signaled as navigation
- Buttons — structurally signaled as interactive
- "Read more" toggles in detail panels — structurally signaled as controls
- Heading-accent emerald text (`.section-heading-upper`) — not a link, just colored text

**Do not remove this rule.** The archive cannot ship without it and remain WCAG-compliant.

---

### Header (Lines 100-125)

**Classes:**
- `.site-heading` — Container for the large desktop header
- `.site-heading-upper` — "Detroit Badman Archive" (gold)
- `.site-heading-lower` — Page subtitle (off-white)

**To modify:**
- Change `--dba-gold` to adjust the site title color
- Adjust `font-size` values to resize heading text

---

### Navigation (Lines 127-153)

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

### Page Sections (Lines 155-170)

**Classes:**
- `.page-section` — Standard section (dark green background)
- `section.cta` — Call-to-action section (medium green background)

**Pattern:** Alternating these creates visual rhythm on the page.

---

### Content Boxes (Lines 172-195)

**Classes:**
- `.bg-faded` — The green rounded boxes containing content
- `.cta-inner` — Inner box within CTA sections

**Key detail:** `.cta-inner:before` creates a purple border effect around CTA boxes using the `--dba-purple` variable.

**To modify:**
- Change `--dba-content-green` to adjust box background
- Change `--dba-purple` in the `:before` pseudo-element to change accent border

---

### Section Headings (Lines 197-213)

**Classes:**
- `.section-heading` — Container
- `.section-heading-upper` — Small text above title (emerald)
- `.section-heading-lower` — Large title text (off-white)

**To modify:**
- Change `--dba-emerald` to adjust the small heading color

---

### Buttons (Lines 215-235)

**Classes:**
- `.btn-primary` — Standard button (purple outline)
- `.btn-primary:hover` — Hover state (purple fill, gold border)
- `.btn-xl` — Extra large button size

**Key detail:** Buttons use purple border by default and fill with purple on hover, with gold border accent.

**Accessibility note:** Button focus state uses the global `*:focus-visible` gold ring. Button text color `#FFFFFF` against purple button fill `#552583` is verified at 10.61:1 (WCAG AAA).

**To modify:**
- Change `--dba-purple` to adjust button color
- Change `--dba-gold` to adjust hover border color
- Change `border-radius` value to add rounded corners

---

### Intro Section (Lines 237-275)

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

### Text Colors (Lines 277-285)

```css
p {
    color: var(--dba-text-secondary) !important;
}

.text-faded {
    color: var(--dba-text-primary) !important;
}
```

Paragraphs use lighter gray (`--dba-text-secondary`); `.text-faded` class uses brighter off-white (`--dba-text-primary`).

**Important:** Do not use `#a0a0a0` for any text on `--dba-content-green` backgrounds. That combination fails WCAG 4.5:1 contrast. Use `--dba-text-muted` (`#B0B0B0`) as the minimum for muted text.

---

### Footer (Lines 287-291)

```css
.footer {
    background-color: var(--dba-darkest-green) !important;
}
```

Matches the navigation bar color for visual consistency.

---

### Legend Styles (Lines 307-333)

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

.legend-superhero-villain {
    background-color: var(--dba-superhero-villain);
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);  /* Hexagon */
}

.legend-gangsta-pimp {
    background-color: var(--dba-gangsta-pimp);
    border-radius: 2px;  /* Square with slightly rounded corners */
}

.legend-folk-hero {
    background-color: var(--dba-folk-hero);
    clip-path: polygon(50% 0%, 0% 100%, 100% 100%);  /* Triangle */
}
```

**Why shapes?** The previous version used identical circles with different colors for each modality. WCAG 1.4.1 (Use of Color) requires a non-color differentiator. Each modality now has a distinct CSS shape that matches the Modality Visual Identity System defined in HTML_TEMPLATES.md and `getModalityConfig()` in JAVASCRIPT.md.

**Shape reference:**

| Modality | CSS Shape | Technique |
|----------|-----------|-----------|
| Detective | Pin/teardrop | `border-radius` + `transform: rotate` |
| Revolutionary | Star | `clip-path: polygon` |
| Superhero-Villain | Hexagon | `clip-path: polygon` |
| Gangsta-Pimp | Square | Default with slight `border-radius` |
| Folk Hero-Outlaw | Triangle | `clip-path: polygon` |

**Launch state:** At launch, legend items for Detective, Revolutionary, and Superhero-Villain render. Gangsta-Pimp and Folk Hero-Outlaw classes are defined but not displayed because no active figures in those modalities exist in the rendered dataset. When a modality goes live, its legend entry appears automatically via the shared legend rendering logic.

**When adding a new modality:** Add a `.legend-[modality]` class here with the appropriate shape, add the modality to `getModalityConfig()` in scripts.js, and add it to the Modality Visual Identity System table in HTML_TEMPLATES.md. All three must stay in sync.

**Accessibility note:** The legend marker spans use `aria-hidden="true"` in the HTML because they are decorative — the adjacent text label carries the information. See HTML_TEMPLATES.md for the full legend markup pattern.

---

### Utility Classes (Lines 335-353)

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

**After any color change:** Re-check the affected rows in the Color Contrast Reference Table above. Run the new value through the WebAIM Contrast Checker (webaim.org/resources/contrastchecker/) against every background it appears on. Update the table with the new ratio.

### Option 2: Override Specific Elements

Add new rules at the bottom of the file:

```css
/* Custom override */
.btn-primary {
    border-color: #FF0000 !important;  /* Red buttons */
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
7. If adding in-prose link contexts, add the selector to the in-prose link underlines rule

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
| map.html | `#info-content` | `color: #C8C8C8` | `color: var(--dba-text-secondary)` |
| map.html | Panel headers | `color: #50C878` | `color: var(--dba-emerald)` |
| map.html | Legend text | `color: #E8E8E8` | `color: var(--dba-text-primary)` |
| network.html | `#figure-metrics-content` | `color: #A0A0A0` | `color: var(--dba-text-muted)` (upgrade to `#B0B0B0`) |
| network.html | Panel headers | `color: #50C878` | `color: var(--dba-emerald)` |
| network.html | Labels | `color: #E8E8E8` | `color: var(--dba-text-primary)` |

**Why this matters:** Inline styles cannot be globally updated by changing a CSS variable. If a contrast check reveals that a color fails on a given background, you'd have to find and update every inline instance across every HTML file. With variables, you change one value in `:root` and everything updates.

**Critical row:** The network.html `#figure-metrics-content` row currently uses `#A0A0A0`, which fails WCAG AA against dark backgrounds. This must be migrated to `--dba-text-muted` before launch. This is not a style preference — it is a compliance requirement.

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

### Underlines appearing where they shouldn't / missing where they should
1. The in-prose link underline rule targets specific selectors (`.essay a`, `p a`, etc.)
2. If a new context contains links, add its selector to the rule
3. If underlines appear on a nav link, check whether the rule's selectors match the nav link's parent — if so, exclude with `:not()`
4. Do NOT remove the underlines globally — they are a WCAG compliance requirement

### Mobile display issues
1. Check the `@media` queries in the Intro Section
2. Bootstrap breakpoints: sm(576px), md(768px), lg(992px), xl(1200px)
3. Test with browser dev tools mobile emulation
