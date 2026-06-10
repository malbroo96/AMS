import type { CollegeExplorerItem } from '../../types/collegeExplorer';
import { badge, button, shell } from '../ui/designTokens';

interface CollegeDetailsProps {
  college: CollegeExplorerItem | null;
}

export function CollegeDetails({ college }: CollegeDetailsProps) {
  if (!college) {
    return null;
  }

  return (
    <aside id="details" className={`h-max p-5 xl:sticky xl:top-24 ${shell.card}`}>
      <div className={`flex h-36 items-end rounded-xl bg-linear-to-br ${college.logoTone} p-5`}>
        <div className="rounded-xl bg-white/90 px-3 py-2 shadow-sm backdrop-blur">
          <p className={shell.eyebrow}>{college.admissionStatus}</p>
          <h2 className="mt-1 text-2xl font-black text-slate-900">{college.name}</h2>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className={shell.mutedCard + ' p-3'}>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Rating</p>
          <p className="mt-1 text-lg font-black text-slate-900">{college.rating}</p>
        </div>
        <div className={shell.mutedCard + ' p-3'}>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Reviews</p>
          <p className="mt-1 text-lg font-black text-slate-900">{college.reviewCount.toLocaleString('en-IN')}</p>
        </div>
        <div className={shell.mutedCard + ' p-3'}>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">From</p>
          <p className="mt-1 text-lg font-black text-slate-900">Rs {(college.feesFrom / 1000).toFixed(0)}k</p>
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-bold text-slate-900">Available courses</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {college.courses.map((course) => (
            <span key={course} className={badge.blue}>
              {course}
            </span>
          ))}
        </div>
      </div>

      <div className={`mt-5 border-t pt-5 ${shell.divider}`}>
        <h3 className="text-sm font-bold text-slate-900">Highlights</h3>
        <div className="mt-3 grid gap-2">
          {college.highlights.map((highlight) => (
            <div key={highlight} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
              {highlight}
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        className={`mt-6 w-full ${button.primary}`}
      >
        Apply now
      </button>
    </aside>
  );
}
