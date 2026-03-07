import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchDashboardStats, fetchRevenueChart,
  fetchSalesTrend, fetchTopProducts,
} from '../../features/dashboard/dashboardSlice';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// ── Helpers ───────────────────────────────────────────────
const fmt = (n) => n >= 100000
  ? `₹${(n/100000).toFixed(1)}L`
  : n >= 1000
  ? `₹${(n/1000).toFixed(1)}K`
  : `₹${(n||0).toLocaleString()}`;

const pct = (n) => `${n > 0 ? '+' : ''}${n}%`;

const COLORS = ['#2563EB','#16A34A','#DC2626','#D97706','#7C3AED','#0891B2','#DB2777'];

// ── Stat Card ─────────────────────────────────────────────
const KPICard = ({ icon, label, value, sub, subColor = 'text-gray-400', color = 'blue' }) => {
  const bg = {
    blue:   'from-blue-500 to-blue-600',
    green:  'from-green-500 to-green-600',
    red:    'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    teal:   'from-teal-500 to-teal-600',
  }[color] || 'from-blue-500 to-blue-600';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center text-xl shadow-sm`}>
          {icon}
        </div>
        {sub && <span className={`text-xs font-semibold px-2 py-1 rounded-full ${subColor}`}>{sub}</span>}
      </div>
      <p className="text-2xl font-bold text-gray-800 mb-1">{value ?? '—'}</p>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
    </div>
  );
};

// ── Section Header ────────────────────────────────────────
const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-4">
    <h2 className="text-base font-bold text-gray-800">{title}</h2>
    {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
  </div>
);

// ── Custom Tooltip ────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-bold text-gray-700 mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.name === 'Orders' ? p.value : fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────
const Dashboard = () => {
  const dispatch = useDispatch();
  const { stats, revenueChart, salesTrend, topProducts, loading } = useSelector(s => s.dashboard);
  const { user } = useSelector(s => s.auth);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchRevenueChart());
    dispatch(fetchSalesTrend());
    dispatch(fetchTopProducts());
  }, [dispatch]);

  const ac = stats?.accounting || {};
  const cr = stats?.crm        || {};
  const inv= stats?.inventory  || {};
  const hr = stats?.hr         || {};

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs font-semibold text-green-700">All Systems Live</span>
        </div>
      </div>

      {/* ── Finance KPIs ── */}
      <div>
        <SectionHeader title="💰 Finance Overview" subtitle="Revenue, expenses and profit summary" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard icon="💵" label="Total Revenue"      color="green"  value={fmt(ac.totalRevenue)}
            sub={ac.revenueGrowth ? pct(ac.revenueGrowth) : null}
            subColor={ac.revenueGrowth >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'} />
          <KPICard icon="📤" label="Total Expenses"     color="red"    value={fmt(ac.totalExpenses)} />
          <KPICard icon="📈" label="Net Profit"         color="blue"   value={fmt(ac.netProfit)}
            sub={ac.netProfit >= 0 ? 'Profitable' : 'Net Loss'}
            subColor={ac.netProfit >= 0 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600'} />
          <KPICard icon="🔴" label="Overdue Invoices"   color="orange" value={ac.overdueCount ?? '—'}
            sub={ac.pendingExpenses ? `${ac.pendingExpenses} exp. pending` : null}
            subColor="bg-orange-100 text-orange-700" />
        </div>
      </div>

      {/* ── CRM + Inventory + HR KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon="🛒" label="This Month Orders"   color="blue"   value={cr.monthOrders ?? '—'}
          sub={`${cr.totalOrders ?? 0} total`} subColor="bg-blue-50 text-blue-500" />
        <KPICard icon="👥" label="Active Customers"    color="teal"   value={cr.totalCustomers ?? '—'}
          sub={`${cr.totalLeads ?? 0} active leads`} subColor="bg-teal-50 text-teal-600" />
        <KPICard icon="📦" label="Low Stock Items"     color="red"    value={inv.lowStockCount ?? '—'}
          sub={`${inv.totalProducts ?? 0} products`} subColor="bg-red-50 text-red-500" />
        <KPICard icon="👤" label="Employees"           color="purple" value={hr.totalEmployees ?? '—'}
          sub={hr.monthlyPayroll ? `₹${Math.round(hr.monthlyPayroll/1000)}K payroll` : null}
          subColor="bg-purple-50 text-purple-600" />
      </div>

      {/* ── Revenue vs Expenses Chart ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <SectionHeader
          title="📊 Revenue vs Expenses"
          subtitle="Last 6 months financial performance" />
        {revenueChart.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-300 text-sm">
            No data yet — add invoices and expenses to see chart
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueChart} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => v >= 1000 ? `₹${v/1000}K` : `₹${v}`} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Bar dataKey="revenue"  name="Revenue"  fill="#2563EB" radius={[6,6,0,0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#FCA5A5" radius={[6,6,0,0]} />
              <Bar dataKey="profit"   name="Profit"   fill="#16A34A" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Sales Trend + Top Products ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Sales Trend */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <SectionHeader
            title="📦 Sales Orders Trend"
            subtitle="Order volume last 6 months" />
          {salesTrend.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-gray-300 text-sm">
              No orders yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left"  tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right"
                  tickFormatter={v => v >= 1000 ? `₹${v/1000}K` : `₹${v}`}
                  tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Line yAxisId="left"  type="monotone" dataKey="orders" name="Orders"
                  stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4, fill: '#2563EB' }}
                  activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="value"  name="Value"
                  stroke="#16A34A" strokeWidth={2.5} dot={{ r: 4, fill: '#16A34A' }}
                  activeDot={{ r: 6 }} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <SectionHeader
            title="🏆 Top Selling Products"
            subtitle="By quantity sold" />
          {topProducts.length === 0 ? (
            <div className="h-52 flex items-center justify-center flex-col gap-3">
              <p className="text-gray-300 text-sm">No sales data yet</p>
              <p className="text-gray-300 text-xs">Create sales orders to see top products</p>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={topProducts} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    dataKey="quantity" paddingAngle={3}>
                    {topProducts.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v + ' units', n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2 overflow-auto max-h-52">
                {topProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }}></div>
                      <span className="text-xs text-gray-600 truncate">{p.name}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-800 flex-shrink-0">{p.quantity} units</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <SectionHeader title="⚡ Quick Actions" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: '🧾', label: 'New Invoice',      href: '/accounting' },
            { icon: '📦', label: 'Add Product',      href: '/inventory' },
            { icon: '👤', label: 'Add Customer',     href: '/crm' },
            { icon: '👥', label: 'Add Employee',     href: '/hr' },
            { icon: '💸', label: 'Log Expense',      href: '/accounting' },
            { icon: '🛒', label: 'New Sales Order',  href: '/crm' },
            { icon: '📋', label: 'Process Payroll',  href: '/hr' },
            { icon: '📊', label: 'View Reports',     href: '/accounting' },
          ].map(action => (
            <a key={action.label} href={action.href}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-all group cursor-pointer">
              <span className="text-xl">{action.icon}</span>
              <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">{action.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* ── Stock Alerts ── */}
      {inv.lowStockCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="text-3xl">⚠️</div>
          <div className="flex-1">
            <p className="font-bold text-red-700">Low Stock Alert</p>
            <p className="text-sm text-red-500 mt-1">
              {inv.lowStockCount} product{inv.lowStockCount > 1 ? 's are' : ' is'} below reorder level.
              Go to Inventory → Stock to review.
            </p>
          </div>
          <a href="/inventory"
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex-shrink-0">
            View Stock
          </a>
        </div>
      )}

      {/* ── Overdue Alert ── */}
      {ac.overdueCount > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="text-3xl">🔴</div>
          <div className="flex-1">
            <p className="font-bold text-orange-700">Overdue Invoices</p>
            <p className="text-sm text-orange-500 mt-1">
              {ac.overdueCount} invoice{ac.overdueCount > 1 ? 's are' : ' is'} overdue.
              Go to Accounting → Invoices to follow up.
            </p>
          </div>
          <a href="/accounting"
            className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 flex-shrink-0">
            View Invoices
          </a>
        </div>
      )}

    </div>
  );
};

export default Dashboard;