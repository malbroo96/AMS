import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { getAdminStudents } from '../../api/ams';
import type { StudentProfile } from '../../types';

export function AdminStudents() {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  useEffect(() => { getAdminStudents().then((res) => setStudents(res.data.data)); }, []);
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-lg bg-slate-800 p-6 text-white"><h1 className="text-2xl font-bold">All Students</h1></div>
        <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Mobile</th><th className="p-3">Gender</th><th className="p-3">Education</th><th className="p-3">Address</th></tr></thead>
            <tbody>{students.map((student) => <tr key={student.id} className="border-t"><td className="p-3 font-medium">{student.name}</td><td className="p-3">{student.email}</td><td className="p-3">{student.mobile}</td><td className="p-3">{student.gender}</td><td className="p-3">{student.education}</td><td className="p-3">{student.address}</td></tr>)}</tbody>
          </table>
        </section>
      </div>
    </DashboardLayout>
  );
}
