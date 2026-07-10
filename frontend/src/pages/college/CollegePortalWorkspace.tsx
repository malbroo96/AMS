import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import {
  createCollegeCourse,
  createCollegeGalleryImage,
  createCollegeNotice,
  deleteCollegeCourse,
  deleteCollegeGalleryImage,
  deleteCollegeLogo,
  deleteCollegeNotice,
  getCollegeAssets,
  getCollegeDashboard,
  getCollegeProfile,
  listCollegeNotices,
  updateCollegeNotice,
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
import { useCollegeNotifications } from '../../context/CollegeNotificationsContext';
import type { College } from '../../types';

const FACILITY_OPTIONS = [
  'Hostel',
  'Library',
  'WiFi',
  'Smart Classroom',
  'Computer Lab',
  'Sports',
  'Gym',
  'Cafeteria',
  'Transport',
  'Auditorium',
  'Medical Facility',
  'Placement Cell',
  'Research Center',
  'Parking',
  'ATM',
  'Bank',
  'Others',
];

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
  '/dashboard/college/profile/branding': {
    title: 'Branding',
    eyebrow: 'College Profile',
    description: 'Manage brand visuals used on the public college profile.',
    responsibility: 'Upload or replace logo and banner assets only.',
  },
  '/dashboard/college/profile/facilities': {
    title: 'Facilities',
    eyebrow: 'College Profile',
    description: 'Showcase campus capabilities for students.',
    responsibility: 'Select and save facilities from the database-backed catalog.',
  },
  '/dashboard/college/profile/accreditations': {
    title: 'Accreditations',
    eyebrow: 'College Profile',
    description: 'Maintain accreditation records that drive the college rating.',
    responsibility: 'Edit accreditation grades and certificates; rating recalculates automatically.',
  },
  '/dashboard/college/profile/documents': {
    title: 'Documents',
    eyebrow: 'College Profile',
    description: 'Organize profile documents and prospectus references.',
    responsibility: 'Manage college-level documents stored in SQL Server.',
  },
  '/dashboard/college/profile/gallery': {
    title: 'Gallery',
    eyebrow: 'College Profile',
    description: 'Manage campus images shown on the public profile.',
    responsibility: 'Add or remove gallery images from the database.',
  },
  '/dashboard/college/profile/placements': {
    title: 'Placements',
    eyebrow: 'College Profile',
    description: 'Publish placement statistics and top recruiters.',
    responsibility: 'Edit placement metrics stored in CollegePlacements.',
  },
  '/dashboard/college/profile/social': {
    title: 'Social Media',
    eyebrow: 'College Profile',
    description: 'Keep social profile links up to date.',
    responsibility: 'Edit Facebook, Instagram, LinkedIn, Twitter/X, and YouTube URLs.',
  },
  '/dashboard/college/courses': {
    title: 'Course Management',
    eyebrow: 'Courses',
    description: 'Review, edit, and delete courses connected to this college.',
    responsibility: 'Maintain course records as a catalog workflow.',
  },
  '/dashboard/college/courses/add': {
    title: 'Add Course',
    eyebrow: 'Courses',
    description: 'Create a new course offering with fees.',
    responsibility: 'Insert CollegeCourses and CollegeFees rows via API.',
  },
  '/dashboard/college/courses/fees': {
    title: 'Manage Fees',
    eyebrow: 'Courses',
    description: 'Review fee structure for every course.',
    responsibility: 'Display tuition, hostel, transport, exam, and total fees from SQL.',
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
  const { refreshNotifications } = useCollegeNotifications();
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

    Promise.all([getCollegeDashboard(), getCollegeProfile(), refreshNotifications()])
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
  }, [refreshNotifications, showToast]);

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

  const reloadProfile = async () => {
    const res = await getCollegeProfile();
    setProfile(res.data.data);
    return res.data.data;
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
      await refreshNotifications();
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
      await refreshNotifications();
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
      await refreshNotifications();
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
      await refreshNotifications();
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
            reloadProfile,
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
  reloadProfile: () => Promise<CollegeProfileData>;
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
  reloadProfile,
  uploadAsset,
  deleteLogo,
}: Parameters<typeof renderPage>[0]) {
  if (!profile) return <EmptyState title="Profile not available" />;

  if (path.endsWith('/contact')) {
    return (
      <SimpleForm
        saving={saving}
        fields={[
          { label: 'Principal Name', value: profile.contacts?.principalName || profile.contact?.principalName || '', key: 'principalName' },
          { label: 'Admission Officer', value: profile.contacts?.admissionOfficer || profile.contact?.admissionOfficer || '', key: 'admissionOfficer' },
          { label: 'Admission Email', value: profile.contacts?.admissionEmail || profile.contact?.admissionEmail || profile.email || '', key: 'admissionEmail' },
          { label: 'Admission Phone', value: profile.contacts?.admissionPhone || profile.contact?.admissionPhone || profile.contact?.admissionMobileNumber || '', key: 'admissionPhone' },
          { label: 'WhatsApp Number', value: profile.contacts?.whatsAppNumber || profile.contact?.whatsAppNumber || '', key: 'whatsAppNumber' },
          { label: 'Website URL', value: profile.contact?.websiteUrl || '', key: 'websiteUrl' },
        ]}
        onSave={(values) =>
          saveProfile({
            contact: {
              ...values,
              admissionMobileNumber: values.admissionPhone,
              emailAddress: values.admissionEmail,
              websiteUrl: values.websiteUrl,
            },
            contacts: values,
          })
        }
      />
    );
  }

  if (path.endsWith('/address')) {
    return (
      <SimpleForm
        saving={saving}
        fields={[
          { label: 'Country', value: profile.location?.country || '', key: 'country' },
          { label: 'State', value: profile.location?.state || '', key: 'state' },
          { label: 'District', value: profile.location?.district || '', key: 'district' },
          { label: 'City', value: profile.location?.city || '', key: 'city' },
          { label: 'Pincode', value: profile.location?.pincode || '', key: 'pincode' },
          { label: 'Google Map URL', value: profile.location?.googleMapUrl || profile.location?.googleMapsUrl || '', key: 'googleMapUrl' },
          { label: 'Full Address', value: profile.location?.fullAddress || profile.location?.address || '', key: 'fullAddress', textarea: true },
        ]}
        onSave={(values) => saveProfile({ location: values })}
      />
    );
  }

  if (path.endsWith('/branding') || path.endsWith('/assets')) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <AssetPanel
          title="Logo"
          imageUrl={assets?.logoUrl || profile.logoUrl}
          uploading={uploading === 'logo'}
          onUpload={(file) => uploadAsset('logo', file)}
          onDelete={assets?.logoUrl || profile.logoUrl ? deleteLogo : undefined}
        />
        <AssetPanel
          title="Banner"
          imageUrl={assets?.bannerUrl || profile.coverBannerUrl || profile.bannerUrl}
          uploading={uploading === 'banner'}
          onUpload={(file) => uploadAsset('banner', file)}
        />
        {profile.rating != null && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:col-span-2">
            <p className="text-xs font-semibold uppercase text-slate-500">Calculated rating (from accreditations)</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{Number(profile.rating).toFixed(2)} / 5</p>
          </div>
        )}
      </div>
    );
  }

  if (path.endsWith('/facilities')) {
    return <FacilitiesEditor profile={profile} saving={saving} saveProfile={saveProfile} />;
  }

  if (path.endsWith('/accreditations')) {
    return <AccreditationsEditor profile={profile} saving={saving} saveProfile={saveProfile} />;
  }

  if (path.endsWith('/documents')) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-950">College Documents</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {(profile.documents || []).length === 0 && <li className="text-slate-500">No documents uploaded yet.</li>}
          {(profile.documents || []).map((doc) => (
            <li key={String(doc.id || doc.fileUrl)} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2">
              <span>
                <span className="font-medium">{String(doc.documentType || 'Document')}</span>
                {doc.documentName ? ` — ${String(doc.documentName)}` : ''}
              </span>
              {doc.fileUrl ? (
                <a href={String(doc.fileUrl)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                  Open
                </a>
              ) : null}
            </li>
          ))}
        </ul>
        {profile.prospectusUrl && (
          <p className="mt-4 text-sm text-slate-600">
            Prospectus:{' '}
            <a href={profile.prospectusUrl} className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">
              View
            </a>
          </p>
        )}
      </section>
    );
  }

  if (path.endsWith('/gallery')) {
    return <GalleryEditor profile={profile} onChanged={reloadProfile} />;
  }

  if (path.endsWith('/placements')) {
    const recruiters = (profile.placements?.topRecruiters || [])
      .map((r) => (typeof r === 'string' ? r : r.recruiterName || ''))
      .filter(Boolean)
      .join(', ');
    return (
      <SimpleForm
        saving={saving}
        fields={[
          { label: 'Highest Package', value: profile.placements?.highestPackage || '', key: 'highestPackage' },
          { label: 'Average Package', value: profile.placements?.averagePackage || '', key: 'averagePackage' },
          { label: 'Placement Percentage', value: String(profile.placements?.placementPercentage ?? ''), key: 'placementPercentage' },
          { label: 'Top Recruiters (comma separated)', value: recruiters, key: 'topRecruiters', textarea: true },
        ]}
        onSave={(values) =>
          saveProfile({
            placements: {
              highestPackage: values.highestPackage,
              averagePackage: values.averagePackage,
              placementPercentage: Number(values.placementPercentage) || null,
              topRecruiters: values.topRecruiters
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            },
          })
        }
      />
    );
  }

  if (path.endsWith('/social')) {
    const social = profile.socialLinks || {};
    return (
      <SimpleForm
        saving={saving}
        fields={[
          { label: 'Facebook', value: social.facebook || '', key: 'facebook' },
          { label: 'Instagram', value: social.instagram || '', key: 'instagram' },
          { label: 'LinkedIn', value: social.linkedin || '', key: 'linkedin' },
          { label: 'Twitter / X', value: social.twitter || '', key: 'twitter' },
          { label: 'YouTube', value: social.youtube || '', key: 'youtube' },
        ]}
        onSave={(values) => saveProfile({ socialLinks: values })}
      />
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
        { label: 'Description', value: profile.about?.summaryDescription || '', key: 'summaryDescription', textarea: true },
        { label: 'Vision', value: profile.about?.vision || profile.about?.visionStatement || '', key: 'vision', textarea: true },
        { label: 'Mission', value: profile.about?.mission || profile.about?.missionStatement || '', key: 'mission', textarea: true },
      ]}
      onSave={(values) =>
        saveProfile({
          collegeName: values.collegeName,
          shortName: values.shortName,
          collegeType: values.collegeType,
          universityAffiliation: values.universityAffiliation,
          establishmentYear: Number(values.establishmentYear) || null,
          about: {
            summaryDescription: values.summaryDescription,
            vision: values.vision,
            visionStatement: values.vision,
            mission: values.mission,
            missionStatement: values.mission,
          },
        })
      }
    />
  );
}

function FacilitiesEditor({
  profile,
  saving,
  saveProfile,
}: {
  profile: CollegeProfileData;
  saving: boolean;
  saveProfile: (data: Partial<CollegeProfileData>) => Promise<void>;
}) {
  const [selected, setSelected] = useState<string[]>(profile.facilities || []);
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {FACILITY_OPTIONS.map((facility) => {
          const checked = selected.includes(facility);
          return (
            <label key={facility} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${checked ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => setSelected((prev) => (checked ? prev.filter((f) => f !== facility) : [...prev, facility]))}
              />
              {facility}
            </label>
          );
        })}
      </div>
      <button type="button" disabled={saving} className={`${button.primary} mt-4`} onClick={() => void saveProfile({ facilities: selected })}>
        {saving ? 'Saving…' : 'Save facilities'}
      </button>
    </section>
  );
}

function AccreditationsEditor({
  profile,
  saving,
  saveProfile,
}: {
  profile: CollegeProfileData;
  saving: boolean;
  saveProfile: (data: Partial<CollegeProfileData>) => Promise<void>;
}) {
  const initial =
    (profile.accreditations || []).map((a) => ({
      accreditationName: String(a.accreditationName || ''),
      gradeOrScore: String(a.gradeOrScore || ''),
      certificateNumber: String(a.certificateNumber || ''),
      validTill: a.validTill ? String(a.validTill).slice(0, 10) : '',
      certificateUrl: a.certificateUrl ? String(a.certificateUrl) : '',
    })) || [];
  const [rows, setRows] = useState(
    initial.length
      ? initial
      : [{ accreditationName: 'NAAC', gradeOrScore: '', certificateNumber: '', validTill: '', certificateUrl: '' }]
  );
  return (
    <section className="space-y-4">
      {rows.map((row, index) => (
        <div key={index} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            {(['accreditationName', 'gradeOrScore', 'certificateNumber', 'validTill'] as const).map((key) => (
              <label key={key} className="block space-y-1">
                <span className={form.label}>{key}</span>
                <input
                  type={key === 'validTill' ? 'date' : 'text'}
                  className={form.input}
                  value={row[key]}
                  onChange={(e) => {
                    const next = [...rows];
                    next[index] = { ...row, [key]: e.target.value };
                    setRows(next);
                  }}
                />
              </label>
            ))}
          </div>
          <button type="button" className="mt-2 text-xs text-red-600" onClick={() => setRows(rows.filter((_, i) => i !== index))}>
            Remove
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <button type="button" className={button.secondary} onClick={() => setRows([...rows, { accreditationName: '', gradeOrScore: '', certificateNumber: '', validTill: '', certificateUrl: '' }])}>
          Add accreditation
        </button>
        <button
          type="button"
          disabled={saving}
          className={button.primary}
          onClick={() => void saveProfile({ accreditations: rows.filter((r) => r.accreditationName.trim()) })}
        >
          {saving ? 'Saving…' : 'Save accreditations'}
        </button>
      </div>
      {profile.rating != null && (
        <p className="text-sm text-slate-600">
          Current calculated rating: <strong>{Number(profile.rating).toFixed(2)}</strong> / 5
        </p>
      )}
    </section>
  );
}

function GalleryEditor({
  profile,
  onChanged,
}: {
  profile: CollegeProfileData;
  onChanged: () => Promise<void>;
}) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [gallery, setGallery] = useState(profile.gallery || []);

  useEffect(() => {
    setGallery(profile.gallery || []);
  }, [profile.gallery]);

  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      await createCollegeGalleryImage({ imageTitle: file.name }, file);
      const res = await getCollegeProfile();
      setGallery(res.data.data.gallery || []);
      await onChanged();
      showToast('Gallery image uploaded', 'success');
    } catch {
      showToast('Unable to upload gallery image', 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      await deleteCollegeGalleryImage(id);
      const res = await getCollegeProfile();
      setGallery(res.data.data.gallery || []);
      await onChanged();
      showToast('Gallery image removed', 'success');
    } catch {
      showToast('Unable to remove gallery image', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4">
      <input type="file" accept="image/*" disabled={busy} onChange={(e) => void upload(e.target.files?.[0])} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {gallery.map((image) => (
          <div key={String(image.id)} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <img src={String(image.imageUrl)} alt={String(image.imageTitle || 'Campus')} className="h-40 w-full object-cover" />
            <div className="flex items-center justify-between p-2 text-sm">
              <span className="truncate text-slate-700">{String(image.imageTitle || 'Image')}</span>
              <button type="button" className="text-red-600" onClick={() => void remove(String(image.id))}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {!gallery.length && <EmptyState title="No gallery images yet" />}
    </section>
  );
}

function CoursesPage({ path, profile }: Parameters<typeof renderPage>[0]) {
  const { showToast } = useToast();
  const [courses, setCourses] = useState(profile?.courses || []);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    courseName: '',
    degree: '',
    branchName: '',
    duration: '4',
    intake: '',
    availableSeats: '',
    eligibility: '',
    description: '',
    tuitionFee: '',
    hostelFee: '',
    transportFee: '',
    examFee: '',
    miscellaneousFee: '',
    scholarshipInfo: '',
  });

  useEffect(() => {
    setCourses(profile?.courses || []);
  }, [profile?.courses]);

  const refresh = async () => {
    const res = await getCollegeProfile();
    setCourses(res.data.data.courses || []);
  };

  const saveCourse = async () => {
    if (!draft.courseName.trim()) {
      showToast('Course name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      await createCollegeCourse({
        courseName: draft.courseName,
        degree: draft.degree,
        branchName: draft.branchName,
        duration: Number(draft.duration) || 4,
        intake: Number(draft.intake) || null,
        availableSeats: Number(draft.availableSeats) || null,
        totalSeats: Number(draft.intake) || Number(draft.availableSeats) || null,
        eligibility: draft.eligibility,
        description: draft.description,
        fees: {
          tuitionFee: Number(draft.tuitionFee) || null,
          hostelFee: Number(draft.hostelFee) || null,
          transportFee: Number(draft.transportFee) || null,
          examFee: Number(draft.examFee) || null,
          miscellaneousFee: Number(draft.miscellaneousFee) || null,
          scholarshipInfo: draft.scholarshipInfo,
        },
      });
      await refresh();
      showToast('Course created', 'success');
      setDraft({
        courseName: '',
        degree: '',
        branchName: '',
        duration: '4',
        intake: '',
        availableSeats: '',
        eligibility: '',
        description: '',
        tuitionFee: '',
        hostelFee: '',
        transportFee: '',
        examFee: '',
        miscellaneousFee: '',
        scholarshipInfo: '',
      });
    } catch {
      showToast('Unable to create course', 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeCourse = async (id: string) => {
    try {
      await deleteCollegeCourse(id);
      await refresh();
      showToast('Course deleted', 'success');
    } catch {
      showToast('Unable to delete course', 'error');
    }
  };

  if (path.endsWith('/add')) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(draft).map(([key, value]) => (
            <label key={key} className="block space-y-1">
              <span className={form.label}>{key}</span>
              <input className={form.input} value={value} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
            </label>
          ))}
        </div>
        <button type="button" disabled={saving} className={`${button.primary} mt-4`} onClick={() => void saveCourse()}>
          {saving ? 'Saving…' : 'Add course'}
        </button>
      </section>
    );
  }

  const focus = path.endsWith('/fees') || path.endsWith('/intake-fees')
    ? ['Course', 'Seats', 'Annual Fee', 'Total Fee']
    : path.endsWith('/eligibility')
      ? ['Course', 'Eligibility']
      : path.endsWith('/seats')
        ? ['Course', 'Seat Availability']
        : ['Course', 'Branch', 'Degree', 'Duration', 'Actions'];

  return (
    <div className="space-y-3">
      <CourseTable courses={courses} columns={focus} onDelete={removeCourse} />
    </div>
  );
}

function NoticesPage({ path }: Parameters<typeof renderPage>[0]) {
  const { showToast } = useToast();
  const { refreshNotifications } = useCollegeNotifications();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [notices, setNotices] = useState<Array<Record<string, unknown>>>([]);

  const load = async () => {
    try {
      const res = await listCollegeNotices();
      setNotices(res.data.data || []);
    } catch {
      showToast('Unable to load notices', 'error');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (path.endsWith('/create')) {
    const publishNotice = async () => {
      if (!title.trim()) {
        showToast('Enter a notice title', 'error');
        return;
      }
      setPublishing(true);
      try {
        await createCollegeNotice({ title: title.trim(), body, status: 'published' });
        setTitle('');
        setBody('');
        showToast('Notice published', 'success');
        await refreshNotifications();
        await load();
      } catch {
        showToast('Unable to publish notice', 'error');
      } finally {
        setPublishing(false);
      }
    };

    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4">
          <input className={form.input} placeholder="Notice title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <textarea className={form.input} rows={6} placeholder="Notice body" value={body} onChange={(event) => setBody(event.target.value)} />
          <button type="button" onClick={() => void publishNotice()} disabled={publishing} className={`${button.primary} w-fit`}>
            {publishing ? 'Publishing…' : 'Publish notice'}
          </button>
        </div>
      </section>
    );
  }

  const filtered = path.endsWith('/drafts')
    ? notices.filter((n) => String(n.status).toLowerCase() === 'draft')
    : path.endsWith('/published')
      ? notices.filter((n) => String(n.status).toLowerCase() === 'published')
      : notices;

  if (!filtered.length) return <EmptyState title="No notices to show" />;

  return (
    <div className="space-y-3">
      {filtered.map((notice) => (
        <article key={String(notice.id)} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-950">{String(notice.title)}</h3>
              <p className="mt-1 text-sm text-slate-600">{String(notice.body || '')}</p>
              <p className="mt-2 text-xs uppercase text-slate-400">{String(notice.status)}</p>
            </div>
            <div className="flex gap-2">
              {String(notice.status) !== 'published' && (
                <button
                  type="button"
                  className="text-xs text-blue-600"
                  onClick={() =>
                    void updateCollegeNotice(String(notice.id), { ...notice, status: 'published' }).then(async () => {
                      await refreshNotifications();
                      await load();
                    })
                  }
                >
                  Publish
                </button>
              )}
              <button
                type="button"
                className="text-xs text-red-600"
                onClick={() =>
                  void deleteCollegeNotice(String(notice.id)).then(async () => {
                    await load();
                    showToast('Notice deleted', 'success');
                  })
                }
              >
                Delete
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
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
  if (path.endsWith('/export')) return <ExportPanel label="Interested students" rows={students} />;
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

function ReportsPage({ path, dashboard, profile, students }: Parameters<typeof renderPage>[0]) {
  if (path.endsWith('/export')) return <ExportPanel label="Reports" rows={students} />;
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

function CourseTable({
  courses,
  columns,
  onDelete,
}: {
  courses: Array<Record<string, unknown>>;
  columns: string[];
  onDelete?: (id: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className={table.head}>
          <tr>{columns.map((column) => <th key={column} className="p-4">{column}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {courses.map((course, index) => (
            <tr key={String(course.id || course.CollegeCourseID || index)} className={table.row}>
              {columns.map((column) => (
                <td key={column} className="p-4 text-slate-700">
                  {column === 'Actions' && onDelete ? (
                    <button type="button" className="text-red-600 hover:underline" onClick={() => onDelete(String(course.id))}>
                      Delete
                    </button>
                  ) : (
                    courseValue(course, column)
                  )}
                </td>
              ))}
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
  const fees = course.fees && typeof course.fees === 'object' ? (course.fees as Record<string, unknown>) : {};
  const lookup: Record<string, unknown> = {
    Course: course.courseName || course.CourseName || course.name || '-',
    Branch: course.branchName || course.BranchName || 'General',
    Degree: course.degree || course.degreeType || '-',
    Department: course.branchName || course.BranchName || 'General',
    Duration: course.duration || course.DurationYears || '-',
    Status: course.isActive === false ? 'Inactive' : 'Active',
    Seats: course.availableSeats || course.totalSeats || course.seats || course.TotalSeats || '-',
    'Seat Availability': course.availableSeats || course.totalSeats || course.seats || course.TotalSeats || '-',
    'Annual Fee': fees.tuitionFee ?? fees.annualFee ?? course.annualFee ?? course.AnnualFee ?? '-',
    'Total Fee': fees.totalFee ?? '-',
    Eligibility: course.eligibility || course.Eligibility || course.EligibilityCriteria || '-',
    Actions: '',
  };
  return String(lookup[column] ?? '-');
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

const EXPORT_COLUMNS = [
  { key: 'name', header: 'Student' },
  { key: 'email', header: 'Email' },
  { key: 'mobile', header: 'Mobile' },
  { key: 'courseName', header: 'Course' },
  { key: 'branchName', header: 'Branch' },
  { key: 'status', header: 'Status' },
  { key: 'appliedDate', header: 'Applied' },
] as const;

function exportRows(rows: Array<Record<string, unknown>>) {
  return rows.map((row) =>
    Object.fromEntries(
      EXPORT_COLUMNS.map(({ key, header }) => [
        header,
        key === 'appliedDate' ? formatDate(String(row[key] || '')) : String(row[key] ?? '-'),
      ])
    )
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function ExportPanel({ label, rows }: { label: string; rows: Array<Record<string, unknown>> }) {
  const { showToast } = useToast();
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  const stamp = () => new Date().toISOString().slice(0, 10);
  const safeLabel = label.toLowerCase().replace(/\s+/g, '-');

  const exportPdf = () => {
    if (!rows.length) {
      showToast('No records available to export', 'error');
      return;
    }
    setExporting('pdf');
    try {
      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(14);
      doc.text(label, 14, 16);
      doc.setFontSize(10);
      doc.text(`Exported on ${new Date().toLocaleString('en-IN')}`, 14, 24);
      autoTable(doc, {
        startY: 30,
        head: [EXPORT_COLUMNS.map((column) => column.header)],
        body: rows.map((row) =>
          EXPORT_COLUMNS.map(({ key }) =>
            key === 'appliedDate' ? formatDate(String(row[key] || '')) : String(row[key] ?? '-')
          )
        ),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235] },
      });
      doc.save(`${safeLabel}-${stamp()}.pdf`);
      showToast('PDF exported successfully', 'success');
    } catch {
      showToast('Unable to export PDF', 'error');
    } finally {
      setExporting(null);
    }
  };

  const exportExcel = () => {
    if (!rows.length) {
      showToast('No records available to export', 'error');
      return;
    }
    setExporting('excel');
    try {
      const worksheet = XLSX.utils.json_to_sheet(exportRows(rows));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, label.slice(0, 31) || 'Export');
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      downloadBlob(
        new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        `${safeLabel}-${stamp()}.xlsx`
      );
      showToast('Excel exported successfully', 'success');
    } catch {
      showToast('Unable to export Excel', 'error');
    } finally {
      setExporting(null);
    }
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-600">{rows.length} {label.toLowerCase()} records are ready for export.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className={button.secondary} disabled={!!exporting} onClick={exportPdf}>
          {exporting === 'pdf' ? 'Exporting…' : 'Export PDF'}
        </button>
        <button type="button" className={button.primary} disabled={!!exporting} onClick={exportExcel}>
          {exporting === 'excel' ? 'Exporting…' : 'Export Excel'}
        </button>
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
