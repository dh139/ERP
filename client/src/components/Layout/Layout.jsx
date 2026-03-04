import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar  from './Navbar';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} />
      <Navbar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <main className={`
        pt-16 min-h-screen transition-all duration-300
        ${sidebarOpen ? 'ml-64' : 'ml-16'}
      `}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;