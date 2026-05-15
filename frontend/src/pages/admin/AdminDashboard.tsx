import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApplications } from '../../api/applications';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import type { Application } from '../../types';

export function AdminDashboard() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getApplications({ limit: 10 })
      .then((res) => setApps(res.data.data.applications))
      .finally(() => setLoading(false));
  }, []);

  const pending = apps.filter((a) => a.status === 'pending').length;
  const approved = apps.filter((a) => a.status === 'approved').length;

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-slate-900">School Admin Dashboard</h1>
      <p className="mt-1 text-slate-500">Manage student admission applications</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card label="Total Applications" value={apps.length} />
        <Card label="Pending Review" value={pending} />
        <Card label="Approved" value={approved} />
      </div>
      <div className="mt-6 flex gap-3">
        <Link to="/dashboard/admin/applications" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700">
          View Applications
        </Link>
        <Link to="/dashboard/admin/status" className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-md hover:bg-slate-50">
          Status Management
        </Link>
      </div>
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
        <h2 className="text-lg font-semibold">Recent Applications</h2>
        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {apps.map((app) => (
              <li key={app.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{app.student?.user?.name}</p>
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

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-blue-600">{value}</p>
    </div>
  );
}
