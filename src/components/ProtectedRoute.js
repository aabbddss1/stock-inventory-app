import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const userRole = localStorage.getItem('userRole');
  
  // If no user is logged in, redirect to login
  if (!userRole) {
    return <Navigate to="/" replace />;
  }

  // If route is admin-only and user is not admin, redirect to dashboard
  if (adminOnly && userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
