import type { FamilyEvent } from '../types';

export default function EventList({ events }: { events: FamilyEvent[] }) {
  if (!events.length) {
    return <div className="empty"><div className="empty__title">No events recorded</div></div>;
  }

  return (
    <div className="event-list">
      {events.map((e) => (
        <div key={e.id} className="event-item">
          <div className="event-item__type">{e.event_type}</div>
          <div className="event-item__body">
            {e.date_display && <div className="event-item__date">{e.date_display}</div>}
            {e.place && <div className="event-item__place">{e.place}</div>}
            {e.details && <div className="event-item__details">{e.details}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
