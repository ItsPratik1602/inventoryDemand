import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Loader from "./Loader.jsx";

function CustomerOnlyRoute() {
  const { user, loading, isCustomer } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader text="Checking access..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isCustomer) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}

export default CustomerOnlyRoute;
