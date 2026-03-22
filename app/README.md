# Young Family Tree — Web Explorer

A read-only web interface for browsing the Young family genealogy research.

## Prerequisites

- Node.js 20+
- npm

## Getting Started

```bash
npm install
npm run migrate   # Extract data from RootsMagic → data/family.db
npm run dev        # Start dev server → http://localhost:5173
```

## How It Works

The genealogy data lives in a RootsMagic database (`tree/Main3.rmtree`) maintained by Simon in RootsMagic desktop — see `tree/working_copies/README.md` for his editing workflow.

The migration script (`scripts/migrate.ts`) extracts that data into a clean SQLite database (`data/family.db`) with a simple, documented schema. The webapp reads from this clean database — it never touches the RootsMagic file.

**After Simon commits tree edits**, re-run `npm run migrate` to refresh the webapp data.

## Scripts

| Command | What it does |
|---------|-------------|
| `npm run migrate` | Extract RootsMagic data → `data/family.db` |
| `npm run dev` | Start API (port 3001) + frontend (port 5173) |
| `npm run dev:server` | Start API server only |
| `npm run dev:client` | Start Vite frontend only |
| `npm run build` | Production build of frontend |
| `npm start` | Production server (serves built frontend + API) |

## Stack

- **Frontend:** React 19, Vite, React Router
- **Backend:** Express, better-sqlite3
- **Database:** SQLite (clean schema extracted from RootsMagic)
- **Language:** TypeScript throughout, no ORM

## Privacy

181 individuals are flagged as living. Their details (events, dates, places) are redacted throughout the UI.
