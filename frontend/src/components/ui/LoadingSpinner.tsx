export function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`inline-block size-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
