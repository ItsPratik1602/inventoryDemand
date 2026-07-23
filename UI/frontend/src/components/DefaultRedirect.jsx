import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getHomeRoute } from '../utils/routeUtils.js';
import Loader from './Loader.jsx';

function DefaultRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      const homeRoute = getHomeRoute(user?.role);
      navigate(homeRoute, { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <Loader text="Loading..." />;
  }

  return null;
}

export default DefaultRedirect;
