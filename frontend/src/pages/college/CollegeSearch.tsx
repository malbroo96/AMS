import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { searchColleges, setFilters } from '../../redux/slices/collegeSlice';
import './CollegeSearch.css';

interface FilterState {
  state?: string;
  city?: string;
  collegeType?: string;
  minFee?: number;
  maxFee?: number;
  minRating?: number;
  facilities?: string[];
}

const CollegeSearch: React.FC = () => {
  const dispatch = useDispatch();
  const { colleges, loading, error } = useSelector((state: any) => state.colleges);
  const [filters, setFiltersLocal] = useState<FilterState>({});
  const [searchQuery, setSearchQuery] = useState('');

  const collegeTypes = ['Government', 'Private', 'Autonomous'];
  const naacGrades = ['A++', 'A+', 'A', 'B++', 'B+', 'B', 'C'];
  const facilitiesList = [
    'Hostel',
    'Library',
    'Sports',
    'Transportation',
    'Cafeteria',
    'WiFi',
    'Auditorium',
    'Medical Facility',
    'Gym',
    'Placement Cell'
  ];

  useEffect(() => {
    // Fetch colleges on component mount or filter change
    const searchParams = {
      ...filters,
      search: searchQuery
    };
    dispatch(searchColleges(searchParams) as any);
  }, [filters, searchQuery, dispatch]);

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    if (!value || (Array.isArray(value) && value.length === 0)) {
      delete newFilters[key as keyof FilterState];
    }
    setFiltersLocal(newFilters);
    dispatch(setFilters(newFilters));
  };

  const handleFacilityToggle = (facility: string) => {
    const currentFacilities = filters.facilities || [];
    const newFacilities = currentFacilities.includes(facility)
      ? currentFacilities.filter(f => f !== facility)
      : [...currentFacilities, facility];

    handleFilterChange('facilities', newFacilities);
  };

  return (
    <div className="college-search-container">
      {/* Search Header */}
      <div className="search-header">
        <h1>Find Your Dream College</h1>
        <p>Search from thousands of colleges across India</p>
      </div>

      <div className="search-content">
        {/* Filters Sidebar */}
        <aside className="filters-sidebar">
          <div className="filter-section">
            <input
              type="text"
              placeholder="Search by college name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Location Filters */}
          <div className="filter-section">
            <h3>Location</h3>
            <select
              value={filters.state || ''}
              onChange={(e) => handleFilterChange('state', e.target.value || undefined)}
              className="filter-select"
            >
              <option value="">Select State</option>
              <option value="Andhra Pradesh">Andhra Pradesh</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Karnataka">Karnataka</option>
              {/* Add more states */}
            </select>

            {filters.state && (
              <select
                value={filters.city || ''}
                onChange={(e) => handleFilterChange('city', e.target.value || undefined)}
                className="filter-select"
              >
                <option value="">Select City</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Bangalore">Bangalore</option>
                {/* Add more cities */}
              </select>
            )}
          </div>

          {/* College Type Filter */}
          <div className="filter-section">
            <h3>College Type</h3>
            {collegeTypes.map((type) => (
              <label key={type} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={filters.collegeType === type}
                  onChange={(e) =>
                    handleFilterChange('collegeType', e.target.checked ? type : undefined)
                  }
                />
                {type}
              </label>
            ))}
          </div>

          {/* Fee Range Filter */}
          <div className="filter-section">
            <h3>Annual Fee Range</h3>
            <div className="fee-range">
              <input
                type="number"
                placeholder="Min"
                value={filters.minFee || ''}
                onChange={(e) =>
                  handleFilterChange('minFee', e.target.value ? parseInt(e.target.value) : undefined)
                }
                className="fee-input"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxFee || ''}
                onChange={(e) =>
                  handleFilterChange('maxFee', e.target.value ? parseInt(e.target.value) : undefined)
                }
                className="fee-input"
              />
            </div>
          </div>

          {/* Rating Filter */}
          <div className="filter-section">
            <h3>Minimum Rating</h3>
            <select
              value={filters.minRating || ''}
              onChange={(e) =>
                handleFilterChange('minRating', e.target.value ? parseFloat(e.target.value) : undefined)
              }
              className="filter-select"
            >
              <option value="">Any Rating</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4">4+ Stars</option>
              <option value="3.5">3.5+ Stars</option>
              <option value="3">3+ Stars</option>
            </select>
          </div>

          {/* Facilities Filter */}
          <div className="filter-section">
            <h3>Facilities</h3>
            <div className="facilities-grid">
              {facilitiesList.map((facility) => (
                <label key={facility} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={(filters.facilities || []).includes(facility)}
                    onChange={() => handleFacilityToggle(facility)}
                  />
                  {facility}
                </label>
              ))}
            </div>
          </div>

          {/* Reset Filters */}
          <button
            className="reset-filters-btn"
            onClick={() => {
              setFiltersLocal({});
              setSearchQuery('');
              dispatch(setFilters({}));
            }}
          >
            Reset Filters
          </button>
        </aside>

        {/* Results Section */}
        <main className="search-results">
          {loading && <div className="loading">Loading colleges...</div>}
          {error && <div className="error">{error}</div>}
          {!loading && colleges.length === 0 && (
            <div className="no-results">No colleges found. Try adjusting your filters.</div>
          )}

          <div className="colleges-grid">
            {colleges.map((college: any) => (
              <CollegeCard key={college._id} college={college} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

// College Card Component
const CollegeCard: React.FC<{ college: any }> = ({ college }) => {
  const navigate = useNavigate();

  return (
    <div className="college-card">
      <div className="college-banner">
        <img src={college.coverBannerUrl} alt={college.collegeName} />
      </div>

      <div className="college-card-content">
        <div className="college-header">
          <img src={college.logoUrl} alt="Logo" className="college-logo" />
          <div>
            <h3>{college.collegeName}</h3>
            <p className="college-location">
              📍 {college.location.city}, {college.location.state}
            </p>
          </div>
        </div>

        <div className="college-stats">
          <div className="stat">
            <span className="rating">⭐ 4.5</span>
            <span className="reviews">(1,234 reviews)</span>
          </div>
          <div className="stat">
            <span>📊 Placement: 85%</span>
          </div>
          <div className="stat">
            <span>💰 Starting: ₹5 LPA</span>
          </div>
        </div>

        <div className="college-tags">
          <span className="tag naac">{college.naacGrade}</span>
          <span className="tag type">{college.collegeType}</span>
        </div>

        <button
          className="view-details-btn"
          onClick={() => navigate(`/college/${college._id}`)}
        >
          View Details →
        </button>
      </div>
    </div>
  );
};

export default CollegeSearch;
