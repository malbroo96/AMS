// Student Interest Redux Slice
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/api';

// Async Thunks
export const fetchStudentInterests = createAsyncThunk(
  'studentInterests/fetchInterests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/student/interests');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching interests');
    }
  }
);

export const markCollegeInterest = createAsyncThunk(
  'studentInterests/markInterest',
  async ({ collegeId, courseId }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/colleges/${collegeId}/interest`, { courseId });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error marking interest');
    }
  }
);

export const removeCollegeInterest = createAsyncThunk(
  'studentInterests/removeInterest',
  async (collegeId, { rejectWithValue }) => {
    try {
      await api.delete(`/colleges/${collegeId}/interest`);
      return collegeId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error removing interest');
    }
  }
);

export const submitCollegeEnquiry = createAsyncThunk(
  'studentInterests/submitEnquiry',
  async ({ collegeId, enquiryData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/colleges/${collegeId}/enquiry`, enquiryData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error submitting enquiry');
    }
  }
);

export const submitCollegeRating = createAsyncThunk(
  'studentInterests/submitRating',
  async ({ collegeId, ratingData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/colleges/${collegeId}/rating`, ratingData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error submitting rating');
    }
  }
);

export const fetchCollegeRatings = createAsyncThunk(
  'studentInterests/fetchRatings',
  async (collegeId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/colleges/${collegeId}/ratings`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching ratings');
    }
  }
);

const initialState = {
  interestedColleges: [],
  collegeRatings: [],
  studentRating: null,
  loading: false,
  error: null,
  enquirySuccess: false
};

const studentInterestSlice = createSlice({
  name: 'studentInterests',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearEnquirySuccess: (state) => {
      state.enquirySuccess = false;
    }
  },
  extraReducers: (builder) => {
    // Fetch Student Interests
    builder
      .addCase(fetchStudentInterests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentInterests.fulfilled, (state, action) => {
        state.loading = false;
        state.interestedColleges = action.payload;
      })
      .addCase(fetchStudentInterests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Mark Interest
    builder
      .addCase(markCollegeInterest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markCollegeInterest.fulfilled, (state, action) => {
        state.loading = false;
        if (!state.interestedColleges.find(c => c.collegeId === action.payload.collegeId)) {
          state.interestedColleges.push(action.payload);
        }
      })
      .addCase(markCollegeInterest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Remove Interest
    builder
      .addCase(removeCollegeInterest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeCollegeInterest.fulfilled, (state, action) => {
        state.loading = false;
        state.interestedColleges = state.interestedColleges.filter(
          c => c.collegeId !== action.payload
        );
      })
      .addCase(removeCollegeInterest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Submit Enquiry
    builder
      .addCase(submitCollegeEnquiry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitCollegeEnquiry.fulfilled, (state) => {
        state.loading = false;
        state.enquirySuccess = true;
      })
      .addCase(submitCollegeEnquiry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Submit Rating
    builder
      .addCase(submitCollegeRating.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitCollegeRating.fulfilled, (state, action) => {
        state.loading = false;
        state.studentRating = action.payload;
      })
      .addCase(submitCollegeRating.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Ratings
    builder
      .addCase(fetchCollegeRatings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCollegeRatings.fulfilled, (state, action) => {
        state.loading = false;
        state.collegeRatings = action.payload;
      })
      .addCase(fetchCollegeRatings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearEnquirySuccess } = studentInterestSlice.actions;
export default studentInterestSlice.reducer;
