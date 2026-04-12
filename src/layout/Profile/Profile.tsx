import { Navigate, useNavigate } from 'react-router-dom';
import { ROUTES } from '@utils/routes';
import { useAuth } from '@context/AuthContext';
import { RoleEnum } from '@entities/role-enum';

export const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    navigate(ROUTES.MAIN);
  }

  switch (user?.role) {
    case RoleEnum.ADMIN:
      return (
        <div>
          <h1>ADMIN</h1>
          <button onClick={logout}>Logout</button>
        </div>
      );
    case RoleEnum.TEACHER:
      return (
        <div>
          <h1>Teacher</h1>
          <button onClick={logout}>Logout</button>
        </div>
      );

    case (RoleEnum.GROUP_LEADER, RoleEnum.STUDENT):
      return (
        <div>
          <h1>Student</h1>
          <button onClick={logout}>Logout</button>
        </div>
      );

    default:
      return <Navigate to={ROUTES.MAIN} />;
  }
};
