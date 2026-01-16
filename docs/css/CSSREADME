# CSS Documentation

## File: `styles.css`

This file contains **only** custom styles for the Detroit Badman Archive. Bootstrap 5 is loaded via CDN in the HTML `<head>` section—it is not bundled in this file.

**Total lines:** ~280 (down from 11,000+ in the template version)

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
styles.css (~280 lines)
├── CSS Variables (Lines 14-41)
├── Base Styles (Lines 43-48)
├── Header (Lines 50-75)
├── Navigation (Lines 77-103)
├── Page Sections (Lines 105-120)
├── Content Boxes (Lines 122-145)
├── Section Headings (Lines 147-163)
├── Buttons (Lines 165-185)
├── Intro Section (Lines 187-225)
├── Text Colors (Lines 227-235)
├── Footer (Lines 237-241)
├── About Page Styles (Lines 243-255)
└── Utility Classes (Lines 257-272)
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
    --dba-white: #ffffff;
    
    /* Modality Colors */
    --dba-detective: #3388ff;
    --dba-revolutionary: #dc3545;
    --dba-folk-hero: #d4af37;
    --dba-gangsta-pimp: #552583;
    --dba-superhero: #20c997;
}
```

### Color Reference Table

| Variable | Hex | Usage |
|----------|-----|-------|
| `--dba-darkest-green` | `#0a1f12` | Navigation bar, footer |
| `--dba-dark-green` | `#0d2818` | Page background |
| `--dba-medium-green` | `#143d26` | CTA section background |
| `--dba-content-green` | `#1a472a` | Content boxes |
| `--dba-border-green` | `#2a623d` | Box borders |
| `--dba-emerald` | `#50c878` | Section heading accents |
| `--dba-purple` | `#552583` | Buttons, CTA borders (Kobe) |
| `--dba-gold` | `#d4af37` | Site title, nav hover (Kobe) |
| `--dba-text-primary` | `#e8e8e8` | Headings, primary text |
| `--dba-text-secondary` | `#c8c8c8` | Paragraph text |

### Modality Colors (for map markers and network nodes)

| Modality | Variable | Hex |
|----------|----------|-----|
| Detective | `--dba-detective` | `#3388ff` (Blue) |
| Revolutionary | `--dba-revolutionary` | `#dc3545` (Red) |
| Folk Hero-Outlaw | `--dba-folk-hero` | `#d4af37` (Gold) |
| Gangsta-Pimp | `--dba-gangsta-pimp` | `#552583` (Purple) |
| Superhero-Villain | `--dba-superhero` | `#20c997` (Teal) |

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

### Header (Lines 50-75)

**Classes:**
- `.site-heading` — Container for the large desktop header
- `.site-heading-upper` — "Detroit Badman Archive" (gold)
- `.site-heading-lower` — Page subtitle (off-white)

**To modify:**
- Change `--dba-gold` to adjust the site title color
- Adjust `font-size` values to resize heading text

---

### Navigation (Lines 77-103)

**Classes:**
- `#mainNav` — The navigation bar container
- `.navbar-brand` — Mobile site title
- `.nav-link` — Individual navigation links
- `.nav-link:hover` — Hover state (gold)
- `.nav-link.active` — Current page (gold)

**To modify:**
- Change `--dba-darkest-green` to adjust nav background
- Change `--dba-gold` to adjust hover/active color

---

### Page Sections (Lines 105-120)

**Classes:**
- `.page-section` — Standard section (dark green background)
- `section.cta` — Call-to-action section (medium green background)

**Pattern:** Alternating these creates visual rhythm on the page.

---

### Content Boxes (Lines 122-145)

**Classes:**
- `.bg-faded` — The green rounded boxes containing content
- `.cta-inner` — Inner box within CTA sections

**Key detail:** `.cta-inner:before` creates a purple border effect around CTA boxes using the `--dba-purple` variable.

**To modify:**
- Change `--dba-content-green` to adjust box background
- Change `--dba-purple` in the `:before` pseudo-element to change accent border

---

### Section Headings (Lines 147-163)

**Classes:**
- `.section-heading` — Container
- `.section-heading-upper` — Small text above title (emerald)
- `.section-heading-lower` — Large title text (off-white)

**To modify:**
- Change `--dba-emerald` to adjust the small heading color

---

### Buttons (Lines 165-185)

**Classes:**
- `.btn-primary` — Standard button (purple outline)
- `.btn-primary:hover` — Hover state (purple fill, gold border)
- `.btn-xl` — Extra large button size

**Key detail:** Buttons use purple border by default and fill with purple on hover, with gold border accent.

**To modify:**
- Change `--dba-purple` to adjust button color
- Change `--dba-gold` to adjust hover border color
- Change `border-radius` value to add rounded corners

---

### Intro Section (Lines 187-225)

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

### Text Colors (Lines 227-235)

```css
p {
    color: var(--dba-text-secondary) !important;
}

.text-faded {
    color: var(--dba-text-primary) !important;
}
```

Paragraphs use lighter gray; `.text-faded` class uses brighter off-white.

---

### Footer (Lines 237-241)

```css
.footer {
    background-color: var(--dba-darkest-green) !important;
}
```

Matches the navigation bar color for visual consistency.

---

### Utility Classes (Lines 257-272)

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
1. Use CSS variables for colors when possible
2. Add a comment header for new sections
3. Use `!important` sparingly—only when overriding Bootstrap

**Example:**
```css
/* ============================================
   CUSTOM MAP STYLES
   ============================================ */

.map-container {
    border: 2px solid var(--dba-purple);
    border-radius: 0.5rem;
}
```

---

## Troubleshooting

### Styles not applying
1. Make sure Bootstrap CSS is loaded BEFORE styles.css
2. Check browser cache—hard refresh with Ctrl+Shift+R
3. Add `!important` if Bootstrap is overriding your style

### Colors not matching
1. Verify you're using the CSS variable correctly: `var(--dba-purple)`
2. Check for typos in variable names
3. Ensure `:root` block is at the top of the file

### Mobile display issues
1. Check the `@media` queries in the Intro Section
2. Bootstrap breakpoints: sm(576px), md(768px), lg(992px), xl(1200px)
3. Test with browser dev tools mobile emulation
