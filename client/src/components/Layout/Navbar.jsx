import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../features/auth/authSlice';

const ROLE_COLORS = {
  superadmin: '#FFD966',
  admin:      '#0EA5E9',
  hr_manager: '#8B5CF6',
  accountant: '#16A34A',
  sales:      '#FF6B35',
  warehouse:  '#0891B2',
};

const Navbar = ({ isOpen, toggleSidebar }) => {
  const dispatch       = useDispatch();
  const navigate       = useNavigate();
  const { user }       = useSelector(s => s.auth);
  const [showMenu, setShowMenu]   = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const roleColor = ROLE_COLORS[user?.role] || '#FFD966';

  const handleLogout = async () => {
    setLoggingOut(true);
    await dispatch(logoutUser());
    navigate('/login');
  };

  const now  = new Date();
  const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .navbar-icon-btn {
          width: 38px; height: 38px;
          background: transparent;
          border: 2px solid #F0F0EB;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.18s;
          font-size: 16px;
          position: relative;
        }
        .navbar-icon-btn:hover {
          background: #0A0A0A;
          border-color: #0A0A0A;
        }

        .hamburger-line {
          width: 16px; height: 2px;
          background: #555;
          border-radius: 2px;
          display: block;
          transition: background 0.18s;
        }
        .navbar-icon-btn:hover .hamburger-line { background: white; }

        .user-menu {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 240px;
          background: white;
          border: 2px solid #F0F0EB;
          border-radius: 16px;
          box-shadow: 0 20px 48px rgba(0,0,0,0.12);
          z-index: 999;
          overflow: hidden;
          animation: menuDrop 0.18s ease both;
        }
        @keyframes menuDrop {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .menu-item {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 16px;
          cursor: pointer;
          transition: background 0.15s;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #444;
          text-decoration: none;
          border: none; background: none; width: 100%; text-align: left;
        }
        .menu-item:hover { background: #F9F9F7; }

        .notif-dot {
          position: absolute;
          top: 6px; right: 6px;
          width: 8px; height: 8px;
          background: #DC2626;
          border-radius: 50%;
          border: 2px solid white;
          animation: pulse-notif 2s infinite;
        }
        @keyframes pulse-notif {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.3); opacity: 0.7; }
        }

        .logout-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 16px;
          cursor: pointer;
          transition: background 0.15s;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 600;
          color: #DC2626;
          border: none; background: none; width: 100%; text-align: left;
        }
        .logout-btn:hover { background: #FEF2F2; }
        .logout-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <header style={{
        position: 'fixed',
        top: 0, right: 0,
        left: isOpen ? 240 : 64,
        height: 64,
        background: 'rgba(250,250,248,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #EBEBEB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 30,
        transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)',
        fontFamily: "'Syne', sans-serif",
      }}>

        {/* ── Left: Hamburger + Breadcrumb ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Hamburger */}
          <button className="navbar-icon-btn" onClick={toggleSidebar}
            style={{ flexDirection: 'column', gap: 4 }}>
            <span className="hamburger-line"></span>
            <span className="hamburger-line" style={{ width: 12 }}></span>
            <span className="hamburger-line"></span>
          </button>

          {/* Live indicator + date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: '#F4F4F0', border: '1.5px solid #E8E8E3',
              borderRadius: 100, padding: '5px 12px',
            }}>
              <div style={{
                width: 6, height: 6, background: '#16A34A',
                borderRadius: '50%', animation: 'pulse-notif 2s infinite',
              }}></div>
              <span style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 600, color: '#666' }}>
                {time}
              </span>
              <span style={{ fontFamily: 'DM Sans', fontSize: 11, color: '#BBB' }}>·</span>
              <span style={{ fontFamily: 'DM Sans', fontSize: 11, color: '#888' }}>{date}</span>
            </div>
          </div>
        </div>

        {/* ── Right: Actions + User ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

          {/* Search shortcut */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#F4F4F0', border: '1.5px solid #E8E8E3',
            borderRadius: 10, padding: '7px 14px', cursor: 'pointer',
            transition: 'all 0.18s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#0A0A0A'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E8E3'; }}
          >
            <span style={{ fontSize: 13 }}>🔍</span>
            <span style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#AAA' }}>Quick search...</span>
            <span style={{
              fontFamily: 'DM Sans', fontSize: 10, color: '#CCC',
              background: 'white', border: '1px solid #E8E8E3',
              borderRadius: 5, padding: '1px 6px',
            }}>⌘K</span>
          </div>

          {/* Notification bell */}
          <button className="navbar-icon-btn">
            <span>🔔</span>
            <span className="notif-dot"></span>
          </button>

          {/* User avatar + dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMenu(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#F4F4F0', border: '2px solid #E8E8E3',
                borderRadius: 12, padding: '6px 12px 6px 6px',
                cursor: 'pointer', transition: 'all 0.18s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#0A0A0A'; }}
              onMouseLeave={e => { if (!showMenu) e.currentTarget.style.borderColor = '#E8E8E3'; }}
            >
              {/* Avatar */}
              <div style={{
                width: 30, height: 30,
                background: roleColor,
                borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Syne', fontWeight: 800, fontSize: 13,
                color: '#0A0A0A', flexShrink: 0,
              }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>

              {/* Name */}
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 12, color: '#0A0A0A', lineHeight: 1.2 }}>
                  {user?.name?.split(' ')[0]}
                </p>
                <p style={{ fontFamily: 'DM Sans', fontSize: 10, color: '#AAA', textTransform: 'capitalize', lineHeight: 1.2 }}>
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>

              {/* Chevron */}
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none"
                style={{ transition: 'transform 0.2s', transform: showMenu ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                <path d="M1 1l4 4 4-4" stroke="#AAA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Dropdown */}
            {showMenu && (
              <div className="user-menu" onClick={() => setShowMenu(false)}>
                {/* User info header */}
                <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #F0F0EB' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 40, height: 40, background: roleColor, borderRadius: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Syne', fontWeight: 800, fontSize: 16, color: '#0A0A0A',
                    }}>
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: '#0A0A0A' }}>{user?.name}</p>
                      <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: '#AAA' }}>{user?.email}</p>
                    </div>
                  </div>
                  <div style={{
                    marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: '#F4F4F0', border: '1.5px solid #E8E8E3',
                    borderRadius: 100, padding: '3px 10px',
                  }}>
                    <div style={{ width: 7, height: 7, background: roleColor, borderRadius: '50%' }}></div>
                    <span style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'capitalize' }}>
                      {user?.role?.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Menu items */}
                <div style={{ padding: '8px 0' }}>
                  <button className="menu-item">
                    <span>👤</span> My Profile
                  </button>
                  <button className="menu-item">
                    <span>⚙️</span> Settings
                  </button>
                  <button className="menu-item">
                    <span>🔔</span> Notifications
                  </button>
                </div>

                {/* Divider */}
                <div style={{ borderTop: '1px solid #F0F0EB' }} />

                {/* Logout */}
                <div style={{ padding: '8px 0' }}>
                  <button
                    className="logout-btn"
                    onClick={handleLogout}
                    disabled={loggingOut}
                  >
                    <span>{loggingOut ? '⏳' : '🚪'}</span>
                    {loggingOut ? 'Signing out...' : 'Sign Out'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Click outside to close */}
        {showMenu && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: -1 }}
            onClick={() => setShowMenu(false)}
          />
        )}
      </header>
    </>
  );
};

export default Navbar;