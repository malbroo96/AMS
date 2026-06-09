// Custom Hooks for College Portal
import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import collegeAPI from '../api/collegeAPI';
import {
  fetchColleges,
  searchColleges,
  fetchCollegeDetails,
  updateCollegeProfile
} from '../redux/slices/collegeSlice';

// Hook to fetch and manage college list
export const useCollegeList = (initialFilters?: any) => {
  const dispatch = useDispatch();
  const { colleges, loading, error, pagination } = useSelector((state: any) => state.colleges);

  const loadColleges = useCallback((page = 1, limit = 10) => {
    dispatch(fetchColleges({ page, limit, ...initialFilters }) as any);
  }, [dispatch, initialFilters]);

  return { colleges, loading, error, pagination, loadColleges };
};

// Hook to search colleges with filters
export const useCollegeSearch = () => {
  const dispatch = useDispatch();
  const { searchResults, loading, error } = useSelector((state: any) => state.colleges);

  const search = useCallback((filters: any) => {
    dispatch(searchColleges(filters) as any);
  }, [dispatch]);

  return { searchResults, loading, error, search };
};

// Hook to fetch college details
export const useCollegeDetails = (collegeId?: string) => {
  const dispatch = useDispatch();
  const { currentCollege, loading, error } = useSelector((state: any) => state.colleges);

  const loadDetails = useCallback(() => {
    if (collegeId) {
      dispatch(fetchCollegeDetails(collegeId) as any);
    }
  }, [collegeId, dispatch]);

  return { college: currentCollege, loading, error, loadDetails };
};

// Hook to upload files
export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const uploadLogo = useCallback(async (collegeId: string, file: File) => {
    try {
      setUploading(true);
      const response = await collegeAPI.uploadLogo(collegeId, file);
      return response.data.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const uploadBanner = useCallback(async (collegeId: string, file: File) => {
    try {
      setUploading(true);
      const response = await collegeAPI.uploadBanner(collegeId, file);
      return response.data.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const uploadGalleryImage = useCallback(async (collegeId: string, file: File, metadata?: any) => {
    try {
      setUploading(true);
      const response = await collegeAPI.uploadGalleryImage(collegeId, file, metadata);
      return response.data.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return { uploadLogo, uploadBanner, uploadGalleryImage, uploading, error };
};

// Hook to manage college profile
export const useCollegeProfile = (collegeId?: string) => {
  const dispatch = useDispatch();
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const { currentCollege } = useSelector((state: any) => state.colleges);

  const updateProfile = useCallback(async (data: any) => {
    try {
      setUpdating(true);
      if (collegeId) {
        dispatch(updateCollegeProfile({ collegeId, data }) as any);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  }, [collegeId, dispatch]);

  return { profile: currentCollege, updating, error, updateProfile };
};

// Hook to manage college ratings
export const useCollegeRatings = (collegeId?: string) => {
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRatings = useCallback(async () => {
    if (!collegeId) return;
    try {
      setLoading(true);
      const response = await collegeAPI.getRatings(collegeId);
      setRatings(response.data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [collegeId]);

  const submitRating = useCallback(async (ratingData: any) => {
    if (!collegeId) return;
    try {
      setLoading(true);
      const response = await collegeAPI.submitRating(collegeId, ratingData);
      setRatings([...ratings, response.data.data]);
      return response.data.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [collegeId, ratings]);

  return { ratings, loading, error, fetchRatings, submitRating };
};

// Hook to manage student interests
export const useStudentInterests = () => {
  const [interests, setInterests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInterests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await collegeAPI.getMyInterests();
      setInterests(response.data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const markInterest = useCallback(async (collegeId: string, courseId?: string) => {
    try {
      setLoading(true);
      const response = await collegeAPI.markInterest(collegeId, courseId);
      setInterests([...interests, response.data.data]);
      return response.data.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [interests]);

  const removeInterest = useCallback(async (collegeId: string) => {
    try {
      setLoading(true);
      await collegeAPI.removeInterest(collegeId);
      setInterests(interests.filter(i => i.collegeId !== collegeId));
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [interests]);

  return { interests, loading, error, fetchInterests, markInterest, removeInterest };
};

// Hook to submit enquiry
export const useEnquiry = (collegeId?: string) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const submitEnquiry = useCallback(async (enquiryData: any) => {
    if (!collegeId) return;
    try {
      setSubmitting(true);
      const response = await collegeAPI.submitEnquiry(collegeId, enquiryData);
      setSuccess(true);
      return response.data.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [collegeId]);

  return { submitting, error, success, submitEnquiry };
};

// Hook to manage college courses
export const useCollegeCourses = (collegeId?: string) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCourses = useCallback(async () => {
    if (!collegeId) return;
    try {
      setLoading(true);
      const response = await collegeAPI.getCourses(collegeId);
      setCourses(response.data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [collegeId]);

  const addCourse = useCallback(async (courseData: any) => {
    if (!collegeId) return;
    try {
      setLoading(true);
      const response = await collegeAPI.addCourse(collegeId, courseData);
      setCourses([...courses, response.data.data]);
      return response.data.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [collegeId, courses]);

  const updateCourse = useCallback(async (courseId: string, courseData: any) => {
    if (!collegeId) return;
    try {
      setLoading(true);
      const response = await collegeAPI.updateCourse(collegeId, courseId, courseData);
      setCourses(courses.map(c => c._id === courseId ? response.data.data : c));
      return response.data.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [collegeId, courses]);

  const deleteCourse = useCallback(async (courseId: string) => {
    if (!collegeId) return;
    try {
      setLoading(true);
      await collegeAPI.deleteCourse(collegeId, courseId);
      setCourses(courses.filter(c => c._id !== courseId));
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [collegeId, courses]);

  return { courses, loading, error, fetchCourses, addCourse, updateCourse, deleteCourse };
};

export default {
  useCollegeList,
  useCollegeSearch,
  useCollegeDetails,
  useFileUpload,
  useCollegeProfile,
  useCollegeRatings,
  useStudentInterests,
  useEnquiry,
  useCollegeCourses
};
