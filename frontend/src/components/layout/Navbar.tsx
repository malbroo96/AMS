import { useEffect, useState, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onMenuToggle?: () => void;
  menuButtonRef?: RefObject<HTMLButtonElement | null>;
  menuOpen?: boolean;
}

export function Navbar({ onMenuToggle, menuButtonRef, menuOpen = false }: NavbarProps) {
  const { user, logout } = useAuth();
  const [showMenuButton, setShowMenuButton] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const homeLink = user
    ? user.role === 'student'
      ? '/dashboard/student'
      : user.role === 'college'
        ? '/dashboard/college'
        : '/dashboard/admin'
    : '/';

  useEffect(() => {
    const collapsibleSidebarQuery = window.matchMedia('(max-width: 1023px)');

    const syncMenuButton = () => {
      setShowMenuButton(collapsibleSidebarQuery.matches);
    };

    syncMenuButton();
    collapsibleSidebarQuery.addEventListener('change', syncMenuButton);

    return () => {
      collapsibleSidebarQuery.removeEventListener('change', syncMenuButton);
    };
  }, []);

  useEffect(() => {
    if (mobileSearchOpen && menuOpen) {
      setMobileSearchOpen(false);
    }
  }, [menuOpen, mobileSearchOpen]);

  const portalTitle =
    user?.role === 'college' ? 'College Portal' : user?.role === 'student' ? 'Student Portal' : 'Admin Portal';
             
  return (
    <header className="dashboard-header">
      <div className="dashboard-header__row">
        <div className="dashboard-header__brand">
          {onMenuToggle && showMenuButton && (
            <button
              type="button"
              ref={menuButtonRef}
              onClick={onMenuToggle}
              className={`dashboard-menu-button${menuOpen ? ' dashboard-menu-button--active' : ''}`}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="dashboard-sidebar"
            >
              <span />
              <span />
              <span />
            </button>
          )}
          <Link to={homeLink} className="dashboard-header__title">
            {portalTitle}
          </Link>
        </div>

        <form className="dashboard-header__search" role="search">
          <label className="sr-only" htmlFor="dashboard-search">Search</label>
          <svg className="dashboard-header__search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            id="dashboard-search"
            type="search"
            className="dashboard-header__search-input"
            placeholder="Search"
          />
        </form>

        <div className="dashboard-header__actions">
          <button
            type="button"
            className={`dashboard-header__icon-button md:hidden${mobileSearchOpen ? ' dashboard-header__icon-button--active' : ''}`}
            onClick={() => setMobileSearchOpen((open) => !open)}
            aria-label={mobileSearchOpen ? 'Close search' : 'Open search'}
            aria-expanded={mobileSearchOpen}
            aria-controls="dashboard-mobile-search"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </button>

          <button type="button" className="dashboard-header__icon-button">
            <span className="dashboard-header__notification-count">3</span>
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          </button>
          <button type="button" className="dashboard-header__icon-button dashboard-header__messages">
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          </button>

          <div className="dashboard-header__divider"></div>

          <div className="dashboard-header__profile">
            <p className="dashboard-header__profile-name">{user?.name}</p>
            <p className="dashboard-header__profile-role">{user?.role?.replace('_', ' ')}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="dashboard-header__logout"
          >
            Logout
          </button>
        </div>
      </div>

      {mobileSearchOpen && (
        <form id="dashboard-mobile-search" className="dashboard-header__mobile-search" role="search">
          <label className="sr-only" htmlFor="dashboard-mobile-search-input">Search</label>
          <svg className="dashboard-header__search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            id="dashboard-mobile-search-input"
            type="search"
            className="dashboard-header__search-input"
            placeholder="Search"
            autoFocus
          />
        </form>
      )}
    </header>
  );
}
