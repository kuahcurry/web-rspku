import { Navigate } from 'react-router-dom';
import { isAdminAuthenticated } from '../utils/auth';

const ProtectedAdminRoute = ({ children }) => {
  // Check if admin is authenticated using helper function
  if (!isAdminAuthenticated()) {
    // Admin is not authenticated or token expired, redirect to admin login
    return <Navigate to="/login" replace />;
  }

  // Admin is authenticated, render the protected component
  return children;
};

export default ProtectedAdminRoute;
