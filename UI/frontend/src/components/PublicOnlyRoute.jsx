import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Loader from "../components/Loader.jsx";
import { getHomeRoute } from "../utils/routeUtils.js";

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader text="Loading..." />;
  }

  if (user) {
    return <Navigate to={getHomeRoute(user.role)} replace />;
  }

  return children;
}

export default PublicOnlyRoute;
