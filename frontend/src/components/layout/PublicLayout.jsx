import { Link, NavLink, Outlet } from 'react-router-dom';

const navClass = ({ isActive }) =>
  [
    'text-sm font-medium transition-colors',
    isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900',
  ].join(' ');

function PublicLayout() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="text-xl font-bold tracking-tight text-[#ff385c]">
            Willow House
          </Link>
          <nav className="flex items-center gap-6">
            <NavLink to="/" end className={navClass}>
              Book
            </NavLink>
            <NavLink to="/manage" className={navClass}>
              Manage
            </NavLink>
            <NavLink to="/review" className={navClass}>
              Review
            </NavLink>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

export default PublicLayout;
