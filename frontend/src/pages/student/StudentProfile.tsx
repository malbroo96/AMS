import { useEffect, useState, type InputHTMLAttributes } from 'react';
import { useForm } from 'react-hook-form';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { getStudentProfile, updateStudentProfile } from '../../api/students';
import { useToast } from '../../context/ToastContext';

interface ProfileForm {
  name: string;
  phone: string;
  dob: string;
  gender: string;
  address: string;
  parentName: string;
  grade: string;
  board: string;
  percentage: number;
}

export function StudentProfile() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm<ProfileForm>();

  useEffect(() => {
    getStudentProfile()
      .then((res) => {
        const u = res.data.data;
        reset({
          name: u.name,
          phone: u.phone || '',
          dob: u.student?.dob ? u.student.dob.slice(0, 10) : '',
          gender: u.student?.gender || '',
          address: u.student?.address || '',
          parentName: u.student?.parentName || '',
          grade: u.student?.grade || '',
          board: u.student?.board || '',
          percentage: u.student?.percentage ?? 0,
        });
      })
      .finally(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (data: ProfileForm) => {
    setSaving(true);
    try {
      await updateStudentProfile(data);
      showToast('Profile updated', 'success');
    } catch {
      showToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20"><LoadingSpinner className="size-10" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-slate-900">Student Profile</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
        <Input label="Full Name" {...register('name')} />
        <Input label="Phone" {...register('phone')} />
        <Input label="Date of Birth" type="date" {...register('dob')} />
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Gender</label>
          <select {...register('gender')} className={cls}>
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <Input label="Address" {...register('address')} />
        <Input label="Parent Name" {...register('parentName')} />
        <Input label="Grade" {...register('grade')} />
        <Input label="Board" {...register('board')} />
        <Input label="Percentage" type="number" step="0.01" {...register('percentage', { valueAsNumber: true })} />
        <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-60">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </DashboardLayout>
  );
}

const cls = 'w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

function Input({ label, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input {...props} className={cls} />
    </div>
  );
}
