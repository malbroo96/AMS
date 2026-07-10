import { forwardRef, useEffect, useMemo, useState } from 'react';
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
      { to: '/dashboard/college/profile/branding', label: 'Branding' },
      { to: '/dashboard/college/profile/address', label: 'Address' },
      { to: '/dashboard/college/profile/contact', label: 'Contacts' },
      { to: '/dashboard/college/profile/facilities', label: 'Facilities' },
      { to: '/dashboard/college/profile/accreditations', label: 'Accreditations' },
      { to: '/dashboard/college/profile/documents', label: 'Documents' },
      { to: '/dashboard/college/profile/gallery', label: 'Gallery' },
      { to: '/dashboard/college/profile/placements', label: 'Placements' },
      { to: '/dashboard/college/profile/social', label: 'Social Media' },
    ],
  },
  {
    label: 'Courses',
    icon: 'C',
    items: [
      { to: '/dashboard/college/courses', label: 'Course Management' },
      { to: '/dashboard/college/courses/add', label: 'Add Course' },
      { to: '/dashboard/college/courses/fees', label: 'Manage Fees' },
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
  onClose: () => void;
}

export const Sidebar = forwardRef<HTMLElement, SidebarProps>(
  function Sidebar({ role, open, onClose }, ref) {
    const items = role === 'college' ? [] : navByRole[role];
    const location = useLocation();

    const isActiveLink = useMemo(() => (item: NavItem) => {
      const [itemPath, itemQuery] = item.to.split('?');

      if (itemQuery) {
        return location.pathname === itemPath && location.search === `?${itemQuery}`;
      }

      if (item.to.endsWith('/student') || item.to.endsWith('/college') || item.to.endsWith('/admin')) {
        return location.pathname === item.to && !location.search;
      }

      return location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
    }, [location.pathname, location.search]);

    const activeCollegeGroup = useMemo(
      () => collegeNavGroups.find((group) => group.items.some(isActiveLink))?.label ?? '',
      [isActiveLink]
    );
    const [expandedGroup, setExpandedGroup] = useState(() => {
      if (activeCollegeGroup) return activeCollegeGroup;
      return window.sessionStorage.getItem('college-sidebar-expanded') ?? collegeNavGroups[0]?.label ?? '';
    });

    useEffect(() => {
      if (activeCollegeGroup) {
        setExpandedGroup(activeCollegeGroup);
      }
    }, [activeCollegeGroup]);

    useEffect(() => {
      if (expandedGroup) {
        window.sessionStorage.setItem('college-sidebar-expanded', expandedGroup);
        return;
      }

      window.sessionStorage.removeItem('college-sidebar-expanded');
    }, [expandedGroup]);

    return (
      <>
        {open && (
          <button
            type="button"
            className="sidebar-overlay fixed inset-0 z-30 md:hidden"
            onClick={onClose}
            aria-label="Close menu"
          />
        )}
        <aside
          ref={ref}
          id="dashboard-sidebar"
          className={`sidebar fixed inset-y-0 left-0 z-40 flex flex-col${open ? ' sidebar--open' : ''}`}
        >
          <div className="sidebar__brand">
            <div className="sidebar__brand-content">
              <LogoMark className="size-10" variant="light" />
              <div className="sidebar__brand-text">
                <p className="sidebar__brand-label">Eadmin Portal</p>
                <p className="sidebar__brand-title">{rolePortalLabel[role]}</p>
              </div>
            </div>
          </div>
          <nav className="sidebar__nav" aria-label={`${rolePortalLabel[role]} navigation`}>
            {role === 'college'
              ? collegeNavGroups.map((group) => {
                  const groupActive = group.items.some(isActiveLink);
                  const isExpanded = expandedGroup === group.label;
                  const panelId = `sidebar-panel-${group.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

                  return (
                    <section
                      key={group.label}
                      className={`sidebar__group${groupActive ? ' sidebar__group--active' : ''}${isExpanded ? ' sidebar__group--expanded' : ''}`}
                    >
                      <button
                        type="button"
                        className={`sidebar__group-title${groupActive ? ' sidebar__group-title--active' : ''}`}
                        onClick={() => setExpandedGroup((current) => (current === group.label ? '' : group.label))}
                        aria-expanded={isExpanded}
                        aria-controls={panelId}
                      >
                        <span className="sidebar__group-icon" aria-hidden="true">{group.icon}</span>
                        <span className="sidebar__group-label">{group.label}</span>
                        <span className="sidebar__group-chevron" aria-hidden="true">&gt;</span>
                      </button>
                      <div id={panelId} className="sidebar__subnav-shell">
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
