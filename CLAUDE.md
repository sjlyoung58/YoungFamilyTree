# YoungFamilyTree — Agent Instructions

## Quick Context

Read `PROJECT.md` for full research summary, data stats, database schema details, and webapp vision. That file is the single source of truth for understanding this project.

## What This Is

A private genealogy webapp built on top of a RootsMagic SQLite database (`tree/Main3.rmtree`) containing 714 individuals across the Young, Mullord, Delafosse, d'Abbadie, and related family lines. The webapp is read-only — RootsMagic remains the editing tool.

## RootsMagic Workflow

Simon maintains the tree in RootsMagic desktop. Read his workflow doc at `tree/working_copies/README.md`. The key points:

1. `tree/Main3.rmtree` is the **authoritative** database — never modify it programmatically
2. RootsMagic `.rmtree` files are SQLite databases that mutate on every open, even with no changes — that's why working copies exist
3. Simon copies `Main3.rmtree` → `tree/working_copies/` for editing (gitignored), edits in RootsMagic, then copies back and commits with a descriptive genealogical message
4. After Simon commits an updated `Main3.rmtree`, run `npm run migrate` in `app/` to refresh the webapp's clean database

The webapp exists alongside this workflow, not instead of it. All genealogical edits happen in RootsMagic. The webapp is a read-only view.

## Key Technical Facts

- **Source data:** `tree/Main3.rmtree` — RootsMagic SQLite database (proprietary schema, RMNOCASE collation)
- **App database:** `app/data/family.db` — clean SQLite extracted via `npm run migrate`. This is what the webapp reads.
- **Migration:** `app/scripts/migrate.ts` extracts from RootsMagic → clean schema. Run `npm run migrate` after any RootsMagic edits.
- **RMNOCASE caveat:** `better-sqlite3` cannot register custom collations. The migration script avoids WHERE/JOIN on RMNOCASE columns by selecting all rows and filtering in JS.
- **Clean schema tables:** people, families, children, events, places, sources, citations
- **Living people:** 181 individuals flagged as living — privacy-protected in the webapp (details redacted)

## Conventions

- TypeScript for new code (no Python unless scripting/data work)
- No ORM — raw SQL queries only
- Doc naming: `PROJECT.md`, `WORK-LOG.md`, `CLAUDE.md` (uppercase)
- Commit messages should describe genealogical or feature changes clearly
- Privacy-first: no public deployment, living people redacted by default

## Do Not

- Modify `tree/Main3.rmtree` directly — it is the authoritative database maintained in RootsMagic (see `tree/working_copies/README.md` for Simon's workflow)
- Modify or remove Simon's `tree/working_copies/` directory or its README — it documents his established workflow
- Expose living individuals' details without explicit privacy controls
- Add unnecessary dependencies — keep the stack lean
- Use ORMs (Prisma, Drizzle, TypeORM, etc.)

## Repository Owner

Simon Young (`sjlyoung58@gmail.com`) — maintains the RootsMagic database.
Rob — building the webapp.
