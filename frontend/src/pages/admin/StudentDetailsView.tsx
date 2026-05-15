import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getApplication, updateApplicationStatus } from '../../api/applications';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import type { Application, ApplicationStatus } from '../../types';

export function StudentDetailsView() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ApplicationStatus>('pending');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    getApplication(id)
      .then((res) => {
        setApp(res.data.data);
        setStatus(res.data.data.status);
        setRemarks(res.data.data.remarks || '');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const res = await updateApplicationStatus(id, { status, remarks });
      setApp(res.data.data);
      showToast('Application status updated', 'success');
    } catch {
      showToast('Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <p className="flex justify-center py-20"><LoadingSpinner className="size-10" /></p>
      </DashboardLayout>
    );
  }

  if (!app) {
    return (
      <DashboardLayout>
        <p className="text-slate-500">Application not found.</p>
        <Link to="/dashboard/admin/applications" className="mt-4 text-blue-600 hover:underline">Back</Link>
      </DashboardLayout>
    );
  }

  const student = app.student;

  return (
    <DashboardLayout>
      <Link to="/dashboard/admin/applications" className="text-sm text-blue-600 hover:underline">← Back to applications</Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Student Details</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          <h2 className="font-semibold text-slate-800">Personal Information</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Name" value={student?.user?.name} />
            <Row label="Email" value={student?.user?.email} />
            <Row label="Phone" value={student?.user?.phone} />
            <Row label="Parent" value={student?.parentName} />
            <Row label="Address" value={student?.address} />
            <Row label="Gender" value={student?.gender} />
          </dl>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          <h2 className="font-semibold text-slate-800">Application</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="School" value={app.school?.schoolName} />
            <Row label="Course" value={app.course?.courseName} />
            <Row label="Submitted" value={new Date(app.submittedAt).toLocaleString()} />
            <dt className="text-slate-500">Status</dt>
            <dd><StatusBadge status={app.status} /></dd>
          </dl>
          {app.documents && app.documents.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm">
              {app.documents.map((d) => (
                <li key={d.id}>
                  <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    {d.documentType}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <section className="mt-6 max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
        <h2 className="font-semibold text-slate-800">Update Status</h2>
        <div className="mt-4 space-y-3">
          <select value={status} onChange={(e) => setStatus(e.target.value as ApplicationStatus)} className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm">
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Remarks" rows={3} className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm" />
          <button type="button" onClick={handleUpdate} disabled={saving} className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-60">
            {saving ? 'Saving...' : 'Save Status'}
          </button>
        </div>
      </section>
    </DashboardLayout>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value || '—'}</dd>
    </>
  );
}
