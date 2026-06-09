// College Course Redux Slice
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/api';

// Async Thunks
export const fetchCollegeCourses = createAsyncThunk(
  'collegeCourses/fetchCourses',
  async (collegeId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/colleges/${collegeId}/courses`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching courses');
    }
  }
);

export const addCourse = createAsyncThunk(
  'collegeCourses/addCourse',
  async ({ collegeId, courseData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/colleges/${collegeId}/courses`, courseData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error adding course');
    }
  }
);

export const updateCourse = createAsyncThunk(
  'collegeCourses/updateCourse',
  async ({ collegeId, courseId, courseData }, { rejectWithValue }) => {
    try {
      const response = await api.put(
        `/colleges/${collegeId}/courses/${courseId}`,
        courseData
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error updating course');
    }
  }
);

export const deleteCourse = createAsyncThunk(
  'collegeCourses/deleteCourse',
  async ({ collegeId, courseId }, { rejectWithValue }) => {
    try {
      await api.delete(`/colleges/${collegeId}/courses/${courseId}`);
      return courseId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error deleting course');
    }
  }
);

const initialState = {
  courses: [],
  loading: false,
  error: null
};

const collegeCourseSlice = createSlice({
  name: 'collegeCourses',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Fetch Courses
    builder
      .addCase(fetchCollegeCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCollegeCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload;
      })
      .addCase(fetchCollegeCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Add Course
    builder
      .addCase(addCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.courses.push(action.payload);
      })
      .addCase(addCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update Course
    builder
      .addCase(updateCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.courses.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.courses[index] = action.payload;
        }
      })
      .addCase(updateCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete Course
    builder
      .addCase(deleteCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = state.courses.filter(c => c.id !== action.payload);
      })
      .addCase(deleteCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError } = collegeCourseSlice.actions;
export default collegeCourseSlice.reducer;
