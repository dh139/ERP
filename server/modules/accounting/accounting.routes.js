const express = require('express');
const router  = express.Router();
const ctrl    = require('./accounting.controller');
const { protect } = require('../../middleware/auth');
const { permit }  = require('../../middleware/rbac');

router.use(protect);

// Stats
router.get('/stats',                         permit('accounting:read'),  ctrl.getAccountingStats);

// Chart of Accounts
router.post('/accounts/seed',                permit('accounting:write'), ctrl.seedAccounts);
router.get('/accounts',                      permit('accounting:read'),  ctrl.getAccounts);
router.post('/accounts',                     permit('accounting:write'), ctrl.createAccount);
router.put('/accounts/:id',                  permit('accounting:write'), ctrl.updateAccount);

// Transactions
router.get('/transactions',                  permit('accounting:read'),  ctrl.getTransactions);
router.post('/transactions',                 permit('accounting:write'), ctrl.createTransaction);

// Invoices
router.get('/invoices',                      permit('accounting:read'),  ctrl.getInvoices);
router.post('/invoices',                     permit('accounting:write'), ctrl.createInvoice);
router.put('/invoices/:id/payment',          permit('accounting:write'), ctrl.recordPayment);
router.put('/invoices/:id/status',           permit('accounting:write'), ctrl.updateInvoiceStatus);
router.get('/invoices/:id/pdf',              permit('accounting:read'),  ctrl.downloadInvoicePDF);
router.post('/invoices/:id/email',           permit('accounting:write'), ctrl.emailInvoice);

// Expenses
router.get('/expenses',                      permit('accounting:read'),  ctrl.getExpenses);
router.post('/expenses',                     permit('accounting:write'), ctrl.createExpense);
router.put('/expenses/:id/status',           permit('accounting:write'), ctrl.updateExpenseStatus);

// Reports
router.get('/reports/profit-loss',           permit('accounting:read'),  ctrl.getProfitLoss);
router.get('/reports/balance-sheet',         permit('accounting:read'),  ctrl.getBalanceSheet);
router.get('/reports/profit-loss/pdf',       permit('accounting:read'),  ctrl.downloadPLPDF);
router.get('/reports/balance-sheet/pdf',     permit('accounting:read'),  ctrl.downloadBalanceSheetPDF);

module.exports = router;