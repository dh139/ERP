const Invoice    = require('../accounting/invoice.model');
const Expense    = require('../accounting/expense.model');
const SalesOrder = require('../crm/salesOrder.model');
const Customer   = require('../crm/customer.model');
const Lead       = require('../crm/lead.model');
const Product    = require('../inventory/product.model');
const Stock      = require('../inventory/stock.model');
const Employee   = require('../hr/employee.model');
const Payroll    = require('../hr/payroll.model');

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Main Stats ────────────────────────────────────────────
exports.getDashboardStats = async (req, res, next) => {
  try {
    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // ── Accounting ──
    const revenueData = await Invoice.aggregate([
      { $match: { status: { $in: ['paid','partial'] } } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } }
    ]);
    const monthRevenueData = await Invoice.aggregate([
      { $match: { status: { $in: ['paid','partial'] }, updatedAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } }
    ]);
    const lastMonthRevenueData = await Invoice.aggregate([
      { $match: { status: { $in: ['paid','partial'] }, updatedAt: { $gte: lastMonth, $lte: lastMonthEnd } } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } }
    ]);
    const expenseData = await Expense.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const overdueCount    = await Invoice.countDocuments({ status: 'overdue' });
    const pendingExpenses = await Expense.countDocuments({ status: 'pending' });

    // ── CRM ──
    const totalCustomers  = await Customer.countDocuments({ isActive: true });
    const totalLeads      = await Lead.countDocuments({ status: { $in: ['new','contacted','qualified'] } });
    const totalOrders     = await SalesOrder.countDocuments();
    const monthOrders     = await SalesOrder.countDocuments({ createdAt: { $gte: monthStart } });
    const salesData = await SalesOrder.aggregate([
      { $match: { status: { $nin: ['cancelled'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const pendingOrders = await SalesOrder.countDocuments({ status: { $in: ['confirmed','processing'] } });

    // ── Inventory ──
    const totalProducts  = await Product.countDocuments({ isActive: true });
    const allStock       = await Stock.find().populate('product');
    const lowStockCount  = allStock.filter(s => s.quantity <= s.reorderLevel).length;
    const totalStockVal  = allStock.reduce((s, st) => s + (st.quantity * (st.product?.costPrice || 0)), 0);

    // ── HR ──
    const totalEmployees = await Employee.countDocuments({ isActive: true });
    const payrollData    = await Payroll.aggregate([
      { $match: { month: now.getMonth() + 1, year: now.getFullYear() } },
      { $group: { _id: null, total: { $sum: '$netSalary' } } }
    ]);

    const totalRevenue    = revenueData[0]?.total        || 0;
    const monthRevenue    = monthRevenueData[0]?.total   || 0;
    const lastMonthRev    = lastMonthRevenueData[0]?.total || 0;
    const revenueGrowth   = lastMonthRev > 0 ? (((monthRevenue - lastMonthRev) / lastMonthRev) * 100).toFixed(1) : 0;
    const totalExpenses   = expenseData[0]?.total        || 0;
    const totalSales      = salesData[0]?.total          || 0;
    const monthlyPayroll  = payrollData[0]?.total        || 0;

    res.json({
      success: true,
      stats: {
        accounting: { totalRevenue, monthRevenue, revenueGrowth, totalExpenses, netProfit: totalRevenue - totalExpenses, overdueCount, pendingExpenses },
        crm:        { totalCustomers, totalLeads, totalOrders, monthOrders, totalSales, pendingOrders },
        inventory:  { totalProducts, lowStockCount, totalStockVal },
        hr:         { totalEmployees, monthlyPayroll },
      }
    });
  } catch (err) { next(err); }
};

// ── Revenue vs Expenses Chart (last 6 months) ─────────────
exports.getRevenueChart = async (req, res, next) => {
  try {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ month: d.getMonth() + 1, year: d.getFullYear(), label: MONTHS[d.getMonth()] });
    }

    const data = await Promise.all(months.map(async ({ month, year, label }) => {
      const start = new Date(year, month - 1, 1);
      const end   = new Date(year, month, 0, 23, 59, 59);

      const rev = await Invoice.aggregate([
        { $match: { status: { $in: ['paid','partial'] }, updatedAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } }
      ]);
      const exp = await Expense.aggregate([
        { $match: { status: 'approved', date: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      return {
        month: label,
        revenue:  rev[0]?.total || 0,
        expenses: exp[0]?.total || 0,
        profit:   (rev[0]?.total || 0) - (exp[0]?.total || 0),
      };
    }));

    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// ── Sales Orders Trend (last 6 months) ───────────────────
exports.getSalesTrend = async (req, res, next) => {
  try {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ month: d.getMonth() + 1, year: d.getFullYear(), label: MONTHS[d.getMonth()] });
    }

    const data = await Promise.all(months.map(async ({ month, year, label }) => {
      const start = new Date(year, month - 1, 1);
      const end   = new Date(year, month, 0, 23, 59, 59);

      const result = await SalesOrder.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, count: { $sum: 1 }, value: { $sum: '$totalAmount' } } }
      ]);

      return {
        month:  label,
        orders: result[0]?.count || 0,
        value:  result[0]?.value || 0,
      };
    }));

    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// ── Top Selling Products ──────────────────────────────────
exports.getTopProducts = async (req, res, next) => {
  try {
    const result = await SalesOrder.aggregate([
      { $match: { status: { $nin: ['cancelled'] } } },
      { $unwind: '$items' },
      { $group: {
        _id:      '$items.product',
        name:     { $first: '$items.productName' },
        quantity: { $sum: '$items.quantity' },
        revenue:  { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } },
      }},
      { $sort: { quantity: -1 } },
      { $limit: 7 },
    ]);

    const data = result.map((r, i) => ({
      name:     r.name || `Product ${i+1}`,
      quantity: r.quantity,
      revenue:  r.revenue,
    }));

    res.json({ success: true, data });
  } catch (err) { next(err); }
};