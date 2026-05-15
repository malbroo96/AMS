import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useAuth, getRoleRedirect } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { UserRole } from '../../types';

interface RegisterForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: 'student' | 'school_admin';
}

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({ defaultValues: { role: 'student' } });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const role = (await registerUser(data)) as UserRole;
      showToast('Registration successful', 'success');
      navigate(getRoleRedirect(role));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Registration failed';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Register" subtitle="Create your admission portal account">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Full Name" error={errors.name?.message}>
          <input
            {...register('name', { required: 'Full name is required', minLength: { value: 2, message: 'Min 2 characters' } })}
            className={inputClass}
          />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input type="email" {...register('email', { required: 'Email is required' })} className={inputClass} />
        </Field>
        <Field label="Phone Number" error={errors.phone?.message}>
          <input
            {...register('phone', { required: 'Phone is required', minLength: { value: 10, message: 'Invalid phone' } })}
            className={inputClass}
          />
        </Field>
        <Field label="Role" error={errors.role?.message}>
          <select {...register('role', { required: true })} className={inputClass}>
            <option value="student">Student</option>
            <option value="school_admin">School Admin</option>
          </select>
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
              className={inputClass + ' pr-10'}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </Field>
        <Field label="Confirm Password" error={errors.confirmPassword?.message}>
          <input
            type="password"
            {...register('confirmPassword', {
              required: 'Confirm password',
              validate: (v) => v === watch('password') || 'Passwords do not match',
            })}
            className={inputClass}
          />
        </Field>
        <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-60">
          {loading ? <LoadingSpinner className="size-5 border-white border-t-transparent" /> : 'Register'}
        </button>
        <p className="text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:underline">Login</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

const inputClass = 'w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
