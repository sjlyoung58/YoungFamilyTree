import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { Stats } from '../types';

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.stats().then(setStats);
  }, []);

  if (!stats) return <div className="loading">Loading</div>;

  const maxSurname = stats.surnames[0]?.count || 1;
  const maxDecade = Math.max(...stats.decades.map((d) => d.count), 1);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Young &amp; Allied Families</h1>
        <p className="page-subtitle">
          {stats.people} individuals across {stats.families} families
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__value">{stats.people}</div>
          <div className="stat-card__label">People</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{stats.families}</div>
          <div className="stat-card__label">Families</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{stats.events}</div>
          <div className="stat-card__label">Events</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{stats.places}</div>
          <div className="stat-card__label">Places</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{stats.sources}</div>
          <div className="stat-card__label">Sources</div>
        </div>
      </div>

      <div className="two-col">
        <div>
          <h2 className="section-title">Surname Lines</h2>
          <div className="surname-bars">
            {stats.surnames.slice(0, 12).map((s) => (
              <div
                key={s.surname}
                className="surname-bar"
                onClick={() => navigate(`/people?surname=${encodeURIComponent(s.surname)}`)}
              >
                <div className="surname-bar__label">{s.surname}</div>
                <div className="surname-bar__track">
                  <div
                    className="surname-bar__fill"
                    style={{ width: `${(s.count / maxSurname) * 100}%` }}
                  />
                </div>
                <div className="surname-bar__count">{s.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="section-title">Births by Decade</h2>
          <div className="decade-chart">
            {stats.decades
              .filter((d) => d.decade >= 1600)
              .map((d) => (
                <div key={d.decade} className="decade-bar">
                  <div className="decade-bar__tooltip">
                    {d.decade}s: {d.count} births
                  </div>
                  <div
                    className="decade-bar__fill"
                    style={{ height: `${(d.count / maxDecade) * 100}%` }}
                  />
                  {d.decade % 50 === 0 && (
                    <div className="decade-bar__label">{d.decade}</div>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
