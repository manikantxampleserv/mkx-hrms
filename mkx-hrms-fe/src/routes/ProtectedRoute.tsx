import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "contexts/AuthContext";
import { AppLoader } from "shared/AppLoader";

/**
 * Route protection wrapper guarding authenticated views
 *
 * @returns Protected child route or redirects unauthenticated visitors to /login
 */
export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AppLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
