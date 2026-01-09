import { Navigate } from 'react-router-dom';

const ProtectedAdminRoute = ({ children }) => {
  // Check if admin is authenticated
  const adminToken = localStorage.getItem('admin_token');
  const adminUser = localStorage.getItem('admin_user');

  if (!adminToken || !adminUser) {
    // Admin is not authenticated, redirect to admin login
    return <Navigate to="/admin/login" replace />;
  }

  // Admin is authenticated, render the protected component
  return children;
};

export default ProtectedAdminRoute;
