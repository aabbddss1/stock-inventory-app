import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const userRole = localStorage.getItem('userRole');
  
  if (userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
