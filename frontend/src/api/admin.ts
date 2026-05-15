import api from './axios';

export const getSchoolAdmins = (params?: { search?: string; page?: number; limit?: number }) =>
  api.get('/users/admins', { params });

export const createSchoolAdmin = (data: object) => api.post('/users/admins', data);

export const deleteSchoolAdmin = (id: string) => api.delete(`/users/admins/${id}`);

export const getAnalytics = () => api.get('/analytics/dashboard');

export const uploadDocument = (file: File, documentType: string) => {
  const form = new FormData();
  form.append('file', file);
  form.append('documentType', documentType);
  return api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
