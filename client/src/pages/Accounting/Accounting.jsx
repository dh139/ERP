import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  fetchAccountingStats,
  fetchAccounts, createAccount, seedAccounts,
  fetchTransactions, createTransaction,
  fetchInvoices, createInvoice, recordPayment, updateInvoiceStatus,
  fetchExpenses, createExpense, updateExpenseStatus,
  fetchProfitLoss, fetchBalanceSheet,
} from '../../features/accounting/accountingSlice';
import Modal from '../../components/UI/Modal';
import Badge from '../../components/UI/Badge';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { exportInvoices, exportExpenses } from '../../utils/exportExcel';

// ── Design Tokens ─────────────────────────────────────────────────────────────
const S = {
  input: {
    width: '100%', padding: '10px 14px',
    border: '2px solid #E8E8E3', borderRadius: 10,
    fontFamily: "'DM Sans', sans-serif", fontSize: 14,
    color: '#0A0A0A', background: 'white', outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  select: {
    width: '100%', padding: '10px 14px',
    border: '2px solid #E8E8E3', borderRadius: 10,
    fontFamily: "'DM Sans', sans-serif", fontSize: 14,
    color: '#0A0A0A', background: 'white', outline: 'none', cursor: 'pointer',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
    paddingRight: 40, appearance: 'none', WebkitAppearance: 'none',
  },
  label: { fontFamily: 'Syne', fontWeight: 700, fontSize: 11, color: '#0A0A0A', display: 'block', marginBottom: 7, letterSpacing: '0.05em' },
  card: { background: 'white', border: '2px solid #F0F0EB', borderRadius: 16, overflow: 'hidden' },
  th: { padding: '12px 16px', textAlign: 'left', fontFamily: 'Syne', fontWeight: 700, fontSize: 10, color: '#AAA', letterSpacing: '0.08em', borderBottom: '2px solid #F0F0EB', background: '#FAFAF8', whiteSpace: 'nowrap' },
  td: { padding: '13px 16px', fontFamily: 'DM Sans', fontSize: 13, color: '#444', borderBottom: '1px solid #F4F4F0' },
};

const focusIn  = e => { e.target.style.borderColor = '#0A0A0A'; e.target.style.boxShadow = '0 0 0 4px rgba(10,10,10,0.06)'; };
const focusOut = e => { e.target.style.borderColor = '#E8E8E3'; e.target.style.boxShadow = 'none'; };

// ── Shared UI Components ──────────────────────────────────────────────────────
const Field = ({ label, error, children }) => (
  <div>
    <label style={S.label}>{label}</label>
    {children}
    {error && <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#DC2626', marginTop: 4 }}>⚠ {error}</p>}
  </div>
);
const NInput    = ({ reg, style = {}, ...props }) => <input    {...reg} {...props} style={{ ...S.input, ...style }} onFocus={focusIn} onBlur={focusOut} />;
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

const FormFooter = ({ onCancel, submitLabel }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #F0F0EB', marginTop: 12 }}>
    <SecondaryBtn type="button" onClick={onCancel}>Cancel</SecondaryBtn>
    <PrimaryBtn type="submit">{submitLabel}</PrimaryBtn>
  </div>
);

const SectionDivider = ({ icon, title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 0 10px', borderBottom: '2px solid #F0F0EB', marginBottom: 14 }}>
    <div style={{ width: 28, height: 28, background: '#0A0A0A', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{icon}</div>
    <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 13, color: '#0A0A0A' }}>{title}</span>
  </div>
);

const EmptyState = ({ cols, icon, message }) => (
  <tr><td colSpan={cols} style={{ textAlign: 'center', padding: '52px 16px' }}>
    <div style={{ fontSize: 36, opacity: 0.12, marginBottom: 10 }}>{icon}</div>
    <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: '#CCC' }}>{message}</p>
  </td></tr>
);

const MonoPill = ({ children, color = '#0EA5E9', bg = '#F0F9FF', border = '#BAE6FD' }) => (
  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color, background: bg, padding: '3px 8px', borderRadius: 6, border: `1px solid ${border}` }}>{children}</span>
);

const TabFilterBar = ({ options, value, onChange }) => (
  <div style={{ display: 'flex', gap: 6, background: '#F4F4F0', padding: 5, borderRadius: 12 }}>
    {options.map(o => (
      <button key={o.key} onClick={() => onChange(o.key)} style={{
        padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
        fontFamily: 'Syne', fontWeight: 700, fontSize: 12, transition: 'all 0.18s',
        background: value === o.key ? 'white' : 'transparent',
        color: value === o.key ? '#0A0A0A' : '#888',
        boxShadow: value === o.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
      }}>{o.label}</button>
    ))}
  </div>
);

const KPICard = ({ icon, label, value, accent = '#FFD966', sub }) => (
  <div style={{ ...S.card, padding: '22px 20px', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent }} />
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: '#0A0A0A', letterSpacing: '-0.025em', marginBottom: 4 }}>{value ?? '—'}</p>
        <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: '#999' }}>{label}</p>
        {sub && <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: accent, marginTop: 4, fontWeight: 600 }}>{sub}</p>}
      </div>
      <div style={{ width: 40, height: 40, background: '#0A0A0A', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{icon}</div>
    </div>
  </div>
);

// ── ACCOUNTS TAB ──────────────────────────────────────────────────────────────
const ACC_TYPES = ['asset','liability','equity','revenue','expense'];
const ACC_TYPE_META = {
  asset:     { color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  liability: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  equity:    { color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  revenue:   { color: '#0EA5E9', bg: '#F0F9FF', border: '#BAE6FD' },
  expense:   { color: '#FF6B35', bg: '#FFF7ED', border: '#FED7AA' },
};

const AccountsTab = () => {
  const dispatch = useDispatch();
  const { accounts } = useSelector(s => s.accounting);
  const [modal, setModal]     = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { dispatch(fetchAccounts()); }, [dispatch]);

  const onSubmit = async (data) => {
    const res = await dispatch(createAccount(data));
    if (res.meta.requestStatus === 'fulfilled') { toast.success('Account created!'); setModal(false); reset(); }
    else toast.error(res.payload || 'Error');
  };

  const handleSeed = async () => {
    if (!window.confirm('Seed default chart of accounts? This will add standard accounts.')) return;
    const res = await dispatch(seedAccounts());
    if (res.meta.requestStatus === 'fulfilled') toast.success('Accounts seeded!');
    else toast.error(res.payload || 'Error');
  };

  const filtered = typeFilter ? accounts.filter(a => a.type === typeFilter) : accounts;
  const total = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  return (
    <div>
      {/* Quick stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
        {ACC_TYPES.map(t => {
          const meta = ACC_TYPE_META[t];
          const count = accounts.filter(a => a.type === t).length;
          const bal   = accounts.filter(a => a.type === t).reduce((s, a) => s + (a.balance || 0), 0);
          return (
            <button key={t} onClick={() => setTypeFilter(typeFilter === t ? '' : t)}
              style={{ ...S.card, padding: '14px 16px', cursor: 'pointer', border: typeFilter === t ? `2px solid ${meta.color}` : '2px solid #F0F0EB', transition: 'all 0.18s', position: 'relative', overflow: 'hidden', background: typeFilter === t ? meta.bg : 'white' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: meta.color }} />
              <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 10, color: meta.color, letterSpacing: '0.08em', marginBottom: 6 }}>{t.toUpperCase()}</p>
              <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 16, color: '#0A0A0A' }}>{count}</p>
              <p style={{ fontFamily: 'DM Sans', fontSize: 10, color: '#AAA' }}>₹{Math.abs(bal/1000).toFixed(0)}K</p>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#AAA' }}>
          {typeFilter ? `Showing ${filtered.length} ${typeFilter} accounts` : `${accounts.length} total accounts`}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <SecondaryBtn onClick={handleSeed} style={{ fontSize: 12, padding: '8px 14px' }}>🌱 Seed Defaults</SecondaryBtn>
          <PrimaryBtn onClick={() => { reset(); setModal(true); }}>+ New Account</PrimaryBtn>
        </div>
      </div>

      <div style={S.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Code','Account Name','Type','Category','Balance','Status'].map(h => <th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? <EmptyState cols={6} icon="📒" message="No accounts found. Seed defaults or create manually." />
              : filtered.map((a, i) => {
                const meta = ACC_TYPE_META[a.type] || ACC_TYPE_META.asset;
                return (
                  <tr key={a._id} style={{ background: i % 2 === 0 ? 'white' : '#FAFAF8' }}>
                    <td style={S.td}><MonoPill>{a.code}</MonoPill></td>
                    <td style={{ ...S.td }}>
                      <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: '#0A0A0A' }}>{a.name}</p>
                      {a.description && <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: '#AAA' }}>{a.description}</p>}
                    </td>
                    <td style={S.td}>
                      <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', padding: '4px 10px', borderRadius: 100, background: meta.bg, color: meta.color, border: `1.5px solid ${meta.border}` }}>
                        {a.type?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ ...S.td, color: '#666', textTransform: 'capitalize' }}>{a.category?.replace('_',' ')}</td>
                    <td style={{ ...S.td, fontFamily: 'Syne', fontWeight: 700, color: (a.balance || 0) >= 0 ? '#16A34A' : '#DC2626' }}>
                      ₹{Math.abs(a.balance || 0).toLocaleString()}
                    </td>
                    <td style={S.td}>
                      <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 10, padding: '4px 10px', borderRadius: 100, background: a.isActive ? '#F0FDF4' : '#F4F4F0', color: a.isActive ? '#16A34A' : '#AAA', border: `1.5px solid ${a.isActive ? '#BBF7D0' : '#E8E8E3'}` }}>
                        {a.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="New Account">
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="ACCOUNT CODE *" error={errors.code?.message}>
              <NInput reg={register('code', { required: 'Code required' })} placeholder="e.g. 1001" />
            </Field>
            <Field label="ACCOUNT TYPE *" error={errors.type?.message}>
              <NSelect reg={register('type', { required: true })}>
                <option value="">Select type</option>
                {ACC_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </NSelect>
            </Field>
          </div>
          <Field label="ACCOUNT NAME *" error={errors.name?.message}>
            <NInput reg={register('name', { required: 'Name required' })} placeholder="e.g. Cash & Bank" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="CATEGORY">
              <NSelect reg={register('category')}>
                <option value="">Select category</option>
                <option value="current_asset">Current Asset</option>
                <option value="fixed_asset">Fixed Asset</option>
                <option value="current_liability">Current Liability</option>
                <option value="long_term_liability">Long-Term Liability</option>
                <option value="owner_equity">Owner Equity</option>
                <option value="sales_revenue">Sales Revenue</option>
                <option value="operating_expense">Operating Expense</option>
              </NSelect>
            </Field>
            <Field label="OPENING BALANCE (₹)">
              <NInput reg={register('openingBalance', { valueAsNumber: true })} type="number" placeholder="0" />
            </Field>
          </div>
          <Field label="DESCRIPTION">
            <NTextarea reg={register('description')} rows={2} placeholder="Optional description" />
          </Field>
          <FormFooter onCancel={() => setModal(false)} submitLabel="Create Account" />
        </form>
      </Modal>
    </div>
  );
};

// ── JOURNAL TAB ───────────────────────────────────────────────────────────────
const JournalTab = () => {
  const dispatch = useDispatch();
  const { transactions, accounts } = useSelector(s => s.accounting);
  const [modal, setModal] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    dispatch(fetchTransactions());
    dispatch(fetchAccounts());
  }, [dispatch]);

  const onSubmit = async (data) => {
    const res = await dispatch(createTransaction(data));
    if (res.meta.requestStatus === 'fulfilled') { toast.success('Journal entry created!'); setModal(false); reset(); }
    else toast.error(res.payload || 'Error');
  };

  const TXN_TYPE_META = {
    debit:  { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
    credit: { color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <PrimaryBtn onClick={() => { reset(); setModal(true); }}>+ Journal Entry</PrimaryBtn>
      </div>

      <div style={S.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Date','Description','Account','Type','Amount','Reference','Created By'].map(h => <th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {transactions.length === 0 ? <EmptyState cols={7} icon="📓" message="No journal entries yet." />
              : transactions.map((t, i) => {
                const meta = TXN_TYPE_META[t.type] || TXN_TYPE_META.debit;
                return (
                  <tr key={t._id} style={{ background: i % 2 === 0 ? 'white' : '#FAFAF8' }}>
                    <td style={{ ...S.td, color: '#666' }}>{new Date(t.date || t.createdAt).toLocaleDateString()}</td>
                    <td style={{ ...S.td }}>
                      <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: '#0A0A0A' }}>{t.description}</p>
                      {t.narration && <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: '#AAA' }}>{t.narration}</p>}
                    </td>
                    <td style={{ ...S.td, color: '#555' }}>{t.account?.name || '—'}</td>
                    <td style={S.td}>
                      <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', padding: '4px 10px', borderRadius: 100, background: meta.bg, color: meta.color, border: `1.5px solid ${meta.border}` }}>
                        {t.type?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ ...S.td, fontFamily: 'Syne', fontWeight: 700, color: t.type === 'credit' ? '#16A34A' : '#DC2626' }}>
                      {t.type === 'debit' ? '-' : '+'}₹{(t.amount || 0).toLocaleString()}
                    </td>
                    <td style={S.td}>{t.reference ? <MonoPill>{t.reference}</MonoPill> : <span style={{ color: '#DDD' }}>—</span>}</td>
                    <td style={{ ...S.td, color: '#888' }}>{t.createdBy?.name || '—'}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="New Journal Entry">
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="ACCOUNT *" error={errors.account?.message}>
              <NSelect reg={register('account', { required: true })}>
                <option value="">Select account</option>
                {accounts.map(a => <option key={a._id} value={a._id}>{a.code} — {a.name}</option>)}
              </NSelect>
            </Field>
            <Field label="TYPE *" error={errors.type?.message}>
              <NSelect reg={register('type', { required: true })}>
                <option value="">Debit / Credit</option>
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
              </NSelect>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="AMOUNT (₹) *" error={errors.amount?.message}>
              <NInput reg={register('amount', { required: true, valueAsNumber: true })} type="number" min="0" placeholder="0" />
            </Field>
            <Field label="DATE *">
              <NInput reg={register('date', { required: true })} type="date" />
            </Field>
          </div>
          <Field label="DESCRIPTION *" error={errors.description?.message}>
            <NInput reg={register('description', { required: 'Description required' })} placeholder="What is this transaction for?" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="REFERENCE"><NInput reg={register('reference')} placeholder="Invoice #, PO #, etc." /></Field>
            <Field label="NARRATION"><NInput reg={register('narration')} placeholder="Additional notes" /></Field>
          </div>
          <FormFooter onCancel={() => setModal(false)} submitLabel="Record Entry" />
        </form>
      </Modal>
    </div>
  );
};

// ── INVOICES TAB ──────────────────────────────────────────────────────────────
const INV_STATUS_META = {
  draft:   { color: '#AAA',    bg: '#F4F4F0', border: '#E8E8E3' },
  sent:    { color: '#0EA5E9', bg: '#F0F9FF', border: '#BAE6FD' },
  paid:    { color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  overdue: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  partial: { color: '#FF6B35', bg: '#FFF7ED', border: '#FED7AA' },
};

const InvoicesTab = () => {
  const dispatch = useDispatch();
  const { invoices } = useSelector(s => s.accounting);
  const [modal, setModal]         = useState(false);
  const [payModal, setPayModal]   = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: { items: [{ name: '', quantity: 1, unitPrice: 0, taxRate: 0 }] }
  });
  const { register: payReg, handleSubmit: paySubmit, reset: payReset } = useForm();

  useEffect(() => { dispatch(fetchInvoices()); }, [dispatch]);

  const onSubmit = async (data) => {
    const items = (data.items || []).map(item => ({
      ...item,
      quantity:  Number(item.quantity)  || 1,
      unitPrice: Number(item.unitPrice) || 0,
      taxRate:   Number(item.taxRate)   || 0,
      total: (Number(item.quantity)||1) * (Number(item.unitPrice)||0),
    }));
    const res = await dispatch(createInvoice({ ...data, items }));
    if (res.meta.requestStatus === 'fulfilled') { toast.success('Invoice created!'); setModal(false); reset(); }
    else toast.error(res.payload || 'Error');
  };

  const onPayment = async (data) => {
    const res = await dispatch(recordPayment({ id: payModal._id, payload: { amount: Number(data.amount), method: data.method, notes: data.notes } }));
    if (res.meta.requestStatus === 'fulfilled') { toast.success('Payment recorded!'); setPayModal(null); payReset(); }
    else toast.error(res.payload || 'Error');
  };

  const handleStatusChange = async (id, status) => {
    const res = await dispatch(updateInvoiceStatus({ id, status }));
    if (res.meta.requestStatus === 'fulfilled') toast.success(`Invoice marked as ${status}!`);
    else toast.error(res.payload || 'Error');
  };

  const handleDownloadPDF = async (id) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5000/api/accounting/invoices/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await response.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a'); a.href = url; a.download = `invoice-${id}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded!');
    } catch { toast.error('Download failed'); }
  };

  const handleEmailInvoice = async (id) => {
    try {
      const res = await api.post(`/accounting/invoices/${id}/email`);
      if (res.data.success) toast.success(res.data.message);
      else toast.error('Email failed');
    } catch { toast.error('Email failed'); }
  };

  const filtered = statusFilter ? invoices.filter(i => i.status === statusFilter) : invoices;
  const totalRevenue  = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.totalAmount || 0), 0);
  const totalPending  = invoices.filter(i => ['sent','partial'].includes(i.status)).reduce((s, i) => s + (i.balanceDue || 0), 0);
  const totalOverdue  = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + (i.balanceDue || 0), 0);

  const STATUS_FILTERS = [
    { key: '', label: 'All' },
    { key: 'draft',   label: 'Draft' },
    { key: 'sent',    label: 'Sent' },
    { key: 'paid',    label: 'Paid' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'partial', label: 'Partial' },
  ];

  return (
    <div>
      {/* Mini KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Revenue Collected', value: `₹${(totalRevenue/1000).toFixed(1)}K`, accent: '#16A34A', icon: '💰' },
          { label: 'Pending Collection', value: `₹${(totalPending/1000).toFixed(1)}K`, accent: '#FF6B35', icon: '⏳' },
          { label: 'Overdue Amount',    value: `₹${(totalOverdue/1000).toFixed(1)}K`, accent: '#DC2626', icon: '⚠️' },
        ].map(c => (
          <div key={c.label} style={{ ...S.card, padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: c.accent }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, background: '#0A0A0A', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{c.icon}</div>
              <div>
                <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: '#0A0A0A' }}>{c.value}</p>
                <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: '#AAA' }}>{c.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <TabFilterBar options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
        <div style={{ display: 'flex', gap: 8 }}>
          <GreenBtn onClick={() => exportInvoices(invoices)}>⬇ Excel</GreenBtn>
          <PrimaryBtn onClick={() => { reset(); setModal(true); }}>+ New Invoice</PrimaryBtn>
        </div>
      </div>

      <div style={S.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Invoice #','Customer','Date','Due Date','Amount','Paid','Balance','Status','Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? <EmptyState cols={9} icon="🧾" message="No invoices found." />
              : filtered.map((inv, i) => {
                const meta = INV_STATUS_META[inv.status] || INV_STATUS_META.draft;
                return (
                  <tr key={inv._id} style={{ background: i % 2 === 0 ? 'white' : '#FAFAF8' }}>
                    <td style={S.td}><MonoPill>{inv.invoiceNumber}</MonoPill></td>
                    <td style={{ ...S.td }}>
                      <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: '#0A0A0A' }}>{inv.customer?.name || '—'}</p>
                      <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: '#AAA' }}>{inv.customer?.email}</p>
                    </td>
                    <td style={{ ...S.td, color: '#666' }}>{new Date(inv.createdAt).toLocaleDateString()}</td>
                    <td style={{ ...S.td, color: inv.status === 'overdue' ? '#DC2626' : '#666' }}>
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ ...S.td, fontFamily: 'Syne', fontWeight: 700, color: '#0A0A0A' }}>₹{(inv.totalAmount||0).toLocaleString()}</td>
                    <td style={{ ...S.td, color: '#16A34A', fontWeight: 600 }}>₹{(inv.amountPaid||0).toLocaleString()}</td>
                    <td style={{ ...S.td, fontFamily: 'Syne', fontWeight: 700, color: (inv.balanceDue||0) > 0 ? '#DC2626' : '#16A34A' }}>
                      ₹{(inv.balanceDue||0).toLocaleString()}
                    </td>
                    <td style={S.td}>
                      <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', padding: '4px 10px', borderRadius: 100, background: meta.bg, color: meta.color, border: `1.5px solid ${meta.border}` }}>
                        {inv.status?.toUpperCase()}
                      </span>
                    </td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {['draft','sent'].includes(inv.status) && (
                          <button onClick={() => setPayModal(inv)} style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 10, background: '#F0FDF4', color: '#16A34A', border: '1.5px solid #BBF7D0', padding: '4px 10px', borderRadius: 7, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#16A34A'; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#F0FDF4'; e.currentTarget.style.color = '#16A34A'; }}>💳 Pay</button>
                        )}
                        {inv.status === 'draft' && (
                          <button onClick={() => handleStatusChange(inv._id,'sent')} style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 10, background: '#F0F9FF', color: '#0EA5E9', border: '1.5px solid #BAE6FD', padding: '4px 10px', borderRadius: 7, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#0EA5E9'; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#F0F9FF'; e.currentTarget.style.color = '#0EA5E9'; }}>📤 Send</button>
                        )}
                        <button onClick={() => handleDownloadPDF(inv._id)} style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 10, background: '#F4F4F0', color: '#555', border: '1.5px solid #E8E8E3', padding: '4px 10px', borderRadius: 7, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#0A0A0A'; e.currentTarget.style.color = 'white'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#F4F4F0'; e.currentTarget.style.color = '#555'; }}>⬇ PDF</button>
                        <button onClick={() => handleEmailInvoice(inv._id)} style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 10, background: '#F5F3FF', color: '#7C3AED', border: '1.5px solid #DDD6FE', padding: '4px 10px', borderRadius: 7, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#7C3AED'; e.currentTarget.style.color = 'white'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#F5F3FF'; e.currentTarget.style.color = '#7C3AED'; }}>✉ Email</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Create Invoice Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Create Invoice" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <SectionDivider icon="👤" title="Customer & Invoice Details" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 8 }}>
            <Field label="CUSTOMER NAME *" error={errors.customerName?.message}>
              <NInput reg={register('customerName', { required: 'Required' })} placeholder="Customer name" />
            </Field>
            <Field label="CUSTOMER EMAIL">
              <NInput reg={register('customerEmail')} type="email" placeholder="email@example.com" />
            </Field>
            <Field label="DUE DATE">
              <NInput reg={register('dueDate')} type="date" />
            </Field>
            <Field label="NOTES">
              <NInput reg={register('notes')} placeholder="Optional notes" />
            </Field>
          </div>

          <SectionDivider icon="📋" title="Line Items" />
          <div style={{ border: '2px solid #F0F0EB', borderRadius: 12, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 0, background: '#FAFAF8', padding: '8px 12px', borderBottom: '1px solid #F0F0EB' }}>
              {['Item / Description','Quantity','Unit Price (₹)','Tax %'].map(h => (
                <span key={h} style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 10, color: '#AAA', letterSpacing: '0.06em' }}>{h}</span>
              ))}
            </div>
            <div style={{ padding: '12px' }}>
              <InvoiceItemRow register={register} index={0} />
              <InvoiceItemRow register={register} index={1} />
              <InvoiceItemRow register={register} index={2} />
            </div>
          </div>

          <FormFooter onCancel={() => setModal(false)} submitLabel="Create Invoice" />
        </form>
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={!!payModal} onClose={() => { setPayModal(null); payReset(); }} title="Record Payment">
        {payModal && (
          <form onSubmit={paySubmit(onPayment)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#F4F4F0', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: '#0A0A0A' }}>{payModal.invoiceNumber}</p>
                <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#AAA' }}>{payModal.customer?.name}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: '#AAA' }}>Balance Due</p>
                <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: '#DC2626' }}>₹{(payModal.balanceDue||0).toLocaleString()}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="AMOUNT (₹) *">
                <NInput reg={payReg('amount', { required: true, valueAsNumber: true })} type="number" min="0" placeholder="0" />
              </Field>
              <Field label="PAYMENT METHOD">
                <NSelect reg={payReg('method')}>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                  <option value="card">Card</option>
                </NSelect>
              </Field>
            </div>
            <Field label="NOTES"><NInput reg={payReg('notes')} placeholder="Payment reference or notes" /></Field>
            <FormFooter onCancel={() => { setPayModal(null); payReset(); }} submitLabel="Record Payment" />
          </form>
        )}
      </Modal>
    </div>
  );
};

// Simple item row for invoice form
const InvoiceItemRow = ({ register, index }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
    <input {...register(`items.${index}.name`)} placeholder={`Item ${index + 1}`} style={{ ...S.input, fontSize: 13 }} onFocus={focusIn} onBlur={focusOut} />
    <input {...register(`items.${index}.quantity`, { valueAsNumber: true })} type="number" min="1" defaultValue={1} style={{ ...S.input, fontSize: 13 }} onFocus={focusIn} onBlur={focusOut} />
    <input {...register(`items.${index}.unitPrice`, { valueAsNumber: true })} type="number" min="0" placeholder="0" style={{ ...S.input, fontSize: 13 }} onFocus={focusIn} onBlur={focusOut} />
    <input {...register(`items.${index}.taxRate`, { valueAsNumber: true })} type="number" min="0" max="100" placeholder="0" style={{ ...S.input, fontSize: 13 }} onFocus={focusIn} onBlur={focusOut} />
  </div>
);

// ── EXPENSES TAB ──────────────────────────────────────────────────────────────
const EXP_CAT_META = {
  salary:       { color: '#0EA5E9', bg: '#F0F9FF', border: '#BAE6FD' },
  rent:         { color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  utilities:    { color: '#FF6B35', bg: '#FFF7ED', border: '#FED7AA' },
  marketing:    { color: '#EC4899', bg: '#FDF2F8', border: '#FBCFE8' },
  supplies:     { color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  maintenance:  { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  other:        { color: '#AAA',    bg: '#F4F4F0', border: '#E8E8E3' },
};

const ExpensesTab = () => {
  const dispatch = useDispatch();
  const { expenses } = useSelector(s => s.accounting);
  const [modal, setModal] = useState(false);
  const [catFilter, setCatFilter] = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { dispatch(fetchExpenses()); }, [dispatch]);

  const onSubmit = async (data) => {
    const res = await dispatch(createExpense({ ...data, amount: Number(data.amount) }));
    if (res.meta.requestStatus === 'fulfilled') { toast.success('Expense recorded!'); setModal(false); reset(); }
    else toast.error(res.payload || 'Error');
  };

  const handleApprove = async (id) => {
    const res = await dispatch(updateExpenseStatus({ id, status: 'approved' }));
    if (res.meta.requestStatus === 'fulfilled') toast.success('Expense approved!');
    else toast.error(res.payload || 'Error');
  };

  const filtered = catFilter ? expenses.filter(e => e.category === catFilter) : expenses;
  const totalExp  = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const pending   = expenses.filter(e => e.status === 'pending').length;

  const EXP_CATS = Object.keys(EXP_CAT_META);

  return (
    <div>
      {/* Category filter pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button onClick={() => setCatFilter('')} style={{ padding: '6px 14px', borderRadius: 100, fontFamily: 'Syne', fontWeight: 700, fontSize: 11, letterSpacing: '0.05em', border: `1.5px solid ${!catFilter ? '#0A0A0A' : '#E8E8E3'}`, background: !catFilter ? '#0A0A0A' : 'white', color: !catFilter ? 'white' : '#888', cursor: 'pointer', transition: 'all 0.15s' }}>ALL</button>
        {EXP_CATS.map(cat => {
          const meta = EXP_CAT_META[cat];
          const active = catFilter === cat;
          return (
            <button key={cat} onClick={() => setCatFilter(active ? '' : cat)} style={{
              padding: '6px 14px', borderRadius: 100, fontFamily: 'Syne', fontWeight: 700, fontSize: 11, letterSpacing: '0.05em',
              border: `1.5px solid ${active ? meta.color : meta.border}`,
              background: active ? meta.color : meta.bg, color: active ? 'white' : meta.color,
              cursor: 'pointer', transition: 'all 0.15s', textTransform: 'uppercase',
            }}>{cat}</button>
          );
        })}
      </div>

      {/* Summary strip */}
      <div style={{ ...S.card, padding: '14px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0A0A0A', border: 'none' }}>
        <div>
          <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: '#666', marginBottom: 2 }}>Total Expenses</p>
          <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: '#FFD966', letterSpacing: '-0.025em' }}>₹{totalExp.toLocaleString()}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: '#FF6B35' }}>{pending}</p>
            <p style={{ fontFamily: 'DM Sans', fontSize: 10, color: '#666' }}>Pending</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: '#16A34A' }}>{expenses.filter(e => e.status === 'approved').length}</p>
            <p style={{ fontFamily: 'DM Sans', fontSize: 10, color: '#666' }}>Approved</p>
          </div>
          <GreenBtn onClick={() => exportExpenses(expenses)}>⬇ Excel</GreenBtn>
          <PrimaryBtn onClick={() => { reset(); setModal(true); }} style={{ background: 'white', color: '#0A0A0A' }}>+ Add Expense</PrimaryBtn>
        </div>
      </div>

      <div style={S.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Date','Description','Category','Amount','Payment','Vendor','Status','Action'].map(h => <th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? <EmptyState cols={8} icon="💸" message="No expenses recorded yet." />
              : filtered.map((exp, i) => {
                const catMeta = EXP_CAT_META[exp.category] || EXP_CAT_META.other;
                return (
                  <tr key={exp._id} style={{ background: i % 2 === 0 ? 'white' : '#FAFAF8' }}>
                    <td style={{ ...S.td, color: '#666' }}>{new Date(exp.date || exp.createdAt).toLocaleDateString()}</td>
                    <td style={{ ...S.td }}>
                      <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: '#0A0A0A' }}>{exp.description}</p>
                      {exp.reference && <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: '#AAA' }}>{exp.reference}</p>}
                    </td>
                    <td style={S.td}>
                      <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', padding: '4px 10px', borderRadius: 100, background: catMeta.bg, color: catMeta.color, border: `1.5px solid ${catMeta.border}`, textTransform: 'uppercase' }}>
                        {exp.category}
                      </span>
                    </td>
                    <td style={{ ...S.td, fontFamily: 'Syne', fontWeight: 700, color: '#DC2626' }}>₹{(exp.amount||0).toLocaleString()}</td>
                    <td style={{ ...S.td, color: '#666', textTransform: 'capitalize' }}>{exp.paymentMethod?.replace('_',' ')}</td>
                    <td style={{ ...S.td, color: '#555' }}>{exp.vendor || '—'}</td>
                    <td style={S.td}><Badge status={exp.status} /></td>
                    <td style={S.td}>
                      {exp.status === 'pending' && (
                        <button onClick={() => handleApprove(exp._id)} style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 10, background: '#F0FDF4', color: '#16A34A', border: '1.5px solid #BBF7D0', padding: '5px 12px', borderRadius: 7, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#16A34A'; e.currentTarget.style.color = 'white'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#F0FDF4'; e.currentTarget.style.color = '#16A34A'; }}>✓ Approve</button>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Record Expense">
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="DESCRIPTION *" error={errors.description?.message}>
              <NInput reg={register('description', { required: 'Required' })} placeholder="What was this expense for?" />
            </Field>
            <Field label="CATEGORY *" error={errors.category?.message}>
              <NSelect reg={register('category', { required: true })}>
                <option value="">Select category</option>
                {EXP_CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </NSelect>
            </Field>
            <Field label="AMOUNT (₹) *" error={errors.amount?.message}>
              <NInput reg={register('amount', { required: true, valueAsNumber: true })} type="number" min="0" placeholder="0" />
            </Field>
            <Field label="DATE *">
              <NInput reg={register('date', { required: true })} type="date" />
            </Field>
            <Field label="PAYMENT METHOD">
              <NSelect reg={register('paymentMethod')}>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="credit_card">Credit Card</option>
                <option value="cheque">Cheque</option>
              </NSelect>
            </Field>
            <Field label="VENDOR">
              <NInput reg={register('vendor')} placeholder="Vendor or supplier name" />
            </Field>
          </div>
          <Field label="REFERENCE">
            <NInput reg={register('reference')} placeholder="Receipt #, Bill #, etc." />
          </Field>
          <FormFooter onCancel={() => setModal(false)} submitLabel="Record Expense" />
        </form>
      </Modal>
    </div>
  );
};

// ── REPORTS TAB ───────────────────────────────────────────────────────────────
const ReportsTab = () => {
  const dispatch = useDispatch();
  const { profitLoss, balanceSheet } = useSelector(s => s.accounting);
  const [activeReport, setActiveReport] = useState('pl');
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    if (activeReport === 'pl') await dispatch(fetchProfitLoss({ year }));
    else await dispatch(fetchBalanceSheet());
    setLoading(false);
  };

  useEffect(() => { loadReport(); }, [activeReport, year]);

  const handleDownloadPDF = async (type) => {
    try {
      const token = localStorage.getItem('accessToken');
      const url = type === 'pl'
        ? `http://localhost:5000/api/accounting/reports/profit-loss/pdf?year=${year}`
        : `http://localhost:5000/api/accounting/reports/balance-sheet/pdf`;
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await response.blob();
      const objUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl; a.download = `${type}-report-${year}.pdf`; a.click();
      window.URL.revokeObjectURL(objUrl);
      toast.success('Report downloaded!');
    } catch { toast.error('Download failed'); }
  };

  const pl = profitLoss || {};
  const bs = balanceSheet || {};
  const netProfitPct = pl.totalRevenue > 0 ? ((pl.netProfit / pl.totalRevenue) * 100).toFixed(1) : 0;
  const isProfit = (pl.netProfit || 0) >= 0;

  return (
    <div>
      {/* Report Selector + Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 0, border: '2px solid #F0F0EB', borderRadius: 12, overflow: 'hidden' }}>
          {[{ key: 'pl', label: '📊 Profit & Loss' }, { key: 'bs', label: '⚖️ Balance Sheet' }].map(r => (
            <button key={r.key} onClick={() => setActiveReport(r.key)} style={{
              padding: '10px 22px', border: 'none', cursor: 'pointer',
              fontFamily: 'Syne', fontWeight: 700, fontSize: 13, transition: 'all 0.18s',
              background: activeReport === r.key ? '#0A0A0A' : 'white',
              color: activeReport === r.key ? 'white' : '#888',
            }}>{r.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {activeReport === 'pl' && (
            <NSelect value={year} onChange={e => setYear(Number(e.target.value))} style={{ width: 110 }}>
              {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
            </NSelect>
          )}
          <PrimaryBtn onClick={() => handleDownloadPDF(activeReport)}>⬇ PDF Report</PrimaryBtn>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 32, opacity: 0.15, marginBottom: 12 }}>📊</div>
          <p style={{ fontFamily: 'DM Sans', color: '#CCC' }}>Loading report...</p>
        </div>
      ) : activeReport === 'pl' ? (
        /* ── P&L Report ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Summary Hero */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {[
              { label: 'Total Revenue', value: `₹${(pl.totalRevenue||0).toLocaleString()}`, accent: '#16A34A', icon: '📈', sub: `${pl.revenueAccounts?.length || 0} revenue accounts` },
              { label: 'Total Expenses', value: `₹${(pl.totalExpense||0).toLocaleString()}`, accent: '#DC2626', icon: '📉', sub: `${pl.expenseAccounts?.length || 0} expense accounts` },
              { label: isProfit ? 'Net Profit' : 'Net Loss', value: `₹${Math.abs(pl.netProfit||0).toLocaleString()}`, accent: isProfit ? '#0EA5E9' : '#FF6B35', icon: isProfit ? '💹' : '⚠️', sub: `${netProfitPct}% margin` },
            ].map(c => <KPICard key={c.label} {...c} />)}
          </div>

          {/* Revenue breakdown */}
          <div style={S.card}>
            <div style={{ background: '#0A0A0A', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, background: '#16A34A', borderRadius: '50%' }} />
                <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 12, color: 'white', letterSpacing: '0.08em' }}>REVENUE</span>
              </div>
              <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 14, color: '#16A34A' }}>₹{(pl.totalRevenue||0).toLocaleString()}</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {(pl.revenueAccounts || []).map((a, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#FAFAF8' }}>
                    <td style={{ ...S.td, fontFamily: 'DM Sans', fontSize: 13, color: '#444' }}>{a.name}</td>
                    <td style={{ ...S.td, textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
                        <div style={{ height: 4, borderRadius: 2, background: '#16A34A', opacity: 0.2, width: `${Math.min(100, ((a.balance||0)/(pl.totalRevenue||1))*100)}%`, maxWidth: 120 }} />
                        <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: '#16A34A' }}>₹{(a.balance||0).toLocaleString()}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expense breakdown */}
          <div style={S.card}>
            <div style={{ background: '#0A0A0A', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, background: '#DC2626', borderRadius: '50%' }} />
                <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 12, color: 'white', letterSpacing: '0.08em' }}>EXPENSES</span>
              </div>
              <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 14, color: '#DC2626' }}>₹{(pl.totalExpense||0).toLocaleString()}</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {(pl.expenseAccounts || []).map((a, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#FAFAF8' }}>
                    <td style={{ ...S.td, fontFamily: 'DM Sans', fontSize: 13, color: '#444' }}>{a.name}</td>
                    <td style={{ ...S.td, textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
                        <div style={{ height: 4, borderRadius: 2, background: '#DC2626', opacity: 0.2, width: `${Math.min(100, ((a.balance||0)/(pl.totalExpense||1))*100)}%`, maxWidth: 120 }} />
                        <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: '#DC2626' }}>₹{(a.balance||0).toLocaleString()}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Net result bar */}
            <div style={{ background: isProfit ? '#F0FDF4' : '#FEF2F2', padding: '16px 20px', borderTop: `2px solid ${isProfit ? '#BBF7D0' : '#FECACA'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 12, color: '#0A0A0A', letterSpacing: '0.06em' }}>{isProfit ? 'NET PROFIT' : 'NET LOSS'}</span>
              <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, color: isProfit ? '#16A34A' : '#DC2626' }}>₹{Math.abs(pl.netProfit||0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      ) : (
        /* ── Balance Sheet ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {[
              { label: 'Total Assets',      value: `₹${(bs.totalAssets||0).toLocaleString()}`,      accent: '#16A34A', icon: '🏦' },
              { label: 'Total Liabilities', value: `₹${(bs.totalLiabilities||0).toLocaleString()}`, accent: '#DC2626', icon: '📋' },
              { label: 'Total Equity',      value: `₹${(bs.totalEquity||0).toLocaleString()}`,      accent: '#7C3AED', icon: '💎' },
            ].map(c => <KPICard key={c.label} {...c} />)}
          </div>

          {[
            { title: 'ASSETS',      data: bs.assets,      total: bs.totalAssets,      accent: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
            { title: 'LIABILITIES', data: bs.liabilities, total: bs.totalLiabilities, accent: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
            { title: 'EQUITY',      data: bs.equity,      total: bs.totalEquity,      accent: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
          ].map(section => (
            <div key={section.title} style={S.card}>
              <div style={{ background: '#0A0A0A', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, background: section.accent, borderRadius: '50%' }} />
                  <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 12, color: 'white', letterSpacing: '0.08em' }}>{section.title}</span>
                </div>
                <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 14, color: section.accent }}>₹{(section.total||0).toLocaleString()}</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {(section.data || []).map((a, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#FAFAF8' }}>
                      <td style={S.td}><MonoPill color={section.accent} bg={section.bg} border={section.border}>{a.code}</MonoPill></td>
                      <td style={{ ...S.td, color: '#444' }}>{a.name}</td>
                      <td style={{ ...S.td, textAlign: 'right', fontFamily: 'Syne', fontWeight: 700, color: section.accent }}>₹{(a.balance||0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ background: section.bg, padding: '14px 20px', borderTop: `2px solid ${section.border}`, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 11, color: section.accent, letterSpacing: '0.06em' }}>TOTAL {section.title}</span>
                <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 16, color: section.accent }}>₹{(section.total||0).toLocaleString()}</span>
              </div>
            </div>
          ))}

          {/* Balance check */}
          {bs.totalAssets != null && (
            <div style={{ ...S.card, padding: '14px 20px', background: Math.abs((bs.totalAssets||0) - ((bs.totalLiabilities||0) + (bs.totalEquity||0))) < 1 ? '#F0FDF4' : '#FEF2F2', border: `2px solid ${Math.abs((bs.totalAssets||0) - ((bs.totalLiabilities||0) + (bs.totalEquity||0))) < 1 ? '#BBF7D0' : '#FECACA'}` }}>
              <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: Math.abs((bs.totalAssets||0) - ((bs.totalLiabilities||0) + (bs.totalEquity||0))) < 1 ? '#16A34A' : '#DC2626' }}>
                {Math.abs((bs.totalAssets||0) - ((bs.totalLiabilities||0) + (bs.totalEquity||0))) < 1
                  ? '✓ Balance sheet is balanced — Assets = Liabilities + Equity'
                  : '⚠ Balance sheet is NOT balanced — please review your entries'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── MAIN ACCOUNTING PAGE ──────────────────────────────────────────────────────
const TABS = [
  { key: 'Accounts',     icon: '📒' },
  { key: 'Journal',      icon: '📓' },
  { key: 'Invoices',     icon: '🧾' },
  { key: 'Expenses',     icon: '💸' },
  { key: 'Reports',      icon: '📊' },
];

const Accounting = () => {
  const dispatch = useDispatch();
  const { stats } = useSelector(s => s.accounting);
  const [tab, setTab] = useState('Accounts');

  useEffect(() => { dispatch(fetchAccountingStats()); }, [dispatch]);

  return (
    <div style={{ fontFamily: "'Syne', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .acc-fadein { animation: fadeUp 0.4s ease both; }
      `}</style>

      {/* Page Header */}
      <div className="acc-fadein" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 26, letterSpacing: '-0.025em', color: '#0A0A0A', marginBottom: 4 }}>
            💼 Accounting & Finance
          </h1>
          <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: '#AAA' }}>Accounts, invoices, expenses and financial reports</p>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFF8E7', border: '1.5px solid #FFD966', borderRadius: 100, padding: '6px 14px' }}>
          <div style={{ width: 7, height: 7, background: '#16A34A', borderRadius: '50%' }} />
          <span style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 600, color: '#92600A' }}>Finance Module</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="acc-fadein" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 16, marginBottom: 28, animationDelay: '0.05s' }}>
        <KPICard icon="💰" label="Total Revenue"  value={stats?.totalRevenue  ? `₹${(stats.totalRevenue/1000).toFixed(1)}K`   : '—'} accent="#16A34A" />
        <KPICard icon="💸" label="Total Expenses" value={stats?.totalExpenses ? `₹${(stats.totalExpenses/1000).toFixed(1)}K`  : '—'} accent="#DC2626" />
        <KPICard icon="📈" label="Net Profit"     value={stats?.netProfit     ? `₹${(stats.netProfit/1000).toFixed(1)}K`      : '—'} accent="#0EA5E9" />
        <KPICard icon="🧾" label="Unpaid Invoices" value={stats?.unpaidInvoices ?? '—'} accent="#FF6B35" />
        <KPICard icon="⏳" label="Pending Expenses" value={stats?.pendingExpenses ?? '—'} accent="#FFD966" />
      </div>

      {/* Tabs */}
      <div className="acc-fadein" style={{ display: 'flex', gap: 4, background: '#F4F4F0', padding: 6, borderRadius: 14, marginBottom: 24, animationDelay: '0.1s', overflowX: 'auto' }}>
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
      <div className="acc-fadein" style={{ animationDelay: '0.15s' }}>
        {tab === 'Accounts' && <AccountsTab />}
        {tab === 'Journal'  && <JournalTab />}
        {tab === 'Invoices' && <InvoicesTab />}
        {tab === 'Expenses' && <ExpensesTab />}
        {tab === 'Reports'  && <ReportsTab />}
      </div>
    </div>
  );
};

export default Accounting;