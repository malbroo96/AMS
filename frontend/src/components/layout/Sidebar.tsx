import { forwardRef, type RefObject } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LogoMark } from '../LogoMark';
import type { UserRole } from '../../types';
import './Sidebar.css';

interface NavItem {
  to: string;
  label: string;
}

interface NavGroup {
  label: string;
  icon: string;
  items: NavItem[];
}

const navByRole: Record<Exclude<UserRole, 'college'>, NavItem[]> = {
  student: [
    { to: '/dashboard/student', label: 'Dashboard' },
    { to: '/dashboard/student?view=colleges', label: 'Colleges' },
    { to: '/dashboard/student/profile', label: 'Profile' },
  ],
  admin: [
    { to: '/dashboard/admin', label: 'Dashboard' },
    { to: '/dashboard/admin/colleges', label: 'Colleges' },
    { to: '/dashboard/admin/students', label: 'Students' },
    { to: '/dashboard/admin/permissions', label: 'Permissions' },
  ],
};

const collegeNavGroups: NavGroup[] = [
  {
    label: 'Dashboard',
    icon: 'D',
    items: [
      { to: '/dashboard/college', label: 'Overview' },
      { to: '/dashboard/college/statistics', label: 'Statistics' },
      { to: '/dashboard/college/recent-applications', label: 'Recent Applications' },
      { to: '/dashboard/college/notifications', label: 'Notifications' },
      { to: '/dashboard/college/quick-actions', label: 'Quick Actions' },
      { to: '/dashboard/college/analytics', label: 'Analytics' },
    ],
  },
  {
    label: 'College Profile',
    icon: 'P',
    items: [
      { to: '/dashboard/college/profile/basic', label: 'Basic Information' },
      { to: '/dashboard/college/profile/contact', label: 'Contact Details' },
      { to: '/dashboard/college/profile/address', label: 'Address' },
      { to: '/dashboard/college/profile/assets', label: 'Assets' },
      { to: '/dashboard/college/profile/facilities', label: 'Facilities' },
      { to: '/dashboard/college/profile/admission', label: 'Admission Information' },
      { to: '/dashboard/college/profile/documents', label: 'Documents' },
    ],
  },
  {
    label: 'Courses',
    icon: 'C',
    items: [
      { to: '/dashboard/college/courses', label: 'Course Management' },
      { to: '/dashboard/college/courses/departments', label: 'Departments' },
      { to: '/dashboard/college/courses/intake-fees', label: 'Intake & Fees' },
      { to: '/dashboard/college/courses/eligibility', label: 'Eligibility' },
      { to: '/dashboard/college/courses/seats', label: 'Seat Availability' },
    ],
  },
  {
    label: 'Interested Students',
    icon: 'S',
    items: [
      { to: '/dashboard/college/students', label: 'Student List' },
      { to: '/dashboard/college/students/search', label: 'Search & Filters' },
      { to: '/dashboard/college/students/profile', label: 'Student Profile' },
      { to: '/dashboard/college/students/contact', label: 'Contact/Invite' },
      { to: '/dashboard/college/students/export', label: 'Export' },
    ],
  },
  {
    label: 'Applications',
    icon: 'A',
    items: [
      { to: '/dashboard/college/applications/pending', label: 'Pending' },
      { to: '/dashboard/college/applications/under-review', label: 'Under Review' },
      { to: '/dashboard/college/applications/approved', label: 'Approved' },
      { to: '/dashboard/college/applications/rejected', label: 'Rejected' },
      { to: '/dashboard/college/applications/student-details', label: 'Student Details' },
      { to: '/dashboard/college/applications/document-verification', label: 'Document Verification' },
      { to: '/dashboard/college/applications/notes', label: 'Notes' },
      { to: '/dashboard/college/applications/filters', label: 'Filters' },
    ],
  },
  {
    label: 'Notices',
    icon: 'N',
    items: [
      { to: '/dashboard/college/notices/create', label: 'Create Notice' },
      { to: '/dashboard/college/notices/published', label: 'Published Notices' },
      { to: '/dashboard/college/notices/drafts', label: 'Drafts' },
      { to: '/dashboard/college/notices/categories', label: 'Categories' },
      { to: '/dashboard/college/notices/attachments', label: 'Attachments' },
    ],
  },
  {
    label: 'Reports',
    icon: 'R',
    items: [
      { to: '/dashboard/college/reports/admissions', label: 'Admission Reports' },
      { to: '/dashboard/college/reports/students', label: 'Student Reports' },
      { to: '/dashboard/college/reports/courses', label: 'Course Reports' },
      { to: '/dashboard/college/reports/analytics', label: 'Analytics' },
      { to: '/dashboard/college/reports/export', label: 'Export' },
    ],
  },
  {
    label: 'Settings',
    icon: 'G',
    items: [
      { to: '/dashboard/college/settings/account', label: 'Account' },
      { to: '/dashboard/college/settings/security', label: 'Security' },
      { to: '/dashboard/college/settings/users-roles', label: 'Users & Roles' },
      { to: '/dashboard/college/settings/notifications', label: 'Notifications' },
      { to: '/dashboard/college/settings/branding', label: 'Branding' },
      { to: '/dashboard/college/settings/integrations', label: 'Integrations' },
      { to: '/dashboard/college/settings/backup', label: 'Backup' },
      { to: '/dashboard/college/settings/audit-logs', label: 'Audit Logs' },
    ],
  },
];

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
    const items = role === 'college' ? [] : navByRole[role];
    const location = useLocation();

    const isActiveLink = (item: NavItem) => {
      const [itemPath, itemQuery] = item.to.split('?');

      if (itemQuery) {
        return location.pathname === itemPath && location.search === `?${itemQuery}`;
      }

      if (item.to.endsWith('/student') || item.to.endsWith('/college') || item.to.endsWith('/admin')) {
        return location.pathname === item.to && !location.search;
      }

      return location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
    };

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
          <nav className="sidebar__nav" aria-label={`${rolePortalLabel[role]} navigation`}>
            {role === 'college'
              ? collegeNavGroups.map((group) => {
                  const groupActive = group.items.some(isActiveLink);

                  return (
                    <section key={group.label} className="sidebar__group">
                      <div className={`sidebar__group-title${groupActive ? ' sidebar__group-title--active' : ''}`}>
                        <span className="sidebar__group-icon" aria-hidden="true">{group.icon}</span>
                        <span>{group.label}</span>
                      </div>
                      <div className="sidebar__subnav">
                        {group.items.map((item) => {
                          const isActive = isActiveLink(item);

                          return (
                            <NavLink
                              key={item.to}
                              to={item.to}
                              onClick={onClose}
                              className={`sidebar__link sidebar__link--nested${isActive ? ' sidebar__link--active' : ''}`}
                            >
                              {item.label}
                            </NavLink>
                          );
                        })}
                      </div>
                    </section>
                  );
                })
              : items.map((item) => {
                  const isActive = isActiveLink(item);

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
