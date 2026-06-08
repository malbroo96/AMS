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
    <div className="mt-10 rounded-lg border border-white/10 bg-black/70 p-2 shadow-2xl shadow-blue-950/35 backdrop-blur-xl">
      <div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
        {fields.map((field) => (
          <label
            key={field.id}
            className="rounded-md border border-white/8 bg-white/[0.04] px-4 py-3 transition focus-within:border-sky-300/60 focus-within:bg-sky-400/8"
          >
            <span className="block text-xs font-bold uppercase tracking-[0.14em] text-sky-200">{field.label}</span>
            <input
              value={values[field.id]}
              onChange={(event) => onChange({ ...values, [field.id]: event.target.value })}
              placeholder={field.placeholder}
              className="mt-2 w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500"
            />
          </label>
        ))}

        <button
          type="button"
          className="min-h-18 rounded-md bg-sky-400 px-7 text-sm font-black uppercase tracking-[0.16em] text-slate-950 shadow-lg shadow-sky-500/25 transition hover:bg-sky-300"
        >
          Search
        </button>
      </div>
    </div>
  );
}
