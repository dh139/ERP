const Product       = require('./product.model');
const Warehouse     = require('./warehouse.model');
const Stock         = require('./stock.model');
const StockMovement = require('./stockMovement.model');
const Supplier      = require('./supplier.model');
const PurchaseOrder = require('./purchaseOrder.model');

// ─── PRODUCTS ───────────────────────────────────────────
exports.getProducts = async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };
    if (search)   query.$text = { $search: search };
    if (category) query.category = category;

    const total    = await Product.countDocuments(query);
    const products = await Product.find(query)
      .skip((page - 1) * limit).limit(Number(limit)).sort({ createdAt: -1 });

    res.json({ success: true, total, page: Number(page), products });
  } catch (err) { next(err); }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) { next(err); }
};

exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (err) { next(err); }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) { next(err); }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Product deactivated' });
  } catch (err) { next(err); }
};

// ─── WAREHOUSES ─────────────────────────────────────────
exports.getWarehouses = async (req, res, next) => {
  try {
    const warehouses = await Warehouse.find({ isActive: true }).populate('manager', 'name email');
    res.json({ success: true, warehouses });
  } catch (err) { next(err); }
};

exports.createWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.create(req.body);
    res.status(201).json({ success: true, warehouse });
  } catch (err) { next(err); }
};

exports.updateWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, warehouse });
  } catch (err) { next(err); }
};

// ─── STOCK ──────────────────────────────────────────────
exports.getStock = async (req, res, next) => {
  try {
    const { warehouse } = req.query;
    const query = warehouse ? { warehouse } : {};
    const stock = await Stock.find(query)
      .populate('product', 'name sku sellingPrice category')
      .populate('warehouse', 'name location');
    res.json({ success: true, stock });
  } catch (err) { next(err); }
};

exports.getLowStock = async (req, res, next) => {
  try {
    const allStock = await Stock.find()
      .populate('product', 'name sku')
      .populate('warehouse', 'name');
    const low = allStock.filter(s => s.quantity <= s.reorderLevel);
    res.json({ success: true, count: low.length, stock: low });
  } catch (err) { next(err); }
};

// ─── STOCK MOVEMENT ─────────────────────────────────────
exports.recordMovement = async (req, res, next) => {
  try {
    const { product, type, quantity, fromWarehouse, toWarehouse, reason, reference } = req.body;

    // Stock OUT
    if (type === 'out' || type === 'transfer') {
      const stockFrom = await Stock.findOne({ product, warehouse: fromWarehouse });
      if (!stockFrom || stockFrom.quantity < quantity) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
      stockFrom.quantity -= quantity;
      await stockFrom.save();
    }

    // Stock IN
    if (type === 'in' || type === 'transfer') {
      const targetWarehouse = type === 'transfer' ? toWarehouse : fromWarehouse;
      let stockTo = await Stock.findOne({ product, warehouse: targetWarehouse });
      if (!stockTo) {
        stockTo = new Stock({ product, warehouse: targetWarehouse, quantity: 0 });
      }
      stockTo.quantity += quantity;
      await stockTo.save();
    }

    // Adjustment
    if (type === 'adjustment') {
      let stock = await Stock.findOne({ product, warehouse: fromWarehouse });
      if (!stock) stock = new Stock({ product, warehouse: fromWarehouse, quantity: 0 });
      stock.quantity = quantity;
      await stock.save();
    }

    const movement = await StockMovement.create({
      product, type, quantity, fromWarehouse, toWarehouse,
      reason, reference, performedBy: req.user._id
    });

    res.status(201).json({ success: true, movement });
  } catch (err) { next(err); }
};

exports.getMovements = async (req, res, next) => {
  try {
    const movements = await StockMovement.find()
      .populate('product', 'name sku')
      .populate('fromWarehouse', 'name')
      .populate('toWarehouse', 'name')
      .populate('performedBy', 'name')
      .sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, movements });
  } catch (err) { next(err); }
};

// ─── SUPPLIERS ──────────────────────────────────────────
exports.getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find({ isActive: true });
    res.json({ success: true, suppliers });
  } catch (err) { next(err); }
};

exports.createSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, supplier });
  } catch (err) { next(err); }
};

exports.updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, supplier });
  } catch (err) { next(err); }
};

// ─── PURCHASE ORDERS ────────────────────────────────────
exports.getPurchaseOrders = async (req, res, next) => {
  try {
    const orders = await PurchaseOrder.find()
      .populate('supplier', 'name email')
      .populate('warehouse', 'name')
      .populate('items.product', 'name sku')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) { next(err); }
};

exports.createPurchaseOrder = async (req, res, next) => {
  try {
    const { items } = req.body;
    const totalAmount = items.reduce((sum, item) => {
      item.total = item.quantity * item.unitPrice;
      return sum + item.total;
    }, 0);
    const po = await PurchaseOrder.create({ ...req.body, totalAmount, orderedBy: req.user._id });
    res.status(201).json({ success: true, po });
  } catch (err) { next(err); }
};

exports.receivePurchaseOrder = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ message: 'PO not found' });
    if (po.status === 'received') return res.status(400).json({ message: 'Already received' });

    // Auto-increment stock for each item
    for (const item of po.items) {
      let stock = await Stock.findOne({ product: item.product, warehouse: po.warehouse });
      if (!stock) stock = new Stock({ product: item.product, warehouse: po.warehouse, quantity: 0 });
      stock.quantity += item.quantity;
      await stock.save();

      await StockMovement.create({
        product: item.product, type: 'in', quantity: item.quantity,
        fromWarehouse: po.warehouse, reference: po.poNumber, performedBy: req.user._id
      });
    }

    po.status = 'received';
    po.receivedAt = new Date();
    await po.save();

    res.json({ success: true, message: 'PO received and stock updated', po });
  } catch (err) { next(err); }
};

// ─── DASHBOARD STATS ────────────────────────────────────
exports.getInventoryStats = async (req, res, next) => {
  try {
    const totalProducts  = await Product.countDocuments({ isActive: true });
    const totalWarehouses= await Warehouse.countDocuments({ isActive: true });
    const allStock       = await Stock.find().populate('product', 'costPrice');
    const totalValue     = allStock.reduce((sum, s) => sum + (s.quantity * (s.product?.costPrice || 0)), 0);
    const lowStockCount  = allStock.filter(s => s.quantity <= s.reorderLevel).length;

    res.json({ success: true, stats: { totalProducts, totalWarehouses, totalValue, lowStockCount } });
  } catch (err) { next(err); }
};