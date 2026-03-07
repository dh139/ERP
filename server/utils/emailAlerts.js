const sendEmail  = require('./sendEmail');
const Stock      = require('../modules/inventory/stock.model');
const Invoice    = require('../modules/accounting/invoice.model');

// ── Low Stock Alert ───────────────────────────────────────
const sendLowStockAlert = async (adminEmail) => {
  const allStock = await Stock.find()
    .populate('product', 'name sku')
    .populate('warehouse', 'name');
  const lowStock = allStock.filter(s => s.quantity <= s.reorderLevel);

  if (lowStock.length === 0) return { success: true, message: 'No low stock items' };

  const rows = lowStock.map(s => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb">${s.product?.name}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-family:monospace">${s.product?.sku}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb">${s.warehouse?.name}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#DC2626;font-weight:bold">${s.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb">${s.reorderLevel}</td>
    </tr>
  `).join('');

  await sendEmail({
    to:      adminEmail,
    subject: `⚠️ Low Stock Alert — ${lowStock.length} items need reordering`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto">
        <div style="background:#DC2626;padding:25px;border-radius:8px 8px 0 0">
          <h1 style="color:white;margin:0;font-size:20px">⚠️ Low Stock Alert</h1>
          <p style="color:#FCA5A5;margin:5px 0 0">${lowStock.length} items are below reorder level</p>
        </div>
        <div style="padding:20px;background:#FFF7F7;border:1px solid #e5e7eb">
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#FEE2E2">
                <th style="padding:10px;text-align:left">Product</th>
                <th style="padding:10px;text-align:left">SKU</th>
                <th style="padding:10px;text-align:left">Warehouse</th>
                <th style="padding:10px;text-align:left">Current Qty</th>
                <th style="padding:10px;text-align:left">Reorder Level</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `,
  });

  return { success: true, count: lowStock.length };
};

// ── Overdue Invoice Reminder ──────────────────────────────
const sendOverdueReminders = async () => {
  await Invoice.updateMany(
    { status: { $in: ['sent','partial'] }, dueDate: { $lt: new Date() } },
    { status: 'overdue' }
  );

  const overdue = await Invoice.find({ status: 'overdue' })
    .populate('customer', 'name email');

  let sent = 0;
  for (const inv of overdue) {
    if (!inv.customer?.email) continue;
    await sendEmail({
      to:      inv.customer.email,
      subject: `🔴 Overdue Invoice ${inv.invoiceNumber} — Payment Required`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#DC2626;padding:25px;border-radius:8px 8px 0 0">
            <h1 style="color:white;margin:0;font-size:20px">Invoice Overdue</h1>
          </div>
          <div style="padding:25px;background:#FFF7F7;border:1px solid #e5e7eb">
            <p>Dear <strong>${inv.customer.name}</strong>,</p>
            <p>This is a reminder that invoice <strong>${inv.invoiceNumber}</strong> is overdue.</p>
            <div style="background:white;border-radius:8px;padding:20px;margin:15px 0;border:2px solid #DC2626">
              <p style="margin:0;font-size:16px">Amount Due: <strong style="color:#DC2626">Rs.${inv.balanceDue?.toLocaleString()}</strong></p>
              <p style="margin:5px 0 0;color:#6B7280;font-size:13px">Due Date: ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}</p>
            </div>
            <p style="color:#6B7280;font-size:13px">Please clear this payment immediately to avoid service disruption.</p>
          </div>
        </div>
      `,
    });
    sent++;
  }
  return { success: true, sent };
};

module.exports = { sendLowStockAlert, sendOverdueReminders };