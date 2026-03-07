const express  = require('express');
const router   = express.Router();
const { protect } = require('../../middleware/auth');
const ctrl     = require('./dashboard.controller');

router.use(protect);
router.get('/stats',          ctrl.getDashboardStats);
router.get('/revenue-chart',  ctrl.getRevenueChart);
router.get('/sales-trend',    ctrl.getSalesTrend);
router.get('/top-products',   ctrl.getTopProducts);

module.exports = router;