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
        <Link to={homeLink} className="text-lg font-bold text-slate-900 hidden sm:block hover:text-blue-700 transition">
          {user?.role === 'college' ? 'College Portal' : user?.role === 'student' ? 'Student Portal' : 'Admin Portal'}
        </Link>
      </div>

      {/* Search Bar */}
      <div className="hidden flex-1 max-w-md mx-4 lg:block">
        <div className="relative w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input
            type="text"
            className="block w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
            placeholder="Search..."
          />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Icons */}
        <button type="button" className="relative text-slate-500 hover:text-blue-600 transition">
          <span className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white shadow-sm">3</span>
          <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        </button>
        <button type="button" className="hidden text-slate-500 hover:text-blue-600 transition sm:block">
          <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        </button>
        
        <div className="hidden h-8 w-px bg-slate-200 sm:block"></div>

        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
          <p className="text-xs capitalize text-slate-500">{user?.role?.replace('_', ' ')}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
