import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import {
  deleteCollegeLogo,
  getCollegeAssets,
  getCollegeDashboard,
  getCollegeProfile,
  updateCollegeProfile,
  uploadCollegeBanner,
  uploadCollegeLogo,
  type CollegeAssets,
  type CollegeProfileData,
} from '../../api/ams';
import { updateApplicationStatus } from '../../api/applications';
import { button, form, table } from '../../components/ui/designTokens';
import { useToast } from '../../context/ToastContext';
import { CollegeNotificationsPage, CollegeNotificationsPreview } from '../../components/layout/CollegeNotifications';
import { publishCollegeNotification } from '../../context/CollegeNotificationsContext';
import type { College } from '../../types';

type DashboardData = {
  college?: College;
  stats?: Record<string, number>;
  students?: Array<Record<string, unknown>>;
};

type PageConfig = {
  title: string;
  eyebrow: string;
  description: string;
  responsibility: string;
};

const pageConfigs: Record<string, PageConfig> = {
  '/dashboard/college': {
    title: 'Overview',
    eyebrow: 'Dashboard',
    description: 'A compact operational summary for the admission team.',
    responsibility: 'Monitor college health, profile readiness, and the latest admission activity.',
  },
  '/dashboard/college/statistics': {
    title: 'Statistics',
    eyebrow: 'Dashboard',
    description: 'Track student interest, visible profiles, and profile gaps.',
    responsibility: 'Review numerical performance indicators without application workflow actions.',
  },
  '/dashboard/college/recent-applications': {
    title: 'Recent Applications',
    eyebrow: 'Dashboard',
    description: 'Review the latest student activity requiring attention.',
    responsibility: 'Show recent applications only, with lightweight access request actions.',
  },
  '/dashboard/college/notifications': {
    title: 'Notifications',
    eyebrow: 'Dashboard',
    description: 'Prioritize alerts that affect daily admissions operations.',
    responsibility: 'Surface profile, application, and document reminders in one queue.',
  },
  '/dashboard/college/quick-actions': {
    title: 'Quick Actions',
    eyebrow: 'Dashboard',
    description: 'Jump into common college portal workflows.',
    responsibility: 'Provide shortcuts only; detailed work remains on the destination pages.',
  },
  '/dashboard/college/analytics': {
    title: 'Analytics',
    eyebrow: 'Dashboard',
    description: 'Scan trend-style admission signals for the current cycle.',
    responsibility: 'Visualize high-level admission signals, separate from report exports.',
  },
  '/dashboard/college/profile/basic': {
    title: 'Basic Information',
    eyebrow: 'College Profile',
    description: 'Maintain the primary identity details shown across the portal.',
    responsibility: 'Edit college name, short name, type, establishment year, and affiliation.',
  },
  '/dashboard/college/profile/contact': {
    title: 'Contact Details',
    eyebrow: 'College Profile',
    description: 'Manage official communication channels for admissions.',
    responsibility: 'Edit email, admission phone, office phone, and website details.',
  },
  '/dashboard/college/profile/address': {
    title: 'Address',
    eyebrow: 'College Profile',
    description: 'Keep location and postal information accurate.',
    responsibility: 'Edit city, state, country, pincode, and full campus address.',
  },
  '/dashboard/college/profile/assets': {
    title: 'Assets',
    eyebrow: 'College Profile',
    description: 'Manage brand visuals used on the public college profile.',
    responsibility: 'Upload or replace logo and banner assets only.',
  },
  '/dashboard/college/profile/facilities': {
    title: 'Facilities',
    eyebrow: 'College Profile',
    description: 'Showcase campus capabilities for students.',
    responsibility: 'Review facilities as profile attributes, separate from admission rules.',
  },
  '/dashboard/college/profile/admission': {
    title: 'Admission Information',
    eyebrow: 'College Profile',
    description: 'Present admission-facing profile notes and course context.',
    responsibility: 'Maintain admission summary content without application processing.',
  },
  '/dashboard/college/profile/documents': {
    title: 'Documents',
    eyebrow: 'College Profile',
    description: 'Organize profile documents and prospectus references.',
    responsibility: 'Manage college-level documents, not student application documents.',
  },
  '/dashboard/college/courses': {
    title: 'Course Management',
    eyebrow: 'Courses',
    description: 'Review active courses connected to this college.',
    responsibility: 'Maintain course records as a catalog workflow.',
  },
  '/dashboard/college/courses/departments': {
    title: 'Departments',
    eyebrow: 'Courses',
    description: 'Group academic offerings by department or branch.',
    responsibility: 'Organize departments separately from fees and seats.',
  },
  '/dashboard/college/courses/intake-fees': {
    title: 'Intake & Fees',
    eyebrow: 'Courses',
    description: 'Compare intake capacity and annual fee information.',
    responsibility: 'Focus on seats and fees only.',
  },
  '/dashboard/college/courses/eligibility': {
    title: 'Eligibility',
    eyebrow: 'Courses',
    description: 'Review criteria students must meet before applying.',
    responsibility: 'Keep eligibility text separate from pricing and availability.',
  },
  '/dashboard/college/courses/seats': {
    title: 'Seat Availability',
    eyebrow: 'Courses',
    description: 'Monitor available capacity by course.',
    responsibility: 'Track seat supply without editing profile identity data.',
  },
  '/dashboard/college/students': {
    title: 'Student List',
    eyebrow: 'Interested Students',
    description: 'View students who have shown interest in this college.',
    responsibility: 'List interested students without application status administration.',
  },
  '/dashboard/college/students/search': {
    title: 'Search & Filters',
    eyebrow: 'Interested Students',
    description: 'Find interested students by name, course, or status.',
    responsibility: 'Filter student interest records only.',
  },
  '/dashboard/college/students/profile': {
    title: 'Student Profile',
    eyebrow: 'Interested Students',
    description: 'Inspect profile fields available after access is granted.',
    responsibility: 'Show student profile details, separate from document verification.',
  },
  '/dashboard/college/students/contact': {
    title: 'Contact/Invite',
    eyebrow: 'Interested Students',
    description: 'Prepare outreach to students who match admission priorities.',
    responsibility: 'Support contact planning without changing application decisions.',
  },
  '/dashboard/college/students/export': {
    title: 'Export',
    eyebrow: 'Interested Students',
    description: 'Export interested student data for offline follow-up.',
    responsibility: 'Provide export controls for student interest records.',
  },
  '/dashboard/college/applications/pending': {
    title: 'Pending',
    eyebrow: 'Applications',
    description: 'Process applications waiting for college review.',
    responsibility: 'Handle pending items only.',
  },
  '/dashboard/college/applications/under-review': {
    title: 'Under Review',
    eyebrow: 'Applications',
    description: 'Track applications already escalated for review.',
    responsibility: 'Monitor in-progress reviews without mixing approved or rejected queues.',
  },
  '/dashboard/college/applications/approved': {
    title: 'Approved',
    eyebrow: 'Applications',
    description: 'Review applications that have been approved.',
    responsibility: 'Show approved applications for follow-up and audit.',
  },
  '/dashboard/college/applications/rejected': {
    title: 'Rejected',
    eyebrow: 'Applications',
    description: 'Review rejected application outcomes.',
    responsibility: 'Keep rejected records separate from active queues.',
  },
  '/dashboard/college/applications/student-details': {
    title: 'Student Details',
    eyebrow: 'Applications',
    description: 'Inspect applicant details tied to submitted applications.',
    responsibility: 'Show application-linked student details only.',
  },
  '/dashboard/college/applications/document-verification': {
    title: 'Document Verification',
    eyebrow: 'Applications',
    description: 'Review document readiness for applicant files.',
    responsibility: 'Focus on student application documents, not college profile documents.',
  },
  '/dashboard/college/applications/notes': {
    title: 'Notes',
    eyebrow: 'Applications',
    description: 'Capture internal admission team context.',
    responsibility: 'Record review notes without changing statuses.',
  },
  '/dashboard/college/applications/filters': {
    title: 'Filters',
    eyebrow: 'Applications',
    description: 'Create focused application queues.',
    responsibility: 'Filter application records across status, course, and dates.',
  },
  '/dashboard/college/notices/create': {
    title: 'Create Notice',
    eyebrow: 'Notices',
    description: 'Draft admission announcements for students.',
    responsibility: 'Create notice content only.',
  },
  '/dashboard/college/notices/published': {
    title: 'Published Notices',
    eyebrow: 'Notices',
    description: 'Review announcements currently visible to students.',
    responsibility: 'Manage published notice records.',
  },
  '/dashboard/college/notices/drafts': {
    title: 'Drafts',
    eyebrow: 'Notices',
    description: 'Continue unpublished notice work.',
    responsibility: 'Keep draft content separate from published announcements.',
  },
  '/dashboard/college/notices/categories': {
    title: 'Categories',
    eyebrow: 'Notices',
    description: 'Organize notices by admission theme.',
    responsibility: 'Maintain notice taxonomy only.',
  },
  '/dashboard/college/notices/attachments': {
    title: 'Attachments',
    eyebrow: 'Notices',
    description: 'Manage files attached to notices.',
    responsibility: 'Handle notice attachments, separate from profile documents.',
  },
  '/dashboard/college/reports/admissions': {
    title: 'Admission Reports',
    eyebrow: 'Reports',
    description: 'Summarize admission activity and conversion.',
    responsibility: 'Report on admission outcomes.',
  },
  '/dashboard/college/reports/students': {
    title: 'Student Reports',
    eyebrow: 'Reports',
    description: 'Summarize student interest and profile access.',
    responsibility: 'Report on student audiences.',
  },
  '/dashboard/college/reports/courses': {
    title: 'Course Reports',
    eyebrow: 'Reports',
    description: 'Summarize course demand and capacity.',
    responsibility: 'Report on course performance.',
  },
  '/dashboard/college/reports/analytics': {
    title: 'Analytics',
    eyebrow: 'Reports',
    description: 'Analyze portal performance across admission workflows.',
    responsibility: 'Report analytics separate from dashboard glance metrics.',
  },
  '/dashboard/college/reports/export': {
    title: 'Export',
    eyebrow: 'Reports',
    description: 'Generate PDF or Excel files for offline use.',
    responsibility: 'Export reports only.',
  },
  '/dashboard/college/settings/account': {
    title: 'Account',
    eyebrow: 'Settings',
    description: 'Manage account ownership and identity.',
    responsibility: 'Edit account-level settings.',
  },
  '/dashboard/college/settings/security': {
    title: 'Security',
    eyebrow: 'Settings',
    description: 'Review password and access controls.',
    responsibility: 'Manage security settings only.',
  },
  '/dashboard/college/settings/users-roles': {
    title: 'Users & Roles',
    eyebrow: 'Settings',
    description: 'Prepare role-based access for college staff.',
    responsibility: 'Manage staff access separate from student workflows.',
  },
  '/dashboard/college/settings/notifications': {
    title: 'Notifications',
    eyebrow: 'Settings',
    description: 'Configure alert preferences.',
    responsibility: 'Manage notification settings, not the notification inbox.',
  },
  '/dashboard/college/settings/branding': {
    title: 'Branding',
    eyebrow: 'Settings',
    description: 'Control visual identity defaults.',
    responsibility: 'Manage brand configuration separate from profile assets.',
  },
  '/dashboard/college/settings/integrations': {
    title: 'Integrations',
    eyebrow: 'Settings',
    description: 'Connect external tools used by admission teams.',
    responsibility: 'Manage integration readiness.',
  },
  '/dashboard/college/settings/backup': {
    title: 'Backup',
    eyebrow: 'Settings',
    description: 'Review data backup controls.',
    responsibility: 'Manage backup policy and restore readiness.',
  },
  '/dashboard/college/settings/audit-logs': {
    title: 'Audit Logs',
    eyebrow: 'Settings',
    description: 'Review administrative activity history.',
    responsibility: 'Show audit records without editing operational data.',
  },
};

const quickActions = [
  { label: 'Update assets', to: '/dashboard/college/profile/assets' },
  { label: 'Review pending applications', to: '/dashboard/college/applications/pending' },
  { label: 'Open student list', to: '/dashboard/college/students' },
  { label: 'Export reports', to: '/dashboard/college/reports/export' },
];

export function CollegePortalWorkspace() {
  const location = useLocation();
  const { showToast } = useToast();
  const [dashboard, setDashboard] = useState<DashboardData>({});
  const [profile, setProfile] = useState<CollegeProfileData | null>(null);
  const [assets, setAssets] = useState<CollegeAssets | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'banner' | null>(null);
  const [query, setQuery] = useState('');

  const path = location.pathname === '/dashboard/college/' ? '/dashboard/college' : location.pathname;
  const config = pageConfigs[path] || pageConfigs['/dashboard/college'];
  const students = useMemo(() => dashboard.students || [], [dashboard.students]);
  const filteredStudents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return students;
    return students.filter((student) =>
      ['name', 'email', 'courseName', 'branchName', 'status']
        .some((key) => String(student[key] || '').toLowerCase().includes(normalized))
    );
  }, [query, students]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([getCollegeDashboard(), getCollegeProfile()])
      .then(([dashboardRes, profileRes]) => {
        if (!active) return;
        setDashboard(dashboardRes.data.data);
        setProfile(profileRes.data.data);
      })
      .catch(() => showToast('Unable to load college portal data', 'error'))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [showToast]);

  useEffect(() => {
    const collegeId = dashboard.college?.id || profile?.id;
    if (!collegeId) return;

    getCollegeAssets(collegeId)
      .then((res) => setAssets(res.data.data))
      .catch(() => showToast('Unable to load college assets', 'error'));
  }, [dashboard.college?.id, profile?.id, showToast]);

  const refreshAssets = async () => {
    const collegeId = dashboard.college?.id || profile?.id;
    if (!collegeId) return;
    const res = await getCollegeAssets(collegeId);
    setAssets(res.data.data);
  };

  const saveProfile = async (data: Partial<CollegeProfileData>) => {
    setSaving(true);
    try {
      const res = await updateCollegeProfile(data);
      setProfile(res.data.data);
      setDashboard((current) => ({
        ...current,
        college: current.college
          ? {
              ...current.college,
              collegeName: res.data.data.collegeName,
              email: res.data.data.email,
            }
          : current.college,
      }));
      showToast('College profile updated successfully', 'success');
      publishCollegeNotification({
        type: 'Profile',
        title: 'Profile updated',
        description: 'Your college profile changes were saved successfully.',
        priority: 'success',
      });
    } catch {
      showToast('Unable to update college profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const uploadAsset = async (type: 'logo' | 'banner', file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      showToast('Only PNG, JPEG, and WebP images are allowed', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must not exceed 5 MB', 'error');
      return;
    }

    setUploading(type);
    try {
      if (type === 'logo') await uploadCollegeLogo(file);
      if (type === 'banner') await uploadCollegeBanner(file);
      await refreshAssets();
      showToast(`${type === 'logo' ? 'Logo' : 'Banner'} uploaded successfully`, 'success');
      publishCollegeNotification({
        type: 'Profile',
        title: `${type === 'logo' ? 'Logo' : 'Banner'} updated`,
        description: `Your college ${type} asset is now updated on the portal.`,
        priority: 'success',
      });
    } catch {
      showToast(`Unable to upload ${type}`, 'error');
    } finally {
      setUploading(null);
    }
  };

  const deleteLogo = async () => {
    const collegeId = dashboard.college?.id || profile?.id;
    if (!collegeId) return;
    setUploading('logo');
    try {
      await deleteCollegeLogo(collegeId);
      await refreshAssets();
      showToast('Logo removed successfully', 'success');
      publishCollegeNotification({
        type: 'Profile',
        title: 'Logo removed',
        description: 'Your college profile is missing a logo asset.',
        priority: 'reminder',
      });
    } catch {
      showToast('Unable to remove logo', 'error');
    } finally {
      setUploading(null);
    }
  };

  const requestAccess = async (student: Record<string, unknown>) => {
    const applicationId = String(student.applicationId || '');
    if (!applicationId) return;
    try {
      await updateApplicationStatus(applicationId, { status: 'under_review', remarks: 'College requested profile access' });
      const res = await getCollegeDashboard();
      setDashboard(res.data.data);
      showToast('Access request submitted', 'success');
      publishCollegeNotification({
        type: 'Application',
        title: 'Application moved to review',
        description: `${String(student.name || 'A student')} was moved to under review after access request.`,
        priority: 'info',
      });
    } catch {
      showToast('Unable to request access', 'error');
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="border-b border-slate-200 pb-5">
          <p className="text-xs font-bold uppercase text-slate-500">{config.eyebrow}</p>
          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">{config.title}</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">{config.description}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm lg:max-w-md">
              <span className="font-semibold text-slate-900">Responsibility:</span> {config.responsibility}
            </div>
          </div>
        </header>

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            Loading college workspace...
          </div>
        ) : (
          renderPage({
            path,
            config,
            dashboard,
            profile,
            assets,
            students: filteredStudents,
            rawStudents: students,
            query,
            saving,
            uploading,
            setQuery,
            saveProfile,
            uploadAsset,
            deleteLogo,
            requestAccess,
          })
        )}
      </div>
    </DashboardLayout>
  );
}

function renderPage(ctx: {
  path: string;
  config: PageConfig;
  dashboard: DashboardData;
  profile: CollegeProfileData | null;
  assets: CollegeAssets | null;
  students: Array<Record<string, unknown>>;
  rawStudents: Array<Record<string, unknown>>;
  query: string;
  saving: boolean;
  uploading: 'logo' | 'banner' | null;
  setQuery: (value: string) => void;
  saveProfile: (data: Partial<CollegeProfileData>) => Promise<void>;
  uploadAsset: (type: 'logo' | 'banner', file?: File) => Promise<void>;
  deleteLogo: () => Promise<void>;
  requestAccess: (student: Record<string, unknown>) => Promise<void>;
}) {
  if (ctx.path.startsWith('/dashboard/college/profile')) return <ProfilePage {...ctx} />;
  if (ctx.path.startsWith('/dashboard/college/courses')) return <CoursesPage {...ctx} />;
  if (ctx.path.startsWith('/dashboard/college/students')) return <StudentsPage {...ctx} />;
  if (ctx.path.startsWith('/dashboard/college/applications')) return <ApplicationsPage {...ctx} />;
  if (ctx.path.startsWith('/dashboard/college/notices')) return <NoticesPage {...ctx} />;
  if (ctx.path.startsWith('/dashboard/college/reports')) return <ReportsPage {...ctx} />;
  if (ctx.path.startsWith('/dashboard/college/settings')) return <SettingsPage {...ctx} />;
  return <DashboardPage {...ctx} />;
}

function DashboardPage({ path, dashboard, assets, rawStudents }: Parameters<typeof renderPage>[0]) {
  const stats = dashboard.stats || {};

  if (path === '/dashboard/college/statistics') {
    return <MetricGrid stats={stats} />;
  }

  if (path === '/dashboard/college/recent-applications') {
    return <StudentTable students={rawStudents.slice(0, 8)} showActions={false} />;
  }

  if (path === '/dashboard/college/notifications') {
    return <CollegeNotificationsPage />;
  }

  if (path === '/dashboard/college/quick-actions') {
    return <QuickActions />;
  }

  if (path === '/dashboard/college/analytics') {
    return <AnalyticsPanel stats={stats} />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div
            className="h-36 bg-slate-800"
            style={{
              backgroundImage: assets?.bannerUrl ? `url(${assets.bannerUrl})` : 'linear-gradient(135deg, #111827, #334155)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              {assets?.logoUrl ? (
                <img src={assets.logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-slate-400">{dashboard.college?.collegeName?.[0] || 'C'}</span>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-slate-950">{dashboard.college?.collegeName || 'College Profile'}</h2>
              <p className="mt-1 text-sm text-slate-600">{dashboard.college?.email || 'Email not set'}</p>
            </div>
            <Link to="/dashboard/college/profile/basic" className={`${button.secondary} sm:ml-auto`}>
              Edit profile
            </Link>
          </div>
        </section>
        <MetricGrid stats={stats} />
        <StudentTable students={rawStudents.slice(0, 5)} showActions={false} />
      </div>
      <aside className="space-y-6">
        <CollegeNotificationsPreview />
        <QuickActions />
      </aside>
    </div>
  );
}

function ProfilePage({
  path,
  profile,
  assets,
  saving,
  uploading,
  saveProfile,
  uploadAsset,
  deleteLogo,
}: Parameters<typeof renderPage>[0]) {
  if (!profile) return <EmptyState title="Profile not available" />;

  if (path.endsWith('/contact')) {
    return (
      <SimpleForm
        saving={saving}
        fields={[
          { label: 'Email Address', value: profile.email || profile.contact?.emailAddress || '', key: 'email' },
          { label: 'Admission Mobile Number', value: profile.contact?.admissionMobileNumber || '', key: 'admissionMobileNumber' },
          { label: 'Office Mobile Number', value: profile.contact?.officeMobileNumber || '', key: 'officeMobileNumber' },
          { label: 'Website URL', value: profile.contact?.websiteUrl || '', key: 'websiteUrl' },
        ]}
        onSave={(values) => saveProfile({ email: values.email, contact: values })}
      />
    );
  }

  if (path.endsWith('/address')) {
    return (
      <SimpleForm
        saving={saving}
        fields={[
          { label: 'Country', value: profile.location?.country || 'India', key: 'country' },
          { label: 'State', value: profile.location?.state || '', key: 'state' },
          { label: 'City', value: profile.location?.city || '', key: 'city' },
          { label: 'Pincode', value: profile.location?.pincode || '', key: 'pincode' },
          { label: 'Full Address', value: profile.location?.fullAddress || '', key: 'fullAddress', textarea: true },
        ]}
        onSave={(values) => saveProfile({ location: values })}
      />
    );
  }

  if (path.endsWith('/assets')) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <AssetPanel
          title="Logo"
          imageUrl={assets?.logoUrl}
          uploading={uploading === 'logo'}
          onUpload={(file) => uploadAsset('logo', file)}
          onDelete={assets?.logoUrl ? deleteLogo : undefined}
        />
        <AssetPanel
          title="Banner"
          imageUrl={assets?.bannerUrl}
          uploading={uploading === 'banner'}
          onUpload={(file) => uploadAsset('banner', file)}
        />
      </div>
    );
  }

  if (path.endsWith('/facilities')) {
    return <ListPanel items={profile.facilities || []} empty="No facilities are recorded yet." />;
  }

  if (path.endsWith('/admission')) {
    return (
      <SimpleForm
        saving={saving}
        fields={[
          { label: 'Summary Description', value: profile.about?.summaryDescription || '', key: 'summaryDescription', textarea: true },
          { label: 'Vision Statement', value: profile.about?.visionStatement || '', key: 'visionStatement', textarea: true },
          { label: 'Mission Statement', value: profile.about?.missionStatement || '', key: 'missionStatement', textarea: true },
        ]}
        onSave={(values) => saveProfile({ about: values })}
      />
    );
  }

  if (path.endsWith('/documents')) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-950">College Documents</h2>
        <p className="mt-2 text-sm text-slate-600">Prospectus: {profile.prospectusUrl || 'Not uploaded'}</p>
      </section>
    );
  }

  return (
    <SimpleForm
      saving={saving}
      fields={[
        { label: 'College Name', value: profile.collegeName || '', key: 'collegeName' },
        { label: 'Short Name', value: profile.shortName || '', key: 'shortName' },
        { label: 'College Type', value: profile.collegeType || '', key: 'collegeType' },
        { label: 'Establishment Year', value: String(profile.establishmentYear || ''), key: 'establishmentYear' },
        { label: 'University Affiliation', value: profile.universityAffiliation || '', key: 'universityAffiliation' },
        { label: 'NAAC Grade', value: profile.naacGrade || '', key: 'naacGrade' },
      ]}
      onSave={(values) => saveProfile({ ...values, establishmentYear: Number(values.establishmentYear) || null })}
    />
  );
}

function CoursesPage({ path, profile }: Parameters<typeof renderPage>[0]) {
  const courses = profile?.courses || [];
  const focus = path.endsWith('/departments')
    ? ['Course', 'Department']
    : path.endsWith('/intake-fees')
      ? ['Course', 'Seats', 'Annual Fee']
      : path.endsWith('/eligibility')
        ? ['Course', 'Eligibility']
        : path.endsWith('/seats')
          ? ['Course', 'Seat Availability']
          : ['Course', 'Branch', 'Duration', 'Status'];

  return <CourseTable courses={courses} columns={focus} />;
}

function StudentsPage({ path, students, query, setQuery }: Parameters<typeof renderPage>[0]) {
  if (path.endsWith('/search')) {
    return (
      <div className="space-y-4">
        <input value={query} onChange={(event) => setQuery(event.target.value)} className={form.input} placeholder="Search by name, email, course, or status" />
        <StudentTable students={students} showActions={false} />
      </div>
    );
  }

  if (path.endsWith('/profile')) return <StudentProfilePreview students={students} />;
  if (path.endsWith('/contact')) return <ContactQueue students={students} />;
  if (path.endsWith('/export')) return <ExportPanel label="Interested students" count={students.length} />;
  return <StudentTable students={students} showActions={false} />;
}

function ApplicationsPage({ path, students, requestAccess }: Parameters<typeof renderPage>[0]) {
  const statusMap: Record<string, string[]> = {
    '/pending': ['submitted', 'interested', 'pending'],
    '/under-review': ['under_review', 'under review'],
    '/approved': ['approved'],
    '/rejected': ['rejected'],
  };
  const suffix = Object.keys(statusMap).find((key) => path.endsWith(key));
  const rows = suffix
    ? students.filter((student) => statusMap[suffix].includes(String(student.status || '').toLowerCase()))
    : students;

  if (path.endsWith('/document-verification')) return <DocumentVerification students={students} />;
  if (path.endsWith('/notes')) return <NotesPanel />;
  if (path.endsWith('/filters')) return <ApplicationFilters />;
  if (path.endsWith('/student-details')) return <StudentProfilePreview students={students} />;
  return <StudentTable students={rows} showActions onRequestAccess={requestAccess} />;
}

function NoticesPage({ path }: Parameters<typeof renderPage>[0]) {
  if (path.endsWith('/create')) {
    const publishNotice = () => {
      publishCollegeNotification({
        type: 'Notice',
        title: 'Notice published',
        description: 'Your admission notice was published for students.',
        priority: 'success',
      });
    };

    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4">
          <input className={form.input} placeholder="Notice title" />
          <textarea className={form.input} rows={6} placeholder="Notice body" />
          <button type="button" onClick={publishNotice} className={`${button.primary} w-fit`}>Publish notice</button>
        </div>
      </section>
    );
  }
  return <EmptyState title="No notices to show" />;
}

function ReportsPage({ path, dashboard, profile, students }: Parameters<typeof renderPage>[0]) {
  if (path.endsWith('/export')) return <ExportPanel label="Reports" count={students.length} />;
  if (path.endsWith('/courses')) return <CourseTable courses={profile?.courses || []} columns={['Course', 'Seats', 'Annual Fee']} />;
  return <AnalyticsPanel stats={dashboard.stats || {}} />;
}

function SettingsPage({ path, dashboard }: Parameters<typeof renderPage>[0]) {
  if (path.endsWith('/account')) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-950">{dashboard.college?.collegeName || 'College account'}</h2>
        <p className="mt-2 text-sm text-slate-600">{dashboard.college?.email || 'Email not available'}</p>
      </section>
    );
  }
  return <EmptyState title="Settings area ready for configuration" />;
}

function MetricGrid({ stats }: { stats: Record<string, number> }) {
  const metrics = [
    ['Interested Students', stats.interestedStudents || 0],
    ['Visible Profiles', stats.grantedProfiles || 0],
    ['Hidden Profiles', stats.hiddenProfiles || 0],
    ['Total Applications', stats.totalApplications || stats.interestedStudents || 0],
  ];
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
        </div>
      ))}
    </section>
  );
}

function StudentTable({
  students,
  showActions,
  onRequestAccess,
}: {
  students: Array<Record<string, unknown>>;
  showActions: boolean;
  onRequestAccess?: (student: Record<string, unknown>) => void;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full whitespace-nowrap text-left text-sm">
          <thead className={table.head}>
            <tr>
              <th className="p-4">Student</th>
              <th className="p-4">Course</th>
              <th className="p-4">Applied</th>
              <th className="p-4">Status</th>
              {showActions && <th className="p-4 text-right">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((student, index) => {
              const status = String(student.status || '-');
              const needsAccess = ['submitted', 'interested', 'pending'].includes(status.toLowerCase());
              return (
                <tr key={String(student.applicationId || index)} className={table.row}>
                  <td className="p-4 font-semibold text-slate-900">{String(student.name || 'Hidden Profile')}</td>
                  <td className="p-4 text-slate-600">{String(student.courseName || '-')}</td>
                  <td className="p-4 text-slate-600">{formatDate(String(student.appliedDate || ''))}</td>
                  <td className="p-4"><StatusBadge status={status} /></td>
                  {showActions && (
                    <td className="p-4 text-right">
                      {needsAccess ? (
                        <button type="button" onClick={() => onRequestAccess?.(student)} className={button.primary}>
                          Request access
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-slate-500">No action</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            {!students.length && (
              <tr>
                <td colSpan={showActions ? 5 : 4} className="p-8 text-center text-slate-500">No records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SimpleForm({
  fields,
  saving,
  onSave,
}: {
  fields: Array<{ label: string; value: string; key: string; textarea?: boolean }>;
  saving: boolean;
  onSave: (values: Record<string, string>) => void;
}) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((field) => [field.key, field.value])));

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <label key={field.key} className={field.textarea ? 'md:col-span-2' : ''}>
            <span className={form.label}>{field.label}</span>
            {field.textarea ? (
              <textarea className={form.input} rows={4} value={values[field.key]} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })} />
            ) : (
              <input className={form.input} value={values[field.key]} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })} />
            )}
          </label>
        ))}
      </div>
      <div className="mt-5 flex justify-end">
        <button type="button" onClick={() => onSave(values)} disabled={saving} className={button.primary}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </section>
  );
}

function AssetPanel({
  title,
  imageUrl,
  uploading,
  onUpload,
  onDelete,
}: {
  title: string;
  imageUrl?: string | null;
  uploading: boolean;
  onUpload: (file?: File) => void;
  onDelete?: () => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-44 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        {imageUrl ? <img src={imageUrl} alt={title} className="h-full w-full object-cover" /> : <span className="text-sm text-slate-500">No {title.toLowerCase()} uploaded</span>}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <label className={button.primary}>
          {uploading ? 'Uploading...' : `Upload ${title}`}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={uploading} onChange={(event) => onUpload(event.target.files?.[0])} />
        </label>
        {onDelete && <button type="button" onClick={onDelete} disabled={uploading} className={button.secondary}>Remove</button>}
      </div>
    </section>
  );
}

function CourseTable({ courses, columns }: { courses: Array<Record<string, unknown>>; columns: string[] }) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className={table.head}>
          <tr>{columns.map((column) => <th key={column} className="p-4">{column}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {courses.map((course, index) => (
            <tr key={String(course.id || course.CollegeCourseID || index)} className={table.row}>
              {columns.map((column) => <td key={column} className="p-4 text-slate-700">{courseValue(course, column)}</td>)}
            </tr>
          ))}
          {!courses.length && (
            <tr><td colSpan={columns.length} className="p-8 text-center text-slate-500">No course records found.</td></tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

function courseValue(course: Record<string, unknown>, column: string) {
  const lookup: Record<string, unknown> = {
    Course: course.courseName || course.CourseName || course.name || '-',
    Branch: course.branchName || course.BranchName || 'General',
    Department: course.branchName || course.BranchName || 'General',
    Duration: course.duration || course.DurationYears || '-',
    Status: course.isActive === false ? 'Inactive' : 'Active',
    Seats: course.seats || course.TotalSeats || '-',
    'Annual Fee': course.fees || course.AnnualFee || '-',
    Eligibility: course.eligibility || course.EligibilityCriteria || '-',
    'Seat Availability': course.seats || course.TotalSeats || '-',
  };
  return String(lookup[column] || '-');
}

function QuickActions() {
  return (
    <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      {quickActions.map((action) => (
        <Link key={action.to} to={action.to} className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
          {action.label}
        </Link>
      ))}
    </section>
  );
}

function AnalyticsPanel({ stats }: { stats: Record<string, number> }) {
  const rows = [
    ['Interest', stats.interestedStudents || 0],
    ['Visible', stats.grantedProfiles || 0],
    ['Hidden', stats.hiddenProfiles || 0],
  ];
  const max = Math.max(...rows.map(([, value]) => Number(value)), 1);
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-4">
        {rows.map(([label, value]) => (
          <div key={label}>
            <div className="mb-1 flex justify-between text-sm"><span className="font-semibold text-slate-700">{label}</span><span>{value}</span></div>
            <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-600" style={{ width: `${(Number(value) / max) * 100}%` }} /></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ListPanel({ items, empty }: { items: Array<string>; empty: string }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      {items.length ? (
        <ul className="space-y-3">{items.map((item) => <li key={item} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">{item}</li>)}</ul>
      ) : (
        <p className="text-sm text-slate-500">{empty}</p>
      )}
    </section>
  );
}

function StudentProfilePreview({ students }: { students: Array<Record<string, unknown>> }) {
  const student = students.find((item) => String(item.name || '').trim()) || students[0];
  if (!student) return <EmptyState title="No student profile available" />;
  return (
    <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
      {['name', 'email', 'mobile', 'education', 'courseName', 'status'].map((key) => (
        <div key={key}>
          <p className="text-xs font-bold uppercase text-slate-500">{key.replace(/([A-Z])/g, ' $1')}</p>
          <p className="mt-1 font-semibold text-slate-900">{String(student[key] || '-')}</p>
        </div>
      ))}
    </section>
  );
}

function ContactQueue({ students }: { students: Array<Record<string, unknown>> }) {
  return <StudentTable students={students.filter((student) => student.email || student.mobile)} showActions={false} />;
}

function ExportPanel({ label, count }: { label: string; count: number }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-600">{count} {label.toLowerCase()} records are ready for export.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className={button.secondary}>Export PDF</button>
        <button type="button" className={button.primary}>Export Excel</button>
      </div>
    </section>
  );
}

function DocumentVerification({ students }: { students: Array<Record<string, unknown>> }) {
  const total = students.reduce((sum, student) => sum + (Array.isArray(student.documents) ? student.documents.length : 0), 0);
  return <EmptyState title={`${total} student documents available for verification`} />;
}

function NotesPanel() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <textarea className={form.input} rows={6} placeholder="Internal application note" />
      <button type="button" className={`${button.primary} mt-4`}>Save note</button>
    </section>
  );
}

function ApplicationFilters() {
  return (
    <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
      <input className={form.input} placeholder="Search applications" />
      <select className={form.input}><option>Status</option><option>Pending</option><option>Approved</option></select>
      <input className={form.input} type="date" />
    </section>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <p className="font-semibold text-slate-900">{title}</p>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const className = normalized.includes('approved')
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : normalized.includes('reject')
      ? 'border-red-200 bg-red-50 text-red-700'
      : normalized.includes('review')
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-blue-200 bg-blue-50 text-blue-700';
  return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}>{status}</span>;
}

function formatDate(value: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}
