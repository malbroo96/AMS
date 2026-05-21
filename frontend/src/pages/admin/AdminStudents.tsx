import { useEffect, useState, type FormEvent } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { createStudent, deleteStudent, getAdminStudents, getColleges, updateStudent } from '../../api/ams';
import type { College, StudentProfile } from '../../types';
import { useToast } from '../../context/ToastContext';

const emptyForm = {
  name: '',
  email: '',
  mobile: '',
  password: '',
  address: '',
  gender: '',
  dateOfBirth: '',
  education: '',
  interestedCollege: '',
};

type StudentForm = typeof emptyForm;

export function AdminStudents() {
  const { showToast } = useToast();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = () => getAdminStudents().then((res) => setStudents(res.data.data));

  useEffect(() => {
    load();
    getColleges({ status: 'all' }).then((res) => setColleges(res.data.data));
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (editingId) {
        const payload = { ...form };
        if (!payload.password) delete (payload as Partial<StudentForm>).password;
        await updateStudent(editingId, payload);
        showToast('Student updated successfully', 'success');
      } else {
        const res = await createStudent(form);
        showToast(`Student registered successfully. Password: ${res.data.data.temporaryPassword}`, 'success');
      }
      resetForm();
      await load();
    } catch (error: unknown) {
      showToast((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to save student', 'error');
    }
  };

  const edit = (student: StudentProfile) => {
    setEditingId(student.id);
    setForm({
      name: student.name || '',
      email: student.email || '',
      mobile: student.mobile || '',
      password: '',
      address: student.address || '',
      gender: student.gender || '',
      dateOfBirth: student.dateOfBirth ? String(student.dateOfBirth).slice(0, 10) : '',
      education: student.education || '',
      interestedCollege: student.interestedCollege || '',
    });
  };

  const remove = async (student: StudentProfile) => {
    if (!window.confirm(`Delete ${student.name}?`)) return;
    await deleteStudent(student.id);
    showToast('Student deleted', 'success');
    await load();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-lg bg-slate-800 p-6 text-white">
          <h1 className="text-2xl font-bold">All Students</h1>
        </div>

        <form onSubmit={submit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Student name" className={inputClass} />
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="Email" className={inputClass} />
          <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="Mobile" className={inputClass} />
          <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editingId ? 'New password optional' : 'Password or default'} className={inputClass} />
          <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={inputClass}>
            <option value="">Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} className={inputClass} />
          <input value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} placeholder="Education" className={inputClass} />
          <select value={form.interestedCollege} onChange={(e) => setForm({ ...form, interestedCollege: e.target.value })} className={inputClass}>
            <option value="">Interested college</option>
            {colleges.map((college) => (
              <option key={college.id} value={college.id}>
                {college.collegeName}
              </option>
            ))}
          </select>
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" className={`${inputClass} md:col-span-2`} />
          <div className="flex gap-2 md:col-span-2">
            <button className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white">
              {editingId ? 'Update Student' : 'Create Student'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                Cancel
              </button>
            )}
          </div>
        </form>

        <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Mobile</th>
                <th className="p-3">Gender</th>
                <th className="p-3">Education</th>
                <th className="p-3">Address</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-t">
                  <td className="p-3 font-medium">{student.name}</td>
                  <td className="p-3">{student.email}</td>
                  <td className="p-3">{student.mobile}</td>
                  <td className="p-3">{student.gender}</td>
                  <td className="p-3">{student.education}</td>
                  <td className="p-3">{student.address}</td>
                  <td className="p-3">
                    <div className="flex gap-3">
                      <button type="button" onClick={() => edit(student)} className="text-sm font-semibold text-slate-700">
                        Edit
                      </button>
                      <button type="button" onClick={() => remove(student)} className="text-sm font-semibold text-red-600">
                        Delete
                      </button>
                    </div>
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

const inputClass = 'rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-500';
