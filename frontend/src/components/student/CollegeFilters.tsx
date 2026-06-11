import { button, form, shell } from '../ui/designTokens';

export interface CollegeFiltersState {
  locations: string[];
  courses: string[];
  branch: string;
  maxFees: number;
}

export const defaultCollegeFilters: CollegeFiltersState = {
  locations: [],
  courses: [],
  branch: '',
  maxFees: 250000,
};

interface CollegeFiltersProps {
  filters: CollegeFiltersState;
  locationOptions: string[];
  courseOptions: string[];
  branchOptions: string[];
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

export function CollegeFilters({
  filters,
  locationOptions,
  courseOptions,
  branchOptions,
  onChange,
  onReset,
}: CollegeFiltersProps) {
  return (
    <aside
      id="filters"
      className={`lg:sticky lg:top-24 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto p-5 ${shell.card}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={shell.eyebrow}>Filters</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Refine colleges</h2>
        </div>
        <button
          type="button"
          onClick={onReset}
          className={button.ghost}
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

        <div className={`border-t pt-5 ${shell.divider}`}>
          <h3 className="text-sm font-bold text-slate-900">Branch</h3>
          <div className="mt-3">
            <select
              value={filters.branch}
              onChange={(event) => onChange({ ...filters, branch: event.target.value })}
              className={`${form.input} w-full bg-white`}
            >
              {branchOptions.length === 0 ? (
                <option value="" disabled>
                  No Branches Available
                </option>
              ) : (
                <>
                  <option value="">All Branches</option>
                  {branchOptions.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
        </div>

        <div className={`border-t pt-5 ${shell.divider}`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">Maximum fees</h3>
            <span className="text-xs font-bold text-blue-700 sm:text-sm">
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
            className={`mt-4 ${form.range}`}
          />
        </div>
      </div>
    </aside>
  );
}
