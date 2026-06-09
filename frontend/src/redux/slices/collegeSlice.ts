// College Redux Slice
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/api';

// Async Thunks
export const fetchColleges = createAsyncThunk(
  'colleges/fetchColleges',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/colleges/all', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching colleges');
    }
  }
);

export const searchColleges = createAsyncThunk(
  'colleges/search',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/colleges/search', { params: filters });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error searching colleges');
    }
  }
);

export const fetchCollegeDetails = createAsyncThunk(
  'colleges/fetchDetails',
  async (collegeId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/colleges/${collegeId}/details`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching college details');
    }
  }
);

export const updateCollegeProfile = createAsyncThunk(
  'colleges/updateProfile',
  async ({ collegeId, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/colleges/${collegeId}`, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error updating college');
    }
  }
);

export const fetchCollegeDashboard = createAsyncThunk(
  'colleges/fetchDashboard',
  async (collegeId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/colleges/${collegeId}/dashboard`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching dashboard');
    }
  }
);

const initialState = {
  colleges: [],
  currentCollege: null,
  collegeDashboard: null,
  pagination: { currentPage: 1, totalPages: 1, total: 0 },
  loading: false,
  error: null,
  searchResults: [],
  filters: {}
};

const collegeSlice = createSlice({
  name: 'colleges',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearColleges: (state) => {
      state.colleges = [];
      state.searchResults = [];
    }
  },
  extraReducers: (builder) => {
    // Fetch Colleges
    builder
      .addCase(fetchColleges.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchColleges.fulfilled, (state, action) => {
        state.loading = false;
        state.colleges = action.payload.colleges || action.payload;
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchColleges.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Search Colleges
    builder
      .addCase(searchColleges.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchColleges.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchColleges.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch College Details
    builder
      .addCase(fetchCollegeDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCollegeDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCollege = action.payload;
      })
      .addCase(fetchCollegeDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update College Profile
    builder
      .addCase(updateCollegeProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCollegeProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCollege = action.payload;
      })
      .addCase(updateCollegeProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch College Dashboard
    builder
      .addCase(fetchCollegeDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCollegeDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.collegeDashboard = action.payload;
      })
      .addCase(fetchCollegeDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { setFilters, clearError, clearColleges } = collegeSlice.actions;
export default collegeSlice.reducer;
