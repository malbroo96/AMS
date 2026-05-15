import { useEffect, useState, type FormEvent } from 'react';
import { createSchool, deleteSchool, getSchools, updateSchool } from '../../api/schools';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { SearchBar } from '../../components/ui/SearchBar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import type { School } from '../../types';

const emptyForm = { schoolName: '', city: '', address: '', board: '', description: '' };

export function ManageSchools() {
  const { showToast } = useToast();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getSchools({ search, limit: 50 })
      .then((res) => setSchools(res.data.data.schools))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [search]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await updateSchool(editId, form);
        showToast('School updated', 'success');
      } else {
        await createSchool(form);
        showToast('School created', 'success');
      }
      setForm(emptyForm);
      setEditId(null);
      load();
    } catch {
      showToast('Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this school?')) return;
    try {
      await deleteSchool(id);
      showToast('School deleted', 'success');
      load();
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  const columns: Column<School>[] = [
    { key: 'name', header: 'School', render: (r) => r.schoolName },
    { key: 'city', header: 'City', render: (r) => r.city },
    { key: 'board', header: 'Board', render: (r) => r.board || '—' },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <span className="flex gap-2">
          <button type="button" onClick={() => { setEditId(r.id); setForm({ schoolName: r.schoolName, city: r.city, address: r.address || '', board: r.board || '', description: r.description || '' }); }} className="text-sm text-blue-600 hover:underline">Edit</button>
          <button type="button" onClick={() => handleDelete(r.id)} className="text-sm text-red-600 hover:underline">Delete</button>
        </span>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-slate-900">Manage Schools</h1>
      <SearchBar value={search} onChange={setSearch} placeholder="Search schools..." />
      <form onSubmit={handleSubmit} className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-md sm:grid-cols-2">
        <input required placeholder="School name" value={form.schoolName} onChange={(e) => setForm({ ...form, schoolName: e.target.value })} className={inp} />
        <input required placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inp} />
        <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inp} />
        <input placeholder="Board" value={form.board} onChange={(e) => setForm({ ...form, board: e.target.value })} className={inp} />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inp} sm:col-span-2`} rows={2} />
        <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 sm:col-span-2">
          {editId ? 'Update School' : 'Add School'}
        </button>
      </form>
      <div className="mt-6">
        {loading ? <p className="flex justify-center py-8"><LoadingSpinner /></p> : <DataTable columns={columns} data={schools} />}
      </div>
    </DashboardLayout>
  );
}

const inp = 'rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';
