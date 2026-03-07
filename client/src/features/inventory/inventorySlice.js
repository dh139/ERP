import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchInventoryStats = createAsyncThunk('inventory/stats', async (_, t) => {
  try { const { data } = await api.get('/inventory/stats'); return data.stats; }
  catch (e) { return t.rejectWithValue(e.response?.data?.message); }
});
export const fetchProducts = createAsyncThunk('inventory/products', async (params = {}, t) => {
  try { const { data } = await api.get('/inventory/products', { params }); return data; }
  catch (e) { return t.rejectWithValue(e.response?.data?.message); }
});
export const createProduct = createAsyncThunk('inventory/createProduct', async (payload, t) => {
  try { const { data } = await api.post('/inventory/products', payload); return data.product; }
  catch (e) { return t.rejectWithValue(e.response?.data?.message); }
});
export const updateProduct = createAsyncThunk('inventory/updateProduct', async ({ id, payload }, t) => {
  try { const { data } = await api.put(`/inventory/products/${id}`, payload); return data.product; }
  catch (e) { return t.rejectWithValue(e.response?.data?.message); }
});
export const fetchWarehouses = createAsyncThunk('inventory/warehouses', async (_, t) => {
  try { const { data } = await api.get('/inventory/warehouses'); return data.warehouses; }
  catch (e) { return t.rejectWithValue(e.response?.data?.message); }
});
export const createWarehouse = createAsyncThunk('inventory/createWarehouse', async (payload, t) => {
  try { const { data } = await api.post('/inventory/warehouses', payload); return data.warehouse; }
  catch (e) { return t.rejectWithValue(e.response?.data?.message); }
});
export const fetchStock = createAsyncThunk('inventory/stock', async (params = {}, t) => {
  try { const { data } = await api.get('/inventory/stock', { params }); return data.stock; }
  catch (e) { return t.rejectWithValue(e.response?.data?.message); }
});
export const fetchLowStock = createAsyncThunk('inventory/lowStock', async (_, t) => {
  try { const { data } = await api.get('/inventory/stock/low'); return data; }
  catch (e) { return t.rejectWithValue(e.response?.data?.message); }
});
export const recordMovement = createAsyncThunk('inventory/movement', async (payload, t) => {
  try { const { data } = await api.post('/inventory/stock/movement', payload); return data; }
  catch (e) { return t.rejectWithValue(e.response?.data?.message); }
});
export const fetchSuppliers = createAsyncThunk('inventory/suppliers', async (_, t) => {
  try { const { data } = await api.get('/inventory/suppliers'); return data.suppliers; }
  catch (e) { return t.rejectWithValue(e.response?.data?.message); }
});
export const createSupplier = createAsyncThunk('inventory/createSupplier', async (payload, t) => {
  try { const { data } = await api.post('/inventory/suppliers', payload); return data.supplier; }
  catch (e) { return t.rejectWithValue(e.response?.data?.message); }
});
export const fetchPurchaseOrders = createAsyncThunk('inventory/pos', async (_, t) => {
  try { const { data } = await api.get('/inventory/purchase-orders'); return data.orders; }
  catch (e) { return t.rejectWithValue(e.response?.data?.message); }
});
export const createPurchaseOrder = createAsyncThunk('inventory/createPO', async (payload, t) => {
  try { const { data } = await api.post('/inventory/purchase-orders', payload); return data.po; }
  catch (e) { return t.rejectWithValue(e.response?.data?.message); }
});
export const receivePurchaseOrder = createAsyncThunk('inventory/receivePO', async (id, t) => {
  try { const { data } = await api.put(`/inventory/purchase-orders/${id}/receive`); return data; }
  catch (e) { return t.rejectWithValue(e.response?.data?.message); }
});

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: {
    stats: null, products: [], total: 0, warehouses: [],
    stock: [], lowStock: [], movements: [], suppliers: [],
    purchaseOrders: [], loading: false, error: null,
  },
  reducers: { clearError: (s) => { s.error = null; } },
  extraReducers: (b) => {
    const load  = (s) => { s.loading = true;  s.error = null; };
    const fail  = (s, a) => { s.loading = false; s.error = a.payload; };
    b
      .addCase(fetchInventoryStats.fulfilled, (s,a) => { s.stats = a.payload; })
      .addCase(fetchProducts.pending,   load)
      .addCase(fetchProducts.fulfilled, (s,a) => { s.loading=false; s.products=a.payload.products; s.total=a.payload.total; })
      .addCase(fetchProducts.rejected,  fail)
      .addCase(createProduct.fulfilled, (s,a) => { s.products.unshift(a.payload); })
      .addCase(updateProduct.fulfilled, (s,a) => { const i=s.products.findIndex(p=>p._id===a.payload._id); if(i>=0) s.products[i]=a.payload; })
      .addCase(fetchWarehouses.fulfilled, (s,a) => { s.warehouses = a.payload; })
      .addCase(createWarehouse.fulfilled, (s,a) => { s.warehouses.push(a.payload); })
      .addCase(fetchStock.fulfilled,    (s,a) => { s.stock = a.payload; })
      .addCase(fetchLowStock.fulfilled, (s,a) => { s.lowStock = a.payload.stock; })
      .addCase(fetchSuppliers.fulfilled,(s,a) => { s.suppliers = a.payload; })
      .addCase(createSupplier.fulfilled,(s,a) => { s.suppliers.push(a.payload); })
      .addCase(fetchPurchaseOrders.fulfilled,(s,a) => { s.purchaseOrders = a.payload; })
      .addCase(createPurchaseOrder.fulfilled,(s,a) => { s.purchaseOrders.unshift(a.payload); });
  }
});

export const { clearError } = inventorySlice.actions;
export default inventorySlice.reducer;