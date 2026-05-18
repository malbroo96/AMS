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

export const getAdminDashboard = () =>
  api.get<{ success: boolean; data: Record<string, unknown> }>('/ams/admin/dashboard');

export const getAdminStudents = () =>
  api.get<{ success: boolean; data: StudentProfile[] }>('/ams/admin/students');

export const getAdminInterests = () =>
  api.get<{ success: boolean; data: Interest[] }>('/ams/admin/interests');

export const createCollege = (data: { collegeName: string; email: string; password?: string; status?: string }) =>
  api.post('/ams/admin/colleges', data);

export const updateCollege = (id: string, data: Partial<College>) =>
  api.put(`/ams/admin/colleges/${id}`, data);

export const deleteCollege = (id: string) =>
  api.delete(`/ams/admin/colleges/${id}`);

export const setInterestPermission = (id: string, approvedByAdmin: boolean) =>
  api.patch(`/ams/admin/interests/${id}/permission`, { approvedByAdmin });
