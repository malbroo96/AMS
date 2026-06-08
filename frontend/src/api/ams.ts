import api from './axios';
import type { College, Interest, StudentProfile } from '../types';

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
    topRecruiters?: string[];
  };
  about?: {
    summaryDescription?: string;
    visionStatement?: string;
    missionStatement?: string;
    principalMessage?: string;
  };
  courses?: Array<Record<string, unknown>>;
  achievements?: Array<Record<string, unknown>>;
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
