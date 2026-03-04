import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';

const NAV_ITEMS = [
  { label: 'Dashboard',   path: '/dashboard',  icon: '📊', roles: ['superadmin','admin','hr_manager','accountant','sales','warehouse'] },
  { label: 'Inventory',   path: '/inventory',  icon: '📦', roles: ['superadmin','admin','warehouse','sales','accountant'] },
  { label: 'CRM & Sales', path: '/crm',        icon: '🤝', roles: ['superadmin','admin','sales'] },
  { label: 'HR & Payroll',path: '/hr',         icon: '👥', roles: ['superadmin','admin','hr_manager'] },
  { label: 'Accounting',  path: '/accounting', icon: '💰', roles: ['superadmin','admin','accountant'] },
];

const Sidebar = ({ isOpen }) => {
  const { user } = useSelector((state) => state.auth);

  const visibleItems = NAV_ITEMS.filter(item =>
    item.roles.includes(user?.role)
  );

  return (
    <aside className={`
      fixed left-0 top-0 h-full bg-primary-900 text-white z-40
      transition-all duration-300
      ${isOpen ? 'w-64' : 'w-16'}
    `}>
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-blue-800">
        <span className="text-2xl">🏪</span>
        {isOpen && (
          <span className="ml-3 font-bold text-lg tracking-wide">ERP System</span>
        )}
      </div>

      {/* Nav Items */}
      <nav className="mt-4 px-2">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-3 rounded-lg mb-1
              transition-colors duration-150 text-sm font-medium
              ${isActive
                ? 'bg-primary-600 text-white'
                : 'text-blue-200 hover:bg-blue-800 hover:text-white'}
            `}
          >
            <span className="text-xl flex-shrink-0">{item.icon}</span>
            {isOpen && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Role badge at bottom */}
      {isOpen && (
        <div className="absolute bottom-6 left-0 w-full px-4">
          <div className="bg-blue-800 rounded-lg px-3 py-2 text-center">
            <p className="text-xs text-blue-300">Logged in as</p>
            <p className="text-sm font-semibold capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;