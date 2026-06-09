import type { ApprovedCollege } from '../../data/approvedColleges';
import { badge, button, shell } from '../ui/designTokens';

interface CollegeCardProps {
  college: ApprovedCollege;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function CollegeCard({ college, selected, onSelect }: CollegeCardProps) {
  return (
    <article
      className={`group rounded-xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md ${
        selected ? 'border-blue-500 ring-4 ring-blue-100' : 'border-slate-200'
      }`}
    >
      <div className="flex gap-4">
        <div className={`flex size-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${college.logoTone} text-lg font-black text-white shadow-sm`}>
          {college.name.split(' ').slice(0, 2).map((word) => word[0]).join('')}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold text-slate-900">{college.name}</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">{college.location}</p>
            </div>
            <div className={badge.blue}>
              {college.rating}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {college.courses.slice(0, 3).map((course) => (
              <span key={course} className={badge.slate}>
                {course}
              </span>
            ))}
          </div>

          <div className={`mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between ${shell.divider}`}>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Fees from</p>
              <p className="mt-1 text-sm font-bold text-slate-900">Rs {college.feesFrom.toLocaleString('en-IN')}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onSelect(college.id)}
                className={button.secondary}
              >
                Details
              </button>
              <button
                type="button"
                className={button.primary}
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
