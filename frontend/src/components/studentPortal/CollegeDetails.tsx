import type { ApprovedCollege } from '../../data/approvedColleges';

interface CollegeDetailsProps {
  college: ApprovedCollege | null;
}

export function CollegeDetails({ college }: CollegeDetailsProps) {
  if (!college) {
    return null;
  }

  return (
    <aside id="details" className="h-max rounded-lg border border-white/10 bg-[#080b12] p-5 shadow-2xl shadow-black/30 xl:sticky xl:top-24">
      <div className={`flex h-36 items-end rounded-lg bg-linear-to-br ${college.logoTone} p-5`}>
        <div className="rounded-md bg-black/35 px-3 py-2 backdrop-blur">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-100">{college.admissionStatus}</p>
          <h2 className="mt-1 text-2xl font-black text-white">{college.name}</h2>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Rating</p>
          <p className="mt-1 text-lg font-black text-white">{college.rating}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Reviews</p>
          <p className="mt-1 text-lg font-black text-white">{college.reviewCount.toLocaleString('en-IN')}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">From</p>
          <p className="mt-1 text-lg font-black text-white">Rs {(college.feesFrom / 1000).toFixed(0)}k</p>
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-bold text-white">Available courses</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {college.courses.map((course) => (
            <span key={course} className="rounded-md bg-sky-400/10 px-3 py-1.5 text-sm font-bold text-sky-100">
              {course}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 border-t border-white/10 pt-5">
        <h3 className="text-sm font-bold text-white">Highlights</h3>
        <div className="mt-3 grid gap-2">
          {college.highlights.map((highlight) => (
            <div key={highlight} className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-slate-300">
              {highlight}
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="mt-6 w-full rounded-md bg-sky-400 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-slate-950 shadow-lg shadow-sky-500/20 transition hover:bg-sky-300"
      >
        Apply now
      </button>
    </aside>
  );
}
