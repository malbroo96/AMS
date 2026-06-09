import { button, form, shell } from '../ui/designTokens';

export interface CollegeSearchValues {
  collegeName: string;
  course: string;
  city: string;
}

interface CollegeSearchProps {
  values: CollegeSearchValues;
  onChange: (values: CollegeSearchValues) => void;
  onReset?: () => void;
}

const fields: Array<{ id: keyof CollegeSearchValues; label: string; placeholder: string }> = [
  { id: 'collegeName', label: 'College name', placeholder: 'Aurora, Metro Tech...' },
  { id: 'course', label: 'Course', placeholder: 'MBA, B.Tech, Design...' },
  { id: 'city', label: 'City', placeholder: 'Bengaluru, Mumbai...' },
];

export function CollegeSearch({ values, onChange, onReset }: CollegeSearchProps) {
  return (
    <div className={`p-2 ${shell.card}`}>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
        {fields.map((field) => (
          <label
            key={field.id}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100"
          >
            <span className={form.label}>{field.label}</span>
            <input
              type="search"
              value={values[field.id]}
              onChange={(event) => onChange({ ...values, [field.id]: event.target.value })}
              placeholder={field.placeholder}
              className="mt-2 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
            />
          </label>
        ))}

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className={`min-h-18 px-5 sm:col-span-2 lg:col-span-1 ${button.secondary}`}
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
