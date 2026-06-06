export interface Filters {
  locations: string[];
  courses: string[];
  maxFees: number;
  minRating: number;
  studyModes: string[];
}

interface FilterSidebarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const locations = ['Bengaluru', 'Mumbai', 'Delhi', 'Pune', 'Hyderabad', 'Chennai'];
const courses = ['MBA', 'B.Tech', 'B.Com', 'B.Des', 'B.Sc Nursing', 'Business Analytics'];
const studyModes = ['Full-time', 'Hybrid', 'Online', 'Part-time'];

function toggleValue(items: string[], value: string) {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

function FilterGroup({
  title,
  values,
  selected,
  onToggle,
}: {
  title: string;
  values: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="border-t border-white/10 pt-5">
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <div className="mt-3 grid gap-2">
        {values.map((value) => (
          <label key={value} className="flex items-center gap-3 text-sm font-medium text-slate-300">
            <input
              type="checkbox"
              checked={selected.includes(value)}
              onChange={() => onToggle(value)}
              className="size-4 accent-sky-400"
            />
            <span>{value}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function FilterSidebar({ filters, onChange }: FilterSidebarProps) {
  return (
    <aside id="filters" className="h-max rounded-lg border border-white/10 bg-white/[0.035] p-5 shadow-xl shadow-black/20 lg:sticky lg:top-24">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-200">Filters</p>
          <h2 className="mt-1 text-xl font-bold text-white">Refine colleges</h2>
        </div>
        <button
          type="button"
          onClick={() => onChange({ locations: [], courses: [], maxFees: 250000, minRating: 4, studyModes: [] })}
          className="rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-sky-300/50 hover:text-white"
        >
          Reset
        </button>
      </div>

      <div className="mt-5 grid gap-5">
        <FilterGroup
          title="Location"
          values={locations}
          selected={filters.locations}
          onToggle={(value) => onChange({ ...filters, locations: toggleValue(filters.locations, value) })}
        />

        <FilterGroup
          title="Course"
          values={courses}
          selected={filters.courses}
          onToggle={(value) => onChange({ ...filters, courses: toggleValue(filters.courses, value) })}
        />

        <div className="border-t border-white/10 pt-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Fees range</h3>
            <span className="text-sm font-bold text-sky-200">Under Rs {filters.maxFees.toLocaleString('en-IN')}</span>
          </div>
          <input
            type="range"
            min="50000"
            max="250000"
            step="10000"
            value={filters.maxFees}
            onChange={(event) => onChange({ ...filters, maxFees: Number(event.target.value) })}
            className="mt-4 w-full accent-sky-400"
          />
        </div>

        <div className="border-t border-white/10 pt-5">
          <h3 className="text-sm font-bold text-white">Rating</h3>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[4, 4.3, 4.5, 4.7].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => onChange({ ...filters, minRating: rating })}
                className={`rounded-md border px-2 py-2 text-sm font-bold transition ${
                  filters.minRating === rating
                    ? 'border-sky-300 bg-sky-400 text-slate-950'
                    : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-sky-300/50'
                }`}
              >
                {rating}+
              </button>
            ))}
          </div>
        </div>

        <FilterGroup
          title="Study mode"
          values={studyModes}
          selected={filters.studyModes}
          onToggle={(value) => onChange({ ...filters, studyModes: toggleValue(filters.studyModes, value) })}
        />
      </div>
    </aside>
  );
}
