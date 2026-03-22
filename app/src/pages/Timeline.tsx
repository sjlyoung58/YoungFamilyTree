import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { FamilyEvent, SurnameCount } from '../types';

const PAGE_SIZE = 100;

export default function Timeline() {
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [eventTypes, setEventTypes] = useState<Array<{ event_type: string; count: number }>>([]);
  const [surnames, setSurnames] = useState<SurnameCount[]>([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [surnameFilter, setSurnameFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTimeline = useCallback(async (p: number, type: string, surname: string) => {
    setLoading(true);
    const res = await api.timeline({
      type: type || undefined,
      surname: surname || undefined,
      page: p,
      limit: PAGE_SIZE,
    });
    setEvents(res.rows);
    setTotal(res.total);
    setPage(p);
    setLoading(false);
  }, []);

  useEffect(() => {
    api.eventTypes().then(setEventTypes);
    api.surnames().then(setSurnames);
  }, []);

  useEffect(() => {
    fetchTimeline(1, typeFilter, surnameFilter);
  }, [typeFilter, surnameFilter, fetchTimeline]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Timeline</h1>
        <p className="page-subtitle">{total} events{typeFilter ? ` (${typeFilter})` : ''}</p>
      </div>

      <div className="search-bar">
        <select
          className="filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All event types</option>
          {eventTypes.map((t) => (
            <option key={t.event_type} value={t.event_type}>
              {t.event_type} ({t.count})
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          value={surnameFilter}
          onChange={(e) => setSurnameFilter(e.target.value)}
        >
          <option value="">All surnames</option>
          {surnames.map((s) => (
            <option key={s.surname} value={s.surname}>
              {s.surname} ({s.count})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading</div>
      ) : events.length === 0 ? (
        <div className="empty"><div className="empty__title">No events found</div></div>
      ) : (
        <>
          <div className="timeline">
            {events.map((e) => {
              const isLiving = !!e.is_living;
              return (
                <div key={e.id} className="timeline-item">
                  <div className="timeline-item__date">
                    {e.date_display || (e.year ? String(e.year) : '')}
                  </div>
                  <div className="timeline-item__content">
                    <div className="timeline-item__title">
                      {e.event_type}
                      {e.person_id && e.given_name && (
                        <>
                          {' \u2014 '}
                          {isLiving ? (
                            <span className="redacted">{e.given_name} {e.surname}</span>
                          ) : (
                            <Link to={`/people/${e.person_id}`}>
                              {e.given_name} {e.surname}
                            </Link>
                          )}
                        </>
                      )}
                    </div>
                    {!isLiving && (
                      <div className="timeline-item__desc">
                        {[e.place, e.details].filter(Boolean).join(' \u00b7 ')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination__btn"
                disabled={page <= 1}
                onClick={() => fetchTimeline(page - 1, typeFilter, surnameFilter)}
              >
                Previous
              </button>
              <span className="pagination__info">
                Page {page} of {totalPages}
              </span>
              <button
                className="pagination__btn"
                disabled={page >= totalPages}
                onClick={() => fetchTimeline(page + 1, typeFilter, surnameFilter)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
