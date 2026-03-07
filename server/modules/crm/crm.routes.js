const express = require('express');
const router  = express.Router();
const ctrl    = require('./crm.controller');
const { protect } = require('../../middleware/auth');
const { permit }  = require('../../middleware/rbac');

router.use(protect);

// Stats
router.get('/stats',                      permit('crm:read'), ctrl.getCRMStats);

// Customers
router.get('/customers',                  permit('crm:read'),  ctrl.getCustomers);
router.get('/customers/:id',              permit('crm:read'),  ctrl.getCustomer);
router.post('/customers',                 permit('crm:write'), ctrl.createCustomer);
router.put('/customers/:id',              permit('crm:write'), ctrl.updateCustomer);

// Leads
router.get('/leads',                      permit('crm:read'),  ctrl.getLeads);
router.post('/leads',                     permit('crm:write'), ctrl.createLead);
router.put('/leads/:id',                  permit('crm:write'), ctrl.updateLead);
router.post('/leads/:id/convert',         permit('crm:write'), ctrl.convertLead);

// Sales Orders
router.get('/orders',                     permit('crm:read'),  ctrl.getSalesOrders);
router.get('/orders/:id',                 permit('crm:read'),  ctrl.getSalesOrder);
router.post('/orders',                    permit('crm:write'), ctrl.createSalesOrder);
router.put('/orders/:id/status',          permit('crm:write'), ctrl.updateOrderStatus);

module.exports = router;