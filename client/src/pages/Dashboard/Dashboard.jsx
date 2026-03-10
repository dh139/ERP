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
const fmt = (n) => {
  if (!n && n !== 0) return '—';
  if (n >= 10000000) return `₹${(n/10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `₹${(n/100000).toFixed(1)}L`;
  if (n >= 1000)     return `₹${(n/1000).toFixed(1)}K`;
  return `₹${n.toLocaleString()}`;
};
const pct = (n) => `${Number(n) > 0 ? '+' : ''}${n}%`;
const COLORS = ['#FFD966','#FF6B35','#0EA5E9','#16A34A','#8B5CF6','#EC4899','#0891B2'];

// ── Custom Tooltip ────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0A0A0A', border: '1.5px solid #2A2A2A',
      borderRadius: 12, padding: '12px 16px', fontFamily: "'DM Sans', sans-serif",
      boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
    }}>
      <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 12, color: '#FFD966', marginBottom: 8, letterSpacing: '0.05em' }}>
        {label}
      </p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 13, color: '#CCC', marginBottom: 3, display: 'flex', justifyContent: 'space-between', gap: 20 }}>
          <span style={{ color: '#666' }}>{p.name}</span>
          <span style={{ color: 'white', fontWeight: 700 }}>
            {p.name === 'Orders' ? p.value : fmt(p.value)}
          </span>
        </p>
      ))}
    </div>
  );
};

// ── KPI Card ──────────────────────────────────────────────
const KPICard = ({ icon, label, value, sub, accent = '#FFD966', delay = 0 }) => (
  <div style={{
    background: 'white', border: '2px solid #F0F0EB', borderRadius: 16,
    padding: '24px 22px', position: 'relative', overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s',
    animation: `fadeUp 0.5s ease both`,
    animationDelay: `${delay}ms`,
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.1)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
  >
    {/* Top accent line */}
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent, borderRadius: '14px 14px 0 0' }} />

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ width: 44, height: 44, background: '#0A0A0A', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
        {icon}
      </div>
      {sub !== null && sub !== undefined && (
        <span style={{
          fontFamily: 'DM Sans', fontSize: 11, fontWeight: 700,
          background: '#F4F4F0', color: '#666', padding: '4px 10px', borderRadius: 100,
          border: '1.5px solid #E8E8E3',
        }}>{sub}</span>
      )}
    </div>
    <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 26, color: '#0A0A0A', margin: '16px 0 4px', letterSpacing: '-0.025em', lineHeight: 1 }}>
      {value ?? '—'}
    </p>
    <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#999', fontWeight: 500 }}>{label}</p>
  </div>
);

// ── Section Header ────────────────────────────────────────
const SectionHeader = ({ title, subtitle, action }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
    <div>
      <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 16, color: '#0A0A0A', letterSpacing: '-0.01em' }}>{title}</h2>
      {subtitle && <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#AAA', marginTop: 3 }}>{subtitle}</p>}
    </div>
    {action}
  </div>
);

// ── Chart Wrapper ─────────────────────────────────────────
const ChartCard = ({ children, style = {} }) => (
  <div style={{
    background: 'white', border: '2px solid #F0F0EB', borderRadius: 20,
    padding: '28px 28px 20px', ...style,
  }}>
    {children}
  </div>
);

// ── Empty Chart State ─────────────────────────────────────
const EmptyChart = ({ message, height = 220 }) => (
  <div style={{
    height, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  }}>
    <div style={{ fontSize: 32, opacity: 0.2 }}>📊</div>
    <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: '#CCC' }}>{message}</p>
  </div>
);

// ── Main Dashboard ────────────────────────────────────────
const Dashboard = () => {
  const dispatch = useDispatch();
  const { stats, revenueChart, salesTrend, topProducts } = useSelector(s => s.dashboard);
  const { user } = useSelector(s => s.auth);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchRevenueChart());
    dispatch(fetchSalesTrend());
    dispatch(fetchTopProducts());
  }, [dispatch]);

  const ac  = stats?.accounting || {};
  const cr  = stats?.crm        || {};
  const inv = stats?.inventory  || {};
  const hr  = stats?.hr         || {};

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div style={{ fontFamily: "'Syne', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.85); }
        }

        .dash-section { animation: fadeUp 0.5s ease both; }
        .quick-action-btn {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 16px;
          background: white; border: 2px solid #F0F0EB; border-radius: 14px;
          cursor: pointer; transition: all 0.18s; text-decoration: none;
        }
        .quick-action-btn:hover {
          background: #0A0A0A; border-color: #0A0A0A;
          transform: translateY(-3px);
          box-shadow: 0 10px 28px rgba(0,0,0,0.15);
        }
        .quick-action-btn:hover .qa-label { color: white; }
        .quick-action-btn:hover .qa-icon-wrap { background: #FFD966; }

        .alert-card {
          display: flex; align-items: flex-start; gap: 16px;
          border-radius: 16px; padding: 20px 22px;
          animation: fadeUp 0.5s ease both;
        }
        .alert-btn {
          padding: 9px 20px; border: none; border-radius: 8px;
          font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px;
          cursor: pointer; flex-shrink: 0; transition: opacity 0.15s;
          text-decoration: none; display: inline-block;
        }
        .alert-btn:hover { opacity: 0.85; }
      `}</style>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36, animation: 'fadeUp 0.4s ease both' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFF8E7', border: '1.5px solid #FFD966', borderRadius: 100, padding: '5px 14px', marginBottom: 14 }}>
            <div style={{ width: 7, height: 7, background: '#16A34A', borderRadius: '50%', animation: 'pulse-dot 2s infinite' }}></div>
            <span style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 600, color: '#92600A' }}>All systems operational</span>
          </div>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 30, letterSpacing: '-0.025em', color: '#0A0A0A', lineHeight: 1.1 }}>
            {greeting()},{' '}
            <span style={{ position: 'relative', display: 'inline-block' }}>
              <span style={{ position: 'relative', zIndex: 1 }}>{user?.name?.split(' ')[0] || 'Admin'} 👋</span>
              <span style={{ position: 'absolute', bottom: 2, left: -2, right: -2, height: '35%', background: '#FFD966', zIndex: 0, borderRadius: 3 }}></span>
            </span>
          </h1>
          <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: '#AAA', marginTop: 6 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Live badge */}
        <div style={{ background: '#0A0A0A', borderRadius: 14, padding: '14px 22px', textAlign: 'right' }}>
          <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 11, color: '#FFD966', letterSpacing: '0.08em', marginBottom: 4 }}>NEXUS ERP</p>
          <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#666' }}>
            {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* ── Finance KPIs ── */}
      <div className="dash-section" style={{ animationDelay: '0.05s', marginBottom: 28 }}>
        <SectionHeader
          title="💰 Finance Overview"
          subtitle="Revenue, expenses and net profit"
          action={
            <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 11, color: '#AAA', letterSpacing: '0.06em' }}>
              ACCOUNTING MODULE
            </span>
          }
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <KPICard icon="💵" label="Total Revenue"    accent="#16A34A" delay={0}
            value={fmt(ac.totalRevenue)}
            sub={ac.revenueGrowth ? pct(ac.revenueGrowth) : null} />
          <KPICard icon="📤" label="Total Expenses"   accent="#DC2626" delay={60}
            value={fmt(ac.totalExpenses)} />
          <KPICard icon="📈" label="Net Profit"       accent="#2563EB" delay={120}
            value={fmt(ac.netProfit)}
            sub={ac.netProfit >= 0 ? '✓ Profitable' : '↓ Net Loss'} />
          <KPICard icon="🔴" label="Overdue Invoices" accent="#FF6B35" delay={180}
            value={ac.overdueCount ?? '0'}
            sub={ac.pendingExpenses ? `${ac.pendingExpenses} exp. pending` : null} />
        </div>
      </div>

      {/* ── Operations KPIs ── */}
      <div className="dash-section" style={{ animationDelay: '0.1s', marginBottom: 28 }}>
        <SectionHeader
          title="⚙️ Operations Overview"
          subtitle="CRM, inventory and HR at a glance"
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <KPICard icon="🛒" label="This Month Orders"  accent="#0EA5E9" delay={0}
            value={cr.monthOrders ?? '0'}
            sub={`${cr.totalOrders ?? 0} total orders`} />
          <KPICard icon="👥" label="Active Customers"   accent="#8B5CF6" delay={60}
            value={cr.totalCustomers ?? '0'}
            sub={`${cr.totalLeads ?? 0} active leads`} />
          <KPICard icon="📦" label="Low Stock Items"    accent="#DC2626" delay={120}
            value={inv.lowStockCount ?? '0'}
            sub={`${inv.totalProducts ?? 0} products total`} />
          <KPICard icon="👤" label="Employees"          accent="#FFD966" delay={180}
            value={hr.totalEmployees ?? '0'}
            sub={hr.monthlyPayroll ? `${fmt(hr.monthlyPayroll)} payroll` : null} />
        </div>
      </div>

      {/* ── Revenue vs Expenses Chart ── */}
      <div className="dash-section" style={{ animationDelay: '0.15s', marginBottom: 28 }}>
        <ChartCard>
          <SectionHeader
            title="📊 Revenue vs Expenses"
            subtitle="Last 6 months financial performance"
            action={
              <div style={{ display: 'flex', gap: 8 }}>
                {[['Revenue','#2563EB'],['Expenses','#FCA5A5'],['Profit','#16A34A']].map(([l,c]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: c }}></div>
                    <span style={{ fontFamily: 'DM Sans', fontSize: 11, color: '#999' }}>{l}</span>
                  </div>
                ))}
              </div>
            }
          />
          {!revenueChart?.length ? (
            <EmptyChart message="Add invoices & expenses to see performance chart" height={280} />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueChart} barGap={3} barCategoryGap="32%">
                <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontFamily: 'DM Sans', fontSize: 12, fill: '#BBB' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => v >= 1000 ? `₹${v/1000}K` : `₹${v}`} tick={{ fontFamily: 'DM Sans', fontSize: 11, fill: '#BBB' }} axisLine={false} tickLine={false} width={58} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                <Bar dataKey="revenue"  name="Revenue"  fill="#0A0A0A" radius={[6,6,0,0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#E8E8E3" radius={[6,6,0,0]} />
                <Bar dataKey="profit"   name="Profit"   fill="#FFD966" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── Sales Trend + Top Products ── */}
      <div className="dash-section" style={{ animationDelay: '0.2s', marginBottom: 28 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>

          {/* Sales Trend */}
          <ChartCard>
            <SectionHeader title="📦 Sales Orders Trend" subtitle="Order volume & value — last 6 months" />
            {!salesTrend?.length ? (
              <EmptyChart message="Create sales orders to see trend" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontFamily: 'DM Sans', fontSize: 12, fill: '#BBB' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left"  tick={{ fontFamily: 'DM Sans', fontSize: 11, fill: '#BBB' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right"
                    tickFormatter={v => v >= 1000 ? `₹${v/1000}K` : `₹${v}`}
                    tick={{ fontFamily: 'DM Sans', fontSize: 11, fill: '#BBB' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line yAxisId="left"  type="monotone" dataKey="orders" name="Orders"
                    stroke="#0A0A0A" strokeWidth={2.5}
                    dot={{ r: 4, fill: '#0A0A0A', strokeWidth: 0 }}
                    activeDot={{ r: 7, fill: '#FFD966' }} />
                  <Line yAxisId="right" type="monotone" dataKey="value" name="Value"
                    stroke="#FFD966" strokeWidth={2.5}
                    dot={{ r: 4, fill: '#FFD966', strokeWidth: 0 }}
                    activeDot={{ r: 7, fill: '#0A0A0A' }}
                    strokeDasharray="6 3" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Top Products */}
          <ChartCard>
            <SectionHeader title="🏆 Top Selling Products" subtitle="By units sold across all orders" />
            {!topProducts?.length ? (
              <EmptyChart message="Add sales orders to see top products" />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ flexShrink: 0 }}>
                  <ResponsiveContainer width={160} height={180}>
                    <PieChart>
                      <Pie data={topProducts} cx="50%" cy="50%"
                        innerRadius={46} outerRadius={76}
                        dataKey="quantity" paddingAngle={4}>
                        {topProducts.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v, n) => [`${v} units`, n]}
                        contentStyle={{ fontFamily: 'DM Sans', fontSize: 12, borderRadius: 10, border: '1.5px solid #E8E8E3' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 180, overflowY: 'auto' }}>
                  {topProducts.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, flexShrink: 0, background: COLORS[i % COLORS.length] }}></div>
                        <span style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                      </div>
                      <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 12, color: '#0A0A0A', flexShrink: 0, background: '#F4F4F0', padding: '2px 8px', borderRadius: 6 }}>
                        {p.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ChartCard>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="dash-section" style={{ animationDelay: '0.25s', marginBottom: 28 }}>
        <ChartCard>
          <SectionHeader title="⚡ Quick Actions" subtitle="Jump directly to key tasks" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {[
              { icon: '🧾', label: 'New Invoice',     href: '/accounting' },
              { icon: '📦', label: 'Add Product',     href: '/inventory' },
              { icon: '👤', label: 'Add Customer',    href: '/crm' },
              { icon: '👥', label: 'Add Employee',    href: '/hr' },
              { icon: '💸', label: 'Log Expense',     href: '/accounting' },
              { icon: '🛒', label: 'New Sales Order', href: '/crm' },
              { icon: '📋', label: 'Process Payroll', href: '/hr' },
              { icon: '📊', label: 'View Reports',    href: '/accounting' },
            ].map((a, i) => (
              <a key={i} href={a.href} className="quick-action-btn" style={{ animationDelay: `${i * 30}ms` }}>
                <div className="qa-icon-wrap" style={{ width: 36, height: 36, background: '#F4F4F0', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0, transition: 'background 0.18s' }}>
                  {a.icon}
                </div>
                <span className="qa-label" style={{ fontFamily: 'DM Sans', fontWeight: 500, fontSize: 13, color: '#444', transition: 'color 0.18s' }}>
                  {a.label}
                </span>
              </a>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* ── Alerts ── */}
      {inv.lowStockCount > 0 && (
        <div className="alert-card" style={{ background: '#FFF8F8', border: '2px solid #FECACA', animationDelay: '0.3s', marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, background: '#DC2626', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>⚠️</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 14, color: '#991B1B', marginBottom: 4 }}>Low Stock Alert</p>
            <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: '#EF4444', lineHeight: 1.5 }}>
              {inv.lowStockCount} product{inv.lowStockCount > 1 ? 's are' : ' is'} below reorder level. Restock soon to avoid order failures.
            </p>
          </div>
          <a href="/inventory" className="alert-btn" style={{ background: '#DC2626', color: 'white' }}>
            View Stock →
          </a>
        </div>
      )}

      {ac.overdueCount > 0 && (
        <div className="alert-card" style={{ background: '#FFFBEB', border: '2px solid #FDE68A', animationDelay: '0.35s', marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, background: '#FF6B35', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🔴</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 14, color: '#92400E', marginBottom: 4 }}>Overdue Invoices</p>
            <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: '#D97706', lineHeight: 1.5 }}>
              {ac.overdueCount} invoice{ac.overdueCount > 1 ? 's are' : ' is'} past due date. Follow up with customers immediately.
            </p>
          </div>
          <a href="/accounting" className="alert-btn" style={{ background: '#FF6B35', color: 'white' }}>
            View Invoices →
          </a>
        </div>
      )}

    </div>
  );
};

export default Dashboard;