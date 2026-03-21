import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import type { PersonDetail as PersonDetailType } from '../types';
import EventList from '../components/EventList';

function lifespan(birthYear: number | null, deathYear: number | null, isLiving: boolean): string {
  if (isLiving) return 'Living';
  const b = birthYear || '?';
  const d = deathYear || '?';
  if (b === '?' && d === '?') return 'Dates unknown';
  return `${b}\u2013${d}`;
}

function PersonLink({ id, given, surname, birthYear, deathYear, sex, isLiving }: {
  id: number | null; given: string; surname: string;
  birthYear?: number | null; deathYear?: number | null;
  sex?: string; isLiving?: boolean;
}) {
  if (!id) return null;
  return (
    <Link to={`/people/${id}`} className="family-member">
      <span className={`family-member__dot family-member__dot--${sex || 'U'}`} />
      <span className="family-member__name">
        {given} <span style={{ fontVariant: 'small-caps' }}>{surname}</span>
      </span>
      <span className="family-member__dates">
        {isLiving ? 'Living' : (birthYear || deathYear)
          ? `${birthYear || '?'}\u2013${deathYear || '?'}`
          : ''}
      </span>
    </Link>
  );
}

export default function PersonDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<PersonDetailType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.person(parseInt(id)).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [id]);

  if (loading || !data) return <div className="loading">Loading</div>;

  const { person: p, events, families, parents, siblings, citations } = data;
  const isLiving = !!p.is_living;

  return (
    <div className="page">
      <Link to="/people" className="back-link">&larr; All people</Link>

      <div className="person-header">
        <div className={`person-header__avatar person-card__avatar--${p.sex}`}>
          {(p.given_name?.[0] || '?').toUpperCase()}
        </div>
        <div>
          <h1 className="person-header__name">
            {p.given_name}{' '}
            <span className="person-header__surname">{p.surname}</span>
          </h1>
          <div className="person-header__meta">
            {lifespan(p.birth_year, p.death_year, isLiving)}
            {!isLiving && p.birth_place ? ` \u00b7 ${p.birth_place}` : ''}
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <h2 className="section-title">Events</h2>
          <div className="card">
            {isLiving ? (
              <div className="redacted">Event details hidden for living individuals</div>
            ) : (
              <EventList events={events} />
            )}
          </div>
        </div>

        <div>
          {/* Parents */}
          {parents.length > 0 && (
            <div className="family-section">
              <h2 className="section-title">Parents</h2>
              <div className="card">
                <div className="family-members">
                  {parents.map((pf) => (
                    <div key={pf.id}>
                      <PersonLink
                        id={pf.father_id} given={pf.father_given} surname={pf.father_surname}
                        birthYear={pf.father_birth} deathYear={pf.father_death} sex="M"
                      />
                      <PersonLink
                        id={pf.mother_id} given={pf.mother_given} surname={pf.mother_surname}
                        birthYear={pf.mother_birth} deathYear={pf.mother_death} sex="F"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Siblings */}
          {siblings.length > 0 && (
            <div className="family-section">
              <h2 className="section-title">Siblings</h2>
              <div className="card">
                <div className="family-members">
                  {siblings.map((s) => (
                    <PersonLink
                      key={s.id} id={s.id} given={s.given_name} surname={s.surname}
                      birthYear={s.birth_year} deathYear={s.death_year}
                      sex={s.sex} isLiving={!!s.is_living}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Spouse & Children */}
          {families.map((fam) => {
            const spouseIsPartner1 = fam.partner1_id !== p.id;
            const spouseGiven = spouseIsPartner1 ? fam.p1_given : fam.p2_given;
            const spouseSurname = spouseIsPartner1 ? fam.p1_surname : fam.p2_surname;
            const spouseId = spouseIsPartner1 ? fam.partner1_id : fam.partner2_id;
            const spouseBirth = spouseIsPartner1 ? fam.p1_birth : fam.p2_birth;
            const spouseDeath = spouseIsPartner1 ? fam.p1_death : fam.p2_death;
            const spouseSex = spouseIsPartner1 ? (p.sex === 'M' ? 'F' : 'M') : (p.sex === 'F' ? 'M' : 'F');

            return (
              <div key={fam.id} className="family-section">
                {spouseId && spouseGiven && (
                  <>
                    <h2 className="section-title">
                      Spouse
                      {fam.marriage_date ? ` \u00b7 m. ${fam.marriage_date}` : ''}
                    </h2>
                    <div className="card" style={{ marginBottom: 16 }}>
                      <div className="family-members">
                        <PersonLink
                          id={spouseId} given={spouseGiven || ''} surname={spouseSurname || ''}
                          birthYear={spouseBirth} deathYear={spouseDeath} sex={spouseSex}
                        />
                      </div>
                    </div>
                  </>
                )}

                {fam.children && fam.children.length > 0 && (
                  <>
                    <h2 className="section-title">Children ({fam.children.length})</h2>
                    <div className="card">
                      <div className="family-members">
                        {fam.children.map((c) => (
                          <PersonLink
                            key={c.id} id={c.id} given={c.given_name} surname={c.surname}
                            birthYear={c.birth_year} deathYear={c.death_year}
                            sex={c.sex} isLiving={!!c.is_living}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {/* Citations */}
          {citations.length > 0 && (
            <div className="family-section">
              <h2 className="section-title">Sources ({citations.length})</h2>
              <div className="card">
                <div className="event-list">
                  {citations.map((c) => (
                    <div key={c.id} className="event-item">
                      <div className="event-item__body">
                        <div className="event-item__date">{c.source_name}</div>
                        {c.detail && <div className="event-item__place">{c.detail}</div>}
                        {c.actual_text && <div className="event-item__details">{c.actual_text}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
