import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import {
  deleteCollegeLogo,
  getCollegeAssets,
  getCollegeDashboard,
  uploadCollegeBanner,
  uploadCollegeLogo,
  type CollegeAssets,
} from '../../api/ams';
import { useToast } from '../../context/ToastContext';
import type { College } from '../../types';

export function CollegeDashboard() {
  const { showToast } = useToast();
  const [data, setData] = useState<{ college?: College; stats?: Record<string, number>; students?: Array<Record<string, unknown>> }>({});
  const [assets, setAssets] = useState<CollegeAssets | null>(null);
  const [uploading, setUploading] = useState<'logo' | 'banner' | null>(null);

  useEffect(() => {
    getCollegeDashboard()
      .then((res) => setData(res.data.data))
      .catch(() => showToast('Unable to load college dashboard', 'error'));
  }, []);

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-lg bg-green-700 p-6 text-white shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-100">College Portal</p>
          <h1 className="mt-1 text-2xl font-bold">Interested Students</h1>
        </div>

        <section className="rounded-lg border border-green-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">College Details</h2>
          <div className="mt-3 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
            <p><span className="font-semibold">College:</span> {String(data.college?.collegeName || '-')}</p>
            <p><span className="font-semibold">Email:</span> {String(data.college?.email || '-')}</p>
            <p><span className="font-semibold">Status:</span> {String(data.college?.status || '-')}</p>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-green-700">College assets</p>
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
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Student Requests</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-green-50 text-green-900">
                <tr>
                  <th className="p-3">Student ID</th><th className="p-3">Status</th><th className="p-3">Name</th><th className="p-3">Mobile</th><th className="p-3">Email</th><th className="p-3">Profile</th>
                </tr>
              </thead>
              <tbody>
                {(data.students || []).map((student) => (
                  <tr key={String(student.studentId)} className="border-t">
                    <td className="p-3 font-mono text-xs">{String(student.studentId)}</td>
                    <td className="p-3">{String(student.status)}</td>
                    <td className="p-3">{student.name ? String(student.name) : 'Hidden'}</td>
                    <td className="p-3">{student.mobile ? String(student.mobile) : 'Hidden'}</td>
                    <td className="p-3">{student.email ? String(student.email) : 'Hidden'}</td>
                    <td className="p-3">{student.fullProfile ? 'Full profile visible' : 'Awaiting admin grant'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-green-100 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-green-700">{value}</p>
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
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
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
              className="mt-2 block truncate text-sm font-semibold text-green-700 hover:text-green-800"
            >
              View uploaded image
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer items-center justify-center rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-800">
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
            className="rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
          >
            Delete logo
          </button>
        ) : null}
      </div>
    </div>
  );
}
