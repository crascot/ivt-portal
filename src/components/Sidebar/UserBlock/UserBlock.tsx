import { NavLink } from 'react-router-dom';
import { FiChevronRight, FiLogIn } from 'react-icons/fi';

import { ROUTES } from '@utils/routes';
import s from './UserBlock.module.css';
import { useAuth } from '@context/AuthContext';
import { RoleEnum } from '@entities/role-enum';

type UserBlockProps = {
  onNavigate?: () => void;
};

export const UserBlock = ({ onNavigate }: UserBlockProps) => {
  const { user, isAuthenticated, avatarUrl } = useAuth();

  const to = isAuthenticated ? ROUTES.PROFILE : ROUTES.SIGN_IN;
  const roleLabels: Record<RoleEnum, string> = {
    [RoleEnum.STUDENT]: 'Студент',
    [RoleEnum.TEACHER]: 'Преподаватель',
    [RoleEnum.ADMIN]: 'Администратор',
    [RoleEnum.GROUP_LEADER]: 'Староста группы',
  };
  const title =
    user?.fullName || user?.email || (isAuthenticated ? 'Профиль' : 'Войти');
  const subtitle = user?.role
    ? roleLabels[user.role]
    : 'Войдите, чтобы получить доступ';

  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) => `${s.userCard} ${isActive ? s.active : ''}`}
    >
      <div className={s.avatar}>
        {isAuthenticated && avatarUrl ? (
          <img src={avatarUrl} alt="Фото профиля" className={s.avatarImage} />
        ) : isAuthenticated ? (
          title.trim().charAt(0).toUpperCase()
        ) : (
          <FiLogIn size={22} aria-hidden="true" />
        )}
      </div>

      <div className={s.info}>
        <span className={s.title}>{title}</span>
        <span className={s.subtitle}>{subtitle}</span>
      </div>

      <FiChevronRight className={s.chevron} size={20} aria-hidden="true" />
    </NavLink>
  );
};
