import api from './axios';
import type { User } from '../types';

export const register = (data: Record<string, unknown>) => api.post('/auth/register', data);

export const login = (data: { email: string; password: string }) =>
  api.post<{ success: boolean; data: { user: User; token: string } }>('/auth/login', data);

export const getProfile = () =>
  api.get<{ success: boolean; data: User }>('/auth/profile');
