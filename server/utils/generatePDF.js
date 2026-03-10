const PDFDocument = require('pdfkit');

// ── Brand Tokens ──────────────────────────────────────────
const C = {
  black:    '#0A0A0A',
  yellow:   '#FFD966',
  white:    '#FFFFFF',
  offwhite: '#FAFAF8',
  gray1:    '#F4F4F0',
  gray2:    '#E8E8E3',
  gray3:    '#AAAAAA',
  gray4:    '#666666',
  green:    '#16A34A',
  greenBg:  '#F0FDF4',
  greenBd:  '#BBF7D0',
  red:      '#DC2626',
  redBg:    '#FEF2F2',
  redBd:    '#FECACA',
  blue:     '#0EA5E9',
  blueBg:   '#F0F9FF',
  blueBd:   '#BAE6FD',
  purple:   '#7C3AED',
  purpleBg: '#F5F3FF',
  orange:   '#FF6B35',
};

const PAGE_W = 612;
const MARGIN = 48;
const INNER_W = PAGE_W - MARGIN * 2;  // 516

// ── Shared Helpers ────────────────────────────────────────
const drawDotPattern = (doc, x, y, w, h, dotColor = 'rgba(255,255,255,0.08)') => {
  const spacing = 18;
  doc.save();
  doc.rect(x, y, w, h).clip();
  for (let dx = x; dx < x + w; dx += spacing) {
    for (let dy = y; dy < y + h; dy += spacing) {
      doc.circle(dx, dy, 1).fill(dotColor);
    }
  }
  doc.restore();
};

const drawHeader = (doc, title, subtitle, rightLines = []) => {
  // Black header bar
  doc.rect(0, 0, PAGE_W, 88).fill(C.black);
  drawDotPattern(doc, 0, 0, PAGE_W, 88);

  // Yellow accent left stripe
  doc.rect(0, 0, 5, 88).fill(C.yellow);

  // Logo mark
  doc.roundedRect(MARGIN, 20, 36, 36, 6).fill(C.yellow);
  doc.fillColor(C.black).fontSize(20).font('Helvetica-Bold').text('⚡', MARGIN + 2, 25);

  // Title
  doc.fillColor(C.white).fontSize(22).font('Helvetica-Bold')
    .text(title, MARGIN + 46, 22, { characterSpacing: -0.5 });
  doc.fillColor(C.gray3).fontSize(9).font('Helvetica')
    .text(subtitle, MARGIN + 46, 50);

  // Right side lines
  rightLines.forEach((line, i) => {
    doc.fillColor(i === 0 ? C.yellow : C.gray3)
      .fontSize(i === 0 ? 11 : 8.5)
      .font(i === 0 ? 'Helvetica-Bold' : 'Helvetica')
      .text(line, 0, 22 + i * 18, { align: 'right', width: PAGE_W - MARGIN });
  });
};

const drawFooter = (doc, note = 'This is a system-generated document · NEXUS ERP') => {
  const footerY = 760;
  doc.rect(0, footerY, PAGE_W, 82).fill(C.gray1);
  doc.rect(0, footerY, PAGE_W, 2).fill(C.yellow);
  doc.fillColor(C.gray3).fontSize(7.5).font('Helvetica')
    .text(note, MARGIN, footerY + 20, { align: 'center', width: INNER_W })
    .text('NEXUS ERP · Built for Indian Retail', MARGIN, footerY + 36, { align: 'center', width: INNER_W });
};

const sectionHeader = (doc, label, y, color = C.black) => {
  doc.rect(MARGIN, y, INNER_W, 24).fill(color);
  // Subtle dot texture
  drawDotPattern(doc, MARGIN, y, INNER_W, 24);
  doc.fillColor(C.white).fontSize(8.5).font('Helvetica-Bold')
    .text(label, MARGIN + 12, y + 8, { characterSpacing: 1.5 });
  return y + 24;
};

const tableRow = (doc, cols, y, rowIdx, rowH = 22) => {
  const bg = rowIdx % 2 === 0 ? C.offwhite : C.white;
  doc.rect(MARGIN, y, INNER_W, rowH).fill(bg);
  return bg;
};

const pill = (doc, text, x, y, bg, textColor, w = 80) => {
  doc.roundedRect(x, y, w, 18, 4).fill(bg);
  doc.fillColor(textColor).fontSize(8).font('Helvetica-Bold')
    .text(text, x, y + 5, { width: w, align: 'center', characterSpacing: 0.8 });
};

const rupeeFmt = (n) => `Rs.${(n || 0).toLocaleString('en-IN')}`;

// ─────────────────────────────────────────────────────────
// INVOICE PDF
// ─────────────────────────────────────────────────────────
const generateInvoicePDF = (invoice) => {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: MARGIN, size: 'A4' });
    const chunks = [];
    doc.on('data',  c => chunks.push(c));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ── Header ──
    const statusMap = {
      paid:    { label: 'PAID',    bg: C.green,  tc: C.white },
      overdue: { label: 'OVERDUE', bg: C.red,    tc: C.white },
      sent:    { label: 'SENT',    bg: C.blue,   tc: C.white },
      draft:   { label: 'DRAFT',   bg: C.gray3,  tc: C.white },
      partial: { label: 'PARTIAL', bg: C.orange, tc: C.white },
    };
    const st = statusMap[invoice.status] || statusMap.draft;

    drawHeader(doc, 'INVOICE', 'NEXUS ERP · Tax Invoice', [
      invoice.invoiceNumber || 'INV-000001',
      `Date: ${new Date(invoice.createdAt || Date.now()).toLocaleDateString('en-IN')}`,
      `Due:  ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'N/A'}`,
    ]);

    // ── Billing info row ──
    let y = 108;

    // Bill To card
    doc.rect(MARGIN, y, 240, 85).fill(C.gray1)
      .rect(MARGIN, y, 3, 85).fill(C.yellow);
    doc.fillColor(C.gray3).fontSize(7.5).font('Helvetica-Bold')
      .text('BILL TO', MARGIN + 12, y + 10, { characterSpacing: 1.2 });
    doc.fillColor(C.black).fontSize(13).font('Helvetica-Bold')
      .text(invoice.customer?.name || 'Customer Name', MARGIN + 12, y + 24);
    doc.fillColor(C.gray4).fontSize(9).font('Helvetica')
      .text(invoice.customer?.email || '', MARGIN + 12, y + 44)
      .text(invoice.customer?.phone || '', MARGIN + 12, y + 58)
      .text(invoice.customer?.address || '', MARGIN + 12, y + 72, { width: 220 });

    // Invoice meta card
    doc.rect(324, y, 240, 85).fill(C.black);
    drawDotPattern(doc, 324, y, 240, 85);
    const metaRows = [
      ['Invoice #', invoice.invoiceNumber || '—'],
      ['Issue Date', new Date(invoice.createdAt || Date.now()).toLocaleDateString('en-IN')],
      ['Due Date',   invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'N/A'],
      ['Status',     st.label],
    ];
    metaRows.forEach(([k, v], i) => {
      doc.fillColor(C.gray3).fontSize(8).font('Helvetica').text(k, 336, y + 12 + i * 18);
      doc.fillColor(i === 3 ? C.yellow : C.white).fontSize(8).font('Helvetica-Bold')
        .text(v, 336, y + 12 + i * 18, { align: 'right', width: 216 });
    });

    // ── Items table ──
    y += 100;
    y = sectionHeader(doc, 'ITEMS', y);

    // Column headers
    doc.rect(MARGIN, y, INNER_W, 20).fill(C.gray1);
    doc.fillColor(C.gray3).fontSize(7.5).font('Helvetica-Bold')
      .text('DESCRIPTION',         MARGIN + 10, y + 6, { characterSpacing: 0.8 })
      .text('QTY',                 340, y + 6, { width: 35, align: 'center' })
      .text('UNIT PRICE',          380, y + 6, { width: 65, align: 'right' })
      .text('TAX',                 450, y + 6, { width: 30, align: 'center' })
      .text('TOTAL',               480, y + 6, { width: 84, align: 'right' });
    y += 20;

    // Item rows
    (invoice.items || []).forEach((item, i) => {
      tableRow(doc, [], y, i, 24);
      doc.fillColor(C.black).fontSize(9).font('Helvetica-Bold')
        .text(item.name || 'Item', MARGIN + 10, y + 7, { width: 280 });
      doc.fillColor(C.gray4).fontSize(9).font('Helvetica')
        .text(String(item.quantity || 1),             340, y + 7, { width: 35, align: 'center' })
        .text(rupeeFmt(item.unitPrice),               380, y + 7, { width: 65, align: 'right' })
        .text(`${item.taxRate || 0}%`,                450, y + 7, { width: 30, align: 'center' })
        .text(rupeeFmt(item.total),                   480, y + 7, { width: 84, align: 'right' });
      y += 24;
    });

    // Bottom border
    doc.rect(MARGIN, y, INNER_W, 1.5).fill(C.gray2);
    y += 16;

    // ── Totals ──
    const totalsX = 360;
    const totalsW = INNER_W - (totalsX - MARGIN);

    const addTotal = (label, value, bold = false, color = C.gray4) => {
      doc.fillColor(C.gray3).fontSize(9).font('Helvetica').text(label, totalsX, y);
      doc.fillColor(color).fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .text(value, totalsX, y, { align: 'right', width: totalsW });
      y += 18;
    };

    addTotal('Subtotal',    rupeeFmt(invoice.subtotal));
    addTotal('Tax',         rupeeFmt(invoice.taxAmount));
    if (invoice.discount > 0) addTotal('Discount', `-${rupeeFmt(invoice.discount)}`, false, C.red);
    if (invoice.amountPaid > 0) addTotal('Amount Paid', rupeeFmt(invoice.amountPaid), false, C.green);

    y += 4;
    // Total due block
    doc.rect(totalsX - 10, y, totalsW + 10, 34).fill(C.black);
    doc.fillColor(C.gray3).fontSize(9).font('Helvetica').text('TOTAL DUE', totalsX, y + 11);
    doc.fillColor(C.yellow).fontSize(14).font('Helvetica-Bold')
      .text(rupeeFmt(invoice.balanceDue || invoice.totalAmount), totalsX, y + 9, { align: 'right', width: totalsW });
    y += 50;

    // ── Notes ──
    if (invoice.notes) {
      doc.rect(MARGIN, y, INNER_W, 1).fill(C.gray2);
      y += 10;
      doc.fillColor(C.gray3).fontSize(7.5).font('Helvetica-Bold').text('NOTES', MARGIN, y, { characterSpacing: 1.2 });
      y += 14;
      doc.fillColor(C.gray4).fontSize(9).font('Helvetica').text(invoice.notes, MARGIN, y, { width: 320 });
    }

    drawFooter(doc, 'This is a computer-generated invoice and does not require a physical signature · NEXUS ERP');
    doc.end();
  });
};

// ─────────────────────────────────────────────────────────
// PAYSLIP PDF
// ─────────────────────────────────────────────────────────
const generatePayslipPDF = (payroll) => {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: MARGIN, size: 'A4' });
    const chunks = [];
    doc.on('data',  c => chunks.push(c));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const monthName = MONTHS[(payroll.month || 1) - 1];

    // ── Header ──
    drawHeader(doc, 'PAYSLIP', `${monthName} ${payroll.year || new Date().getFullYear()} · NEXUS ERP`, [
      `Generated: ${new Date().toLocaleDateString('en-IN')}`,
    ]);

    // ── Employee info ──
    let y = 108;
    doc.rect(MARGIN, y, INNER_W, 72).fill(C.black);
    drawDotPattern(doc, MARGIN, y, INNER_W, 72);
    doc.rect(MARGIN, y, 4, 72).fill(C.yellow);

    doc.fillColor(C.white).fontSize(16).font('Helvetica-Bold')
      .text(payroll.employee?.user?.name || 'Employee Name', MARGIN + 18, y + 14);
    doc.fillColor(C.gray3).fontSize(9).font('Helvetica')
      .text(`ID: ${payroll.employee?.employeeId || '—'}  ·  Dept: ${payroll.employee?.department?.name || '—'}  ·  ${payroll.employee?.designation || '—'}`, MARGIN + 18, y + 38);

    // Status pill
    const spColor = payroll.status === 'paid' ? C.green : payroll.status === 'processed' ? C.blue : C.gray3;
    pill(doc, (payroll.status || 'PROCESSED').toUpperCase(), PAGE_W - MARGIN - 88, y + 26, spColor, C.white, 80);

    // Month pill (yellow)
    pill(doc, `${monthName.slice(0,3).toUpperCase()} ${payroll.year}`, PAGE_W - MARGIN - 178, y + 26, C.yellow, C.black, 82);

    y += 90;

    // ── Two-column layout: Earnings | Deductions ──
    const COL_W = (INNER_W - 12) / 2;
    const leftX  = MARGIN;
    const rightX = MARGIN + COL_W + 12;

    // Earnings header
    doc.rect(leftX, y, COL_W, 24).fill(C.green);
    drawDotPattern(doc, leftX, y, COL_W, 24);
    doc.fillColor(C.white).fontSize(8.5).font('Helvetica-Bold')
      .text('EARNINGS', leftX + 12, y + 8, { characterSpacing: 1.5 });

    // Deductions header
    doc.rect(rightX, y, COL_W, 24).fill(C.red);
    drawDotPattern(doc, rightX, y, COL_W, 24);
    doc.fillColor(C.white).fontSize(8.5).font('Helvetica-Bold')
      .text('DEDUCTIONS', rightX + 12, y + 8, { characterSpacing: 1.5 });
    y += 24;

    const earningsRows = [
      ['Basic Salary',   payroll.earnings?.basic      || 0],
      ['HRA',            payroll.earnings?.hra         || 0],
      ['Allowances',     payroll.earnings?.allowances  || 0],
      ['Gross Salary',   payroll.grossSalary           || 0],
    ];
    const deductionRows = [
      ['Provident Fund', payroll.deductions?.providentFund || 0],
      ['Income Tax',     payroll.deductions?.tax           || 0],
      ['Unpaid Leave',   payroll.deductions?.unpaidLeave   || 0],
      ['Total Deductions', payroll.totalDeductions         || 0],
    ];

    const maxRows = Math.max(earningsRows.length, deductionRows.length);
    for (let i = 0; i < maxRows; i++) {
      const rowBg  = i % 2 === 0 ? C.offwhite : C.white;
      const isLast = i === maxRows - 1;

      // Left cell
      doc.rect(leftX, y, COL_W, 24).fill(isLast ? C.greenBg : rowBg);
      if (earningsRows[i]) {
        const [label, val] = earningsRows[i];
        doc.fillColor(isLast ? C.green : C.gray4).fontSize(9).font('Helvetica').text(label, leftX + 12, y + 7);
        doc.fillColor(isLast ? C.green : C.black).fontSize(9).font(isLast ? 'Helvetica-Bold' : 'Helvetica')
          .text(rupeeFmt(val), leftX + 12, y + 7, { align: 'right', width: COL_W - 24 });
      }

      // Right cell
      doc.rect(rightX, y, COL_W, 24).fill(isLast ? C.redBg : rowBg);
      if (deductionRows[i]) {
        const [label, val] = deductionRows[i];
        doc.fillColor(isLast ? C.red : C.gray4).fontSize(9).font('Helvetica').text(label, rightX + 12, y + 7);
        doc.fillColor(isLast ? C.red : C.black).fontSize(9).font(isLast ? 'Helvetica-Bold' : 'Helvetica')
          .text(rupeeFmt(val), rightX + 12, y + 7, { align: 'right', width: COL_W - 24 });
      }
      y += 24;
    }

    y += 14;

    // ── Net Salary Hero block ──
    doc.rect(MARGIN, y, INNER_W, 56).fill(C.black);
    drawDotPattern(doc, MARGIN, y, INNER_W, 56);
    doc.rect(MARGIN, y, 4, 56).fill(C.yellow);

    doc.fillColor(C.gray3).fontSize(10).font('Helvetica').text('NET SALARY', MARGIN + 18, y + 10);
    doc.fillColor(C.white).fontSize(10).font('Helvetica')
      .text(`Working Days: ${payroll.workingDays || 0}`, MARGIN + 18, y + 30);

    doc.fillColor(C.yellow).fontSize(22).font('Helvetica-Bold')
      .text(rupeeFmt(payroll.netSalary), 0, y + 16, { align: 'right', width: PAGE_W - MARGIN - 10 });

    y += 72;

    // ── Bank Details ──
    if (payroll.employee?.bankDetails?.accountNo) {
      doc.rect(MARGIN, y, INNER_W, 1).fill(C.gray2);
      y += 12;
      doc.fillColor(C.gray3).fontSize(7.5).font('Helvetica-Bold').text('BANK DETAILS', MARGIN, y, { characterSpacing: 1.2 });
      y += 14;

      const bdRows = [
        ['Bank', payroll.employee.bankDetails.bankName  || '—'],
        ['Account No.', payroll.employee.bankDetails.accountNo || '—'],
        ['IFSC Code',   payroll.employee.bankDetails.ifscCode  || '—'],
      ];
      bdRows.forEach(([k, v]) => {
        doc.fillColor(C.gray3).fontSize(9).font('Helvetica').text(k, MARGIN, y);
        doc.fillColor(C.black).fontSize(9).font('Helvetica-Bold').text(v, MARGIN + 100, y);
        y += 16;
      });
    }

    drawFooter(doc, 'This is a system-generated payslip and does not require a physical signature · NEXUS ERP');
    doc.end();
  });
};

// ─────────────────────────────────────────────────────────
// PROFIT & LOSS REPORT PDF
// ─────────────────────────────────────────────────────────
const generatePLReportPDF = (report) => {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: MARGIN, size: 'A4' });
    const chunks = [];
    doc.on('data',  c => chunks.push(c));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ── Header ──
    drawHeader(doc, 'PROFIT & LOSS', `Fiscal Year ${report.year || new Date().getFullYear()} · NEXUS ERP`, [
      `Generated: ${new Date().toLocaleDateString('en-IN')}`,
    ]);

    // ── Summary Cards ──
    let y = 108;
    const summaryCards = [
      { label: 'TOTAL REVENUE', value: report.totalRevenue, accent: C.green, bg: C.greenBg },
      { label: 'TOTAL EXPENSES', value: report.totalExpense, accent: C.red,  bg: C.redBg  },
      { label: report.netProfit >= 0 ? 'NET PROFIT' : 'NET LOSS',
        value: report.netProfit, accent: report.netProfit >= 0 ? C.blue : C.orange,
        bg: report.netProfit >= 0 ? C.blueBg : '#FFF7ED' },
    ];
    const cardW = (INNER_W - 24) / 3;
    summaryCards.forEach((card, i) => {
      const cx = MARGIN + i * (cardW + 12);
      doc.rect(cx, y, cardW, 68).fill(card.bg);
      doc.rect(cx, y, cardW, 3).fill(card.accent);
      doc.fillColor(card.accent).fontSize(7.5).font('Helvetica-Bold')
        .text(card.label, cx + 10, y + 14, { characterSpacing: 1 });
      doc.fillColor(C.black).fontSize(16).font('Helvetica-Bold')
        .text(rupeeFmt(Math.abs(card.value || 0)), cx + 10, y + 30);
    });
    y += 84;

    // ── Revenue Section ──
    y = sectionHeader(doc, 'REVENUE', y, C.green);

    // Column headings
    doc.rect(MARGIN, y, INNER_W, 18).fill(C.gray1);
    doc.fillColor(C.gray3).fontSize(7.5).font('Helvetica-Bold')
      .text('ACCOUNT', MARGIN + 10, y + 5, { characterSpacing: 0.8 })
      .text('AMOUNT', MARGIN + 10, y + 5, { align: 'right', width: INNER_W - 20, characterSpacing: 0.8 });
    y += 18;

    (report.revenueAccounts || []).forEach((a, i) => {
      tableRow(doc, [], y, i, 22);
      doc.fillColor(C.black).fontSize(9).font('Helvetica').text(a.name, MARGIN + 10, y + 6, { width: 320 });
      doc.fillColor(C.green).fontSize(9).font('Helvetica-Bold')
        .text(rupeeFmt(a.balance), MARGIN + 10, y + 6, { align: 'right', width: INNER_W - 20 });
      y += 22;
    });

    // Revenue total
    doc.rect(MARGIN, y, INNER_W, 26).fill(C.greenBg);
    doc.rect(MARGIN, y, INNER_W, 2).fill(C.greenBd);
    doc.fillColor(C.green).fontSize(10).font('Helvetica-Bold')
      .text('Total Revenue', MARGIN + 10, y + 8)
      .text(rupeeFmt(report.totalRevenue), MARGIN + 10, y + 8, { align: 'right', width: INNER_W - 20 });
    y += 38;

    // ── Expenses Section ──
    y = sectionHeader(doc, 'EXPENSES', y, C.red);

    doc.rect(MARGIN, y, INNER_W, 18).fill(C.gray1);
    doc.fillColor(C.gray3).fontSize(7.5).font('Helvetica-Bold')
      .text('ACCOUNT', MARGIN + 10, y + 5, { characterSpacing: 0.8 })
      .text('AMOUNT', MARGIN + 10, y + 5, { align: 'right', width: INNER_W - 20, characterSpacing: 0.8 });
    y += 18;

    (report.expenseAccounts || []).forEach((a, i) => {
      tableRow(doc, [], y, i, 22);
      doc.fillColor(C.black).fontSize(9).font('Helvetica').text(a.name, MARGIN + 10, y + 6, { width: 320 });
      doc.fillColor(C.red).fontSize(9).font('Helvetica-Bold')
        .text(rupeeFmt(a.balance), MARGIN + 10, y + 6, { align: 'right', width: INNER_W - 20 });
      y += 22;
    });

    doc.rect(MARGIN, y, INNER_W, 26).fill(C.redBg);
    doc.rect(MARGIN, y, INNER_W, 2).fill(C.redBd);
    doc.fillColor(C.red).fontSize(10).font('Helvetica-Bold')
      .text('Total Expenses', MARGIN + 10, y + 8)
      .text(rupeeFmt(report.totalExpense), MARGIN + 10, y + 8, { align: 'right', width: INNER_W - 20 });
    y += 38;

    // ── Net Result ──
    const netColor  = report.netProfit >= 0 ? C.green : C.orange;
    const netLabel  = report.netProfit >= 0 ? 'NET PROFIT' : 'NET LOSS';
    doc.rect(MARGIN, y, INNER_W, 40).fill(C.black);
    drawDotPattern(doc, MARGIN, y, INNER_W, 40);
    doc.rect(MARGIN, y, 4, 40).fill(netColor);
    doc.fillColor(C.gray3).fontSize(10).font('Helvetica').text(netLabel, MARGIN + 18, y + 13);
    doc.fillColor(netColor).fontSize(16).font('Helvetica-Bold')
      .text(rupeeFmt(Math.abs(report.netProfit || 0)), 0, y + 11, { align: 'right', width: PAGE_W - MARGIN - 10 });

    drawFooter(doc, 'Profit & Loss Statement · System generated · NEXUS ERP');
    doc.end();
  });
};

// ─────────────────────────────────────────────────────────
// BALANCE SHEET PDF
// ─────────────────────────────────────────────────────────
const generateBalanceSheetPDF = (report) => {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: MARGIN, size: 'A4' });
    const chunks = [];
    doc.on('data',  c => chunks.push(c));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ── Header ──
    drawHeader(doc, 'BALANCE SHEET', `As of ${new Date().toLocaleDateString('en-IN')} · NEXUS ERP`, [
      `Generated: ${new Date().toLocaleDateString('en-IN')}`,
    ]);

    // ── Summary Cards ──
    let y = 108;
    const bsCards = [
      { label: 'TOTAL ASSETS',      value: report.totalAssets,      accent: C.green,  bg: C.greenBg  },
      { label: 'TOTAL LIABILITIES', value: report.totalLiabilities, accent: C.red,    bg: C.redBg    },
      { label: 'TOTAL EQUITY',      value: report.totalEquity,      accent: C.purple, bg: C.purpleBg },
    ];
    const cardW = (INNER_W - 24) / 3;
    bsCards.forEach((card, i) => {
      const cx = MARGIN + i * (cardW + 12);
      doc.rect(cx, y, cardW, 68).fill(card.bg);
      doc.rect(cx, y, cardW, 3).fill(card.accent);
      doc.fillColor(card.accent).fontSize(7.5).font('Helvetica-Bold')
        .text(card.label, cx + 10, y + 14, { characterSpacing: 1, width: cardW - 20 });
      doc.fillColor(C.black).fontSize(15).font('Helvetica-Bold')
        .text(rupeeFmt(card.value || 0), cx + 10, y + 32, { width: cardW - 20 });
    });
    y += 84;

    // ── Section renderer ──
    const drawBSSection = (title, items, total, accent, bg, bdColor) => {
      y = sectionHeader(doc, title, y, accent);

      doc.rect(MARGIN, y, INNER_W, 18).fill(C.gray1);
      doc.fillColor(C.gray3).fontSize(7.5).font('Helvetica-Bold')
        .text('CODE · ACCOUNT', MARGIN + 10, y + 5, { characterSpacing: 0.8 })
        .text('BALANCE', MARGIN + 10, y + 5, { align: 'right', width: INNER_W - 20, characterSpacing: 0.8 });
      y += 18;

      (items || []).forEach((a, i) => {
        tableRow(doc, [], y, i, 22);
        doc.fillColor(C.gray4).fontSize(8).font('Helvetica')
          .text(`${a.code}`, MARGIN + 10, y + 7);
        doc.fillColor(C.black).fontSize(9).font('Helvetica')
          .text(a.name, MARGIN + 44, y + 7, { width: 280 });
        doc.fillColor(accent).fontSize(9).font('Helvetica-Bold')
          .text(rupeeFmt(a.balance), MARGIN + 10, y + 7, { align: 'right', width: INNER_W - 20 });
        y += 22;
      });

      doc.rect(MARGIN, y, INNER_W, 26).fill(bg);
      doc.rect(MARGIN, y, INNER_W, 2).fill(bdColor);
      doc.fillColor(accent).fontSize(10).font('Helvetica-Bold')
        .text(`Total ${title}`, MARGIN + 10, y + 8)
        .text(rupeeFmt(total), MARGIN + 10, y + 8, { align: 'right', width: INNER_W - 20 });
      y += 38;
    };

    drawBSSection('ASSETS',      report.assets,      report.totalAssets,      C.green,  C.greenBg,  C.greenBd);
    drawBSSection('LIABILITIES', report.liabilities, report.totalLiabilities, C.red,    C.redBg,    C.redBd);
    drawBSSection('EQUITY',      report.equity,      report.totalEquity,      C.purple, C.purpleBg, '#DDD6FE');

    // ── Balance check ──
    const balanced = Math.abs((report.totalAssets || 0) - ((report.totalLiabilities || 0) + (report.totalEquity || 0))) < 1;
    doc.rect(MARGIN, y, INNER_W, 32).fill(balanced ? C.greenBg : C.redBg);
    doc.rect(MARGIN, y, INNER_W, 2).fill(balanced ? C.green : C.red);
    doc.fillColor(balanced ? C.green : C.red).fontSize(9).font('Helvetica-Bold')
      .text(balanced ? '✓  Balance Sheet is balanced (Assets = Liabilities + Equity)' : '⚠  Balance Sheet is NOT balanced — please review entries',
        MARGIN + 12, y + 11, { width: INNER_W - 24 });

    drawFooter(doc, 'Balance Sheet · System generated · NEXUS ERP');
    doc.end();
  });
};

module.exports = { generateInvoicePDF, generatePayslipPDF, generatePLReportPDF, generateBalanceSheetPDF };