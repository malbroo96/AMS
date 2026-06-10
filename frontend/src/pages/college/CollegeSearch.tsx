import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchCollegeProfiles, type CollegeProfileData } from '../../api/ams';
import './CollegeSearch.css';

interface FilterState {
  state?: string;
  city?: string;
  collegeType?: string;
  maxFee?: string;
}

const collegeTypes = ['Government', 'Private', 'Autonomous'];
const states = ['Andhra Pradesh', 'Karnataka', 'Maharashtra', 'Tamil Nadu', 'Telangana'];

const CollegeSearch: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterState>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [colleges, setColleges] = useState<CollegeProfileData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handle = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const response = await searchCollegeProfiles({
          ...filters,
          search: searchQuery,
          maxFee: filters.maxFee || undefined,
        });
        setColleges(response.data.data || []);
      } catch (err: unknown) {
        setError(
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Unable to load colleges'
        );
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(handle);
  }, [filters, searchQuery]);

  const cities = useMemo(() => {
    const names = colleges.map((college) => college.location?.city).filter(Boolean) as string[];
    return Array.from(new Set(names)).sort();
  }, [colleges]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((current) => {
      const next = { ...current, [key]: value || undefined };
      if (!value) delete next[key];
      if (key === 'state') delete next.city;
      return next;
    });
  };

  return (
    <div className="college-search-container">
      <div className="search-header">
        <h1>Find Your Dream College</h1>
        <p>Compare verified colleges, courses, fees, placements, and contact details.</p>
      </div>

      <div className="search-content">
        <aside className="filters-sidebar">
          <div className="filter-section">
            <input
              type="text"
              placeholder="Search by college, city, or state"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-section">
            <h3>Location</h3>
            <select value={filters.state || ''} onChange={(e) => handleFilterChange('state', e.target.value)} className="filter-select">
              <option value="">Any State</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            <select value={filters.city || ''} onChange={(e) => handleFilterChange('city', e.target.value)} className="filter-select">
              <option value="">Any City</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-section">
            <h3>College Type</h3>
            {collegeTypes.map((type) => (
              <label key={type} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={filters.collegeType === type}
                  onChange={(e) => handleFilterChange('collegeType', e.target.checked ? type : '')}
                />
                {type}
              </label>
            ))}
          </div>

          <div className="filter-section">
            <h3>Annual Fee Up To</h3>
            <input
              type="number"
              placeholder="250000"
              value={filters.maxFee || ''}
              onChange={(e) => handleFilterChange('maxFee', e.target.value)}
              className="fee-input"
            />
          </div>

          <button
            className="reset-filters-btn"
            type="button"
            onClick={() => {
              setFilters({});
              setSearchQuery('');
            }}
          >
            Reset Filters
          </button>
        </aside>

        <main className="search-results">
          <div className="results-toolbar">
            <div>
              <strong>{colleges.length}</strong> colleges found
            </div>
            <span>{loading ? 'Refreshing...' : 'Live AMS results'}</span>
          </div>

          {error && <div className="error">{error}</div>}
          {!loading && colleges.length === 0 && <div className="no-results">No colleges found. Try adjusting your filters.</div>}

          <div className="colleges-grid">
            {colleges.map((college) => (
              <CollegeCard key={college.id} college={college} onOpen={() => navigate(`/college/${college.id}`)} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

const CollegeCard: React.FC<{ college: CollegeProfileData & { feesFrom?: number | null; courseCount?: number }; onOpen: () => void }> = ({
  college,
  onOpen,
}) => {
  const location = [college.location?.city, college.location?.state].filter(Boolean).join(', ') || 'Location pending';
  const placement = college.placements?.placementPercentage;

  return (
    <article className="college-card">
      <div className="college-banner">
        {college.coverBannerUrl ? <img src={college.coverBannerUrl} alt={college.collegeName} /> : <div className="banner-placeholder" />}
      </div>

      <div className="college-card-content">
        <div className="college-header">
          {college.logoUrl ? <img src={college.logoUrl} alt="" className="college-logo" /> : <div className="college-logo logo-placeholder" />}
          <div>
            <h3>{college.collegeName}</h3>
            <p className="college-location">{location}</p>
          </div>
        </div>

        <div className="college-stats">
          <div className="stat">
            <span>{college.courseCount ?? 0} courses</span>
          </div>
          <div className="stat">
            <span>Placement: {placement != null ? `${placement}%` : 'Not added'}</span>
          </div>
          <div className="stat">
            <span>Fees from: {college.feesFrom ? `Rs. ${college.feesFrom.toLocaleString('en-IN')}` : 'Ask college'}</span>
          </div>
        </div>

        <div className="college-tags">
          {college.naacGrade && <span className="tag naac">{college.naacGrade}</span>}
          {college.collegeType && <span className="tag type">{college.collegeType}</span>}
          {college.aicteApproval && <span className="tag type">AICTE</span>}
        </div>

        <button className="view-details-btn" type="button" onClick={onOpen}>
          View Details
        </button>
      </div>
    </article>
  );
};

export default CollegeSearch;
