import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Shield,
  Plug,
  Wrench,
  FileText,
  Settings
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/roles', icon: Shield, label: 'Roles' },
    { path: '/integrations', icon: Plug, label: 'Connections' },
    { path: '/tools', icon: Wrench, label: 'Tools' },
    { path: '/logs', icon: FileText, label: 'Logs' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo">BIM</h1>
        <p className="sidebar-subtitle">Admin Control</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
