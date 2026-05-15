import { NavLink } from 'react-router-dom';
import { LogoMark } from '../LogoMark';
import type { UserRole } from '../../types';

interface NavItem {
  to: string;
  label: string;
}

const navByRole: Record<UserRole, NavItem[]> = {
  student: [
    { to: '/dashboard/student', label: 'Dashboard' },
    { to: '/dashboard/student/profile', label: 'Profile' },
    { to: '/dashboard/student/apply', label: 'Apply Admission' },
    { to: '/dashboard/student/applications', label: 'My Applications' },
  ],
  school_admin: [
    { to: '/dashboard/admin', label: 'Dashboard' },
    { to: '/dashboard/admin/applications', label: 'Applications' },
    { to: '/dashboard/admin/status', label: 'Status Management' },
  ],
  super_admin: [
    { to: '/dashboard/superadmin', label: 'Dashboard' },
    { to: '/dashboard/superadmin/schools', label: 'Manage Schools' },
    { to: '/dashboard/superadmin/admins', label: 'School Admins' },
    { to: '/dashboard/superadmin/analytics', label: 'Analytics' },
  ],
};

export function Sidebar({ role, open, onClose }: { role: UserRole; open: boolean; onClose: () => void }) {
  const items = navByRole[role];

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-label="Close menu"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-blue-900 text-white shadow-md transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 border-b border-blue-800 px-4 py-5">
          <LogoMark className="size-10" variant="light" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">Eadmin Portal</p>
            <p className="text-sm font-bold">Admission System</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.endsWith('/student') || item.to.endsWith('/admin') || item.to.endsWith('/superadmin')}
              onClick={onClose}
              className={({ isActive }) =>
                `block rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-800'
                }`
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
