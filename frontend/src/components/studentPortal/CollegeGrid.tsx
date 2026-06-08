import type { ApprovedCollege } from '../../data/approvedColleges';
import { CollegeCard } from './CollegeCard';

interface CollegeGridProps {
  colleges: ApprovedCollege[];
  selectedCollegeId?: string;
  onSelectCollege: (id: string) => void;
}

export function CollegeGrid({ colleges, selectedCollegeId, onSelectCollege }: CollegeGridProps) {
  return (
    <section id="colleges" className="min-w-0">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-200">Approved colleges</p>
          <h2 className="mt-1 text-2xl font-bold text-white">Recommended for admission</h2>
        </div>
        <p className="text-sm font-semibold text-slate-400">{colleges.length} matches</p>
      </div>

      {colleges.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          {colleges.map((college) => (
            <CollegeCard
              key={college.id}
              college={college}
              selected={college.id === selectedCollegeId}
              onSelect={onSelectCollege}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-white/10 bg-white/[0.035] px-5 py-12 text-center">
          <h3 className="text-xl font-bold text-white">No colleges match your search</h3>
          <p className="mt-2 text-sm text-slate-400">Try widening fees, rating, location, or course filters.</p>
        </div>
      )}
    </section>
  );
}
