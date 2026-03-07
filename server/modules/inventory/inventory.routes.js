const express = require('express');
const router  = express.Router();
const ctrl    = require('./inventory.controller');
const { protect } = require('../../middleware/auth');
const { permit }  = require('../../middleware/rbac');

router.use(protect);

// Stats
router.get('/stats',                    permit('inventory:read'), ctrl.getInventoryStats);

// Products
router.get('/products',                 permit('inventory:read'),  ctrl.getProducts);
router.get('/products/:id',             permit('inventory:read'),  ctrl.getProduct);
router.post('/products',                permit('inventory:write'), ctrl.createProduct);
router.put('/products/:id',             permit('inventory:write'), ctrl.updateProduct);
router.delete('/products/:id',          permit('inventory:write'), ctrl.deleteProduct);

// Warehouses
router.get('/warehouses',               permit('inventory:read'),  ctrl.getWarehouses);
router.post('/warehouses',              permit('inventory:write'), ctrl.createWarehouse);
router.put('/warehouses/:id',           permit('inventory:write'), ctrl.updateWarehouse);

// Stock
router.get('/stock',                    permit('inventory:read'),  ctrl.getStock);
router.get('/stock/low',                permit('inventory:read'),  ctrl.getLowStock);
router.post('/stock/movement',          permit('inventory:write'), ctrl.recordMovement);
router.get('/stock/movements',          permit('inventory:read'),  ctrl.getMovements);

// Suppliers
router.get('/suppliers',                permit('inventory:read'),  ctrl.getSuppliers);
router.post('/suppliers',               permit('inventory:write'), ctrl.createSupplier);
router.put('/suppliers/:id',            permit('inventory:write'), ctrl.updateSupplier);

// Purchase Orders
router.get('/purchase-orders',          permit('inventory:read'),  ctrl.getPurchaseOrders);
router.post('/purchase-orders',         permit('inventory:write'), ctrl.createPurchaseOrder);
router.put('/purchase-orders/:id/receive', permit('inventory:write'), ctrl.receivePurchaseOrder);

module.exports = router;