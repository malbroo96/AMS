import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { getCollegeDashboard } from '../../api/ams';
import { useToast } from '../../context/ToastContext';

export function CollegeDashboard() {
  const { showToast } = useToast();
  const [data, setData] = useState<{ stats?: Record<string, number>; students?: Array<Record<string, unknown>> }>({});

  useEffect(() => {
    getCollegeDashboard()
      .then((res) => setData(res.data.data))
      .catch(() => showToast('Unable to load college dashboard', 'error'));
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-lg bg-green-700 p-6 text-white shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-100">College Portal</p>
          <h1 className="mt-1 text-2xl font-bold">Interested Students</h1>
        </div>
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
