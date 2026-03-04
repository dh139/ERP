import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';

import { fetchMe } from './features/auth/authSlice';

import ProtectedRoute from './routes/ProtectedRoute';
import Layout       from './components/Layout/Layout';
import Login        from './pages/Login/Login';
import Register       from './pages/Login/Register';

import Dashboard    from './pages/Dashboard/Dashboard';
import Inventory    from './pages/Inventory/Inventory';
import CRM          from './pages/CRM/CRM';
import HR           from './pages/HR/HR';
import Accounting   from './pages/Accounting/Accounting';

const App = () => {
  const dispatch = useDispatch();
  const { initialized } = useSelector((state) => state.auth);

  // On app load, check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) dispatch(fetchMe());
    else dispatch({ type: 'auth/me/rejected' });
  }, [dispatch]);

  // Show loading spinner until auth is checked
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🏪</div>
          <p className="text-gray-500 text-sm">Loading ERP...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
       {/* Public */}
 <Route path="/login" element={<Login />} />
<Route path="/register" element={<Register />} />
        {/* Protected */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/inventory" element={
          <ProtectedRoute>
            <Layout><Inventory /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/crm" element={
          <ProtectedRoute>
            <Layout><CRM /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/hr" element={
          <ProtectedRoute>
            <Layout><HR /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/accounting" element={
          <ProtectedRoute>
            <Layout><Accounting /></Layout>
          </ProtectedRoute>
        } />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;