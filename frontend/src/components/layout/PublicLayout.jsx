import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';

const navClass = ({ isActive }) =>
  [
    'whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium transition',
    isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
  ].join(' ');

function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-20 sm:px-6">
          <Link
            to="/"
            className="shrink-0 text-lg font-bold tracking-tight text-[#ff385c] sm:text-xl"
            onClick={() => setMenuOpen(false)}
          >
            Willow House
          </Link>

          <nav className="hidden items-center gap-1 md:flex md:gap-2">
            <NavLink to="/" end className={navClass}>
              Book
            </NavLink>
            <NavLink to="/manage" className={navClass}>
              Manage
            </NavLink>
            <NavLink to="/review" className={navClass}>
              Review
            </NavLink>
            <NavLink to="/admin" className={navClass}>
              Admin
            </NavLink>
          </nav>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-700 md:hidden"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M3 5.75A.75.75 0 013.75 5h12.5a.75.75 0 010 1.5H3.75A.75.75 0 013 5.75zm0 4.5a.75.75 0 01.75-.75h12.5a.75.75 0 010 1.5H3.75A.75.75 0 013 10.25zm0 4.5a.75.75 0 01.75-.75h12.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </div>

        {menuOpen ? (
          <nav className="border-t border-gray-100 px-4 py-3 md:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-1">
              <NavLink to="/" end className={navClass} onClick={() => setMenuOpen(false)}>
                Book
              </NavLink>
              <NavLink to="/manage" className={navClass} onClick={() => setMenuOpen(false)}>
                Manage
              </NavLink>
              <NavLink to="/review" className={navClass} onClick={() => setMenuOpen(false)}>
                Review
              </NavLink>
              <NavLink to="/admin" className={navClass} onClick={() => setMenuOpen(false)}>
                Admin
              </NavLink>
            </div>
          </nav>
        ) : null}
      </header>
      <Outlet />
    </div>
  );
}

export default PublicLayout;
