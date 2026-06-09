import { button, form, shell } from '../ui/designTokens';

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
    <div className={`border-t pt-5 ${shell.divider}`}>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <div className="mt-3 grid gap-2">
        {values.map((value) => (
          <label key={value} className="flex items-center gap-3 text-sm font-medium text-slate-600">
            <input
              type="checkbox"
              checked={selected.includes(value)}
              onChange={() => onToggle(value)}
              className={form.checkbox}
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
    <aside id="filters" className={`h-max p-5 lg:sticky lg:top-24 ${shell.card}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={shell.eyebrow}>Filters</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Refine colleges</h2>
        </div>
        <button
          type="button"
          onClick={() => onChange({ locations: [], courses: [], maxFees: 250000, minRating: 4, studyModes: [] })}
          className={button.ghost}
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

        <div className={`border-t pt-5 ${shell.divider}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Fees range</h3>
            <span className="text-sm font-bold text-blue-700">Under Rs {filters.maxFees.toLocaleString('en-IN')}</span>
          </div>
          <input
            type="range"
            min="50000"
            max="250000"
            step="10000"
            value={filters.maxFees}
            onChange={(event) => onChange({ ...filters, maxFees: Number(event.target.value) })}
            className={`mt-4 ${form.range}`}
          />
        </div>

        <div className={`border-t pt-5 ${shell.divider}`}>
          <h3 className="text-sm font-bold text-slate-900">Rating</h3>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[4, 4.3, 4.5, 4.7].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => onChange({ ...filters, minRating: rating })}
                className={`rounded-md border px-2 py-2 text-sm font-bold transition ${
                  filters.minRating === rating
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700'
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
