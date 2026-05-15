import { useEffect, useState, type FormEvent } from 'react';
import { createSchoolAdmin, deleteSchoolAdmin, getSchoolAdmins } from '../../api/admin';
import { getSchools } from '../../api/schools';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import type { School } from '../../types';

interface AdminRow {
  id: string;
  name: string;
  email: string;
  phone?: string;
  school?: { id: string; schoolName: string; city: string } | null;
}

export function ManageAdmins() {
  const { showToast } = useToast();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', schoolId: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getSchoolAdmins({ limit: 50 }), getSchools({ limit: 100 })])
      .then(([adminsRes, schoolsRes]) => {
        setAdmins(adminsRes.data.data.admins);
        setSchools(schoolsRes.data.data.schools);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createSchoolAdmin({ ...form, schoolId: form.schoolId || null });
      showToast('School admin created', 'success');
      setForm({ name: '', email: '', phone: '', password: '', schoolId: '' });
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this admin?')) return;
    try {
      await deleteSchoolAdmin(id);
      showToast('Admin deleted', 'success');
      load();
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  const columns: Column<AdminRow>[] = [
    { key: 'name', header: 'Name', render: (r) => r.name },
    { key: 'email', header: 'Email', render: (r) => r.email },
    { key: 'school', header: 'School', render: (r) => r.school?.schoolName || 'Unassigned' },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <button type="button" onClick={() => handleDelete(r.id)} className="text-sm text-red-600 hover:underline">Delete</button>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-slate-900">Manage School Admins</h1>
      <form onSubmit={handleSubmit} className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-md sm:grid-cols-2">
        <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} />
        <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inp} />
        <input required placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inp} />
        <input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inp} />
        <select value={form.schoolId} onChange={(e) => setForm({ ...form, schoolId: e.target.value })} className={`${inp} sm:col-span-2`}>
          <option value="">Assign school (optional)</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>{s.schoolName}</option>
          ))}
        </select>
        <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 sm:col-span-2">
          Create Admin
        </button>
      </form>
      <div className="mt-6">
        {loading ? <p className="flex justify-center py-8"><LoadingSpinner /></p> : <DataTable columns={columns} data={admins} />}
      </div>
    </DashboardLayout>
  );
}

const inp = 'rounded-xl border border-slate-200 px-4 py-2.5 text-sm';
