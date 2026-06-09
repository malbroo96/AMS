import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { getRoleRedirect, useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { UserRole } from '../../types';

interface CollegeRegisterForm {
  collegeName: string;
  name: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
  role: 'college';
}

export function CollegeRegisterPage() {
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
  } = useForm<CollegeRegisterForm>({ defaultValues: { role: 'college' } });

  const onSubmit = async (data: CollegeRegisterForm) => {
    setLoading(true);
    try {
      const role = (await registerUser(data)) as UserRole;
      showToast('College registration successful', 'success');
      navigate(getRoleRedirect(role));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        ((err as { request?: unknown })?.request ? 'Cannot connect to the server. Please start the backend API and try again.' : '') ||
        'College registration failed';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="College Registration" subtitle="Create an institution account for admissions management">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="College Name" error={errors.collegeName?.message}>
          <input
            {...register('collegeName', {
              required: 'College name is required',
              minLength: { value: 2, message: 'Min 2 characters' },
            })}
            className={inputClass}
          />
        </Field>

        <Field label="Contact Person" error={errors.name?.message}>
          <input
            {...register('name', {
              required: 'Contact person is required',
              minLength: { value: 2, message: 'Min 2 characters' },
            })}
            className={inputClass}
          />
        </Field>

        <Field label="Official Email" error={errors.email?.message}>
          <input type="email" {...register('email', { required: 'Email is required' })} className={inputClass} />
        </Field>

        <Field label="Mobile Number" error={errors.mobile?.message}>
          <input
            {...register('mobile', {
              required: 'Mobile number is required',
              minLength: { value: 10, message: 'Invalid mobile number' },
              maxLength: { value: 15, message: 'Invalid mobile number' },
            })}
            className={inputClass}
          />
        </Field>

        <Field label="Password" error={errors.password?.message}>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Min 6 characters' },
              })}
              className={inputClass + ' pr-10'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </Field>

        <Field label="Confirm Password" error={errors.confirmPassword?.message}>
          <input
            type="password"
            {...register('confirmPassword', {
              required: 'Confirm password',
              validate: (value) => value === watch('password') || 'Passwords do not match',
            })}
            className={inputClass}
          />
        </Field>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? <LoadingSpinner className="size-5 border-white border-t-transparent" /> : 'Register College'}
        </button>

        <p className="text-center text-sm text-slate-600">
          Registering as a student?{' '}
          <Link to="/register" className="font-semibold text-blue-600 hover:underline">
            Student registration
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

const inputClass =
  'w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
