import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  fetchInventoryStats, fetchProducts, createProduct, updateProduct,
  fetchWarehouses, createWarehouse, fetchStock, recordMovement,
  fetchSuppliers, createSupplier, fetchPurchaseOrders,
  createPurchaseOrder, receivePurchaseOrder, fetchLowStock
} from '../../features/inventory/inventorySlice';
import Modal    from '../../components/UI/Modal';
import Badge    from '../../components/UI/Badge';
import { useForm } from 'react-hook-form';
import { exportProducts, exportStock } from '../../utils/exportExcel';

// ── Design Tokens ─────────────────────────────────────────────────────────────
const S = {
  input: {
    width: '100%', padding: '10px 14px',
    border: '2px solid #E8E8E3', borderRadius: 10,
    fontFamily: "'DM Sans', sans-serif", fontSize: 14,
    color: '#0A0A0A', background: 'white', outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    appearance: 'none',
  },
  select: {
    width: '100%', padding: '10px 14px',
    border: '2px solid #E8E8E3', borderRadius: 10,
    fontFamily: "'DM Sans', sans-serif", fontSize: 14,
    color: '#0A0A0A', background: 'white', outline: 'none',
    cursor: 'pointer', appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
    paddingRight: 40,
  },
  label: {
    fontFamily: 'Syne', fontWeight: 700, fontSize: 11,
    color: '#0A0A0A', display: 'block', marginBottom: 7,
    letterSpacing: '0.05em',
  },
  primaryBtn: {
    padding: '10px 20px', background: '#0A0A0A', color: 'white',
    border: 'none', borderRadius: 10,
    fontFamily: 'Syne', fontWeight: 700, fontSize: 13,
    cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
    whiteSpace: 'nowrap',
  },
  secondaryBtn: {
    padding: '10px 20px', background: 'white',
    border: '2px solid #E8E8E3', borderRadius: 10,
    fontFamily: 'DM Sans', fontWeight: 500, fontSize: 13,
    color: '#555', cursor: 'pointer', transition: 'border-color 0.15s',
    whiteSpace: 'nowrap',
  },
  excelBtn: {
    padding: '10px 16px', background: '#F0FDF4',
    border: '2px solid #BBF7D0', borderRadius: 10,
    fontFamily: 'Syne', fontWeight: 700, fontSize: 12,
    color: '#16A34A', cursor: 'pointer', transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  },
  card: {
    background: 'white', border: '2px solid #F0F0EB',
    borderRadius: 16, overflow: 'hidden',
  },
  th: {
    padding: '12px 16px', textAlign: 'left',
    fontFamily: 'Syne', fontWeight: 700, fontSize: 10,
    color: '#AAA', letterSpacing: '0.08em',
    borderBottom: '2px solid #F0F0EB',
    background: '#FAFAF8',
  },
  td: {
    padding: '13px 16px',
    fontFamily: 'DM Sans', fontSize: 13,
    color: '#444', borderBottom: '1px solid #F4F4F0',
  },
};

// ── Shared Components ─────────────────────────────────────────────────────────
const Field = ({ label, error, children }) => (
  <div>
    <label style={S.label}>{label}</label>
    {children}
    {error && <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#DC2626', marginTop: 4 }}>⚠ {error}</p>}
  </div>
);

const NInput = ({ reg, style = {}, ...props }) => (
  <input {...reg} {...props}
    style={{ ...S.input, ...style }}
    onFocus={e => { e.target.style.borderColor = '#0A0A0A'; e.target.style.boxShadow = '0 0 0 4px rgba(10,10,10,0.06)'; }}
    onBlur={e => { e.target.style.borderColor = '#E8E8E3'; e.target.style.boxShadow = 'none'; }}
  />
);

const NSelect = ({ reg, children, style = {}, ...props }) => (
  <select {...reg} {...props}
    style={{ ...S.select, ...style }}
    onFocus={e => { e.target.style.borderColor = '#0A0A0A'; e.target.style.boxShadow = '0 0 0 4px rgba(10,10,10,0.06)'; }}
    onBlur={e => { e.target.style.borderColor = '#E8E8E3'; e.target.style.boxShadow = 'none'; }}
  >
    {children}
  </select>
);

const NTextarea = ({ reg, ...props }) => (
  <textarea {...reg} {...props}
    style={{ ...S.input, resize: 'vertical', minHeight: 72 }}
    onFocus={e => { e.target.style.borderColor = '#0A0A0A'; e.target.style.boxShadow = '0 0 0 4px rgba(10,10,10,0.06)'; }}
    onBlur={e => { e.target.style.borderColor = '#E8E8E3'; e.target.style.boxShadow = 'none'; }}
  />
);

const PrimaryBtn = ({ children, style = {}, ...props }) => (
  <button style={{ ...S.primaryBtn, ...style }} {...props}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
  >{children}</button>
);

const SecondaryBtn = ({ children, style = {}, ...props }) => (
  <button style={{ ...S.secondaryBtn, ...style }} {...props}
    onMouseEnter={e => e.currentTarget.style.borderColor = '#0A0A0A'}
    onMouseLeave={e => e.currentTarget.style.borderColor = '#E8E8E3'}
  >{children}</button>
);

const ExcelBtn = ({ children, style = {}, ...props }) => (
  <button style={{ ...S.excelBtn, ...style }} {...props}
    onMouseEnter={e => { e.currentTarget.style.background = '#16A34A'; e.currentTarget.style.color = 'white'; }}
    onMouseLeave={e => { e.currentTarget.style.background = '#F0FDF4'; e.currentTarget.style.color = '#16A34A'; }}
  >{children}</button>
);

const KPICard = ({ icon, label, value, accent = '#FFD966' }) => (
  <div style={{ ...S.card, padding: '22px 20px', position: 'relative', overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s' }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent }} />
    <div style={{ width: 42, height: 42, background: '#0A0A0A', borderRadius: 11,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 14 }}>
      {icon}
    </div>
    <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 24, color: '#0A0A0A',
      letterSpacing: '-0.025em', marginBottom: 4 }}>{value ?? '—'}</p>
    <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#999', fontWeight: 500 }}>{label}</p>
  </div>
);

const SearchInput = ({ value, onChange, placeholder }) => (
  <div style={{ position: 'relative', flex: 1 }}>
    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>🔍</span>
    <input
      value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ ...S.input, paddingLeft: 36 }}
      onFocus={e => { e.target.style.borderColor = '#0A0A0A'; e.target.style.boxShadow = '0 0 0 4px rgba(10,10,10,0.06)'; }}
      onBlur={e => { e.target.style.borderColor = '#E8E8E3'; e.target.style.boxShadow = 'none'; }}
    />
  </div>
);

const StatusPill = ({ ok }) => (
  <span style={{
    fontFamily: 'Syne', fontWeight: 700, fontSize: 10,
    letterSpacing: '0.06em',
    padding: '4px 10px', borderRadius: 100,
    background: ok ? '#F0FDF4' : '#FEF2F2',
    color: ok ? '#16A34A' : '#DC2626',
    border: `1.5px solid ${ok ? '#BBF7D0' : '#FECACA'}`,
  }}>{ok ? 'OK' : 'LOW STOCK'}</span>
);

const EmptyRow = ({ cols, message }) => (
  <tr>
    <td colSpan={cols} style={{ textAlign: 'center', padding: '48px 16px' }}>
      <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.15 }}>📦</div>
      <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: '#CCC' }}>{message}</p>
    </td>
  </tr>
);

const FormFooter = ({ onCancel, submitLabel }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid #F0F0EB', marginTop: 8 }}>
    <SecondaryBtn type="button" onClick={onCancel}>Cancel</SecondaryBtn>
    <PrimaryBtn type="submit">{submitLabel}</PrimaryBtn>
  </div>
);

// ── PRODUCTS TAB ─────────────────────────────────────────────────────────────
const ProductsTab = () => {
  const dispatch = useDispatch();
  const { products, loading } = useSelector(s => s.inventory);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch]   = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { dispatch(fetchProducts()); }, [dispatch]);

  const openAdd  = () => { setEditing(null); reset({}); setModal(true); };
  const openEdit = (p) => { setEditing(p); reset(p); setModal(true); };

  const onSubmit = async (data) => {
    const res = await dispatch(editing ? updateProduct({ id: editing._id, payload: data }) : createProduct(data));
    if (res.meta.requestStatus === 'fulfilled') { toast.success(editing ? 'Product updated!' : 'Product created!'); setModal(false); }
    else toast.error(res.payload || 'Error');
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or SKU..." />
        <ExcelBtn onClick={() => exportProducts(products)}>⬇ Excel</ExcelBtn>
        <PrimaryBtn onClick={openAdd}>+ Add Product</PrimaryBtn>
      </div>

      <div style={S.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['SKU','Product Name','Category','Cost Price','Selling Price','Tax','Status',''].map(h => (
              <th key={h} style={S.th}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: 40, color: '#CCC' }}>Loading products...</td></tr>
            ) : filtered.length === 0 ? (
              <EmptyRow cols={8} message="No products found. Add your first product!" />
            ) : filtered.map((p, i) => (
              <tr key={p._id} style={{ background: i % 2 === 0 ? 'white' : '#FAFAF8' }}>
                <td style={S.td}>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#0EA5E9', background: '#F0F9FF', padding: '3px 8px', borderRadius: 6, border: '1px solid #BAE6FD' }}>{p.sku}</span>
                </td>
                <td style={{ ...S.td, fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: '#0A0A0A' }}>{p.name}</td>
                <td style={S.td}>{p.category}</td>
                <td style={{ ...S.td, color: '#666' }}>₹{p.costPrice?.toLocaleString()}</td>
                <td style={{ ...S.td, fontFamily: 'Syne', fontWeight: 700, color: '#16A34A' }}>₹{p.sellingPrice?.toLocaleString()}</td>
                <td style={{ ...S.td, color: '#888' }}>{p.taxRate}%</td>
                <td style={S.td}><Badge status={p.isActive ? 'active' : 'inactive'} /></td>
                <td style={S.td}>
                  <button onClick={() => openEdit(p)} style={{
                    fontFamily: 'Syne', fontWeight: 700, fontSize: 11, color: '#0A0A0A',
                    background: '#F4F4F0', border: '1.5px solid #E8E8E3',
                    padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#0A0A0A'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#F4F4F0'; e.currentTarget.style.color = '#0A0A0A'; }}
                  >Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Product' : 'Add New Product'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="SKU *" error={errors.sku?.message}>
              <NInput reg={register('sku', { required: 'SKU required' })} placeholder="e.g. PROD-001" />
            </Field>
            <Field label="PRODUCT NAME *" error={errors.name?.message}>
              <NInput reg={register('name', { required: 'Name required' })} placeholder="Product name" />
            </Field>
            <Field label="CATEGORY *" error={errors.category?.message}>
              <NInput reg={register('category', { required: 'Category required' })} placeholder="e.g. Electronics" />
            </Field>
            <Field label="BRAND">
              <NInput reg={register('brand')} placeholder="Brand name" />
            </Field>
            <Field label="COST PRICE *" error={errors.costPrice?.message}>
              <NInput reg={register('costPrice', { required: true, valueAsNumber: true })} type="number" placeholder="0" />
            </Field>
            <Field label="SELLING PRICE *" error={errors.sellingPrice?.message}>
              <NInput reg={register('sellingPrice', { required: true, valueAsNumber: true })} type="number" placeholder="0" />
            </Field>
            <Field label="TAX RATE (%)">
              <NInput reg={register('taxRate', { valueAsNumber: true })} type="number" placeholder="0" defaultValue={0} />
            </Field>
            <Field label="UNIT">
              <NInput reg={register('unit')} placeholder="pcs / kg / ltr" />
            </Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="DESCRIPTION">
                <NTextarea reg={register('description')} rows={2} placeholder="Optional description" />
              </Field>
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <FormFooter onCancel={() => setModal(false)} submitLabel={editing ? 'Update Product' : 'Create Product'} />
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ── WAREHOUSES TAB ────────────────────────────────────────────────────────────
const WarehousesTab = () => {
  const dispatch = useDispatch();
  const { warehouses } = useSelector(s => s.inventory);
  const [modal, setModal] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { dispatch(fetchWarehouses()); }, [dispatch]);

  const onSubmit = async (data) => {
    const res = await dispatch(createWarehouse(data));
    if (res.meta.requestStatus === 'fulfilled') { toast.success('Warehouse created!'); setModal(false); reset(); }
    else toast.error(res.payload || 'Error');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <PrimaryBtn onClick={() => setModal(true)}>+ Add Warehouse</PrimaryBtn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {warehouses.length === 0 ? (
          <div style={{ gridColumn: '1/-1', ...S.card, padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.15 }}>🏭</div>
            <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: '#CCC' }}>No warehouses yet. Add your first warehouse!</p>
          </div>
        ) : warehouses.map(w => (
          <div key={w._id} style={{ ...S.card, padding: 22, position: 'relative', overflow: 'hidden',
            transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#FFD966' }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, background: '#0A0A0A', borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                🏭
              </div>
              <div>
                <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, color: '#0A0A0A' }}>{w.name}</p>
                <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#888', marginTop: 2 }}>{w.location}</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[['Capacity', w.capacity || 'Not set'], ['Manager', w.manager?.name || 'Not assigned']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#AAA' }}>{k}</span>
                  <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 12, color: '#444' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add Warehouse">
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="WAREHOUSE NAME *" error={errors.name?.message}>
            <NInput reg={register('name', { required: 'Name required' })} placeholder="Main Warehouse" />
          </Field>
          <Field label="LOCATION *" error={errors.location?.message}>
            <NInput reg={register('location', { required: 'Location required' })} placeholder="City, State" />
          </Field>
          <Field label="CAPACITY (UNITS)">
            <NInput reg={register('capacity', { valueAsNumber: true })} type="number" placeholder="1000" />
          </Field>
          <FormFooter onCancel={() => setModal(false)} submitLabel="Create Warehouse" />
        </form>
      </Modal>
    </div>
  );
};

// ── STOCK TAB ─────────────────────────────────────────────────────────────────
const StockTab = () => {
  const dispatch = useDispatch();
  const { stock, warehouses, products, lowStock } = useSelector(s => s.inventory);
  const [modal, setModal]     = useState(false);
  const [filterWH, setFilterWH] = useState('');
  const { register, handleSubmit, reset, watch } = useForm();
  const movType = watch('type');

  useEffect(() => {
    dispatch(fetchStock()); dispatch(fetchWarehouses()); dispatch(fetchLowStock());
  }, [dispatch]);

  const onSubmit = async (data) => {
    const res = await dispatch(recordMovement(data));
    if (res.meta.requestStatus === 'fulfilled') { toast.success('Movement recorded!'); setModal(false); reset(); dispatch(fetchStock()); }
    else toast.error(res.payload || 'Error');
  };

  const filtered = filterWH ? stock.filter(s => s.warehouse?._id === filterWH) : stock;

  return (
    <div>
      {lowStock?.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#FEF2F2',
          border: '2px solid #FECACA', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, background: '#DC2626', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>⚠️</div>
          <div>
            <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 13, color: '#991B1B' }}>Low Stock Alert</p>
            <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#EF4444' }}>
              {lowStock.length} item(s) are below reorder level and need restocking.
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <select value={filterWH} onChange={e => setFilterWH(e.target.value)}
          style={{ ...S.select, width: 200 }}>
          <option value="">All Warehouses</option>
          {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <ExcelBtn onClick={() => exportStock(stock)}>⬇ Excel</ExcelBtn>
        <PrimaryBtn onClick={() => setModal(true)}>+ Record Movement</PrimaryBtn>
      </div>

      <div style={S.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Product','SKU','Warehouse','Quantity','Reorder Level','Status'].map(h => (
              <th key={h} style={S.th}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <EmptyRow cols={6} message="No stock records. Record a movement to get started." />
            ) : filtered.map((s, i) => (
              <tr key={s._id} style={{ background: s.quantity <= s.reorderLevel ? '#FFF8F8' : (i % 2 === 0 ? 'white' : '#FAFAF8') }}>
                <td style={{ ...S.td, fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: '#0A0A0A' }}>{s.product?.name}</td>
                <td style={S.td}>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#0EA5E9', background: '#F0F9FF', padding: '3px 8px', borderRadius: 6, border: '1px solid #BAE6FD' }}>{s.product?.sku}</span>
                </td>
                <td style={{ ...S.td, color: '#666' }}>{s.warehouse?.name}</td>
                <td style={{ ...S.td, fontFamily: 'Syne', fontWeight: 800, fontSize: 16, color: s.quantity <= s.reorderLevel ? '#DC2626' : '#0A0A0A' }}>
                  {s.quantity}
                </td>
                <td style={{ ...S.td, color: '#888' }}>{s.reorderLevel}</td>
                <td style={S.td}><StatusPill ok={s.quantity > s.reorderLevel} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Record Stock Movement">
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="PRODUCT *">
            <NSelect reg={register('product', { required: true })}>
              <option value="">Select product</option>
              {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
            </NSelect>
          </Field>
          <Field label="MOVEMENT TYPE *">
            <NSelect reg={register('type', { required: true })}>
              <option value="">Select type</option>
              <option value="in">Stock IN (Receiving)</option>
              <option value="out">Stock OUT (Issue)</option>
              <option value="adjustment">Adjustment (Set quantity)</option>
              <option value="transfer">Transfer Between Warehouses</option>
            </NSelect>
          </Field>
          <Field label={movType === 'transfer' ? 'FROM WAREHOUSE *' : 'WAREHOUSE *'}>
            <NSelect reg={register('fromWarehouse', { required: true })}>
              <option value="">Select warehouse</option>
              {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
            </NSelect>
          </Field>
          {movType === 'transfer' && (
            <Field label="TO WAREHOUSE *">
              <NSelect reg={register('toWarehouse')}>
                <option value="">Select warehouse</option>
                {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
              </NSelect>
            </Field>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="QUANTITY *">
              <NInput reg={register('quantity', { required: true, valueAsNumber: true })} type="number" min="1" placeholder="0" />
            </Field>
            <Field label="REASON / REFERENCE">
              <NInput reg={register('reason')} placeholder="e.g. PO-00001" />
            </Field>
          </div>
          <FormFooter onCancel={() => setModal(false)} submitLabel="Record Movement" />
        </form>
      </Modal>
    </div>
  );
};

// ── SUPPLIERS TAB ─────────────────────────────────────────────────────────────
const SuppliersTab = () => {
  const dispatch = useDispatch();
  const { suppliers } = useSelector(s => s.inventory);
  const [modal, setModal] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { dispatch(fetchSuppliers()); }, [dispatch]);

  const onSubmit = async (data) => {
    const res = await dispatch(createSupplier(data));
    if (res.meta.requestStatus === 'fulfilled') { toast.success('Supplier added!'); setModal(false); reset(); }
    else toast.error(res.payload || 'Error');
  };

  const ACCENT_COLORS = ['#FFD966','#0EA5E9','#16A34A','#FF6B35','#8B5CF6','#EC4899'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <PrimaryBtn onClick={() => setModal(true)}>+ Add Supplier</PrimaryBtn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {suppliers.length === 0 ? (
          <div style={{ gridColumn: '1/-1', ...S.card, padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.15 }}>🤝</div>
            <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: '#CCC' }}>No suppliers yet.</p>
          </div>
        ) : suppliers.map((s, i) => (
          <div key={s._id} style={{ ...S.card, padding: 22, transition: 'transform 0.2s, box-shadow 0.2s', position: 'relative', overflow: 'hidden' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: ACCENT_COLORS[i % ACCENT_COLORS.length] }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, background: ACCENT_COLORS[i % ACCENT_COLORS.length], borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Syne', fontWeight: 800, fontSize: 16, color: '#0A0A0A', flexShrink: 0 }}>
                {s.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 14, color: '#0A0A0A' }}>{s.name}</p>
                <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#888' }}>{s.contactPerson}</p>
              </div>
            </div>
            {[['📧', s.email], ['📱', s.phone], ['💳', s.paymentTerms]].filter(([,v]) => v).map(([icon, val]) => (
              <div key={val} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12 }}>{icon}</span>
                <span style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#666' }}>{val}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add Supplier">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="COMPANY NAME *" error={errors.name?.message}>
                <NInput reg={register('name', { required: 'Name required' })} placeholder="Supplier Co." />
              </Field>
            </div>
            <Field label="CONTACT PERSON"><NInput reg={register('contactPerson')} placeholder="John Doe" /></Field>
            <Field label="EMAIL"><NInput reg={register('email')} type="email" placeholder="email@supplier.com" /></Field>
            <Field label="PHONE"><NInput reg={register('phone')} placeholder="+91 XXXXX XXXXX" /></Field>
            <Field label="PAYMENT TERMS"><NInput reg={register('paymentTerms')} placeholder="Net 30" /></Field>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="ADDRESS"><NInput reg={register('address')} placeholder="Full address" /></Field>
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <FormFooter onCancel={() => setModal(false)} submitLabel="Add Supplier" />
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ── PURCHASE ORDERS TAB ───────────────────────────────────────────────────────
const PurchaseOrdersTab = () => {
  const dispatch = useDispatch();
  const { purchaseOrders, suppliers, warehouses, products } = useSelector(s => s.inventory);
  const [modal, setModal] = useState(false);
  const [items, setItems] = useState([{ product: '', quantity: 1, unitPrice: 0 }]);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    dispatch(fetchPurchaseOrders()); dispatch(fetchSuppliers());
    dispatch(fetchWarehouses());     dispatch(fetchProducts());
  }, [dispatch]);

  const addItem    = () => setItems([...items, { product: '', quantity: 1, unitPrice: 0 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => { const u = [...items]; u[i] = { ...u[i], [field]: val }; setItems(u); };

  const onSubmit = async (data) => {
    const processedItems = items.map(item => ({ ...item, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice) }));
    const res = await dispatch(createPurchaseOrder({ ...data, items: processedItems }));
    if (res.meta.requestStatus === 'fulfilled') { toast.success('PO created!'); setModal(false); reset(); setItems([{ product: '', quantity: 1, unitPrice: 0 }]); }
    else toast.error(res.payload || 'Error');
  };

  const handleReceive = async (id) => {
    const res = await dispatch(receivePurchaseOrder(id));
    if (res.meta.requestStatus === 'fulfilled') { toast.success('PO received! Stock updated.'); dispatch(fetchPurchaseOrders()); }
    else toast.error(res.payload || 'Error');
  };

  const STATUS_STYLE = {
    ordered:   { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
    received:  { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
    pending:   { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
    cancelled: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <PrimaryBtn onClick={() => setModal(true)}>+ Create PO</PrimaryBtn>
      </div>

      <div style={S.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['PO Number','Supplier','Warehouse','Items','Total Amount','Status','Action'].map(h => (
              <th key={h} style={S.th}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {purchaseOrders.length === 0 ? (
              <EmptyRow cols={7} message="No purchase orders yet. Create your first PO!" />
            ) : purchaseOrders.map((po, i) => {
              const st = STATUS_STYLE[po.status] || STATUS_STYLE.pending;
              return (
                <tr key={po._id} style={{ background: i % 2 === 0 ? 'white' : '#FAFAF8' }}>
                  <td style={S.td}>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#0EA5E9', background: '#F0F9FF', padding: '3px 8px', borderRadius: 6, border: '1px solid #BAE6FD' }}>{po.poNumber}</span>
                  </td>
                  <td style={{ ...S.td, fontFamily: 'Syne', fontWeight: 700, color: '#0A0A0A' }}>{po.supplier?.name}</td>
                  <td style={{ ...S.td, color: '#666' }}>{po.warehouse?.name}</td>
                  <td style={{ ...S.td, color: '#888' }}>{po.items?.length} items</td>
                  <td style={{ ...S.td, fontFamily: 'Syne', fontWeight: 700, color: '#0A0A0A' }}>₹{po.totalAmount?.toLocaleString()}</td>
                  <td style={S.td}>
                    <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 10, letterSpacing: '0.06em',
                      padding: '4px 10px', borderRadius: 100, background: st.bg, color: st.color, border: `1.5px solid ${st.border}` }}>
                      {po.status?.toUpperCase()}
                    </span>
                  </td>
                  <td style={S.td}>
                    {po.status === 'ordered' && (
                      <button onClick={() => handleReceive(po._id)} style={{
                        fontFamily: 'Syne', fontWeight: 700, fontSize: 11,
                        background: '#F0FDF4', color: '#16A34A', border: '1.5px solid #BBF7D0',
                        padding: '5px 12px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#16A34A'; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#F0FDF4'; e.currentTarget.style.color = '#16A34A'; }}
                      >✓ Received</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Create Purchase Order" size="xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <Field label="SUPPLIER *" error={errors.supplier?.message}>
              <NSelect reg={register('supplier', { required: true })}>
                <option value="">Select supplier</option>
                {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </NSelect>
            </Field>
            <Field label="DELIVER TO WAREHOUSE *" error={errors.warehouse?.message}>
              <NSelect reg={register('warehouse', { required: true })}>
                <option value="">Select warehouse</option>
                {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
              </NSelect>
            </Field>
          </div>

          {/* Order Items */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label style={S.label}>ORDER ITEMS</label>
              <button type="button" onClick={addItem} style={{
                fontFamily: 'Syne', fontWeight: 700, fontSize: 11, color: '#0A0A0A',
                background: '#FFD966', border: 'none', padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
              }}>+ Add Item</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '5fr 2fr 2fr 1fr', gap: 8, alignItems: 'center' }}>
                  <select value={item.product} onChange={e => updateItem(i,'product',e.target.value)} style={S.select}>
                    <option value="">Select product</option>
                    {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                  <input type="number" value={item.quantity} onChange={e => updateItem(i,'quantity',e.target.value)}
                    style={S.input} placeholder="Qty" min="1"
                    onFocus={e => { e.target.style.borderColor = '#0A0A0A'; }} onBlur={e => { e.target.style.borderColor = '#E8E8E3'; }} />
                  <input type="number" value={item.unitPrice} onChange={e => updateItem(i,'unitPrice',e.target.value)}
                    style={S.input} placeholder="Unit Price"
                    onFocus={e => { e.target.style.borderColor = '#0A0A0A'; }} onBlur={e => { e.target.style.borderColor = '#E8E8E3'; }} />
                  <div style={{ textAlign: 'center' }}>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} style={{
                        width: 28, height: 28, background: '#FEF2F2', border: '1.5px solid #FECACA',
                        borderRadius: 8, cursor: 'pointer', color: '#DC2626', fontWeight: 700, fontSize: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>×</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Field label="NOTES">
            <NTextarea reg={register('notes')} rows={2} placeholder="Optional notes" />
          </Field>
          <div style={{ marginTop: 16 }}>
            <FormFooter onCancel={() => setModal(false)} submitLabel="Create PO" />
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ── MAIN INVENTORY PAGE ───────────────────────────────────────────────────────
const TABS = [
  { key: 'Products',        icon: '📦' },
  { key: 'Warehouses',      icon: '🏭' },
  { key: 'Stock',           icon: '📊' },
  { key: 'Suppliers',       icon: '🤝' },
  { key: 'Purchase Orders', icon: '🧾' },
];

const Inventory = () => {
  const dispatch = useDispatch();
  const { stats } = useSelector(s => s.inventory);
  const [tab, setTab] = useState('Products');

  useEffect(() => { dispatch(fetchInventoryStats()); }, [dispatch]);

  return (
    <div style={{ fontFamily: "'Syne', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .inv-fadein { animation: fadeUp 0.4s ease both; }
      `}</style>

      {/* Page Header */}
      <div className="inv-fadein" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 26, letterSpacing: '-0.025em', color: '#0A0A0A', marginBottom: 4 }}>
              📦 Inventory & Warehouse
            </h1>
            <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: '#AAA' }}>Manage products, stock, warehouses and suppliers</p>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFF8E7', border: '1.5px solid #FFD966', borderRadius: 100, padding: '6px 14px' }}>
            <div style={{ width: 7, height: 7, background: '#16A34A', borderRadius: '50%' }}></div>
            <span style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 600, color: '#92600A' }}>Live Inventory</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="inv-fadein" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28, animationDelay: '0.05s' }}>
        <KPICard icon="📦" label="Total Products"   value={stats?.totalProducts}  accent="#0EA5E9" />
        <KPICard icon="🏭" label="Warehouses"        value={stats?.totalWarehouses} accent="#8B5CF6" />
        <KPICard icon="💰" label="Stock Value"       accent="#16A34A"
          value={stats?.totalValue ? `₹${Math.round(stats.totalValue).toLocaleString()}` : '—'} />
        <KPICard icon="⚠️" label="Low Stock Items"   value={stats?.lowStockCount}  accent="#DC2626" />
      </div>

      {/* Tabs */}
      <div className="inv-fadein" style={{ display: 'flex', gap: 4, background: '#F4F4F0', padding: 6, borderRadius: 14, marginBottom: 24, animationDelay: '0.1s', overflowX: 'auto' }}>
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

      {/* Tab Content */}
      <div className="inv-fadein" style={{ animationDelay: '0.15s' }}>
        {tab === 'Products'        && <ProductsTab />}
        {tab === 'Warehouses'      && <WarehousesTab />}
        {tab === 'Stock'           && <StockTab />}
        {tab === 'Suppliers'       && <SuppliersTab />}
        {tab === 'Purchase Orders' && <PurchaseOrdersTab />}
      </div>
    </div>
  );
};

export default Inventory;