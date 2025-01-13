import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/" />;
  }

  // Define all admin-only routes
  const adminRoutes = [
    '/admin',
    '/sales',
    '/documents',
    '/analytics',
    '/settings',
    '/customers',
    '/suppliers',
    '/dealerships',
    '/inventory',
    '/receivables',
    '/payables',
    '/admin-users'
  ];

  // Check if current path matches any admin route
  const currentPath = window.location.pathname;
  const isAdminRoute = adminRoutes.some(route => 
    currentPath === route || currentPath.startsWith(`${route}/`)
  );

  if (isAdminRoute && role !== 'admin') {
    alert('Unauthorized access!');
    return <Navigate to="/user" />;
  }

  return children;
}

export default ProtectedRoute;
