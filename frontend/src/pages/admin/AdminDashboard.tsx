import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { getAdminDashboard } from '../../api/ams';
import { button, shell } from '../../components/ui/designTokens';

export function AdminDashboard() {
  const [data, setData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    getAdminDashboard().then((res) => setData(res.data.data));
  }, []);

  const activities = (data.recentActivities as Array<{ id: string; message: string; createdAt: string }> | undefined) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className={shell.pageHero}>
          <p className={shell.eyebrow}>Admin Portal</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Admission Management Control Center</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Stat label="Total Students" value={Number(data.totalStudents || 0)} />
          <Stat label="Total Colleges" value={Number(data.totalColleges || 0)} />
          <Stat label="Interested Students" value={Number(data.interestedStudentsCount || 0)} />
          <Stat label="Permission Requests" value={Number(data.permissionRequests || 0)} />
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/dashboard/admin/colleges" className={button.primary}>Create College</Link>
          <Link to="/dashboard/admin/students" className={button.secondary}>View Students</Link>
          <Link to="/dashboard/admin/permissions" className={button.secondary}>Manage Permissions</Link>
        </div>
        <section className={`p-5 ${shell.card}`}>
          <h2 className="text-lg font-bold text-slate-900">Recent Activities</h2>
          <div className="mt-4 space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="font-medium text-slate-800">{activity.message}</p>
                <p className="text-xs text-slate-500">{new Date(activity.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={`p-5 ${shell.card}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-blue-700">{value}</p>
    </div>
  );
}
