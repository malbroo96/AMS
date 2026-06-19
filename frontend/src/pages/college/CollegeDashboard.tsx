import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import {
  deleteCollegeLogo,
  getCollegeAssets,
  getCollegeDashboard,
  updateCollegeProfile,
  uploadCollegeBanner,
  uploadCollegeLogo,
  type CollegeAssets,
} from '../../api/ams';
import { updateApplicationStatus } from '../../api/applications';
import { button, form, shell, table } from '../../components/ui/designTokens';
import { useToast } from '../../context/ToastContext';
import type { College } from '../../types';

export function CollegeDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [data, setData] = useState<{ college?: College; stats?: Record<string, number>; students?: Array<Record<string, unknown>> }>({});
  const [assets, setAssets] = useState<CollegeAssets | null>(null);
  const [uploading, setUploading] = useState<'logo' | 'banner' | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ collegeName: '', email: '' });
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  const handleRequestAccess = async (applicationId: string) => {
    try {
      await updateApplicationStatus(applicationId, { status: 'under_review', remarks: 'College requested profile access' });
      showToast('Access request submitted. Awaiting admin approval.', 'success');
      getCollegeDashboard()
        .then((res) => setData(res.data.data))
        .catch(() => showToast('Unable to reload college dashboard', 'error'));
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Failed to request access', 'error');
    }
  };

  useEffect(() => {
    getCollegeDashboard()
      .then((res) => setData(res.data.data))
      .catch(() => showToast('Unable to load college dashboard', 'error'));
  }, [showToast]);

  useEffect(() => {
    if (!data.college) return;
    setProfileForm({
      collegeName: data.college.collegeName || '',
      email: data.college.email || '',
    });
  }, [data.college]);

  useEffect(() => {
    if (!data.college?.id) return;
    getCollegeAssets(data.college.id)
      .then((res) => setAssets(res.data.data))
      .catch(() => showToast('Unable to load college assets', 'error'));
  }, [data.college?.id, showToast]);

  const validateImage = (file: File) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Only PNG, JPEG, and WebP images are allowed', 'error');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must not exceed 5 MB', 'error');
      return false;
    }
    return true;
  };

  const refreshAssets = async () => {
    if (!data.college?.id) return;
    const res = await getCollegeAssets(data.college.id);
    setAssets(res.data.data);
  };

  const handleUpload = async (type: 'logo' | 'banner', file?: File) => {
    if (!file || !validateImage(file)) return;
    setUploading(type);
    try {
      if (type === 'logo') {
        await uploadCollegeLogo(file);
      } else {
        await uploadCollegeBanner(file);
      }
      await refreshAssets();
      showToast(`${type === 'logo' ? 'Logo' : 'Banner'} uploaded successfully`, 'success');
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        `Unable to upload ${type}`;
      showToast(message, 'error');
    } finally {
      setUploading(null);
    }
  };

  const handleDeleteLogo = async () => {
    if (!data.college?.id) return;
    setUploading('logo');
    try {
      await deleteCollegeLogo(data.college.id);
      await refreshAssets();
      showToast('Logo deleted successfully', 'success');
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Unable to delete logo';
      showToast(message, 'error');
    } finally {
      setUploading(null);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileForm.collegeName.trim() || !profileForm.email.trim()) {
      showToast('College name and email are required', 'error');
      return;
    }
    setSavingProfile(true);
    try {
      const res = await updateCollegeProfile({
        collegeName: profileForm.collegeName.trim(),
        email: profileForm.email.trim(),
      });
      setData((current) => ({
        ...current,
        college: current.college
          ? {
              ...current.college,
              collegeName: res.data.data.collegeName,
              email: res.data.data.email,
              status: (res.data.data.status as College['status']) || current.college.status,
            }
          : ({
              id: res.data.data.id,
              collegeName: res.data.data.collegeName,
              email: res.data.data.email,
              status: res.data.data.status as College['status'],
              schoolName: res.data.data.collegeName,
              city: res.data.data.location?.city || '',
            } satisfies College),
      }));
      setEditMode(false);
      showToast('College profile updated successfully', 'success');
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Unable to update college profile';
      showToast(message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="grid gap-6 xl:grid-cols-3">
        
        {/* Left Column (Content) */}
        <div className="space-y-6 xl:col-span-2">
          
          {/* Main Profile Header */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            {/* Banner */}
            <div 
              className="h-32 bg-slate-200 sm:h-40" 
              style={{
                backgroundImage: assets?.bannerUrl ? `url(${assets.bannerUrl})` : 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            ></div>
            
            {/* Details */}
            <div className="relative px-6 pb-6 pt-16 sm:px-8 sm:pb-8 sm:pt-20">
              {/* Logo Wrapper */}
              <div className="absolute -top-12 left-6 h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-white shadow-sm sm:-top-16 sm:left-8 sm:h-32 sm:w-32">
                {assets?.logoUrl ? (
                  <img src={assets.logoUrl} alt="College Logo" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-100 text-2xl font-bold text-slate-400 sm:text-4xl">
                    {data.college?.collegeName?.[0]?.toUpperCase() || 'C'}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                      {data.college?.collegeName || 'College Name'}
                    </h1>
                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      {data.college?.status || 'Pending Verification'}
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-500">
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {data.college?.city || 'Location not set'}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{data.college?.email}</p>
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditMode((current) => !current)}
                    className={button.secondary}
                  >
                    {editMode ? 'Cancel Edit' : 'Edit Profile'}
                  </button>
                </div>
              </div>

              {editMode && (
                <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className={form.label}>College Name</span>
                      <input
                        value={profileForm.collegeName}
                        onChange={(event) => setProfileForm({ ...profileForm, collegeName: event.target.value })}
                        className={form.input}
                      />
                    </label>
                    <label className="block">
                      <span className={form.label}>Email Address</span>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })}
                        className={form.input}
                      />
                    </label>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className={button.primary}
                    >
                      {savingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Statistics Grid */}
          <section className="grid gap-4 sm:grid-cols-3">
            <StatCard 
              label="Interested Students" 
              value={data.stats?.interestedStudents || 0} 
              icon={<svg className="size-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
              bgClass="bg-blue-50 text-blue-600"
            />
            <StatCard 
              label="Visible Profiles" 
              value={data.stats?.grantedProfiles || 0} 
              icon={<svg className="size-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
              bgClass="bg-emerald-50 text-emerald-600"
            />
            <StatCard 
              label="Hidden Profiles" 
              value={data.stats?.hiddenProfiles || 0} 
              icon={<svg className="size-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>}
              bgClass="bg-slate-100 text-slate-600"
            />
          </section>

          {/* Applications Table */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Recent Applications</h2>
                <p className="mt-1 text-sm text-slate-500">Manage student access requests</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap text-left text-sm">
                <thead className={table.head}>
                  <tr>
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Course</th>
                    <th className="p-4">Applied Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data.students || []).map((student: any) => {
                    const statusLower = String(student.status || '').toLowerCase().trim();
                    const isSubmitted = statusLower === 'submitted' || statusLower === 'interested';
                    const isUnderReview = statusLower === 'under_review' || statusLower === 'under review';
                    const isApproved = statusLower === 'approved';
                    const isRejected = statusLower === 'rejected';

                    return (
                      <tr key={String(student.applicationId)} className={`${table.row} transition-colors hover:bg-slate-50`}>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">
                              {student.name ? student.name[0].toUpperCase() : '?'}
                            </div>
                            <span className="font-semibold text-slate-900">{student.name || 'Hidden Profile'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-medium text-slate-900">{String(student.courseName || '-')}</p>
                          <p className="text-xs text-slate-500">{String(student.branchName || '-')}</p>
                        </td>
                        <td className="p-4 text-slate-500">{formatDate(student.appliedDate)}</td>
                        <td className="p-4">
                          <StatusBadge status={student.status} />
                        </td>
                        <td className="p-4 text-right">
                          {isSubmitted && (
                            <button
                              type="button"
                              onClick={() => handleRequestAccess(student.applicationId)}
                              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                            >
                              Request Access
                            </button>
                          )}
                          {isUnderReview && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                              Awaiting Approval
                            </span>
                          )}
                          {isApproved && (
                            <button
                              type="button"
                              onClick={() => setSelectedStudent(student)}
                              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-blue-700"
                            >
                              View Details
                            </button>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800">
                              Rejected
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {(!data.students || data.students.length === 0) && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        No applications found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </div>

        {/* Right Panel (Sticky Layout) */}
        <div className="space-y-6 xl:col-span-1">
          <div className="sticky top-6 space-y-6">
            
            {/* Quick Actions / Asset Management */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <h3 className="mb-4 font-bold text-slate-900">College Assets</h3>
              <div className="space-y-5">
                <AssetUploadCard
                  title="College Logo"
                  description="Used on your profile and listings."
                  imageUrl={assets?.logoUrl}
                  buttonLabel={assets?.logoUrl ? 'Replace Logo' : 'Upload Logo'}
                  isUploading={uploading === 'logo'}
                  onUpload={(file) => handleUpload('logo', file)}
                  onDelete={assets?.logoUrl ? handleDeleteLogo : undefined}
                />
                <hr className="border-slate-100" />
                <AssetUploadCard
                  title="Cover Banner"
                  description="A wide banner for your profile page."
                  imageUrl={assets?.bannerUrl}
                  buttonLabel={assets?.bannerUrl ? 'Replace Banner' : 'Upload Banner'}
                  isUploading={uploading === 'banner'}
                  onUpload={(file) => handleUpload('banner', file)}
                />
              </div>
              {assets?.updatedOn && (
                <p className="mt-5 text-center text-xs font-medium text-slate-400">
                  Last updated: {new Date(assets.updatedOn).toLocaleString()}
                </p>
              )}
            </div>

            {/* Notifications Overview Mock */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <h3 className="mb-4 font-bold text-slate-900">Notifications</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{data.stats?.interestedStudents || 0} Pending Applications</p>
                    <p className="text-xs text-slate-500">Requires your review</p>
                  </div>
                </div>
                {(!assets?.logoUrl || !assets?.bannerUrl) && (
                  <div className="flex gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Profile Incomplete</p>
                      <p className="text-xs text-slate-500">Please upload logo & banner</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Selected Student Modal (Kept Existing Logic/Styling with minor tweaks) */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Application Details</p>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">{selectedStudent.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-400 hover:text-slate-600 transition text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Contact Details</h4>
                <div className="grid gap-4 sm:grid-cols-3 text-sm">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Email Address</p>
                    <p className="mt-1 font-semibold text-slate-900 truncate">{selectedStudent.email || '-'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Mobile Number</p>
                    <p className="mt-1 font-semibold text-slate-900">{selectedStudent.mobile || '-'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Gender / DOB</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {selectedStudent.gender || '-'} / {selectedStudent.dateOfBirth ? formatDate(selectedStudent.dateOfBirth) : '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Current Address</h4>
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-sm">
                  <p className="font-semibold text-slate-900">{selectedStudent.address || '-'}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Academic details</h4>
                <div className="grid gap-4 sm:grid-cols-3 text-sm">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Qualification</p>
                    <p className="mt-1 font-semibold text-slate-900">{selectedStudent.education || '-'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Board</p>
                    <p className="mt-1 font-semibold text-slate-900">{selectedStudent.board || '-'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Percentage (10th/12th)</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {selectedStudent.percentage != null ? `${selectedStudent.percentage}%` : '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Student Documents</h4>
                {!selectedStudent.documents || selectedStudent.documents.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No documents uploaded.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedStudent.documents.map((doc: any, index: number) => (
                      <div key={index} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 capitalize">{doc.documentType.replace('_', ' ')}</p>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            {doc.isVerified ? '✓ Verified' : 'Awaiting verification'}
                          </span>
                        </div>
                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:border-blue-200 transition shadow-sm"
                          >
                            View
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end rounded-b-2xl">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function StatCard({ label, value, icon, bgClass }: { label: string; value: number; icon: React.ReactNode; bgClass: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
      <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${bgClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm font-medium text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function AssetUploadCard({
  title,
  description,
  imageUrl,
  buttonLabel,
  isUploading,
  onUpload,
  onDelete,
}: {
  title: string;
  description: string;
  imageUrl?: string | null;
  buttonLabel: string;
  isUploading: boolean;
  onUpload: (file?: File) => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-inner">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <span className="text-[10px] font-semibold text-slate-400">No image</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
        <p className="mt-0.5 text-xs text-slate-500 leading-snug">{description}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center text-xs font-semibold text-blue-600 hover:text-blue-800 transition">
            {isUploading ? 'Uploading...' : buttonLabel}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={isUploading}
              className="sr-only"
              onChange={(event) => onUpload(event.target.files?.[0])}
            />
          </label>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={isUploading}
              className="text-xs font-semibold text-red-500 hover:text-red-700 transition"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

function StatusBadge({ status }: { status: string }) {
  const s = String(status).trim().toLowerCase();
  if (s === 'submitted' || s === 'interested') {
    return (
      <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
        Submitted
      </span>
    );
  }
  if (s === 'under review' || s === 'under_review') {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 animate-pulse">
        Under Review
      </span>
    );
  }
  if (s === 'approved') {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        Approved
      </span>
    );
  }
  if (s === 'rejected') {
    return (
      <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">
      {status}
    </span>
  );
}
