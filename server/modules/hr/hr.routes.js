const express = require('express');
const router  = express.Router();
const ctrl    = require('./hr.controller');
const { protect } = require('../../middleware/auth');
const { permit }  = require('../../middleware/rbac');

router.use(protect);

// Stats
router.get('/stats',                        permit('hr:read'), ctrl.getHRStats);

// Departments
router.get('/departments',                  permit('hr:read'),  ctrl.getDepartments);
router.post('/departments',                 permit('hr:write'), ctrl.createDepartment);
router.put('/departments/:id',              permit('hr:write'), ctrl.updateDepartment);

// Employees
router.get('/employees',                    permit('hr:read'),  ctrl.getEmployees);
router.get('/employees/:id',                permit('hr:read'),  ctrl.getEmployee);
router.post('/employees',                   permit('hr:write'), ctrl.createEmployee);
router.put('/employees/:id',                permit('hr:write'), ctrl.updateEmployee);
router.delete('/employees/:id',             permit('hr:write'), ctrl.deactivateEmployee);

// Attendance
router.get('/attendance',                   permit('hr:read'),  ctrl.getAttendance);
router.post('/attendance',                  permit('hr:write'), ctrl.markAttendance);
router.get('/attendance/summary',           permit('hr:read'),  ctrl.getAttendanceSummary);

// Leaves
router.get('/leaves',                       permit('hr:read'),  ctrl.getLeaves);
router.post('/leaves',                      permit('hr:write'), ctrl.applyLeave);
router.put('/leaves/:id/status',            permit('hr:write'), ctrl.updateLeaveStatus);

// Payroll
router.get('/payroll',                      permit('hr:payroll'), ctrl.getPayrolls);
router.post('/payroll/process',             permit('hr:payroll'), ctrl.processPayroll);
router.put('/payroll/:id/paid',             permit('hr:payroll'), ctrl.markPayrollPaid);
router.get('/payroll/:id/pdf',    permit('hr:read'),  ctrl.downloadPayslipPDF);
router.post('/payroll/:id/email', permit('hr:write'), ctrl.emailPayslip);
module.exports = router;