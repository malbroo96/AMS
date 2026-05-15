import api from './axios';
import type { Application, ApplicationStatus } from '../types';

export const getApplications = (params?: {
  status?: ApplicationStatus;
  search?: string;
  page?: number;
  limit?: number;
}) => api.get('/applications', { params });

export const getApplication = (id: string) =>
  api.get<{ success: boolean; data: Application }>(`/applications/${id}`);

export const createApplication = (data: object) => api.post('/applications', data);

export const updateApplicationStatus = (
  id: string,
  data: { status: ApplicationStatus; remarks?: string }
) => api.put(`/applications/${id}/status`, data);
