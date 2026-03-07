const Account     = require('./account.model');
const Transaction = require('./transaction.model');
const Invoice     = require('./invoice.model');
const Expense     = require('./expense.model');
const Budget      = require('./budget.model');
const sendEmail = require('../../utils/sendEmail');
const { generateInvoicePDF, generatePLReportPDF, generateBalanceSheetPDF } = require('../../utils/generatePDF')
// ─── SEED DEFAULT ACCOUNTS ───────────────────────────────
exports.seedAccounts = async (req, res, next) => {
  try {
    const defaults = [
      { code: '1001', name: 'Cash',                  type: 'asset' },
      { code: '1002', name: 'Bank Account',           type: 'asset' },
      { code: '1003', name: 'Accounts Receivable',    type: 'asset' },
      { code: '1004', name: 'Inventory Asset',        type: 'asset' },
      { code: '2001', name: 'Accounts Payable',       type: 'liability' },
      { code: '2002', name: 'Tax Payable',            type: 'liability' },
      { code: '2003', name: 'Salary Payable',         type: 'liability' },
      { code: '3001', name: 'Owner Equity',           type: 'equity' },
      { code: '4001', name: 'Sales Revenue',          type: 'revenue' },
      { code: '4002', name: 'Other Income',           type: 'revenue' },
      { code: '5001', name: 'Cost of Goods Sold',     type: 'expense' },
      { code: '5002', name: 'Salary Expense',         type: 'expense' },
      { code: '5003', name: 'Rent Expense',           type: 'expense' },
      { code: '5004', name: 'Marketing Expense',      type: 'expense' },
      { code: '5005', name: 'Utilities Expense',      type: 'expense' },
      { code: '5006', name: 'Miscellaneous Expense',  type: 'expense' },
    ];
    let created = 0;
    for (const acc of defaults) {
      const exists = await Account.findOne({ code: acc.code });
      if (!exists) { await Account.create(acc); created++; }
    }
    res.json({ success: true, message: `${created} accounts seeded` });
  } catch (err) { next(err); }
};

// ─── CHART OF ACCOUNTS ───────────────────────────────────
exports.getAccounts = async (req, res, next) => {
  try {
    const { type } = req.query;
    const query = { isActive: true };
    if (type) query.type = type;
    const accounts = await Account.find(query).sort({ code: 1 });
    res.json({ success: true, accounts });
  } catch (err) { next(err); }
};

exports.createAccount = async (req, res, next) => {
  try {
    const account = await Account.create(req.body);
    res.status(201).json({ success: true, account });
  } catch (err) { next(err); }
};

exports.updateAccount = async (req, res, next) => {
  try {
    const account = await Account.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, account });
  } catch (err) { next(err); }
};

// ─── TRANSACTIONS / JOURNAL ENTRIES ──────────────────────
exports.getTransactions = async (req, res, next) => {
  try {
    const { type, from, to, page = 1, limit = 30 } = req.query;
    const query = {};
    if (type) query.type = type;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to)   query.date.$lte = new Date(to);
    }
    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .populate('entries.account', 'name code type')
      .populate('createdBy', 'name')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, total, transactions });
  } catch (err) { next(err); }
};

exports.createTransaction = async (req, res, next) => {
  try {
    const { entries } = req.body;
    // Validate double-entry: debits must equal credits
    const totalDebits  = entries.reduce((s, e) => s + (Number(e.debit)  || 0), 0);
    const totalCredits = entries.reduce((s, e) => s + (Number(e.credit) || 0), 0);
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return res.status(400).json({ message: `Debits (${totalDebits}) must equal Credits (${totalCredits})` });
    }
    // Update account balances
    for (const entry of entries) {
      const account = await Account.findById(entry.account);
      if (!account) continue;
      if (['asset','expense'].includes(account.type)) {
        account.balance += (Number(entry.debit) || 0) - (Number(entry.credit) || 0);
      } else {
        account.balance += (Number(entry.credit) || 0) - (Number(entry.debit) || 0);
      }
      await account.save();
    }
    const txn = await Transaction.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, transaction: txn });
  } catch (err) { next(err); }
};

// ─── INVOICES ────────────────────────────────────────────
exports.getInvoices = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    // Auto-mark overdue
    await Invoice.updateMany(
      { status: { $in: ['sent','partial'] }, dueDate: { $lt: new Date() } },
      { status: 'overdue' }
    );

    const total    = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate('customer', 'name email phone')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, total, invoices });
  } catch (err) { next(err); }
};

exports.createInvoice = async (req, res, next) => {
  try {
    const { items = [], discount = 0 } = req.body;
    let subtotal = 0;
    let taxAmount = 0;
    const processedItems = items.map(item => {
      const itemTotal = item.quantity * item.unitPrice;
      const itemTax   = itemTotal * ((item.taxRate || 0) / 100);
      subtotal  += itemTotal;
      taxAmount += itemTax;
      return { ...item, total: itemTotal + itemTax };
    });
    const totalAmount = subtotal + taxAmount - discount;
    const balanceDue  = totalAmount;
    const invoice = await Invoice.create({
      ...req.body,
      items: processedItems,
      subtotal, taxAmount, totalAmount, balanceDue,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, invoice });
  } catch (err) { next(err); }
};

exports.recordPayment = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    invoice.amountPaid += Number(amount);
    invoice.balanceDue  = invoice.totalAmount - invoice.amountPaid;

    if (invoice.balanceDue <= 0) {
      invoice.status  = 'paid';
      invoice.paidOn  = new Date();
      invoice.balanceDue = 0;
    } else {
      invoice.status = 'partial';
    }
    await invoice.save();

    // ── Auto-update account balances ──
    // Debit Bank Account (1002), Credit Sales Revenue (4001)
    const bankAccount    = await Account.findOne({ code: '1002' });
    const revenueAccount = await Account.findOne({ code: '4001' });

    if (bankAccount) {
      bankAccount.balance += Number(amount);
      await bankAccount.save();
    }
    if (revenueAccount) {
      revenueAccount.balance += Number(amount);
      await revenueAccount.save();
    }

    res.json({ success: true, invoice });
  } catch (err) { next(err); }
};
exports.updateInvoiceStatus = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id, { status: req.body.status }, { new: true }
    );
    res.json({ success: true, invoice });
  } catch (err) { next(err); }
};

// ─── EXPENSES ────────────────────────────────────────────
exports.getExpenses = async (req, res, next) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status)   query.status   = status;
    if (category) query.category = category;
    const total    = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .populate('paidBy', 'name')
      .populate('approvedBy', 'name')
      .populate('department', 'name')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, total, expenses });
  } catch (err) { next(err); }
};

exports.createExpense = async (req, res, next) => {
  try {
    const expense = await Expense.create({ ...req.body, paidBy: req.user._id });
    res.status(201).json({ success: true, expense });
  } catch (err) { next(err); }
};
exports.updateExpenseStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    // Only update balances when approving for the first time
    if (status === 'approved' && expense.status !== 'approved') {
      // Find the right expense account based on category
      const categoryAccountMap = {
        'Rent':          '5003',
        'Marketing':     '5004',
        'Utilities':     '5005',
        'HR':            '5002',
        'IT':            '5006',
        'Travel':        '5006',
        'Operations':    '5006',
        'Legal':         '5006',
        'Miscellaneous': '5006',
      };

      const accountCode   = categoryAccountMap[expense.category] || '5006';
      const expenseAccount= await Account.findOne({ code: accountCode });
      const bankAccount   = await Account.findOne({ code: '1002' });

      if (expenseAccount) {
        expenseAccount.balance += Number(expense.amount);
        await expenseAccount.save();
      }
      if (bankAccount) {
        bankAccount.balance -= Number(expense.amount);
        await bankAccount.save();
      }
    }

    expense.status     = status;
    expense.approvedBy = req.user._id;
    await expense.save();

    const populated = await Expense.findById(expense._id)
      .populate('paidBy', 'name')
      .populate('department', 'name');

    res.json({ success: true, expense: populated });
  } catch (err) { next(err); }
};
// ─── REPORTS ─────────────────────────────────────────────
exports.getProfitLoss = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const start = new Date(year, 0, 1);
    const end   = new Date(year, 11, 31, 23, 59, 59);

    // Revenue from paid invoices in this year
    const revenueData = await Invoice.aggregate([
      { $match: { status: { $in: ['paid','partial','sent','overdue'] }, createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } }
    ]);

    // Expenses approved in this year grouped by category
    const expenseData = await Expense.aggregate([
      { $match: { status: 'approved', date: { $gte: start, $lte: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);

    const totalRevenue = revenueData[0]?.total || 0;
    const totalExpense = expenseData.reduce((s, e) => s + e.total, 0);
    const netProfit    = totalRevenue - totalExpense;

    // Format expense accounts for display
    const expenseAccounts = expenseData.map(e => ({
      name:    e._id,
      code:    '5000',
      balance: e.total
    }));

    res.json({
      success: true,
      report: {
        year,
        totalRevenue,
        totalExpense,
        netProfit,
        revenueAccounts: [{ name: 'Sales Revenue', code: '4001', balance: totalRevenue }],
        expenseAccounts,
      }
    });
  } catch (err) { next(err); }
};
exports.getBalanceSheet = async (req, res, next) => {
  try {
    const assets      = await Account.find({ type: 'asset',     isActive: true });
    const liabilities = await Account.find({ type: 'liability', isActive: true });
    const equity      = await Account.find({ type: 'equity',    isActive: true });

    const totalAssets      = assets.reduce((s, a)      => s + a.balance, 0);
    const totalLiabilities = liabilities.reduce((s, a) => s + a.balance, 0);
    const totalEquity      = equity.reduce((s, a)      => s + a.balance, 0);

    res.json({
      success: true,
      report: {
        assets:      assets.map(a      => ({ name: a.name, code: a.code, balance: a.balance })),
        liabilities: liabilities.map(a => ({ name: a.name, code: a.code, balance: a.balance })),
        equity:      equity.map(a      => ({ name: a.name, code: a.code, balance: a.balance })),
        totalAssets, totalLiabilities, totalEquity,
      }
    });
  } catch (err) { next(err); }
};
exports.getAccountingStats = async (req, res, next) => {
  try {
    const totalInvoices   = await Invoice.countDocuments();
    const overdueInvoices = await Invoice.countDocuments({ status: 'overdue' });
    const pendingExpenses = await Expense.countDocuments({ status: 'pending' });

    // Revenue = sum of all paid + partial invoices
    const revenueData = await Invoice.aggregate([
      { $match: { status: { $in: ['paid', 'partial', 'sent', 'overdue'] } } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } }
    ]);

    // Expenses = sum of all approved expenses
    const expenseData = await Expense.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Receivable = balance due on unpaid invoices
    const receivableData = await Invoice.aggregate([
      { $match: { status: { $in: ['sent', 'partial', 'overdue'] } } },
      { $group: { _id: null, total: { $sum: '$balanceDue' } } }
    ]);

    const totalRevenue    = revenueData[0]?.total    || 0;
    const totalExpenses   = expenseData[0]?.total    || 0;
    const totalReceivable = receivableData[0]?.total || 0;

    res.json({
      success: true,
      stats: {
        totalInvoices,
        overdueInvoices,
        pendingExpenses,
        totalRevenue,
        totalExpenses,
        totalReceivable,
        netProfit: totalRevenue - totalExpenses,
      }
    });
  } catch (err) { next(err); }
};
exports.downloadInvoicePDF = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('createdBy', 'name');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    const pdfBuffer = await generateInvoicePDF(invoice);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${invoice.invoiceNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (err) { next(err); }
};

exports.emailInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('createdBy', 'name');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (!invoice.customer?.email) return res.status(400).json({ message: 'Customer has no email address' });
    const pdfBuffer = await generateInvoicePDF(invoice);
    await sendEmail({
      to:      invoice.customer.email,
      subject: `Invoice ${invoice.invoiceNumber} from ERP System`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#2563EB;padding:30px;border-radius:8px 8px 0 0">
            <h1 style="color:white;margin:0;font-size:24px">Invoice ${invoice.invoiceNumber}</h1>
          </div>
          <div style="padding:30px;background:#f9fafb;border:1px solid #e5e7eb">
            <p>Dear <strong>${invoice.customer.name}</strong>,</p>
            <p>Please find your invoice attached.</p>
            <table style="width:100%;background:white;border-radius:8px;padding:20px;margin:20px 0">
              <tr><td style="color:#6B7280;padding:8px 0">Invoice #</td><td style="font-weight:bold;text-align:right">${invoice.invoiceNumber}</td></tr>
              <tr><td style="color:#6B7280;padding:8px 0">Amount Due</td><td style="font-weight:bold;color:#DC2626;text-align:right">Rs.${invoice.balanceDue?.toLocaleString()}</td></tr>
              <tr><td style="color:#6B7280;padding:8px 0">Due Date</td><td style="font-weight:bold;text-align:right">${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</td></tr>
            </table>
          </div>
          <div style="background:#e5e7eb;padding:15px;border-radius:0 0 8px 8px;text-align:center">
            <p style="color:#6B7280;font-size:12px;margin:0">Automated email from ERP System</p>
          </div>
        </div>
      `,
      attachments: [{ filename: `${invoice.invoiceNumber}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }],
    });
    res.json({ success: true, message: `Invoice emailed to ${invoice.customer.email}` });
  } catch (err) { next(err); }
};

exports.downloadPLPDF = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const start = new Date(year, 0, 1);
    const end   = new Date(year, 11, 31, 23, 59, 59);
    const revenueData = await Invoice.aggregate([
      { $match: { status: { $in: ['paid','partial','sent','overdue'] }, createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } }
    ]);
    const expenseData = await Expense.aggregate([
      { $match: { status: 'approved', date: { $gte: start, $lte: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);
    const totalRevenue = revenueData[0]?.total || 0;
    const totalExpense = expenseData.reduce((s,e) => s + e.total, 0);
    const report = {
      year, totalRevenue, totalExpense,
      netProfit: totalRevenue - totalExpense,
      revenueAccounts: [{ name: 'Sales Revenue', code: '4001', balance: totalRevenue }],
      expenseAccounts: expenseData.map(e => ({ name: e._id, code: '5000', balance: e.total })),
    };
    const pdfBuffer = await generatePLReportPDF(report);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=PL-Report-${year}.pdf`);
    res.send(pdfBuffer);
  } catch (err) { next(err); }
};

exports.downloadBalanceSheetPDF = async (req, res, next) => {
  try {
    const assets      = await Account.find({ type: 'asset',     isActive: true });
    const liabilities = await Account.find({ type: 'liability', isActive: true });
    const equity      = await Account.find({ type: 'equity',    isActive: true });
    const report = {
      assets:      assets.map(a      => ({ name: a.name, code: a.code, balance: a.balance })),
      liabilities: liabilities.map(a => ({ name: a.name, code: a.code, balance: a.balance })),
      equity:      equity.map(a      => ({ name: a.name, code: a.code, balance: a.balance })),
      totalAssets:      assets.reduce((s,a)      => s + a.balance, 0),
      totalLiabilities: liabilities.reduce((s,a) => s + a.balance, 0),
      totalEquity:      equity.reduce((s,a)      => s + a.balance, 0),
    };
    const pdfBuffer = await generateBalanceSheetPDF(report);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Balance-Sheet.pdf');
    res.send(pdfBuffer);
  } catch (err) { next(err); }
};