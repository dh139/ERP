import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  fetchInventoryStats, fetchProducts, createProduct, updateProduct,
  fetchWarehouses, createWarehouse, fetchStock, recordMovement,
  fetchSuppliers, createSupplier, fetchPurchaseOrders,
  createPurchaseOrder, receivePurchaseOrder,
  fetchLowStock
} from '../../features/inventory/inventorySlice';
import Modal    from '../../components/UI/Modal';
import StatCard from '../../components/UI/StatCard';
import Badge    from '../../components/UI/Badge';
import SearchBar from '../../components/UI/SearchBar';
import { useForm } from 'react-hook-form';
import { exportProducts, exportStock } from '../../utils/exportExcel';
// ── Input helper ──────────────────────────────────────────────────────────────
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

// ── Products Tab ──────────────────────────────────────────────────────────────
const ProductsTab = () => {
  const dispatch = useDispatch();
  const { products, loading } = useSelector(s => s.inventory);
  const [modal, setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch]  = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { dispatch(fetchProducts()); }, [dispatch]);

  const openAdd  = () => { setEditing(null); reset({}); setModal(true); };
  const openEdit = (p) => { setEditing(p); reset(p); setModal(true); };

  const onSubmit = async (data) => {
    const action = editing
      ? updateProduct({ id: editing._id, payload: data })
      : createProduct(data);
    const res = await dispatch(action);
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success(editing ? 'Product updated!' : 'Product created!');
      setModal(false);
    } else toast.error(res.payload || 'Error');
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name or SKU..." />
        <button onClick={openAdd}
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex-shrink-0">
          + Add Product
        </button>
        <button onClick={() => exportProducts(products)}
  className="ml-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
  ⬇ Excel
</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['SKU','Name','Category','Cost','Selling Price','Tax','Status',''].map(h=>(
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">No products found. Add your first product!</td></tr>
            ) : filtered.map(p => (
              <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-blue-600">{p.sku}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                <td className="px-4 py-3 text-gray-500">{p.category}</td>
                <td className="px-4 py-3">₹{p.costPrice?.toLocaleString()}</td>
                <td className="px-4 py-3 font-semibold text-green-600">₹{p.sellingPrice?.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-500">{p.taxRate}%</td>
                <td className="px-4 py-3"><Badge status={p.isActive ? 'active' : 'inactive'} /></td>
                <td className="px-4 py-3">
                  <button onClick={() => openEdit(p)} className="text-blue-600 hover:underline text-xs">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Product' : 'Add New Product'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
          <Field label="SKU *" error={errors.sku?.message}>
            <Input reg={register('sku', { required: 'SKU required' })} placeholder="e.g. PROD-001" />
          </Field>
          <Field label="Product Name *" error={errors.name?.message}>
            <Input reg={register('name', { required: 'Name required' })} placeholder="Product name" />
          </Field>
          <Field label="Category *" error={errors.category?.message}>
            <Input reg={register('category', { required: 'Category required' })} placeholder="e.g. Electronics" />
          </Field>
          <Field label="Brand">
            <Input reg={register('brand')} placeholder="Brand name" />
          </Field>
          <Field label="Cost Price *" error={errors.costPrice?.message}>
            <Input reg={register('costPrice', { required: true, valueAsNumber: true })} type="number" placeholder="0" />
          </Field>
          <Field label="Selling Price *" error={errors.sellingPrice?.message}>
            <Input reg={register('sellingPrice', { required: true, valueAsNumber: true })} type="number" placeholder="0" />
          </Field>
          <Field label="Tax Rate (%)">
            <Input reg={register('taxRate', { valueAsNumber: true })} type="number" placeholder="0" defaultValue={0} />
          </Field>
          <Field label="Unit">
            <Input reg={register('unit')} placeholder="pcs / kg / ltr" />
          </Field>
          <div className="col-span-2">
            <Field label="Description">
              <textarea {...register('description')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2} placeholder="Optional description" />
            </Field>
          </div>
          <div className="col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              {editing ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ── Warehouse Tab ─────────────────────────────────────────────────────────────
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
      <div className="flex justify-end mb-4">
        <button onClick={() => setModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + Add Warehouse
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {warehouses.length === 0 ? (
          <div className="col-span-3 text-center py-10 text-gray-400 bg-white rounded-xl border border-gray-100">
            No warehouses yet. Add your first warehouse!
          </div>
        ) : warehouses.map(w => (
          <div key={w._id} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🏭</span>
              <div>
                <p className="font-semibold text-gray-800">{w.name}</p>
                <p className="text-xs text-gray-500">{w.location}</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              <p>Capacity: {w.capacity || 'Not set'}</p>
              <p>Manager: {w.manager?.name || 'Not assigned'}</p>
            </div>
          </div>
        ))}
      </div>
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add Warehouse">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Warehouse Name *" error={errors.name?.message}>
            <Input reg={register('name', { required: 'Name required' })} placeholder="Main Warehouse" />
          </Field>
          <Field label="Location *" error={errors.location?.message}>
            <Input reg={register('location', { required: 'Location required' })} placeholder="City, State" />
          </Field>
          <Field label="Capacity (units)">
            <Input reg={register('capacity', { valueAsNumber: true })} type="number" placeholder="1000" />
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

// ── Stock Tab ─────────────────────────────────────────────────────────────────
const StockTab = () => {
  const dispatch = useDispatch();
  const { stock, warehouses, products, lowStock } = useSelector(s => s.inventory);
  const [modal, setModal]   = useState(false);
  const [filterWH, setFilterWH] = useState('');
  const { register, handleSubmit, reset, watch } = useForm();
  const movType = watch('type');

  useEffect(() => {
    dispatch(fetchStock());
    dispatch(fetchWarehouses());
    dispatch(fetchLowStock());
  }, [dispatch]);

  const onSubmit = async (data) => {
    const res = await dispatch(recordMovement(data));
    if (res.meta.requestStatus === 'fulfilled') { toast.success('Stock movement recorded!'); setModal(false); reset(); dispatch(fetchStock()); }
    else toast.error(res.payload || 'Error');
  };

  const filtered = filterWH ? stock.filter(s => s.warehouse?._id === filterWH) : stock;

  return (
    <div>
      {lowStock?.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <span>⚠️</span>
          <span className="text-sm text-red-700 font-medium">{lowStock.length} item(s) are below reorder level!</span>
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <select value={filterWH} onChange={e => setFilterWH(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none bg-white">
          <option value="">All Warehouses</option>
          {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
        </select>
        <button onClick={() => setModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + Record Movement
        </button>
        <button onClick={() => exportStock(stock)}
  className="ml-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
  ⬇ Excel
</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Product','SKU','Warehouse','Quantity','Reorder Level','Status'].map(h=>(
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">No stock records found.</td></tr>
            ) : filtered.map(s => (
              <tr key={s._id} className={`border-b border-gray-50 hover:bg-gray-50 ${s.quantity <= s.reorderLevel ? 'bg-red-50' : ''}`}>
                <td className="px-4 py-3 font-medium text-gray-800">{s.product?.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-blue-600">{s.product?.sku}</td>
                <td className="px-4 py-3 text-gray-500">{s.warehouse?.name}</td>
                <td className="px-4 py-3 font-bold text-gray-800">{s.quantity}</td>
                <td className="px-4 py-3 text-gray-500">{s.reorderLevel}</td>
                <td className="px-4 py-3">
                  {s.quantity <= s.reorderLevel
                    ? <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">Low Stock</span>
                    : <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">OK</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Record Stock Movement">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Product *">
            <Select reg={register('product', { required: true })}>
              <option value="">Select product</option>
              {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
            </Select>
          </Field>
          <Field label="Movement Type *">
            <Select reg={register('type', { required: true })}>
              <option value="">Select type</option>
              <option value="in">Stock IN (Receiving)</option>
              <option value="out">Stock OUT (Issue)</option>
              <option value="adjustment">Adjustment (Set quantity)</option>
              <option value="transfer">Transfer Between Warehouses</option>
            </Select>
          </Field>
          <Field label={movType === 'transfer' ? 'From Warehouse *' : 'Warehouse *'}>
            <Select reg={register('fromWarehouse', { required: true })}>
              <option value="">Select warehouse</option>
              {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
            </Select>
          </Field>
          {movType === 'transfer' && (
            <Field label="To Warehouse *">
              <Select reg={register('toWarehouse')}>
                <option value="">Select warehouse</option>
                {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
              </Select>
            </Field>
          )}
          <Field label="Quantity *">
            <Input reg={register('quantity', { required: true, valueAsNumber: true })} type="number" min="1" placeholder="0" />
          </Field>
          <Field label="Reason / Reference">
            <Input reg={register('reason')} placeholder="e.g. PO-00001 or Damage" />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
            <button type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Record</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ── Suppliers Tab ─────────────────────────────────────────────────────────────
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

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + Add Supplier
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.length === 0 ? (
          <div className="col-span-3 text-center py-10 text-gray-400 bg-white rounded-xl border">No suppliers yet.</div>
        ) : suppliers.map(s => (
          <div key={s._id} className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="font-bold text-gray-800 mb-1">{s.name}</p>
            <p className="text-sm text-gray-500">{s.contactPerson}</p>
            <p className="text-sm text-gray-500">{s.email}</p>
            <p className="text-sm text-gray-500">{s.phone}</p>
            <p className="text-xs text-blue-600 mt-2">Terms: {s.paymentTerms}</p>
          </div>
        ))}
      </div>
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add Supplier">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Company Name *" error={errors.name?.message}>
              <Input reg={register('name', { required: 'Name required' })} placeholder="Supplier Co." />
            </Field>
          </div>
          <Field label="Contact Person"><Input reg={register('contactPerson')} placeholder="John Doe" /></Field>
          <Field label="Email"><Input reg={register('email')} type="email" placeholder="email@supplier.com" /></Field>
          <Field label="Phone"><Input reg={register('phone')} placeholder="+91 XXXXX XXXXX" /></Field>
          <Field label="Payment Terms"><Input reg={register('paymentTerms')} placeholder="Net 30" /></Field>
          <div className="col-span-2">
            <Field label="Address"><Input reg={register('address')} placeholder="Full address" /></Field>
          </div>
          <div className="col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
            <button type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Add Supplier</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ── Purchase Orders Tab ───────────────────────────────────────────────────────
const PurchaseOrdersTab = () => {
  const dispatch = useDispatch();
  const { purchaseOrders, suppliers, warehouses, products } = useSelector(s => s.inventory);
  const [modal, setModal]  = useState(false);
  const [items, setItems]  = useState([{ product: '', quantity: 1, unitPrice: 0 }]);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    dispatch(fetchPurchaseOrders());
    dispatch(fetchSuppliers());
    dispatch(fetchWarehouses());
    dispatch(fetchProducts());
  }, [dispatch]);

  const addItem    = () => setItems([...items, { product: '', quantity: 1, unitPrice: 0 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: val };
    setItems(updated);
  };

  const onSubmit = async (data) => {
    const processedItems = items.map(item => ({
      ...item, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice)
    }));
    const res = await dispatch(createPurchaseOrder({ ...data, items: processedItems }));
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success('Purchase Order created!'); setModal(false); reset(); setItems([{ product: '', quantity: 1, unitPrice: 0 }]);
    } else toast.error(res.payload || 'Error');
  };

  const handleReceive = async (id) => {
    const res = await dispatch(receivePurchaseOrder(id));
    if (res.meta.requestStatus === 'fulfilled') { toast.success('PO received! Stock updated.'); dispatch(fetchPurchaseOrders()); }
    else toast.error(res.payload || 'Error');
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + Create PO
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['PO Number','Supplier','Warehouse','Items','Total','Status','Action'].map(h=>(
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {purchaseOrders.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">No purchase orders yet.</td></tr>
            ) : purchaseOrders.map(po => (
              <tr key={po._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-blue-600">{po.poNumber}</td>
                <td className="px-4 py-3 font-medium">{po.supplier?.name}</td>
                <td className="px-4 py-3 text-gray-500">{po.warehouse?.name}</td>
                <td className="px-4 py-3 text-gray-500">{po.items?.length} items</td>
                <td className="px-4 py-3 font-semibold">₹{po.totalAmount?.toLocaleString()}</td>
                <td className="px-4 py-3"><Badge status={po.status} /></td>
                <td className="px-4 py-3">
                  {po.status === 'ordered' && (
                    <button onClick={() => handleReceive(po._id)}
                      className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 font-medium">
                      Mark Received
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Create Purchase Order" size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Supplier *" error={errors.supplier?.message}>
              <Select reg={register('supplier', { required: true })}>
                <option value="">Select supplier</option>
                {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </Select>
            </Field>
            <Field label="Deliver to Warehouse *" error={errors.warehouse?.message}>
              <Select reg={register('warehouse', { required: true })}>
                <option value="">Select warehouse</option>
                {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
              </Select>
            </Field>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Order Items</label>
              <button type="button" onClick={addItem}
                className="text-xs text-blue-600 hover:underline">+ Add Item</button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <select value={item.product} onChange={e => updateItem(i,'product',e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                      <option value="">Select product</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input type="number" value={item.quantity} onChange={e => updateItem(i,'quantity',e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Qty" min="1" />
                  </div>
                  <div className="col-span-3">
                    <input type="number" value={item.unitPrice} onChange={e => updateItem(i,'unitPrice',e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Unit Price" />
                  </div>
                  <div className="col-span-1 text-center">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-lg">×</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Field label="Notes">
            <textarea {...register('notes')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" rows={2} placeholder="Optional notes" />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
            <button type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Create PO</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ── Main Inventory Page ───────────────────────────────────────────────────────
const TABS = ['Products','Warehouses','Stock','Suppliers','Purchase Orders'];

const Inventory = () => {
  const dispatch = useDispatch();
  const { stats } = useSelector(s => s.inventory);
  const [tab, setTab] = useState('Products');

  useEffect(() => { dispatch(fetchInventoryStats()); }, [dispatch]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📦 Inventory & Warehouse</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="📦" label="Total Products"   value={stats?.totalProducts}  color="blue" />
        <StatCard icon="🏭" label="Warehouses"        value={stats?.totalWarehouses} color="purple" />
        <StatCard icon="💰" label="Stock Value"       value={stats?.totalValue ? `₹${Math.round(stats.totalValue).toLocaleString()}` : '—'} color="green" />
        <StatCard icon="⚠️" label="Low Stock Items"   value={stats?.lowStockCount}  color="red" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
              ${tab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Products'        && <ProductsTab />}
      {tab === 'Warehouses'      && <WarehousesTab />}
      {tab === 'Stock'           && <StockTab />}
      {tab === 'Suppliers'       && <SuppliersTab />}
      {tab === 'Purchase Orders' && <PurchaseOrdersTab />}
    </div>
  );
};

export default Inventory;