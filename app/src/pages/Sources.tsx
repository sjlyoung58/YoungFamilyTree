import { useEffect, useState } from 'react';
import { api } from '../api';

interface Source {
  id: number;
  name: string;
  ref_number: string;
  citation_count: number;
}

export default function Sources() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.sources().then((s) => {
      setSources(s);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="loading">Loading</div>;

  const totalCitations = sources.reduce((sum, s) => sum + s.citation_count, 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Sources</h1>
        <p className="page-subtitle">
          {sources.length} sources with {totalCitations} citations
        </p>
      </div>

      <div className="source-list">
        {sources.map((s) => (
          <div key={s.id} className="card source-item">
            <div className="source-item__name">{s.name}</div>
            <div className="source-item__count">
              {s.citation_count}
              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginLeft: 4 }}>
                citations
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
