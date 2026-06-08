import { resolveAssetUrl } from './profileUtils';
import { cardClassName } from './formStyles';

export interface ProfileHeaderDisplay {
  profilePhotoUrl: string | null;
  studentName: string;
  applicationNumber: string;
  course: string;
  email: string;
  mobile: string;
}

interface ProfileHeaderProps {
  display: ProfileHeaderDisplay;
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function ProfileHeader({ display }: ProfileHeaderProps) {
  const photoUrl = resolveAssetUrl(display.profilePhotoUrl);

  return (
    <section className={`${cardClassName} overflow-hidden`}>
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        <div className="relative mx-auto md:mx-0">
          <div className="flex size-28 items-center justify-center overflow-hidden rounded-full border-4 border-blue-100 bg-linear-to-br from-blue-500 to-blue-700 text-2xl font-black text-white shadow-lg shadow-blue-500/20">
            {photoUrl ? (
              <img src={photoUrl} alt={display.studentName} className="size-full object-cover" />
            ) : (
              initials(display.studentName || 'Student')
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1 text-center md:text-left">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Student Profile</p>
          <h1 className="mt-1 truncate text-2xl font-black text-slate-900 sm:text-3xl">
            {display.studentName || 'Student'}
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Application No. {display.applicationNumber || '—'}
          </p>
        </div>
      </div>

      <dl className="mt-6 grid gap-3 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-3">
        <HeaderItem label="Course" value={display.course} />
        <HeaderItem label="Email" value={display.email} />
        <HeaderItem label="Mobile" value={display.mobile} className="sm:col-span-2 lg:col-span-1" />
      </dl>
    </section>
  );
}

interface HeaderItemProps {
  label: string;
  value: string;
  className?: string;
}

function HeaderItem({ label, value, className = '' }: HeaderItemProps) {
  return (
    <div className={`rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 ${className}`}>
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 truncate text-sm font-semibold text-slate-900">{value || '—'}</dd>
    </div>
  );
}
