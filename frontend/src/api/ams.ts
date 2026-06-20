import api from './axios';
import type { College, Interest, StudentProfile, CollegeCourse } from '../types';

export const getColleges = (params?: { search?: string; status?: string }) =>
  api.get<{ success: boolean; data: College[] }>('/ams/colleges', { params });

export const getStudentDashboard = () =>
  api.get<{ success: boolean; data: { student: StudentProfile; stats: Record<string, number>; interests: Interest[] } }>('/ams/student/dashboard');

export const markCollegeInterest = (collegeId: string) =>
  api.post('/ams/student/interests', { collegeId });

export const getCollegeDashboard = () =>
  api.get<{ success: boolean; data: { college: College; stats: Record<string, number>; students: Array<Record<string, unknown>> } }>('/ams/college/dashboard');

export interface CollegeProfileData {
  id: string;
  collegeName: string;
  shortName?: string;
  establishmentYear?: number | null;
  collegeType?: string;
  universityAffiliation?: string;
  naacGrade?: string;
  aicteApproval?: boolean;
  ugcRecognition?: boolean;
  email: string;
  status: string;
  logoUrl?: string | null;
  coverBannerUrl?: string | null;
  prospectusUrl?: string | null;
  location?: {
    country?: string;
    state?: string;
    city?: string;
    pincode?: string;
    fullAddress?: string;
  };
  contact?: {
    emailAddress?: string;
    admissionMobileNumber?: string;
    officeMobileNumber?: string;
    websiteUrl?: string;
  };
  placements?: {
    placementPercentage?: number | null;
    highestPackage?: string;
    averagePackage?: string;
    topRecruiters?: Array<string | { recruiterName?: string; recruiterLogoUrl?: string }>;
  };
  about?: {
    summaryDescription?: string;
    visionStatement?: string;
    missionStatement?: string;
    principalMessage?: string;
  };
  courses?: CollegeCourse[];
  branches?: string[];
  achievements?: Array<Record<string, unknown>>;
  gallery?: Array<Record<string, unknown>>;
  enquiries?: Array<Record<string, unknown>>;
  facilities?: string[];
  dashboard?: {
    totalStudentViews?: number;
    totalEnquiries?: number;
    totalInterestedStudents?: number;
    profileCompletionPercentage?: number;
  };
}

export const getCollegeProfile = () =>
  api.get<{ success: boolean; data: CollegeProfileData }>('/ams/college/profile');

export const updateCollegeProfile = (data: Partial<CollegeProfileData>) =>
  api.put<{ success: boolean; data: CollegeProfileData }>('/ams/college/profile', data);

export const searchCollegeProfiles = (params?: Record<string, unknown>) =>
  api.get<{ success: boolean; data: CollegeProfileData[] }>('/ams/college-search', { params });

export const getPublicCollegeProfile = (collegeId: string) =>
  api.get<{ success: boolean; data: CollegeProfileData }>(`/ams/college-search/${collegeId}`);

export const createCollegeCourse = (data: Record<string, unknown>) =>
  api.post('/ams/college/profile/courses', data);

export const updateCollegeCourse = (courseId: string, data: Record<string, unknown>) =>
  api.put(`/ams/college/profile/courses/${courseId}`, data);

export const deleteCollegeCourse = (courseId: string) =>
  api.delete(`/ams/college/profile/courses/${courseId}`);

export const createCollegeAchievement = (data: Record<string, unknown>) =>
  api.post('/ams/college/profile/achievements', data);

export const updateCollegeAchievement = (achievementId: string, data: Record<string, unknown>) =>
  api.put(`/ams/college/profile/achievements/${achievementId}`, data);

export const deleteCollegeAchievement = (achievementId: string) =>
  api.delete(`/ams/college/profile/achievements/${achievementId}`);

export const createCollegeGalleryImage = (data: Record<string, unknown>, file?: File | null) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, String(value));
  });
  if (file) formData.append('file', file);
  return api.post('/ams/college/profile/gallery', formData);
};

export const updateCollegeGalleryImage = (imageId: string, data: Record<string, unknown>, file?: File | null) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, String(value));
  });
  if (file) formData.append('file', file);
  return api.put(`/ams/college/profile/gallery/${imageId}`, formData);
};

export const deleteCollegeGalleryImage = (imageId: string) =>
  api.delete(`/ams/college/profile/gallery/${imageId}`);

export const submitCollegeProfileEnquiry = (collegeId: string, data: Record<string, unknown>) =>
  api.post(`/ams/college-search/${collegeId}/enquiries`, data);

export const updateCollegeEnquiry = (enquiryId: string, data: Record<string, unknown>) =>
  api.put(`/ams/college/profile/enquiries/${enquiryId}`, data);

export interface CollegeAssets {
  collegeId: string;
  collegeName: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  updatedOn: string | null;
}

export const getCollegeAssets = (collegeId: string) =>
  api.get<{ success: boolean; data: CollegeAssets }>(`/college/assets/${collegeId}`);

export const uploadCollegeLogo = (file: File, collegeId?: string) => {
  const formData = new FormData();
  formData.append('file', file);
  if (collegeId) formData.append('collegeId', collegeId);
  return api.post('/college/upload-logo', formData);
};

export const uploadCollegeBanner = (file: File, collegeId?: string) => {
  const formData = new FormData();
  formData.append('file', file);
  if (collegeId) formData.append('collegeId', collegeId);
  return api.post('/college/upload-banner', formData);
};

export const deleteCollegeLogo = (collegeId: string) =>
  api.delete(`/college/delete-logo/${collegeId}`);

export const getAdminDashboard = () =>
  api.get<{ success: boolean; data: Record<string, unknown> }>('/ams/admin/dashboard');

export const getAdminStudents = () =>
  api.get<{ success: boolean; data: StudentProfile[] }>('/ams/admin/students');

export const createStudent = (data: {
  name: string;
  email: string;
  mobile?: string;
  password?: string;
  address?: string;
  gender?: string;
  dateOfBirth?: string;
  education?: string;
  interestedCollege?: string;
}) => api.post('/ams/admin/students', data);

export const updateStudent = (id: string, data: Partial<StudentProfile> & { password?: string }) =>
  api.put(`/ams/admin/students/${id}`, data);

export const deleteStudent = (id: string) =>
  api.delete(`/ams/admin/students/${id}`);

export const getAdminInterests = () =>
  api.get<{ success: boolean; data: Interest[] }>('/ams/admin/interests');

export const createCollege = (data: { collegeName: string; email: string; password?: string; status?: string }) =>
  api.post('/ams/admin/colleges', data);

export const updateCollege = (id: string, data: Partial<College> & { password?: string }) =>
  api.put(`/ams/admin/colleges/${id}`, data);

export const deleteCollege = (id: string) =>
  api.delete(`/ams/admin/colleges/${id}`);

export const setInterestPermission = (id: string, approvedByAdmin: boolean) =>
  api.patch(`/ams/admin/interests/${id}/permission`, { approvedByAdmin });

export const getCoursesList = () =>
  api.get<{ success: boolean; data: Array<{ CourseID: number; CourseName: string; CourseCode?: string }> }>('/ams/courses');

export const getBranchesList = () =>
  api.get<{ success: boolean; data: Array<{ BranchID: number; CourseID: number; BranchName: string; BranchCode?: string }> }>('/ams/branches');
