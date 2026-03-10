import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

const Register = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const [loading, setLoading]   = useState(false);
  const [regError, setRegError] = useState('');
  const [success, setSuccess]   = useState('');

  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    setRegError('');
    try {
      await api.post('/auth/register', {
        name:       data.name,
        email:      data.email,
        password:   data.password,
        role:       data.role,
        department: data.department,
      });
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setRegError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const ROLES = [
    { value: 'superadmin',  label: '👑 Super Admin' },
    { value: 'admin',       label: '🛡️ Admin' },
    { value: 'hr_manager',  label: '👥 HR Manager' },
    { value: 'accountant',  label: '💰 Accountant' },
    { value: 'sales',       label: '🤝 Sales' },
    { value: 'warehouse',   label: '📦 Warehouse' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Syne', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .r-input {
          width: 100%;
          padding: 13px 16px;
          border: 2px solid #E8E8E3;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          color: #0A0A0A;
          background: white;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          appearance: none;
          -webkit-appearance: none;
        }
        .r-input:focus {
          border-color: #0A0A0A;
          box-shadow: 0 0 0 4px rgba(10,10,10,0.06);
        }
        .r-input::placeholder { color: #BBBBBB; }

        .r-select {
          width: 100%;
          padding: 13px 16px;
          border: 2px solid #E8E8E3;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          color: #0A0A0A;
          background: white;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
          padding-right: 44px;
        }
        .r-select:focus {
          border-color: #0A0A0A;
          box-shadow: 0 0 0 4px rgba(10,10,10,0.06);
        }

        .r-btn {
          width: 100%;
          padding: 15px;
          background: #0A0A0A;
          color: white;
          border: none;
          border-radius: 10px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
          letter-spacing: 0.01em;
        }
        .r-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.22);
        }
        .r-btn:active:not(:disabled) { transform: translateY(0); }
        .r-btn:disabled { background: #999; cursor: not-allowed; transform: none; }

        .r-left {
          width: 40%;
          background: #0A0A0A;
          padding: 56px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }
        .r-right {
          flex: 1;
          background: #FAFAF8;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 60px 48px;
          overflow-y: auto;
        }
        .dot-bg {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }
        .glow-top {
          position: absolute;
          top: -100px;
          right: -100px;
          width: 380px;
          height: 380px;
          background: radial-gradient(circle, rgba(255,217,102,0.10) 0%, transparent 65%);
          pointer-events: none;
        }
        .ferr { font-family: 'DM Sans', sans-serif; font-size: 12px; color: #DC2626; margin-top: 5px; }

        .step-item {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .step-num {
          width: 30px;
          height: 30px;
          background: #FFD966;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 13px;
          color: #0A0A0A;
          flex-shrink: 0;
        }
        .benefit-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 11px 0;
          border-bottom: 1px solid rgba(255,255,255,0.055);
        }
        .benefit-row:last-child { border-bottom: none; }

        @media (max-width: 768px) {
          .r-left { display: none !important; }
          .r-right { padding: 40px 24px !important; align-items: flex-start !important; }
        }
      `}</style>

      {/* ── Left Panel ── */}
      <div className="r-left">
        <div className="dot-bg" />
        <div className="glow-top" />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 56 }}>
            <div style={{ width: 38, height: 38, background: '#FFD966', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19 }}>⚡</div>
            <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, color: 'white', letterSpacing: '-0.02em' }}>NEXUS ERP</span>
          </div>

          <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 36, color: 'white', lineHeight: 1.08, letterSpacing: '-0.028em', marginBottom: 14 }}>
            Get started<br />in minutes.
          </h2>
          <p style={{ fontFamily: 'DM Sans', fontSize: 14, color: '#5A5A5A', lineHeight: 1.75, marginBottom: 44 }}>
            Set up your account and get access to all modules immediately.
          </p>

          {/* Steps */}
          <div style={{ marginBottom: 44 }}>
            <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 11, color: '#FFD966', letterSpacing: '0.1em', marginBottom: 20 }}>HOW IT WORKS</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {[
                'Fill in your details below',
                'Choose your role & department',
                'Log in and explore your dashboard',
              ].map((s, i) => (
                <div key={i} className="step-item">
                  <div className="step-num">{i + 1}</div>
                  <span style={{ fontFamily: 'DM Sans', fontSize: 14, color: '#888', fontWeight: 500 }}>{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div>
            <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 11, color: '#FFD966', letterSpacing: '0.1em', marginBottom: 14 }}>INCLUDED FREE</p>
            {[
              'All 4 modules — Inventory, CRM, HR, Accounting',
              'PDF invoice & payslip generation',
              'Email alerts & Excel exports',
              'Live dashboard with charts',
            ].map((b, i) => (
              <div key={i} className="benefit-row">
                <div style={{ width: 18, height: 18, background: '#16A34A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <span style={{ fontFamily: 'DM Sans', fontSize: 13, color: '#777', lineHeight: 1.5 }}>{b}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ position: 'relative', zIndex: 1, fontFamily: 'DM Sans', fontSize: 12, color: '#383838' }}>
          © 2026 NEXUS ERP · Made in India 🇮🇳
        </p>
      </div>

      {/* ── Right Panel ── */}
      <div className="r-right">
        <div style={{ width: '100%', maxWidth: 440, paddingTop: 8 }}>

          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFF8E7', border: '1.5px solid #FFD966', borderRadius: 100, padding: '6px 16px', marginBottom: 28 }}>
            <span style={{ fontSize: 13 }}>🎉</span>
            <span style={{ fontFamily: 'DM Sans', fontSize: 12, fontWeight: 600, color: '#92600A' }}>Free forever — no credit card needed</span>
          </div>

          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 34, letterSpacing: '-0.025em', color: '#0A0A0A', marginBottom: 10, lineHeight: 1.08 }}>
            Create your<br />free account
          </h1>
          <p style={{ fontFamily: 'DM Sans', fontSize: 15, color: '#888', marginBottom: 36 }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: '#0A0A0A', fontWeight: 700, textDecoration: 'none', borderBottom: '2px solid #FFD966', paddingBottom: 1 }}>
              Sign in →
            </Link>
          </p>

          {/* Success */}
          {success && (
            <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontFamily: 'DM Sans', fontSize: 13, color: '#16A34A', display: 'flex', alignItems: 'center', gap: 8 }}>
              ✅ {success}
            </div>
          )}

          {/* Error */}
          {regError && (
            <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontFamily: 'DM Sans', fontSize: 13, color: '#DC2626' }}>
              ⚠️ {regError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Name */}
            <div>
              <label style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 12, color: '#0A0A0A', display: 'block', marginBottom: 8, letterSpacing: '0.05em' }}>FULL NAME</label>
              <input className="r-input" placeholder="John Doe"
                {...register('name', { required: 'Name is required' })} />
              {errors.name && <p className="ferr">⚠ {errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 12, color: '#0A0A0A', display: 'block', marginBottom: 8, letterSpacing: '0.05em' }}>EMAIL ADDRESS</label>
              <input className="r-input" type="email" placeholder="you@company.com"
                {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } })} />
              {errors.email && <p className="ferr">⚠ {errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 12, color: '#0A0A0A', display: 'block', marginBottom: 8, letterSpacing: '0.05em' }}>PASSWORD</label>
              <input className="r-input" type="password" placeholder="Min 6 characters"
                {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })} />
              {errors.password && <p className="ferr">⚠ {errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 12, color: '#0A0A0A', display: 'block', marginBottom: 8, letterSpacing: '0.05em' }}>CONFIRM PASSWORD</label>
              <input className="r-input" type="password" placeholder="Repeat your password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: v => v === password || 'Passwords do not match',
                })} />
              {errors.confirmPassword && <p className="ferr">⚠ {errors.confirmPassword.message}</p>}
            </div>

            {/* Role */}
            <div>
              <label style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 12, color: '#0A0A0A', display: 'block', marginBottom: 8, letterSpacing: '0.05em' }}>ROLE</label>
              <select className="r-select"
                {...register('role', { required: 'Please select a role' })}>
                <option value="">Select a role</option>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              {errors.role && <p className="ferr">⚠ {errors.role.message}</p>}
            </div>

            {/* Department */}
            <div>
              <label style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 12, color: '#0A0A0A', display: 'block', marginBottom: 8, letterSpacing: '0.05em' }}>
                DEPARTMENT <span style={{ fontFamily: 'DM Sans', fontWeight: 400, fontSize: 11, color: '#AAA', textTransform: 'none', letterSpacing: 0 }}>optional</span>
              </label>
              <input className="r-input" placeholder="e.g. Sales, Operations, Finance"
                {...register('department')} />
            </div>

            <button type="submit" className="r-btn" disabled={loading} style={{ marginTop: 6 }}>
              {loading ? '⏳ Creating account...' : 'Create Account →'}
            </button>

          </form>

          <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#BBB', textAlign: 'center', marginTop: 24, lineHeight: 1.7 }}>
            By creating an account you agree to our terms of service and privacy policy.
          </p>

        </div>
      </div>
    </div>
  );
};

export default Register;