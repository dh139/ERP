const Customer   = require('./customer.model');
const Lead       = require('./lead.model');
const SalesOrder = require('./salesOrder.model');
const Stock      = require('../inventory/stock.model');

// ─── CUSTOMERS ──────────────────────────────────────────
exports.getCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };
    if (search) query.$text = { $search: search };
    const total     = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .skip((page - 1) * limit).limit(Number(limit)).sort({ createdAt: -1 });
    res.json({ success: true, total, customers });
  } catch (err) { next(err); }
};

exports.getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    const orders = await SalesOrder.find({ customer: req.params.id })
      .populate('items.product', 'name').sort({ createdAt: -1 }).limit(10);
    res.json({ success: true, customer, orders });
  } catch (err) { next(err); }
};

exports.createCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({ success: true, customer });
  } catch (err) { next(err); }
};

exports.updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, customer });
  } catch (err) { next(err); }
};

// ─── LEADS ──────────────────────────────────────────────
exports.getLeads = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const leads = await Lead.find(query)
      .populate('assignedTo', 'name').sort({ createdAt: -1 });
    res.json({ success: true, leads });
  } catch (err) { next(err); }
};

exports.createLead = async (req, res, next) => {
  try {
    const lead = await Lead.create({ ...req.body, assignedTo: req.user._id });
    res.status(201).json({ success: true, lead });
  } catch (err) { next(err); }
};

exports.updateLead = async (req, res, next) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, lead });
  } catch (err) { next(err); }
};

exports.convertLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    const customer = await Customer.create({
      name: lead.name, email: lead.email,
      phone: lead.phone, company: lead.company,
    });
    lead.status = 'converted';
    await lead.save();
    res.json({ success: true, message: 'Lead converted to customer', customer });
  } catch (err) { next(err); }
};

// ─── SALES ORDERS ───────────────────────────────────────
exports.getSalesOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const total  = await SalesOrder.countDocuments(query);
    const orders = await SalesOrder.find(query)
      .populate('customer', 'name email phone')
      .populate('items.product', 'name sku')
      .populate('assignedTo', 'name')
      .skip((page - 1) * limit).limit(Number(limit))
      .sort({ createdAt: -1 });
    res.json({ success: true, total, orders });
  } catch (err) { next(err); }
};

exports.getSalesOrder = async (req, res, next) => {
  try {
    const order = await SalesOrder.findById(req.params.id)
      .populate('customer', 'name email phone address')
      .populate('items.product', 'name sku sellingPrice')
      .populate('assignedTo', 'name');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) { next(err); }
};

exports.createSalesOrder = async (req, res, next) => {
  try {
    const { items, taxRate = 0 } = req.body;

    // Check stock availability
    if (req.body.warehouse) {
      for (const item of items) {
        if (item.product) {
          const stock = await Stock.findOne({ product: item.product, warehouse: req.body.warehouse });
          if (!stock || stock.quantity < item.quantity) {
            return res.status(400).json({ message: `Insufficient stock for item: ${item.name}` });
          }
        }
      }
    }

    // Calculate totals
    let subtotal = 0;
    const processedItems = items.map(item => {
      const total = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
      subtotal += total;
      return { ...item, total };
    });

    const taxAmount    = subtotal * (taxRate / 100);
    const totalAmount  = subtotal + taxAmount;

    const order = await SalesOrder.create({
      ...req.body,
      items: processedItems,
      subtotal, taxAmount, totalAmount,
      assignedTo: req.user._id,
    });

    // Update customer stats
    await Customer.findByIdAndUpdate(req.body.customer, {
      $inc: { totalOrders: 1, totalSpent: totalAmount }
    });

    res.status(201).json({ success: true, order });
  } catch (err) { next(err); }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await SalesOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // When order is shipped — deduct stock
    if (status === 'shipped' && order.status !== 'shipped' && order.warehouse) {
      for (const item of order.items) {
        if (item.product) {
          const stock = await Stock.findOne({ product: item.product, warehouse: order.warehouse });
          if (stock) {
            stock.quantity = Math.max(0, stock.quantity - item.quantity);
            await stock.save();
          }
        }
      }
    }

    order.status = status;
    await order.save();
    res.json({ success: true, order });
  } catch (err) { next(err); }
};

// ─── CRM STATS ──────────────────────────────────────────
exports.getCRMStats = async (req, res, next) => {
  try {
    const totalCustomers = await Customer.countDocuments({ isActive: true });
    const totalLeads     = await Lead.countDocuments();
    const openLeads      = await Lead.countDocuments({ status: { $in: ['new','contacted','qualified'] } });
    const totalOrders    = await SalesOrder.countDocuments();
    const pendingOrders  = await SalesOrder.countDocuments({ status: 'pending' });

    const revenueData = await SalesOrder.aggregate([
      { $match: { status: { $in: ['delivered','shipped'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueData[0]?.total || 0;

    res.json({ success: true, stats: { totalCustomers, totalLeads, openLeads, totalOrders, pendingOrders, totalRevenue } });
  } catch (err) { next(err); }
};