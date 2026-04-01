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

  // switch (user?.role) {
  //   case RoleEnum.ADMIN:
  //     return (
  //       <div>
  //         <h1>ADMIN</h1>
  //       </div>
  //     );

  //   default:
  //     return <Navigate to={ROUTES.MAIN} />;
  // }

  return <button onClick={logout}>logout</button>;
};
