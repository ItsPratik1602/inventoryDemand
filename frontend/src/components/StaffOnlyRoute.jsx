import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Loader from "./Loader.jsx";

function StaffOnlyRoute() {
  const { user, loading, isStaff } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader text="Checking access..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isStaff) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}

export default StaffOnlyRoute;
