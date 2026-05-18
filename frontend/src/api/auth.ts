import api from './axios';
import type { User } from '../types';

export const register = (data: {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  mobile?: string;
  gender?: string;
  dateOfBirth?: string;
  education?: string;
  interestedCollege?: string;
  password: string;
  confirmPassword: string;
  role: string;
}) => api.post('/auth/register', data);

export const login = (data: { email: string; password: string }) =>
  api.post<{ success: boolean; data: { user: User; token: string } }>('/auth/login', data);

export const getProfile = () =>
  api.get<{ success: boolean; data: User }>('/auth/profile');
