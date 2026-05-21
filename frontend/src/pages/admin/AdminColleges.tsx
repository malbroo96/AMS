import { useEffect, useState, type FormEvent } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { createCollege, deleteCollege, getColleges, updateCollege } from '../../api/ams';
import type { College } from '../../types';
import { useToast } from '../../context/ToastContext';

export function AdminColleges() {
  const { showToast } = useToast();
  const [colleges, setColleges] = useState<College[]>([]);
  const [form, setForm] = useState({ collegeName: '', email: '', password: '', status: 'pending' });

  const load = () => getColleges({ status: 'all' }).then((res) => setColleges(res.data.data));
  useEffect(() => { load(); }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const res = await createCollege(form);
<<<<<<< HEAD
      showToast(`College created. Password: ${res.data.data.temporaryPassword}`, 'success');
      setForm({ collegeName: '', email: '', password: '', status: 'pending' });
=======
      showToast(`College registered successfully. Password: ${res.data.data.temporaryPassword}`, 'success');
      setForm({ collegeName: '', email: '', password: '', status: 'approved' });
>>>>>>> origin/akhil
      await load();
    } catch (error: unknown) {
      showToast((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to create college', 'error');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-lg bg-slate-800 p-6 text-white"><h1 className="text-2xl font-bold">College Accounts</h1></div>
        <form onSubmit={submit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
          <input value={form.collegeName} onChange={(e) => setForm({ ...form, collegeName: e.target.value })} required placeholder="College name" className={inputClass} />
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="Email" className={inputClass} />
          <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password or default" className={inputClass} />
          <button className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white">Create</button>
        </form>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100"><tr><th className="p-3">College</th><th className="p-3">Email</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
            <tbody>
              {colleges.map((college) => (
                <tr key={college.id} className="border-t">
                  <td className="p-3 font-medium">{college.collegeName}</td>
                  <td className="p-3">{college.email}</td>
                  <td className="p-3">
                    <select value={college.status} onChange={(e) => updateCollege(college.id, { status: e.target.value as College['status'] }).then(load)} className={inputClass}>
                      <option value="approved">Approved</option><option value="pending">Pending</option><option value="rejected">Rejected</option>
                    </select>
                  </td>
                  <td className="p-3"><button onClick={() => deleteCollege(college.id).then(load)} className="text-sm font-semibold text-red-600">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </DashboardLayout>
  );
}

const inputClass = 'rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-500';
