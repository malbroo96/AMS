import { useEffect, useState } from 'react';
import { getAnalytics } from '../../api/admin';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import type { Analytics } from '../../types';

export function AnalyticsDashboard() {
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
      <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.applicationsByStatus?.map((item) => (
          <div key={item.status} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
            <p className="text-sm capitalize text-slate-500">{item.status.replace('_', ' ')}</p>
            <p className="mt-1 text-3xl font-bold text-blue-600">{item._count.status}</p>
          </div>
        ))}
      </div>
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
        <h2 className="text-lg font-semibold">Recent Applications</h2>
        <ul className="mt-4 divide-y divide-slate-100">
          {data?.recentApplications?.map((app) => (
            <li key={app.id} className="flex justify-between py-3 text-sm">
              <span>{app.student?.user?.name} — {app.school?.schoolName}</span>
              <span className="text-slate-500">{new Date(app.submittedAt).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      </section>
    </DashboardLayout>
  );
}
