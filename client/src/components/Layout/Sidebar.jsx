import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';

const NAV_ITEMS = [
  { label: 'Dashboard',    path: '/dashboard',  icon: '📊', roles: ['superadmin','admin','hr_manager','accountant','sales','warehouse'] },
  { label: 'Inventory',    path: '/inventory',  icon: '📦', roles: ['superadmin','admin','warehouse','sales','accountant'] },
  { label: 'CRM & Sales',  path: '/crm',        icon: '🤝', roles: ['superadmin','admin','sales'] },
  { label: 'HR & Payroll', path: '/hr',         icon: '👥', roles: ['superadmin','admin','hr_manager'] },
  { label: 'Accounting',   path: '/accounting', icon: '💰', roles: ['superadmin','admin','accountant'] },
];

const ROLE_COLORS = {
  superadmin: '#FFD966',
  admin:      '#0EA5E9',
  hr_manager: '#8B5CF6',
  accountant: '#16A34A',
  sales:      '#FF6B35',
  warehouse:  '#0891B2',
};

const Sidebar = ({ isOpen }) => {
  const { user } = useSelector(s => s.auth);
  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(user?.role));
  const roleColor = ROLE_COLORS[user?.role] || '#FFD966';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .sidebar-nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 12px;
          border-radius: 10px;
          margin-bottom: 4px;
          text-decoration: none;
          transition: all 0.18s;
          position: relative;
          overflow: hidden;
        }
        .sidebar-nav-link:hover {
          background: rgba(255,255,255,0.07) !important;
        }
        .sidebar-nav-link.active {
          background: white !important;
        }
        .sidebar-nav-link.active .nav-label {
          color: #0A0A0A !important;
          font-weight: 700 !important;
        }
        .sidebar-nav-link.active .nav-icon-wrap {
          background: #0A0A0A !important;
        }
        .sidebar-nav-link:not(.active) .nav-label {
          color: #666 !important;
        }
        .sidebar-nav-link:not(.active) .nav-icon-wrap {
          background: rgba(255,255,255,0.06) !important;
        }
        .sidebar-nav-link:hover:not(.active) .nav-label {
          color: white !important;
        }
        .sidebar-nav-link:hover:not(.active) .nav-icon-wrap {
          background: rgba(255,255,255,0.12) !important;
        }

        .sidebar-tooltip {
          position: absolute;
          left: 64px;
          background: #0A0A0A;
          color: white;
          padding: 6px 12px;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transform: translateX(-6px);
          transition: all 0.15s;
          z-index: 999;
          border: 1.5px solid #2A2A2A;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        }
        .sidebar-nav-link:hover .sidebar-tooltip {
          opacity: 1;
          transform: translateX(0);
        }

        @keyframes sidebarFadeIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .sidebar-label-anim {
          animation: sidebarFadeIn 0.2s ease both;
        }
      `}</style>

      <aside style={{
        position: 'fixed',
        left: 0, top: 0,
        height: '100%',
        width: isOpen ? 240 : 64,
        background: '#0A0A0A',
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRight: '1px solid #1A1A1A',
      }}>

        {/* ── Logo ── */}
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          borderBottom: '1px solid #1A1A1A',
          flexShrink: 0,
          gap: 10,
        }}>
          <div style={{
            width: 36, height: 36,
            background: '#FFD966',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>⚡</div>
          {isOpen && (
            <span className="sidebar-label-anim" style={{
              fontFamily: 'Syne', fontWeight: 800, fontSize: 16,
              color: 'white', letterSpacing: '-0.02em', whiteSpace: 'nowrap',
            }}>
              NEXUS ERP
            </span>
          )}
        </div>

        {/* ── Section Label ── */}
        {isOpen && (
          <div style={{ padding: '20px 16px 8px' }}>
            <span style={{
              fontFamily: 'Syne', fontWeight: 700, fontSize: 10,
              color: '#333', letterSpacing: '0.1em',
            }}>NAVIGATION</span>
          </div>
        )}
        {!isOpen && <div style={{ height: 20 }} />}

        {/* ── Nav Items ── */}
        <nav style={{ flex: 1, padding: '0 8px', overflowY: 'auto', overflowX: 'hidden' }}>
          {visibleItems.map((item, i) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-nav-link${isActive ? ' active' : ''}`
              }
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {/* Icon wrap */}
              <div className="nav-icon-wrap" style={{
                width: 34, height: 34,
                borderRadius: 9,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, flexShrink: 0,
                transition: 'background 0.18s',
              }}>
                {item.icon}
              </div>

              {/* Label */}
              {isOpen && (
                <span className="nav-label sidebar-label-anim" style={{
                  fontFamily: 'DM Sans', fontSize: 14,
                  fontWeight: 500, whiteSpace: 'nowrap',
                  transition: 'color 0.18s',
                }}>
                  {item.label}
                </span>
              )}

              {/* Collapsed tooltip */}
              {!isOpen && (
                <span className="sidebar-tooltip">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── User Badge at Bottom ── */}
        <div style={{
          borderTop: '1px solid #1A1A1A',
          padding: isOpen ? '16px 12px' : '12px 8px',
          flexShrink: 0,
        }}>
          {isOpen ? (
            <div className="sidebar-label-anim" style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px',
              background: '#161616',
              border: '1.5px solid #2A2A2A',
              borderRadius: 12,
            }}>
              {/* Avatar */}
              <div style={{
                width: 32, height: 32,
                background: roleColor,
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Syne', fontWeight: 800, fontSize: 14,
                color: '#0A0A0A', flexShrink: 0,
              }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{
                  fontFamily: 'Syne', fontWeight: 700, fontSize: 12,
                  color: 'white', whiteSpace: 'nowrap',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {user?.name}
                </p>
                <p style={{
                  fontFamily: 'DM Sans', fontSize: 10,
                  color: roleColor, fontWeight: 600,
                  textTransform: 'capitalize', letterSpacing: '0.04em',
                }}>
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
          ) : (
            <div style={{
              width: 34, height: 34,
              background: roleColor,
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Syne', fontWeight: 800, fontSize: 14,
              color: '#0A0A0A', margin: '0 auto', cursor: 'default',
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

      </aside>
    </>
  );
};

export default Sidebar;