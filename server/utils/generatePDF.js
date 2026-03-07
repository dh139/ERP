const PDFDocument = require('pdfkit');

// ── Invoice PDF ───────────────────────────────────────────
const generateInvoicePDF = (invoice) => {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on('data',  chunk => chunks.push(chunk));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const BLUE  = '#2563EB';
    const GRAY  = '#6B7280';
    const BLACK = '#1F2937';
    const W     = 500;

    // Header
    doc.rect(0, 0, 612, 100).fill(BLUE);
    doc.fillColor('white').fontSize(28).font('Helvetica-Bold').text('INVOICE', 50, 30);
    doc.fontSize(10).font('Helvetica').text('ERP System — Retail Edition', 50, 65);
    doc.fillColor('white').fontSize(12).text(invoice.invoiceNumber, 450, 30, { align: 'right', width: 110 });
    doc.fontSize(9).text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 450, 50, { align: 'right', width: 110 });
    doc.text(`Due:  ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}`, 450, 65, { align: 'right', width: 110 });

    // Bill To
    doc.fillColor(BLACK).fontSize(11).font('Helvetica-Bold').text('BILL TO:', 50, 120);
    doc.font('Helvetica').fontSize(10).fillColor(BLACK)
      .text(invoice.customer?.name  || 'Customer', 50, 138)
      .text(invoice.customer?.email || '', 50, 153)
      .text(invoice.customer?.phone || '', 50, 168);

    // Status badge
    const statusColors = { paid: '#16A34A', overdue: '#DC2626', sent: '#2563EB', draft: '#6B7280', partial: '#D97706' };
    const sc = statusColors[invoice.status] || '#6B7280';
    doc.roundedRect(430, 120, 130, 28, 4).fill(sc);
    doc.fillColor('white').fontSize(11).font('Helvetica-Bold')
      .text(invoice.status?.toUpperCase(), 430, 129, { width: 130, align: 'center' });

    // Items table header
    doc.fillColor(BLUE).rect(50, 210, W, 25).fill();
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
      .text('ITEM',      58,  219)
      .text('QTY',       300, 219)
      .text('PRICE',     360, 219)
      .text('TAX',       420, 219)
      .text('TOTAL',     470, 219, { width: 80, align: 'right' });

    // Items rows
    let y = 240;
    invoice.items?.forEach((item, i) => {
      const bg = i % 2 === 0 ? '#F9FAFB' : 'white';
      doc.rect(50, y - 5, W, 22).fill(bg);
      doc.fillColor(BLACK).fontSize(9).font('Helvetica')
        .text(item.name     || '',           58,  y, { width: 230 })
        .text(String(item.quantity || 1),    300, y)
        .text(`Rs.${(item.unitPrice||0).toLocaleString()}`, 350, y)
        .text(`${item.taxRate||0}%`,         420, y)
        .text(`Rs.${(item.total||0).toLocaleString()}`, 460, y, { width: 90, align: 'right' });
      y += 22;
    });

    // Totals
    y += 15;
    doc.moveTo(50, y).lineTo(550, y).strokeColor('#E5E7EB').lineWidth(1).stroke();
    y += 15;
    const addRow = (label, value, bold = false, color = BLACK) => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 11 : 10)
        .fillColor(GRAY).text(label, 350, y)
        .fillColor(color).text(value, 460, y, { width: 90, align: 'right' });
      y += 20;
    };
    addRow('Subtotal:',   `Rs.${(invoice.subtotal||0).toLocaleString()}`);
    addRow('Tax:',        `Rs.${(invoice.taxAmount||0).toLocaleString()}`);
    if (invoice.discount > 0) addRow('Discount:', `-Rs.${invoice.discount.toLocaleString()}`);
    doc.rect(340, y - 5, 210, 28).fill(BLUE);
    doc.fillColor('white').font('Helvetica-Bold').fontSize(12)
      .text('TOTAL DUE:', 350, y + 3)
      .text(`Rs.${(invoice.balanceDue||0).toLocaleString()}`, 440, y + 3, { width: 100, align: 'right' });
    y += 45;

    // Payment info
    if (invoice.amountPaid > 0) {
      doc.fillColor('#16A34A').font('Helvetica').fontSize(10)
        .text(`Amount Paid: Rs.${invoice.amountPaid.toLocaleString()}`, 350, y);
      y += 18;
    }

    // Notes
    if (invoice.notes) {
      doc.fillColor(GRAY).fontSize(9).font('Helvetica-Bold').text('NOTES:', 50, y + 10);
      doc.font('Helvetica').text(invoice.notes, 50, y + 25, { width: 300 });
    }

    // Footer
    doc.rect(0, 760, 612, 82).fill('#F3F4F6');
    doc.fillColor(GRAY).fontSize(8).font('Helvetica')
      .text('Thank you for your business!', 50, 775, { align: 'center', width: W })
      .text('This is a computer-generated invoice.', 50, 790, { align: 'center', width: W });

    doc.end();
  });
};

// ── Payslip PDF ───────────────────────────────────────────
const generatePayslipPDF = (payroll) => {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on('data',  chunk => chunks.push(chunk));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const BLUE  = '#1E3A5F';
    const GREEN = '#16A34A';
    const RED   = '#DC2626';
    const GRAY  = '#6B7280';
    const BLACK = '#1F2937';
    const W     = 500;
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    // Header
    doc.rect(0, 0, 612, 90).fill(BLUE);
    doc.fillColor('white').fontSize(24).font('Helvetica-Bold').text('PAYSLIP', 50, 25);
    doc.fontSize(10).font('Helvetica')
      .text(`${MONTHS[(payroll.month||1)-1]} ${payroll.year}`, 50, 58)
      .text(`Generated: ${new Date().toLocaleDateString()}`, 400, 58);

    // Employee info box
    doc.rect(50, 110, W, 80).fill('#EFF6FF');
    doc.fillColor(BLACK).fontSize(14).font('Helvetica-Bold')
      .text(payroll.employee?.user?.name || 'Employee', 70, 125);
    doc.fontSize(9).font('Helvetica').fillColor(GRAY)
      .text(`ID: ${payroll.employee?.employeeId || '—'}`,         70,  148)
      .text(`Dept: ${payroll.employee?.department?.name || '—'}`, 70,  163)
      .text(`Status: ${payroll.status?.toUpperCase()}`,           350, 148)
      .text(`Working Days: ${payroll.workingDays}`,               350, 163);

    // Two column table
    const drawSection = (title, items, x, y, color) => {
      doc.rect(x, y, 230, 22).fill(color);
      doc.fillColor('white').fontSize(10).font('Helvetica-Bold').text(title, x + 10, y + 6);
      let rowY = y + 28;
      items.forEach(([label, value], i) => {
        if (i % 2 === 0) doc.rect(x, rowY, 230, 20).fill('#F9FAFB');
        doc.fillColor(GRAY).font('Helvetica').fontSize(9).text(label, x + 10, rowY + 5);
        doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(9).text(value, x + 130, rowY + 5, { width: 90, align: 'right' });
        rowY += 20;
      });
      return rowY;
    };

    const earnings = [
      ['Basic Salary',   `Rs.${(payroll.earnings?.basic||0).toLocaleString()}`],
      ['HRA',            `Rs.${(payroll.earnings?.hra||0).toLocaleString()}`],
      ['Allowances',     `Rs.${(payroll.earnings?.allowances||0).toLocaleString()}`],
    ];
    const deductions = [
      ['Provident Fund', `Rs.${(payroll.deductions?.providentFund||0).toLocaleString()}`],
      ['Income Tax',     `Rs.${(payroll.deductions?.tax||0).toLocaleString()}`],
      ['Other',          `Rs.${(payroll.deductions?.other||0).toLocaleString()}`],
      ['Unpaid Leave',   `Rs.${(payroll.deductions?.unpaidLeave||0).toLocaleString()}`],
    ];

    drawSection('EARNINGS',   earnings,   50,  220, GREEN);
    drawSection('DEDUCTIONS', deductions, 320, 220, RED);

    // Net salary box
    doc.rect(50, 380, W, 60).fill(BLUE);
    doc.fillColor('white').fontSize(13).font('Helvetica-Bold').text('NET SALARY', 70, 395);
    doc.fontSize(11).font('Helvetica')
      .text(`Gross: Rs.${(payroll.grossSalary||0).toLocaleString()}`, 70,  415)
      .text(`Deductions: -Rs.${(payroll.totalDeductions||0).toLocaleString()}`, 220, 415);
    doc.fontSize(18).font('Helvetica-Bold')
      .text(`Rs.${(payroll.netSalary||0).toLocaleString()}`, 380, 393, { width: 160, align: 'right' });

    // Bank details
    if (payroll.employee?.bankDetails?.accountNo) {
      doc.fillColor(BLACK).fontSize(10).font('Helvetica-Bold').text('BANK DETAILS', 50, 465);
      doc.font('Helvetica').fontSize(9).fillColor(GRAY)
        .text(`Bank: ${payroll.employee.bankDetails.bankName || '—'}`,     50, 482)
        .text(`Account: ${payroll.employee.bankDetails.accountNo || '—'}`, 50, 497)
        .text(`IFSC: ${payroll.employee.bankDetails.ifscCode || '—'}`,     50, 512);
    }

    // Footer
    doc.rect(0, 760, 612, 82).fill('#F3F4F6');
    doc.fillColor(GRAY).fontSize(8).font('Helvetica')
      .text('This is a system-generated payslip and does not require a signature.', 50, 780, { align: 'center', width: W });

    doc.end();
  });
};

// ── P&L PDF ───────────────────────────────────────────────
const generatePLReportPDF = (report) => {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on('data',  chunk => chunks.push(chunk));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const BLUE  = '#2563EB';
    const GREEN = '#16A34A';
    const RED   = '#DC2626';
    const GRAY  = '#6B7280';
    const BLACK = '#1F2937';
    const W     = 500;

    // Header
    doc.rect(0, 0, 612, 90).fill(BLUE);
    doc.fillColor('white').fontSize(22).font('Helvetica-Bold').text('PROFIT & LOSS STATEMENT', 50, 25);
    doc.fontSize(10).font('Helvetica').text(`Fiscal Year: ${report.year}`, 50, 58)
      .text(`Generated: ${new Date().toLocaleDateString()}`, 400, 58);

    // Summary cards
    const drawCard = (label, value, x, color) => {
      doc.rect(x, 110, 150, 60).fill(color);
      doc.fillColor('white').fontSize(9).font('Helvetica').text(label, x + 10, 122);
      doc.fontSize(14).font('Helvetica-Bold').text(`Rs.${Math.abs(value||0).toLocaleString()}`, x + 10, 140);
    };
    drawCard('TOTAL REVENUE', report.totalRevenue, 50,  GREEN);
    drawCard('TOTAL EXPENSES',report.totalExpense,  220, RED);
    drawCard(report.netProfit >= 0 ? 'NET PROFIT' : 'NET LOSS', report.netProfit, 390, report.netProfit >= 0 ? '#1D4ED8' : '#EA580C');

    // Revenue section
    let y = 200;
    doc.rect(50, y, W, 24).fill(GREEN);
    doc.fillColor('white').fontSize(11).font('Helvetica-Bold').text('REVENUE', 60, y + 7);
    y += 30;
    report.revenueAccounts?.forEach((a, i) => {
      if (i % 2 === 0) doc.rect(50, y, W, 20).fill('#F0FDF4');
      doc.fillColor(BLACK).fontSize(9).font('Helvetica').text(a.name, 60, y + 5);
      doc.fillColor(GREEN).font('Helvetica-Bold').text(`Rs.${(a.balance||0).toLocaleString()}`, 460, y + 5, { width: 80, align: 'right' });
      y += 20;
    });
    doc.rect(50, y, W, 22).fill('#DCFCE7');
    doc.fillColor(GREEN).fontSize(10).font('Helvetica-Bold')
      .text('Total Revenue', 60, y + 6)
      .text(`Rs.${(report.totalRevenue||0).toLocaleString()}`, 460, y + 6, { width: 80, align: 'right' });
    y += 35;

    // Expense section
    doc.rect(50, y, W, 24).fill(RED);
    doc.fillColor('white').fontSize(11).font('Helvetica-Bold').text('EXPENSES', 60, y + 7);
    y += 30;
    report.expenseAccounts?.forEach((a, i) => {
      if (i % 2 === 0) doc.rect(50, y, W, 20).fill('#FFF1F2');
      doc.fillColor(BLACK).fontSize(9).font('Helvetica').text(a.name, 60, y + 5);
      doc.fillColor(RED).font('Helvetica-Bold').text(`Rs.${(a.balance||0).toLocaleString()}`, 460, y + 5, { width: 80, align: 'right' });
      y += 20;
    });
    doc.rect(50, y, W, 22).fill('#FFE4E6');
    doc.fillColor(RED).fontSize(10).font('Helvetica-Bold')
      .text('Total Expenses', 60, y + 6)
      .text(`Rs.${(report.totalExpense||0).toLocaleString()}`, 460, y + 6, { width: 80, align: 'right' });
    y += 35;

    // Net profit line
    const npColor = report.netProfit >= 0 ? '#1D4ED8' : '#EA580C';
    doc.rect(50, y, W, 30).fill(npColor);
    doc.fillColor('white').fontSize(13).font('Helvetica-Bold')
      .text(report.netProfit >= 0 ? 'NET PROFIT' : 'NET LOSS', 60, y + 8)
      .text(`Rs.${Math.abs(report.netProfit||0).toLocaleString()}`, 420, y + 8, { width: 120, align: 'right' });

    doc.end();
  });
};

// ── Balance Sheet PDF ─────────────────────────────────────
const generateBalanceSheetPDF = (report) => {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on('data',  chunk => chunks.push(chunk));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const BLUE   = '#1E3A5F';
    const GREEN  = '#16A34A';
    const RED    = '#DC2626';
    const PURPLE = '#7C3AED';
    const BLACK  = '#1F2937';
    const W      = 500;

    // Header
    doc.rect(0, 0, 612, 90).fill(BLUE);
    doc.fillColor('white').fontSize(22).font('Helvetica-Bold').text('BALANCE SHEET', 50, 25);
    doc.fontSize(10).font('Helvetica').text(`As of ${new Date().toLocaleDateString()}`, 50, 58);

    // Summary
    const drawCard = (label, value, x, color) => {
      doc.rect(x, 110, 150, 60).fill(color);
      doc.fillColor('white').fontSize(9).font('Helvetica').text(label, x + 10, 122);
      doc.fontSize(13).font('Helvetica-Bold').text(`Rs.${(value||0).toLocaleString()}`, x + 10, 138);
    };
    drawCard('TOTAL ASSETS',      report.totalAssets,      50,  GREEN);
    drawCard('TOTAL LIABILITIES', report.totalLiabilities, 220, RED);
    drawCard('TOTAL EQUITY',      report.totalEquity,      390, PURPLE);

    const drawSection = (title, items, total, y, color, bgLight) => {
      doc.rect(50, y, W, 24).fill(color);
      doc.fillColor('white').fontSize(11).font('Helvetica-Bold').text(title, 60, y + 7);
      y += 30;
      items?.forEach((a, i) => {
        if (i % 2 === 0) doc.rect(50, y, W, 20).fill(bgLight);
        doc.fillColor(BLACK).fontSize(9).font('Helvetica').text(`${a.code} — ${a.name}`, 60, y + 5);
        doc.fillColor(color).font('Helvetica-Bold').text(`Rs.${(a.balance||0).toLocaleString()}`, 460, y + 5, { width: 80, align: 'right' });
        y += 20;
      });
      doc.rect(50, y, W, 22).fill(bgLight);
      doc.fillColor(color).fontSize(10).font('Helvetica-Bold')
        .text(`Total ${title}`, 60, y + 6)
        .text(`Rs.${(total||0).toLocaleString()}`, 460, y + 6, { width: 80, align: 'right' });
      return y + 35;
    };

    let y = 195;
    y = drawSection('ASSETS',      report.assets,      report.totalAssets,      y, GREEN,  '#F0FDF4');
    y = drawSection('LIABILITIES', report.liabilities, report.totalLiabilities, y, RED,    '#FFF1F2');
        drawSection('EQUITY',      report.equity,      report.totalEquity,      y, PURPLE, '#F5F3FF');

    doc.end();
  });
};

module.exports = { generateInvoicePDF, generatePayslipPDF, generatePLReportPDF, generateBalanceSheetPDF };