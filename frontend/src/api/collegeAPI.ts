// College API Utilities
import api from './api';

export const collegeAPI = {
  // Get all colleges
  getAllColleges: (params?: any) => 
    api.get('/colleges/all', { params }),

  // Search colleges with filters
  searchColleges: (filters?: any) => 
    api.get('/colleges/search', { params: filters }),

  // Get college by ID
  getCollege: (collegeId: string) => 
    api.get(`/colleges/${collegeId}`),

  // Get college with all details
  getCollegeDetails: (collegeId: string) => 
    api.get(`/colleges/${collegeId}/details`),

  // Create college (admin)
  createCollege: (data: any) => 
    api.post('/colleges', data),

  // Update college profile (college admin)
  updateCollege: (collegeId: string, data: any) => 
    api.put(`/colleges/${collegeId}`, data),

  // Delete college
  deleteCollege: (collegeId: string) => 
    api.delete(`/colleges/${collegeId}`),

  // Upload college logo
  uploadLogo: (collegeId: string, file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.post(`/colleges/${collegeId}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Upload college banner
  uploadBanner: (collegeId: string, file: File) => {
    const formData = new FormData();
    formData.append('banner', file);
    return api.post(`/colleges/${collegeId}/banner`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Get college dashboard stats
  getDashboardStats: (collegeId: string) => 
    api.get(`/colleges/${collegeId}/dashboard`),

  // Courses
  getCourses: (collegeId: string) => 
    api.get(`/colleges/${collegeId}/courses`),

  addCourse: (collegeId: string, data: any) => 
    api.post(`/colleges/${collegeId}/courses`, data),

  updateCourse: (collegeId: string, courseId: string, data: any) => 
    api.put(`/colleges/${collegeId}/courses/${courseId}`, data),

  deleteCourse: (collegeId: string, courseId: string) => 
    api.delete(`/colleges/${collegeId}/courses/${courseId}`),

  // Achievements
  getAchievements: (collegeId: string) => 
    api.get(`/colleges/${collegeId}/achievements`),

  addAchievement: (collegeId: string, data: any) => 
    api.post(`/colleges/${collegeId}/achievements`, data),

  updateAchievement: (collegeId: string, achievementId: string, data: any) => 
    api.put(`/colleges/${collegeId}/achievements/${achievementId}`, data),

  deleteAchievement: (collegeId: string, achievementId: string) => 
    api.delete(`/colleges/${collegeId}/achievements/${achievementId}`),

  // Gallery
  getGallery: (collegeId: string) => 
    api.get(`/colleges/${collegeId}/gallery`),

  uploadGalleryImage: (collegeId: string, file: File, metadata?: any) => {
    const formData = new FormData();
    formData.append('image', file);
    if (metadata?.title) formData.append('imageTitle', metadata.title);
    if (metadata?.category) formData.append('imageCategory', metadata.category);
    return api.post(`/colleges/${collegeId}/gallery`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  deleteGalleryImage: (collegeId: string, imageId: string) => 
    api.delete(`/colleges/${collegeId}/gallery/${imageId}`),

  // Ratings
  getRatings: (collegeId: string) => 
    api.get(`/colleges/${collegeId}/ratings`),

  submitRating: (collegeId: string, data: any) => 
    api.post(`/colleges/${collegeId}/rating`, data),

  getStudentRating: (collegeId: string) => 
    api.get(`/colleges/${collegeId}/my-rating`),

  // Student Interests
  markInterest: (collegeId: string, courseId?: string) => 
    api.post(`/colleges/${collegeId}/interest`, { courseId }),

  removeInterest: (collegeId: string) => 
    api.delete(`/colleges/${collegeId}/interest`),

  getMyInterests: () => 
    api.get('/student/interests'),

  // Enquiries
  submitEnquiry: (collegeId: string, data: any) => 
    api.post(`/colleges/${collegeId}/enquiry`, data),

  getEnquiries: (collegeId: string) => 
    api.get(`/colleges/${collegeId}/enquiries`),

  updateEnquiryStatus: (collegeId: string, enquiryId: string, status: string) => 
    api.put(`/colleges/${collegeId}/enquiries/${enquiryId}`, { status })
};

export default collegeAPI;
