import React from 'react';
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const isAuthenticated = () => {
  // Example: check for a token in localStorage
  return !!localStorage.getItem('token');
};

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/" replace />;
};

export default PrivateRoute; 