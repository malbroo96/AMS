import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  createCollegeAchievement,
  createCollegeCourse,
  createCollegeGalleryImage,
  deleteCollegeAchievement,
  deleteCollegeCourse,
  deleteCollegeGalleryImage,
  getCollegeProfile,
  updateCollegeProfile,
  updateCollegeAchievement,
  updateCollegeCourse,
  updateCollegeEnquiry,
  updateCollegeGalleryImage,
  uploadCollegeBanner,
  uploadCollegeLogo,
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
  gallery: [],
  enquiries: [],
  facilities: [],
  dashboard: {
    totalStudentViews: 0,
    totalEnquiries: 0,
    totalInterestedStudents: 0,
    profileCompletionPercentage: 0,
  },
});

const emptyCourse = () => ({
  id: '',
  courseName: '',
  courseCategory: '',
  degreeType: '',
  duration: '',
  totalSeats: '',
  eligibility: '',
  annualFee: '',
  hostelFee: '',
  examAccepted: '',
  description: '',
});

const emptyAchievement = () => ({
  id: '',
  achievementTitle: '',
  description: '',
  achievementYear: '',
  achievementImageUrl: '',
});

const emptyGalleryImage = () => ({
  id: '',
  imageTitle: '',
  imageDescription: '',
  imageCategory: '',
  imageUrl: '',
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
  const [courseDraft, setCourseDraft] = useState(emptyCourse);
  const [achievementDraft, setAchievementDraft] = useState(emptyAchievement);
  const [galleryDraft, setGalleryDraft] = useState(emptyGalleryImage);
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [assetUploading, setAssetUploading] = useState<'logo' | 'banner' | null>(null);

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
        gallery: profile.gallery ?? [],
        enquiries: profile.enquiries ?? [],
        facilities: profile.facilities ?? [],
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
        email: formData.email || formData.contact?.emailAddress,
        shortName: formData.shortName,
        establishmentYear: formData.establishmentYear,
        collegeType: formData.collegeType,
        universityAffiliation: formData.universityAffiliation,
        naacGrade: formData.naacGrade,
        aicteApproval: formData.aicteApproval,
        ugcRecognition: formData.ugcRecognition,
        prospectusUrl: formData.prospectusUrl,
        location: formData.location,
        contact: formData.contact,
        placements: formData.placements,
        about: formData.about,
        facilities: formData.facilities,
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

  const runProfileAction = async (action: () => Promise<unknown>, successMessage: string) => {
    setSaving(true);
    try {
      await action();
      await loadProfile();
      showToast(successMessage, 'success');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Unable to complete the action';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCourse = () =>
    runProfileAction(async () => {
      const payload = {
        courseName: courseDraft.courseName,
        courseCategory: courseDraft.courseCategory,
        degreeType: courseDraft.degreeType,
        duration: courseDraft.duration ? Number(courseDraft.duration) : null,
        totalSeats: courseDraft.totalSeats ? Number(courseDraft.totalSeats) : null,
        eligibility: courseDraft.eligibility,
        fees: {
          annualFee: courseDraft.annualFee ? Number(courseDraft.annualFee) : null,
          hostelFee: courseDraft.hostelFee ? Number(courseDraft.hostelFee) : null,
        },
        examAccepted: courseDraft.examAccepted.split(',').map((item) => item.trim()).filter(Boolean),
        description: courseDraft.description,
      };
      if (courseDraft.id) {
        await updateCollegeCourse(courseDraft.id, payload);
      } else {
        await createCollegeCourse(payload);
      }
      setCourseDraft(emptyCourse());
    }, courseDraft.id ? 'Course updated' : 'Course added');

  const handleEditCourse = (course: Record<string, unknown>) => {
    const fees = course.fees as { annualFee?: number; hostelFee?: number } | undefined;
    setCourseDraft({
      id: String(course.id ?? ''),
      courseName: String(course.courseName ?? ''),
      courseCategory: String(course.courseCategory ?? ''),
      degreeType: String(course.degreeType ?? ''),
      duration: course.duration != null ? String(course.duration) : '',
      totalSeats: course.totalSeats != null ? String(course.totalSeats) : '',
      eligibility: String(course.eligibility ?? ''),
      annualFee: fees?.annualFee != null ? String(fees.annualFee) : '',
      hostelFee: fees?.hostelFee != null ? String(fees.hostelFee) : '',
      examAccepted: Array.isArray(course.examAccepted) ? course.examAccepted.join(', ') : '',
      description: String(course.description ?? ''),
    });
  };

  const handleSaveAchievement = () =>
    runProfileAction(async () => {
      const payload = {
        achievementTitle: achievementDraft.achievementTitle,
        description: achievementDraft.description,
        achievementYear: achievementDraft.achievementYear ? Number(achievementDraft.achievementYear) : null,
        achievementImageUrl: achievementDraft.achievementImageUrl,
      };
      if (achievementDraft.id) {
        await updateCollegeAchievement(achievementDraft.id, payload);
      } else {
        await createCollegeAchievement(payload);
      }
      setAchievementDraft(emptyAchievement());
    }, achievementDraft.id ? 'Achievement updated' : 'Achievement added');

  const handleEditAchievement = (achievement: Record<string, unknown>) => {
    setAchievementDraft({
      id: String(achievement.id ?? ''),
      achievementTitle: String(achievement.achievementTitle ?? ''),
      description: String(achievement.description ?? ''),
      achievementYear: achievement.achievementYear != null ? String(achievement.achievementYear) : '',
      achievementImageUrl: String(achievement.achievementImageUrl ?? ''),
    });
  };

  const handleSaveGalleryImage = () =>
    runProfileAction(async () => {
      const payload = {
        imageTitle: galleryDraft.imageTitle,
        imageDescription: galleryDraft.imageDescription,
        imageCategory: galleryDraft.imageCategory,
        imageUrl: galleryDraft.imageUrl,
      };
      if (galleryDraft.id) {
        await updateCollegeGalleryImage(galleryDraft.id, payload, galleryFile);
      } else {
        await createCollegeGalleryImage(payload, galleryFile);
      }
      setGalleryDraft(emptyGalleryImage());
      setGalleryFile(null);
    }, galleryDraft.id ? 'Gallery image updated' : 'Gallery image added');

  const handleEditGalleryImage = (image: Record<string, unknown>) => {
    setGalleryDraft({
      id: String(image.id ?? ''),
      imageTitle: String(image.imageTitle ?? ''),
      imageDescription: String(image.imageDescription ?? ''),
      imageCategory: String(image.imageCategory ?? ''),
      imageUrl: String(image.imageUrl ?? ''),
    });
    setGalleryFile(null);
  };

  const handleAssetUpload = async (type: 'logo' | 'banner', file?: File | null) => {
    if (!file) return;
    setAssetUploading(type);
    try {
      if (type === 'logo') {
        await uploadCollegeLogo(file, formData.id);
      } else {
        await uploadCollegeBanner(file, formData.id);
      }
      await loadProfile();
      showToast(`${type === 'logo' ? 'Logo' : 'Banner'} uploaded`, 'success');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Upload failed';
      showToast(message, 'error');
    } finally {
      setAssetUploading(null);
    }
  };

  const courses = formData.courses ?? [];
  const achievements = formData.achievements ?? [];
  const gallery = formData.gallery ?? [];
  const enquiries = formData.enquiries ?? [];
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
          {['basic-info', 'branding', 'courses', 'placements', 'about', 'achievements', 'gallery', 'enquiries'].map((tab) => (
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
              {tab === 'achievements' && 'Achievements'}
              {tab === 'gallery' && 'Gallery'}
              {tab === 'enquiries' && 'Enquiries'}
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
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={assetUploading !== null}
                    onChange={(e) => handleAssetUpload('logo', e.target.files?.[0])}
                  />
                  {assetUploading === 'logo' && <span className="text-sm text-slate-500">Uploading logo...</span>}
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
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={assetUploading !== null}
                    onChange={(e) => handleAssetUpload('banner', e.target.files?.[0])}
                  />
                  {assetUploading === 'banner' && <span className="text-sm text-slate-500">Uploading banner...</span>}
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
              <div className="form-grid">
                <div className="form-group">
                  <label>Course Name</label>
                  <input value={courseDraft.courseName} onChange={(e) => setCourseDraft({ ...courseDraft, courseName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input value={courseDraft.courseCategory} onChange={(e) => setCourseDraft({ ...courseDraft, courseCategory: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Degree Type</label>
                  <input value={courseDraft.degreeType} onChange={(e) => setCourseDraft({ ...courseDraft, degreeType: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Duration (years)</label>
                  <input type="number" value={courseDraft.duration} onChange={(e) => setCourseDraft({ ...courseDraft, duration: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Total Seats</label>
                  <input type="number" value={courseDraft.totalSeats} onChange={(e) => setCourseDraft({ ...courseDraft, totalSeats: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Annual Fee</label>
                  <input type="number" value={courseDraft.annualFee} onChange={(e) => setCourseDraft({ ...courseDraft, annualFee: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Hostel Fee</label>
                  <input type="number" value={courseDraft.hostelFee} onChange={(e) => setCourseDraft({ ...courseDraft, hostelFee: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Exams Accepted</label>
                  <input value={courseDraft.examAccepted} placeholder="JEE, CET, NEET" onChange={(e) => setCourseDraft({ ...courseDraft, examAccepted: e.target.value })} />
                </div>
                <div className="form-group full-width">
                  <label>Eligibility</label>
                  <textarea value={courseDraft.eligibility} onChange={(e) => setCourseDraft({ ...courseDraft, eligibility: e.target.value })} />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea value={courseDraft.description} onChange={(e) => setCourseDraft({ ...courseDraft, description: e.target.value })} />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="save-btn" disabled={saving || !courseDraft.courseName} onClick={handleSaveCourse}>
                  {courseDraft.id ? 'Update Course' : 'Add Course'}
                </button>
                {courseDraft.id && (
                  <button type="button" className="edit-btn" onClick={() => setCourseDraft(emptyCourse())}>
                    Cancel Edit
                  </button>
                )}
              </div>
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
                      <div className="item-actions">
                        <button type="button" onClick={() => handleEditCourse(course)}>
                          Edit
                        </button>
                        <button type="button" onClick={() => runProfileAction(() => deleteCollegeCourse(String(course.id)), 'Course deleted')}>
                          Delete
                        </button>
                      </div>
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

          {activeTab === 'achievements' && (
            <div className="form-section">
              <h2>Achievements</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Title</label>
                  <input value={achievementDraft.achievementTitle} onChange={(e) => setAchievementDraft({ ...achievementDraft, achievementTitle: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Year</label>
                  <input type="number" value={achievementDraft.achievementYear} onChange={(e) => setAchievementDraft({ ...achievementDraft, achievementYear: e.target.value })} />
                </div>
                <div className="form-group full-width">
                  <label>Image URL</label>
                  <input value={achievementDraft.achievementImageUrl} onChange={(e) => setAchievementDraft({ ...achievementDraft, achievementImageUrl: e.target.value })} />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea value={achievementDraft.description} onChange={(e) => setAchievementDraft({ ...achievementDraft, description: e.target.value })} />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="save-btn" disabled={saving || !achievementDraft.achievementTitle} onClick={handleSaveAchievement}>
                  {achievementDraft.id ? 'Update Achievement' : 'Add Achievement'}
                </button>
                {achievementDraft.id && (
                  <button type="button" className="edit-btn" onClick={() => setAchievementDraft(emptyAchievement())}>
                    Cancel Edit
                  </button>
                )}
              </div>
              <div className="courses-list">
                {achievements.map((achievement) => (
                  <div key={String(achievement.id)} className="course-item">
                    <h3>{String(achievement.achievementTitle ?? 'Untitled achievement')}</h3>
                    <p>{String(achievement.description ?? '')}</p>
                    <p className="fee">{String(achievement.achievementYear ?? '')}</p>
                    <div className="item-actions">
                      <button type="button" onClick={() => handleEditAchievement(achievement)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => runProfileAction(() => deleteCollegeAchievement(String(achievement.id)), 'Achievement deleted')}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="form-section">
              <h2>Campus Gallery</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Title</label>
                  <input value={galleryDraft.imageTitle} onChange={(e) => setGalleryDraft({ ...galleryDraft, imageTitle: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input value={galleryDraft.imageCategory} onChange={(e) => setGalleryDraft({ ...galleryDraft, imageCategory: e.target.value })} />
                </div>
                <div className="form-group full-width">
                  <label>Image URL</label>
                  <input value={galleryDraft.imageUrl} onChange={(e) => setGalleryDraft({ ...galleryDraft, imageUrl: e.target.value })} />
                </div>
                <div className="form-group full-width">
                  <label>Upload Image</label>
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setGalleryFile(e.target.files?.[0] ?? null)} />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea value={galleryDraft.imageDescription} onChange={(e) => setGalleryDraft({ ...galleryDraft, imageDescription: e.target.value })} />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="save-btn" disabled={saving || (!galleryDraft.imageUrl && !galleryFile)} onClick={handleSaveGalleryImage}>
                  {galleryDraft.id ? 'Update Image' : 'Add Image'}
                </button>
                {galleryDraft.id && (
                  <button type="button" className="edit-btn" onClick={() => setGalleryDraft(emptyGalleryImage())}>
                    Cancel Edit
                  </button>
                )}
              </div>
              <div className="gallery-admin-grid">
                {gallery.map((image) => (
                  <div key={String(image.id)} className="gallery-admin-item">
                    {image.imageUrl && <img src={String(image.imageUrl)} alt={String(image.imageTitle ?? 'Campus image')} />}
                    <h3>{String(image.imageTitle ?? 'Campus image')}</h3>
                    <p>{String(image.imageCategory ?? '')}</p>
                    <div className="item-actions">
                      <button type="button" onClick={() => handleEditGalleryImage(image)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => runProfileAction(() => deleteCollegeGalleryImage(String(image.id)), 'Gallery image deleted')}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'enquiries' && (
            <div className="form-section">
              <h2>Student Enquiries</h2>
              {enquiries.length === 0 ? (
                <p className="text-sm text-slate-500">No enquiries yet.</p>
              ) : (
                <div className="courses-list">
                  {enquiries.map((enquiry) => (
                    <div key={String(enquiry.id)} className="course-item">
                      <h3>{String(enquiry.studentName ?? 'Student')}</h3>
                      <p>{String(enquiry.message ?? '')}</p>
                      <p className="fee">
                        {String(enquiry.studentEmail ?? '')} {String(enquiry.studentPhone ?? '')}
                      </p>
                      <select
                        value={String(enquiry.status ?? 'Pending')}
                        onChange={(e) =>
                          runProfileAction(
                            () => updateCollegeEnquiry(String(enquiry.id), { status: e.target.value, isRead: true }),
                            'Enquiry updated'
                          )
                        }
                      >
                        <option>Pending</option>
                        <option>Contacted</option>
                        <option>Resolved</option>
                      </select>
                    </div>
                  ))}
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
