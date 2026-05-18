import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { getAdminInterests, setInterestPermission } from '../../api/ams';
import type { Interest } from '../../types';

export function AdminPermissions() {
  const [interests, setInterests] = useState<Interest[]>([]);
  const load = () => getAdminInterests().then((res) => setInterests(res.data.data));
  useEffect(() => { load(); }, []);
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-lg bg-slate-800 p-6 text-white"><h1 className="text-2xl font-bold">Profile Visibility Permissions</h1></div>
        <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100"><tr><th className="p-3">Student</th><th className="p-3">College</th><th className="p-3">Status</th><th className="p-3">Access</th><th className="p-3">Action</th></tr></thead>
            <tbody>
              {interests.map((interest) => (
                <tr key={interest.id} className="border-t">
                  <td className="p-3">{interest.student?.name}</td>
                  <td className="p-3">{interest.college?.collegeName}</td>
                  <td className="p-3">{interest.status}</td>
                  <td className="p-3">{interest.approvedByAdmin ? 'Granted' : 'Hidden'}</td>
                  <td className="p-3">
                    <button onClick={() => setInterestPermission(interest.id, !interest.approvedByAdmin).then(load)} className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white">
                      {interest.approvedByAdmin ? 'Revoke' : 'Grant'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </DashboardLayout>
  );
}
