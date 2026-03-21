# YoungFamilyTree — Project Overview

## Purpose

A private web application for exploring and interacting with the Young family genealogy research. The underlying data lives in a RootsMagic SQLite database (`tree/Main3.rmtree`) maintained by Simon Young, containing 714 individuals across 221 families spanning several centuries of English and French family history.

## Data Summary

### Scale

| Metric | Count |
|--------|-------|
| Individuals | 714 |
| Families | 221 |
| Events | 1,595 |
| Places | 935 |
| Sources | 15 |
| Citations | 836 |
| Living people | 181 |

### Key Surname Lines

| Surname | People | Notes |
|---------|--------|-------|
| **Mullord** | 162 | Dominant line. English, concentrated in London/Middlesex/Surrey |
| **Young** | 87 | Core family. Christopher Young & Sarah Maddison had 14 children |
| **Delafosse** | 31 | English-French. Robert Mark Delafosse (1757-1819) married Jane Theresia d'Abbadie |
| **d'Abbadie** | 25 | French Huguenot origin. Tonnay-Charente, France |
| **Whitlock** | 23 | Connected line |
| Collins | 15 | Edward & Sarah Collins — 12 children |
| Bond | 15 | Frederick Hookey Bond married Mary Isabella Delafosse |
| Luke | 13 | Delia Ann Luke married Francis Chilton Young |
| Slade | 10 | James Christopher Slade married Annie Anson |

### Largest Families

| Parents | Children |
|---------|----------|
| Christopher Young & Sarah Maddison | 14 |
| Thomas Chilton Lambton Young & Margaret Louisa D'Abbadie | 13 |
| Edward Collins & Sarah Collins | 12 |
| Alexander Mullord & Annie Roberts | 12 |
| Charles Henry Mullord & Hannah Elizabeth Roberts | 11 |
| Robert Mark Delafosse & Jane Theresia d'Abbadie | 10 |
| Frederick Hookey Bond & Mary Isabella Delafosse | 10 |

### Event Distribution

| Event Type | Count |
|------------|-------|
| Birth | 571 |
| Death | 273 |
| Occupation | 230 |
| Census | 169 |
| Marriage | 126 |
| Property | 83 |
| Baptism | 73 |
| Burial | 27 |
| Residence | 21 |
| Other (Christen, Witness, Medical, Title, etc.) | 22 |

### Geographic Focus

**England (primary):**
- London boroughs: Richmond, Islington, Shoreditch, St Pancras, Camberwell, Hoxton, Hornsey
- Surrey, Buckinghamshire (Iver), Wiltshire (Marlborough), Devon (Dodbrooke)
- Cornwall (Lanteglos by Fowey), Newcastle-on-Tyne, Gravesend

**France:**
- Tonnay-Charente (d'Abbadie / Delafosse connections)

### Sources

The data was assembled from three primary GEDCOM imports (originally from Family Historian, maintained by Julie Young):
1. `cleaned mullord descendants.ged` — 463 citations
2. `mullords_from_irving.ged` — 171 citations
3. `dabbadies_from_cleary.ged` — 133 citations

Supplemented with:
- England Census records (1861-1911) — 53 citations
- London marriages & banns (1754-1921) — 10 citations
- England & Wales death index — 3 citations
- Ecclesiastical records, birth certificates, Genesreunited contributions

### Research Documents

- `docs/Young_Carey_Research.docx` — Primary research notes (5.2 MB)
- `reports/AJY_rel_RobertYoung.docx` — RootsMagic relationship report
- `resources/visitationofeng_Vol5_p140-142.pdf` — Historical "Visitation of England" reference

## Database Technical Details

- **File:** `tree/Main3.rmtree` (2.9 MB SQLite database)
- **Format:** RootsMagic 10 schema with custom `RMNOCASE` collation
- **Key tables:** PersonTable, NameTable, FamilyTable, ChildTable, EventTable, PlaceTable, SourceTable, CitationTable, FactTypeTable, MediaLinkTable
- **Access note:** SQLite queries require registering the `RMNOCASE` collation (case-insensitive string comparison). In Python: `conn.create_collation('RMNOCASE', lambda x, y: (x.lower() > y.lower()) - (x.lower() < y.lower()))`

### RootsMagic Workflow

The tree is actively maintained in RootsMagic desktop software. The workflow (documented in `tree/working_copies/README.md`):
1. Copy `Main3.rmtree` to `tree/working_copies/` for editing
2. Edit in RootsMagic (working copies are gitignored)
3. Copy back to `tree/Main3.rmtree` when done
4. Commit with descriptive genealogical change messages

## Webapp Vision

Build a modern, private web application that lets family members explore and interact with the genealogy research:

- **Interactive family tree** — navigable, zoomable tree/graph visualization
- **Person profiles** — birth, death, occupation, residence, census data, sources
- **Search & filter** — by surname, place, date range, event type
- **Map view** — plot locations on a map showing family movements and emigration
- **Timeline view** — chronological events across the family
- **Relationship explorer** — find connections between any two people
- **Source browser** — view citations and source material
- **Privacy controls** — hide/redact living individuals

### Technical Direction

- TypeScript (Rob's preference for new projects)
- No ORM — raw SQL queries against the RootsMagic SQLite database
- Read-only webapp (RootsMagic remains the editing tool)
- Private/self-hosted — not publicly accessible
- Modern frontend with responsive design

## Repository Structure

```
YoungFamilyTree/
├── CLAUDE.md              # AI agent instructions
├── PROJECT.md             # This file — research & context
├── WORK-LOG.md            # Progress log
├── .gitignore             # RootsMagic artifacts excluded
├── tree/
│   ├── Main3.rmtree       # Authoritative RootsMagic database (source of truth)
│   ├── backup/            # Local backups (gitignored)
│   └── working_copies/    # Temp editing copies (gitignored)
├── app/                   # Web application
│   ├── package.json
│   ├── scripts/migrate.ts # ETL: RootsMagic → clean SQLite
│   ├── data/family.db     # Clean database (generated, gitignored)
│   ├── server/            # Express API (port 3001)
│   ├── src/               # React + Vite frontend
│   └── index.html
├── docs/
│   └── Young_Carey_Research.docx
├── reports/
│   └── AJY_rel_RobertYoung.docx
└── resources/
    └── visitationofeng_Vol5_p140-142.pdf
```

## How to Run

```bash
cd app
npm install
npm run migrate   # Extract data from RootsMagic → data/family.db
npm run dev        # Start API + frontend (localhost:5173)
```
