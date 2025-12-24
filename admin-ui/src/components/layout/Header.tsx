import { Bell, User } from 'lucide-react';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h2 className="header-title">BEN Admin</h2>
        </div>

        <div className="header-right">
          <button className="header-icon-btn">
            <Bell size={20} />
          </button>
          <button className="header-icon-btn">
            <User size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
