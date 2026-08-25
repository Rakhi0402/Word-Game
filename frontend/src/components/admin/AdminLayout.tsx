import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';

const links = [
  { to: '/admin', end: true, label: 'Overview' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/puzzles', label: 'Puzzles' },
  { to: '/admin/cards', label: 'Cards' },
  { to: '/admin/achievements', label: 'Achievements' },
  { to: '/admin/dictionary', label: 'Dictionary' },
];

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#1a1410] text-amber-50">
      <header className="border-b border-amber-700/40 bg-[#241c16]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold tracking-wide text-amber-300">Admin</h1>
            <nav className="flex flex-wrap gap-2 text-sm">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    `rounded px-2 py-1 ${
                      isActive
                        ? 'bg-amber-600/30 text-amber-200'
                        : 'text-amber-100/70 hover:text-amber-100'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <Link to="/home" className="text-sm text-amber-400/80 hover:text-amber-300">
            ← Back to game
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};
