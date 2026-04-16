# Detroit Badman Archive

A digital humanities archive documenting Black masculine heroism in Detroit, operating as the proof-of-concept module of the **Badman Digital Archive** — a national cultural heritage framework for documenting, protecting, and economically leveraging community cultural IP.

**Live site:** [detroit.badmandigitalarchive.com](https://detroit.badmandigitalarchive.com)

---

## About This Project

The Detroit Badman Archive documents figures — real and fictional — who embody the Black badman archetype across distinct modalities of masculine resistance to systemic oppression. The archive combines scholarly rigor with community engagement, using geospatial and network visualizations to make Detroit's cultural heritage legible, searchable, and defensible.

For the full project vision, governance structure, and cultural IP protection framework, see the [Architectural Blueprint](./docs/BDA_Architectural_Blueprint.pdf).

---

## Current State

The Detroit module launched in **May 2026** and is live at [detroit.badmandigitalarchive.com](https://detroit.badmandigitalarchive.com).

### At launch
- **15 figures** across **3 active modalities**: Detective, Political Revolutionary, Superhero-Villain
- Interactive geospatial map with modality filtering
- Force-directed network visualization with timeline and influence metrics
- Community Repository for figure submissions
- Figure pages, source pages, and scholarly apparatus

### Roadmap
- Additional figures across active modalities (ongoing)
- Activation of Gangsta-Pimp modality (GPM)
- Activation of Folk Hero-Outlaw modality (FHOM)
- Additional city modules
- AI Curator (national scope, under development)
- Academic Blog (national scope, under development)

---

## The Badman Framework

The archive operates on a two-part analytical framework: a five-criteria definition of the badman tradition, and a five-modality sorting system that distinguishes concurrent sub-archetypes of Black masculine resistance adapted to distinct material and historical conditions.

### Five criteria (the floor)
Every figure in the archive is evaluated against five characteristics: **Outlaw Relationship to Law**, **Community Authorization**, **Violence as Language**, **Cultural Preservation Function**, and **Hypermasculine Performance**. A figure is scored 1–5 on each criterion; total scores range from 5 to 25.

### Five modalities (the sorting architecture)
- **Folk Hero-Outlaw** — figures operating where legal authority does not register
- **Detective** — figures reading and navigating systems of power to protect Black life
- **Political Revolutionary** — figures using political education and action to change the system; militancy forced by state response
- **Gangsta-Pimp** — figures adopting the system's extractive logic after revolutionary failure
- **Superhero-Villain** — figures with literalized extraordinary abilities operating within superhero genre conventions

For the complete framework, see the [Modality Sorting Framework](./docs/BDA_Modality_Sorting_Framework.pdf).

---

## Platform Features

### Interactive Map
Geospatial visualization of figures and territories across Detroit. Each figure appears as a modality-specific marker; territory polygons show areas of operation. Clicking a marker opens a detail panel with biography, score breakdown, and source links. Modality filtering is available.

### Network Visualization
Force-directed graph showing connections between figures across time. Node size scales with curated scholarly influence estimates; edge styles encode connection type and evidence quality. A timeline slider drives the entire visualization, showing figures emerge, grow, and persist based on cultural presence.

### Community Repository
Submission pipeline for community-sourced figures. Submissions enter an eight-stage review process where the research team vets each entry against the five-criteria framework before migration to the public archive. Contributors are notified upon approval.

### Planned features (national scope)
- **AI Curator** — linguistically just interactive guide to the archive
- **Academic Blog** — scholarly publication platform with archive as primary source

---

## Launch Dataset

At launch, the archive includes **15 figures across 3 active modalities** (5 figures per modality). Additional figures are queued for post-launch expansion, and two modalities (Gangsta-Pimp and Folk Hero-Outlaw) are reserved for future activation.

The complete figure roster is available on the [live site](https://detroit.badmandigitalarchive.com).

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Bootstrap 5 | Responsive layout, navigation, UI components |
| Geospatial | Leaflet.js | Interactive map with markers and territory polygons |
| Network | D3.js v7 | Force-directed graph and timeline visualization |
| Scripting | Vanilla JavaScript | Lightweight interactivity, no build step |
| Data | JSON | Single data source per city, feeding both visualization tools |
| Forms | Google Forms | Community submission intake |
| Hosting | GitHub Pages | Static site hosting. Migration to owned server infrastructure planned per Blueprint sovereignty model. |

---

## Repository Structure

```
badman-archive/
├── README.md
├── index.html                        # Home
├── 404.html                          # Not-found page
├── /about/
│   ├── project.html                  # About > The Project
│   ├── tradition.html                # About > The Badman Tradition
│   └── methodology.html              # About > Methodology
├── /archive/
│   ├── figures.html                  # Figures landing
│   ├── sources.html                  # Primary Sources landing
│   ├── /figures/                     # Individual figure pages
│   │   ├── baker-gordon.html
│   │   ├── kenyatta.html
│   │   ├── scott-ron.html
│   │   └── [...]
│   └── /sources/                     # Individual source pages
│       └── [slug].html
├── /visualizations/
│   ├── map.html                      # Geospatial map tool
│   └── network.html                  # Network visualization tool
├── /engagement/
│   ├── submit.html                   # Submit a Figure
│   └── events.html                   # Events
├── contact.html
├── cite.html                         # How to cite the archive
├── /partials/                        # Shared components
│   ├── navbar.html
│   ├── footer.html
│   └── credentialing-rail.html
├── /data/
│   ├── detroit.json                  # Primary data file
│   └── DATAREADME.md
├── /css/
│   └── styles.css
├── /js/
│   └── scripts.js
├── /assets/
│   ├── /images/
│   ├── /sources/                     # Digitized source materials
│   └── favicon.ico
└── /docs/
    ├── HTML_TEMPLATES.md
    ├── CSS_DOCUMENTATION.md
    ├── JAVASCRIPT_DOCUMENTATION.md
    ├── MAPREADME.md
    ├── NVTREADME.md
    ├── BDA_Architectural_Blueprint.pdf
    ├── BDA_Modality_Sorting_Framework.pdf
    ├── BDA_Pre_Launch_Sprint_Scoping.docx
    └── BDA_Accessibility_Audit_PunchList.docx
```

---

## Cultural IP Protection

The archive is more than a preservation project. It is designed to create legal and institutional leverage for the communities whose cultural heritage it documents. The archive's compilation — its curated, scored, annotated, and geospatially mapped dataset — is a copyrightable work that serves as the basis for licensing arrangements with commercial entities seeking to use the heritage it documents.

For the full cultural IP framework, institutional partnership architecture, and community benefit mechanics, see the [Architectural Blueprint](./docs/BDA_Architectural_Blueprint.pdf).

---

## Documentation

This repository includes technical documentation for each layer of the archive:

| Document | Purpose |
|----------|---------|
| [README.md](./README.md) | This document — project overview and orientation |
| [HTML_TEMPLATES.md](./docs/HTML_TEMPLATES.md) | Page templates, accessibility patterns, modality visual identity |
| [CSS_DOCUMENTATION.md](./docs/CSS_DOCUMENTATION.md) | Custom styles, color variables, accessibility utilities |
| [JAVASCRIPT_DOCUMENTATION.md](./docs/JAVASCRIPT_DOCUMENTATION.md) | Shared scripts, modality configuration, detail panel logic |
| [DATAREADME.md](./data/DATAREADME.md) | JSON schema, field definitions, data entry workflow |
| [MAPREADME.md](./docs/MAPREADME.md) | Map visualization tool — features, data requirements, customization |
| [NVTREADME.md](./docs/NVTREADME.md) | Network visualization tool — features, data requirements, customization |
| [BDA_Accessibility_Audit_PunchList](./docs/BDA_Accessibility_Audit_PunchList.docx) | WCAG 2.2 AA / MSU Basic Checklist audit and remediation log |
| [BDA_Pre_Launch_Sprint_Scoping](./docs/BDA_Pre_Launch_Sprint_Scoping.docx) | Pre-launch sprint scope and sequencing |
| [BDA_Architectural_Blueprint](./docs/BDA_Architectural_Blueprint.pdf) | Full project vision, governance, and IP framework |
| [BDA_Modality_Sorting_Framework](./docs/BDA_Modality_Sorting_Framework.pdf) | Complete modality framework and sorting criteria |

---

## Contributing

### Community submissions
Community members are invited to submit figures for consideration through the Repository page on the live site. Submissions undergo vetting against the five-criteria framework before inclusion. See the [Submit a Figure](https://detroit.badmandigitalarchive.com/engagement/submit) page for submission guidelines and the form.

### Developer contributions
Development is led by Harry M. Foster with support from the Cultural Heritage Informatics (CHI) Fellowship and CHI directors **Dr. Gillian MacDonald** and **Dr. Maddie Mackie**.

---

## Accessibility

The archive is built to meet **WCAG 2.2 Level AA** and the **MSU Digital Accessibility Basic Checklist**. Accessibility is treated as structural architecture rather than a post-hoc remediation layer. Key practices include:

- Sequential heading hierarchy across all pages
- Keyboard operability for all interactive elements (including D3 network nodes)
- `prefers-reduced-motion` support on animated visualizations
- Color is never the sole differentiator (shape + color + icon per modality)
- Screen-reader-accessible alternative paths for map and network visualizations
- ARIA live regions for dynamic content updates

Full audit findings and remediation status are documented in the [Accessibility Audit Punch List](./docs/BDA_Accessibility_Audit_PunchList.docx).

---

## License

- **Original metadata and compilation:** Creative Commons CC BY 4.0
- **Linked materials:** Fair use for educational purposes

> *[LEGAL REVIEW: post-launch]* The CC BY 4.0 designation on original metadata may require reconsideration in light of the compilation copyright framework described in the Architectural Blueprint. CC BY permits commercial use with attribution, which may conflict with the archive's commercial licensing thesis. Consult IP counsel before finalizing.

---

## Attribution

**Harry M. Foster**
Founder and Managing Director
Badman Digital Archive

The Detroit Badman Archive originated through the Cultural Heritage Informatics (CHI) Fellowship at Michigan State University.

---

## Contact

**Email:** [hfoster@badmandigitalarchive.com](mailto:hfoster@badmandigitalarchive.com)

---

*Last updated: [PLACEHOLDER — auto-populate on commit or manually update]*
