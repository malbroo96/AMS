import type { ApprovedCollege } from '../../data/approvedColleges';

export interface StudentCollegeCardProps {
  college: ApprovedCollege;
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
      className={`group flex h-full flex-col rounded-lg border bg-white/[0.035] p-4 shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:border-sky-300/45 sm:p-5 ${
        selected ? 'border-sky-300/70 ring-1 ring-sky-300/35' : 'border-white/10'
      }`}
    >
      <div className="flex gap-4">
        <div
          className={`flex size-14 shrink-0 items-center justify-center rounded-lg bg-linear-to-br ${college.logoTone} text-lg font-black text-white shadow-lg shadow-blue-950/40`}
        >
          {collegeInitials(college.name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold text-white">{college.name}</h3>
              <p className="mt-1 text-sm font-medium text-slate-400">{college.location}</p>
            </div>
            <div className="shrink-0 rounded-md bg-sky-400 px-2.5 py-1 text-sm font-black text-slate-950">
              {college.rating}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {college.courses.slice(0, 3).map((course) => (
              <span
                key={course}
                className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-slate-300"
              >
                {course}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4 text-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Fees from</p>
          <p className="mt-1 font-bold text-white">Rs {college.feesFrom.toLocaleString('en-IN')}</p>
        </div>
        <span className="rounded-md bg-sky-400/10 px-2.5 py-1 text-xs font-bold text-sky-100">
          {college.admissionStatus}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {college.studyModes.map((mode) => (
            <span key={mode} className="rounded-md border border-white/10 px-2 py-0.5 text-xs font-semibold text-slate-400">
              {mode}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => onViewDetails(college.id)}
          className="rounded-md border border-white/10 px-3 py-2.5 text-sm font-bold text-slate-200 transition hover:border-sky-300/50 hover:text-white"
        >
          View Details
        </button>
        <button
          type="button"
          onClick={() => onSaveCollege(college.id)}
          className={`rounded-md border px-3 py-2.5 text-sm font-bold transition ${
            saved
              ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-200'
              : 'border-white/10 text-slate-200 hover:border-sky-300/50 hover:text-white'
          }`}
        >
          {saved ? 'Saved' : 'Save College'}
        </button>
        <button
          type="button"
          onClick={() => onApplyNow(college.id)}
          className="rounded-md bg-sky-400 px-3 py-2.5 text-sm font-black text-slate-950 transition hover:bg-sky-300 sm:col-span-1"
        >
          Apply Now
        </button>
      </div>
    </article>
  );
}
