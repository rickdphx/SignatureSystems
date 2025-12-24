import { useState, useEffect } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { getRoles, type Role } from '../api';
import './CommonPages.css';

const Roles = () => {
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    const data = await getRoles();
    setRoles(data);
  };

  const permissionLabels = {
    console: 'Ben Console',
    integrations: 'Integrations',
    tools: 'Tools',
    logs: 'Logs',
    settings: 'Settings',
    users: 'Users',
    roles: 'Roles'
  };

  return (
    <div className="common-page">
      <div className="page-header">
        <div>
          <h1>Roles & Permissions</h1>
          <p className="page-subtitle">Configure access control</p>
        </div>
        <button className="btn-primary">
          <Plus size={18} />
          Create Role
        </button>
      </div>

      <div className="roles-container">
        {roles.map((role) => (
          <div key={role.id} className="role-card">
            <div className="role-header">
              <h3>{role.name}</h3>
              <button className="text-btn">Edit</button>
            </div>

            <div className="permissions-grid">
              {Object.entries(role.permissions).map(([key, value]) => (
                <div key={key} className="permission-item">
                  <span className="permission-label">
                    {permissionLabels[key as keyof typeof permissionLabels]}
                  </span>
                  <span className={`permission-status ${value ? 'granted' : 'denied'}`}>
                    {value ? <Check size={16} /> : <X size={16} />}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Roles;
