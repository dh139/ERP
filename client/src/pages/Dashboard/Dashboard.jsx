import { useSelector } from 'react-redux';

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      </div>
      <div className="text-4xl">{icon}</div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome back, {user?.name} 👋
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Here's what's happening in your ERP today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon="📦" label="Total Products"    value="—"  color="text-blue-600" />
        <StatCard icon="🛒" label="Orders Today"      value="—"  color="text-green-600" />
        <StatCard icon="💰" label="Revenue (Month)"   value="—"  color="text-purple-600" />
        <StatCard icon="⚠️" label="Low Stock Alerts"  value="—"  color="text-red-600" />
      </div>

      {/* Modules Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 Module Status</h2>
          <div className="space-y-3">
            {[
              { name: 'Inventory & Warehouse', status: 'Coming — Phase 2', color: 'bg-yellow-100 text-yellow-700' },
              { name: 'CRM & Sales',           status: 'Coming — Phase 2', color: 'bg-yellow-100 text-yellow-700' },
              { name: 'HR & Payroll',          status: 'Coming — Phase 3', color: 'bg-gray-100 text-gray-500'   },
              { name: 'Accounting & Finance',  status: 'Coming — Phase 4', color: 'bg-gray-100 text-gray-500'   },
            ].map((mod) => (
              <div key={mod.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{mod.name}</span>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${mod.color}`}>
                  {mod.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">👤 Your Account</h2>
          <div className="space-y-3">
            {[
              { label: 'Name',       value: user?.name },
              { label: 'Email',      value: user?.email },
              { label: 'Role',       value: user?.role?.replace('_', ' ') },
              { label: 'Department', value: user?.department || 'Not assigned' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{item.label}</span>
                <span className="text-sm font-medium text-gray-800 capitalize">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;