import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CollegeDetails } from '../components/studentPortal/CollegeDetails';
import { CollegeGrid } from '../components/studentPortal/CollegeGrid';
import { FilterSidebar, type Filters } from '../components/studentPortal/FilterSidebar';
import { Navbar } from '../components/studentPortal/Navbar';
import { SearchBar, type SearchValues } from '../components/studentPortal/SearchBar';
import { button, shell } from '../components/ui/designTokens';
import { approvedColleges } from '../data/approvedColleges';

const initialSearch: SearchValues = {
  collegeName: '',
  location: '',
  course: '',
};

const initialFilters: Filters = {
  locations: [],
  courses: [],
  maxFees: 250000,
  minRating: 4,
  studyModes: [],
};

export function LandingPage() {
  const [searchValues, setSearchValues] = useState<SearchValues>(initialSearch);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [selectedCollegeId, setSelectedCollegeId] = useState(approvedColleges[0]?.id ?? '');

  const filteredColleges = useMemo(() => {
    const collegeName = searchValues.collegeName.trim().toLowerCase();
    const location = searchValues.location.trim().toLowerCase();
    const course = searchValues.course.trim().toLowerCase();

    return approvedColleges.filter((college) => {
      const matchesName = !collegeName || college.name.toLowerCase().includes(collegeName);
      const matchesLocation =
        (!location || college.location.toLowerCase().includes(location)) &&
        (filters.locations.length === 0 || filters.locations.includes(college.city));
      const matchesCourse =
        (!course || college.courses.some((item) => item.toLowerCase().includes(course))) &&
        (filters.courses.length === 0 || college.courses.some((item) => filters.courses.includes(item)));
      const matchesFees = college.feesFrom <= filters.maxFees;
      const matchesRating = college.rating >= filters.minRating;
      const matchesStudyMode =
        filters.studyModes.length === 0 || college.studyModes.some((mode) => filters.studyModes.includes(mode));

      return matchesName && matchesLocation && matchesCourse && matchesFees && matchesRating && matchesStudyMode;
    });
  }, [filters, searchValues]);

  const selectedCollege =
    filteredColleges.find((college) => college.id === selectedCollegeId) ?? filteredColleges[0] ?? null;

  return (
    <div className={shell.page}>
      <Navbar />

      <main>
        <section className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto flex min-h-[560px] w-full max-w-7xl flex-col justify-end px-4 pb-8 pt-24 sm:px-6 lg:px-8 lg:pb-12">
            <div className="max-w-4xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                Approved admissions marketplace
              </div>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
                Find the right college with clarity, speed, and confidence.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Search verified institutions, compare courses and fees, and start your admission journey from one focused student portal.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className={button.primary}
                >
                  Register as Student
                </Link>
                <Link
                  to="/register/college"
                  className={button.secondary}
                >
                  Register as College
                </Link>
                <Link
                  to="/colleges"
                  className="rounded-md border border-sky-300/35 bg-white/[0.03] px-5 py-3 text-sm font-bold text-sky-100 transition hover:border-sky-200 hover:bg-sky-400/10"
                >
                  Browse Colleges
                </Link>
              </div>
            </div>

            <SearchBar values={searchValues} onChange={setSearchValues} />
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
          <FilterSidebar filters={filters} onChange={setFilters} />

          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <CollegeGrid
              colleges={filteredColleges}
              selectedCollegeId={selectedCollege?.id}
              onSelectCollege={setSelectedCollegeId}
            />
            <CollegeDetails college={selectedCollege} />
          </div>
        </section>
      </main>
    </div>
  );
}
