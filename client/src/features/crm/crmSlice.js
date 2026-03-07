import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchCRMStats    = createAsyncThunk('crm/stats',    async (_, t) => { try { const {data} = await api.get('/crm/stats');             return data.stats;     } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const fetchCustomers   = createAsyncThunk('crm/customers',async (p={},t) => { try { const {data} = await api.get('/crm/customers',{params:p}); return data;        } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const fetchCustomer    = createAsyncThunk('crm/customer', async (id, t) => { try { const {data} = await api.get(`/crm/customers/${id}`);   return data;           } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const createCustomer   = createAsyncThunk('crm/createCustomer', async (p,t)=>{ try { const {data}=await api.post('/crm/customers',p);       return data.customer;  } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const updateCustomer   = createAsyncThunk('crm/updateCustomer', async ({id,payload},t)=>{ try { const {data}=await api.put(`/crm/customers/${id}`,payload); return data.customer; } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const fetchLeads       = createAsyncThunk('crm/leads',    async (p={},t) => { try { const {data} = await api.get('/crm/leads',{params:p});  return data.leads;     } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const createLead       = createAsyncThunk('crm/createLead',    async (p,t)=>{ try { const {data}=await api.post('/crm/leads',p);            return data.lead;      } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const updateLead       = createAsyncThunk('crm/updateLead',    async ({id,payload},t)=>{ try { const {data}=await api.put(`/crm/leads/${id}`,payload); return data.lead; } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const convertLead      = createAsyncThunk('crm/convertLead',   async (id,t)=>{ try { const {data}=await api.post(`/crm/leads/${id}/convert`); return {id, customer: data.customer}; } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const fetchSalesOrders = createAsyncThunk('crm/orders',   async (p={},t) => { try { const {data} = await api.get('/crm/orders',{params:p}); return data;          } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const createSalesOrder = createAsyncThunk('crm/createOrder',   async (p,t)=>{ try { const {data}=await api.post('/crm/orders',p);           return data.order;     } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const updateOrderStatus= createAsyncThunk('crm/updateStatus',  async ({id,status},t)=>{ try { const {data}=await api.put(`/crm/orders/${id}/status`,{status}); return data.order; } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});

const crmSlice = createSlice({
  name: 'crm',
  initialState: {
    stats: null, customers: [], selectedCustomer: null,
    leads: [], orders: [], totalOrders: 0,
    loading: false, error: null,
  },
  reducers: { clearError: (s) => { s.error = null; } },
  extraReducers: (b) => {
    b
      .addCase(fetchCRMStats.fulfilled,    (s,a) => { s.stats = a.payload; })
      .addCase(fetchCustomers.fulfilled,   (s,a) => { s.customers = a.payload.customers; })
      .addCase(fetchCustomer.fulfilled,    (s,a) => { s.selectedCustomer = a.payload; })
      .addCase(createCustomer.fulfilled,   (s,a) => { s.customers.unshift(a.payload); })
      .addCase(updateCustomer.fulfilled,   (s,a) => { const i=s.customers.findIndex(c=>c._id===a.payload._id); if(i>=0) s.customers[i]=a.payload; })
      .addCase(fetchLeads.fulfilled,       (s,a) => { s.leads = a.payload; })
      .addCase(createLead.fulfilled,       (s,a) => { s.leads.unshift(a.payload); })
      .addCase(updateLead.fulfilled,       (s,a) => { const i=s.leads.findIndex(l=>l._id===a.payload._id); if(i>=0) s.leads[i]=a.payload; })
      .addCase(convertLead.fulfilled,      (s,a) => { const i=s.leads.findIndex(l=>l._id===a.payload.id); if(i>=0) s.leads[i].status='converted'; })
      .addCase(fetchSalesOrders.fulfilled, (s,a) => { s.orders=a.payload.orders; s.totalOrders=a.payload.total; })
      .addCase(createSalesOrder.fulfilled, (s,a) => { s.orders.unshift(a.payload); })
      .addCase(updateOrderStatus.fulfilled,(s,a) => { const i=s.orders.findIndex(o=>o._id===a.payload._id); if(i>=0) s.orders[i]=a.payload; });
  }
});

export const { clearError } = crmSlice.actions;
export default crmSlice.reducer;