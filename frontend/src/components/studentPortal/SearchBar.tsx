import { button, form, shell } from '../ui/designTokens';

export interface SearchValues {
  collegeName: string;
  location: string;
  course: string;
}

interface SearchBarProps {
  values: SearchValues;
  onChange: (values: SearchValues) => void;
}

const fields: Array<{ id: keyof SearchValues; label: string; placeholder: string }> = [
  { id: 'collegeName', label: 'College', placeholder: 'Aurora, Metro Tech...' },
  { id: 'location', label: 'Location', placeholder: 'Bengaluru, Mumbai...' },
  { id: 'course', label: 'Course', placeholder: 'MBA, B.Tech, Design...' },
];

export function SearchBar({ values, onChange }: SearchBarProps) {
  return (
    <div className={`mt-8 p-2 ${shell.card}`}>
      <div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
        {fields.map((field) => (
          <label
            key={field.id}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100"
          >
            <span className={form.label}>{field.label}</span>
            <input
              value={values[field.id]}
              onChange={(event) => onChange({ ...values, [field.id]: event.target.value })}
              placeholder={field.placeholder}
              className="mt-2 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
            />
          </label>
        ))}

        <button
          type="button"
          className={`min-h-18 px-7 ${button.primary}`}
        >
          Search
        </button>
      </div>
    </div>
  );
}
