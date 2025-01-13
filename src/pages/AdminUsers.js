import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import axios from 'axios';
import '../styles/AdminUsers.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'admin',
    status: 'Active',
    password: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://37.148.210.169:5001/api/customers', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      
      const transformedUsers = response.data
        .filter(customer => customer.role?.toLowerCase() === 'admin')
        .map(customer => ({
          id: customer.id,
          username: customer.name,
          email: customer.email,
          role: customer.role,
          status: 'Active'
        }));
      
      setUsers(transformedUsers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (selectedUser) {
        await axios.put(`http://37.148.210.169:5001/api/customers/${selectedUser.id}`, {
          name: formData.username,
          email: formData.email,
          password: formData.password,
          phone: '',
          role: 'admin',
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        alert('User updated successfully');
      } else {
        const userData = {
          name: formData.username,
          email: formData.email,
          password: formData.password,
          phone: '',
          role: 'admin',
        };
        
        await axios.post('http://37.148.210.169:5001/api/customers', userData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        alert('User added successfully');
      }

      setFormData({
        username: '',
        email: '',
        role: 'admin',
        status: 'Active',
        password: ''
      });
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      alert(error.response?.data?.error || 'Error saving user');
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`http://37.148.210.169:5001/api/customers/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        alert('User deleted successfully');
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  return (
    <div className="admin-users-page">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="admin-users-container">
          <h1>Admin Management</h1>

          <div className="admin-users-actions">
            <input
              type="text"
              placeholder="Search by username or email"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

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
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required={!selectedUser}
            />
            <button type="submit">
              {selectedUser ? 'Update Admin' : 'Add Admin'}
            </button>
          </form>

          {loading ? (
            <p>Loading users...</p>
          ) : (
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
                      <div class="button-container">
  <button onClick={() => handleDelete(user.id)} class="admin-users-edit-btn">
    <i class="fa fa-edit"></i> Edit
  </button>
  <button onClick={() => handleDelete(user.id)} class="admin-users-delete-btn">
    <i class="fa fa-trash"></i> Delete
  </button>
</div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
