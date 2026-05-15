import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApplications } from '../../api/applications';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import type { Application } from '../../types';

export function StudentDashboard() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getApplications({ limit: 5 })
      .then((res) => setApps(res.data.data.applications))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: apps.length,
    pending: apps.filter((a) => a.status === 'pending').length,
    approved: apps.filter((a) => a.status === 'approved').length,
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-slate-900">Student Dashboard</h1>
      <p className="mt-1 text-slate-500">Track your admission applications</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Applications" value={stats.total} />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="Approved" value={stats.approved} />
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/dashboard/student/apply" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700">
          Apply for Admission
        </Link>
        <Link to="/dashboard/student/applications" className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-md hover:bg-slate-50">
          View All Applications
        </Link>
      </div>
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
        <h2 className="text-lg font-semibold text-slate-800">Recent Applications</h2>
        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : apps.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No applications yet. Start your admission process.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {apps.map((app) => (
              <li key={app.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium text-slate-800">{app.school?.schoolName}</p>
                  <p className="text-sm text-slate-500">{app.course?.courseName}</p>
                </div>
                <StatusBadge status={app.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-blue-600">{value}</p>
    </div>
  );
}
