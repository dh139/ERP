import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchAccountingStats = createAsyncThunk('accounting/stats',       async (_,t)   => { try { const {data}=await api.get('/accounting/stats');                        return data.stats;        } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const fetchAccounts        = createAsyncThunk('accounting/accounts',     async (p={},t)=> { try { const {data}=await api.get('/accounting/accounts',{params:p});          return data.accounts;     } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const createAccount        = createAsyncThunk('accounting/createAccount',async (p,t)  => { try { const {data}=await api.post('/accounting/accounts',p);                  return data.account;      } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const updateAccount        = createAsyncThunk('accounting/updateAccount',async ({id,payload},t)=>{ try { const {data}=await api.put(`/accounting/accounts/${id}`,payload); return data.account; } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const seedAccounts         = createAsyncThunk('accounting/seed',         async (_,t)   => { try { const {data}=await api.post('/accounting/accounts/seed');               return data.message;      } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const fetchTransactions    = createAsyncThunk('accounting/transactions',  async (p={},t)=> { try { const {data}=await api.get('/accounting/transactions',{params:p});     return data;              } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const createTransaction    = createAsyncThunk('accounting/createTxn',    async (p,t)   => { try { const {data}=await api.post('/accounting/transactions',p);             return data.transaction;  } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const fetchInvoices        = createAsyncThunk('accounting/invoices',     async (p={},t)=> { try { const {data}=await api.get('/accounting/invoices',{params:p});         return data;              } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const createInvoice        = createAsyncThunk('accounting/createInvoice',async (p,t)   => { try { const {data}=await api.post('/accounting/invoices',p);                return data.invoice;      } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const recordPayment        = createAsyncThunk('accounting/payment',      async ({id,amount},t)=>{ try { const {data}=await api.put(`/accounting/invoices/${id}/payment`,{amount}); return data.invoice; } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const updateInvoiceStatus  = createAsyncThunk('accounting/invStatus',   async ({id,status},t)=>{ try { const {data}=await api.put(`/accounting/invoices/${id}/status`,{status}); return data.invoice; } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const fetchExpenses        = createAsyncThunk('accounting/expenses',     async (p={},t)=> { try { const {data}=await api.get('/accounting/expenses',{params:p});         return data;              } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const createExpense        = createAsyncThunk('accounting/createExpense',async (p,t)   => { try { const {data}=await api.post('/accounting/expenses',p);                return data.expense;      } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const updateExpenseStatus  = createAsyncThunk('accounting/expStatus',   async ({id,status},t)=>{ try { const {data}=await api.put(`/accounting/expenses/${id}/status`,{status}); return data.expense; } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const fetchProfitLoss      = createAsyncThunk('accounting/pl',          async (p={},t)=> { try { const {data}=await api.get('/accounting/reports/profit-loss',{params:p}); return data.report;    } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const fetchBalanceSheet    = createAsyncThunk('accounting/bs',          async (_,t)   => { try { const {data}=await api.get('/accounting/reports/balance-sheet');        return data.report;       } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});

const accountingSlice = createSlice({
  name: 'accounting',
  initialState: {
    stats: null, accounts: [], transactions: [], totalTxn: 0,
    invoices: [], totalInvoices: 0, expenses: [], totalExpenses: 0,
    profitLoss: null, balanceSheet: null,
    loading: false, error: null,
  },
  reducers: { clearError: (s) => { s.error = null; } },
  extraReducers: (b) => {
    b
      .addCase(fetchAccountingStats.fulfilled, (s,a) => { s.stats = a.payload; })
      .addCase(fetchAccounts.fulfilled,        (s,a) => { s.accounts = a.payload; })
      .addCase(createAccount.fulfilled,        (s,a) => { s.accounts.push(a.payload); })
      .addCase(updateAccount.fulfilled,        (s,a) => { const i=s.accounts.findIndex(x=>x._id===a.payload._id); if(i>=0) s.accounts[i]=a.payload; })
      .addCase(fetchTransactions.pending,      (s)   => { s.loading=true; })
      .addCase(fetchTransactions.fulfilled,    (s,a) => { s.loading=false; s.transactions=a.payload.transactions; s.totalTxn=a.payload.total; })
      .addCase(fetchTransactions.rejected,     (s,a) => { s.loading=false; s.error=a.payload; })
      .addCase(createTransaction.fulfilled,    (s,a) => { s.transactions.unshift(a.payload); })
      .addCase(fetchInvoices.fulfilled,        (s,a) => { s.invoices=a.payload.invoices; s.totalInvoices=a.payload.total; })
      .addCase(createInvoice.fulfilled,        (s,a) => { s.invoices.unshift(a.payload); })
      .addCase(recordPayment.fulfilled,        (s,a) => { const i=s.invoices.findIndex(x=>x._id===a.payload._id); if(i>=0) s.invoices[i]=a.payload; })
      .addCase(updateInvoiceStatus.fulfilled,  (s,a) => { const i=s.invoices.findIndex(x=>x._id===a.payload._id); if(i>=0) s.invoices[i]=a.payload; })
      .addCase(fetchExpenses.fulfilled,        (s,a) => { s.expenses=a.payload.expenses; s.totalExpenses=a.payload.total; })
      .addCase(createExpense.fulfilled,        (s,a) => { s.expenses.unshift(a.payload); })
      .addCase(updateExpenseStatus.fulfilled,  (s,a) => { const i=s.expenses.findIndex(x=>x._id===a.payload._id); if(i>=0) s.expenses[i]=a.payload; })
      .addCase(fetchProfitLoss.fulfilled,      (s,a) => { s.profitLoss=a.payload; })
      .addCase(fetchBalanceSheet.fulfilled,    (s,a) => { s.balanceSheet=a.payload; });
  }
});

export const { clearError } = accountingSlice.actions;
export default accountingSlice.reducer;