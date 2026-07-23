import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AppShell from "./AppShell.jsx";
import Loader from "./Loader.jsx";

function ProtectedAppLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader text="Loading..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export default ProtectedAppLayout;
