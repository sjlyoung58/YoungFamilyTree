# YoungFamilyTree — Work Log

## 2026-03-21 — Project setup & data exploration

- Explored the RootsMagic database: 714 individuals, 221 families, 1,595 events, 935 places
- Mapped key surname lines: Mullord (162), Young (87), Delafosse (31), d'Abbadie (25), Whitlock (23)
- Identified geographic focus: London/Surrey/Buckinghamshire (England), Tonnay-Charente (France)
- Documented data sources: 3 GEDCOM imports, census records (1861-1911), marriage/death indexes
- Identified largest families: Christopher Young & Sarah Maddison (14 children), Thomas C.L. Young & Margaret D'Abbadie (13)
- Confirmed RMNOCASE collation requirement for all SQLite queries
- Created project documentation: `CLAUDE.md`, `PROJECT.md`, `WORK-LOG.md`
- Built ETL migration script (`app/scripts/migrate.ts`) — extracts from RootsMagic proprietary schema into clean, open SQLite database (`app/data/family.db`)
- Worked around `better-sqlite3` lack of custom collation support (RMNOCASE) by selecting all rows and filtering/joining in JS
- Built Express API server with endpoints: stats, people (list + detail), families, timeline, surnames, sources, event-types
- Built React + Vite frontend with archival editorial design (Cormorant + Outfit fonts, warm ivory/bronze palette)
- Pages: Dashboard (stats, surname bars, birth decade chart), People (search + filter grid), Person Detail (events, parents, siblings, spouse, children, sources), Timeline (filterable chronological view), Sources
- Privacy: living individuals' details are redacted throughout the UI
- Updated .gitignore for app artifacts (node_modules, dist, family.db)
- **App runs at:** `cd app && npm run dev` → http://localhost:5173/
