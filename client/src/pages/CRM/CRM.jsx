import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  fetchCRMStats, fetchCustomers, createCustomer,
  fetchLeads, createLead, updateLead, convertLead,
  fetchSalesOrders, createSalesOrder, updateOrderStatus,
} from '../../features/crm/crmSlice';
import { fetchProducts, fetchWarehouses } from '../../features/inventory/inventorySlice';
import Modal  from '../../components/UI/Modal';
import Badge  from '../../components/UI/Badge';
import { useForm } from 'react-hook-form';
import { exportCustomers, exportOrders } from '../../utils/exportExcel';

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
  label: {
    fontFamily: 'Syne', fontWeight: 700, fontSize: 11,
    color: '#0A0A0A', display: 'block', marginBottom: 7, letterSpacing: '0.05em',
  },
  card: { background: 'white', border: '2px solid #F0F0EB', borderRadius: 16, overflow: 'hidden' },
  th: {
    padding: '12px 16px', textAlign: 'left',
    fontFamily: 'Syne', fontWeight: 700, fontSize: 10,
    color: '#AAA', letterSpacing: '0.08em',
    borderBottom: '2px solid #F0F0EB', background: '#FAFAF8',
  },
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

const NInput = ({ reg, style = {}, ...props }) => (
  <input {...reg} {...props} style={{ ...S.input, ...style }} onFocus={focusIn} onBlur={focusOut} />
);

const NSelect = ({ reg, children, style = {}, onChange, value, ...props }) => {
  const selectProps = reg ? { ...reg } : { onChange, value };
  return (
    <select {...selectProps} {...props} style={{ ...S.select, ...style }} onFocus={focusIn} onBlur={focusOut}>
      {children}
    </select>
  );
};

const NTextarea = ({ reg, ...props }) => (
  <textarea {...reg} {...props}
    style={{ ...S.input, resize: 'vertical', minHeight: 72 }}
    onFocus={focusIn} onBlur={focusOut} />
);

const PrimaryBtn = ({ children, style = {}, ...props }) => (
  <button style={{ padding: '10px 20px', background: '#0A0A0A', color: 'white', border: 'none', borderRadius: 10, fontFamily: 'Syne', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', whiteSpace: 'nowrap', ...style }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    {...props}>{children}</button>
);

const SecondaryBtn = ({ children, style = {}, ...props }) => (
  <button style={{ padding: '10px 20px', background: 'white', border: '2px solid #E8E8E3', borderRadius: 10, fontFamily: 'DM Sans', fontWeight: 500, fontSize: 13, color: '#555', cursor: 'pointer', whiteSpace: 'nowrap', ...style }}
    onMouseEnter={e => e.currentTarget.style.borderColor = '#0A0A0A'}
    onMouseLeave={e => e.currentTarget.style.borderColor = '#E8E8E3'}
    {...props}>{children}</button>
);

const ExcelBtn = ({ children, ...props }) => (
  <button style={{ padding: '10px 16px', background: '#F0FDF4', border: '2px solid #BBF7D0', borderRadius: 10, fontFamily: 'Syne', fontWeight: 700, fontSize: 12, color: '#16A34A', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
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
    <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.15 }}>🤝</div>
    <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: '#CCC' }}>{message}</p>
  </td></tr>
);

const FormFooter = ({ onCancel, submitLabel }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid #F0F0EB', marginTop: 8 }}>
    <SecondaryBtn type="button" onClick={onCancel}>Cancel</SecondaryBtn>
    <PrimaryBtn type="submit">{submitLabel}</PrimaryBtn>
  </div>
);

const LEAD_STAGE_STYLE = {
  new:       { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  contacted: { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  qualified: { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  lost:      { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  converted: { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
};

const StagePill = ({ stage }) => {
  const st = LEAD_STAGE_STYLE[stage] || LEAD_STAGE_STYLE.new;
  return (
    <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 10, letterSpacing: '0.06em',
      padding: '4px 10px', borderRadius: 100, background: st.bg, color: st.color, border: `1.5px solid ${st.border}` }}>
      {stage?.toUpperCase()}
    </span>
  );
};

// ── CUSTOMERS TAB ─────────────────────────────────────────────────────────────
const CustomersTab = () => {
  const dispatch = useDispatch();
  const { customers } = useSelector(s => s.crm);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { dispatch(fetchCustomers()); }, [dispatch]);

  const onSubmit = async (data) => {
    const res = await dispatch(createCustomer(data));
    if (res.meta.requestStatus === 'fulfilled') { toast.success('Customer added!'); setModal(false); reset(); }
    else toast.error(res.payload || 'Error');
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search customers by name or email..." />
        <ExcelBtn onClick={() => exportCustomers(customers)}>⬇ Excel</ExcelBtn>
        <PrimaryBtn onClick={() => setModal(true)}>+ Add Customer</PrimaryBtn>
      </div>

      <div style={S.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Customer','Company','Email','Phone','Total Orders','Total Spent'].map(h => <th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? <EmptyRow cols={6} message="No customers yet. Add your first customer!" />
              : filtered.map((c, i) => (
                <tr key={c._id} style={{ background: i % 2 === 0 ? 'white' : '#FAFAF8' }}>
                  <td style={{ ...S.td }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, background: '#FFD966', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 800, fontSize: 13, color: '#0A0A0A', flexShrink: 0 }}>
                        {c.name?.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: '#0A0A0A' }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ ...S.td, color: '#666' }}>{c.company || '—'}</td>
                  <td style={{ ...S.td, color: '#888' }}>{c.email || '—'}</td>
                  <td style={{ ...S.td, color: '#888' }}>{c.phone || '—'}</td>
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 14, color: '#0EA5E9', background: '#F0F9FF', padding: '3px 10px', borderRadius: 8, border: '1px solid #BAE6FD' }}>{c.totalOrders}</span>
                  </td>
                  <td style={{ ...S.td, fontFamily: 'Syne', fontWeight: 700, color: '#16A34A' }}>₹{c.totalSpent?.toLocaleString()}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add Customer">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="FULL NAME *" error={errors.name?.message}>
                <NInput reg={register('name', { required: 'Name required' })} placeholder="John Doe" />
              </Field>
            </div>
            <Field label="EMAIL"><NInput reg={register('email')} type="email" placeholder="john@email.com" /></Field>
            <Field label="PHONE"><NInput reg={register('phone')} placeholder="+91 XXXXX XXXXX" /></Field>
            <Field label="COMPANY"><NInput reg={register('company')} placeholder="Company name" /></Field>
            <Field label="CREDIT LIMIT (₹)"><NInput reg={register('creditLimit', { valueAsNumber: true })} type="number" placeholder="0" /></Field>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="ADDRESS"><NInput reg={register('address')} placeholder="Full address" /></Field>
            </div>
          </div>
          <div style={{ marginTop: 20 }}><FormFooter onCancel={() => setModal(false)} submitLabel="Add Customer" /></div>
        </form>
      </Modal>
    </div>
  );
};

// ── LEADS TAB ─────────────────────────────────────────────────────────────────
const LEAD_STAGES = ['new','contacted','qualified','lost','converted'];
const STAGE_ICONS = { new: '🆕', contacted: '📞', qualified: '✅', lost: '❌', converted: '🎉' };
const STAGE_ACCENTS = { new: '#0EA5E9', contacted: '#D97706', qualified: '#16A34A', lost: '#DC2626', converted: '#7C3AED' };

const LeadsTab = () => {
  const dispatch = useDispatch();
  const { leads } = useSelector(s => s.crm);
  const [modal, setModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { dispatch(fetchLeads()); }, [dispatch]);

  const onSubmit = async (data) => {
    const res = await dispatch(createLead(data));
    if (res.meta.requestStatus === 'fulfilled') { toast.success('Lead added!'); setModal(false); reset(); }
    else toast.error(res.payload || 'Error');
  };

  const handleStatusChange = async (id, status) => {
    await dispatch(updateLead({ id, payload: { status } }));
    toast.success('Lead status updated!');
  };

  const handleConvert = async (id) => {
    const res = await dispatch(convertLead(id));
    if (res.meta.requestStatus === 'fulfilled') toast.success('Lead converted to customer! 🎉');
    else toast.error(res.payload || 'Error');
  };

  const filtered = filterStatus ? leads.filter(l => l.status === filterStatus) : leads;

  return (
    <div>
      {/* Stage summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        {LEAD_STAGES.map(stage => {
          const count = leads.filter(l => l.status === stage).length;
          const accent = STAGE_ACCENTS[stage];
          return (
            <div key={stage} onClick={() => setFilterStatus(filterStatus === stage ? '' : stage)}
              style={{ ...S.card, padding: '16px', cursor: 'pointer', position: 'relative', overflow: 'hidden',
                transition: 'transform 0.18s, box-shadow 0.18s',
                outline: filterStatus === stage ? `2px solid ${accent}` : 'none',
                outlineOffset: 2,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent }} />
              <div style={{ fontSize: 22, marginBottom: 8 }}>{STAGE_ICONS[stage]}</div>
              <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: '#0A0A0A', letterSpacing: '-0.02em' }}>{count}</p>
              <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: '#999', textTransform: 'capitalize', marginTop: 2 }}>{stage}</p>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <NSelect value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 180 }}>
          <option value="">All Stages</option>
          {LEAD_STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </NSelect>
        <div style={{ flex: 1 }} />
        <PrimaryBtn onClick={() => setModal(true)}>+ Add Lead</PrimaryBtn>
      </div>

      <div style={S.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Lead','Company','Phone','Source','Value','Stage','Action'].map(h => <th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? <EmptyRow cols={7} message="No leads found." />
              : filtered.map((l, i) => (
                <tr key={l._id} style={{ background: i % 2 === 0 ? 'white' : '#FAFAF8' }}>
                  <td style={{ ...S.td }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, background: STAGE_ACCENTS[l.status] || '#E8E8E3', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 800, fontSize: 13, color: 'white', flexShrink: 0 }}>
                        {l.name?.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: '#0A0A0A' }}>{l.name}</span>
                    </div>
                  </td>
                  <td style={{ ...S.td, color: '#666' }}>{l.company || '—'}</td>
                  <td style={{ ...S.td, color: '#888' }}>{l.phone || '—'}</td>
                  <td style={{ ...S.td, color: '#888', textTransform: 'capitalize' }}>{l.source?.replace('_',' ')}</td>
                  <td style={{ ...S.td, fontFamily: 'Syne', fontWeight: 700, color: '#16A34A' }}>₹{l.value?.toLocaleString() || 0}</td>
                  <td style={S.td}>
                    <select value={l.status} onChange={e => handleStatusChange(l._id, e.target.value)}
                      style={{ ...S.select, width: 130, padding: '5px 32px 5px 10px', fontSize: 12 }}
                      onFocus={focusIn} onBlur={focusOut}>
                      {LEAD_STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                    </select>
                  </td>
                  <td style={S.td}>
                    {l.status === 'qualified' && (
                      <button onClick={() => handleConvert(l._id)} style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 11, background: '#F5F3FF', color: '#7C3AED', border: '1.5px solid #DDD6FE', padding: '5px 12px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#7C3AED'; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#F5F3FF'; e.currentTarget.style.color = '#7C3AED'; }}>
                        🎉 Convert
                      </button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add New Lead">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="FULL NAME *" error={errors.name?.message}>
                <NInput reg={register('name', { required: 'Name required' })} placeholder="John Doe" />
              </Field>
            </div>
            <Field label="EMAIL"><NInput reg={register('email')} type="email" placeholder="john@email.com" /></Field>
            <Field label="PHONE"><NInput reg={register('phone')} placeholder="+91 XXXXX XXXXX" /></Field>
            <Field label="COMPANY"><NInput reg={register('company')} placeholder="Company name" /></Field>
            <Field label="ESTIMATED VALUE (₹)">
              <NInput reg={register('value', { valueAsNumber: true })} type="number" placeholder="0" />
            </Field>
            <Field label="SOURCE">
              <NSelect reg={register('source')}>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="cold_call">Cold Call</option>
                <option value="social_media">Social Media</option>
                <option value="other">Other</option>
              </NSelect>
            </Field>
            <Field label="FOLLOW UP DATE">
              <NInput reg={register('followUpDate')} type="date" />
            </Field>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="NOTES"><NTextarea reg={register('notes')} rows={2} placeholder="Any notes..." /></Field>
            </div>
          </div>
          <div style={{ marginTop: 20 }}><FormFooter onCancel={() => setModal(false)} submitLabel="Add Lead" /></div>
        </form>
      </Modal>
    </div>
  );
};

// ── SALES ORDERS TAB ──────────────────────────────────────────────────────────
const STATUS_STYLE = {
  pending:    { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  processing: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  shipped:    { bg: '#F0F9FF', color: '#0891B2', border: '#BAE6FD' },
  delivered:  { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  cancelled:  { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
};

const STATUS_FLOW = { pending: ['processing','cancelled'], processing: ['shipped','cancelled'], shipped: ['delivered'] };

const SalesOrdersTab = () => {
  const dispatch = useDispatch();
  const { orders, customers } = useSelector(s => s.crm);
  const { products, warehouses } = useSelector(s => s.inventory);
  const [modal, setModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [items, setItems] = useState([{ product: '', name: '', quantity: 1, unitPrice: 0, discount: 0 }]);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    dispatch(fetchSalesOrders()); dispatch(fetchCustomers());
    dispatch(fetchProducts());    dispatch(fetchWarehouses());
  }, [dispatch]);

  const addItem    = () => setItems([...items, { product: '', name: '', quantity: 1, unitPrice: 0, discount: 0 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => { const u = [...items]; u[i] = { ...u[i], [field]: val }; setItems(u); };
  const selectProduct = (i, productId) => {
    const p = products.find(p => p._id === productId);
    if (p) { const u = [...items]; u[i] = { ...u[i], product: productId, name: p.name, unitPrice: p.sellingPrice }; setItems(u); }
  };

  const total = items.reduce((sum, item) =>
    sum + (Number(item.quantity) * Number(item.unitPrice) * (1 - Number(item.discount || 0) / 100)), 0);

  const onSubmit = async (data) => {
    const res = await dispatch(createSalesOrder({ ...data, items }));
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success('Sales Order created! 🛒'); setModal(false); reset();
      setItems([{ product: '', name: '', quantity: 1, unitPrice: 0, discount: 0 }]);
    } else toast.error(res.payload || 'Error');
  };

  const handleStatusUpdate = async (id, status) => {
    const res = await dispatch(updateOrderStatus({ id, status }));
    if (res.meta.requestStatus === 'fulfilled') toast.success('Order status updated!');
    else toast.error(res.payload || 'Error');
  };

  const filtered = filterStatus ? orders.filter(o => o.status === filterStatus) : orders;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <NSelect value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 180 }}>
          <option value="">All Orders</option>
          {['pending','processing','shipped','delivered','cancelled'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
          ))}
        </NSelect>
        <div style={{ flex: 1 }} />
        <ExcelBtn onClick={() => exportOrders(orders)}>⬇ Excel</ExcelBtn>
        <PrimaryBtn onClick={() => setModal(true)}>+ New Order</PrimaryBtn>
      </div>

      <div style={S.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Order #','Customer','Items','Total','Payment','Status','Update'].map(h => <th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? <EmptyRow cols={7} message="No sales orders yet. Create your first order!" />
              : filtered.map((o, i) => {
                const st = STATUS_STYLE[o.status] || STATUS_STYLE.pending;
                return (
                  <tr key={o._id} style={{ background: i % 2 === 0 ? 'white' : '#FAFAF8' }}>
                    <td style={S.td}>
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#0EA5E9', background: '#F0F9FF', padding: '3px 8px', borderRadius: 6, border: '1px solid #BAE6FD' }}>{o.orderNumber}</span>
                    </td>
                    <td style={{ ...S.td, fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: '#0A0A0A' }}>{o.customer?.name}</td>
                    <td style={{ ...S.td, color: '#888' }}>{o.items?.length} items</td>
                    <td style={{ ...S.td, fontFamily: 'Syne', fontWeight: 700, color: '#16A34A' }}>₹{o.totalAmount?.toLocaleString()}</td>
                    <td style={S.td}><Badge status={o.paymentStatus} /></td>
                    <td style={S.td}>
                      <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', padding: '4px 10px', borderRadius: 100, background: st.bg, color: st.color, border: `1.5px solid ${st.border}` }}>
                        {o.status?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ ...S.td, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {STATUS_FLOW[o.status]?.map(nextStatus => {
                        const nst = STATUS_STYLE[nextStatus] || {};
                        return (
                          <button key={nextStatus} onClick={() => handleStatusUpdate(o._id, nextStatus)}
                            style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 10, letterSpacing: '0.04em', padding: '4px 10px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s', background: nst.bg || '#F4F4F0', color: nst.color || '#555', border: `1.5px solid ${nst.border || '#E8E8E3'}`, textTransform: 'capitalize' }}
                            onMouseEnter={e => { e.currentTarget.style.opacity = '0.75'; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                            → {nextStatus}
                          </button>
                        );
                      })}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Create Sales Order" size="xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <Field label="CUSTOMER *" error={errors.customer?.message}>
              <NSelect reg={register('customer', { required: true })}>
                <option value="">Select customer</option>
                {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </NSelect>
            </Field>
            <Field label="WAREHOUSE (STOCK CHECK)">
              <NSelect reg={register('warehouse')}>
                <option value="">Select warehouse</option>
                {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
              </NSelect>
            </Field>
          </div>

          {/* Order Items */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label style={S.label}>ORDER ITEMS</label>
              <button type="button" onClick={addItem} style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 11, color: '#0A0A0A', background: '#FFD966', border: 'none', padding: '5px 12px', borderRadius: 8, cursor: 'pointer' }}>
                + Add Item
              </button>
            </div>
            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '4fr 2fr 2fr 1.5fr 1fr', gap: 8, marginBottom: 6 }}>
              {['Product','Qty','Unit Price','Disc %',''].map(h => (
                <span key={h} style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 10, color: '#AAA', letterSpacing: '0.06em' }}>{h}</span>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '4fr 2fr 2fr 1.5fr 1fr', gap: 8, alignItems: 'center' }}>
                  <select value={item.product} onChange={e => selectProduct(i, e.target.value)}
                    style={S.select} onFocus={focusIn} onBlur={focusOut}>
                    <option value="">Select product</option>
                    {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                  <input type="number" value={item.quantity} min="1" onChange={e => updateItem(i,'quantity',e.target.value)}
                    style={S.input} placeholder="Qty" onFocus={focusIn} onBlur={focusOut} />
                  <input type="number" value={item.unitPrice} onChange={e => updateItem(i,'unitPrice',e.target.value)}
                    style={S.input} placeholder="Price" onFocus={focusIn} onBlur={focusOut} />
                  <input type="number" value={item.discount} min="0" max="100" onChange={e => updateItem(i,'discount',e.target.value)}
                    style={S.input} placeholder="0%" onFocus={focusIn} onBlur={focusOut} />
                  <div style={{ textAlign: 'center' }}>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} style={{ width: 28, height: 28, background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 8, cursor: 'pointer', color: '#DC2626', fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, paddingTop: 12, borderTop: '1px solid #F0F0EB' }}>
              <div style={{ background: '#0A0A0A', borderRadius: 10, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#666' }}>Order Total</span>
                <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: '#FFD966', letterSpacing: '-0.02em' }}>
                  ₹{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <Field label="TAX RATE (%)">
              <NInput reg={register('taxRate', { valueAsNumber: true })} type="number" defaultValue={0} placeholder="0" />
            </Field>
            <Field label="SHIPPING ADDRESS">
              <NInput reg={register('shippingAddress')} placeholder="Delivery address" />
            </Field>
          </div>

          <FormFooter onCancel={() => setModal(false)} submitLabel="Create Order" />
        </form>
      </Modal>
    </div>
  );
};

// ── MAIN CRM PAGE ─────────────────────────────────────────────────────────────
const TABS = [
  { key: 'Customers',    icon: '👥' },
  { key: 'Leads',        icon: '🎯' },
  { key: 'Sales Orders', icon: '🛒' },
];

const CRM = () => {
  const dispatch = useDispatch();
  const { stats } = useSelector(s => s.crm);
  const [tab, setTab] = useState('Customers');

  useEffect(() => { dispatch(fetchCRMStats()); }, [dispatch]);

  return (
    <div style={{ fontFamily: "'Syne', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .crm-fadein { animation: fadeUp 0.4s ease both; }
      `}</style>

      {/* Page Header */}
      <div className="crm-fadein" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 26, letterSpacing: '-0.025em', color: '#0A0A0A', marginBottom: 4 }}>
            🤝 CRM & Sales
          </h1>
          <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: '#AAA' }}>Manage customers, leads and sales orders</p>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFF8E7', border: '1.5px solid #FFD966', borderRadius: 100, padding: '6px 14px' }}>
          <div style={{ width: 7, height: 7, background: '#16A34A', borderRadius: '50%' }}></div>
          <span style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 600, color: '#92600A' }}>Live Pipeline</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="crm-fadein" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28, animationDelay: '0.05s' }}>
        <KPICard icon="👥" label="Total Customers" value={stats?.totalCustomers} accent="#0EA5E9" />
        <KPICard icon="🎯" label="Open Leads"      value={stats?.openLeads}      accent="#FF6B35" />
        <KPICard icon="🛒" label="Total Orders"    value={stats?.totalOrders}    accent="#8B5CF6" />
        <KPICard icon="💰" label="Total Revenue"   accent="#16A34A"
          value={stats?.totalRevenue ? `₹${Math.round(stats.totalRevenue).toLocaleString()}` : '—'} />
      </div>

      {/* Tabs */}
      <div className="crm-fadein" style={{ display: 'flex', gap: 4, background: '#F4F4F0', padding: 6, borderRadius: 14, marginBottom: 24, animationDelay: '0.1s' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
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
      <div className="crm-fadein" style={{ animationDelay: '0.15s' }}>
        {tab === 'Customers'    && <CustomersTab />}
        {tab === 'Leads'        && <LeadsTab />}
        {tab === 'Sales Orders' && <SalesOrdersTab />}
      </div>
    </div>
  );
};

export default CRM;