import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchDashboardStats  = createAsyncThunk('dashboard/stats',    async (_,t) => { try { const {data}=await api.get('/dashboard/stats');         return data.stats; } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const fetchRevenueChart    = createAsyncThunk('dashboard/revenue',   async (_,t) => { try { const {data}=await api.get('/dashboard/revenue-chart'); return data.data;  } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const fetchSalesTrend      = createAsyncThunk('dashboard/sales',     async (_,t) => { try { const {data}=await api.get('/dashboard/sales-trend');   return data.data;  } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const fetchTopProducts     = createAsyncThunk('dashboard/products',  async (_,t) => { try { const {data}=await api.get('/dashboard/top-products');  return data.data;  } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    stats: null, revenueChart: [], salesTrend: [], topProducts: [],
    loading: false, error: null,
  },
  reducers: {},
  extraReducers: (b) => {
    b
      .addCase(fetchDashboardStats.pending,   (s)   => { s.loading = true; })
      .addCase(fetchDashboardStats.fulfilled, (s,a) => { s.loading = false; s.stats = a.payload; })
      .addCase(fetchDashboardStats.rejected,  (s,a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchRevenueChart.fulfilled,   (s,a) => { s.revenueChart = a.payload; })
      .addCase(fetchSalesTrend.fulfilled,     (s,a) => { s.salesTrend   = a.payload; })
      .addCase(fetchTopProducts.fulfilled,    (s,a) => { s.topProducts  = a.payload; });
  }
});

export default dashboardSlice.reducer;