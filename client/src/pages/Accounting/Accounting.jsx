import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  fetchAccountingStats, fetchAccounts, createAccount, seedAccounts,
  fetchTransactions, createTransaction,
  fetchInvoices, createInvoice, recordPayment, updateInvoiceStatus,
  fetchExpenses, createExpense, updateExpenseStatus,
  fetchProfitLoss, fetchBalanceSheet,
} from '../../features/accounting/accountingSlice';
import { fetchCustomers } from '../../features/crm/crmSlice';
import { fetchDepartments } from '../../features/hr/hrSlice';
import Modal    from '../../components/UI/Modal';
import StatCard from '../../components/UI/StatCard';
import Badge    from '../../components/UI/Badge';
import { useForm } from 'react-hook-form';
import api from '../../services/api'; 
import { exportInvoices, exportExpenses } from '../../utils/exportExcel';
const EXPENSE_CATEGORIES = ['Marketing','Operations','HR','IT','Travel','Utilities','Rent','Legal','Miscellaneous'];
const YEARS = [2023, 2024, 2025, 2026];

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
const Sel = ({ reg, children, ...props }) => (
  <select {...reg} {...props}
    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
    {children}
  </select>
);

// ── Accounts Tab ──────────────────────────────────────────────────────────────
const AccountsTab = () => {
  const dispatch = useDispatch();
  const { accounts } = useSelector(s => s.accounting);
  const [modal, setModal]   = useState(false);
  const [filterType, setFilterType] = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { dispatch(fetchAccounts()); }, [dispatch]);

  const handleSeed = async () => {
    const res = await dispatch(seedAccounts());
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success('Default accounts seeded!');
      dispatch(fetchAccounts());
    } else toast.error(res.payload || 'Error');
  };

  const onSubmit = async (data) => {
    const res = await dispatch(createAccount(data));
    if (res.meta.requestStatus === 'fulfilled') { toast.success('Account created!'); setModal(false); reset(); }
    else toast.error(res.payload || 'Error');
  };

  const TYPE_COLORS = {
    asset:     'bg-blue-100 text-blue-700',
    liability: 'bg-red-100 text-red-700',
    equity:    'bg-purple-100 text-purple-700',
    revenue:   'bg-green-100 text-green-700',
    expense:   'bg-orange-100 text-orange-700',
  };

  const filtered = filterType ? accounts.filter(a => a.type === filterType) : accounts;

  const grouped = ['asset','liability','equity','revenue','expense'].reduce((acc, type) => {
    acc[type] = filtered.filter(a => a.type === type);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {['','asset','liability','equity','revenue','expense'].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all
                ${filterType===t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {t || 'All'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={handleSeed}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
            🌱 Seed Defaults
          </button>
          <button onClick={() => setModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            + New Account
          </button>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-3">📒</p>
          <p className="text-gray-500 mb-4">No accounts yet. Click "Seed Defaults" to add standard accounts.</p>
          <button onClick={handleSeed}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            🌱 Seed Default Accounts
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([type, accs]) => accs.length === 0 ? null : (
            <div key={type} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className={`px-4 py-2 ${TYPE_COLORS[type]} font-semibold text-sm capitalize`}>
                {type} Accounts ({accs.length})
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>{['Code','Account Name','Balance'].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {accs.map(a => (
                    <tr key={a._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-xs text-blue-600">{a.code}</td>
                      <td className="px-4 py-2 font-medium text-gray-800">{a.name}</td>
                      <td className={`px-4 py-2 font-semibold ${a.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{Math.abs(a.balance).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="New Account">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Account Code *" error={errors.code?.message}>
            <Input reg={register('code', { required: 'Code required' })} placeholder="e.g. 1005" />
          </Field>
          <Field label="Account Name *" error={errors.name?.message}>
            <Input reg={register('name', { required: 'Name required' })} placeholder="e.g. Petty Cash" />
          </Field>
          <Field label="Type *" error={errors.type?.message}>
            <Sel reg={register('type', { required: 'Type required' })}>
              <option value="">Select type</option>
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
              <option value="equity">Equity</option>
              <option value="revenue">Revenue</option>
              <option value="expense">Expense</option>
            </Sel>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Create</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ── Journal Entries Tab ───────────────────────────────────────────────────────
const JournalTab = () => {
  const dispatch = useDispatch();
  const { transactions, loading } = useSelector(s => s.accounting);
  const { accounts } = useSelector(s => s.accounting);
  const [modal, setModal] = useState(false);
  const [entries, setEntries] = useState([
    { account: '', debit: 0, credit: 0 },
    { account: '', debit: 0, credit: 0 },
  ]);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { date: new Date().toISOString().split('T')[0], type: 'manual' }
  });

  useEffect(() => {
    dispatch(fetchTransactions());
    dispatch(fetchAccounts());
  }, [dispatch]);

  const addEntry    = () => setEntries([...entries, { account: '', debit: 0, credit: 0 }]);
  const removeEntry = (i) => { if (entries.length > 2) setEntries(entries.filter((_,idx) => idx !== i)); };
  const updateEntry = (i, field, val) => {
    const updated = [...entries];
    updated[i] = { ...updated[i], [field]: val };
    setEntries(updated);
  };

  const totalDebits  = entries.reduce((s, e) => s + Number(e.debit  || 0), 0);
  const totalCredits = entries.reduce((s, e) => s + Number(e.credit || 0), 0);
  const isBalanced   = Math.abs(totalDebits - totalCredits) < 0.01;

  const onSubmit = async (data) => {
    if (!isBalanced) { toast.error(`Debits (₹${totalDebits}) must equal Credits (₹${totalCredits})`); return; }
    const processedEntries = entries.map(e => ({
      account: e.account,
      debit:   Number(e.debit  || 0),
      credit:  Number(e.credit || 0),
    }));
    const res = await dispatch(createTransaction({ ...data, entries: processedEntries }));
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success('Journal entry posted!');
      setModal(false); reset();
      setEntries([{ account: '', debit: 0, credit: 0 }, { account: '', debit: 0, credit: 0 }]);
      dispatch(fetchTransactions());
      dispatch(fetchAccounts());
    } else toast.error(res.payload || 'Error');
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + New Journal Entry
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Txn #','Date','Description','Type','Entries',''].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading...</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">No journal entries yet.</td></tr>
            ) : transactions.map(t => (
              <tr key={t._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-blue-600">{t.txnNumber}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(t.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{t.description}</td>
                <td className="px-4 py-3"><Badge status={t.type} /></td>
                <td className="px-4 py-3 text-gray-500">{t.entries?.length} lines</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold text-green-600">
                    ₹{t.entries?.reduce((s,e) => s + (e.debit||0), 0).toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="New Journal Entry" size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Date *">
              <Input reg={register('date', { required: true })} type="date" />
            </Field>
            <Field label="Type">
              <Sel reg={register('type')}>
                <option value="manual">Manual</option>
                <option value="sale">Sale</option>
                <option value="purchase">Purchase</option>
                <option value="expense">Expense</option>
                <option value="payroll">Payroll</option>
              </Sel>
            </Field>
            <Field label="Reference">
              <Input reg={register('reference')} placeholder="e.g. INV-001" />
            </Field>
          </div>
          <Field label="Description *">
            <Input reg={register('description', { required: true })} placeholder="Journal entry description" />
          </Field>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">Journal Lines</label>
              <button type="button" onClick={addEntry} className="text-xs text-blue-600 hover:underline">+ Add Line</button>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">Account</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">Debit (₹)</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">Credit (₹)</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-3 py-2 w-1/2">
                        <select value={entry.account} onChange={e => updateEntry(i,'account',e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-white">
                          <option value="">Select account</option>
                          {accounts.map(a => <option key={a._id} value={a._id}>{a.code} — {a.name}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={entry.debit} min="0"
                          onChange={e => updateEntry(i,'debit',e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm" placeholder="0" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={entry.credit} min="0"
                          onChange={e => updateEntry(i,'credit',e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm" placeholder="0" />
                      </td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => removeEntry(i)}
                          className="text-red-400 hover:text-red-600 text-lg">×</button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 border-t border-gray-200">
                    <td className="px-3 py-2 font-semibold text-gray-700 text-sm">Totals</td>
                    <td className="px-3 py-2 font-bold text-blue-600">₹{totalDebits.toLocaleString()}</td>
                    <td className="px-3 py-2 font-bold text-blue-600">₹{totalCredits.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
            {!isBalanced && (
              <p className="text-red-500 text-xs mt-1">
                ⚠️ Out of balance by ₹{Math.abs(totalDebits - totalCredits).toFixed(2)} — Debits must equal Credits
              </p>
            )}
            {isBalanced && totalDebits > 0 && (
              <p className="text-green-600 text-xs mt-1">✅ Entry is balanced</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
            <button type="submit" disabled={!isBalanced}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
              Post Entry
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ── Invoices Tab ──────────────────────────────────────────────────────────────
const InvoicesTab = () => {
  const dispatch = useDispatch();
  const { invoices } = useSelector(s => s.accounting);
  const { customers } = useSelector(s => s.crm);
  const [modal, setModal]     = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [items, setItems]     = useState([{ name: '', quantity: 1, unitPrice: 0, taxRate: 0 }]);
  const [payAmount, setPayAmount] = useState('');
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { dueDate: new Date(Date.now() + 30*86400000).toISOString().split('T')[0] }
  });

  useEffect(() => {
    dispatch(fetchInvoices({ status: filterStatus || undefined }));
    dispatch(fetchCustomers());
  }, [dispatch, filterStatus]);

  const addItem    = () => setItems([...items, { name: '', quantity: 1, unitPrice: 0, taxRate: 0 }]);
  const removeItem = (i) => { if (items.length > 1) setItems(items.filter((_,idx) => idx !== i)); };
  const updateItem = (i, field, val) => { const u=[...items]; u[i]={...u[i],[field]:val}; setItems(u); };

  const calcTotal = () => items.reduce((s, item) => {
    const base = Number(item.quantity||0) * Number(item.unitPrice||0);
    return s + base + base * (Number(item.taxRate||0)/100);
  }, 0);

  const onSubmit = async (data) => {
    const res = await dispatch(createInvoice({ ...data, items }));
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success('Invoice created!'); setModal(false); reset();
      setItems([{ name: '', quantity: 1, unitPrice: 0, taxRate: 0 }]);
      dispatch(fetchInvoices());
    } else toast.error(res.payload || 'Error');
  };

  const handlePayment = async () => {
    if (!payAmount || Number(payAmount) <= 0) { toast.error('Enter valid amount'); return; }
    const res = await dispatch(recordPayment({ id: payModal._id, amount: Number(payAmount) }));
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success('Payment recorded!'); setPayModal(null); setPayAmount('');
    } else toast.error(res.payload || 'Error');
  };

  const handleSend = async (id) => {
    const res = await dispatch(updateInvoiceStatus({ id, status: 'sent' }));
    if (res.meta.requestStatus === 'fulfilled') toast.success('Invoice marked as sent!');
    else toast.error(res.payload || 'Error');
  };
const handleDownloadPDF = async (id) => {
  try {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`http://localhost:5000/api/accounting/invoices/${id}/pdf`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const blob = await response.blob();
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `invoice-${id}.pdf`; a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Invoice PDF downloaded!');
  } catch { toast.error('Download failed'); }
};

const handleEmailInvoice = async (id) => {
  const res = await api.post(`/accounting/invoices/${id}/email`);
  if (res.data.success) toast.success(res.data.message);
  else toast.error('Email failed');
};
  const STATUS_TABS = ['','draft','sent','partial','paid','overdue'];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-1 flex-wrap">
          {STATUS_TABS.map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all
                ${filterStatus===s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
        <button onClick={() => setModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + New Invoice
        </button>

<button onClick={() => exportInvoices(invoices)}
  className="ml-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
  ⬇ Excel
</button>
      </div>

   <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
  <table className="w-full text-sm">
    <thead className="bg-gray-50 border-b">
      <tr>
        {['Invoice #','Customer','Amount','Paid','Balance Due','Due Date','Status','Actions'].map(h => (
          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
            {h}
          </th>
        ))}
      </tr>
    </thead>

    <tbody>
      {invoices.length === 0 ? (
        <tr>
          <td colSpan={8} className="text-center py-10 text-gray-400">
            No invoices found.
          </td>
        </tr>
      ) : (
        invoices.map(inv => (
          <tr
            key={inv._id}
            className={`border-b border-gray-50 hover:bg-gray-50 ${
              inv.status === 'overdue' ? 'bg-red-50' : ''
            }`}
          >
            <td className="px-4 py-3 font-mono text-xs text-blue-600">
              {inv.invoiceNumber}
            </td>

            <td className="px-4 py-3 font-medium text-gray-800">
              {inv.customer?.name || '—'}
            </td>

            <td className="px-4 py-3 font-semibold">
              ₹{inv.totalAmount?.toLocaleString()}
            </td>

            <td className="px-4 py-3 text-green-600">
              ₹{inv.amountPaid?.toLocaleString()}
            </td>

            <td className={`px-4 py-3 font-bold ${inv.balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ₹{inv.balanceDue?.toLocaleString()}
            </td>

            <td className="px-4 py-3 text-gray-500">
              {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
            </td>

            <td className="px-4 py-3">
              <Badge status={inv.status} />
            </td>

            {/* UPDATED ACTIONS COLUMN */}
            <td className="px-4 py-3">
              <div className="flex gap-1 flex-wrap">

                {inv.status === 'draft' && (
                  <button
                    onClick={() => handleSend(inv._id)}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-200 font-medium"
                  >
                    Send
                  </button>
                )}

                {['sent','partial','overdue'].includes(inv.status) && (
                  <button
                    onClick={() => { setPayModal(inv); setPayAmount(''); }}
                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full hover:bg-green-200 font-medium"
                  >
                    + Payment
                  </button>
                )}

                <button
                  onClick={() => handleDownloadPDF(inv._id)}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full hover:bg-gray-200 font-medium"
                >
                  ⬇ PDF
                </button>

                <button
                  onClick={() => handleEmailInvoice(inv._id)}
                  className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full hover:bg-purple-200 font-medium"
                >
                  ✉ Email
                </button>

              </div>
            </td>

          </tr>
        ))
      )}
    </tbody>
  </table>
</div>

      {/* Create Invoice Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Create Invoice" size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Customer *">
              <Sel reg={register('customer', { required: true })}>
                <option value="">Select customer</option>
                {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </Sel>
            </Field>
            <Field label="Due Date">
              <Input reg={register('dueDate')} type="date" />
            </Field>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">Invoice Items</label>
              <button type="button" onClick={addItem} className="text-xs text-blue-600 hover:underline">+ Add Item</button>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">Item Name</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">Qty</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">Unit Price</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">Tax %</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => {
                    const lineTotal = Number(item.quantity||0) * Number(item.unitPrice||0) * (1 + Number(item.taxRate||0)/100);
                    return (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-3 py-2">
                          <input value={item.name} onChange={e => updateItem(i,'name',e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm" placeholder="Item description" />
                        </td>
                        <td className="px-3 py-2 w-16">
                          <input type="number" value={item.quantity} min="1"
                            onChange={e => updateItem(i,'quantity',e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm" />
                        </td>
                        <td className="px-3 py-2 w-28">
                          <input type="number" value={item.unitPrice} min="0"
                            onChange={e => updateItem(i,'unitPrice',e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm" />
                        </td>
                        <td className="px-3 py-2 w-20">
                          <input type="number" value={item.taxRate} min="0" max="100"
                            onChange={e => updateItem(i,'taxRate',e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm" />
                        </td>
                        <td className="px-3 py-2 font-semibold text-green-600 whitespace-nowrap">
                          ₹{lineTotal.toLocaleString(undefined,{maximumFractionDigits:2})}
                        </td>
                        <td className="px-3 py-2">
                          {items.length > 1 && (
                            <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-lg">×</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="text-right mt-2">
              <span className="text-base font-bold text-gray-800">
                Invoice Total: ₹{calcTotal().toLocaleString(undefined,{maximumFractionDigits:2})}
              </span>
            </div>
          </div>

          <Field label="Notes">
            <textarea {...register('notes')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2} placeholder="Payment terms, notes..." />
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
            <button type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              Create Invoice
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal isOpen={!!payModal} onClose={() => setPayModal(null)} title="Record Payment" size="sm">
        {payModal && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Invoice</span><span className="font-mono font-semibold">{payModal.invoiceNumber}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-semibold">₹{payModal.totalAmount?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Already Paid</span><span className="text-green-600 font-semibold">₹{payModal.amountPaid?.toLocaleString()}</span></div>
              <div className="flex justify-between border-t pt-1"><span className="font-bold">Balance Due</span><span className="font-bold text-red-600">₹{payModal.balanceDue?.toLocaleString()}</span></div>
            </div>
            <Field label="Payment Amount (₹)">
              <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                max={payModal.balanceDue} min="1"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Max: ₹${payModal.balanceDue?.toLocaleString()}`} />
            </Field>
            <div className="flex justify-end gap-3">
              <button onClick={() => setPayModal(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
              <button onClick={handlePayment}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                Record Payment
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ── Expenses Tab ──────────────────────────────────────────────────────────────
const ExpensesTab = () => {
  const dispatch = useDispatch();
  const { expenses } = useSelector(s => s.accounting);
  const { departments } = useSelector(s => s.hr);
  const [modal, setModal]   = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { date: new Date().toISOString().split('T')[0], paymentMethod: 'bank' }
  });

  useEffect(() => {
    dispatch(fetchExpenses({ status: filterStatus || undefined }));
    dispatch(fetchDepartments());
  }, [dispatch, filterStatus]);

  const onSubmit = async (data) => {
    const res = await dispatch(createExpense(data));
    if (res.meta.requestStatus === 'fulfilled') { toast.success('Expense submitted!'); setModal(false); reset(); }
    else toast.error(res.payload || 'Error');
  };

  const handleStatus = async (id, status) => {
    const res = await dispatch(updateExpenseStatus({ id, status }));
    if (res.meta.requestStatus === 'fulfilled') toast.success(`Expense ${status}!`);
    else toast.error(res.payload || 'Error');
  };

  const totalApproved = expenses.filter(e => e.status === 'approved').reduce((s,e) => s + e.amount, 0);
  const totalPending  = expenses.filter(e => e.status === 'pending').reduce((s,e) => s + e.amount, 0);

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Approved Expenses</p>
          <p className="text-xl font-bold text-green-600">₹{totalApproved.toLocaleString()}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Pending Approval</p>
          <p className="text-xl font-bold text-yellow-600">₹{totalPending.toLocaleString()}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Total Submitted</p>
          <p className="text-xl font-bold text-blue-600">{expenses.length}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-2">
          {['','pending','approved','rejected'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all
                ${filterStatus===s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
        <button onClick={() => setModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + Add Expense
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Date','Category','Description','Amount','Dept','Payment','Status','Action'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">No expenses found.</td></tr>
            ) : expenses.map(e => (
              <tr key={e._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{new Date(e.date).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">{e.category}</span>
                </td>
                <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{e.description}</td>
                <td className="px-4 py-3 font-bold text-gray-800">₹{e.amount?.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-500">{e.department?.name || '—'}</td>
                <td className="px-4 py-3 text-gray-500 capitalize">{e.paymentMethod}</td>
                <td className="px-4 py-3"><Badge status={e.status} /></td>
                <td className="px-4 py-3">
                  {e.status === 'pending' && (
                    <div className="flex gap-1">
                      <button onClick={() => handleStatus(e._id,'approved')}
                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full hover:bg-green-200 font-medium">✓</button>
                      <button onClick={() => handleStatus(e._id,'rejected')}
                        className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full hover:bg-red-200 font-medium">✗</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add Expense">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
          <Field label="Category *" error={errors.category?.message}>
            <Sel reg={register('category', { required: true })}>
              <option value="">Select category</option>
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Sel>
          </Field>
          <Field label="Amount (₹) *" error={errors.amount?.message}>
            <Input reg={register('amount', { required: true, valueAsNumber: true })} type="number" min="0" placeholder="0" />
          </Field>
          <div className="col-span-2">
            <Field label="Description *" error={errors.description?.message}>
              <Input reg={register('description', { required: true })} placeholder="What was this expense for?" />
            </Field>
          </div>
          <Field label="Date *">
            <Input reg={register('date', { required: true })} type="date" />
          </Field>
          <Field label="Payment Method">
            <Sel reg={register('paymentMethod')}>
              <option value="bank">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
            </Sel>
          </Field>
          <Field label="Department">
            <Sel reg={register('department')}>
              <option value="">Select department</option>
              {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </Sel>
          </Field>
          <div className="col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
            <button type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Submit Expense</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ── Reports Tab ───────────────────────────────────────────────────────────────
const ReportsTab = () => {
  const dispatch = useDispatch();
  const { profitLoss, balanceSheet } = useSelector(s => s.accounting);
  const [activeReport, setActiveReport] = useState('pl');
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    dispatch(fetchProfitLoss({ year }));
    dispatch(fetchBalanceSheet());
  }, [dispatch, year]);
const handleDownloadPLPDF = async () => {
  try {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`http://localhost:5000/api/accounting/reports/profit-loss/pdf?year=${year}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const blob = await response.blob();
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `PL-Report-${year}.pdf`; a.click();
    window.URL.revokeObjectURL(url);
    toast.success('P&L Report downloaded!');
  } catch { toast.error('Download failed'); }
};

const handleDownloadBSPDF = async () => {
  try {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`http://localhost:5000/api/accounting/reports/balance-sheet/pdf`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const blob = await response.blob();
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'Balance-Sheet.pdf'; a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Balance Sheet downloaded!');
  } catch { toast.error('Download failed'); }
};
  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex gap-2">
          <button onClick={() => setActiveReport('pl')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeReport==='pl' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            📊 Profit & Loss
          </button>
          <button onClick={() => setActiveReport('bs')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeReport==='bs' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            ⚖️ Balance Sheet
          </button>
        </div>
       <div className="flex gap-2">

    {activeReport === 'pl' && (
      <>
        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          {YEARS.map(y => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <button
          onClick={handleDownloadPLPDF}
          className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
        >
          ⬇ PDF
        </button>
      </>
    )}

    {activeReport === 'bs' && (
      <button
        onClick={handleDownloadBSPDF}
        className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
      >
        ⬇ PDF
      </button>
    )}

  </div>
      </div>

      {/* P&L Report */}
      {activeReport === 'pl' && profitLoss && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-xl p-5 text-center">
              <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">₹{profitLoss.totalRevenue?.toLocaleString()}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-5 text-center">
              <p className="text-xs text-gray-500 mb-1">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">₹{profitLoss.totalExpense?.toLocaleString()}</p>
            </div>
            <div className={`rounded-xl p-5 text-center ${profitLoss.netProfit >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
              <p className="text-xs text-gray-500 mb-1">Net {profitLoss.netProfit >= 0 ? 'Profit' : 'Loss'}</p>
              <p className={`text-2xl font-bold ${profitLoss.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                ₹{Math.abs(profitLoss.netProfit)?.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="bg-green-50 px-4 py-3 font-semibold text-green-700 text-sm">Revenue Accounts</div>
              <table className="w-full text-sm">
                <tbody>
                  {profitLoss.revenueAccounts?.map(a => (
                    <tr key={a.code} className="border-b border-gray-50">
                      <td className="px-4 py-2 text-gray-600">{a.code} — {a.name}</td>
                      <td className="px-4 py-2 text-right font-semibold text-green-600">₹{a.balance?.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-green-50">
                    <td className="px-4 py-2 font-bold text-green-700">Total Revenue</td>
                    <td className="px-4 py-2 text-right font-bold text-green-700">₹{profitLoss.totalRevenue?.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="bg-red-50 px-4 py-3 font-semibold text-red-700 text-sm">Expense Accounts</div>
              <table className="w-full text-sm">
                <tbody>
                  {profitLoss.expenseAccounts?.map(a => (
                    <tr key={a.code} className="border-b border-gray-50">
                      <td className="px-4 py-2 text-gray-600">{a.code} — {a.name}</td>
                      <td className="px-4 py-2 text-right font-semibold text-red-500">₹{a.balance?.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-red-50">
                    <td className="px-4 py-2 font-bold text-red-700">Total Expenses</td>
                    <td className="px-4 py-2 text-right font-bold text-red-700">₹{profitLoss.totalExpense?.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Balance Sheet */}
      {activeReport === 'bs' && balanceSheet && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-xl p-5 text-center">
              <p className="text-xs text-gray-500 mb-1">Total Assets</p>
              <p className="text-2xl font-bold text-blue-600">₹{balanceSheet.totalAssets?.toLocaleString()}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-5 text-center">
              <p className="text-xs text-gray-500 mb-1">Total Liabilities</p>
              <p className="text-2xl font-bold text-red-600">₹{balanceSheet.totalLiabilities?.toLocaleString()}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-5 text-center">
              <p className="text-xs text-gray-500 mb-1">Total Equity</p>
              <p className="text-2xl font-bold text-purple-600">₹{balanceSheet.totalEquity?.toLocaleString()}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Assets', color: 'blue', items: balanceSheet.assets, total: balanceSheet.totalAssets },
              { label: 'Liabilities & Equity', color: 'purple', items: [...(balanceSheet.liabilities||[]),...(balanceSheet.equity||[])], total: balanceSheet.totalLiabilities + balanceSheet.totalEquity },
            ].map(section => (
              <div key={section.label} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className={`bg-${section.color}-50 px-4 py-3 font-semibold text-${section.color}-700 text-sm`}>
                  {section.label}
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {section.items?.map(a => (
                      <tr key={a.code} className="border-b border-gray-50">
                        <td className="px-4 py-2 text-gray-600">{a.code} — {a.name}</td>
                        <td className="px-4 py-2 text-right font-semibold text-gray-800">₹{a.balance?.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className={`bg-${section.color}-50`}>
                      <td className={`px-4 py-2 font-bold text-${section.color}-700`}>Total</td>
                      <td className={`px-4 py-2 text-right font-bold text-${section.color}-700`}>₹{section.total?.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Accounting Page ──────────────────────────────────────────────────────
const TABS = ['Accounts','Journal','Invoices','Expenses','Reports'];

const Accounting = () => {
  const dispatch = useDispatch();
  const { stats } = useSelector(s => s.accounting);
  const [tab, setTab] = useState('Accounts');

  useEffect(() => { dispatch(fetchAccountingStats()); }, [dispatch]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">💰 Accounting & Finance</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="💵" label="Total Revenue"     value={stats?.totalRevenue    ? `₹${Math.round(stats.totalRevenue).toLocaleString()}`    : '—'} color="green"  />
        <StatCard icon="📤" label="Total Expenses"    value={stats?.totalExpenses   ? `₹${Math.round(stats.totalExpenses).toLocaleString()}`   : '—'} color="red"    />
        <StatCard icon="📈" label="Net Profit"        value={stats?.netProfit       ? `₹${Math.round(stats.netProfit).toLocaleString()}`       : '—'} color="blue"   />
        <StatCard icon="🔴" label="Overdue Invoices"  value={stats?.overdueInvoices ?? '—'} color="orange" />
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
              ${tab===t ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Accounts' && <AccountsTab />}
      {tab === 'Journal'  && <JournalTab />}
      {tab === 'Invoices' && <InvoicesTab />}
      {tab === 'Expenses' && <ExpensesTab />}
      {tab === 'Reports'  && <ReportsTab />}
    </div>
  );
};

export default Accounting;