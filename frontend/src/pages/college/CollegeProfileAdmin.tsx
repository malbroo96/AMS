import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { publishCollegeNotification } from '../../context/CollegeNotificationsContext';
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
  getCoursesList,
  getBranchesList,
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
  branchName: '',
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
  const [globalCourses, setGlobalCourses] = useState<Array<{ CourseID: number; CourseName: string; CourseCode?: string }>>([]);
  const [globalBranches, setGlobalBranches] = useState<Array<{ BranchID: number; CourseID: number; BranchName: string; BranchCode?: string }>>([]);

  useEffect(() => {
    getCoursesList().then((res) => setGlobalCourses(res.data.data || [])).catch(console.error);
    getBranchesList().then((res) => setGlobalBranches(res.data.data || [])).catch(console.error);
  }, []);

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
        branchName: courseDraft.branchName,
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
      getCoursesList().then((res) => setGlobalCourses(res.data.data || [])).catch(console.error);
      getBranchesList().then((res) => setGlobalBranches(res.data.data || [])).catch(console.error);
      publishCollegeNotification({
        type: 'Course',
        title: courseDraft.id ? 'Course updated' : 'Course added',
        description: `${courseDraft.courseName || 'Course'} catalog details were saved successfully.`,
        priority: 'success',
      });
    }, courseDraft.id ? 'Course updated' : 'Course added');

  const handleEditCourse = (course: Record<string, unknown>) => {
    const fees = course.fees as { annualFee?: number; hostelFee?: number } | undefined;
    setCourseDraft({
      id: String(course.id ?? ''),
      courseName: String(course.courseName ?? ''),
      branchName: String(course.branchName ?? ''),
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
          <LoadingSpinner className="size-10 text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto my-12 p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl w-12 h-12 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-slate-800">Connection Error</h2>
          <p className="text-xs text-slate-400">{error}</p>
          <button
            type="button"
            className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm transition-all"
            onClick={loadProfile}
          >
            Retry Loading
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
          
          {/* 1. Hero Section */}
          <div className="relative bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Banner Image */}
            <div className="h-48 md:h-64 w-full bg-gradient-to-r from-indigo-500 to-purple-600 relative">
              {formData.coverBannerUrl ? (
                <img
                  src={formData.coverBannerUrl}
                  alt="College Cover Banner"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-indigo-900/10 backdrop-blur-sm">
                  <svg className="w-16 h-16 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />
            </div>

            {/* Hero Info Area */}
            <div className="relative px-6 pb-6 pt-20 md:pt-6 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              {/* Logo Overlapping Banner */}
              <div className="absolute -top-16 left-6 md:-top-20 w-32 h-32 rounded-2xl bg-white p-2 shadow-md border border-slate-100 overflow-hidden flex items-center justify-center z-10">
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt="College Logo"
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-50 flex items-center justify-center rounded-xl">
                    <span className="text-3xl font-black text-indigo-600">
                      {formData.collegeName?.slice(0, 2).toUpperCase() || 'CP'}
                    </span>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="md:pl-36 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-black text-slate-805 leading-tight">
                    {formData.collegeName || 'Unnamed College'}
                  </h1>
                  {formData.status && (
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      formData.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : formData.status === 'rejected'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {formData.status}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                  <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {formData.location?.city ? `${formData.location.city}, ${formData.location.state || ''}` : 'Location not configured'}
                  </p>
                  <span className="text-slate-300 hidden sm:inline">•</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Profile Strength:</span>
                    <span className="text-sm font-extrabold text-indigo-600">{dashboard?.profileCompletionPercentage ?? 0}%</span>
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${dashboard?.profileCompletionPercentage ?? 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 self-start md:self-end mt-4 md:mt-0 z-10">
                {editMode ? (
                  <>
                    <button
                      type="button"
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-55 hover:text-slate-900 transition-all cursor-pointer"
                      onClick={() => {
                        setEditMode(false);
                        loadProfile();
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
                      onClick={handleSaveProfile}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Saving...
                        </>
                      ) : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
                    onClick={() => setEditMode(true)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. Statistics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow hover-shadow-indigo transition-all duration-200 flex items-center space-x-4">
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Applications</p>
                <p className="text-2xl font-black text-slate-805 mt-0.5">{dashboard?.totalInterestedStudents ?? 0}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow hover-shadow-indigo transition-all duration-200 flex items-center space-x-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Interested Students</p>
                <p className="text-2xl font-black text-slate-805 mt-0.5">{dashboard?.totalEnquiries ?? 0}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow hover-shadow-indigo transition-all duration-200 flex items-center space-x-4">
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Courses Offered</p>
                <p className="text-2xl font-black text-slate-805 mt-0.5">{courses.length}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow hover-shadow-indigo transition-all duration-200 flex items-center space-x-4">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Profile Completion</p>
                <p className="text-2xl font-black text-slate-805 mt-0.5">{dashboard?.profileCompletionPercentage ?? 0}%</p>
              </div>
            </div>
          </div>

          {/* 3. Modern Tab Navigation */}
          <div className="border-b border-slate-200 overflow-x-auto scrollbar-none">
            <nav className="flex space-x-8 min-w-max border-b border-slate-200">
              {[
                { id: 'basic-info', label: 'Overview' },
                { id: 'branding', label: 'Branding' },
                { id: 'courses', label: 'Courses' },
                { id: 'placements', label: 'Placements' },
                { id: 'about', label: 'About College' },
                { id: 'achievements', label: 'Achievements' },
                { id: 'gallery', label: 'Gallery' },
                { id: 'enquiries', label: 'Enquiries' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`py-4 px-1 border-b-2 font-bold text-sm transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* 4. Tab Contents */}
          <div className="mt-4">
            
            {/* Overview Tab */}
            {activeTab === 'basic-info' && (
              <div className="space-y-6">
                
                {/* General Info Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-black text-slate-800">Basic Information</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Core registry properties of the college profiles.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">College Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 transition-all duration-200 text-sm font-semibold"
                        value={formData.collegeName ?? ''}
                        onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                        disabled={!editMode}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Short Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 transition-all duration-200 text-sm font-semibold"
                        value={formData.shortName ?? ''}
                        onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                        disabled={!editMode}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Establishment Year</label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-805 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 transition-all duration-200 text-sm font-semibold"
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
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">College Type</label>
                      <select
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-805 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 transition-all duration-200 text-sm font-semibold"
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
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">University Affiliation</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-805 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 transition-all duration-200 text-sm font-semibold"
                        value={formData.universityAffiliation ?? ''}
                        onChange={(e) => setFormData({ ...formData, universityAffiliation: e.target.value })}
                        disabled={!editMode}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">NAAC Grade</label>
                      <select
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-850 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 transition-all duration-200 text-sm font-semibold"
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
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-50 pt-6">
                    <label className={`flex items-center space-x-3 p-4 rounded-2xl border transition-all duration-200 ${
                      formData.aicteApproval
                        ? 'border-indigo-200 bg-indigo-50/20 text-indigo-900'
                        : 'border-slate-200 bg-white text-slate-500'
                    } ${!editMode ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer hover:border-indigo-300'}`}>
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30 size-5 cursor-pointer disabled:cursor-not-allowed"
                        checked={formData.aicteApproval ?? false}
                        onChange={(e) => setFormData({ ...formData, aicteApproval: e.target.checked })}
                        disabled={!editMode}
                      />
                      <span className="text-sm font-bold select-none">AICTE Approved Profile</span>
                    </label>

                    <label className={`flex items-center space-x-3 p-4 rounded-2xl border transition-all duration-200 ${
                      formData.ugcRecognition
                        ? 'border-indigo-200 bg-indigo-50/20 text-indigo-900'
                        : 'border-slate-200 bg-white text-slate-500'
                    } ${!editMode ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer hover:border-indigo-300'}`}>
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30 size-5 cursor-pointer disabled:cursor-not-allowed"
                        checked={formData.ugcRecognition ?? false}
                        onChange={(e) => setFormData({ ...formData, ugcRecognition: e.target.checked })}
                        disabled={!editMode}
                      />
                      <span className="text-sm font-bold select-none">UGC Recognition Certificate</span>
                    </label>
                  </div>
                </div>

                {/* Location Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-black text-slate-800">Location Details</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Physical location details and address details.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Country</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-850 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 transition-all duration-200 text-sm font-semibold"
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
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">State</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-850 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 transition-all duration-200 text-sm font-semibold"
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
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">City</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-850 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 transition-all duration-200 text-sm font-semibold"
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
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pincode</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-850 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 transition-all duration-200 text-sm font-semibold"
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
                    <div className="space-y-1.5 col-span-1 sm:col-span-2 md:col-span-4">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Address</label>
                      <textarea
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-850 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 transition-all duration-200 text-sm font-semibold"
                        rows={3}
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
                </div>

                {/* Contact Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-black text-slate-800">Contact Information</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Primary communication details and links.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                      <input
                        type="email"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-850 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 transition-all duration-200 text-sm font-semibold"
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
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Admission Phone</label>
                      <input
                        type="tel"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-850 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 transition-all duration-200 text-sm font-semibold"
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
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Office Phone</label>
                      <input
                        type="tel"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-850 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 transition-all duration-200 text-sm font-semibold"
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
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Website URL</label>
                      <input
                        type="url"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-850 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 transition-all duration-200 text-sm font-semibold"
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
                </div>

                {editMode && (
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      className="px-6 py-3 rounded-xl border border-slate-202 text-slate-700 font-bold text-sm hover:bg-slate-55 transition-all cursor-pointer"
                      onClick={() => {
                        setEditMode(false);
                        loadProfile();
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
                      onClick={handleSaveProfile}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Branding Tab */}
            {activeTab === 'branding' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-8">
                <div>
                  <h2 className="text-lg font-black text-slate-800">College Branding Assets</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Upload logo images, cover banners, and prospectus documents.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Logo Card */}
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-700">College Logo</label>
                    <div className="relative group rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 p-6 transition-all duration-200 flex flex-col items-center justify-center text-center min-h-[220px]">
                      {formData.logoUrl ? (
                        <div className="relative w-36 h-36 rounded-xl overflow-hidden bg-white p-2 border border-slate-100 shadow-sm">
                          <img src={formData.logoUrl} alt="College Logo" className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <label className="mt-4 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm hover:shadow transition-all">
                        {assetUploading === 'logo' ? 'Uploading Logo...' : 'Choose Logo File'}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          disabled={assetUploading !== null}
                          onChange={(e) => handleAssetUpload('logo', e.target.files?.[0])}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Banner Card */}
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-700">Cover Banner</label>
                    <div className="relative group rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 p-6 transition-all duration-200 flex flex-col items-center justify-center text-center min-h-[220px] w-full">
                      {formData.coverBannerUrl ? (
                        <div className="relative w-full h-36 rounded-xl overflow-hidden shadow-sm">
                          <img src={formData.coverBannerUrl} alt="College Cover Banner" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-full h-36 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <label className="mt-4 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm hover:shadow transition-all">
                        {assetUploading === 'banner' ? 'Uploading Banner...' : 'Choose Banner File'}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          disabled={assetUploading !== null}
                          onChange={(e) => handleAssetUpload('banner', e.target.files?.[0])}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Prospectus Info */}
                <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-150 w-full mt-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Prospectus PDF Document</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formData.prospectusUrl ? 'Document successfully loaded' : 'No prospectus file configured'}
                      </p>
                    </div>
                  </div>
                  {formData.prospectusUrl && (
                    <a
                      href={formData.prospectusUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4.5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm transition-all"
                    >
                      Download Prospectus
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Courses Tab */}
            {activeTab === 'courses' && (
              <div className="space-y-8">
                
                {/* Add/Edit Course Form Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-black text-slate-800">
                      {courseDraft.id ? 'Edit Course Record' : 'Add New Course'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Provide tuition details, seats, and acceptance criteria.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Course Name</label>
                      <input
                        list="course-suggestions"
                        type="text"
                        placeholder="e.g. B.Tech, MBA, B.Sc"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm font-semibold"
                        value={courseDraft.courseName}
                        onChange={(e) => setCourseDraft({ ...courseDraft, courseName: e.target.value })}
                      />
                      <datalist id="course-suggestions">
                        {globalCourses.map((c) => (
                          <option key={c.CourseID} value={c.CourseName} />
                        ))}
                      </datalist>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Branch Name</label>
                      <input
                        list="branch-suggestions"
                        type="text"
                        placeholder="e.g. CSE, ECE, Finance"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-405 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm font-semibold"
                        value={courseDraft.branchName}
                        onChange={(e) => setCourseDraft({ ...courseDraft, branchName: e.target.value })}
                      />
                      <datalist id="branch-suggestions">
                        {(() => {
                          const selectedCourseObj = globalCourses.find(
                            (c) => c.CourseName.toLowerCase() === courseDraft.courseName.toLowerCase()
                          );
                          const filteredBranches = selectedCourseObj
                            ? globalBranches.filter((b) => b.CourseID === selectedCourseObj.CourseID)
                            : globalBranches;
                          return filteredBranches.map((b) => (
                            <option key={b.BranchID} value={b.BranchName} />
                          ));
                        })()}
                      </datalist>
                    </div>
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Duration (Years)</label>
                      <input
                        type="number"
                        step="0.5"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm font-semibold"
                        value={courseDraft.duration}
                        onChange={(e) => setCourseDraft({ ...courseDraft, duration: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Seats</label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-805 placeholder-slate-405 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm font-semibold"
                        value={courseDraft.totalSeats}
                        onChange={(e) => setCourseDraft({ ...courseDraft, totalSeats: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Annual Tuition Fee</label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-805 placeholder-slate-405 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm font-semibold"
                        value={courseDraft.annualFee}
                        onChange={(e) => setCourseDraft({ ...courseDraft, annualFee: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hostel Fee</label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-805 placeholder-slate-405 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm font-semibold"
                        value={courseDraft.hostelFee}
                        onChange={(e) => setCourseDraft({ ...courseDraft, hostelFee: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm font-semibold"
                        value={courseDraft.courseCategory}
                        onChange={(e) => setCourseDraft({ ...courseDraft, courseCategory: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Degree Type</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm font-semibold"
                        value={courseDraft.degreeType}
                        onChange={(e) => setCourseDraft({ ...courseDraft, degreeType: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Accepted Exams</label>
                      <input
                        type="text"
                        placeholder="Comma-separated (e.g. JEE, NEET, SAT)"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm font-semibold"
                        value={courseDraft.examAccepted}
                        onChange={(e) => setCourseDraft({ ...courseDraft, examAccepted: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-4">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Eligibility Criteria</label>
                      <textarea
                        rows={2}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm font-semibold"
                        value={courseDraft.eligibility}
                        onChange={(e) => setCourseDraft({ ...courseDraft, eligibility: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-4">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Course Description</label>
                      <textarea
                        rows={2}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm font-semibold"
                        value={courseDraft.description}
                        onChange={(e) => setCourseDraft({ ...courseDraft, description: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                    {courseDraft.id && (
                      <button
                        type="button"
                        className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-55 transition-all cursor-pointer"
                        onClick={() => setCourseDraft(emptyCourse())}
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button
                      type="button"
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
                      disabled={saving || !courseDraft.courseName}
                      onClick={handleSaveCourse}
                    >
                      {saving ? 'Saving...' : courseDraft.id ? 'Update Course' : 'Add Course'}
                    </button>
                  </div>
                </div>

                {/* Course Hierarchy Table List */}
                <div>
                  <h3 className="text-lg font-black text-slate-800 mb-4">Courses Catalog ({courses.length})</h3>
                  {courses.length === 0 ? (
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center text-slate-400 font-semibold text-sm">
                      No courses offered by the college yet.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {(() => {
                        const groups = courses.reduce((acc: any, course: any) => {
                          const name = String(course.courseName || 'General');
                          if (!acc[name]) acc[name] = [];
                          acc[name].push(course);
                          return acc;
                        }, {} as any);

                        return Object.entries(groups).map(([courseName, branchList]) => (
                          <div key={courseName} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                            {/* Course Header */}
                            <div className="bg-slate-50/70 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-indigo-50 text-indigo-650 rounded-xl">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                  </svg>
                                </div>
                                <h4 className="text-base font-black text-slate-805">{courseName}</h4>
                              </div>
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide bg-white border border-slate-100 px-3 py-1 rounded-full">
                                {(branchList as any[]).length} {(branchList as any[]).length === 1 ? 'Branch' : 'Branches'}
                              </span>
                            </div>

                            {/* Branches Table */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/20">
                                    <th className="px-6 py-3.5">Branch</th>
                                    <th className="px-6 py-3.5">Duration</th>
                                    <th className="px-6 py-3.5">Seats</th>
                                    <th className="px-6 py-3.5">Annual Fee</th>
                                    <th className="px-6 py-3.5">Eligibility</th>
                                    <th className="px-6 py-3.5 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                  {(branchList as any[]).map((course: any, idx: number) => (
                                    <tr key={course.id || idx} className="hover:bg-slate-50/30 transition-colors text-xs font-semibold text-slate-700">
                                      <td className="px-6 py-4 flex items-center space-x-2">
                                        <span className="text-slate-300 font-mono text-base font-light leading-none select-none">└──</span>
                                        <span className="font-extrabold text-slate-800">{String(course.branchName || 'General Branch')}</span>
                                      </td>
                                      <td className="px-6 py-4">{course.duration != null ? `${course.duration} Years` : '-'}</td>
                                      <td className="px-6 py-4">{course.totalSeats ?? '-'}</td>
                                      <td className="px-6 py-4 text-indigo-650 font-bold">
                                        {course.fees?.annualFee != null ? `₹${Number(course.fees.annualFee).toLocaleString('en-IN')}` : '-'}
                                      </td>
                                      <td className="px-6 py-4 max-w-xs truncate text-slate-500" title={String(course.eligibility || '')}>
                                        {String(course.eligibility || '-')}
                                      </td>
                                      <td className="px-6 py-4 text-right space-x-1.5">
                                        <button
                                          type="button"
                                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer"
                                          onClick={() => handleEditCourse(course)}
                                        >
                                          Edit
                                        </button>
                                        <button
                                          type="button"
                                          className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all cursor-pointer"
                                          onClick={() => runProfileAction(() => deleteCollegeCourse(String(course.id)), 'Course mapping deleted')}
                                        >
                                          Delete
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Placements Tab */}
            {activeTab === 'placements' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-black text-slate-800">Placement Statistics</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Manage recruitment statistics and package limits.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Placement Percentage</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 transition-all duration-200 text-sm font-semibold"
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
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Highest Package (LPA)</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 transition-all duration-200 text-sm font-semibold"
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
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Package (LPA)</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 transition-all duration-200 text-sm font-semibold"
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
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all cursor-pointer"
                      onClick={() => {
                        setEditMode(false);
                        loadProfile();
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-6 py-3 rounded-xl bg-indigo-650 text-white font-bold text-sm hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
                      disabled={saving}
                      onClick={handleSaveProfile}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-black text-slate-800">About College</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Narrative descriptions, vision statement, mission statement, and messages.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Summary Description</label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 transition-all duration-200 text-sm font-semibold"
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
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vision Statement</label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 transition-all duration-200 text-sm font-semibold"
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
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mission Statement</label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-805 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 transition-all duration-200 text-sm font-semibold"
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
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Principal&apos;s Message</label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 transition-all duration-200 text-sm font-semibold"
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
                </div>

                {editMode && (
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all cursor-pointer"
                      onClick={() => {
                        setEditMode(false);
                        loadProfile();
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
                      disabled={saving}
                      onClick={handleSaveProfile}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Achievements Tab */}
            {activeTab === 'achievements' && (
              <div className="space-y-8">
                
                {/* Add/Edit Achievement Form */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-black text-slate-800">
                      {achievementDraft.id ? 'Edit Achievement Record' : 'Add Achievement'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Publish awards, certifications, rankings, and events.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Achievement Title</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm font-semibold"
                        value={achievementDraft.achievementTitle}
                        onChange={(e) => setAchievementDraft({ ...achievementDraft, achievementTitle: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Achievement Year</label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm font-semibold"
                        value={achievementDraft.achievementYear}
                        onChange={(e) => setAchievementDraft({ ...achievementDraft, achievementYear: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-3">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Image Link / URL</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm font-semibold"
                        value={achievementDraft.achievementImageUrl}
                        onChange={(e) => setAchievementDraft({ ...achievementDraft, achievementImageUrl: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-3">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
                      <textarea
                        rows={3}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm font-semibold"
                        value={achievementDraft.description}
                        onChange={(e) => setAchievementDraft({ ...achievementDraft, description: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                    {achievementDraft.id && (
                      <button
                        type="button"
                        className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                        onClick={() => setAchievementDraft(emptyAchievement())}
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button
                      type="button"
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
                      disabled={saving || !achievementDraft.achievementTitle}
                      onClick={handleSaveAchievement}
                    >
                      {saving ? 'Saving...' : achievementDraft.id ? 'Update Achievement' : 'Add Achievement'}
                    </button>
                  </div>
                </div>

                {/* Achievements List catalog */}
                <div>
                  <h3 className="text-lg font-black text-slate-800 mb-4">Achievements Catalog ({achievements.length})</h3>
                  {achievements.length === 0 ? (
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center text-slate-400 font-semibold text-sm">
                      No achievements added yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {achievements.map((achievement) => (
                        <div
                          key={String(achievement.id)}
                          className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm hover:shadow hover-shadow-indigo transition-all duration-200 flex flex-col justify-between"
                        >
                          <div className="flex gap-4">
                            {!!achievement.achievementImageUrl && (
                              <img
                                src={String(achievement.achievementImageUrl)}
                                alt="Achievement Icon"
                                className="w-20 h-20 rounded-2xl object-cover border border-slate-100 bg-slate-50"
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="text-lg font-black text-slate-850 leading-snug">
                                {String(achievement.achievementTitle ?? 'Untitled Achievement')}
                              </h4>
                              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md mt-1 inline-block uppercase tracking-wide">
                                Year: {String(achievement.achievementYear ?? '')}
                              </span>
                              <p className="text-xs text-slate-450 mt-3 leading-relaxed line-clamp-3">
                                {String(achievement.description ?? '')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-end space-x-2 border-t border-slate-50 pt-4 mt-6">
                            <button
                              type="button"
                              className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-655 text-xs font-bold hover:bg-slate-55 hover:text-slate-900 transition-all cursor-pointer"
                              onClick={() => handleEditAchievement(achievement)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="px-3.5 py-2 rounded-lg bg-rose-50 text-rose-655 text-xs font-bold hover:bg-rose-100 transition-all cursor-pointer"
                              onClick={() => runProfileAction(() => deleteCollegeAchievement(String(achievement.id)), 'Achievement deleted')}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Gallery Tab */}
            {activeTab === 'gallery' && (
              <div className="space-y-8">
                
                {/* Add/Edit Gallery Image Form */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-black text-slate-805">
                      {galleryDraft.id ? 'Edit Image Meta' : 'Add Gallery Image'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Upload photos of campus infrastructure, library, and labs.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Image Title</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm font-semibold"
                        value={galleryDraft.imageTitle}
                        onChange={(e) => setGalleryDraft({ ...galleryDraft, imageTitle: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm font-semibold"
                        value={galleryDraft.imageCategory}
                        onChange={(e) => setGalleryDraft({ ...galleryDraft, imageCategory: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-3">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">External Image URL</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm font-semibold"
                        value={galleryDraft.imageUrl}
                        onChange={(e) => setGalleryDraft({ ...galleryDraft, imageUrl: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-3">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upload Custom File</label>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none text-sm font-semibold cursor-pointer"
                        onChange={(e) => setGalleryFile(e.target.files?.[0] ?? null)}
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-3">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
                      <textarea
                        rows={2}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm font-semibold"
                        value={galleryDraft.imageDescription}
                        onChange={(e) => setGalleryDraft({ ...galleryDraft, imageDescription: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                    {galleryDraft.id && (
                      <button
                        type="button"
                        className="px-5 py-2.5 rounded-xl border border-slate-202 text-slate-705 font-bold text-xs hover:bg-slate-55 transition-all cursor-pointer"
                        onClick={() => setGalleryDraft(emptyGalleryImage())}
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button
                      type="button"
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
                      disabled={saving || (!galleryDraft.imageUrl && !galleryFile)}
                      onClick={handleSaveGalleryImage}
                    >
                      {saving ? 'Saving...' : galleryDraft.id ? 'Update Image' : 'Add Image'}
                    </button>
                  </div>
                </div>

                {/* Gallery Grid items catalog */}
                <div>
                  <h3 className="text-lg font-black text-slate-800 mb-4">Campus Photos ({gallery.length})</h3>
                  {gallery.length === 0 ? (
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center text-slate-400 font-semibold text-sm">
                      No gallery images uploaded yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {gallery.map((image) => (
                        <div
                          key={String(image.id)}
                          className="bg-white rounded-3xl border border-slate-150 shadow-sm overflow-hidden hover:shadow hover-shadow-indigo transition-all duration-200 flex flex-col justify-between"
                        >
                          <div>
                            <div className="aspect-[16/10] bg-slate-100 relative overflow-hidden">
                              {image.imageUrl ? (
                                <img
                                  src={String(image.imageUrl)}
                                  alt={String(image.imageTitle ?? 'Campus')}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs font-bold">No Image Preview</div>
                              )}
                              <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-900/60 backdrop-blur-sm text-white uppercase tracking-wider">
                                {String(image.imageCategory || 'General')}
                              </span>
                            </div>
                            <div className="p-5">
                              <h4 className="font-black text-slate-800 text-sm line-clamp-1">
                                {String(image.imageTitle ?? 'Campus Photo')}
                              </h4>
                              {!!image.imageDescription && (
                                <p className="text-xs text-slate-450 mt-2 line-clamp-2 leading-relaxed">
                                  {String(image.imageDescription)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="px-5 pb-5">
                            <div className="flex items-center justify-end space-x-2 border-t border-slate-50 pt-4 mt-2">
                              <button
                                type="button"
                                className="px-3.5 py-1.5 rounded-lg border border-slate-205 text-slate-655 text-[10px] font-bold hover:bg-slate-55 hover:text-slate-900 transition-all cursor-pointer"
                                onClick={() => handleEditGalleryImage(image)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="px-3.5 py-1.5 rounded-lg bg-rose-50 text-rose-655 text-[10px] font-bold hover:bg-rose-105 transition-all cursor-pointer"
                                onClick={() => runProfileAction(() => deleteCollegeGalleryImage(String(image.id)), 'Gallery image deleted')}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Enquiries Tab */}
            {activeTab === 'enquiries' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-slate-805">Student Enquiries</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Filter, read, and update communications from prospective students.</p>
                </div>

                {enquiries.length === 0 ? (
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center text-slate-400 font-semibold text-sm">
                    No student inquiries received yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {enquiries.map((enquiry) => (
                      <div
                        key={String(enquiry.id)}
                        className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm hover:shadow hover-shadow-indigo transition-all duration-200 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-4">
                            <h4 className="text-base font-black text-slate-800 leading-snug">
                              {String(enquiry.studentName ?? 'Student Request')}
                            </h4>
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              enquiry.status === 'Resolved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : enquiry.status === 'Contacted'
                                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {String(enquiry.status ?? 'Pending')}
                            </span>
                          </div>
                          
                          <p className="text-sm text-slate-600 mt-4 italic bg-slate-50/50 p-4 rounded-2xl border border-slate-100 leading-relaxed font-medium">
                            &ldquo;{String(enquiry.message ?? '')}&rdquo;
                          </p>
                          
                          <div className="text-xs font-bold text-slate-400 mt-4 flex flex-col space-y-1.5">
                            <span className="flex items-center gap-2">
                              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {String(enquiry.studentEmail ?? '')}
                            </span>
                            <span className="flex items-center gap-2">
                              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              {String(enquiry.studentPhone ?? '')}
                            </span>
                          </div>
                        </div>

                        <div className="border-t border-slate-50 pt-4 mt-6 flex items-center justify-between">
                          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Status:</span>
                          <select
                            value={String(enquiry.status ?? 'Pending')}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition-all"
                            onChange={(e) =>
                              runProfileAction(
                                () => updateCollegeEnquiry(String(enquiry.id), { status: e.target.value, isRead: true }),
                                'Enquiry status updated'
                              )
                            }
                          >
                            <option>Pending</option>
                            <option>Contacted</option>
                            <option>Resolved</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default CollegeProfileAdmin;
