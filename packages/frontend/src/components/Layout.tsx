import { Link, useLocation } from 'react-router-dom';
import SimpleIcon from './SimpleIcon';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: '대시보드', iconName: 'dashboard' },
    { path: '/sensors', label: '센서', iconName: 'sensors' },
    { path: '/control', label: '제어', iconName: 'control' },
    { path: '/robots', label: '로봇', iconName: 'robots' },
    { path: '/rules', label: '규칙', iconName: 'rules' },
    { path: '/rule-builder', label: '규칙 빌더', iconName: 'rule-builder' },
    { path: '/alarms', label: '알람', iconName: 'alarms' },
    { path: '/monitoring', label: '모니터링', iconName: 'monitoring' },
    { path: '/bim', label: 'BIM 뷰어', iconName: 'bim' },
    { path: '/cctv', label: 'CCTV', iconName: 'cctv' },
    { path: '/reports', label: '리포트', iconName: 'reports' },
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>
            <SimpleIcon name="farm" size={24} /> 하모니 스마트팜
          </h1>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">
                <SimpleIcon name={item.iconName} size={18} />
              </span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        {children}
      </main>
      <footer className="app-footer">
        <div className="footer-content">
          <p>&copy; {new Date().getFullYear()} Harmony-hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

