import type { CollegeExplorerItem } from '../../types/collegeExplorer';
import { badge, button, shell } from '../ui/designTokens';

export interface StudentCollegeCardProps {
  college: CollegeExplorerItem;
  selected?: boolean;
  saved?: boolean;
  onViewDetails: (id: string) => void;
  onApplyNow: (id: string) => void;
  onSaveCollege: (id: string) => void;
}

function collegeInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export function StudentCollegeCard({
  college,
  selected = false,
  saved = false,
  onViewDetails,
  onApplyNow,
  onSaveCollege,
}: StudentCollegeCardProps) {
  return (
    <article
      className={`group flex h-full flex-col rounded-xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md sm:p-5 ${
        selected ? 'border-blue-500 ring-4 ring-blue-100' : 'border-slate-200'
      }`}
    >
      <div className="flex gap-4">
        <div
          className={`flex size-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${college.logoTone} text-lg font-black text-white shadow-sm`}
        >
          {collegeInitials(college.name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold text-slate-900">{college.name}</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">{college.location}</p>
            </div>
            <div className={`shrink-0 ${badge.blue}`}>
              {college.rating}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {college.courses.slice(0, 3).map((course) => (
              <span
                key={course}
                className={badge.slate}
              >
                {course}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className={`mt-4 flex flex-wrap items-center gap-3 border-t pt-4 text-sm ${shell.divider}`}>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Fees from</p>
          <p className="mt-1 font-bold text-slate-900">Rs {college.feesFrom.toLocaleString('en-IN')}</p>
        </div>
        <span className={badge.blue}>
          {college.admissionStatus}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {college.studyModes.map((mode) => (
            <span key={mode} className="rounded-lg border border-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-500">
              {mode}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => onViewDetails(college.id)}
          className={button.secondary}
        >
          View Details
        </button>
        <button
          type="button"
          onClick={() => onSaveCollege(college.id)}
          className={`rounded-md border px-3 py-2.5 text-sm font-bold transition ${
            saved
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700'
          }`}
        >
          {saved ? 'Saved' : 'Save College'}
        </button>
        <button
          type="button"
          onClick={() => onApplyNow(college.id)}
          className={`${button.primary} sm:col-span-1`}
        >
          Apply Now
        </button>
      </div>
    </article>
  );
}
