import { useEffect, useMemo, useState } from 'react';
import { getColleges, getStudentDashboard, markCollegeInterest } from '../../api/ams';
import { Navbar } from '../../components/studentPortal/Navbar';
import { useToast } from '../../context/ToastContext';
import type { College, Interest, StudentProfile } from '../../types';

export function StudentDashboard() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [colleges, setColleges] = useState<College[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [markingCollegeId, setMarkingCollegeId] = useState<string | null>(null);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState('');
  const [applicationFilter, setApplicationFilter] = useState<'all' | 'applied' | 'not-applied'>('all');

  const appliedCollegeIds = useMemo(() => new Set(interests.map((item) => item.collegeId)), [interests]);
  const locations = useMemo(
    () => [...new Set(colleges.map((college) => college.city).filter(Boolean))].sort(),
    [colleges]
  );
  const filteredColleges = useMemo(() => {
    const term = search.trim().toLowerCase();
    return colleges.filter((college) => {
      const matchesSearch =
        !term ||
        college.collegeName.toLowerCase().includes(term) ||
        college.email.toLowerCase().includes(term) ||
        college.city?.toLowerCase().includes(term) ||
        college.description?.toLowerCase().includes(term);
      const matchesLocation = !locationFilter || college.city === locationFilter;
      const applied = appliedCollegeIds.has(college.id);
      const matchesApplication =
        applicationFilter === 'all' ||
        (applicationFilter === 'applied' && applied) ||
        (applicationFilter === 'not-applied' && !applied);
      return matchesSearch && matchesLocation && matchesApplication;
    });
  }, [applicationFilter, appliedCollegeIds, colleges, locationFilter, search]);
  const selectedCollege =
    filteredColleges.find((college) => college.id === selectedCollegeId) ?? filteredColleges[0] ?? null;

  const load = async (searchTerm = search) => {
    setLoading(true);
    try {
      const [collegeRes, dashboardRes] = await Promise.all([
        getColleges({ search: searchTerm }),
        getStudentDashboard(),
      ]);
      setColleges(collegeRes.data.data);
      setStudent(dashboardRes.data.data.student);
      setInterests(dashboardRes.data.data.interests);
      setStats(dashboardRes.data.data.stats);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    Promise.all([getColleges({ search: '' }), getStudentDashboard()])
      .then(([collegeRes, dashboardRes]) => {
        if (!active) return;
        setColleges(collegeRes.data.data);
        setStudent(dashboardRes.data.data.student);
        setInterests(dashboardRes.data.data.interests);
        setStats(dashboardRes.data.data.stats);
      })
      .catch(() => showToast('Unable to load student dashboard', 'error'))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // The initial request intentionally runs only once when the portal opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markInterest = async (collegeId: string) => {
    setMarkingCollegeId(collegeId);
    try {
      await markCollegeInterest(collegeId);
      showToast('Interest marked successfully', 'success');
      await load();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Unable to mark interest';
      showToast(msg, 'error');
    } finally {
      setMarkingCollegeId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070b] font-sans text-white antialiased">
      <Navbar />

      <main className="pb-12 pt-18">
        <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.3),transparent_34%),linear-gradient(135deg,#05070b_0%,#0b1020_52%,#05070b_100%)]">
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-sky-400/70 to-transparent" />
          <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-200">Student Portal</p>
                <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">
                  Welcome back, {student?.name?.split(' ')[0] || 'student'}.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                  Discover approved colleges, mark your interest, and follow every admission update from one place.
                </p>
              </div>

              <div className="rounded-lg border border-white/10 bg-black/35 p-5 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-200">Your profile</p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-sky-400 to-blue-700 text-lg font-black text-white">
                    {initials(student?.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold text-white">{student?.name || 'Student'}</p>
                    <p className="truncate text-sm text-slate-400">{student?.email || '-'}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-sm">
                  <ProfileValue label="Mobile" value={student?.mobile} />
                  <ProfileValue label="Education" value={student?.education} />
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Stat label="Registered colleges" value={stats.registeredColleges || 0} />
              <Stat label="Applied colleges" value={stats.appliedColleges || 0} />
              <Stat label="Approved access" value={stats.approvedAccess || 0} />
            </div>
          </div>
        </section>

        <section id="colleges" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-200">Approved colleges</p>
              <h2 className="mt-1 text-2xl font-bold text-white">Find your next college</h2>
            </div>
            <div className="flex w-full max-w-md gap-2">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email, or location"
                className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-sky-300/60"
              />
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setLocationFilter('');
                  setApplicationFilter('all');
                }}
                className="rounded-md bg-sky-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-sky-300 disabled:opacity-60"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
            <StudentFilters
              locations={locations}
              location={locationFilter}
              application={applicationFilter}
              onLocationChange={setLocationFilter}
              onApplicationChange={setApplicationFilter}
              onReset={() => {
                setSearch('');
                setLocationFilter('');
                setApplicationFilter('all');
              }}
            />

            <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-w-0">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <h3 className="text-xl font-bold text-white">Recommended for admission</h3>
                  <p className="text-sm font-semibold text-slate-400">{filteredColleges.length} matches</p>
                </div>
                <div className="grid gap-4">
                  {loading ? (
                    <PortalMessage message="Loading colleges..." />
                  ) : filteredColleges.length === 0 ? (
                    <PortalMessage message="No registered colleges match your filters." />
                  ) : (
                    filteredColleges.map((college, index) => {
                      const applied = appliedCollegeIds.has(college.id);
                      const selected = selectedCollege?.id === college.id;
                      return (
                        <article
                          key={college.id}
                          className={`group rounded-lg border bg-white/[0.035] p-5 shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:border-sky-300/45 ${
                            selected ? 'border-sky-300/70 ring-1 ring-sky-300/35' : 'border-white/10'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`flex size-14 shrink-0 items-center justify-center rounded-lg bg-linear-to-br ${collegeTone(index)} text-lg font-black text-white`}>
                              {initials(college.collegeName)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-lg font-bold text-white">{college.collegeName}</h3>
                              <p className="mt-1 truncate text-sm font-medium text-slate-400">
                                {[college.city, college.address].filter(Boolean).join(' | ') || college.email}
                              </p>
                            </div>
                            <span className="rounded-md bg-sky-400/10 px-2.5 py-1 text-xs font-bold capitalize text-sky-100">
                              {college.status}
                            </span>
                          </div>

                          <p className="mt-5 min-h-12 border-t border-white/10 pt-4 text-sm leading-6 text-slate-400">
                            {college.description || `${college.schoolName || college.collegeName} is accepting student interest through the AMS portal.`}
                          </p>

                          <div className="mt-5 flex gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedCollegeId(college.id)}
                              className="flex-1 rounded-md border border-white/10 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-sky-300/50 hover:text-white"
                            >
                              Details
                            </button>
                            <button
                              type="button"
                              disabled={applied || markingCollegeId === college.id}
                              onClick={() => markInterest(college.id)}
                              className="flex-1 rounded-md bg-sky-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-400"
                            >
                              {applied ? 'Interest marked' : markingCollegeId === college.id ? 'Submitting...' : 'Mark interest'}
                            </button>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </div>
              <StudentCollegeDetails
                college={selectedCollege}
                applied={selectedCollege ? appliedCollegeIds.has(selectedCollege.id) : false}
                loading={selectedCollege ? markingCollegeId === selectedCollege.id : false}
                onApply={markInterest}
              />
            </div>
          </div>
        </section>

        <section id="applications" className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-white/10 bg-[#080b12] p-5 shadow-2xl shadow-black/30 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-200">Application tracker</p>
                <h2 className="mt-1 text-2xl font-bold text-white">Your college interests</h2>
              </div>
              <p className="text-sm font-semibold text-slate-400">{interests.length} submitted</p>
            </div>

            {interests.length === 0 ? (
              <div className="mt-5 rounded-md border border-dashed border-white/15 px-5 py-10 text-center text-sm text-slate-400">
                Mark interest in a college to begin tracking it here.
              </div>
            ) : (
              <div className="mt-5 grid gap-3">
                {interests.map((interest) => (
                  <article key={interest.id} className="grid gap-4 rounded-md border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                    <div>
                      <h3 className="font-bold text-white">{interest.college?.collegeName || interest.school?.collegeName || 'College'}</h3>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Submitted {formatDate(interest.submittedAt || interest.createdAt)}
                      </p>
                    </div>
                    <Status value={interest.status} />
                    <span className={`text-sm font-bold ${interest.approvedByAdmin ? 'text-emerald-300' : 'text-amber-300'}`}>
                      {interest.approvedByAdmin ? 'Profile access granted' : 'Awaiting admin approval'}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function initials(value?: string | null) {
  return (value || 'ST')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function collegeTone(index: number) {
  return ['from-sky-400 to-blue-700', 'from-cyan-300 to-indigo-700', 'from-blue-300 to-slate-700'][index % 3];
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

function ProfileValue({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 truncate font-semibold text-slate-200">{value || '-'}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black text-sky-300">{value}</p>
    </div>
  );
}

function Status({ value }: { value: string }) {
  return (
    <span className="w-max rounded-md bg-sky-400/10 px-3 py-1.5 text-xs font-bold capitalize text-sky-100">
      {value.replace('_', ' ')}
    </span>
  );
}

function PortalMessage({ message }: { message: string }) {
  return (
    <div className="col-span-full rounded-lg border border-white/10 bg-white/[0.035] px-5 py-12 text-center text-sm font-semibold text-slate-400">
      {message}
    </div>
  );
}

function StudentFilters({
  locations,
  location,
  application,
  onLocationChange,
  onApplicationChange,
  onReset,
}: {
  locations: string[];
  location: string;
  application: 'all' | 'applied' | 'not-applied';
  onLocationChange: (value: string) => void;
  onApplicationChange: (value: 'all' | 'applied' | 'not-applied') => void;
  onReset: () => void;
}) {
  return (
    <aside id="filters" className="h-max rounded-lg border border-white/10 bg-white/[0.035] p-5 shadow-xl shadow-black/20 lg:sticky lg:top-24">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-200">Filters</p>
          <h2 className="mt-1 text-xl font-bold text-white">Refine colleges</h2>
        </div>
        <button type="button" onClick={onReset} className="rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:border-sky-300/50 hover:text-white">
          Reset
        </button>
      </div>

      <div className="mt-5 border-t border-white/10 pt-5">
        <label className="text-sm font-bold text-white" htmlFor="location-filter">Location</label>
        <select
          id="location-filter"
          value={location}
          onChange={(event) => onLocationChange(event.target.value)}
          className="mt-3 w-full rounded-md border border-white/10 bg-[#101521] px-3 py-2.5 text-sm font-semibold text-slate-200 outline-none focus:border-sky-300/60"
        >
          <option value="">All locations</option>
          {locations.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      <div className="mt-5 border-t border-white/10 pt-5">
        <h3 className="text-sm font-bold text-white">Application status</h3>
        <div className="mt-3 grid gap-2">
          {([
            ['all', 'All colleges'],
            ['not-applied', 'Open to apply'],
            ['applied', 'Interest marked'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onApplicationChange(value)}
              className={`rounded-md border px-3 py-2 text-left text-sm font-bold transition ${
                application === value
                  ? 'border-sky-300 bg-sky-400 text-slate-950'
                  : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-sky-300/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

function StudentCollegeDetails({
  college,
  applied,
  loading,
  onApply,
}: {
  college: College | null;
  applied: boolean;
  loading: boolean;
  onApply: (collegeId: string) => void;
}) {
  if (!college) return null;

  return (
    <aside id="details" className="h-max rounded-lg border border-white/10 bg-[#080b12] p-5 shadow-2xl shadow-black/30 xl:sticky xl:top-24">
      <div className="flex h-36 items-end rounded-lg bg-linear-to-br from-sky-400 to-blue-800 p-5">
        <div className="rounded-md bg-black/35 px-3 py-2 backdrop-blur">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-100">{college.status} college</p>
          <h2 className="mt-1 text-2xl font-black text-white">{college.collegeName}</h2>
        </div>
      </div>
      <div className="mt-5 grid gap-3">
        <Detail label="Email" value={college.email} />
        <Detail label="Location" value={[college.city, college.address].filter(Boolean).join(', ') || 'Not provided'} />
        <Detail label="Board" value={college.board || 'Not provided'} />
      </div>
      <div className="mt-5 border-t border-white/10 pt-5">
        <h3 className="text-sm font-bold text-white">About college</h3>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          {college.description || 'This approved college is accepting student interest through the AMS admission portal.'}
        </p>
      </div>
      <button
        type="button"
        disabled={applied || loading}
        onClick={() => onApply(college.id)}
        className="mt-6 w-full rounded-md bg-sky-400 px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-400"
      >
        {applied ? 'Interest marked' : loading ? 'Submitting...' : 'Mark interest'}
      </button>
    </aside>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-white">{value}</p>
    </div>
  );
}
