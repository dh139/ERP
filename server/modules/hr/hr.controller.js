const Employee   = require('./employee.model');
const Department = require('./department.model');
const Attendance = require('./attendance.model');
const Leave      = require('./leave.model');
const Payroll    = require('./payroll.model');
const User       = require('../auth/auth.model');
const sendEmail = require('../../utils/sendEmail');
const { generatePayslipPDF } = require('../../utils/generatePDF');
// ─── DEPARTMENTS ─────────────────────────────────────────
exports.getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ isActive: true }).populate('manager', 'name email');
    res.json({ success: true, departments });
  } catch (err) { next(err); }
};

exports.createDepartment = async (req, res, next) => {
  try {
    const dept = await Department.create(req.body);
    res.status(201).json({ success: true, department: dept });
  } catch (err) { next(err); }
};

exports.updateDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, department: dept });
  } catch (err) { next(err); }
};

// ─── EMPLOYEES ───────────────────────────────────────────
exports.getEmployees = async (req, res, next) => {
  try {
    const { department, search } = req.query;
    const query = { isActive: true };
    if (department) query.department = department;
    const employees = await Employee.find(query)
      .populate('user', 'name email')
      .populate('department', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, employees });
  } catch (err) { next(err); }
};

exports.getEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('user', 'name email role')
      .populate('department', 'name');
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json({ success: true, employee });
  } catch (err) { next(err); }
};

exports.createEmployee = async (req, res, next) => {
  try {
    const {
      name, email, password, designation, department,
      dateOfJoining, phone, employmentType, address,
      bankDetails,
      salary = {}
    } = req.body;

    // Create user account for employee
    const user = await User.create({
      name,
      email,
      password: password || 'Employee@123',
      role: 'sales',
    });

    const employee = await Employee.create({
      user:           user._id,
      designation,
      department,
      dateOfJoining,
      phone,
      address,
      employmentType,
      bankDetails:    bankDetails || {},
      salary: {
        base:        Number(salary.base)        || 0,
        hra:         Number(salary.hra)         || 0,
        allowances:  Number(salary.allowances)  || 0,
        deductions:  Number(salary.deductions)  || 0,
      },
    });

    // Update department headcount
    if (department) {
      await Department.findByIdAndUpdate(department, { $inc: { headcount: 1 } });
    }

    const populated = await Employee.findById(employee._id)
      .populate('user', 'name email')
      .populate('department', 'name');

    res.status(201).json({ success: true, employee: populated });
  } catch (err) { next(err); }
};
exports.updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('user', 'name email')
      .populate('department', 'name');
    res.json({ success: true, employee });
  } catch (err) { next(err); }
};

exports.deactivateEmployee = async (req, res, next) => {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) return res.status(404).json({ message: 'Employee not found' });
    emp.isActive = false;
    await emp.save();
    await User.findByIdAndUpdate(emp.user, { isActive: false });
    if (emp.department) {
      await Department.findByIdAndUpdate(emp.department, { $inc: { headcount: -1 } });
    }
    res.json({ success: true, message: 'Employee deactivated' });
  } catch (err) { next(err); }
};

// ─── ATTENDANCE ──────────────────────────────────────────
exports.getAttendance = async (req, res, next) => {
  try {
    const { employee, month, year } = req.query;
    const query = {};
    if (employee) query.employee = employee;
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end   = new Date(year, month, 0);
      query.date  = { $gte: start, $lte: end };
    }
    const attendance = await Attendance.find(query)
      .populate('employee', 'employeeId')
      .populate({ path: 'employee', populate: { path: 'user', select: 'name' } })
      .sort({ date: -1 });
    res.json({ success: true, attendance });
  } catch (err) { next(err); }
};

exports.markAttendance = async (req, res, next) => {
  try {
    const { employee, date, checkIn, checkOut, status, notes } = req.body;
    let hoursWorked = 0;
    if (checkIn && checkOut) {
      const [inH, inM]   = checkIn.split(':').map(Number);
      const [outH, outM] = checkOut.split(':').map(Number);
      hoursWorked = (outH * 60 + outM - (inH * 60 + inM)) / 60;
    }
    const attendance = await Attendance.findOneAndUpdate(
      { employee, date: new Date(date) },
      { employee, date: new Date(date), checkIn, checkOut, status, notes, hoursWorked },
      { upsert: true, new: true }
    ).populate({ path: 'employee', populate: { path: 'user', select: 'name' } });

    res.status(201).json({ success: true, attendance });
  } catch (err) { next(err); }
};

exports.getAttendanceSummary = async (req, res, next) => {
  try {
    const { employee, month, year } = req.query;
    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 0);
    const records = await Attendance.find({
      employee, date: { $gte: start, $lte: end }
    });
    const summary = {
      present:  records.filter(r => r.status === 'present').length,
      absent:   records.filter(r => r.status === 'absent').length,
      halfDay:  records.filter(r => r.status === 'half_day').length,
      leave:    records.filter(r => r.status === 'leave').length,
      totalHours: records.reduce((sum, r) => sum + r.hoursWorked, 0),
    };
    res.json({ success: true, summary });
  } catch (err) { next(err); }
};

// ─── LEAVES ──────────────────────────────────────────────
exports.getLeaves = async (req, res, next) => {
  try {
    const { status, employee } = req.query;
    const query = {};
    if (status)   query.status   = status;
    if (employee) query.employee = employee;
    const leaves = await Leave.find(query)
      .populate({ path: 'employee', populate: { path: 'user', select: 'name' } })
      .populate('approvedBy', 'name')
      .sort({ appliedOn: -1 });
    res.json({ success: true, leaves });
  } catch (err) { next(err); }
};

exports.applyLeave = async (req, res, next) => {
  try {
    const { employee, leaveType, fromDate, toDate, reason } = req.body;
    const from = new Date(fromDate);
    const to   = new Date(toDate);
    const days = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
    const leave = await Leave.create({ employee, leaveType, fromDate: from, toDate: to, days, reason });
    res.status(201).json({ success: true, leave });
  } catch (err) { next(err); }
};

exports.updateLeaveStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const leave = await Leave.findById(req.params.id)
      .populate({ path: 'employee', select: 'leaveBalance' });
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    if (status === 'approved' && leave.leaveType !== 'unpaid') {
      const emp = await Employee.findById(leave.employee._id);
      const balKey = leave.leaveType;
      if (emp.leaveBalance[balKey] >= leave.days) {
        emp.leaveBalance[balKey] -= leave.days;
        await emp.save();
      }
    }

    leave.status     = status;
    leave.approvedBy = req.user._id;
    await leave.save();
    res.json({ success: true, leave });
  } catch (err) { next(err); }
};

// ─── PAYROLL ─────────────────────────────────────────────
exports.getPayrolls = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const query = {};
    if (month) query.month = Number(month);
    if (year)  query.year  = Number(year);
    const payrolls = await Payroll.find(query)
      .populate({ path: 'employee', populate: { path: 'user', select: 'name email' } })
      .sort({ createdAt: -1 });
    res.json({ success: true, payrolls });
  } catch (err) { next(err); }
};

exports.processPayroll = async (req, res, next) => {
  try {
    const { month, year } = req.body;
    const employees = await Employee.find({ isActive: true });
    const results   = [];

    for (const emp of employees) {
      // Check if already processed
      const existing = await Payroll.findOne({ employee: emp._id, month, year });
      if (existing) continue;

      const { base, hra, allowances, deductions } = emp.salary;

      // Count unpaid leaves this month
      const start = new Date(year, month - 1, 1);
      const end   = new Date(year, month, 0);
      const unpaidLeaves = await Leave.countDocuments({
        employee: emp._id, leaveType: 'unpaid',
        status: 'approved', fromDate: { $gte: start, $lte: end }
      });

      const workingDays    = 26;
      const dailyRate      = base / workingDays;
      const unpaidDeduction= dailyRate * unpaidLeaves;

      const grossSalary    = base + hra + allowances;
      const pf             = Math.round(base * 0.12);
      const tax            = grossSalary > 50000 ? Math.round(grossSalary * 0.1) : 0;
      const totalDeductions= deductions + pf + tax + unpaidDeduction;
      const netSalary      = grossSalary - totalDeductions;

      const payroll = await Payroll.create({
        employee: emp._id, month, year, workingDays,
        earnings: { basic: base, hra, allowances },
        deductions: { tax, providentFund: pf, other: deductions, unpaidLeave: unpaidDeduction },
        grossSalary, totalDeductions, netSalary,
        status: 'processed', processedBy: req.user._id,
      });
      results.push(payroll);
    }

    res.json({ success: true, message: `${results.length} payrolls processed`, payrolls: results });
  } catch (err) { next(err); }
};

exports.markPayrollPaid = async (req, res, next) => {
  try {
    const payroll = await Payroll.findByIdAndUpdate(
      req.params.id,
      { status: 'paid', paidOn: new Date() },
      { new: true }
    );
    res.json({ success: true, payroll });
  } catch (err) { next(err); }
};

// ─── HR STATS ────────────────────────────────────────────
exports.getHRStats = async (req, res, next) => {
  try {
    const totalEmployees  = await Employee.countDocuments({ isActive: true });
    const totalDepartments= await Department.countDocuments({ isActive: true });
    const pendingLeaves   = await Leave.countDocuments({ status: 'pending' });
    const today           = new Date();
    const presentToday    = await Attendance.countDocuments({
      date: { $gte: new Date(today.setHours(0,0,0,0)), $lte: new Date(today.setHours(23,59,59,999)) },
      status: 'present'
    });
    const payrollData = await Payroll.aggregate([
      { $match: { status: { $in: ['processed','paid'] }, month: new Date().getMonth() + 1, year: new Date().getFullYear() } },
      { $group: { _id: null, total: { $sum: '$netSalary' } } }
    ]);
    const monthlyPayroll = payrollData[0]?.total || 0;

    res.json({ success: true, stats: { totalEmployees, totalDepartments, pendingLeaves, presentToday, monthlyPayroll } });
  } catch (err) { next(err); }
};
exports.downloadPayslipPDF = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate({ 
        path: 'employee', 
        populate: [
          { path: 'user',       select: 'name email' }, 
          { path: 'department', select: 'name' }
        ] 
      });
    if (!payroll) return res.status(404).json({ message: 'Payroll not found' });

    const pdfBuffer = await generatePayslipPDF(payroll);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Payslip-${payroll.employee?.employeeId}-${payroll.month}-${payroll.year}.pdf`);
    res.send(pdfBuffer);
  } catch (err) { next(err); }
};

exports.emailPayslip = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate({ 
        path: 'employee', 
        populate: [
          { path: 'user',       select: 'name email' }, 
          { path: 'department', select: 'name' }
        ] 
      });
    if (!payroll) return res.status(404).json({ message: 'Payroll not found' });

    const email = payroll.employee?.user?.email;
    if (!email) return res.status(400).json({ message: 'Employee has no email' });

    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const pdfBuffer = await generatePayslipPDF(payroll);

    await sendEmail({
      to:      email,
      subject: `Payslip for ${MONTHS[(payroll.month||1)-1]} ${payroll.year}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#1E3A5F;padding:30px;border-radius:8px 8px 0 0">
            <h1 style="color:white;margin:0;font-size:22px">Your Payslip is Ready</h1>
            <p style="color:#93C5FD;margin:8px 0 0">${MONTHS[(payroll.month||1)-1]} ${payroll.year}</p>
          </div>
          <div style="padding:30px;background:#f9fafb;border:1px solid #e5e7eb">
            <p>Dear <strong>${payroll.employee?.user?.name}</strong>,</p>
            <p>Your payslip for <strong>${MONTHS[(payroll.month||1)-1]} ${payroll.year}</strong> is attached.</p>
            <table style="width:100%;background:white;border-radius:8px;padding:20px;margin:20px 0">
              <tr><td style="color:#6B7280;padding:8px 0">Gross Salary</td><td style="font-weight:bold;text-align:right">Rs.${payroll.grossSalary?.toLocaleString()}</td></tr>
              <tr><td style="color:#6B7280;padding:8px 0">Total Deductions</td><td style="font-weight:bold;color:#DC2626;text-align:right">-Rs.${payroll.totalDeductions?.toLocaleString()}</td></tr>
              <tr style="border-top:2px solid #e5e7eb"><td style="font-weight:bold;padding:8px 0">Net Salary</td><td style="font-weight:bold;color:#16A34A;text-align:right;font-size:18px">Rs.${payroll.netSalary?.toLocaleString()}</td></tr>
            </table>
          </div>
          <div style="background:#e5e7eb;padding:15px;border-radius:0 0 8px 8px;text-align:center">
            <p style="color:#6B7280;font-size:12px;margin:0">This is a system-generated payslip</p>
          </div>
        </div>
      `,
      attachments: [{
        filename:    `Payslip-${MONTHS[(payroll.month||1)-1]}-${payroll.year}.pdf`,
        content:     pdfBuffer,
        contentType: 'application/pdf',
      }],
    });

    res.json({ success: true, message: `Payslip emailed to ${email}` });
  } catch (err) { next(err); }
};