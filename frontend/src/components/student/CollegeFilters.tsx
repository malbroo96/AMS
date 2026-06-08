export interface CollegeFiltersState {
  locations: string[];
  courses: string[];
  minRating: number;
  maxFees: number;
  studyModes: string[];
}

export const defaultCollegeFilters: CollegeFiltersState = {
  locations: [],
  courses: [],
  minRating: 4,
  maxFees: 250000,
  studyModes: [],
};

interface CollegeFiltersProps {
  filters: CollegeFiltersState;
  locationOptions: string[];
  courseOptions: string[];
  studyModeOptions: string[];
  onChange: (filters: CollegeFiltersState) => void;
  onReset: () => void;
}

function toggleValue(items: string[], value: string): string[] {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

interface FilterGroupProps {
  title: string;
  values: string[];
  selected: string[];
  onToggle: (value: string) => void;
}

function FilterGroup({ title, values, selected, onToggle }: FilterGroupProps) {
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

const ratingOptions = [4, 4.3, 4.5, 4.7];

export function CollegeFilters({
  filters,
  locationOptions,
  courseOptions,
  studyModeOptions,
  onChange,
  onReset,
}: CollegeFiltersProps) {
  return (
    <aside
      id="filters"
      className="h-max rounded-lg border border-white/10 bg-white/[0.035] p-5 shadow-xl shadow-black/20 lg:sticky lg:top-24"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-200">Filters</p>
          <h2 className="mt-1 text-xl font-bold text-white">Refine colleges</h2>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-sky-300/50 hover:text-white"
        >
          Reset
        </button>
      </div>

      <div className="mt-5 grid gap-5">
        <FilterGroup
          title="Location"
          values={locationOptions}
          selected={filters.locations}
          onToggle={(value) => onChange({ ...filters, locations: toggleValue(filters.locations, value) })}
        />

        <FilterGroup
          title="Course"
          values={courseOptions}
          selected={filters.courses}
          onToggle={(value) => onChange({ ...filters, courses: toggleValue(filters.courses, value) })}
        />

        <div className="border-t border-white/10 pt-5">
          <h3 className="text-sm font-bold text-white">Rating</h3>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ratingOptions.map((rating) => (
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

        <div className="border-t border-white/10 pt-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white">Maximum fees</h3>
            <span className="text-xs font-bold text-sky-200 sm:text-sm">
              Under Rs {filters.maxFees.toLocaleString('en-IN')}
            </span>
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

        <FilterGroup
          title="Study mode"
          values={studyModeOptions}
          selected={filters.studyModes}
          onToggle={(value) => onChange({ ...filters, studyModes: toggleValue(filters.studyModes, value) })}
        />
      </div>
    </aside>
  );
}
