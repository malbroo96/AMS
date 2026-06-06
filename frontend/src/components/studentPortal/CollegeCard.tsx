import type { ApprovedCollege } from '../../data/approvedColleges';

interface CollegeCardProps {
  college: ApprovedCollege;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function CollegeCard({ college, selected, onSelect }: CollegeCardProps) {
  return (
    <article
      className={`group rounded-lg border bg-white/[0.035] p-4 shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:border-sky-300/45 ${
        selected ? 'border-sky-300/70 ring-1 ring-sky-300/35' : 'border-white/10'
      }`}
    >
      <div className="flex gap-4">
        <div className={`flex size-14 shrink-0 items-center justify-center rounded-lg bg-linear-to-br ${college.logoTone} text-lg font-black text-white shadow-lg shadow-blue-950/40`}>
          {college.name.split(' ').slice(0, 2).map((word) => word[0]).join('')}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold text-white">{college.name}</h3>
              <p className="mt-1 text-sm font-medium text-slate-400">{college.location}</p>
            </div>
            <div className="rounded-md bg-sky-400 px-2.5 py-1 text-sm font-black text-slate-950">
              {college.rating}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {college.courses.slice(0, 3).map((course) => (
              <span key={course} className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-slate-300">
                {course}
              </span>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Fees from</p>
              <p className="mt-1 text-sm font-bold text-white">Rs {college.feesFrom.toLocaleString('en-IN')}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onSelect(college.id)}
                className="rounded-md border border-white/10 px-3 py-2 text-sm font-bold text-slate-200 transition hover:border-sky-300/50 hover:text-white"
              >
                Details
              </button>
              <button
                type="button"
                className="rounded-md bg-sky-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-sky-300"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
