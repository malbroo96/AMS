import type { ReactNode } from 'react';

interface EmptyStateProps {
  title?: string;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ title = 'No data', message, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full border border-ams-grey-700 bg-ams-grey-800">
        <svg className="size-6 text-ams-grey-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-ams-white">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ams-grey-400">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
