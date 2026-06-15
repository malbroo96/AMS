import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { getAdminInterests, setInterestPermission } from '../../api/ams';
import type { Interest } from '../../types';
import { shell, table } from '../../components/ui/designTokens';

export function AdminPermissions() {
  const [interests, setInterests] = useState<Interest[]>([]);
  const load = () => getAdminInterests().then((res) => setInterests(res.data.data));
  useEffect(() => { load(); }, []);

  const handleSetPermission = (id: string, approved: boolean) => {
    setInterestPermission(id, approved).then(load);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className={shell.pageHero}>
          <h1 className="text-2xl font-bold text-slate-900">Access Requests Management</h1>
        </div>
        <section className={`p-5 ${table.shell}`}>
          <table className="w-full text-left text-sm">
            <thead className={table.head}>
              <tr>
                <th className="p-3">Student</th>
                <th className="p-3">College</th>
                <th className="p-3">Status</th>
                <th className="p-3">Access State</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {interests.map((interest) => {
                const statusLower = String(interest.status || '').toLowerCase().trim();
                const isApproved = statusLower === 'approved';
                const isRejected = statusLower === 'rejected';

                return (
                  <tr key={interest.id} className={table.row}>
                    <td className="p-3 font-semibold text-slate-900">{interest.student?.name}</td>
                    <td className="p-3 font-medium text-slate-700">{interest.college?.collegeName}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                        isApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        isRejected ? 'bg-red-50 text-red-700 border-red-200' :
                        statusLower === 'under_review' || statusLower === 'under review' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {interest.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{interest.approvedByAdmin ? 'Granted' : 'Hidden'}</td>
                    <td className="p-3 text-right space-x-2">
                      {!isApproved && (
                        <button
                          onClick={() => handleSetPermission(interest.id, true)}
                          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 shadow-sm"
                        >
                          Approve
                        </button>
                      )}
                      {!isRejected && (
                        <button
                          onClick={() => handleSetPermission(interest.id, false)}
                          className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 shadow-sm"
                        >
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>
    </DashboardLayout>
  );
}
