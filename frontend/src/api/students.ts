import api from './axios';

export const getStudentProfile = () => api.get('/students/profile');

export const updateStudentProfile = (data: object) => api.put('/students/profile', data);
