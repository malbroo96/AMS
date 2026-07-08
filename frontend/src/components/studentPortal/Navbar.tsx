import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoNav from '../../assets/logo.png';
import { useAuth } from '../../context/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
    <>
      <header className="fixed inset-x-0 top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
        <nav className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger toggle button */}
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex h-10 w-10 flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 md:hidden"
              aria-label="Toggle menu"
            >
              <span className={`h-0.5 w-5 rounded-full bg-slate-600 transition-transform duration-200 ${menuOpen ? 'translate-y-1.5 rotate-45' : ''}`} />
              <span className={`h-0.5 w-5 rounded-full bg-slate-600 transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`h-0.5 w-5 rounded-full bg-slate-600 transition-transform duration-200 ${menuOpen ? '-translate-y-1.5 -rotate-45' : ''}`} />
            </button>

            <Link to="/" className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
                <img src={logoNav} alt="E admit Portal" className="size-7 object-contain" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-slate-900 sm:text-base">E Admit Portal</span>
                <span className="hidden text-xs font-medium text-slate-500 sm:block">College admissions discovery</span>
              </span>
            </Link>
          </div>

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

      {/* Side Navigation Drawer */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ease-in-out ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Overlay backdrop */}
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
          onClick={() => setMenuOpen(false)}
        />

        {/* Sidebar Panel */}
        <aside
          className={`absolute inset-y-0 left-0 flex w-64 flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 ease-in-out ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="flex h-18 items-center gap-3 border-b border-slate-200 px-4">
            <span className="flex size-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
              <img src={logoNav} alt="AMS Student Portal" className="size-7 object-contain" />
            </span>
            <span className="text-base font-bold text-slate-900 font-sans">Student Portal</span>
          </div>

          {/* Links */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            <a
              href="#colleges"
              onClick={() => setMenuOpen(false)}
              className="flex items-center rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
            >
              Colleges
            </a>
            <a
              href="#filters"
              onClick={() => setMenuOpen(false)}
              className="flex items-center rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
            >
              Filters
            </a>
            {isStudent ? (
              <a
                href="#applications"
                onClick={() => setMenuOpen(false)}
                className="flex items-center rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
              >
                Applications
              </a>
            ) : (
              <a
                href="#details"
                onClick={() => setMenuOpen(false)}
                className="flex items-center rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
              >
                Compare
              </a>
            )}
          </nav>
        </aside>
      </div>
    </>
  );
}

