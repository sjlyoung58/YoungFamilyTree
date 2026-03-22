/**
 * ETL Migration: RootsMagic → Clean SQLite
 *
 * Reads tree/Main3.rmtree (RootsMagic proprietary schema)
 * Writes app/data/family.db (clean, open schema we control)
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const SOURCE = path.join(ROOT, 'tree/Main3.rmtree');
const DEST = path.join(ROOT, 'app/data/family.db');

// --- RootsMagic date parsing ---

interface ParsedDate {
  year: number | null;
  month: number | null;
  day: number | null;
  circa: boolean;
  raw: string;
}

function parseRMDate(rmDate: string): ParsedDate {
  const empty: ParsedDate = { year: null, month: null, day: null, circa: false, raw: rmDate || '' };
  if (!rmDate || rmDate === '.' || rmDate.trim() === '') return empty;

  // RootsMagic date format: D.+YYYYMMDD..+00000000..
  // Prefix codes: D = exact, R = range, E = estimated/circa, etc.
  const circa = rmDate.startsWith('E') || rmDate.startsWith('S') || rmDate.startsWith('L');

  const match = rmDate.match(/[A-Z]\.[+-](\d{4})(\d{2})(\d{2})/);
  if (!match) return empty;

  const year = parseInt(match[1]) || null;
  const month = parseInt(match[2]) || null;
  const day = parseInt(match[3]) || null;

  return { year, month, day, circa, raw: rmDate };
}

function formatDate(d: ParsedDate): string {
  if (!d.year) return '';
  const parts: string[] = [];
  if (d.circa) parts.push('c.');
  if (d.day && d.month) {
    const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    parts.push(`${d.day} ${months[d.month]} ${d.year}`);
  } else if (d.month) {
    const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    parts.push(`${months[d.month]} ${d.year}`);
  } else {
    parts.push(`${d.year}`);
  }
  return parts.join(' ');
}

// --- Sex mapping ---
function mapSex(rmSex: number): string {
  switch (rmSex) {
    case 0: return 'M';
    case 1: return 'F';
    default: return 'U';
  }
}

// --- Relationship mapping ---
function mapRelation(rmRel: number): string {
  switch (rmRel) {
    case 0: return 'birth';
    case 1: return 'adopted';
    case 2: return 'step';
    case 3: return 'foster';
    case 4: return 'related';
    case 5: return 'guardian';
    case 6: return 'sealed';
    default: return 'unknown';
  }
}

// --- Coordinate conversion (RootsMagic stores as integer * 10,000,000) ---
function convertCoord(rmCoord: number): number | null {
  if (!rmCoord || rmCoord === 0) return null;
  return rmCoord / 10000000;
}

// --- Main migration ---

function migrate() {
  console.log('Opening RootsMagic database:', SOURCE);
  if (!fs.existsSync(SOURCE)) {
    console.error('Source database not found:', SOURCE);
    process.exit(1);
  }

  const src = new Database(SOURCE, { readonly: true });
  src.function('RMNOCASE', { deterministic: true }, (a: unknown, b: unknown) => {
    const sa = String(a ?? '').toLowerCase();
    const sb = String(b ?? '').toLowerCase();
    return sa < sb ? -1 : sa > sb ? 1 : 0;
  });

  // Register as collation too
  try {
    // better-sqlite3 doesn't support custom collations directly,
    // but we can work around RMNOCASE by using NOCASE in our queries
    // and the function above handles function calls
  } catch {
    // Collation registration not supported, queries will work without it
    // since we're reading data, not filtering with COLLATE
  }

  // Remove existing output
  if (fs.existsSync(DEST)) {
    fs.unlinkSync(DEST);
    console.log('Removed existing family.db');
  }

  const dest = new Database(DEST);
  dest.pragma('journal_mode = WAL');
  // Defer FK checks until after all data is loaded
  dest.pragma('foreign_keys = OFF');

  console.log('Creating clean schema...');
  dest.exec(`
    CREATE TABLE people (
      id INTEGER PRIMARY KEY,
      given_name TEXT NOT NULL DEFAULT '',
      surname TEXT NOT NULL DEFAULT '',
      prefix TEXT NOT NULL DEFAULT '',
      suffix TEXT NOT NULL DEFAULT '',
      nickname TEXT NOT NULL DEFAULT '',
      sex TEXT NOT NULL CHECK(sex IN ('M', 'F', 'U')) DEFAULT 'U',
      birth_year INTEGER,
      death_year INTEGER,
      birth_date TEXT NOT NULL DEFAULT '',
      death_date TEXT NOT NULL DEFAULT '',
      birth_place TEXT NOT NULL DEFAULT '',
      death_place TEXT NOT NULL DEFAULT '',
      is_living INTEGER NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE families (
      id INTEGER PRIMARY KEY,
      partner1_id INTEGER REFERENCES people(id),
      partner2_id INTEGER REFERENCES people(id),
      marriage_date TEXT NOT NULL DEFAULT '',
      marriage_year INTEGER,
      marriage_place TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE children (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL REFERENCES people(id),
      family_id INTEGER NOT NULL REFERENCES families(id),
      birth_order INTEGER,
      relation_to_partner1 TEXT NOT NULL DEFAULT 'birth',
      relation_to_partner2 TEXT NOT NULL DEFAULT 'birth'
    );

    CREATE TABLE events (
      id INTEGER PRIMARY KEY,
      person_id INTEGER REFERENCES people(id),
      family_id INTEGER REFERENCES families(id),
      event_type TEXT NOT NULL,
      date_display TEXT NOT NULL DEFAULT '',
      year INTEGER,
      month INTEGER,
      day INTEGER,
      sort_order INTEGER NOT NULL DEFAULT 0,
      place TEXT NOT NULL DEFAULT '',
      details TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE places (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      latitude REAL,
      longitude REAL
    );

    CREATE TABLE sources (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      ref_number TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE citations (
      id INTEGER PRIMARY KEY,
      source_id INTEGER NOT NULL REFERENCES sources(id),
      person_id INTEGER,
      event_id INTEGER,
      detail TEXT NOT NULL DEFAULT '',
      actual_text TEXT NOT NULL DEFAULT ''
    );

    -- Indexes for fast lookups
    CREATE INDEX idx_people_surname ON people(surname);
    CREATE INDEX idx_people_birth_year ON people(birth_year);
    CREATE INDEX idx_children_family ON children(family_id);
    CREATE INDEX idx_children_child ON children(child_id);
    CREATE INDEX idx_events_person ON events(person_id);
    CREATE INDEX idx_events_family ON events(family_id);
    CREATE INDEX idx_events_type ON events(event_type);
    CREATE INDEX idx_events_year ON events(year);
    CREATE INDEX idx_citations_person ON citations(person_id);
    CREATE INDEX idx_citations_source ON citations(source_id);
    CREATE INDEX idx_families_partner1 ON families(partner1_id);
    CREATE INDEX idx_families_partner2 ON families(partner2_id);
  `);

  // --- Migrate people ---
  console.log('Migrating people...');
  // Select all names first, then filter to primary in JS (avoids RMNOCASE on NameTable)
  const allNames = src.prepare(`
    SELECT OwnerID, Given, Surname, Prefix, Suffix, Nickname, BirthYear, DeathYear, IsPrimary
    FROM NameTable
  `).all() as Array<{
    OwnerID: number; Given: string; Surname: string; Prefix: string; Suffix: string;
    Nickname: string; BirthYear: number; DeathYear: number; IsPrimary: number;
  }>;
  const primaryNames = new Map<number, typeof allNames[0]>();
  for (const n of allNames) {
    if (n.IsPrimary === 1) primaryNames.set(n.OwnerID, n);
  }

  const allPersons = src.prepare(`
    SELECT PersonID, Sex, Living, Note FROM PersonTable
  `).all() as Array<{ PersonID: number; Sex: number; Living: number; Note: string }>;

  const people = allPersons
    .filter(p => primaryNames.has(p.PersonID))
    .map(p => {
      const n = primaryNames.get(p.PersonID)!;
      return { ...p, ...n };
    }) as Array<{
    PersonID: number; Sex: number; Living: number; Note: string;
    Given: string; Surname: string; Prefix: string; Suffix: string;
    Nickname: string; BirthYear: number; DeathYear: number;
  }>;

  const insertPerson = dest.prepare(`
    INSERT INTO people (id, given_name, surname, prefix, suffix, nickname, sex, birth_year, death_year, is_living, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const personTx = dest.transaction(() => {
    for (const p of people) {
      insertPerson.run(
        p.PersonID,
        p.Given || '',
        p.Surname || '',
        p.Prefix || '',
        p.Suffix || '',
        p.Nickname || '',
        mapSex(p.Sex),
        p.BirthYear || null,
        p.DeathYear || null,
        p.Living ? 1 : 0,
        p.Note || ''
      );
    }
  });
  personTx();
  console.log(`  ${people.length} people migrated`);

  // --- Migrate places ---
  // Note: PlaceTable uses COLLATE RMNOCASE on Name, which better-sqlite3 can't handle.
  // We select all rows and filter in JS to avoid triggering the collation.
  console.log('Migrating places...');
  const allPlaces = src.prepare(`
    SELECT PlaceID, Name, Latitude, Longitude FROM PlaceTable
  `).all() as Array<{ PlaceID: number; Name: string; Latitude: number; Longitude: number }>;
  const places = allPlaces.filter(p => p.Name && p.Name.trim() !== '');

  const insertPlace = dest.prepare(`
    INSERT INTO places (id, name, latitude, longitude) VALUES (?, ?, ?, ?)
  `);

  const placeTx = dest.transaction(() => {
    for (const p of places) {
      insertPlace.run(p.PlaceID, p.Name, convertCoord(p.Latitude), convertCoord(p.Longitude));
    }
  });
  placeTx();
  console.log(`  ${places.length} places migrated`);

  // Build place name lookup for denormalized fields
  const placeNames = new Map<number, string>();
  for (const p of places) {
    placeNames.set(p.PlaceID, p.Name);
  }

  // --- Migrate events & update people with birth/death details ---
  console.log('Migrating events...');

  // Build fact type lookup (avoids JOIN on RMNOCASE table)
  const factTypes = src.prepare(`SELECT FactTypeID, Name FROM FactTypeTable`).all() as Array<{ FactTypeID: number; Name: string }>;
  const factTypeMap = new Map<number, string>();
  for (const ft of factTypes) factTypeMap.set(ft.FactTypeID, ft.Name);

  const rawEvents = src.prepare(`
    SELECT EventID, EventType, OwnerType, OwnerID, FamilyID, PlaceID,
           Date, SortDate, IsPrimary, Details, Note
    FROM EventTable
    ORDER BY SortDate
  `).all() as Array<{
    EventID: number; EventType: number; OwnerType: number; OwnerID: number;
    FamilyID: number; PlaceID: number; Date: string; SortDate: number;
    IsPrimary: number; Details: string; Note: string;
  }>;
  const events = rawEvents.map(e => ({ ...e, TypeName: factTypeMap.get(e.EventType) || 'Unknown' }));

  const insertEvent = dest.prepare(`
    INSERT INTO events (id, person_id, family_id, event_type, date_display, year, month, day, sort_order, place, details, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const updatePersonBirth = dest.prepare(`
    UPDATE people SET birth_date = ?, birth_place = ? WHERE id = ?
  `);
  const updatePersonDeath = dest.prepare(`
    UPDATE people SET death_date = ?, death_place = ? WHERE id = ?
  `);

  const eventTx = dest.transaction(() => {
    for (const e of events) {
      const parsed = parseRMDate(e.Date);
      const dateDisplay = formatDate(parsed);
      const placeName = e.PlaceID ? (placeNames.get(e.PlaceID) || '') : '';

      // OwnerType: 0 = individual, 1 = family
      const personId = e.OwnerType === 0 ? e.OwnerID : null;
      const familyId = e.OwnerType === 1 ? e.OwnerID : null;

      insertEvent.run(
        e.EventID, personId, familyId,
        e.TypeName, dateDisplay,
        parsed.year, parsed.month, parsed.day,
        e.SortDate || 0, placeName, e.Details || '', e.Note || ''
      );

      // Update denormalized birth/death on person record
      if (personId && e.IsPrimary) {
        if (e.TypeName === 'Birth') {
          updatePersonBirth.run(dateDisplay, placeName, personId);
        } else if (e.TypeName === 'Death') {
          updatePersonDeath.run(dateDisplay, placeName, personId);
        }
      }
    }
  });
  eventTx();
  console.log(`  ${events.length} events migrated`);

  // --- Migrate families ---
  console.log('Migrating families...');
  const families = src.prepare(`
    SELECT FamilyID, FatherID, MotherID FROM FamilyTable
  `).all() as Array<{ FamilyID: number; FatherID: number; MotherID: number }>;

  const insertFamily = dest.prepare(`
    INSERT INTO families (id, partner1_id, partner2_id) VALUES (?, ?, ?)
  `);

  // Look up marriage events for families (using factTypeMap to avoid RMNOCASE JOIN)
  const marriageEvents = new Map<number, { date: string; year: number | null; place: string }>();
  const marriageTypeId = [...factTypeMap.entries()].find(([, name]) => name === 'Marriage')?.[0];
  const famMarriages = marriageTypeId
    ? src.prepare(`
        SELECT OwnerID as FamilyID, Date, PlaceID
        FROM EventTable
        WHERE OwnerType = 1 AND EventType = ? AND IsPrimary = 1
      `).all(marriageTypeId) as Array<{ FamilyID: number; Date: string; PlaceID: number }>
    : [];

  for (const m of famMarriages) {
    const parsed = parseRMDate(m.Date);
    marriageEvents.set(m.FamilyID, {
      date: formatDate(parsed),
      year: parsed.year,
      place: m.PlaceID ? (placeNames.get(m.PlaceID) || '') : '',
    });
  }

  const updateFamilyMarriage = dest.prepare(`
    UPDATE families SET marriage_date = ?, marriage_year = ?, marriage_place = ? WHERE id = ?
  `);

  const familyTx = dest.transaction(() => {
    for (const f of families) {
      insertFamily.run(
        f.FamilyID,
        f.FatherID || null,
        f.MotherID || null
      );
      const marriage = marriageEvents.get(f.FamilyID);
      if (marriage) {
        updateFamilyMarriage.run(marriage.date, marriage.year, marriage.place, f.FamilyID);
      }
    }
  });
  familyTx();
  console.log(`  ${families.length} families migrated`);

  // --- Migrate children ---
  console.log('Migrating children...');
  const children = src.prepare(`
    SELECT RecID, ChildID, FamilyID, RelFather, RelMother, ChildOrder FROM ChildTable
  `).all() as Array<{
    RecID: number; ChildID: number; FamilyID: number;
    RelFather: number; RelMother: number; ChildOrder: number;
  }>;

  const insertChild = dest.prepare(`
    INSERT INTO children (child_id, family_id, birth_order, relation_to_partner1, relation_to_partner2)
    VALUES (?, ?, ?, ?, ?)
  `);

  const childTx = dest.transaction(() => {
    for (const c of children) {
      insertChild.run(
        c.ChildID, c.FamilyID, c.ChildOrder,
        mapRelation(c.RelFather), mapRelation(c.RelMother)
      );
    }
  });
  childTx();
  console.log(`  ${children.length} children migrated`);

  // --- Migrate sources ---
  console.log('Migrating sources...');
  const sources = src.prepare(`
    SELECT SourceID, Name, RefNumber FROM SourceTable
  `).all() as Array<{ SourceID: number; Name: string; RefNumber: string | null }>;

  const insertSource = dest.prepare(`
    INSERT INTO sources (id, name, ref_number) VALUES (?, ?, ?)
  `);

  const sourceTx = dest.transaction(() => {
    for (const s of sources) {
      insertSource.run(s.SourceID, s.Name || '', s.RefNumber || '');
    }
  });
  sourceTx();
  console.log(`  ${sources.length} sources migrated`);

  // --- Migrate citations (linked to people via events) ---
  // Separate queries to avoid RMNOCASE issues on CitationTable
  console.log('Migrating citations...');
  const allCitations = src.prepare(`
    SELECT CitationID, SourceID, Comments, ActualText FROM CitationTable
  `).all() as Array<{ CitationID: number; SourceID: number; Comments: string; ActualText: string }>;
  const citationLinks = src.prepare(`
    SELECT CitationID, OwnerType, OwnerID FROM CitationLinkTable
  `).all() as Array<{ CitationID: number; OwnerType: number; OwnerID: number }>;

  // Join in JS
  const citationMap = new Map<number, typeof allCitations[0]>();
  for (const c of allCitations) citationMap.set(c.CitationID, c);

  const citations = citationLinks
    .filter(cl => citationMap.has(cl.CitationID))
    .map(cl => {
      const c = citationMap.get(cl.CitationID)!;
      return { ...c, OwnerType: cl.OwnerType, OwnerID: cl.OwnerID };
    });

  const insertCitation = dest.prepare(`
    INSERT OR IGNORE INTO citations (id, source_id, person_id, event_id, detail, actual_text)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const citationTx = dest.transaction(() => {
    for (const c of citations) {
      // OwnerType: 0 = person, 2 = event, 4 = name, etc.
      const personId = c.OwnerType === 0 ? c.OwnerID : null;
      const eventId = c.OwnerType === 2 ? c.OwnerID : null;

      insertCitation.run(
        c.CitationID, c.SourceID,
        personId, eventId,
        c.Comments || '', c.ActualText || ''
      );
    }
  });
  citationTx();
  console.log(`  ${citations.length} citations migrated`);

  // --- Finalize ---
  src.close();
  dest.pragma('foreign_keys = ON');

  const stats = {
    people: (dest.prepare('SELECT COUNT(*) as n FROM people').get() as { n: number }).n,
    families: (dest.prepare('SELECT COUNT(*) as n FROM families').get() as { n: number }).n,
    children: (dest.prepare('SELECT COUNT(*) as n FROM children').get() as { n: number }).n,
    events: (dest.prepare('SELECT COUNT(*) as n FROM events').get() as { n: number }).n,
    places: (dest.prepare('SELECT COUNT(*) as n FROM places').get() as { n: number }).n,
    sources: (dest.prepare('SELECT COUNT(*) as n FROM sources').get() as { n: number }).n,
    citations: (dest.prepare('SELECT COUNT(*) as n FROM citations').get() as { n: number }).n,
  };

  dest.close();

  console.log('\nMigration complete!');
  console.log('Output:', DEST);
  console.log('Stats:', stats);
}

migrate();
