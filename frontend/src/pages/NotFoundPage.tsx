import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 font-sans">
      <h1 className="text-6xl font-bold text-blue-600">404</h1>
      <p className="mt-2 text-lg text-slate-600">Page not found</p>
      <Link to="/" className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700">
        Back to Home
      </Link>
    </div>
  );
}
