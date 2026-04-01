import { NavLink } from 'react-router-dom';

import { ROUTES } from '@utils/routes';
import s from './UserBlock.module.css';
import { useAuth } from '@context/AuthContext';

export const UserBlock = () => {
  const { isAuthenticated } = useAuth();

  const to = isAuthenticated ? ROUTES.PROFILE : ROUTES.SIGN_IN;
  const title = isAuthenticated ? 'Профиль' : 'Авторизация';
  const subtitle = isAuthenticated
    ? 'Открыть личный кабинет'
    : 'Войдите, чтобы получить доступ';

  return (
    <NavLink
      to={to}
      className={({ isActive }) => `${s.userCard} ${isActive ? s.active : ''}`}
    >
      <div className={s.avatar}>{isAuthenticated ? 'U' : '→'}</div>

      <div className={s.info}>
        <span className={s.title}>{title}</span>
        <span className={s.subtitle}>{subtitle}</span>
      </div>
    </NavLink>
  );
};
