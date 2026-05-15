import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAnalytics } from '../../api/admin';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import type { Analytics } from '../../types';

export function SuperAdminDashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics()
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <p className="flex justify-center py-20"><LoadingSpinner className="size-10" /></p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-slate-900">Super Admin Dashboard</h1>
      <p className="mt-1 text-slate-500">System-wide admission portal overview</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Schools" value={data?.totalSchools ?? 0} />
        <Stat label="Students" value={data?.totalStudents ?? 0} />
        <Stat label="Applications" value={data?.totalApplications ?? 0} />
        <Stat label="School Admins" value={data?.schoolAdmins ?? 0} />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Pending" value={data?.pendingApplications ?? 0} color="text-yellow-600" />
        <Stat label="Approved" value={data?.approvedApplications ?? 0} color="text-green-600" />
        <Stat label="Rejected" value={data?.rejectedApplications ?? 0} color="text-red-600" />
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/dashboard/superadmin/schools" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700">Manage Schools</Link>
        <Link to="/dashboard/superadmin/admins" className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold shadow-md hover:bg-slate-50">Manage Admins</Link>
        <Link to="/dashboard/superadmin/analytics" className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold shadow-md hover:bg-slate-50">Analytics</Link>
      </div>
    </DashboardLayout>
  );
}

function Stat({ label, value, color = 'text-blue-600' }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
