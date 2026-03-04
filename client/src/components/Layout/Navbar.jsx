import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../features/auth/authSlice';

const Navbar = ({ isOpen, toggleSidebar }) => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { user }  = useSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <header className={`
      fixed top-0 right-0 h-16 bg-white border-b border-gray-200
      flex items-center justify-between px-6 z-30 shadow-sm
      transition-all duration-300
      ${isOpen ? 'left-64' : 'left-16'}
    `}>
      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-5 h-0.5 bg-gray-600 mb-1"></div>
        <div className="w-5 h-0.5 bg-gray-600 mb-1"></div>
        <div className="w-5 h-0.5 bg-gray-600"></div>
      </button>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notification bell placeholder */}
        <button className="p-2 rounded-lg hover:bg-gray-100 relative">
          <span className="text-xl">🔔</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User menu */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;