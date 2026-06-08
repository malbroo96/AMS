import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { getAdminInterests, setInterestPermission } from '../../api/ams';
import type { Interest } from '../../types';
import { button, shell, table } from '../../components/ui/designTokens';

export function AdminPermissions() {
  const [interests, setInterests] = useState<Interest[]>([]);
  const load = () => getAdminInterests().then((res) => setInterests(res.data.data));
  useEffect(() => { load(); }, []);
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className={shell.pageHero}><h1 className="text-2xl font-bold text-slate-900">Profile Visibility Permissions</h1></div>
        <section className={`p-5 ${table.shell}`}>
          <table className="w-full text-left text-sm">
            <thead className={table.head}><tr><th className="p-3">Student</th><th className="p-3">College</th><th className="p-3">Status</th><th className="p-3">Access</th><th className="p-3">Action</th></tr></thead>
            <tbody>
              {interests.map((interest) => (
                <tr key={interest.id} className={table.row}>
                  <td className="p-3">{interest.student?.name}</td>
                  <td className="p-3">{interest.college?.collegeName}</td>
                  <td className="p-3">{interest.status}</td>
                  <td className="p-3">{interest.approvedByAdmin ? 'Granted' : 'Hidden'}</td>
                  <td className="p-3">
                    <button onClick={() => setInterestPermission(interest.id, !interest.approvedByAdmin).then(load)} className={button.primary}>
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
