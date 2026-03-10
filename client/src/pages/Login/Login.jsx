import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, clearError } from '../../features/auth/authSlice';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector(s => s.auth);
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
    return () => dispatch(clearError());
  }, [isAuthenticated, navigate, dispatch]);

  const onSubmit = (data) => dispatch(loginUser(data));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Syne', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .l-input {
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
        }
        .l-input:focus {
          border-color: #0A0A0A;
          box-shadow: 0 0 0 4px rgba(10,10,10,0.06);
        }
        .l-input::placeholder { color: #BBBBBB; }

        .l-btn {
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
        .l-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.22);
        }
        .l-btn:active:not(:disabled) { transform: translateY(0); }
        .l-btn:disabled { background: #999; cursor: not-allowed; transform: none; }

        .l-left {
          width: 44%;
          background: #0A0A0A;
          padding: 60px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }
        .l-right {
          flex: 1;
          background: #FAFAF8;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 48px;
        }
        .dot-bg {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }
        .glow {
          position: absolute;
          bottom: -120px;
          left: -120px;
          width: 420px;
          height: 420px;
          background: radial-gradient(circle, rgba(255,217,102,0.12) 0%, transparent 65%);
          pointer-events: none;
        }
        .feat-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          transition: background 0.2s;
        }
        .feat-row:hover { background: rgba(255,255,255,0.07); }
        .ferr { font-family: 'DM Sans', sans-serif; font-size: 12px; color: #DC2626; margin-top: 5px; }

        @media (max-width: 768px) {
          .l-left { display: none !important; }
          .l-right { padding: 40px 24px !important; }
        }
      `}</style>

      {/* ── Left Panel ── */}
      <div className="l-left">
        <div className="dot-bg" />
        <div className="glow" />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 64 }}>
            <div style={{ width: 38, height: 38, background: '#FFD966', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19 }}>⚡</div>
            <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, color: 'white', letterSpacing: '-0.02em' }}>NEXUS ERP</span>
          </div>

          {/* Headline */}
          <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 40, color: 'white', lineHeight: 1.08, letterSpacing: '-0.028em', marginBottom: 18 }}>
            Welcome<br />back.
          </h2>
          <p style={{ fontFamily: 'DM Sans', fontSize: 14, color: '#5A5A5A', lineHeight: 1.75, marginBottom: 52, maxWidth: 300 }}>
            Your entire retail business — inventory, sales, HR and finance — in one powerful platform.
          </p>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '📦', label: 'Inventory & Warehouse' },
              { icon: '💰', label: 'Accounting & Finance' },
              { icon: '👥', label: 'HR, Payroll & Attendance' },
              { icon: '🤝', label: 'CRM, Leads & Sales Orders' },
            ].map((f, i) => (
              <div key={i} className="feat-row">
                <span style={{ fontSize: 20 }}>{f.icon}</span>
                <span style={{ fontFamily: 'DM Sans', fontSize: 14, color: '#888', fontWeight: 500 }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ position: 'relative', zIndex: 1, fontFamily: 'DM Sans', fontSize: 12, color: '#383838' }}>
          © 2026 NEXUS ERP · Built for Indian Retail 🇮🇳
        </p>
      </div>

      {/* ── Right Panel ── */}
      <div className="l-right">
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFF8E7', border: '1.5px solid #FFD966', borderRadius: 100, padding: '6px 16px', marginBottom: 28 }}>
            <div style={{ width: 7, height: 7, background: '#16A34A', borderRadius: '50%' }}></div>
            <span style={{ fontFamily: 'DM Sans', fontSize: 12, fontWeight: 600, color: '#92600A' }}>Secure · Encrypted Login</span>
          </div>

          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 36, letterSpacing: '-0.025em', color: '#0A0A0A', marginBottom: 10, lineHeight: 1.08 }}>
            Sign in to your<br />account
          </h1>
          <p style={{ fontFamily: 'DM Sans', fontSize: 15, color: '#888', marginBottom: 36 }}>
            No account?{' '}
            <Link to="/register" style={{ color: '#0A0A0A', fontWeight: 700, textDecoration: 'none', borderBottom: '2px solid #FFD966', paddingBottom: 1 }}>
              Register free →
            </Link>
          </p>

          {/* Server error */}
          {error && (
            <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontFamily: 'DM Sans', fontSize: 13, color: '#DC2626' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Email */}
            <div>
              <label style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 12, color: '#0A0A0A', display: 'block', marginBottom: 8, letterSpacing: '0.05em' }}>
                EMAIL ADDRESS
              </label>
              <input className="l-input" type="email" placeholder="admin@erp.com"
                {...register('email', { required: 'Email is required' })} />
              {errors.email && <p className="ferr">⚠ {errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 12, color: '#0A0A0A', display: 'block', marginBottom: 8, letterSpacing: '0.05em' }}>
                PASSWORD
              </label>
              <input className="l-input" type="password" placeholder="Enter your password"
                {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })} />
              {errors.password && <p className="ferr">⚠ {errors.password.message}</p>}
            </div>

            <button type="submit" className="l-btn" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? '⏳ Signing in...' : 'Sign In →'}
            </button>
          </form>

          

        </div>
      </div>
    </div>
  );
};

export default Login;