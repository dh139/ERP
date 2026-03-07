import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  fetchCRMStats, fetchCustomers, createCustomer,
  fetchLeads, createLead, updateLead, convertLead,
  fetchSalesOrders, createSalesOrder, updateOrderStatus,
} from '../../features/crm/crmSlice';
import { fetchProducts, fetchWarehouses } from '../../features/inventory/inventorySlice';
import Modal     from '../../components/UI/Modal';
import StatCard  from '../../components/UI/StatCard';
import Badge     from '../../components/UI/Badge';
import SearchBar from '../../components/UI/SearchBar';
import { useForm } from 'react-hook-form';
import { exportCustomers, exportOrders } from '../../utils/exportExcel';

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

// ── Customers Tab ─────────────────────────────────────────────────────────────
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
      <div className="flex items-center justify-between mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search customers..." />
        <button onClick={() => setModal(true)}
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex-shrink-0">
          + Add Customer
        </button>
        <button onClick={() => exportCustomers(customers)}
  className="ml-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
  ⬇ Excel
</button>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Name','Company','Email','Phone','Total Orders','Total Spent'].map(h=>(
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">No customers yet. Add your first customer!</td></tr>
            ) : filtered.map(c => (
              <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                <td className="px-4 py-3 text-gray-500">{c.company || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{c.email || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{c.phone || '—'}</td>
                <td className="px-4 py-3 text-center font-semibold text-blue-600">{c.totalOrders}</td>
                <td className="px-4 py-3 font-semibold text-green-600">₹{c.totalSpent?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add Customer">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Full Name *" error={errors.name?.message}>
              <Input reg={register('name', { required: 'Name required' })} placeholder="John Doe" />
            </Field>
          </div>
          <Field label="Email"><Input reg={register('email')} type="email" placeholder="john@email.com" /></Field>
          <Field label="Phone"><Input reg={register('phone')} placeholder="+91 XXXXX XXXXX" /></Field>
          <Field label="Company"><Input reg={register('company')} placeholder="Company name" /></Field>
          <Field label="Credit Limit"><Input reg={register('creditLimit', { valueAsNumber: true })} type="number" placeholder="0" /></Field>
          <div className="col-span-2">
            <Field label="Address"><Input reg={register('address')} placeholder="Full address" /></Field>
          </div>
          <div className="col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
            <button type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Add Customer</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ── Leads Tab ─────────────────────────────────────────────────────────────────
const LEAD_STAGES = ['new','contacted','qualified','lost','converted'];

const LeadsTab = () => {
  const dispatch = useDispatch();
  const { leads } = useSelector(s => s.crm);
  const [modal, setModal]     = useState(false);
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
    if (res.meta.requestStatus === 'fulfilled') toast.success('Lead converted to customer!');
    else toast.error(res.payload || 'Error');
  };

  const filtered = filterStatus ? leads.filter(l => l.status === filterStatus) : leads;

  return (
    <div>
      {/* Kanban summary */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {LEAD_STAGES.map(stage => {
          const count = leads.filter(l => l.status === stage).length;
          const colors = { new:'blue', contacted:'yellow', qualified:'green', lost:'red', converted:'purple' };
          return <StatCard key={stage} icon="👤" label={stage.charAt(0).toUpperCase()+stage.slice(1)} value={count} color={colors[stage]} />;
        })}
      </div>

      <div className="flex items-center justify-between mb-4">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none">
          <option value="">All Stages</option>
          {LEAD_STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </select>
        <button onClick={() => setModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + Add Lead
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Name','Company','Phone','Source','Value','Status','Action'].map(h=>(
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">No leads found.</td></tr>
            ) : filtered.map(l => (
              <tr key={l._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{l.name}</td>
                <td className="px-4 py-3 text-gray-500">{l.company || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{l.phone || '—'}</td>
                <td className="px-4 py-3 text-gray-500 capitalize">{l.source?.replace('_',' ')}</td>
                <td className="px-4 py-3 font-semibold text-green-600">₹{l.value?.toLocaleString() || 0}</td>
                <td className="px-4 py-3">
                  <select value={l.status}
                    onChange={e => handleStatusChange(l._id, e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white">
                    {LEAD_STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  {l.status === 'qualified' && (
                    <button onClick={() => handleConvert(l._id)}
                      className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 font-medium">
                      Convert
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add New Lead">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Full Name *" error={errors.name?.message}>
              <Input reg={register('name', { required: 'Name required' })} placeholder="John Doe" />
            </Field>
          </div>
          <Field label="Email"><Input reg={register('email')} type="email" placeholder="john@email.com" /></Field>
          <Field label="Phone"><Input reg={register('phone')} placeholder="+91 XXXXX XXXXX" /></Field>
          <Field label="Company"><Input reg={register('company')} placeholder="Company name" /></Field>
          <Field label="Estimated Value (₹)">
            <Input reg={register('value', { valueAsNumber: true })} type="number" placeholder="0" />
          </Field>
          <Field label="Source">
            <Select reg={register('source')}>
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="cold_call">Cold Call</option>
              <option value="social_media">Social Media</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Follow Up Date">
            <Input reg={register('followUpDate')} type="date" />
          </Field>
          <div className="col-span-2">
            <Field label="Notes">
              <textarea {...register('notes')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" rows={2} placeholder="Any notes..." />
            </Field>
          </div>
          <div className="col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
            <button type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Add Lead</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ── Sales Orders Tab ──────────────────────────────────────────────────────────
const SalesOrdersTab = () => {
  const dispatch = useDispatch();
  const { orders } = useSelector(s => s.crm);
  const { customers } = useSelector(s => s.crm);
  const { products, warehouses } = useSelector(s => s.inventory);
  const [modal, setModal]   = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [items, setItems]   = useState([{ product: '', name: '', quantity: 1, unitPrice: 0, discount: 0 }]);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    dispatch(fetchSalesOrders());
    dispatch(fetchCustomers());
    dispatch(fetchProducts());
    dispatch(fetchWarehouses());
  }, [dispatch]);

  const addItem    = () => setItems([...items, { product: '', name: '', quantity: 1, unitPrice: 0, discount: 0 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => {
    const updated = [...items]; updated[i] = { ...updated[i], [field]: val }; setItems(updated);
  };
  const selectProduct = (i, productId) => {
    const p = products.find(p => p._id === productId);
    if (p) updateItem(i, 'product', productId);
    if (p) { const updated = [...items]; updated[i] = { ...updated[i], product: productId, name: p.name, unitPrice: p.sellingPrice }; setItems(updated); }
  };

  const total = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice) * (1 - Number(item.discount || 0) / 100)), 0);

  const onSubmit = async (data) => {
    const res = await dispatch(createSalesOrder({ ...data, items }));
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success('Sales Order created!'); setModal(false); reset(); setItems([{ product: '', name: '', quantity: 1, unitPrice: 0, discount: 0 }]);
    } else toast.error(res.payload || 'Error');
  };

  const handleStatusUpdate = async (id, status) => {
    const res = await dispatch(updateOrderStatus({ id, status }));
    if (res.meta.requestStatus === 'fulfilled') toast.success('Order status updated!');
    else toast.error(res.payload || 'Error');
  };

  const STATUS_FLOW = { pending: ['processing','cancelled'], processing: ['shipped','cancelled'], shipped: ['delivered'] };
  const filtered = filterStatus ? orders.filter(o => o.status === filterStatus) : orders;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none">
          <option value="">All Orders</option>
          {['pending','processing','shipped','delivered','cancelled'].map(s=>(
            <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
          ))}
        </select>
        <button onClick={() => setModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + New Order
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Order #','Customer','Items','Total','Payment','Status','Update Status'].map(h=>(
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">No sales orders yet.</td></tr>
            ) : filtered.map(o => (
              <tr key={o._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-blue-600">{o.orderNumber}</td>
                <td className="px-4 py-3 font-medium">{o.customer?.name}</td>
                <td className="px-4 py-3 text-gray-500">{o.items?.length} items</td>
                <td className="px-4 py-3 font-semibold text-green-600">₹{o.totalAmount?.toLocaleString()}</td>
                <td className="px-4 py-3"><Badge status={o.paymentStatus} /></td>
                <td className="px-4 py-3"><Badge status={o.status} /></td>
                <td className="px-4 py-3">
                  {STATUS_FLOW[o.status]?.map(nextStatus => (
                    <button key={nextStatus} onClick={() => handleStatusUpdate(o._id, nextStatus)}
                      className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full mr-1 hover:bg-blue-100 font-medium capitalize">
                      → {nextStatus}
                    </button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Create Sales Order" size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Customer *" error={errors.customer?.message}>
              <Select reg={register('customer', { required: true })}>
                <option value="">Select customer</option>
                {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Warehouse (for stock check)">
              <Select reg={register('warehouse')}>
                <option value="">Select warehouse</option>
                {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
              </Select>
            </Field>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Order Items</label>
              <button type="button" onClick={addItem} className="text-xs text-blue-600 hover:underline">+ Add Item</button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4">
                    <select value={item.product} onChange={e => selectProduct(i, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                      <option value="">Select product</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input type="number" value={item.quantity} min="1"
                      onChange={e => updateItem(i,'quantity',e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Qty" />
                  </div>
                  <div className="col-span-3">
                    <input type="number" value={item.unitPrice}
                      onChange={e => updateItem(i,'unitPrice',e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Price" />
                  </div>
                  <div className="col-span-2">
                    <input type="number" value={item.discount} min="0" max="100"
                      onChange={e => updateItem(i,'discount',e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Disc%" />
                  </div>
                  <div className="col-span-1 text-center">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-lg">×</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-right mt-2">
              <span className="text-sm font-bold text-gray-800">Order Total: ₹{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tax Rate (%)">
              <Input reg={register('taxRate', { valueAsNumber: true })} type="number" defaultValue={0} placeholder="0" />
            </Field>
            <Field label="Shipping Address">
              <Input reg={register('shippingAddress')} placeholder="Delivery address" />
            </Field>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
            <button type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Create Order</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ── Main CRM Page ─────────────────────────────────────────────────────────────
const TABS = ['Customers','Leads','Sales Orders'];

const CRM = () => {
  const dispatch = useDispatch();
  const { stats } = useSelector(s => s.crm);
  const [tab, setTab] = useState('Customers');

  useEffect(() => { dispatch(fetchCRMStats()); }, [dispatch]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">🤝 CRM & Sales</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="👥" label="Total Customers" value={stats?.totalCustomers} color="blue" />
        <StatCard icon="🎯" label="Open Leads"      value={stats?.openLeads}      color="orange" />
        <StatCard icon="🛒" label="Total Orders"    value={stats?.totalOrders}    color="purple" />
        <StatCard icon="💰" label="Total Revenue"   value={stats?.totalRevenue ? `₹${Math.round(stats.totalRevenue).toLocaleString()}` : '—'} color="green" />
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Customers'    && <CustomersTab />}
      {tab === 'Leads'        && <LeadsTab />}
      {tab === 'Sales Orders' && <SalesOrdersTab />}
    </div>
  );
};

export default CRM;