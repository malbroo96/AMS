import { Link } from 'react-router-dom';
import logoNav from '../../assets/logo.png';
import { useAuth } from '../../context/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const isStudent = user?.role === 'student';

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg border border-sky-400/25 bg-white/5">
            <img src={logoNav} alt="AMS Student Portal" className="size-7 object-contain" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-white sm:text-base">AMS Student Portal</span>
            <span className="hidden text-xs font-medium text-slate-400 sm:block">College admissions discovery</span>
          </span>
        </Link>

        <div className="hidden items-center gap-7 text-sm font-medium text-slate-300 md:flex">
          <a href="#colleges" className="transition hover:text-white">Colleges</a>
          <a href="#filters" className="transition hover:text-white">Filters</a>
          {isStudent && <a href="#applications" className="transition hover:text-white">Applications</a>}
          {!isStudent && <a href="#details" className="transition hover:text-white">Compare</a>}
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                to={isStudent ? '/dashboard/student' : user.role === 'college' ? '/dashboard/college' : '/dashboard/admin'}
                className="hidden rounded-md border border-white/12 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-sky-300/45 hover:text-white sm:inline-flex"
              >
                {user.name}
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-md bg-sky-400 px-3 py-2 text-sm font-bold text-slate-950 shadow-lg shadow-sky-500/20 transition hover:bg-sky-300"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-md border border-white/12 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-sky-300/45 hover:text-white"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-sky-400 px-3 py-2 text-sm font-bold text-slate-950 shadow-lg shadow-sky-500/20 transition hover:bg-sky-300"
              >
                Student
              </Link>
              <Link
                to="/register/college"
                className="hidden rounded-md border border-sky-300/35 px-3 py-2 text-sm font-bold text-sky-100 transition hover:border-sky-200 hover:bg-sky-400/10 sm:inline-flex"
              >
                Register as College
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
