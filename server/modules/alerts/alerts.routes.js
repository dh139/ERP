const express = require('express');
const router  = express.Router();
const { protect } = require('../../middleware/auth');
const { permit }  = require('../../middleware/rbac');
const { sendLowStockAlert, sendOverdueReminders } = require('../../utils/emailAlerts');

router.use(protect);

router.post('/low-stock', permit('inventory:read'), async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await sendLowStockAlert(email || req.user.email);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/overdue-invoices', permit('accounting:read'), async (req, res, next) => {
  try {
    const result = await sendOverdueReminders();
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;