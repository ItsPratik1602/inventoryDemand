import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Loader from "./Loader.jsx";

function AppRouteGuard({ children }) {
  const { user, loading, isAdmin, isStaff, isCustomer } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader text="Checking access..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admins should not access /app routes
  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Both staff and customers can access /app routes
  // The individual pages will handle role-specific logic
  return <Outlet />;
}

export default AppRouteGuard;
