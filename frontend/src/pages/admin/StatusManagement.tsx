import { useEffect, useState } from 'react';
import { getApplications, updateApplicationStatus } from '../../api/applications';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import type { Application, ApplicationStatus } from '../../types';

export function StatusManagement() {
  const { showToast } = useToast();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getApplications({ limit: 50 })
      .then((res) => setApps(res.data.data.applications))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatus = async (id: string, status: ApplicationStatus) => {
    try {
      await updateApplicationStatus(id, { status });
      showToast(`Marked as ${status}`, 'success');
      load();
    } catch {
      showToast('Failed to update', 'error');
    }
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-slate-900">Status Management</h1>
      <p className="mt-1 text-slate-500">Quick approve or reject applications</p>
      {loading ? (
        <p className="flex justify-center py-12"><LoadingSpinner className="size-10" /></p>
      ) : (
        <ul className="mt-6 space-y-4">
          {apps.map((app) => (
            <li key={app.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-md">
              <div>
                <p className="font-semibold text-slate-800">{app.student?.user?.name}</p>
                <p className="text-sm text-slate-500">{app.course?.courseName}</p>
              </div>
              <StatusBadge status={app.status} />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => handleStatus(app.id, 'under_review')} className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-800">Review</button>
                <button type="button" onClick={() => handleStatus(app.id, 'approved')} className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-800">Approve</button>
                <button type="button" onClick={() => handleStatus(app.id, 'rejected')} className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-800">Reject</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardLayout>
  );
}
