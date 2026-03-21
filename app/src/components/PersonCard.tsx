import { Link } from 'react-router-dom';
import type { Person } from '../types';

function lifespan(p: Person): string {
  if (p.is_living) return 'Living';
  const b = p.birth_year || '?';
  const d = p.death_year || '?';
  if (b === '?' && d === '?') return '';
  return `${b}\u2013${d}`;
}

function initial(p: Person): string {
  return (p.given_name?.[0] || p.surname?.[0] || '?').toUpperCase();
}

export default function PersonCard({ person }: { person: Person }) {
  const isLiving = !!person.is_living;

  return (
    <Link
      to={`/people/${person.id}`}
      className={`card card--hover person-card ${isLiving ? 'person-card--living' : ''}`}
    >
      <div className={`person-card__avatar person-card__avatar--${person.sex}`}>
        {initial(person)}
      </div>
      <div className="person-card__info">
        <div className="person-card__name">
          {isLiving ? (
            <span className="redacted">{person.given_name} <span className="person-card__surname">{person.surname}</span></span>
          ) : (
            <>{person.given_name} <span className="person-card__surname">{person.surname}</span></>
          )}
        </div>
        <div className="person-card__dates">{lifespan(person)}</div>
        {!isLiving && person.birth_place && (
          <div className="person-card__place">{person.birth_place}</div>
        )}
      </div>
    </Link>
  );
}
