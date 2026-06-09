import type { StudentProfileMeta } from '../../../types/studentProfile';
import { cardClassName } from './formStyles';

interface ProfileSummaryCardsProps {
  completionPercentage: number;
  uploadedDocumentsCount: number;
  applicationsSubmitted: number;
  profileStatus: StudentProfileMeta['profileStatus'];
}

const statusLabels: Record<StudentProfileMeta['profileStatus'], string> = {
  incomplete: 'Incomplete',
  in_progress: 'In Progress',
  complete: 'Complete',
  verified: 'Verified',
};

const statusColors: Record<StudentProfileMeta['profileStatus'], string> = {
  incomplete: 'text-amber-600 bg-amber-50 border-amber-100',
  in_progress: 'text-blue-600 bg-blue-50 border-blue-100',
  complete: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  verified: 'text-violet-600 bg-violet-50 border-violet-100',
};

export function ProfileSummaryCards({
  completionPercentage,
  uploadedDocumentsCount,
  applicationsSubmitted,
  profileStatus,
}: ProfileSummaryCardsProps) {
  const cards = [
    {
      label: 'Profile Completion',
      value: `${completionPercentage}%`,
      hint: 'Based on fields and documents',
    },
    {
      label: 'Uploaded Documents',
      value: String(uploadedDocumentsCount),
      hint: 'Out of 5 required documents',
    },
    {
      label: 'Applications Submitted',
      value: String(applicationsSubmitted),
      hint: 'Total admission applications',
    },
    {
      label: 'Profile Status',
      value: statusLabels[profileStatus],
      hint: 'Current verification stage',
      status: profileStatus,
    },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className={`${cardClassName} flex flex-col`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
          {'status' in card ? (
            <span
              className={`mt-3 inline-flex w-max rounded-full border px-3 py-1 text-sm font-bold ${statusColors[card.status]}`}
            >
              {card.value}
            </span>
          ) : (
            <p className="mt-2 text-3xl font-black text-blue-600">{card.value}</p>
          )}
          <p className="mt-auto pt-3 text-xs text-slate-500">{card.hint}</p>
        </article>
      ))}
    </div>
  );
}
