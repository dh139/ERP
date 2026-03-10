import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Animated Counter ──────────────────────────────────────
const Counter = ({ target, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const duration = 1800;
        const step = 16;
        const increment = target / (duration / step);
        const timer = setInterval(() => {
          start += increment;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, step);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
};

// ── Main Home Page ────────────────────────────────────────
const Home = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    {
      emoji: '📦',
      title: 'Inventory & Warehouse',
      color: '#FF6B35',
      bg: '#FFF3EE',
      points: ['Real-time stock tracking', 'Multi-warehouse support', 'Purchase orders & suppliers', 'Low stock alerts & reorder'],
    },
    {
      emoji: '🤝',
      title: 'CRM & Sales',
      color: '#0EA5E9',
      bg: '#EFF9FF',
      points: ['Customer management', 'Lead pipeline tracking', 'Sales orders & fulfilment', 'Revenue analytics'],
    },
    {
      emoji: '👥',
      title: 'HR & Payroll',
      color: '#8B5CF6',
      bg: '#F5F3FF',
      points: ['Employee profiles & roles', 'Attendance & leave management', 'Auto payroll processing', 'Payslip PDF & email'],
    },
    {
      emoji: '💰',
      title: 'Accounting & Finance',
      color: '#16A34A',
      bg: '#F0FDF4',
      points: ['Double-entry journal', 'Invoice creation & tracking', 'Expense management', 'P&L & Balance Sheet'],
    },
  ];

  const testimonials = [
    { name: 'Priya Sharma', role: 'Operations Head', company: 'RetailHub Pvt Ltd', text: 'Transformed how we manage our 3 warehouses. Stock visibility went from chaos to crystal clear overnight.', avatar: 'PS' },
    { name: 'Arjun Mehta', role: 'Finance Director', company: 'TradeCo Industries', text: 'The accounting module replaced our entire manual ledger system. P&L reports now take seconds, not days.', avatar: 'AM' },
    { name: 'Sneha Patel', role: 'HR Manager', company: 'GrowFast Solutions', text: 'Payroll used to take 2 days every month. Now it takes 2 clicks. The payslip email feature is brilliant.', avatar: 'SP' },
  ];

  return (
    <div style={{ fontFamily: "'Syne', 'Clash Display', sans-serif", background: '#FAFAF8', color: '#0A0A0A' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .nav-link {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #444;
          text-decoration: none;
          transition: color 0.2s;
        }
        .nav-link:hover { color: #0A0A0A; }

        .btn-primary {
          background: #0A0A0A;
          color: white;
          border: none;
          padding: 14px 32px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 15px;
          border-radius: 6px;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
          letter-spacing: 0.02em;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
        .btn-primary:active { transform: translateY(0); }

        .btn-outline {
          background: transparent;
          color: #0A0A0A;
          border: 2px solid #0A0A0A;
          padding: 13px 32px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 15px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-outline:hover { background: #0A0A0A; color: white; }

        .feature-card {
          background: white;
          border: 2px solid #E8E8E3;
          border-radius: 16px;
          padding: 36px 32px;
          transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
          position: relative;
          overflow: hidden;
        }
        .feature-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 48px rgba(0,0,0,0.1);
        }

        .stat-card {
          background: #0A0A0A;
          color: white;
          border-radius: 16px;
          padding: 40px 32px;
          text-align: center;
        }

        .testimonial-card {
          background: white;
          border: 2px solid #E8E8E3;
          border-radius: 16px;
          padding: 32px;
          transition: box-shadow 0.2s;
        }
        .testimonial-card:hover { box-shadow: 0 12px 32px rgba(0,0,0,0.08); }

        .tag {
          display: inline-block;
          background: #F0F0EB;
          border: 1.5px solid #D8D8D3;
          color: #555;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          padding: 5px 14px;
          border-radius: 100px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #FFF8E7;
          border: 1.5px solid #FFD966;
          border-radius: 100px;
          padding: 7px 18px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #92600A;
          margin-bottom: 28px;
        }

        .marquee-track {
          display: flex;
          gap: 0;
          animation: marquee 22s linear infinite;
          white-space: nowrap;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .grid-pattern {
          background-image:
            linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .module-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: white;
          border: 1.5px solid #E0E0DA;
          border-radius: 100px;
          padding: 8px 18px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #333;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        section { scroll-margin-top: 80px; }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(250,250,248,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid #E8E8E3' : 'none',
        transition: 'all 0.3s',
        padding: '0 5%',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, background: '#0A0A0A', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚡</div>
            <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>NEXUS ERP</span>
          </div>
          <div style={{ display: 'flex', gap: 36 }} className="nav-links">
            {['Features', 'Stats', 'Testimonials'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} className="nav-link">{l}</a>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-outline" style={{ padding: '9px 22px', fontSize: 14 }} onClick={() => navigate('/login')}>Sign In</button>
            <button className="btn-primary" style={{ padding: '9px 22px', fontSize: 14 }} onClick={() => navigate('/register')}>Get Started →</button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 5% 80px', textAlign: 'center', position: 'relative' }} className="grid-pattern">
        {/* Floating pills */}
        <div style={{ position: 'absolute', top: '18%', left: '8%', transform: 'rotate(-8deg)' }} className="module-pill">📦 Inventory</div>
        <div style={{ position: 'absolute', top: '28%', right: '7%', transform: 'rotate(6deg)' }} className="module-pill">💰 Accounting</div>
        <div style={{ position: 'absolute', bottom: '28%', left: '6%', transform: 'rotate(5deg)' }} className="module-pill">👥 HR & Payroll</div>
        <div style={{ position: 'absolute', bottom: '22%', right: '8%', transform: 'rotate(-4deg)' }} className="module-pill">🤝 CRM & Sales</div>

        <div className="hero-badge">
          <span>🇮🇳</span> Built for Indian Retail & E-commerce
        </div>

        <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(42px, 7vw, 88px)', lineHeight: 1.0, letterSpacing: '-0.03em', maxWidth: 900, marginBottom: 28 }}>
          Run Your Entire<br />
          <span style={{ position: 'relative', display: 'inline-block' }}>
            <span style={{ position: 'relative', zIndex: 1 }}>Business.</span>
            <span style={{
              position: 'absolute', bottom: 4, left: -4, right: -4, height: '38%',
              background: '#FFD966', zIndex: 0, borderRadius: 4,
            }}></span>
          </span>
          {' '}One Platform.
        </h1>

        <p style={{ fontFamily: 'DM Sans', fontSize: 'clamp(16px, 2vw, 20px)', fontWeight: 400, color: '#555', maxWidth: 580, lineHeight: 1.7, marginBottom: 44 }}>
          NEXUS ERP unifies Inventory, CRM, HR & Payroll, and Accounting into a single powerful platform. No more juggling spreadsheets.
        </p>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 64 }}>
          <button className="btn-primary" style={{ fontSize: 16, padding: '16px 40px' }} onClick={() => navigate('/register')}>
            Start Free Today →
          </button>
          <button className="btn-outline" style={{ fontSize: 16, padding: '16px 40px' }} onClick={() => navigate('/login')}>
            Sign In to Dashboard
          </button>
        </div>

        {/* Hero Stats */}
        <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap', justifyContent: 'center', padding: '28px 48px', background: 'white', border: '2px solid #E8E8E3', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          {[['4', 'Integrated Modules'], ['100%', 'Indian GST Ready'], ['₹0', 'Setup Cost'], ['24/7', 'Always Available']].map(([val, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 28, letterSpacing: '-0.02em' }}>{val}</div>
              <div style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#888', fontWeight: 500, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Marquee ── */}
      <div style={{ background: '#0A0A0A', padding: '18px 0', overflow: 'hidden', borderTop: '2px solid #1A1A1A' }}>
        <div className="marquee-track">
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 0, flexShrink: 0 }}>
              {['📦 INVENTORY MANAGEMENT', '✦', '💰 FINANCIAL REPORTS', '✦', '👥 HR & PAYROLL', '✦', '🤝 CRM & LEADS', '✦', '📊 LIVE DASHBOARD', '✦', '📄 PDF INVOICES', '✦', '✉️ EMAIL ALERTS', '✦', '📥 EXCEL EXPORT', '✦'].map((item, j) => (
                <span key={j} style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: item === '✦' ? '#FFD966' : 'white', letterSpacing: '0.1em', padding: '0 24px', whiteSpace: 'nowrap' }}>
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section id="features" style={{ padding: '100px 5%', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <span className="tag">MODULES</span>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '-0.025em', marginTop: 20, lineHeight: 1.1 }}>
            Everything you need.<br />Nothing you don't.
          </h2>
          <p style={{ fontFamily: 'DM Sans', fontSize: 18, color: '#666', marginTop: 20, maxWidth: 500, margin: '20px auto 0' }}>
            Four deeply integrated modules that talk to each other automatically.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
          {features.map((f, i) => (
            <div key={i} className="feature-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: f.color, borderRadius: '14px 14px 0 0' }}></div>
              <div style={{ width: 56, height: 56, background: f.bg, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 24, border: `1.5px solid ${f.color}22` }}>
                {f.emoji}
              </div>
              <h3 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', marginBottom: 20, color: '#0A0A0A' }}>
                {f.title}
              </h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {f.points.map((p, j) => (
                  <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ width: 20, height: 20, background: f.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                    <span style={{ fontFamily: 'DM Sans', fontSize: 14, color: '#444', lineHeight: 1.5 }}>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats ── */}
      <section id="stats" style={{ padding: '80px 5%', background: '#0A0A0A' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{ display: 'inline-block', background: '#FFD96620', border: '1.5px solid #FFD96660', color: '#FFD966', fontFamily: 'DM Sans', fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 100, letterSpacing: '0.08em', textTransform: 'uppercase' }}>BY THE NUMBERS</span>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '-0.025em', color: 'white', marginTop: 20, lineHeight: 1.1 }}>
              Built for scale.<br />Ready for growth.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {[
              { value: 16, suffix: '+', label: 'Chart of Accounts', sub: 'Pre-seeded defaults', color: '#FFD966' },
              { value: 5, suffix: '', label: 'Core Modules', sub: 'Deeply integrated', color: '#FF6B35' },
              { value: 100, suffix: '%', label: 'GST Ready', sub: 'Indian tax compliant', color: '#0EA5E9' },
              { value: 4, suffix: '', label: 'PDF Report Types', sub: 'Invoice, Payslip, P&L, BS', color: '#8B5CF6' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#161616', border: '1.5px solid #2A2A2A', borderRadius: 16, padding: '40px 32px', textAlign: 'center', transition: 'border-color 0.2s' }}>
                <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 52, letterSpacing: '-0.03em', color: s.color, lineHeight: 1 }}>
                  <Counter target={s.value} suffix={s.suffix} />
                </div>
                <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: 'white', marginTop: 14, marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontFamily: 'DM Sans', fontSize: 13, color: '#666' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" style={{ padding: '100px 5%' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span className="tag">TESTIMONIALS</span>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '-0.025em', marginTop: 20, lineHeight: 1.1 }}>
              Trusted by retail teams<br />across India.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card">
                <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
                  {[...Array(5)].map((_, j) => <span key={j} style={{ color: '#FFB800', fontSize: 16 }}>★</span>)}
                </div>
                <p style={{ fontFamily: 'DM Sans', fontSize: 15, color: '#333', lineHeight: 1.7, marginBottom: 28, fontStyle: 'italic' }}>
                  "{t.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, background: '#0A0A0A', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 800, fontSize: 14 }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: '#0A0A0A' }}>{t.name}</div>
                    <div style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#888', marginTop: 2 }}>{t.role} · {t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '80px 5%', background: '#0A0A0A', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, background: 'radial-gradient(circle, #FFD96618 0%, transparent 70%)', pointerEvents: 'none' }}></div>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 48, marginBottom: 24 }}>⚡</div>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(32px, 4vw, 52px)', color: 'white', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 24 }}>
            Ready to take control<br />of your business?
          </h2>
          <p style={{ fontFamily: 'DM Sans', fontSize: 17, color: '#888', marginBottom: 44, lineHeight: 1.7 }}>
            Join hundreds of retail businesses already using NEXUS ERP to streamline operations and grow faster.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" style={{ background: '#FFD966', color: '#0A0A0A', fontSize: 16, padding: '16px 44px' }} onClick={() => navigate('/register')}>
              Create Free Account →
            </button>
            <button className="btn-outline" style={{ borderColor: '#444', color: 'white', fontSize: 16, padding: '16px 44px' }} onClick={() => navigate('/login')}>
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#050505', borderTop: '1px solid #1A1A1A', padding: '52px 5%' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 48, marginBottom: 52 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{ width: 32, height: 32, background: '#FFD966', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚡</div>
                <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: 'white' }}>NEXUS ERP</span>
              </div>
              <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: '#555', lineHeight: 1.8 }}>
                Complete business management platform built for Indian retail and e-commerce teams.
              </p>
            </div>
            {[
              { title: 'MODULES', links: ['Inventory', 'CRM & Sales', 'HR & Payroll', 'Accounting'] },
              { title: 'FEATURES', links: ['PDF Reports', 'Email Alerts', 'Excel Export', 'Dashboard'] },
              { title: 'ACCOUNT', links: ['Sign In', 'Register', 'Dashboard', 'Settings'] },
            ].map(col => (
              <div key={col.title}>
                <h4 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 11, color: '#FFD966', letterSpacing: '0.1em', marginBottom: 18 }}>{col.title}</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {col.links.map(l => (
                    <li key={l}>
                      <span style={{ fontFamily: 'DM Sans', fontSize: 13, color: '#555', cursor: 'pointer', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.target.style.color = '#999'}
                        onMouseLeave={e => e.target.style.color = '#555'}>
                        {l}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #1A1A1A', paddingTop: 28, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#444' }}>© 2026 NEXUS ERP. Built with MERN Stack.</p>
            <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#444' }}>Made with ❤️ for Indian businesses 🇮🇳</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;