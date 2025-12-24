import { useState, useEffect } from 'react';
import { Plus, Mail, Shield } from 'lucide-react';
import { getUsers, type User } from '../api';
import './CommonPages.css';

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const data = await getUsers();
    setUsers(data);
  };

  return (
    <div className="common-page">
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p className="page-subtitle">Manage user accounts and access</p>
        </div>
        <button className="btn-primary">
          <Plus size={18} />
          Invite User
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <strong>{user.name}</strong>
                </td>
                <td>
                  <div className="email-cell">
                    <Mail size={14} />
                    {user.email}
                  </div>
                </td>
                <td>
                  <div className="role-cell">
                    <Shield size={14} />
                    {user.role}
                  </div>
                </td>
                <td>
                  <span className={`status-badge status-${user.status.toLowerCase()}`}>
                    {user.status}
                  </span>
                </td>
                <td>{user.lastLogin || 'Never'}</td>
                <td>
                  <div className="table-actions">
                    <button className="text-btn">Edit</button>
                    <button className="text-btn text-danger">Remove</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
