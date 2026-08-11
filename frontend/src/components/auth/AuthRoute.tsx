import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../store';

interface RouteProps {
  children: React.ReactElement;
}

export const ProtectedRoute: React.FC<RouteProps> = ({ children }) => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export const PublicRoute: React.FC<RouteProps> = ({ children }) => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return children;
};
