import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Loader from "./Loader.jsx";
import { getHomeRoute } from "../utils/routeUtils.js";

function AdminOnlyRoute() {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader text="Checking access..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to={getHomeRoute(user.role)} replace />;
  }

  return <Outlet />;
}

export default AdminOnlyRoute;
