import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchHRStats         = createAsyncThunk('hr/stats',       async (_,t) => { try { const {data}=await api.get('/hr/stats');                     return data.stats;    } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const fetchDepartments     = createAsyncThunk('hr/departments',  async (_,t) => { try { const {data}=await api.get('/hr/departments');               return data.departments; } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const createDepartment     = createAsyncThunk('hr/createDept',   async (p,t) => { try { const {data}=await api.post('/hr/departments',p);            return data.department;  } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const updateDepartment     = createAsyncThunk('hr/updateDept',   async ({id,payload},t) => { try { const {data}=await api.put(`/hr/departments/${id}`,payload); return data.department; } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const fetchEmployees       = createAsyncThunk('hr/employees',    async (p={},t) => { try { const {data}=await api.get('/hr/employees',{params:p});   return data.employees; } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const fetchEmployee        = createAsyncThunk('hr/employee',     async (id,t) => { try { const {data}=await api.get(`/hr/employees/${id}`);          return data.employee;  } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const createEmployee       = createAsyncThunk('hr/createEmp',    async (p,t) => { try { const {data}=await api.post('/hr/employees',p);              return data.employee;  } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const updateEmployee       = createAsyncThunk('hr/updateEmp',    async ({id,payload},t) => { try { const {data}=await api.put(`/hr/employees/${id}`,payload); return data.employee; } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const deactivateEmployee   = createAsyncThunk('hr/deactivateEmp',async (id,t) => { try { await api.delete(`/hr/employees/${id}`);                   return id;             } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const fetchAttendance      = createAsyncThunk('hr/attendance',   async (p={},t) => { try { const {data}=await api.get('/hr/attendance',{params:p}); return data.attendance;} catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const markAttendance       = createAsyncThunk('hr/markAttendance',async (p,t) => { try { const {data}=await api.post('/hr/attendance',p);            return data.attendance;} catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const fetchAttendanceSummary=createAsyncThunk('hr/attSummary',   async (p,t) => { try { const {data}=await api.get('/hr/attendance/summary',{params:p}); return data.summary; } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const fetchLeaves          = createAsyncThunk('hr/leaves',       async (p={},t) => { try { const {data}=await api.get('/hr/leaves',{params:p});      return data.leaves;    } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const applyLeave           = createAsyncThunk('hr/applyLeave',   async (p,t) => { try { const {data}=await api.post('/hr/leaves',p);                 return data.leave;     } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const updateLeaveStatus    = createAsyncThunk('hr/leaveStatus',  async ({id,status},t) => { try { const {data}=await api.put(`/hr/leaves/${id}/status`,{status}); return data.leave; } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const fetchPayrolls        = createAsyncThunk('hr/payrolls',     async (p={},t) => { try { const {data}=await api.get('/hr/payroll',{params:p});     return data.payrolls;  } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const processPayroll       = createAsyncThunk('hr/processPayroll',async (p,t) => { try { const {data}=await api.post('/hr/payroll/process',p);       return data.payrolls;  } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});
export const markPayrollPaid      = createAsyncThunk('hr/markPaid',     async (id,t) => { try { const {data}=await api.put(`/hr/payroll/${id}/paid`);       return data.payroll;   } catch(e){ return t.rejectWithValue(e.response?.data?.message); }});

const hrSlice = createSlice({
  name: 'hr',
  initialState: {
    stats: null, departments: [], employees: [], selectedEmployee: null,
    attendance: [], attendanceSummary: null, leaves: [], payrolls: [],
    loading: false, error: null,
  },
  reducers: { clearError: (s) => { s.error = null; } },
  extraReducers: (b) => {
    b
      .addCase(fetchHRStats.fulfilled,          (s,a) => { s.stats = a.payload; })
      .addCase(fetchDepartments.fulfilled,      (s,a) => { s.departments = a.payload; })
      .addCase(createDepartment.fulfilled,      (s,a) => { s.departments.push(a.payload); })
      .addCase(updateDepartment.fulfilled,      (s,a) => { const i=s.departments.findIndex(d=>d._id===a.payload._id); if(i>=0) s.departments[i]=a.payload; })
      .addCase(fetchEmployees.pending,          (s)   => { s.loading=true; })
      .addCase(fetchEmployees.fulfilled,        (s,a) => { s.loading=false; s.employees=a.payload; })
      .addCase(fetchEmployees.rejected,         (s,a) => { s.loading=false; s.error=a.payload; })
      .addCase(fetchEmployee.fulfilled,         (s,a) => { s.selectedEmployee=a.payload; })
      .addCase(createEmployee.fulfilled,        (s,a) => { s.employees.unshift(a.payload); })
      .addCase(updateEmployee.fulfilled,        (s,a) => { const i=s.employees.findIndex(e=>e._id===a.payload._id); if(i>=0) s.employees[i]=a.payload; })
      .addCase(deactivateEmployee.fulfilled,    (s,a) => { s.employees=s.employees.filter(e=>e._id!==a.payload); })
      .addCase(fetchAttendance.fulfilled,       (s,a) => { s.attendance=a.payload; })
      .addCase(markAttendance.fulfilled,        (s,a) => { const i=s.attendance.findIndex(r=>r._id===a.payload._id); if(i>=0) s.attendance[i]=a.payload; else s.attendance.unshift(a.payload); })
      .addCase(fetchAttendanceSummary.fulfilled,(s,a) => { s.attendanceSummary=a.payload; })
      .addCase(fetchLeaves.fulfilled,           (s,a) => { s.leaves=a.payload; })
      .addCase(applyLeave.fulfilled,            (s,a) => { s.leaves.unshift(a.payload); })
      .addCase(updateLeaveStatus.fulfilled,     (s,a) => { const i=s.leaves.findIndex(l=>l._id===a.payload._id); if(i>=0) s.leaves[i]=a.payload; })
      .addCase(fetchPayrolls.fulfilled,         (s,a) => { s.payrolls=a.payload; })
      .addCase(processPayroll.fulfilled,        (s,a) => { s.payrolls=[...a.payload,...s.payrolls]; })
      .addCase(markPayrollPaid.fulfilled,       (s,a) => { const i=s.payrolls.findIndex(p=>p._id===a.payload._id); if(i>=0) s.payrolls[i]=a.payload; });
  }
});

export const { clearError } = hrSlice.actions;
export default hrSlice.reducer;