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
    <div className="rounded-lg border border-white/10 bg-black/70 p-2 shadow-2xl shadow-blue-950/35 backdrop-blur-xl">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
        {fields.map((field) => (
          <label
            key={field.id}
            className="rounded-md border border-white/8 bg-white/[0.04] px-4 py-3 transition focus-within:border-sky-300/60 focus-within:bg-sky-400/8"
          >
            <span className="block text-xs font-bold uppercase tracking-[0.14em] text-sky-200">{field.label}</span>
            <input
              type="search"
              value={values[field.id]}
              onChange={(event) => onChange({ ...values, [field.id]: event.target.value })}
              placeholder={field.placeholder}
              className="mt-2 w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500"
            />
          </label>
        ))}

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="min-h-18 rounded-md border border-white/10 px-5 text-sm font-bold text-slate-200 transition hover:border-sky-300/50 hover:text-white sm:col-span-2 lg:col-span-1"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
