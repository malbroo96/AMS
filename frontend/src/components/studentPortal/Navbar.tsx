import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoNav from '../../assets/logo.png';
import { useAuth } from '../../context/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const isStudent = user?.role === 'student';
  const studentProfile = user?.student as { profileImage?: string | null; name?: string | null; email?: string | null } | null | undefined;
  const studentName = studentProfile?.name || user?.name || 'Student';
  const studentEmail = studentProfile?.email || user?.email || '';
  const profileImage = studentProfile?.profileImage;
  const studentInitial = useMemo(() => studentName.trim().charAt(0).toUpperCase() || 'S', [studentName]);

  useEffect(() => {
    if (!profileOpen) return;

    const closeOnOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setProfileOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('touchstart', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('touchstart', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [profileOpen]);

  const handleProfileClick = () => {
    setProfileOpen(false);
    navigate('/dashboard/student/profile');
  };

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
  };

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
      <nav className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
            <img src={logoNav} alt="AMS Student Portal" className="size-7 object-contain" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-slate-900 sm:text-base">AMS Student Portal</span>
            <span className="hidden text-xs font-medium text-slate-500 sm:block">College admissions discovery</span>
          </span>
        </Link>

        <div className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
          <a href="#colleges" className="transition hover:text-blue-700">Colleges</a>
          <a href="#filters" className="transition hover:text-blue-700">Filters</a>
          {isStudent && <a href="#applications" className="transition hover:text-blue-700">Applications</a>}
          {!isStudent && <a href="#details" className="transition hover:text-blue-700">Compare</a>}
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {isStudent ? (
                <div ref={profileMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileOpen((open) => !open)}
                    className="flex size-10 items-center justify-center overflow-hidden rounded-full border-2 border-blue-100 bg-blue-600 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="Open profile menu"
                    aria-expanded={profileOpen}
                    aria-haspopup="menu"
                  >
                    {profileImage ? (
                      <img src={profileImage} alt={studentName} className="size-full object-cover" />
                    ) : (
                      studentInitial
                    )}
                  </button>

                  <div
                    className={`absolute right-0 mt-3 w-[min(18rem,calc(100vw-2rem))] origin-top-right rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/70 transition duration-200 ease-out ${
                      profileOpen
                        ? 'translate-y-0 scale-100 opacity-100'
                        : 'pointer-events-none -translate-y-1 scale-95 opacity-0'
                    }`}
                    role="menu"
                  >
                    <div className="border-b border-slate-100 px-3 py-3">
                      <p className="truncate text-sm font-bold text-slate-900">{studentName}</p>
                      <p className="mt-1 truncate text-xs font-medium text-slate-500">{studentEmail || 'No email added'}</p>
                    </div>
                    <div className="py-2">
                      <button
                        type="button"
                        onClick={handleProfileClick}
                        className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                        role="menuitem"
                      >
                        My Profile
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-red-600 transition hover:bg-red-50"
                        role="menuitem"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <Link
                    to={user.role === 'college' ? '/dashboard/college' : '/dashboard/admin'}
                    className="hidden rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:inline-flex"
                  >
                    {user.name}
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    Logout
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                Student
              </Link>
              <Link
                to="/register/college"
                className="hidden rounded-xl border border-blue-200 px-3 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-50 sm:inline-flex"
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
