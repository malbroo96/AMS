import type { ApprovedCollege } from '../../data/approvedColleges';
import { StudentCollegeCard } from './StudentCollegeCard';

export interface StudentCollegeGridProps {
  colleges: ApprovedCollege[];
  selectedCollegeId?: string | null;
  savedCollegeIds: Set<string>;
  onViewDetails: (id: string) => void;
  onApplyNow: (id: string) => void;
  onSaveCollege: (id: string) => void;
}

export function StudentCollegeGrid({
  colleges,
  selectedCollegeId,
  savedCollegeIds,
  onViewDetails,
  onApplyNow,
  onSaveCollege,
}: StudentCollegeGridProps) {
  return (
    <section id="colleges" className="min-w-0">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-200">College explorer</p>
          <h2 className="mt-1 text-2xl font-bold text-white">Find your next college</h2>
        </div>
        <p className="text-sm font-semibold text-slate-400">{colleges.length} matches</p>
      </div>

      {colleges.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          {colleges.map((college) => (
            <StudentCollegeCard
              key={college.id}
              college={college}
              selected={college.id === selectedCollegeId}
              saved={savedCollegeIds.has(college.id)}
              onViewDetails={onViewDetails}
              onApplyNow={onApplyNow}
              onSaveCollege={onSaveCollege}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.035] px-5 py-12 text-center">
          <h3 className="text-xl font-bold text-white">No colleges match your search</h3>
          <p className="mt-2 text-sm text-slate-400">
            Try adjusting your search terms or widening location, course, rating, fees, and study mode filters.
          </p>
        </div>
      )}
    </section>
  );
}
