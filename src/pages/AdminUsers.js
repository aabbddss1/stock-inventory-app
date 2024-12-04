// src/pages/AdminUsers.js
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from 'xlsx'; // For Excel export
import jsPDF from 'jspdf'; // For PDF export
import '../styles/AdminUsers.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([
    {
      id: 1,
      username: 'JohnDoe',
      email: 'john.doe@example.com',
      role: 'Admin',
      status: 'Active',
    },
    {
      id: 2,
      username: 'JaneSmith',
      email: 'jane.smith@example.com',
      role: 'Manager',
      status: 'Suspended',
    },
  ]);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'Viewer',
    status: 'Active',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Add or update user
  const handleSubmit = (e) => {
    e.preventDefault();

    if (selectedUser) {
      // Update user
      const updatedUsers = users.map((user) =>
        user.id === selectedUser.id ? { ...formData, id: user.id } : user
      );
      setUsers(updatedUsers);
      setSelectedUser(null);
    } else {
      // Add new user
      const newUser = {
        ...formData,
        id: Date.now(),
      };
      setUsers([...users, newUser]);
    }

    setFormData({ username: '', email: '', role: 'Viewer', status: 'Active' });
  };

  // Edit user
  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
    });
  };

  // Delete user
  const handleDelete = (id) => {
    const updatedUsers = users.filter((user) => user.id !== id);
    setUsers(updatedUsers);
  };

  // Search functionality
  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
  };

  // Export to Excel
  const exportAsExcel = () => {
    const worksheet = XLSXUtils.json_to_sheet(users);
    const workbook = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(workbook, worksheet, 'Users');
    XLSXWriteFile(workbook, 'users_data.xlsx');
  };

  // Export to PDF
  const exportAsPDF = () => {
    const doc = new jsPDF();
    doc.text('User Management Report', 10, 10);
    let yPosition = 20;

    users.forEach((user, index) => {
      doc.text(`${index + 1}. ${user.username} (${user.email})`, 10, yPosition);
      doc.text(
        `   Role: ${user.role}, Status: ${user.status}`,
        10,
        yPosition + 10
      );
      yPosition += 20;
    });

    doc.save('users_report.pdf');
  };

  return (
    <div className="admin-users-page">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="admin-users-container">
          <h1>User Management</h1>

          {/* Search and Export */}
          <div className="admin-users-actions">
            <input
              type="text"
              placeholder="Search by username or email"
              value={searchTerm}
              onChange={handleSearch}
            />
            <button onClick={exportAsExcel}>Export as Excel</button>
            <button onClick={exportAsPDF}>Export as PDF</button>
          </div>

          {/* Add/Edit User Form */}
          <form className="admin-users-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Viewer">Viewer</option>
            </select>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
            </select>
            <button type="submit">
              {selectedUser ? 'Update User' : 'Add User'}
            </button>
          </form>

          {/* Users List Table */}
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter(
                  (user) =>
                    user.username.toLowerCase().includes(searchTerm) ||
                    user.email.toLowerCase().includes(searchTerm)
                )
                .map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.status}</td>
                    <td>
                      <button onClick={() => handleEdit(user)}>Edit</button>
                      <button onClick={() => handleDelete(user.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
