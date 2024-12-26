import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/" />;
  }

  // Check role for admin routes
  if (window.location.pathname.startsWith('/admin') && role !== 'admin') {
    alert('Unauthorized access!');
    return <Navigate to="/user" />;
  }

  return children;
}

export default ProtectedRoute;
