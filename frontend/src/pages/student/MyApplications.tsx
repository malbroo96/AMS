import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApplications } from '../../api/applications';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { SearchBar } from '../../components/ui/SearchBar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import type { Application, ApplicationStatus } from '../../types';

export function MyApplications() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ApplicationStatus | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchApps = () => {
    setLoading(true);
    getApplications({ search, status: status || undefined, page, limit: 10 })
      .then((res) => {
        setApps(res.data.data.applications);
        setTotalPages(res.data.data.totalPages);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApps();
  }, [search, status, page]);

  const columns: Column<Application>[] = [
    { key: 'school', header: 'School', render: (r) => r.school?.schoolName },
    { key: 'course', header: 'Course', render: (r) => r.course?.courseName },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'date',
      header: 'Submitted',
      render: (r) => new Date(r.submittedAt).toLocaleDateString(),
    },
    {
      key: 'remarks',
      header: 'Remarks',
      render: (r) => r.remarks || '—',
    },
  ];

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-slate-900">My Applications</h1>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search applications..." />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ApplicationStatus | '')}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <Link to="/dashboard/student/apply" className="ml-auto rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700">
          New Application
        </Link>
      </div>
      <div className="mt-6">
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner className="size-10" /></div>
        ) : (
          <>
            <DataTable columns={columns} data={apps} emptyMessage="No applications found" />
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}


