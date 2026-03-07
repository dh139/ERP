import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  fetchHRStats, fetchDepartments, createDepartment,
  fetchEmployees, createEmployee, updateEmployee, deactivateEmployee,
  fetchAttendance, markAttendance,
  fetchLeaves, applyLeave, updateLeaveStatus,
  fetchPayrolls, processPayroll, markPayrollPaid,
  updateDepartment
} from '../../features/hr/hrSlice';
import Modal    from '../../components/UI/Modal';
import StatCard from '../../components/UI/StatCard';
import Badge    from '../../components/UI/Badge';
import SearchBar from '../../components/UI/SearchBar';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { exportEmployees, exportPayroll } from '../../utils/exportExcel';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Shared helpers ────────────────────────────────────────────────────────────
const Field = ({ label, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);
const Input = ({ reg, ...props }) => (
  <input {...reg} {...props}
    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
);
const Select = ({ reg, children, ...props }) => (
  <select {...reg} {...props}
    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
    {children}
  </select>
);

// ── Departments Tab ───────────────────────────────────────────────────────────
const DepartmentsTab = () => {
  const dispatch = useDispatch();
  const { departments } = useSelector(s => s.hr);
  const [modal, setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { dispatch(fetchDepartments()); }, [dispatch]);

  const openAdd  = () => { setEditing(null); reset({}); setModal(true); };
  const openEdit = (d) => { setEditing(d); reset(d); setModal(true); };

  const onSubmit = async (data) => {
    const res = editing
      ? await dispatch(updateDepartment({ id: editing._id, payload: data }))
      : await dispatch(createDepartment(data));
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success(editing ? 'Department updated!' : 'Department created!');
      setModal(false); reset();
    } else toast.error(res.payload || 'Error');
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={openAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + Add Department
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.length === 0 ? (
          <div className="col-span-3 text-center py-10 text-gray-400 bg-white rounded-xl border">
            No departments yet. Add your first department!
          </div>
        ) : departments.map(d => (
          <div key={d._id} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🏢</span>
                <div>
                  <p className="font-bold text-gray-800">{d.name}</p>
                  <p className="text-xs text-gray-500">Manager: {d.manager?.name || 'Not assigned'}</p>
                </div>
              </div>
              <button onClick={() => openEdit(d)} className="text-xs text-blue-600 hover:underline">Edit</button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-blue-50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-blue-600">{d.headcount}</p>
                <p className="text-xs text-gray-500">Employees</p>
              </div>
              <div className="bg-green-50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-green-600">₹{(d.budget/1000).toFixed(0)}K</p>
                <p className="text-xs text-gray-500">Budget</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Department' : 'Add Department'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Department Name *" error={errors.name?.message}>
            <Input reg={register('name', { required: 'Name required' })} placeholder="e.g. Sales" />
          </Field>
          <Field label="Budget (₹)">
            <Input reg={register('budget', { valueAsNumber: true })} type="number" placeholder="500000" />
          </Field>
          <Field label="Description">
            <textarea {...register('description')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2} placeholder="Optional description" />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
            <button type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              {editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ── Employees Tab ─────────────────────────────────────────────────────────────
const EmployeesTab = () => {
  const dispatch = useDispatch();
  const { employees, departments, loading } = useSelector(s => s.hr);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch]   = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchDepartments());
  }, [dispatch]);

  const openAdd = () => {
    setEditing(null);
    reset({
      employmentType: 'full_time',
      salary: { base: 0, hra: 0, allowances: 0, deductions: 0 },
      bankDetails: { bankName: '', accountNo: '', ifscCode: '' }
    });
    setModal(true);
  };

  const openEdit = (e) => {
    setEditing(e);
    reset({
      designation:    e.designation,
      phone:          e.phone,
      address:        e.address,
      employmentType: e.employmentType,
      salary: {
        base:       e.salary?.base       || 0,
        hra:        e.salary?.hra        || 0,
        allowances: e.salary?.allowances || 0,
        deductions: e.salary?.deductions || 0,
      },
      bankDetails: {
        bankName:  e.bankDetails?.bankName  || '',
        accountNo: e.bankDetails?.accountNo || '',
        ifscCode:  e.bankDetails?.ifscCode  || '',
      }
    });
    setModal(true);
  };

  const onSubmit = async (data) => {
    // Ensure salary numbers are actual numbers not strings
    const payload = {
      ...data,
      salary: {
        base:       Number(data.salary?.base)       || 0,
        hra:        Number(data.salary?.hra)        || 0,
        allowances: Number(data.salary?.allowances) || 0,
        deductions: Number(data.salary?.deductions) || 0,
      },
      bankDetails: {
        bankName:  data.bankDetails?.bankName  || '',
        accountNo: data.bankDetails?.accountNo || '',
        ifscCode:  data.bankDetails?.ifscCode  || '',
      }
    };

    if (editing) {
      const res = await dispatch(updateEmployee({ id: editing._id, payload }));
      if (res.meta.requestStatus === 'fulfilled') {
        toast.success('Employee updated!');
        setModal(false);
      } else toast.error(res.payload || 'Error');
    } else {
      const res = await dispatch(createEmployee(payload));
      if (res.meta.requestStatus === 'fulfilled') {
        toast.success(`Employee created! Default password: Employee@123`);
        setModal(false);
        reset();
      } else toast.error(res.payload || 'Error');
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this employee?')) return;
    const res = await dispatch(deactivateEmployee(id));
    if (res.meta.requestStatus === 'fulfilled') toast.success('Employee deactivated');
    else toast.error(res.payload || 'Error');
  };

  const filtered = employees.filter(e =>
    e.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
    e.designation?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search employees..." />
        <button onClick={openAdd}
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex-shrink-0">
          + Add Employee
        </button>
        <button onClick={() => exportEmployees(employees)}
  className="ml-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
  ⬇ Excel
</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Employee ID','Name','Designation','Department','Joining Date','Base Salary','Type','Actions'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">No employees found.</td></tr>
            ) : filtered.map(e => (
              <tr key={e._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-blue-600">{e.employeeId}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                      {e.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{e.user?.name}</p>
                      <p className="text-xs text-gray-400">{e.user?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{e.designation}</td>
                <td className="px-4 py-3 text-gray-500">{e.department?.name || '—'}</td>
                <td className="px-4 py-3 text-gray-500">
                  {e.dateOfJoining ? new Date(e.dateOfJoining).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3 font-semibold text-green-600">
                  ₹{e.salary?.base?.toLocaleString() || 0}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full capitalize">
                    {e.employmentType?.replace('_',' ')}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => openEdit(e)} className="text-xs text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => handleDeactivate(e._id)} className="text-xs text-red-500 hover:underline">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)}
        title={editing ? 'Edit Employee' : 'Add New Employee'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* ── Personal Info ── */}
          <div>
            <p className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b">👤 Personal Information</p>
            <div className="grid grid-cols-2 gap-4">
              {!editing && <>
                <Field label="Full Name *" error={errors.name?.message}>
                  <Input reg={register('name', { required: 'Name required' })} placeholder="John Doe" />
                </Field>
                <Field label="Email *" error={errors.email?.message}>
                  <Input reg={register('email', { required: 'Email required' })} type="email" placeholder="john@company.com" />
                </Field>
                <Field label="Department">
                  <Select reg={register('department')}>
                    <option value="">Select department</option>
                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </Select>
                </Field>
                <Field label="Date of Joining *" error={errors.dateOfJoining?.message}>
                  <Input reg={register('dateOfJoining', { required: true })} type="date" />
                </Field>
              </>}
              <Field label="Designation *" error={errors.designation?.message}>
                <Input reg={register('designation', { required: 'Designation required' })}
                  placeholder="e.g. Sales Executive" />
              </Field>
              <Field label="Employment Type">
                <Select reg={register('employmentType')}>
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                </Select>
              </Field>
              <Field label="Phone">
                <Input reg={register('phone')} placeholder="+91 XXXXX XXXXX" />
              </Field>
              <Field label="Address">
                <Input reg={register('address')} placeholder="Full address" />
              </Field>
            </div>
          </div>

          {/* ── Salary ── */}
          <div>
            <p className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b">💰 Salary Structure (Monthly ₹)</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Basic Salary">
                <Input reg={register('salary.base', { valueAsNumber: true })}
                  type="number" min="0" placeholder="30000" />
              </Field>
              <Field label="HRA">
                <Input reg={register('salary.hra', { valueAsNumber: true })}
                  type="number" min="0" placeholder="5000" />
              </Field>
              <Field label="Other Allowances">
                <Input reg={register('salary.allowances', { valueAsNumber: true })}
                  type="number" min="0" placeholder="3000" />
              </Field>
              <Field label="Fixed Deductions">
                <Input reg={register('salary.deductions', { valueAsNumber: true })}
                  type="number" min="0" placeholder="1000" />
              </Field>
            </div>
          </div>

          {/* ── Bank Details ── */}
          <div>
            <p className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b">🏦 Bank Details</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Bank Name">
                <Input reg={register('bankDetails.bankName')} placeholder="e.g. HDFC Bank" />
              </Field>
              <Field label="Account Number">
                <Input reg={register('bankDetails.accountNo')} placeholder="Account number" />
              </Field>
              <div className="col-span-2">
                <Field label="IFSC Code">
                  <Input reg={register('bankDetails.ifscCode')} placeholder="e.g. HDFC0001234" />
                </Field>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
            <button type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              {editing ? 'Update Employee' : 'Create Employee'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ── Attendance Tab ────────────────────────────────────────────────────────────
const AttendanceTab = () => {
  const dispatch = useDispatch();
  const { attendance, employees } = useSelector(s => s.hr);
  const [modal, setModal]     = useState(false);
  const [filterEmp, setFilterEmp] = useState('');
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year,  setYear]  = useState(today.getFullYear());
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { date: today.toISOString().split('T')[0], status: 'present' }
  });

  useEffect(() => {
    dispatch(fetchAttendance({ month, year, employee: filterEmp || undefined }));
    dispatch(fetchEmployees());
  }, [dispatch, month, year, filterEmp]);

  const onSubmit = async (data) => {
    const res = await dispatch(markAttendance(data));
    if (res.meta.requestStatus === 'fulfilled') { toast.success('Attendance marked!'); setModal(false); reset(); }
    else toast.error(res.payload || 'Error');
  };

  const STATUS_COLOR = { present: 'bg-green-100 text-green-700', absent: 'bg-red-100 text-red-700', half_day: 'bg-yellow-100 text-yellow-700', leave: 'bg-blue-100 text-blue-700', holiday: 'bg-purple-100 text-purple-700' };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-3">
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filterEmp} onChange={e => setFilterEmp(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option value="">All Employees</option>
            {employees.map(e => <option key={e._id} value={e._id}>{e.user?.name}</option>)}
          </select>
        </div>
        <button onClick={() => setModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + Mark Attendance
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Employee','Date','Check In','Check Out','Hours','Status','Notes'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {attendance.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">No attendance records found.</td></tr>
            ) : attendance.map(a => (
              <tr key={a._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{a.employee?.user?.name || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(a.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-gray-600">{a.checkIn || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{a.checkOut || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{a.hoursWorked?.toFixed(1) || '0'}h</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLOR[a.status] || 'bg-gray-100 text-gray-600'}`}>
                    {a.status?.replace('_',' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{a.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Mark Attendance">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Employee *">
            <Select reg={register('employee', { required: true })}>
              <option value="">Select employee</option>
              {employees.map(e => <option key={e._id} value={e._id}>{e.user?.name} ({e.employeeId})</option>)}
            </Select>
          </Field>
          <Field label="Date *">
            <Input reg={register('date', { required: true })} type="date" />
          </Field>
          <Field label="Status *">
            <Select reg={register('status', { required: true })}>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="half_day">Half Day</option>
              <option value="leave">On Leave</option>
              <option value="holiday">Holiday</option>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Check In Time">
              <Input reg={register('checkIn')} type="time" />
            </Field>
            <Field label="Check Out Time">
              <Input reg={register('checkOut')} type="time" />
            </Field>
          </div>
          <Field label="Notes">
            <Input reg={register('notes')} placeholder="Optional notes" />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
            <button type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Mark</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ── Leaves Tab ────────────────────────────────────────────────────────────────
const LeavesTab = () => {
  const dispatch = useDispatch();
  const { leaves, employees } = useSelector(s => s.hr);
  const [modal, setModal]   = useState(false);
  const [filter, setFilter] = useState('pending');
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    dispatch(fetchLeaves({ status: filter || undefined }));
    dispatch(fetchEmployees());
  }, [dispatch, filter]);

  const onSubmit = async (data) => {
    const res = await dispatch(applyLeave(data));
    if (res.meta.requestStatus === 'fulfilled') { toast.success('Leave applied!'); setModal(false); reset(); }
    else toast.error(res.payload || 'Error');
  };

  const handleStatus = async (id, status) => {
    const res = await dispatch(updateLeaveStatus({ id, status }));
    if (res.meta.requestStatus === 'fulfilled') toast.success(`Leave ${status}!`);
    else toast.error(res.payload || 'Error');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {['','pending','approved','rejected'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter===s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s === '' ? 'All' : s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={() => setModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + Apply Leave
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Employee','Leave Type','From','To','Days','Reason','Status','Action'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {leaves.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">No leave requests found.</td></tr>
            ) : leaves.map(l => (
              <tr key={l._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{l.employee?.user?.name || '—'}</td>
                <td className="px-4 py-3 capitalize text-gray-600">{l.leaveType}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(l.fromDate).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(l.toDate).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-semibold text-blue-600">{l.days}</td>
                <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">{l.reason || '—'}</td>
                <td className="px-4 py-3"><Badge status={l.status} /></td>
                <td className="px-4 py-3">
                  {l.status === 'pending' && (
                    <div className="flex gap-1">
                      <button onClick={() => handleStatus(l._id,'approved')}
                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full hover:bg-green-200 font-medium">✓ Approve</button>
                      <button onClick={() => handleStatus(l._id,'rejected')}
                        className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full hover:bg-red-200 font-medium">✗ Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Apply Leave">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Employee *" error={errors.employee?.message}>
            <Select reg={register('employee', { required: true })}>
              <option value="">Select employee</option>
              {employees.map(e => <option key={e._id} value={e._id}>{e.user?.name} ({e.employeeId})</option>)}
            </Select>
          </Field>
          <Field label="Leave Type *" error={errors.leaveType?.message}>
            <Select reg={register('leaveType', { required: true })}>
              <option value="">Select type</option>
              <option value="annual">Annual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="casual">Casual Leave</option>
              <option value="unpaid">Unpaid Leave</option>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="From Date *" error={errors.fromDate?.message}>
              <Input reg={register('fromDate', { required: true })} type="date" />
            </Field>
            <Field label="To Date *" error={errors.toDate?.message}>
              <Input reg={register('toDate', { required: true })} type="date" />
            </Field>
          </div>
          <Field label="Reason">
            <textarea {...register('reason')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2} placeholder="Reason for leave..." />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
            <button type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Apply</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ── Payroll Tab ───────────────────────────────────────────────────────────────
const PayrollTab = () => {
  const dispatch = useDispatch();
  const { payrolls } = useSelector(s => s.hr);
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year,  setYear]  = useState(today.getFullYear());
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    dispatch(fetchPayrolls({ month, year }));
  }, [dispatch, month, year]);

  const handleProcess = async () => {
    if (!window.confirm(`Process payroll for ${MONTHS[month-1]} ${year}? This will calculate salaries for all active employees.`)) return;
    setProcessing(true);
    const res = await dispatch(processPayroll({ month, year }));
    setProcessing(false);
    if (res.meta.requestStatus === 'fulfilled') toast.success(`Payroll processed! ${res.payload.length} records created.`);
    else toast.error(res.payload || 'Error processing payroll');
  };

  const handleMarkPaid = async (id) => {
    const res = await dispatch(markPayrollPaid(id));
    if (res.meta.requestStatus === 'fulfilled') toast.success('Marked as paid!');
    else toast.error(res.payload || 'Error');
  };

  const totalNet   = payrolls.reduce((sum, p) => sum + p.netSalary, 0);
  const totalGross = payrolls.reduce((sum, p) => sum + p.grossSalary, 0);
const handleDownloadPayslip = async (id) => {
  try {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`http://localhost:5000/api/hr/payroll/${id}/pdf`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const blob = await response.blob();
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `payslip-${id}.pdf`; a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Payslip downloaded!');
  } catch { toast.error('Download failed'); }
};

const handleEmailPayslip = async (id) => {
  try {
    const res = await api.post(`/hr/payroll/${id}/email`);
    if (res.data.success) toast.success(res.data.message);
    else toast.error('Email failed');
  } catch { toast.error('Email failed'); }
};
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-3">
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button onClick={handleProcess} disabled={processing}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:bg-green-300">
          {processing ? '⏳ Processing...' : '▶ Run Payroll'}
        </button>
        <button onClick={() => exportPayroll(payrolls, month, year)}
  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
  ⬇ Excel
</button>
      </div>

      {payrolls.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Total Employees</p>
            <p className="text-2xl font-bold text-blue-600">{payrolls.length}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Total Gross</p>
            <p className="text-2xl font-bold text-green-600">₹{totalGross.toLocaleString()}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Total Net Payable</p>
            <p className="text-2xl font-bold text-purple-600">₹{totalNet.toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Employee','Basic','HRA','Allowances','Gross','PF','Tax','Deductions','Net Salary','Status','Action'].map(h => (
              <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {payrolls.length === 0 ? (
              <tr><td colSpan={11} className="text-center py-10 text-gray-400">
                No payroll records. Click "Run Payroll" to process salaries for {MONTHS[month-1]} {year}.
              </td></tr>
            ) : payrolls.map(p => (
              <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-3 py-3 font-medium text-gray-800 whitespace-nowrap">{p.employee?.user?.name}</td>
                <td className="px-3 py-3 text-gray-600">₹{p.earnings?.basic?.toLocaleString()}</td>
                <td className="px-3 py-3 text-gray-600">₹{p.earnings?.hra?.toLocaleString()}</td>
                <td className="px-3 py-3 text-gray-600">₹{p.earnings?.allowances?.toLocaleString()}</td>
                <td className="px-3 py-3 font-semibold">₹{p.grossSalary?.toLocaleString()}</td>
                <td className="px-3 py-3 text-red-500">-₹{p.deductions?.providentFund?.toLocaleString()}</td>
                <td className="px-3 py-3 text-red-500">-₹{p.deductions?.tax?.toLocaleString()}</td>
                <td className="px-3 py-3 text-red-500">-₹{p.totalDeductions?.toLocaleString()}</td>
                <td className="px-3 py-3 font-bold text-green-600">₹{p.netSalary?.toLocaleString()}</td>
                <td className="px-3 py-3"><Badge status={p.status} /></td>
              <td className="px-3 py-3">
  <div className="flex gap-1 flex-wrap">
    
    {p.status === 'processed' && (
      <button
        onClick={() => handleMarkPaid(p._id)}
        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full hover:bg-green-200 font-medium whitespace-nowrap"
      >
        Mark Paid
      </button>
    )}

    <button
      onClick={() => handleDownloadPayslip(p._id)}
      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full hover:bg-gray-200 font-medium"
    >
      ⬇ PDF
    </button>

    <button
      onClick={() => handleEmailPayslip(p._id)}
      className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full hover:bg-purple-200 font-medium"
    >
      ✉ Email
    </button>

  </div>
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Main HR Page ──────────────────────────────────────────────────────────────
const TABS = ['Employees','Departments','Attendance','Leaves','Payroll'];

const HR = () => {
  const dispatch = useDispatch();
  const { stats } = useSelector(s => s.hr);
  const [tab, setTab] = useState('Employees');

  useEffect(() => { dispatch(fetchHRStats()); }, [dispatch]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">👥 HR & Payroll</h1>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard icon="👤" label="Total Employees"  value={stats?.totalEmployees}   color="blue" />
        <StatCard icon="🏢" label="Departments"       value={stats?.totalDepartments} color="purple" />
        <StatCard icon="✅" label="Present Today"     value={stats?.presentToday}     color="green" />
        <StatCard icon="📋" label="Pending Leaves"    value={stats?.pendingLeaves}    color="orange" />
        <StatCard icon="💰" label="Monthly Payroll"   value={stats?.monthlyPayroll ? `₹${Math.round(stats.monthlyPayroll).toLocaleString()}` : '—'} color="green" />
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
              ${tab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Employees'   && <EmployeesTab />}
      {tab === 'Departments' && <DepartmentsTab />}
      {tab === 'Attendance'  && <AttendanceTab />}
      {tab === 'Leaves'      && <LeavesTab />}
      {tab === 'Payroll'     && <PayrollTab />}
    </div>
  );
};

export default HR;