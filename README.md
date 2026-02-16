# The Badman Archive – Detroit Module

A digital humanities platform documenting the evolution of the Black badman archetype in Detroit, serving as both a scholarly resource and community heritage platform.

## Overview

The Badman Archive maps Black masculine heroism through interactive geospatial visualization and network analysis. Detroit serves as the proof-of-concept module—a replicable framework designed for nationwide expansion to document how localized resistance strategies connect to form a national grammar of survival.

The archive examines both real historical figures and fictional characters who embody the "badman" archetype in African American folklore: individuals who operated outside legal systems while maintaining community support and representing masculine resistance narratives.

## Features

### Interactive Geospatial Map
- Location markers for key sites (Paradise Valley, Black Bottom, Highland Park, Dodge Main)
- Territory polygons showing areas of operation
- Color-coded markers by modality (Detective, Political Revolutionary)
- Biographical panels with external links to primary sources

### Network Analysis Visualization
- Timeline slider showing emergence of figures across time
- Force-directed graph displaying influence relationships
- Connection types: creator-to-creation, ideological alignment, geographic convergence
- Influence metrics (publication data, media coverage, cultural impact)

### Community Repository
- Submission pipeline for community-sourced badman figures
- Five-criteria vetting framework
- Contributor notification upon approval

## Initial Dataset (Spring 2026)

### Detective Modality
| Figure | Type | Years Active | Badman Score |
|--------|------|--------------|--------------|
| Donald Goines | Real (Meta-Badman) | 1936-1974 | 25/25 |
| Kenyatta | Fictional | 1974-1975 | 22/25 |
| Action Jackson | Fictional | 1988 | 21/25 |

### Political Revolutionary Modality
| Figure | Type | Years Active | Badman Score |
|--------|------|--------------|--------------|
| Ron Scott | Real | 1947-2015 | 23/25 |
| General Gordon Baker Jr. | Real | 1941-2014 | 19/25 |

## Five-Criteria Badman Evaluation Framework

Each figure is scored on a 5-point scale across five dimensions:

1. **Outlaw Relationship to Law** – Operating outside or against legal systems
2. **Community Authorization** – Recognition and support from Black communities
3. **Violence as Language** – Use of force as expression of resistance
4. **Cultural Preservation Function** – Role in maintaining/transmitting Black cultural knowledge
5. **Hypermasculine Performance** – Embodiment of Black masculine heroic ideals

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Bootstrap 5 | Responsive layout, navigation, UI components |
| Geospatial | Leaflet.js | Interactive map with markers and territory polygons |
| Network | D3.js | Force-directed graph and timeline visualization |
| Scripting | Vanilla JavaScript | Lightweight interactivity |
| Data | JSON | Single data source feeding both visualization tools |
| Forms | Google Forms | Community submission intake |
| Hosting | GitHub Pages | Static site hosting |

## Project Structure

```
badman-archive/
├── index.html              # Landing page
├── map.html                # Geospatial visualization
├── network.html            # Network analysis tool
├── repository.html         # Community submission portal
├── about.html              # Project background and methodology
├── how-to-use.html         # User guide and tutorials
├── resources.html          # Bibliography and citations
├── /assets/
│   ├── /css/
│   ├── /js/
│   └── /images/
├── /data/
│   └── detroit.json        # Primary data file
└── README.md
```

## Scholarly Context

This archive emerges from doctoral research tracing the Black badman as a continuous tradition of cultural resistance across five distinct modalities:

- **Folk Hero-Outlaw** (Post-Emancipation)
- **Detective** (1900s–present)
- **Political Revolutionary** (1950s–present)
- **Gangsta/Pimp** (1970s–present)
- **Superhero-Villain** (1950s–present)

The Detroit module focuses on Detective and Political Revolutionary modalities, with expansion planned for future development.

## Future Development

The modular architecture supports expansion to additional cities:
- `detroit.badmandigitalarchive.com` (current)
- `atlanta.badmandigitalarchive.com` (planned)
- `chicago.badmandigitalarchive.com` (planned)
- `nyc.badmandigitalarchive.com` (planned)

Each city module operates independently while sharing a unified data structure.

## Contributing

Community submissions are welcome through the Repository page. All submissions undergo vetting against the five-criteria framework before inclusion in the public archive.

## License

- **Original Metadata**: Creative Commons CC BY 4.0
- **Linked Materials**: Fair use for educational purposes

## Acknowledgments

This project is developed as part of the Cultural Heritage Informatics (CHI) Fellowship at Michigan State University.

## Contact

**Harry M. Foster**  
Doctoral Student, Michigan State University  
GitHub: [@HFoster26](https://github.com/HFoster26)

---


