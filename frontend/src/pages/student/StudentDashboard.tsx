import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentDashboard } from '../../api/ams';
import {
  CollegeFilters,
  defaultCollegeFilters,
  type CollegeFiltersState,
} from '../../components/student/CollegeFilters';
import { CollegeSearch, type CollegeSearchValues } from '../../components/student/CollegeSearch';
import { StudentCollegeGrid } from '../../components/student/StudentCollegeGrid';
import { Navbar } from '../../components/studentPortal/Navbar';
import { badge, button, shell } from '../../components/ui/designTokens';
import { useToast } from '../../context/ToastContext';
import { approvedColleges } from '../../data/approvedColleges';
import type { ApprovedCollege } from '../../data/approvedColleges';
import type { Interest, StudentProfile } from '../../types';

const SAVED_COLLEGES_KEY = 'ams-saved-colleges';

const initialSearch: CollegeSearchValues = {
  collegeName: '',
  course: '',
  city: '',
};

function loadSavedCollegeIds(): Set<string> {
  try {
    const stored = localStorage.getItem(SAVED_COLLEGES_KEY);
    if (!stored) return new Set();
    const ids = JSON.parse(stored) as string[];
    return new Set(Array.isArray(ids) ? ids : []);
  } catch {
    return new Set();
  }
}

function persistSavedCollegeIds(ids: Set<string>) {
  localStorage.setItem(SAVED_COLLEGES_KEY, JSON.stringify([...ids]));
}

export function StudentDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchValues, setSearchValues] = useState<CollegeSearchValues>(initialSearch);
  const [filters, setFilters] = useState<CollegeFiltersState>(defaultCollegeFilters);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string | null>(approvedColleges[0]?.id ?? null);
  const [savedCollegeIds, setSavedCollegeIds] = useState<Set<string>>(() => loadSavedCollegeIds());

  const locationOptions = useMemo(
    () => [...new Set(approvedColleges.map((college) => college.city))].sort(),
    []
  );
  const courseOptions = useMemo(
    () => [...new Set(approvedColleges.flatMap((college) => college.courses))].sort(),
    []
  );
  const studyModeOptions = useMemo(
    () => [...new Set(approvedColleges.flatMap((college) => college.studyModes))].sort(),
    []
  );

  const filteredColleges = useMemo(() => {
    const collegeName = searchValues.collegeName.trim().toLowerCase();
    const course = searchValues.course.trim().toLowerCase();
    const city = searchValues.city.trim().toLowerCase();

    return approvedColleges.filter((college) => {
      const matchesName = !collegeName || college.name.toLowerCase().includes(collegeName);
      const matchesCourse =
        (!course || college.courses.some((item) => item.toLowerCase().includes(course))) &&
        (filters.courses.length === 0 || college.courses.some((item) => filters.courses.includes(item)));
      const matchesCity =
        (!city || college.city.toLowerCase().includes(city)) &&
        (filters.locations.length === 0 || filters.locations.includes(college.city));
      const matchesRating = college.rating >= filters.minRating;
      const matchesFees = college.feesFrom <= filters.maxFees;
      const matchesStudyMode =
        filters.studyModes.length === 0 ||
        college.studyModes.some((mode) => filters.studyModes.includes(mode));

      return matchesName && matchesCourse && matchesCity && matchesRating && matchesFees && matchesStudyMode;
    });
  }, [filters, searchValues]);

  const selectedCollege =
    filteredColleges.find((college) => college.id === selectedCollegeId) ?? filteredColleges[0] ?? null;

  const explorerStats = useMemo(
    () => ({
      totalColleges: approvedColleges.length,
      matchingColleges: filteredColleges.length,
      savedColleges: savedCollegeIds.size,
    }),
    [filteredColleges.length, savedCollegeIds.size]
  );

  useEffect(() => {
    let active = true;

    getStudentDashboard()
      .then((dashboardRes) => {
        if (!active) return;
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
  }, [showToast]);

  const resetExplorer = () => {
    setSearchValues(initialSearch);
    setFilters(defaultCollegeFilters);
  };

  const handleSaveCollege = (collegeId: string) => {
    setSavedCollegeIds((prev) => {
      const next = new Set(prev);
      if (next.has(collegeId)) {
        next.delete(collegeId);
        showToast('College removed from saved list', 'success');
      } else {
        next.add(collegeId);
        showToast('College saved successfully', 'success');
      }
      persistSavedCollegeIds(next);
      return next;
    });
  };

  const handleApplyNow = (collegeId: string) => {
    const college = approvedColleges.find((item) => item.id === collegeId);
    showToast(`Starting application for ${college?.name ?? 'college'}`, 'success');
    navigate('/dashboard/student/apply');
  };

  const handleViewDetails = (collegeId: string) => {
    setSelectedCollegeId(collegeId);
    document.getElementById('details')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  return (
    <div className={shell.page}>
      <Navbar />

      <main className="pb-12 pt-18">
        <section className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
              <div>
                <p className={shell.eyebrow}>Student Portal</p>
                <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
                  Welcome back, {student?.name?.split(' ')[0] || 'student'}.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  Explore approved colleges, save your favourites, and apply for admission from one focused dashboard.
                </p>
              </div>

              <div className={`p-5 ${shell.card}`}>
                <p className={shell.eyebrow}>Your profile</p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-700 text-lg font-black text-white shadow-sm">
                    {initials(student?.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold text-slate-900">{student?.name || 'Student'}</p>
                    <p className="truncate text-sm text-slate-500">{student?.email || '-'}</p>
                  </div>
                </div>
                <div className={`mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-sm ${shell.divider}`}>
                  <ProfileValue label="Mobile" value={student?.mobile} />
                  <ProfileValue label="Education" value={student?.education} />
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Approved colleges" value={explorerStats.totalColleges} />
              <Stat label="Matching now" value={explorerStats.matchingColleges} />
              <Stat label="Saved colleges" value={explorerStats.savedColleges} />
              <Stat label="Applied colleges" value={stats.appliedColleges || 0} />
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className={shell.eyebrow}>Search colleges</p>
            <h2 className={shell.title}>Discover institutions by name, course, or city</h2>
          </div>
          <CollegeSearch values={searchValues} onChange={setSearchValues} onReset={resetExplorer} />
        </section>

        <section className="mx-auto grid w-full max-w-7xl gap-5 px-4 pb-8 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
          <CollegeFilters
            filters={filters}
            locationOptions={locationOptions}
            courseOptions={courseOptions}
            studyModeOptions={studyModeOptions}
            onChange={setFilters}
            onReset={resetExplorer}
          />

          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            {loading ? (
              <PortalMessage message="Loading dashboard..." />
            ) : (
              <StudentCollegeGrid
                colleges={filteredColleges}
                selectedCollegeId={selectedCollege?.id}
                savedCollegeIds={savedCollegeIds}
                onViewDetails={handleViewDetails}
                onApplyNow={handleApplyNow}
                onSaveCollege={handleSaveCollege}
              />
            )}
            <CollegeDetailsPanel
              college={selectedCollege}
              saved={selectedCollege ? savedCollegeIds.has(selectedCollege.id) : false}
              onApplyNow={handleApplyNow}
              onSaveCollege={handleSaveCollege}
            />
          </div>
        </section>

        <section id="applications" className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={`p-5 sm:p-6 ${shell.card}`}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className={shell.eyebrow}>Application tracker</p>
                <h2 className={shell.title}>Your college interests</h2>
              </div>
              <p className="text-sm font-semibold text-slate-400">{interests.length} submitted</p>
            </div>

            {interests.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
                Apply to a college to begin tracking your admission progress here.
              </div>
            ) : (
              <div className="mt-5 grid gap-3">
                {interests.map((interest) => (
                  <article
                    key={interest.id}
                    className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
                  >
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {interest.college?.collegeName || interest.school?.collegeName || 'College'}
                      </h3>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Submitted {formatDate(interest.submittedAt || interest.createdAt)}
                      </p>
                    </div>
                    <Status value={interest.status} />
                    <span
                      className={`text-sm font-bold ${interest.approvedByAdmin ? 'text-emerald-700' : 'text-amber-700'}`}
                    >
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

interface CollegeDetailsPanelProps {
  college: ApprovedCollege | null;
  saved: boolean;
  onApplyNow: (id: string) => void;
  onSaveCollege: (id: string) => void;
}

function CollegeDetailsPanel({ college, saved, onApplyNow, onSaveCollege }: CollegeDetailsPanelProps) {
  if (!college) {
    return (
      <aside className="hidden h-max rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center text-sm text-slate-500 xl:block">
        Select a college to view full details.
      </aside>
    );
  }

  return (
    <aside id="details" className={`h-max p-5 xl:sticky xl:top-24 ${shell.card}`}>
      <div className={`flex h-36 items-end rounded-xl bg-linear-to-br ${college.logoTone} p-5`}>
        <div className="rounded-xl bg-white/90 px-3 py-2 shadow-sm backdrop-blur">
          <p className={shell.eyebrow}>{college.admissionStatus}</p>
          <h2 className="mt-1 text-2xl font-black text-slate-900">{college.name}</h2>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <Detail label="Rating" value={String(college.rating)} />
        <Detail label="Reviews" value={college.reviewCount.toLocaleString('en-IN')} />
        <Detail label="From" value={`Rs ${(college.feesFrom / 1000).toFixed(0)}k`} />
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-bold text-slate-900">Location</h3>
        <p className="mt-2 text-sm text-slate-500">{college.location}</p>
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-bold text-slate-900">Available courses</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {college.courses.map((course) => (
            <span key={course} className={badge.blue}>
              {course}
            </span>
          ))}
        </div>
      </div>

      <div className={`mt-5 border-t pt-5 ${shell.divider}`}>
        <h3 className="text-sm font-bold text-slate-900">Highlights</h3>
        <div className="mt-3 grid gap-2">
          {college.highlights.map((highlight) => (
            <div
              key={highlight}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600"
            >
              {highlight}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-2">
        <button
          type="button"
          onClick={() => onApplyNow(college.id)}
          className={`w-full ${button.primary}`}
        >
          Apply Now
        </button>
        <button
          type="button"
          onClick={() => onSaveCollege(college.id)}
          className={`w-full rounded-md border px-4 py-3 text-sm font-bold transition ${
            saved
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700'
          }`}
        >
          {saved ? 'Saved to list' : 'Save College'}
        </button>
      </div>
    </aside>
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

function formatDate(value?: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

interface ProfileValueProps {
  label: string;
  value?: string | null;
}

function ProfileValue({ label, value }: ProfileValueProps) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 truncate font-semibold text-slate-900">{value || '-'}</p>
    </div>
  );
}

interface StatProps {
  label: string;
  value: number;
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-blue-700">{value}</p>
    </div>
  );
}

interface StatusProps {
  value: string;
}

function Status({ value }: StatusProps) {
  return (
    <span className={`w-max capitalize ${badge.blue}`}>
      {value.replace('_', ' ')}
    </span>
  );
}

interface PortalMessageProps {
  message: string;
}

function PortalMessage({ message }: PortalMessageProps) {
  return (
    <div className="col-span-full rounded-xl border border-slate-200 bg-white px-5 py-12 text-center text-sm font-semibold text-slate-500">
      {message}
    </div>
  );
}

interface DetailProps {
  label: string;
  value: string;
}

function Detail({ label, value }: DetailProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}
