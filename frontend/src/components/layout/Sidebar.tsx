import { NavLink } from 'react-router-dom';
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
  ],
  college: [
    { to: '/dashboard/college', label: 'Dashboard' },
    { to: '/dashboard/college?view=students', label: 'Interested Students' },
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

export function Sidebar({ role, open, onClose }: { role: UserRole; open: boolean; onClose: () => void }) {
  const items = navByRole[role];

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
        className={`sidebar fixed inset-y-0 left-0 z-40 flex w-64 flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="sidebar__brand flex items-center gap-3">
          <LogoMark className="size-10" variant="light" />
          <div>
            <p className="sidebar__brand-label">Eadmin Portal</p>
            <p className="sidebar__brand-title">{rolePortalLabel[role]}</p>
          </div>
        </div>
        <nav className="sidebar__nav">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.endsWith('/student') || item.to.endsWith('/college') || item.to.endsWith('/admin')}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
