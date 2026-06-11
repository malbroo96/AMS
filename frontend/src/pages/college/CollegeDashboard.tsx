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
import { button, shell, table } from '../../components/ui/designTokens';
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
      <div className="space-y-6">
        <div className="rounded-lg bg-green-700 p-6 text-white shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-green-100">College Portal</p>
              <h1 className="mt-1 text-2xl font-bold">Interested Students</h1>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard/college/profile')}
              className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-green-700 shadow-md transition hover:bg-green-50"
            >
              Manage College Profile
            </button>
          </div>
        </div>

        <section className="rounded-lg border border-green-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-slate-900">College Details</h2>
            <button
              type="button"
              onClick={() => setEditMode((current) => !current)}
              className="rounded-md border border-green-200 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-50"
            >
              {editMode ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
          <div className="mt-3 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
            {editMode ? (
              <>
                <label className="block">
                  <span className="font-semibold">College</span>
                  <input
                    value={profileForm.collegeName}
                    onChange={(event) => setProfileForm({ ...profileForm, collegeName: event.target.value })}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="font-semibold">Email</span>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })}
                    className={inputClass}
                  />
                </label>
              </>
            ) : (
              <>
                <p><span className="font-semibold">College:</span> {String(data.college?.collegeName || '-')}</p>
                <p><span className="font-semibold">Email:</span> {String(data.college?.email || '-')}</p>
              </>
            )}
            <p><span className="font-semibold">Status:</span> {String(data.college?.status || '-')}</p>
          </div>
          {editMode ? (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-800 disabled:opacity-60"
              >
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : null}
        </section>

        <section className={`p-5 ${shell.card}`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className={shell.eyebrow}>College assets</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">College images</h2>
            </div>
            <p className="text-sm text-slate-500">PNG, JPEG, WebP. Max 5 MB.</p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <AssetUploadCard
              title="College Logo"
              description="Displayed on college cards and admissions pages."
              imageUrl={assets?.logoUrl}
              buttonLabel={assets?.logoUrl ? 'Replace logo' : 'Upload logo'}
              isUploading={uploading === 'logo'}
              onUpload={(file) => handleUpload('logo', file)}
              onDelete={assets?.logoUrl ? handleDeleteLogo : undefined}
            />
            <AssetUploadCard
              title="College Banner"
              description="Used as the wide visual for college profile discovery."
              imageUrl={assets?.bannerUrl}
              buttonLabel={assets?.bannerUrl ? 'Replace banner' : 'Upload banner'}
              isUploading={uploading === 'banner'}
              onUpload={(file) => handleUpload('banner', file)}
            />
          </div>

          {assets?.updatedOn ? (
            <p className="mt-4 text-xs text-slate-500">Last updated: {new Date(assets.updatedOn).toLocaleString()}</p>
          ) : null}
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          <Stat label="Interested Students" value={data.stats?.interestedStudents || 0} />
          <Stat label="Visible Profiles" value={data.stats?.grantedProfiles || 0} />
          <Stat label="Hidden Profiles" value={data.stats?.hiddenProfiles || 0} />
        </div>
        <section className={`p-5 ${shell.card}`}>
          <h2 className="text-lg font-bold text-slate-900">Applications Received</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className={table.head}>
                <tr>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Course</th>
                  <th className="p-3">Branch</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Applied Date</th>
                  <th className="p-3 text-right">Access Action</th>
                </tr>
              </thead>
              <tbody>
                {(data.students || []).map((student: any) => {
                  const statusLower = String(student.status || '').toLowerCase().trim();
                  const isSubmitted = statusLower === 'submitted' || statusLower === 'interested';
                  const isUnderReview = statusLower === 'under_review' || statusLower === 'under review';
                  const isApproved = statusLower === 'approved';
                  const isRejected = statusLower === 'rejected';

                  return (
                    <tr key={String(student.applicationId)} className={table.row}>
                      <td className="p-3 font-semibold text-slate-900">{student.name || 'Hidden'}</td>
                      <td className="p-3">{String(student.courseName || '-')}</td>
                      <td className="p-3">{String(student.branchName || '-')}</td>
                      <td className="p-3">
                        <StatusBadge status={student.status} />
                      </td>
                      <td className="p-3 text-slate-500">{formatDate(student.appliedDate)}</td>
                      <td className="p-3 text-right">
                        {isSubmitted && (
                          <button
                            type="button"
                            onClick={() => handleRequestAccess(student.applicationId)}
                            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 shadow-sm"
                          >
                            Request Student Details Access
                          </button>
                        )}
                        {isUnderReview && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 border border-amber-200">
                            Awaiting Admin Approval
                          </span>
                        )}
                        {isApproved && (
                          <button
                            type="button"
                            onClick={() => setSelectedStudent(student)}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-700 shadow-sm"
                          >
                            View Details
                          </button>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800 border border-red-200">
                            Access Rejected
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

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

const inputClass = 'mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-green-600';

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={`p-5 ${shell.card}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-blue-700">{value}</p>
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
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex gap-4">
        <div className="flex h-24 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
          ) : (
            <span className="px-3 text-center text-xs font-semibold text-slate-400">No image</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
          {imageUrl ? (
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block truncate text-sm font-semibold text-blue-700 hover:text-blue-800"
            >
              View uploaded image
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <label className={`inline-flex cursor-pointer items-center justify-center ${button.primary}`}>
          {isUploading ? 'Uploading...' : buttonLabel}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={isUploading}
            className="sr-only"
            onChange={(event) => onUpload(event.target.files?.[0])}
          />
        </label>

        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={isUploading}
            className={button.danger}
          >
            Delete logo
          </button>
        ) : null}
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
      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
        Submitted
      </span>
    );
  }
  if (s === 'under review' || s === 'under_review') {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200 animate-pulse">
        Under Review
      </span>
    );
  }
  if (s === 'approved') {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
        Approved
      </span>
    );
  }
  if (s === 'rejected') {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 border border-red-200">
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700 border border-slate-200">
      {status}
    </span>
  );
}
