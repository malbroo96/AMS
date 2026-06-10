import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onMenuToggle?: () => void;
}

export function Navbar({ onMenuToggle }: NavbarProps) {
  const { user, logout } = useAuth();

  const homeLink = user
    ? user.role === 'student'
      ? '/dashboard/student'
      : user.role === 'college'
        ? '/dashboard/college'
        : '/dashboard/admin'
    : '/';

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:hidden"
            aria-label="Toggle menu"
          >
            <span className="h-0.5 w-5 rounded-full bg-slate-600" />
            <span className="h-0.5 w-5 rounded-full bg-slate-600" />
            <span className="h-0.5 w-5 rounded-full bg-slate-600" />
          </button>
        )}
        <Link to={homeLink} className="text-sm font-semibold text-blue-700 hover:text-blue-800">
          E-Admit Portal
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
          <p className="text-xs capitalize text-slate-500">{user?.role?.replace('_', ' ')}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
