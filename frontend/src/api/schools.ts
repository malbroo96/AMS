import api from './axios';
import type { Course, School } from '../types';

export const getSchools = (params?: { search?: string; page?: number; limit?: number }) =>
  api.get('/schools', { params });

export const getSchool = (id: string) => api.get<{ success: boolean; data: School }>(`/schools/${id}`);

export const createSchool = (data: Partial<School>) => api.post('/schools', data);

export const updateSchool = (id: string, data: Partial<School>) => api.put(`/schools/${id}`, data);

export const deleteSchool = (id: string) => api.delete(`/schools/${id}`);

export const getCourses = (schoolId: string) =>
  api.get<{ success: boolean; data: Course[] }>(`/schools/${schoolId}/courses`);

export const addCourse = (schoolId: string, data: Partial<Course>) =>
  api.post(`/schools/${schoolId}/courses`, data);
