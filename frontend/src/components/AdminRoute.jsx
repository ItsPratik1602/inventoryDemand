import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Loader from "../components/Loader.jsx";
function AdminRoute() {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();



  if (loading) {
    return <Loader text="Checking access..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/products" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;
