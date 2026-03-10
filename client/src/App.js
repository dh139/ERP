import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { fetchMe } from './features/auth/authSlice';

import PublicRoute   from './routes/PublicRoute';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout        from './components/Layout/Layout';

import Home       from './pages/Home/Home';
import Login      from './pages/Login/Login';
import Register   from './pages/Login/Register';
import Dashboard  from './pages/Dashboard/Dashboard';
import Inventory  from './pages/Inventory/Inventory';
import CRM        from './pages/CRM/CRM';
import HR         from './pages/HR/HR';
import Accounting from './pages/Accounting/Accounting';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(s => s.auth);

  useEffect(() => {
    // Restore session on page refresh
    const token = localStorage.getItem('accessToken');
    if (token) dispatch(fetchMe());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>

        {/* Home — redirects to dashboard if logged in */}
        <Route path="/" element={
          <PublicRoute><Home /></PublicRoute>
        } />

        {/* Auth — not accessible when logged in */}
        <Route path="/login" element={
          <PublicRoute><Login /></PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute><Register /></PublicRoute>
        } />

        {/* Protected App Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
        } />
        <Route path="/inventory" element={
          <ProtectedRoute><Layout><Inventory /></Layout></ProtectedRoute>
        } />
        <Route path="/crm" element={
          <ProtectedRoute><Layout><CRM /></Layout></ProtectedRoute>
        } />
        <Route path="/hr" element={
          <ProtectedRoute><Layout><HR /></Layout></ProtectedRoute>
        } />
        <Route path="/accounting" element={
          <ProtectedRoute><Layout><Accounting /></Layout></ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;