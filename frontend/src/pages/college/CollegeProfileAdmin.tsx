import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  getCollegeProfile,
  updateCollegeProfile,
  type CollegeProfileData,
} from '../../api/ams';
import './CollegeProfileAdmin.css';

const LOG_PREFIX = '[CollegeProfileAdmin]';

const emptyProfile = (): CollegeProfileData => ({
  id: '',
  collegeName: '',
  email: '',
  status: '',
  shortName: '',
  establishmentYear: null,
  collegeType: '',
  universityAffiliation: '',
  naacGrade: '',
  aicteApproval: false,
  ugcRecognition: false,
  logoUrl: null,
  coverBannerUrl: null,
  prospectusUrl: null,
  location: { country: '', state: '', city: '', pincode: '', fullAddress: '' },
  contact: { emailAddress: '', admissionMobileNumber: '', officeMobileNumber: '', websiteUrl: '' },
  placements: { placementPercentage: null, highestPackage: '', averagePackage: '', topRecruiters: [] },
  about: { summaryDescription: '', visionStatement: '', missionStatement: '', principalMessage: '' },
  courses: [],
  achievements: [],
  dashboard: {
    totalStudentViews: 0,
    totalEnquiries: 0,
    totalInterestedStudents: 0,
    profileCompletionPercentage: 0,
  },
});

const CollegeProfileAdmin: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('basic-info');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CollegeProfileData>(emptyProfile);

  const loadProfile = useCallback(async () => {
    if (!user?.college?.id && user?.role !== 'college') {
      console.warn(LOG_PREFIX, 'No college user context — user.college.id missing');
      setError('Unable to determine your college profile. Please log in again.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log(LOG_PREFIX, 'Fetching profile from /ams/college/profile');
      const res = await getCollegeProfile();
      const profile = res.data?.data;
      if (!profile) {
        console.error(LOG_PREFIX, 'API returned empty profile payload');
        setError('College profile data was not returned by the server.');
        return;
      }
      console.log(LOG_PREFIX, 'Profile loaded', { collegeId: profile.id, collegeName: profile.collegeName });
      setFormData({
        ...emptyProfile(),
        ...profile,
        location: { ...emptyProfile().location, ...(profile.location || {}) },
        contact: { ...emptyProfile().contact, ...(profile.contact || {}) },
        placements: { ...emptyProfile().placements, ...(profile.placements || {}) },
        about: { ...emptyProfile().about, ...(profile.about || {}) },
        courses: profile.courses ?? [],
        achievements: profile.achievements ?? [],
        dashboard: { ...emptyProfile().dashboard, ...(profile.dashboard || {}) },
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to load college profile';
      console.error(LOG_PREFIX, 'loadProfile failed:', message, err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user?.college?.id, user?.role]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      console.log(LOG_PREFIX, 'Saving profile', { collegeName: formData.collegeName });
      const res = await updateCollegeProfile({
        collegeName: formData.collegeName,
        shortName: formData.shortName,
        collegeType: formData.collegeType,
        naacGrade: formData.naacGrade,
        aicteApproval: formData.aicteApproval,
        ugcRecognition: formData.ugcRecognition,
        location: formData.location,
        contact: formData.contact,
        placements: formData.placements,
        about: formData.about,
      });
      const updated = res.data?.data;
      if (updated) {
        setFormData((prev) => ({ ...prev, ...updated }));
      }
      setEditMode(false);
      showToast('Profile saved successfully', 'success');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to save profile';
      console.error(LOG_PREFIX, 'handleSaveProfile failed:', message, err);
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const courses = formData.courses ?? [];
  const dashboard = formData.dashboard ?? emptyProfile().dashboard;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[40vh] items-center justify-center">
          <LoadingSpinner className="size-10" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="college-profile-admin p-8 text-center text-sm text-red-700">
          <p>{error}</p>
          <button
            type="button"
            className="mt-4 rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white"
            onClick={loadProfile}
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="college-profile-admin">
        <div className="admin-header">
          <h1>College Profile Management</h1>
          <button
            type="button"
            className="edit-btn"
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Student Views</h3>
            <p className="stat-number">{dashboard?.totalStudentViews ?? 0}</p>
          </div>
          <div className="stat-card">
            <h3>Enquiries</h3>
            <p className="stat-number">{dashboard?.totalEnquiries ?? 0}</p>
          </div>
          <div className="stat-card">
            <h3>Interested Students</h3>
            <p className="stat-number">{dashboard?.totalInterestedStudents ?? 0}</p>
          </div>
          <div className="stat-card">
            <h3>Profile Completion</h3>
            <p className="stat-number">{dashboard?.profileCompletionPercentage ?? 0}%</p>
          </div>
        </div>

        <div className="admin-tabs">
          {['basic-info', 'branding', 'courses', 'placements', 'about'].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'basic-info' && 'Basic Information'}
              {tab === 'branding' && 'Branding'}
              {tab === 'courses' && 'Courses'}
              {tab === 'placements' && 'Placements'}
              {tab === 'about' && 'About College'}
            </button>
          ))}
        </div>

        <div className="admin-content">
          {activeTab === 'basic-info' && (
            <div className="form-section">
              <h2>Basic Information</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>College Name</label>
                  <input
                    type="text"
                    value={formData.collegeName ?? ''}
                    onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                    disabled={!editMode}
                  />
                </div>
                <div className="form-group">
                  <label>Short Name</label>
                  <input
                    type="text"
                    value={formData.shortName ?? ''}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                    disabled={!editMode}
                  />
                </div>
                <div className="form-group">
                  <label>Establishment Year</label>
                  <input
                    type="number"
                    value={formData.establishmentYear ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        establishmentYear: e.target.value ? parseInt(e.target.value, 10) : null,
                      })
                    }
                    disabled={!editMode}
                  />
                </div>
                <div className="form-group">
                  <label>College Type</label>
                  <select
                    value={formData.collegeType ?? ''}
                    onChange={(e) => setFormData({ ...formData, collegeType: e.target.value })}
                    disabled={!editMode}
                  >
                    <option value="">Select Type</option>
                    <option>Government</option>
                    <option>Private</option>
                    <option>Autonomous</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>University Affiliation</label>
                  <input
                    type="text"
                    value={formData.universityAffiliation ?? ''}
                    onChange={(e) => setFormData({ ...formData, universityAffiliation: e.target.value })}
                    disabled={!editMode}
                  />
                </div>
                <div className="form-group">
                  <label>NAAC Grade</label>
                  <select
                    value={formData.naacGrade ?? ''}
                    onChange={(e) => setFormData({ ...formData, naacGrade: e.target.value })}
                    disabled={!editMode}
                  >
                    <option value="">Select Grade</option>
                    <option>A++</option>
                    <option>A+</option>
                    <option>A</option>
                    <option>B++</option>
                    <option>B+</option>
                    <option>B</option>
                    <option>C</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.aicteApproval ?? false}
                      onChange={(e) => setFormData({ ...formData, aicteApproval: e.target.checked })}
                      disabled={!editMode}
                    />
                    AICTE Approval
                  </label>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.ugcRecognition ?? false}
                      onChange={(e) => setFormData({ ...formData, ugcRecognition: e.target.checked })}
                      disabled={!editMode}
                    />
                    UGC Recognition
                  </label>
                </div>
              </div>

              <h3>Location Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    value={formData.location?.country ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: { ...formData.location, country: e.target.value },
                      })
                    }
                    disabled={!editMode}
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    value={formData.location?.state ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: { ...formData.location, state: e.target.value },
                      })
                    }
                    disabled={!editMode}
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={formData.location?.city ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: { ...formData.location, city: e.target.value },
                      })
                    }
                    disabled={!editMode}
                  />
                </div>
                <div className="form-group">
                  <label>Pincode</label>
                  <input
                    type="text"
                    value={formData.location?.pincode ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: { ...formData.location, pincode: e.target.value },
                      })
                    }
                    disabled={!editMode}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Full Address</label>
                  <textarea
                    value={formData.location?.fullAddress ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: { ...formData.location, fullAddress: e.target.value },
                      })
                    }
                    disabled={!editMode}
                  />
                </div>
              </div>

              <h3>Contact Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={formData.contact?.emailAddress ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact: { ...formData.contact, emailAddress: e.target.value },
                      })
                    }
                    disabled={!editMode}
                  />
                </div>
                <div className="form-group">
                  <label>Admission Phone</label>
                  <input
                    type="tel"
                    value={formData.contact?.admissionMobileNumber ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact: { ...formData.contact, admissionMobileNumber: e.target.value },
                      })
                    }
                    disabled={!editMode}
                  />
                </div>
                <div className="form-group">
                  <label>Office Phone</label>
                  <input
                    type="tel"
                    value={formData.contact?.officeMobileNumber ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact: { ...formData.contact, officeMobileNumber: e.target.value },
                      })
                    }
                    disabled={!editMode}
                  />
                </div>
                <div className="form-group">
                  <label>Website</label>
                  <input
                    type="url"
                    value={formData.contact?.websiteUrl ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact: { ...formData.contact, websiteUrl: e.target.value },
                      })
                    }
                    disabled={!editMode}
                  />
                </div>
              </div>

              {editMode && (
                <div className="form-actions">
                  <button type="button" className="save-btn" disabled={saving} onClick={handleSaveProfile}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'branding' && (
            <div className="form-section">
              <h2>Branding</h2>
              <p className="text-sm text-slate-500">
                Upload logo and banner from the College Dashboard. Missing images are shown as empty placeholders.
              </p>
              <div className="branding-upload">
                <div className="upload-group">
                  <label>College Logo</label>
                  <div className="image-preview">
                    {formData.logoUrl ? (
                      <img src={formData.logoUrl} alt="Logo" />
                    ) : (
                      <span className="text-sm text-slate-400">No logo uploaded</span>
                    )}
                  </div>
                </div>

                <div className="upload-group">
                  <label>Cover Banner</label>
                  <div className="image-preview">
                    {formData.coverBannerUrl ? (
                      <img src={formData.coverBannerUrl} alt="Banner" />
                    ) : (
                      <span className="text-sm text-slate-400">No banner uploaded</span>
                    )}
                  </div>
                </div>

                <div className="upload-group">
                  <label>Prospectus PDF</label>
                  {formData.prospectusUrl ? (
                    <a href={formData.prospectusUrl} target="_blank" rel="noopener noreferrer">
                      Download Prospectus
                    </a>
                  ) : (
                    <span className="text-sm text-slate-400">No prospectus uploaded</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'courses' && (
            <div className="form-section">
              <h2>Courses Offered</h2>
              {courses.length === 0 ? (
                <p className="text-sm text-slate-500">No courses added yet.</p>
              ) : (
                <div className="courses-list">
                  {courses.map((course, index) => (
                    <div key={String(course.id ?? course._id ?? index)} className="course-item">
                      <h3>{String(course.courseName ?? 'Unnamed course')}</h3>
                      <p>
                        {String(course.degreeType ?? '-')} • {String(course.duration ?? '-')} years •{' '}
                        {String(course.totalSeats ?? '-')} seats
                      </p>
                      <p className="fee">
                        Fee: ₹{(course.fees as { annualFee?: number } | undefined)?.annualFee ?? '-'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'placements' && (
            <div className="form-section">
              <h2>Placement Statistics</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Placement Percentage</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.placements?.placementPercentage ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        placements: {
                          ...formData.placements,
                          placementPercentage: e.target.value ? parseFloat(e.target.value) : null,
                        },
                      })
                    }
                    disabled={!editMode}
                  />
                </div>
                <div className="form-group">
                  <label>Highest Package (LPA)</label>
                  <input
                    type="text"
                    value={formData.placements?.highestPackage ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        placements: { ...formData.placements, highestPackage: e.target.value },
                      })
                    }
                    disabled={!editMode}
                  />
                </div>
                <div className="form-group">
                  <label>Average Package (LPA)</label>
                  <input
                    type="text"
                    value={formData.placements?.averagePackage ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        placements: { ...formData.placements, averagePackage: e.target.value },
                      })
                    }
                    disabled={!editMode}
                  />
                </div>
              </div>
              {editMode && (
                <div className="form-actions">
                  <button type="button" className="save-btn" disabled={saving} onClick={handleSaveProfile}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="form-section">
              <h2>About College</h2>
              <div className="form-group full-width">
                <label>Summary Description</label>
                <textarea
                  rows={5}
                  value={formData.about?.summaryDescription ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      about: { ...formData.about, summaryDescription: e.target.value },
                    })
                  }
                  disabled={!editMode}
                />
              </div>
              <div className="form-group full-width">
                <label>Vision Statement</label>
                <textarea
                  rows={4}
                  value={formData.about?.visionStatement ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      about: { ...formData.about, visionStatement: e.target.value },
                    })
                  }
                  disabled={!editMode}
                />
              </div>
              <div className="form-group full-width">
                <label>Mission Statement</label>
                <textarea
                  rows={4}
                  value={formData.about?.missionStatement ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      about: { ...formData.about, missionStatement: e.target.value },
                    })
                  }
                  disabled={!editMode}
                />
              </div>
              <div className="form-group full-width">
                <label>Principal&apos;s Message</label>
                <textarea
                  rows={4}
                  value={formData.about?.principalMessage ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      about: { ...formData.about, principalMessage: e.target.value },
                    })
                  }
                  disabled={!editMode}
                />
              </div>
              {editMode && (
                <div className="form-actions">
                  <button type="button" className="save-btn" disabled={saving} onClick={handleSaveProfile}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CollegeProfileAdmin;
