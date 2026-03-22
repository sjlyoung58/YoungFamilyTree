import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '\u25A3' },
  { to: '/people', label: 'People', icon: '\u25CB' },
  { to: '/timeline', label: 'Timeline', icon: '\u2502' },
  { to: '/sources', label: 'Sources', icon: '\u25A1' },
];

export default function Layout() {
  return (
    <div className="app-layout">
      <nav className="app-nav">
        <div className="app-nav__header">
          <div className="app-nav__title">Young Family</div>
          <div className="app-nav__subtitle">Genealogy Archive</div>
        </div>
        <div className="app-nav__links">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `app-nav__link ${isActive ? 'app-nav__link--active' : ''}`
              }
            >
              <span className="app-nav__icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
