import api from './axios';
import type { ProfileDocumentType } from '../types/studentProfile';

export interface StudentProfileApiResponse {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  student?: {
    id: string;
    dob?: string | null;
    gender?: string | null;
    parentName?: string | null;
    address?: string | null;
    grade?: string | null;
    board?: string | null;
    percentage?: number | null;
    profileImage?: string | null;
  } | null;
}

/** GET /api/students/profile */
export const getStudentProfile = () =>
  api.get<{ success: boolean; data: StudentProfileApiResponse }>('/students/profile');

/** PUT /api/students/profile */
export const updateStudentProfile = (data: object) =>
  api.put<{ success: boolean; data: StudentProfileApiResponse }>('/students/profile', data);

/** POST /api/upload/profile — persisted via student profile update on backend */
export const uploadProfilePhoto = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return api.post<{ success: boolean; data: { fileUrl: string } }>('/upload/profile', form);
};

/**
 * POST /api/students/profile/document
 * Uses /upload until dedicated profile document route is available.
 */
export const uploadProfileDocument = (file: File, documentType: ProfileDocumentType) => {
  const form = new FormData();
  form.append('file', file);
  form.append('documentType', documentType);
  return api.post<{ success: boolean; data: { fileUrl: string; documentType: string } }>(
    '/students/profile/document',
    form
  ).catch(async () => {
    return api.post<{ success: boolean; data: { fileUrl: string; documentType: string } }>('/upload', form);
  });
};
