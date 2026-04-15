import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { ROUTES } from '@utils/routes';
import { RoleEnum } from '@entities/role-enum';

type ProtectedRouteProps = {
  guestOnly?: boolean;
  allowedRoles?: RoleEnum[];
  unauthenticatedRedirectTo?: string;
  unauthorizedRedirectTo?: string;
  authenticatedRedirectTo?: string;
};

const ProtectedRoute = ({
  guestOnly = false,
  allowedRoles,
  unauthenticatedRedirectTo = ROUTES.SIGN_IN,
  unauthorizedRedirectTo = ROUTES.MAIN,
  authenticatedRedirectTo = ROUTES.PROFILE,
}: ProtectedRouteProps) => {
  const { isAuthenticated, hasRole } = useAuth();
  const location = useLocation();

  if (guestOnly) {
    if (isAuthenticated) {
      return <Navigate to={authenticatedRedirectTo} replace />;
    }

    return <Outlet />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={unauthenticatedRedirectTo}
        replace
        state={{ from: location }}
      />
    );
  }

  if (allowedRoles?.length && !hasRole(allowedRoles)) {
    return <Navigate to={unauthorizedRedirectTo} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
