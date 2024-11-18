// src/components/UserManagement.js
import React, { useState } from 'react';
import '../styles/AdminPanel.css';

function UserManagement() {
  const [users, setUsers] = useState([
    { id: 1, name: 'John Doe', role: 'Client' },
    { id: 2, name: 'Jane Smith', role: 'Dealership' },
  ]);

  return (
    <div className="section">
      <h2>User Management</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} - Role: {user.role}
            <button>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UserManagement;
