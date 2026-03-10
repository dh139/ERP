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
import Modal from '../../components/UI/Modal';
import Badge from '../../components/UI/Badge';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { exportEmployees, exportPayroll } from '../../utils/exportExcel';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Design Tokens ─────────────────────────────────────────────────────────────
const S = {
  input: {
    width: '100%', padding: '10px 14px',
    border: '2px solid #E8E8E3', borderRadius: 10,
    fontFamily: "'DM Sans', sans-serif", fontSize: 14,
    color: '#0A0A0A', background: 'white', outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s', appearance: 'none',
  },
  select: {
    width: '100%', padding: '10px 14px',
    border: '2px solid #E8E8E3', borderRadius: 10,
    fontFamily: "'DM Sans', sans-serif", fontSize: 14,
    color: '#0A0A0A', background: 'white', outline: 'none', cursor: 'pointer',
    appearance: 'none', WebkitAppearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: 40,
  },
  label: { fontFamily: 'Syne', fontWeight: 700, fontSize: 11, color: '#0A0A0A', display: 'block', marginBottom: 7, letterSpacing: '0.05em' },
  card: { background: 'white', border: '2px solid #F0F0EB', borderRadius: 16, overflow: 'hidden' },
  th: { padding: '12px 16px', textAlign: 'left', fontFamily: 'Syne', fontWeight: 700, fontSize: 10, color: '#AAA', letterSpacing: '0.08em', borderBottom: '2px solid #F0F0EB', background: '#FAFAF8' },
  td: { padding: '13px 16px', fontFamily: 'DM Sans', fontSize: 13, color: '#444', borderBottom: '1px solid #F4F4F0' },
};

// ── Shared UI ─────────────────────────────────────────────────────────────────
const focusIn  = e => { e.target.style.borderColor = '#0A0A0A'; e.target.style.boxShadow = '0 0 0 4px rgba(10,10,10,0.06)'; };
const focusOut = e => { e.target.style.borderColor = '#E8E8E3'; e.target.style.boxShadow = 'none'; };

const Field = ({ label, error, children }) => (
  <div>
    <label style={S.label}>{label}</label>
    {children}
    {error && <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#DC2626', marginTop: 4 }}>⚠ {error}</p>}
  </div>
);
const NInput    = ({ reg, style = {}, ...props }) => <input    {...reg} {...props} style={{ ...S.input,  ...style }} onFocus={focusIn} onBlur={focusOut} />;
const NSelect   = ({ reg, children, style = {}, onChange, value, ...props }) => {
  const sp = reg ? { ...reg } : { onChange, value };
  return <select {...sp} {...props} style={{ ...S.select, ...style }} onFocus={focusIn} onBlur={focusOut}>{children}</select>;
};
const NTextarea = ({ reg, ...props }) => <textarea {...reg} {...props} style={{ ...S.input, resize: 'vertical', minHeight: 72 }} onFocus={focusIn} onBlur={focusOut} />;

const PrimaryBtn = ({ children, style = {}, ...props }) => (
  <button style={{ padding: '10px 20px', background: '#0A0A0A', color: 'white', border: 'none', borderRadius: 10, fontFamily: 'Syne', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', whiteSpace: 'nowrap', ...style }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    {...props}>{children}</button>
);
const SecondaryBtn = ({ children, style = {}, ...props }) => (
  <button style={{ padding: '10px 20px', background: 'white', border: '2px solid #E8E8E3', borderRadius: 10, fontFamily: 'DM Sans', fontWeight: 500, fontSize: 13, color: '#555', cursor: 'pointer', transition: 'border-color 0.15s', whiteSpace: 'nowrap', ...style }}
    onMouseEnter={e => e.currentTarget.style.borderColor = '#0A0A0A'}
    onMouseLeave={e => e.currentTarget.style.borderColor = '#E8E8E3'}
    {...props}>{children}</button>
);
const GreenBtn = ({ children, style = {}, ...props }) => (
  <button style={{ padding: '10px 18px', background: '#F0FDF4', border: '2px solid #BBF7D0', borderRadius: 10, fontFamily: 'Syne', fontWeight: 700, fontSize: 12, color: '#16A34A', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap', ...style }}
    onMouseEnter={e => { e.currentTarget.style.background = '#16A34A'; e.currentTarget.style.color = 'white'; }}
    onMouseLeave={e => { e.currentTarget.style.background = '#F0FDF4'; e.currentTarget.style.color = '#16A34A'; }}
    {...props}>{children}</button>
);

const KPICard = ({ icon, label, value, accent = '#FFD966' }) => (
  <div style={{ ...S.card, padding: '22px 20px', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent }} />
    <div style={{ width: 42, height: 42, background: '#0A0A0A', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 14 }}>{icon}</div>
    <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 24, color: '#0A0A0A', letterSpacing: '-0.025em', marginBottom: 4 }}>{value ?? '—'}</p>
    <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#999', fontWeight: 500 }}>{label}</p>
  </div>
);

const SearchInput = ({ value, onChange, placeholder }) => (
  <div style={{ position: 'relative', flex: 1 }}>
    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>🔍</span>
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ ...S.input, paddingLeft: 36 }} onFocus={focusIn} onBlur={focusOut} />
  </div>
);

const EmptyRow = ({ cols, message }) => (
  <tr><td colSpan={cols} style={{ textAlign: 'center', padding: '48px 16px' }}>
    <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.15 }}>👥</div>
    <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: '#CCC' }}>{message}</p>
  </td></tr>
);

const FormFooter = ({ onCancel, submitLabel }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #F0F0EB', marginTop: 12 }}>
    <SecondaryBtn type="button" onClick={onCancel}>Cancel</SecondaryBtn>
    <PrimaryBtn type="submit">{submitLabel}</PrimaryBtn>
  </div>
);

const SectionDivider = ({ icon, title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 0 10px', borderBottom: '2px solid #F0F0EB', marginBottom: 14 }}>
    <div style={{ width: 28, height: 28, background: '#0A0A0A', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{icon}</div>
    <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 13, color: '#0A0A0A', letterSpacing: '-0.01em' }}>{title}</span>
  </div>
);

// ── DEPARTMENTS TAB ───────────────────────────────────────────────────────────
const DEPT_ACCENTS = ['#FFD966','#0EA5E9','#16A34A','#FF6B35','#8B5CF6','#EC4899','#0891B2'];

const DepartmentsTab = () => {
  const dispatch = useDispatch();
  const { departments } = useSelector(s => s.hr);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { dispatch(fetchDepartments()); }, [dispatch]);

  const openAdd  = () => { setEditing(null); reset({}); setModal(true); };
  const openEdit = (d) => { setEditing(d); reset(d); setModal(true); };

  const onSubmit = async (data) => {
    const res = editing
      ? await dispatch(updateDepartment({ id: editing._id, payload: data }))
      : await dispatch(createDepartment(data));
    if (res.meta.requestStatus === 'fulfilled') { toast.success(editing ? 'Updated!' : 'Department created!'); setModal(false); reset(); }
    else toast.error(res.payload || 'Error');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <PrimaryBtn onClick={openAdd}>+ Add Department</PrimaryBtn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {departments.length === 0 ? (
          <div style={{ gridColumn: '1/-1', ...S.card, padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, opacity: 0.15, marginBottom: 12 }}>🏢</div>
            <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: '#CCC' }}>No departments yet. Add your first!</p>
          </div>
        ) : departments.map((d, i) => (
          <div key={d._id} style={{ ...S.card, padding: 22, position: 'relative', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: DEPT_ACCENTS[i % DEPT_ACCENTS.length] }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, background: '#0A0A0A', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🏢</div>
                <div>
                  <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, color: '#0A0A0A' }}>{d.name}</p>
                  <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: '#AAA', marginTop: 2 }}>Manager: {d.manager?.name || 'Not assigned'}</p>
                </div>
              </div>
              <button onClick={() => openEdit(d)} style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 11, background: '#F4F4F0', border: '1.5px solid #E8E8E3', padding: '5px 12px', borderRadius: 8, cursor: 'pointer', color: '#0A0A0A', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#0A0A0A'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F4F4F0'; e.currentTarget.style.color = '#0A0A0A'; }}>Edit</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: '#F4F4F0', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: '#0A0A0A', letterSpacing: '-0.02em' }}>{d.headcount}</p>
                <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: '#999' }}>Employees</p>
              </div>
              <div style={{ background: '#F4F4F0', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: '#16A34A', letterSpacing: '-0.02em' }}>₹{((d.budget||0)/1000).toFixed(0)}K</p>
                <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: '#999' }}>Budget</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Department' : 'Add Department'}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="DEPARTMENT NAME *" error={errors.name?.message}>
            <NInput reg={register('name', { required: 'Name required' })} placeholder="e.g. Sales" />
          </Field>
          <Field label="BUDGET (₹)">
            <NInput reg={register('budget', { valueAsNumber: true })} type="number" placeholder="500000" />
          </Field>
          <Field label="DESCRIPTION">
            <NTextarea reg={register('description')} rows={2} placeholder="Optional description" />
          </Field>
          <FormFooter onCancel={() => setModal(false)} submitLabel={editing ? 'Update Department' : 'Create Department'} />
        </form>
      </Modal>
    </div>
  );
};

// ── EMPLOYEES TAB ─────────────────────────────────────────────────────────────
const EMP_COLORS = ['#FFD966','#0EA5E9','#16A34A','#FF6B35','#8B5CF6','#EC4899'];

const EmployeesTab = () => {
  const dispatch = useDispatch();
  const { employees, departments, loading } = useSelector(s => s.hr);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch]   = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { dispatch(fetchEmployees()); dispatch(fetchDepartments()); }, [dispatch]);

  const openAdd = () => {
    setEditing(null);
    reset({ employmentType: 'full_time', salary: { base: 0, hra: 0, allowances: 0, deductions: 0 }, bankDetails: { bankName: '', accountNo: '', ifscCode: '' } });
    setModal(true);
  };
  const openEdit = (e) => {
    setEditing(e);
    reset({ designation: e.designation, phone: e.phone, address: e.address, employmentType: e.employmentType,
      salary: { base: e.salary?.base||0, hra: e.salary?.hra||0, allowances: e.salary?.allowances||0, deductions: e.salary?.deductions||0 },
      bankDetails: { bankName: e.bankDetails?.bankName||'', accountNo: e.bankDetails?.accountNo||'', ifscCode: e.bankDetails?.ifscCode||'' } });
    setModal(true);
  };

  const onSubmit = async (data) => {
    const payload = { ...data,
      salary: { base: Number(data.salary?.base)||0, hra: Number(data.salary?.hra)||0, allowances: Number(data.salary?.allowances)||0, deductions: Number(data.salary?.deductions)||0 },
      bankDetails: { bankName: data.bankDetails?.bankName||'', accountNo: data.bankDetails?.accountNo||'', ifscCode: data.bankDetails?.ifscCode||'' }
    };
    const res = await dispatch(editing ? updateEmployee({ id: editing._id, payload }) : createEmployee(payload));
    if (res.meta.requestStatus === 'fulfilled') { toast.success(editing ? 'Employee updated!' : 'Employee created! Default password: Employee@123'); setModal(false); reset(); }
    else toast.error(res.payload || 'Error');
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, ID or designation..." />
        <GreenBtn onClick={() => exportEmployees(employees)}>⬇ Excel</GreenBtn>
        <PrimaryBtn onClick={openAdd}>+ Add Employee</PrimaryBtn>
      </div>

      <div style={S.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['ID','Employee','Designation','Department','Joining','Base Salary','Type','Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: 40, color: '#CCC' }}>Loading employees...</td></tr>
              : filtered.length === 0 ? <EmptyRow cols={8} message="No employees found." />
              : filtered.map((e, i) => (
                <tr key={e._id} style={{ background: i % 2 === 0 ? 'white' : '#FAFAF8' }}>
                  <td style={S.td}>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#0EA5E9', background: '#F0F9FF', padding: '3px 8px', borderRadius: 6, border: '1px solid #BAE6FD' }}>{e.employeeId}</span>
                  </td>
                  <td style={S.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, background: EMP_COLORS[i % EMP_COLORS.length], borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 800, fontSize: 14, color: '#0A0A0A', flexShrink: 0 }}>
                        {e.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: '#0A0A0A' }}>{e.user?.name}</p>
                        <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: '#AAA' }}>{e.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...S.td, color: '#555' }}>{e.designation}</td>
                  <td style={{ ...S.td, color: '#888' }}>{e.department?.name || '—'}</td>
                  <td style={{ ...S.td, color: '#888' }}>{e.dateOfJoining ? new Date(e.dateOfJoining).toLocaleDateString() : '—'}</td>
                  <td style={{ ...S.td, fontFamily: 'Syne', fontWeight: 700, color: '#16A34A' }}>₹{e.salary?.base?.toLocaleString() || 0}</td>
                  <td style={S.td}>
                    <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', padding: '4px 10px', borderRadius: 100, background: '#EFF6FF', color: '#2563EB', border: '1.5px solid #BFDBFE' }}>
                      {e.employmentType?.replace('_',' ').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ ...S.td, display: 'flex', gap: 6 }}>
                    <button onClick={() => openEdit(e)} style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 11, background: '#F4F4F0', border: '1.5px solid #E8E8E3', padding: '5px 10px', borderRadius: 7, cursor: 'pointer', color: '#0A0A0A', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#0A0A0A'; e.currentTarget.style.color = 'white'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#F4F4F0'; e.currentTarget.style.color = '#0A0A0A'; }}>Edit</button>
                    <button onClick={() => handleDeactivate(e._id)} style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 11, background: '#FEF2F2', border: '1.5px solid #FECACA', padding: '5px 10px', borderRadius: 7, cursor: 'pointer', color: '#DC2626', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#DC2626'; e.currentTarget.style.color = 'white'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; }}>Remove</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Employee' : 'Add New Employee'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <SectionDivider icon="👤" title="Personal Information" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 8 }}>
            {!editing && <>
              <Field label="FULL NAME *" error={errors.name?.message}>
                <NInput reg={register('name', { required: 'Name required' })} placeholder="John Doe" />
              </Field>
              <Field label="EMAIL *" error={errors.email?.message}>
                <NInput reg={register('email', { required: 'Email required' })} type="email" placeholder="john@company.com" />
              </Field>
              <Field label="DEPARTMENT">
                <NSelect reg={register('department')}>
                  <option value="">Select department</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </NSelect>
              </Field>
              <Field label="DATE OF JOINING *" error={errors.dateOfJoining?.message}>
                <NInput reg={register('dateOfJoining', { required: true })} type="date" />
              </Field>
            </>}
            <Field label="DESIGNATION *" error={errors.designation?.message}>
              <NInput reg={register('designation', { required: 'Designation required' })} placeholder="e.g. Sales Executive" />
            </Field>
            <Field label="EMPLOYMENT TYPE">
              <NSelect reg={register('employmentType')}>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
              </NSelect>
            </Field>
            <Field label="PHONE"><NInput reg={register('phone')} placeholder="+91 XXXXX XXXXX" /></Field>
            <Field label="ADDRESS"><NInput reg={register('address')} placeholder="Full address" /></Field>
          </div>

          <SectionDivider icon="💰" title="Salary Structure (Monthly ₹)" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 8 }}>
            <Field label="BASIC SALARY"><NInput reg={register('salary.base', { valueAsNumber: true })} type="number" min="0" placeholder="30000" /></Field>
            <Field label="HRA"><NInput reg={register('salary.hra', { valueAsNumber: true })} type="number" min="0" placeholder="5000" /></Field>
            <Field label="OTHER ALLOWANCES"><NInput reg={register('salary.allowances', { valueAsNumber: true })} type="number" min="0" placeholder="3000" /></Field>
            <Field label="FIXED DEDUCTIONS"><NInput reg={register('salary.deductions', { valueAsNumber: true })} type="number" min="0" placeholder="1000" /></Field>
          </div>

          <SectionDivider icon="🏦" title="Bank Details" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 8 }}>
            <Field label="BANK NAME"><NInput reg={register('bankDetails.bankName')} placeholder="e.g. HDFC Bank" /></Field>
            <Field label="ACCOUNT NUMBER"><NInput reg={register('bankDetails.accountNo')} placeholder="Account number" /></Field>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="IFSC CODE"><NInput reg={register('bankDetails.ifscCode')} placeholder="e.g. HDFC0001234" /></Field>
            </div>
          </div>

          <FormFooter onCancel={() => setModal(false)} submitLabel={editing ? 'Update Employee' : 'Create Employee'} />
        </form>
      </Modal>
    </div>
  );
};

// ── ATTENDANCE TAB ────────────────────────────────────────────────────────────
const ATT_STATUS = {
  present:  { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  absent:   { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  half_day: { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  leave:    { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  holiday:  { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
};

const AttendanceTab = () => {
  const dispatch = useDispatch();
  const { attendance, employees } = useSelector(s => s.hr);
  const [modal, setModal]     = useState(false);
  const [filterEmp, setFilterEmp] = useState('');
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year,  setYear]  = useState(today.getFullYear());
  const { register, handleSubmit, reset } = useForm({ defaultValues: { date: today.toISOString().split('T')[0], status: 'present' } });

  useEffect(() => {
    dispatch(fetchAttendance({ month, year, employee: filterEmp || undefined }));
    dispatch(fetchEmployees());
  }, [dispatch, month, year, filterEmp]);

  const onSubmit = async (data) => {
    const res = await dispatch(markAttendance(data));
    if (res.meta.requestStatus === 'fulfilled') { toast.success('Attendance marked!'); setModal(false); reset(); }
    else toast.error(res.payload || 'Error');
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <NSelect value={month} onChange={e => setMonth(Number(e.target.value))} style={{ width: 110 }}>
          {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
        </NSelect>
        <NSelect value={year} onChange={e => setYear(Number(e.target.value))} style={{ width: 100 }}>
          {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
        </NSelect>
        <NSelect value={filterEmp} onChange={e => setFilterEmp(e.target.value)} style={{ flex: 1, minWidth: 180 }}>
          <option value="">All Employees</option>
          {employees.map(e => <option key={e._id} value={e._id}>{e.user?.name}</option>)}
        </NSelect>
        <PrimaryBtn onClick={() => setModal(true)}>+ Mark Attendance</PrimaryBtn>
      </div>

      <div style={S.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Employee','Date','Check In','Check Out','Hours','Status','Notes'].map(h => <th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {attendance.length === 0 ? <EmptyRow cols={7} message="No attendance records found." />
              : attendance.map((a, i) => {
                const st = ATT_STATUS[a.status] || { bg: '#F4F4F0', color: '#666', border: '#E8E8E3' };
                return (
                  <tr key={a._id} style={{ background: i % 2 === 0 ? 'white' : '#FAFAF8' }}>
                    <td style={{ ...S.td, fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: '#0A0A0A' }}>{a.employee?.user?.name || '—'}</td>
                    <td style={{ ...S.td, color: '#666' }}>{new Date(a.date).toLocaleDateString()}</td>
                    <td style={{ ...S.td, color: '#555', fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{a.checkIn || '—'}</td>
                    <td style={{ ...S.td, color: '#555', fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{a.checkOut || '—'}</td>
                    <td style={{ ...S.td, fontFamily: 'Syne', fontWeight: 700, color: '#0A0A0A' }}>{a.hoursWorked?.toFixed(1) || '0'}h</td>
                    <td style={S.td}>
                      <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', padding: '4px 10px', borderRadius: 100, background: st.bg, color: st.color, border: `1.5px solid ${st.border}` }}>
                        {a.status?.replace('_',' ').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ ...S.td, color: '#AAA', fontSize: 12 }}>{a.notes || '—'}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Mark Attendance">
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="EMPLOYEE *"><NSelect reg={register('employee', { required: true })}>
            <option value="">Select employee</option>
            {employees.map(e => <option key={e._id} value={e._id}>{e.user?.name} ({e.employeeId})</option>)}
          </NSelect></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="DATE *"><NInput reg={register('date', { required: true })} type="date" /></Field>
            <Field label="STATUS *"><NSelect reg={register('status', { required: true })}>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="half_day">Half Day</option>
              <option value="leave">On Leave</option>
              <option value="holiday">Holiday</option>
            </NSelect></Field>
            <Field label="CHECK IN TIME"><NInput reg={register('checkIn')} type="time" /></Field>
            <Field label="CHECK OUT TIME"><NInput reg={register('checkOut')} type="time" /></Field>
          </div>
          <Field label="NOTES"><NInput reg={register('notes')} placeholder="Optional notes" /></Field>
          <FormFooter onCancel={() => setModal(false)} submitLabel="Mark Attendance" />
        </form>
      </Modal>
    </div>
  );
};

// ── LEAVES TAB ────────────────────────────────────────────────────────────────
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

  const FILTER_OPTS = [
    { key: '', label: 'All' },
    { key: 'pending',  label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 6, background: '#F4F4F0', padding: 5, borderRadius: 12 }}>
          {FILTER_OPTS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontFamily: 'Syne', fontWeight: 700, fontSize: 12, transition: 'all 0.18s',
              background: filter === f.key ? 'white' : 'transparent',
              color: filter === f.key ? '#0A0A0A' : '#888',
              boxShadow: filter === f.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}>{f.label}</button>
          ))}
        </div>
        <PrimaryBtn onClick={() => setModal(true)}>+ Apply Leave</PrimaryBtn>
      </div>

      <div style={S.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Employee','Leave Type','From','To','Days','Reason','Status','Action'].map(h => <th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {leaves.length === 0 ? <EmptyRow cols={8} message="No leave requests found." />
              : leaves.map((l, i) => (
                <tr key={l._id} style={{ background: i % 2 === 0 ? 'white' : '#FAFAF8' }}>
                  <td style={{ ...S.td, fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: '#0A0A0A' }}>{l.employee?.user?.name || '—'}</td>
                  <td style={{ ...S.td, textTransform: 'capitalize', color: '#555' }}>{l.leaveType}</td>
                  <td style={{ ...S.td, color: '#666' }}>{new Date(l.fromDate).toLocaleDateString()}</td>
                  <td style={{ ...S.td, color: '#666' }}>{new Date(l.toDate).toLocaleDateString()}</td>
                  <td style={{ ...S.td }}>
                    <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 14, color: '#0EA5E9', background: '#F0F9FF', padding: '3px 10px', borderRadius: 8, border: '1px solid #BAE6FD' }}>{l.days}d</span>
                  </td>
                  <td style={{ ...S.td, color: '#AAA', fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.reason || '—'}</td>
                  <td style={S.td}><Badge status={l.status} /></td>
                  <td style={{ ...S.td, display: 'flex', gap: 6 }}>
                    {l.status === 'pending' && (<>
                      <button onClick={() => handleStatus(l._id,'approved')} style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 11, background: '#F0FDF4', color: '#16A34A', border: '1.5px solid #BBF7D0', padding: '5px 10px', borderRadius: 7, cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#16A34A'; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#F0FDF4'; e.currentTarget.style.color = '#16A34A'; }}>✓ Approve</button>
                      <button onClick={() => handleStatus(l._id,'rejected')} style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 11, background: '#FEF2F2', color: '#DC2626', border: '1.5px solid #FECACA', padding: '5px 10px', borderRadius: 7, cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#DC2626'; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; }}>✗ Reject</button>
                    </>)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Apply Leave">
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="EMPLOYEE *" error={errors.employee?.message}>
            <NSelect reg={register('employee', { required: true })}>
              <option value="">Select employee</option>
              {employees.map(e => <option key={e._id} value={e._id}>{e.user?.name} ({e.employeeId})</option>)}
            </NSelect>
          </Field>
          <Field label="LEAVE TYPE *" error={errors.leaveType?.message}>
            <NSelect reg={register('leaveType', { required: true })}>
              <option value="">Select type</option>
              <option value="annual">Annual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="casual">Casual Leave</option>
              <option value="unpaid">Unpaid Leave</option>
            </NSelect>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="FROM DATE *" error={errors.fromDate?.message}><NInput reg={register('fromDate', { required: true })} type="date" /></Field>
            <Field label="TO DATE *" error={errors.toDate?.message}><NInput reg={register('toDate', { required: true })} type="date" /></Field>
          </div>
          <Field label="REASON"><NTextarea reg={register('reason')} rows={2} placeholder="Reason for leave..." /></Field>
          <FormFooter onCancel={() => setModal(false)} submitLabel="Apply Leave" />
        </form>
      </Modal>
    </div>
  );
};

// ── PAYROLL TAB ───────────────────────────────────────────────────────────────
const PayrollTab = () => {
  const dispatch = useDispatch();
  const { payrolls } = useSelector(s => s.hr);
  const today = new Date();
  const [month, setMonth]         = useState(today.getMonth() + 1);
  const [year,  setYear]          = useState(today.getFullYear());
  const [processing, setProcessing] = useState(false);

  useEffect(() => { dispatch(fetchPayrolls({ month, year })); }, [dispatch, month, year]);

  const handleProcess = async () => {
    if (!window.confirm(`Process payroll for ${MONTHS[month-1]} ${year}?`)) return;
    setProcessing(true);
    const res = await dispatch(processPayroll({ month, year }));
    setProcessing(false);
    if (res.meta.requestStatus === 'fulfilled') toast.success(`Payroll processed! ${res.payload.length} records created.`);
    else toast.error(res.payload || 'Error');
  };

  const handleMarkPaid = async (id) => {
    const res = await dispatch(markPayrollPaid(id));
    if (res.meta.requestStatus === 'fulfilled') toast.success('Marked as paid!');
    else toast.error(res.payload || 'Error');
  };

  const handleDownloadPayslip = async (id) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5000/api/hr/payroll/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
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

  const totalNet   = payrolls.reduce((sum, p) => sum + p.netSalary, 0);
  const totalGross = payrolls.reduce((sum, p) => sum + p.grossSalary, 0);

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <NSelect value={month} onChange={e => setMonth(Number(e.target.value))} style={{ width: 110 }}>
          {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
        </NSelect>
        <NSelect value={year} onChange={e => setYear(Number(e.target.value))} style={{ width: 100 }}>
          {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
        </NSelect>
        <div style={{ flex: 1 }} />
        <GreenBtn onClick={() => exportPayroll(payrolls, month, year)}>⬇ Excel</GreenBtn>
        <button onClick={handleProcess} disabled={processing} style={{
          padding: '10px 20px', background: processing ? '#AAA' : '#16A34A', color: 'white',
          border: 'none', borderRadius: 10, fontFamily: 'Syne', fontWeight: 700, fontSize: 13,
          cursor: processing ? 'not-allowed' : 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
        }}
          onMouseEnter={e => { if (!processing) e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
          {processing ? '⏳ Processing...' : '▶ Run Payroll'}
        </button>
      </div>

      {/* Payroll Summary */}
      {payrolls.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Total Employees', value: payrolls.length, accent: '#0EA5E9', icon: '👤' },
            { label: 'Total Gross', value: `₹${totalGross.toLocaleString()}`, accent: '#FF6B35', icon: '💵' },
            { label: 'Net Payable', value: `₹${totalNet.toLocaleString()}`, accent: '#16A34A', icon: '💰' },
          ].map(c => (
            <div key={c.label} style={{ ...S.card, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: c.accent }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, background: '#0A0A0A', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{c.icon}</div>
                <div>
                  <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, color: '#0A0A0A', letterSpacing: '-0.02em' }}>{c.value}</p>
                  <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: '#999' }}>{c.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={S.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Employee','Basic','HRA','Allow.','Gross','PF','Tax','Deductions','Net Salary','Status','Actions'].map(h => <th key={h} style={{ ...S.th, whiteSpace: 'nowrap' }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {payrolls.length === 0 ? (
              <tr><td colSpan={11} style={{ textAlign: 'center', padding: '48px 16px' }}>
                <div style={{ fontSize: 32, opacity: 0.15, marginBottom: 10 }}>💰</div>
                <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: '#CCC' }}>No payroll records. Click "Run Payroll" to process {MONTHS[month-1]} {year}.</p>
              </td></tr>
            ) : payrolls.map((p, i) => (
              <tr key={p._id} style={{ background: i % 2 === 0 ? 'white' : '#FAFAF8' }}>
                <td style={{ ...S.td, fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: '#0A0A0A', whiteSpace: 'nowrap' }}>{p.employee?.user?.name}</td>
                <td style={{ ...S.td, color: '#555' }}>₹{p.earnings?.basic?.toLocaleString()}</td>
                <td style={{ ...S.td, color: '#555' }}>₹{p.earnings?.hra?.toLocaleString()}</td>
                <td style={{ ...S.td, color: '#555' }}>₹{p.earnings?.allowances?.toLocaleString()}</td>
                <td style={{ ...S.td, fontFamily: 'Syne', fontWeight: 700, color: '#0A0A0A' }}>₹{p.grossSalary?.toLocaleString()}</td>
                <td style={{ ...S.td, color: '#DC2626' }}>-₹{p.deductions?.providentFund?.toLocaleString()}</td>
                <td style={{ ...S.td, color: '#DC2626' }}>-₹{p.deductions?.tax?.toLocaleString()}</td>
                <td style={{ ...S.td, color: '#DC2626' }}>-₹{p.totalDeductions?.toLocaleString()}</td>
                <td style={{ ...S.td, fontFamily: 'Syne', fontWeight: 800, color: '#16A34A', fontSize: 14 }}>₹{p.netSalary?.toLocaleString()}</td>
                <td style={S.td}><Badge status={p.status} /></td>
                <td style={{ ...S.td }}>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {p.status === 'processed' && (
                      <button onClick={() => handleMarkPaid(p._id)} style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 10, background: '#F0FDF4', color: '#16A34A', border: '1.5px solid #BBF7D0', padding: '4px 10px', borderRadius: 7, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#16A34A'; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#F0FDF4'; e.currentTarget.style.color = '#16A34A'; }}>✓ Paid</button>
                    )}
                    <button onClick={() => handleDownloadPayslip(p._id)} style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 10, background: '#F4F4F0', color: '#555', border: '1.5px solid #E8E8E3', padding: '4px 10px', borderRadius: 7, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#0A0A0A'; e.currentTarget.style.color = 'white'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#F4F4F0'; e.currentTarget.style.color = '#555'; }}>⬇ PDF</button>
                    <button onClick={() => handleEmailPayslip(p._id)} style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 10, background: '#F5F3FF', color: '#7C3AED', border: '1.5px solid #DDD6FE', padding: '4px 10px', borderRadius: 7, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#7C3AED'; e.currentTarget.style.color = 'white'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#F5F3FF'; e.currentTarget.style.color = '#7C3AED'; }}>✉ Email</button>
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

// ── MAIN HR PAGE ──────────────────────────────────────────────────────────────
const TABS = [
  { key: 'Employees',   icon: '👤' },
  { key: 'Departments', icon: '🏢' },
  { key: 'Attendance',  icon: '✅' },
  { key: 'Leaves',      icon: '📋' },
  { key: 'Payroll',     icon: '💰' },
];

const HR = () => {
  const dispatch = useDispatch();
  const { stats } = useSelector(s => s.hr);
  const [tab, setTab] = useState('Employees');

  useEffect(() => { dispatch(fetchHRStats()); }, [dispatch]);

  return (
    <div style={{ fontFamily: "'Syne', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .hr-fadein { animation: fadeUp 0.4s ease both; }
      `}</style>

      {/* Page Header */}
      <div className="hr-fadein" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 26, letterSpacing: '-0.025em', color: '#0A0A0A', marginBottom: 4 }}>
            👥 HR & Payroll
          </h1>
          <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: '#AAA' }}>Manage employees, attendance, leaves and payroll</p>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFF8E7', border: '1.5px solid #FFD966', borderRadius: 100, padding: '6px 14px' }}>
          <div style={{ width: 7, height: 7, background: '#16A34A', borderRadius: '50%' }}></div>
          <span style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 600, color: '#92600A' }}>HR System</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="hr-fadein" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28, animationDelay: '0.05s' }}>
        <KPICard icon="👤" label="Total Employees"  value={stats?.totalEmployees}   accent="#0EA5E9" />
        <KPICard icon="🏢" label="Departments"       value={stats?.totalDepartments} accent="#8B5CF6" />
        <KPICard icon="✅" label="Present Today"     value={stats?.presentToday}     accent="#16A34A" />
        <KPICard icon="📋" label="Pending Leaves"    value={stats?.pendingLeaves}    accent="#FF6B35" />
        <KPICard icon="💰" label="Monthly Payroll" accent="#FFD966"
          value={stats?.monthlyPayroll ? `₹${Math.round(stats.monthlyPayroll/1000)}K` : '—'} />
      </div>

      {/* Tabs */}
      <div className="hr-fadein" style={{ display: 'flex', gap: 4, background: '#F4F4F0', padding: 6, borderRadius: 14, marginBottom: 24, animationDelay: '0.1s', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontFamily: 'Syne', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap',
            transition: 'all 0.18s',
            background: tab === t.key ? 'white' : 'transparent',
            color: tab === t.key ? '#0A0A0A' : '#888',
            boxShadow: tab === t.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
          }}>
            {t.icon} {t.key}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="hr-fadein" style={{ animationDelay: '0.15s' }}>
        {tab === 'Employees'   && <EmployeesTab />}
        {tab === 'Departments' && <DepartmentsTab />}
        {tab === 'Attendance'  && <AttendanceTab />}
        {tab === 'Leaves'      && <LeavesTab />}
        {tab === 'Payroll'     && <PayrollTab />}
      </div>
    </div>
  );
};

export default HR;