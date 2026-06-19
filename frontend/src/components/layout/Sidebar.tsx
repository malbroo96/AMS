import { forwardRef, type RefObject } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LogoMark } from '../LogoMark';
import type { UserRole } from '../../types';
import './Sidebar.css';

interface NavItem {
  to: string;
  label: string;
}

const navByRole: Record<UserRole, NavItem[]> = {
  student: [
    { to: '/dashboard/student', label: 'Dashboard' },
    { to: '/dashboard/student?view=colleges', label: 'Colleges' },
    { to: '/dashboard/student/profile', label: 'Profile' },
  ],
  college: [
    { to: '/dashboard/college', label: 'Dashboard' },
    { to: '/dashboard/college/profile', label: 'College Profile' },
    { to: '/dashboard/college?view=students', label: 'Interested Students' },
    { to: '/dashboard/college/applications', label: 'Applications' },
    { to: '/dashboard/college/courses', label: 'Courses' },
    { to: '/dashboard/college/notices', label: 'Notices' },
    { to: '/dashboard/college/reports', label: 'Reports' },
    { to: '/dashboard/college/settings', label: 'Settings' },
  ],
  admin: [
    { to: '/dashboard/admin', label: 'Dashboard' },
    { to: '/dashboard/admin/colleges', label: 'Colleges' },
    { to: '/dashboard/admin/students', label: 'Students' },
    { to: '/dashboard/admin/permissions', label: 'Permissions' },
  ],
};

const rolePortalLabel: Record<UserRole, string> = {
  student: 'Student Portal',
  college: 'College Portal',
  admin: 'Admin Portal',
};

interface SidebarProps {
  role: UserRole;
  open: boolean;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  onMenuToggle: () => void;
  onClose: () => void;
}

export const Sidebar = forwardRef<HTMLElement, SidebarProps>(
  function Sidebar({ role, open, menuButtonRef, onMenuToggle, onClose }, ref) {
    const items = navByRole[role];
    const location = useLocation();

    return (
      <>
        {open && (
          <button
            type="button"
            className="sidebar-overlay fixed inset-0 z-30 lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          />
        )}
        <aside
          ref={ref}
          id="dashboard-sidebar"
          className={`sidebar fixed inset-y-0 left-0 z-40 flex w-64 flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="sidebar__brand">
            <div className="sidebar__brand-content">
              <LogoMark className="size-10" variant="light" />
              <div>
                <p className="sidebar__brand-label">Eadmin Portal</p>
                <p className="sidebar__brand-title">{rolePortalLabel[role]}</p>
              </div>
            </div>
            <button
              ref={menuButtonRef}
              type="button"
              onClick={onMenuToggle}
              className={`hamburger-button sidebar__toggle lg:hidden${open ? ' hamburger-button--active sidebar__toggle--open' : ''}`}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="dashboard-sidebar"
            >
              <span className="hamburger-button__line" />
              <span className="hamburger-button__line" />
              <span className="hamburger-button__line" />
            </button>
          </div>
          <nav className="sidebar__nav">
            {items.map((item) => {
              const [itemPath, itemQuery] = item.to.split('?');
              let isActive = false;
              
              if (itemQuery) {
                // For links with query params (e.g. ?view=students), match path and query exactly
                isActive = location.pathname === itemPath && location.search === `?${itemQuery}`;
              } else {
                // For root dashboard links, match exactly without any query params
                if (item.to.endsWith('/student') || item.to.endsWith('/college') || item.to.endsWith('/admin')) {
                  isActive = location.pathname === item.to && !location.search;
                } else {
                  // For other subpaths (e.g. /profile, /applications), match prefix
                  isActive = location.pathname.startsWith(item.to);
                }
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={`sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
                >
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>
      </>
    );
  }
);
