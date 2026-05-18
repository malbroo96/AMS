import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { getColleges, getStudentDashboard, markCollegeInterest } from '../../api/ams';
import type { College, Interest } from '../../types';
import { useToast } from '../../context/ToastContext';

export function StudentDashboard() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [colleges, setColleges] = useState<College[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const appliedCollegeIds = useMemo(() => new Set(interests.map((item) => item.collegeId)), [interests]);

  const load = async () => {
    setLoading(true);
    const [collegeRes, dashboardRes] = await Promise.all([getColleges({ search }), getStudentDashboard()]);
    setColleges(collegeRes.data.data);
    setInterests(dashboardRes.data.data.interests);
    setStats(dashboardRes.data.data.stats);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => {
      showToast('Unable to load student dashboard', 'error');
      setLoading(false);
    });
  }, []);

  const markInterest = async (collegeId: string) => {
    try {
      await markCollegeInterest(collegeId);
      showToast('Interest marked successfully', 'success');
      await load();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to mark interest';
      showToast(msg, 'error');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-lg bg-blue-700 p-6 text-white shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-100">Student Portal</p>
          <h1 className="mt-1 text-2xl font-bold">Admission Dashboard</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Stat label="Registered Colleges" value={stats.registeredColleges || 0} />
          <Stat label="Applied Colleges" value={stats.appliedColleges || 0} />
          <Stat label="Approved Profile Access" value={stats.approvedAccess || 0} />
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-slate-900">Registered Colleges</h2>
            <div className="flex gap-2">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search colleges"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <button onClick={load} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Search</button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {loading ? <p className="text-sm text-slate-500">Loading...</p> : colleges.map((college) => (
              <article key={college.id} className="rounded-lg border border-blue-100 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900">{college.collegeName}</h3>
                    <p className="text-sm text-slate-500">{college.email}</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{college.status}</span>
                </div>
                <button
                  disabled={appliedCollegeIds.has(college.id)}
                  onClick={() => markInterest(college.id)}
                  className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
                >
                  {appliedCollegeIds.has(college.id) ? 'Interest Marked' : 'Mark Interest'}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Applied Colleges</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-blue-50 text-blue-900">
                <tr><th className="p-3">College</th><th className="p-3">Status</th><th className="p-3">Profile Access</th></tr>
              </thead>
              <tbody>
                {interests.map((interest) => (
                  <tr key={interest.id} className="border-t">
                    <td className="p-3 font-medium">{interest.college?.collegeName}</td>
                    <td className="p-3">{interest.status}</td>
                    <td className="p-3">{interest.approvedByAdmin ? 'Granted' : 'Hidden until admin approval'}</td>
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
    <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-blue-700">{value}</p>
    </div>
  );
}
