import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import type { Person, SurnameCount } from '../types';
import PersonCard from '../components/PersonCard';

const PAGE_SIZE = 48;

export default function People() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [people, setPeople] = useState<Person[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [surnames, setSurnames] = useState<SurnameCount[]>([]);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [surname, setSurname] = useState(searchParams.get('surname') || '');
  const [loading, setLoading] = useState(true);

  const fetchPeople = useCallback(async (p: number, q: string, s: string) => {
    setLoading(true);
    const res = await api.people({ q: q || undefined, surname: s || undefined, page: p, limit: PAGE_SIZE });
    setPeople(res.rows);
    setTotal(res.total);
    setPage(p);
    setLoading(false);
  }, []);

  useEffect(() => {
    api.surnames().then(setSurnames);
  }, []);

  useEffect(() => {
    fetchPeople(1, query, surname);
  }, [query, surname, fetchPeople]);

  const handleSearch = (val: string) => {
    setQuery(val);
    const sp = new URLSearchParams(searchParams);
    if (val) sp.set('q', val); else sp.delete('q');
    setSearchParams(sp, { replace: true });
  };

  const handleSurname = (val: string) => {
    setSurname(val);
    const sp = new URLSearchParams(searchParams);
    if (val) sp.set('surname', val); else sp.delete('surname');
    setSearchParams(sp, { replace: true });
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">People</h1>
        <p className="page-subtitle">{total} individuals{surname ? ` with surname ${surname}` : ''}</p>
      </div>

      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search by name..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={surname}
          onChange={(e) => handleSurname(e.target.value)}
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
      ) : people.length === 0 ? (
        <div className="empty">
          <div className="empty__title">No people found</div>
        </div>
      ) : (
        <>
          <div className="people-grid">
            {people.map((p) => (
              <PersonCard key={p.id} person={p} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination__btn"
                disabled={page <= 1}
                onClick={() => fetchPeople(page - 1, query, surname)}
              >
                Previous
              </button>
              <span className="pagination__info">
                Page {page} of {totalPages}
              </span>
              <button
                className="pagination__btn"
                disabled={page >= totalPages}
                onClick={() => fetchPeople(page + 1, query, surname)}
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
