import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, NavLink, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../../admin/AdminAuthContext';
import { useToast } from '../../components/ToastProvider';

const navClass = ({ isActive }) =>
  [
    'whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium transition sm:px-3 sm:py-2',
    isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
  ].join(' ');

function AdminShell() {
  const { admin, loading, logout } = useAdminAuth();
  const { showToast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center text-gray-500 sm:px-6">
        Checking session…
      </main>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  const initials = admin.email.split('@')[0].slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    showToast('Signed out');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-3 py-2.5 sm:h-16 sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-0">
          <div className="flex items-center justify-between gap-3 sm:contents">
            <Link
              to="/"
              className="shrink-0 truncate text-base font-bold tracking-tight text-[#ff385c] sm:w-auto sm:flex-1 sm:text-xl"
            >
              Willow House
            </Link>

            <div className="relative shrink-0 sm:order-last sm:flex-1 sm:flex sm:justify-end" ref={menuRef}>
              <button
                type="button"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex max-w-[9.5rem] items-center gap-1.5 rounded-full py-1 pl-1 pr-2 transition hover:bg-gray-100 sm:max-w-[16rem] sm:gap-2 sm:pr-2.5"
              >
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white sm:h-9 sm:w-9 sm:text-sm"
                >
                  {initials}
                </span>
                <span className="min-w-0 truncate text-xs text-gray-600 sm:text-sm">
                  {admin.email}
                </span>
                <svg
                  className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition sm:h-4 sm:w-4 ${menuOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="block w-full px-3 py-2.5 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
                  >
                    Log out
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <nav className="flex items-center justify-center gap-0.5 sm:gap-1">
            <NavLink to="/admin" end className={navClass}>
              Overview
            </NavLink>
            <NavLink to="/admin/dinners" className={navClass}>
              Dinners
            </NavLink>
            <NavLink to="/admin/reviews" className={navClass}>
              Reviews
            </NavLink>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

export default AdminShell;
