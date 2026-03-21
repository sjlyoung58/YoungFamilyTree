import { Router, type Request, type Response } from 'express';
import { getDb } from './db.js';

const router = Router();

// --- Stats ---
router.get('/stats', (_req: Request, res: Response) => {
  const db = getDb();
  const people = (db.prepare('SELECT COUNT(*) as n FROM people').get() as { n: number }).n;
  const families = (db.prepare('SELECT COUNT(*) as n FROM families').get() as { n: number }).n;
  const events = (db.prepare('SELECT COUNT(*) as n FROM events').get() as { n: number }).n;
  const places = (db.prepare("SELECT COUNT(*) as n FROM places WHERE name != ''").get() as { n: number }).n;
  const sources = (db.prepare('SELECT COUNT(*) as n FROM sources').get() as { n: number }).n;
  const living = (db.prepare('SELECT COUNT(*) as n FROM people WHERE is_living = 1').get() as { n: number }).n;

  const surnames = db.prepare(`
    SELECT surname, COUNT(*) as count FROM people
    WHERE surname != '' GROUP BY surname ORDER BY count DESC LIMIT 20
  `).all();

  const decades = db.prepare(`
    SELECT (birth_year / 10) * 10 as decade, COUNT(*) as count
    FROM people WHERE birth_year > 0
    GROUP BY decade ORDER BY decade
  `).all();

  res.json({ people, families, events, places, sources, living, surnames, decades });
});

// --- People ---
router.get('/people', (req: Request, res: Response) => {
  const db = getDb();
  const { q, surname, page = '1', limit = '50' } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  let where = 'WHERE 1=1';
  const params: unknown[] = [];

  if (q) {
    where += ' AND (given_name LIKE ? OR surname LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }
  if (surname) {
    where += ' AND surname = ?';
    params.push(surname);
  }

  const total = (db.prepare(`SELECT COUNT(*) as n FROM people ${where}`).get(...params) as { n: number }).n;

  const rows = db.prepare(`
    SELECT id, given_name, surname, sex, birth_year, death_year,
           birth_date, death_date, birth_place, death_place, is_living
    FROM people ${where}
    ORDER BY surname, given_name
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit as string), offset);

  res.json({ total, page: parseInt(page as string), rows });
});

// --- Person detail ---
router.get('/people/:id', (req: Request, res: Response) => {
  const db = getDb();
  const id = parseInt(req.params.id);

  const person = db.prepare(`
    SELECT * FROM people WHERE id = ?
  `).get(id);

  if (!person) {
    res.status(404).json({ error: 'Person not found' });
    return;
  }

  const events = db.prepare(`
    SELECT * FROM events WHERE person_id = ? ORDER BY sort_order, year, month, day
  `).all(id);

  // Find families where this person is a partner
  const familiesAsPartner = db.prepare(`
    SELECT f.*,
      p1.given_name as p1_given, p1.surname as p1_surname, p1.birth_year as p1_birth, p1.death_year as p1_death,
      p2.given_name as p2_given, p2.surname as p2_surname, p2.birth_year as p2_birth, p2.death_year as p2_death
    FROM families f
    LEFT JOIN people p1 ON f.partner1_id = p1.id
    LEFT JOIN people p2 ON f.partner2_id = p2.id
    WHERE f.partner1_id = ? OR f.partner2_id = ?
  `).all(id, id);

  // Get children for each family
  const familiesWithChildren = familiesAsPartner.map((fam: Record<string, unknown>) => {
    const kids = db.prepare(`
      SELECT c.birth_order, c.relation_to_partner1, c.relation_to_partner2,
             p.id, p.given_name, p.surname, p.birth_year, p.death_year, p.sex, p.is_living
      FROM children c
      JOIN people p ON c.child_id = p.id
      WHERE c.family_id = ?
      ORDER BY c.birth_order, p.birth_year
    `).all(fam.id);
    return { ...fam, children: kids };
  });

  // Find this person as a child (to get parents)
  const asChild = db.prepare(`
    SELECT f.*,
      p1.id as father_id, p1.given_name as father_given, p1.surname as father_surname,
      p1.birth_year as father_birth, p1.death_year as father_death,
      p2.id as mother_id, p2.given_name as mother_given, p2.surname as mother_surname,
      p2.birth_year as mother_birth, p2.death_year as mother_death
    FROM children c
    JOIN families f ON c.family_id = f.id
    LEFT JOIN people p1 ON f.partner1_id = p1.id
    LEFT JOIN people p2 ON f.partner2_id = p2.id
    WHERE c.child_id = ?
  `).all(id);

  // Siblings (from the same family)
  const siblings: Record<string, unknown>[] = [];
  for (const parentFam of asChild as Array<{ id: number }>) {
    const sibs = db.prepare(`
      SELECT p.id, p.given_name, p.surname, p.birth_year, p.death_year, p.sex, p.is_living
      FROM children c
      JOIN people p ON c.child_id = p.id
      WHERE c.family_id = ? AND c.child_id != ?
      ORDER BY c.birth_order, p.birth_year
    `).all(parentFam.id, id);
    siblings.push(...sibs);
  }

  // Citations
  const citations = db.prepare(`
    SELECT ct.*, s.name as source_name
    FROM citations ct
    JOIN sources s ON ct.source_id = s.id
    WHERE ct.person_id = ?
  `).all(id);

  res.json({
    person,
    events,
    families: familiesWithChildren,
    parents: asChild,
    siblings,
    citations,
  });
});

// --- Families ---
router.get('/families/:id', (req: Request, res: Response) => {
  const db = getDb();
  const id = parseInt(req.params.id);

  const family = db.prepare(`
    SELECT f.*,
      p1.id as p1_id, p1.given_name as p1_given, p1.surname as p1_surname,
      p1.birth_year as p1_birth, p1.death_year as p1_death, p1.sex as p1_sex,
      p2.id as p2_id, p2.given_name as p2_given, p2.surname as p2_surname,
      p2.birth_year as p2_birth, p2.death_year as p2_death, p2.sex as p2_sex
    FROM families f
    LEFT JOIN people p1 ON f.partner1_id = p1.id
    LEFT JOIN people p2 ON f.partner2_id = p2.id
    WHERE f.id = ?
  `).get(id);

  if (!family) {
    res.status(404).json({ error: 'Family not found' });
    return;
  }

  const children = db.prepare(`
    SELECT c.birth_order, c.relation_to_partner1, c.relation_to_partner2,
           p.id, p.given_name, p.surname, p.birth_year, p.death_year, p.sex, p.is_living
    FROM children c
    JOIN people p ON c.child_id = p.id
    WHERE c.family_id = ?
    ORDER BY c.birth_order, p.birth_year
  `).all(id);

  const events = db.prepare(`
    SELECT * FROM events WHERE family_id = ? ORDER BY sort_order
  `).all(id);

  res.json({ family, children, events });
});

// --- Timeline ---
router.get('/timeline', (req: Request, res: Response) => {
  const db = getDb();
  const { type, surname, from, to, page = '1', limit = '100' } = req.query;

  let where = 'WHERE e.year IS NOT NULL AND e.year > 0';
  const params: unknown[] = [];

  if (type) {
    where += ' AND e.event_type = ?';
    params.push(type);
  }
  if (surname) {
    where += ' AND p.surname = ?';
    params.push(surname);
  }
  if (from) {
    where += ' AND e.year >= ?';
    params.push(parseInt(from as string));
  }
  if (to) {
    where += ' AND e.year <= ?';
    params.push(parseInt(to as string));
  }

  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
  const total = (db.prepare(`
    SELECT COUNT(*) as n FROM events e
    LEFT JOIN people p ON e.person_id = p.id
    ${where}
  `).get(...params) as { n: number }).n;

  const rows = db.prepare(`
    SELECT e.*, p.given_name, p.surname, p.is_living
    FROM events e
    LEFT JOIN people p ON e.person_id = p.id
    ${where}
    ORDER BY e.sort_order, e.year, e.month, e.day
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit as string), offset);

  res.json({ total, page: parseInt(page as string), rows });
});

// --- Surnames list ---
router.get('/surnames', (_req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT surname, COUNT(*) as count FROM people
    WHERE surname != '' GROUP BY surname ORDER BY count DESC
  `).all();
  res.json(rows);
});

// --- Sources ---
router.get('/sources', (_req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT s.*, COUNT(c.id) as citation_count
    FROM sources s
    LEFT JOIN citations c ON s.id = c.source_id
    GROUP BY s.id
    ORDER BY citation_count DESC
  `).all();
  res.json(rows);
});

// --- Event types ---
router.get('/event-types', (_req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT event_type, COUNT(*) as count FROM events GROUP BY event_type ORDER BY count DESC
  `).all();
  res.json(rows);
});

export default router;
