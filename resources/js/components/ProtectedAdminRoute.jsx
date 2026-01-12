import { Navigate } from 'react-router-dom';

const ProtectedAdminRoute = ({ children }) => {
  // Check if admin is authenticated (using correct admin token key)
  const adminToken = localStorage.getItem('admin_access_token');
  const adminUser = localStorage.getItem('admin_user');

  if (!adminToken || !adminUser) {
    // Admin is not authenticated, redirect to admin login
    return <Navigate to="/login" replace />;
  }

  // Admin is authenticated, render the protected component
  return children;
};

export default ProtectedAdminRoute;
