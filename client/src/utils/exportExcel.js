import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export const exportToExcel = (data, filename, sheetName = 'Sheet1') => {
  const worksheet  = XLSX.utils.json_to_sheet(data);
  const workbook   = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}-${new Date().toLocaleDateString()}.xlsx`);
};

// Formatters per module
export const exportProducts = (products) => exportToExcel(
  products.map(p => ({ SKU: p.sku, Name: p.name, Category: p.category, Brand: p.brand, 'Cost Price': p.costPrice, 'Selling Price': p.sellingPrice, 'Tax Rate': p.taxRate+'%', Status: p.isActive ? 'Active' : 'Inactive' })),
  'Products', 'Products'
);

export const exportStock = (stock) => exportToExcel(
  stock.map(s => ({ Product: s.product?.name, SKU: s.product?.sku, Warehouse: s.warehouse?.name, Quantity: s.quantity, 'Reorder Level': s.reorderLevel, Status: s.quantity <= s.reorderLevel ? 'Low Stock' : 'OK' })),
  'Stock-Report', 'Stock'
);

export const exportCustomers = (customers) => exportToExcel(
  customers.map(c => ({ Name: c.name, Company: c.company, Email: c.email, Phone: c.phone, 'Total Orders': c.totalOrders, 'Total Spent': c.totalSpent })),
  'Customers', 'Customers'
);

export const exportOrders = (orders) => exportToExcel(
  orders.map(o => ({ 'Order #': o.orderNumber, Customer: o.customer?.name, Total: o.totalAmount, Status: o.status, 'Payment Status': o.paymentStatus, Date: new Date(o.createdAt).toLocaleDateString() })),
  'Sales-Orders', 'Orders'
);

export const exportEmployees = (employees) => exportToExcel(
  employees.map(e => ({ 'Employee ID': e.employeeId, Name: e.user?.name, Email: e.user?.email, Designation: e.designation, Department: e.department?.name, 'Joining Date': e.dateOfJoining ? new Date(e.dateOfJoining).toLocaleDateString() : '', 'Basic Salary': e.salary?.base, Type: e.employmentType })),
  'Employees', 'Employees'
);

export const exportPayroll = (payrolls, month, year) => exportToExcel(
  payrolls.map(p => ({ Employee: p.employee?.user?.name, 'Employee ID': p.employee?.employeeId, Basic: p.earnings?.basic, HRA: p.earnings?.hra, Allowances: p.earnings?.allowances, 'Gross Salary': p.grossSalary, PF: p.deductions?.providentFund, Tax: p.deductions?.tax, 'Net Salary': p.netSalary, Status: p.status })),
  `Payroll-${month}-${year}`, 'Payroll'
);

export const exportInvoices = (invoices) => exportToExcel(
  invoices.map(i => ({ 'Invoice #': i.invoiceNumber, Customer: i.customer?.name, Total: i.totalAmount, Paid: i.amountPaid, 'Balance Due': i.balanceDue, Status: i.status, 'Due Date': i.dueDate ? new Date(i.dueDate).toLocaleDateString() : '' })),
  'Invoices', 'Invoices'
);

export const exportExpenses = (expenses) => exportToExcel(
  expenses.map(e => ({ Date: new Date(e.date).toLocaleDateString(), Category: e.category, Description: e.description, Amount: e.amount, 'Payment Method': e.paymentMethod, Department: e.department?.name, Status: e.status })),
  'Expenses', 'Expenses'
);