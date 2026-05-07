import { NavLink, useNavigate } from 'react-router-dom';

import { ROUTES } from '@utils/routes';
import { UserBlock } from './UserBlock/UserBlock';
import s from './Sidebar.module.css';
import { useAuth } from '@context/AuthContext';
import { useAnnouncements } from '@context/AnnouncementContext';
import { RoleEnum } from '@entities/role-enum';

type NavItem = {
  label: string;
  to: string;
};

const commonNavItems: NavItem[] = [
  { label: 'Главная', to: ROUTES.MAIN },
  { label: 'О портале', to: ROUTES.ABOUT },
];

const roleNavItems: Record<string, NavItem[]> = {
  STUDENT: [
    { label: 'Расписание', to: ROUTES.SCHEDULE },
    { label: 'Задания', to: ROUTES.TASKS },
    { label: 'Статистика', to: ROUTES.STATISTICS },
    { label: 'История уведомлений', to: ROUTES.NOTIFICATIONS_HISTORY },
    { label: 'УММ', to: ROUTES.UMM },
  ],
  TEACHER: [
    { label: 'Расписание', to: ROUTES.SCHEDULE },
    { label: 'Задания', to: ROUTES.TASKS },
    { label: 'Статистика', to: ROUTES.STATISTICS },
    { label: 'История уведомлений', to: ROUTES.NOTIFICATIONS_HISTORY },
    { label: 'УММ', to: ROUTES.UMM },
  ],
  ADMIN: [
    { label: 'Заявки', to: ROUTES.ADMIN_PENDING_USERS },
    { label: 'Группы', to: ROUTES.ADMIN_GROUPS },
    { label: 'Дисциплины', to: ROUTES.ADMIN_DISCIPLINES },
    { label: 'Расписание', to: ROUTES.SCHEDULE },
    { label: 'Задания', to: ROUTES.TASKS },
    { label: 'Статистика', to: ROUTES.STATISTICS },
    { label: 'УММ', to: ROUTES.UMM },
  ],
  GROUP_LEADER: [
    { label: 'Расписание', to: ROUTES.SCHEDULE },
    { label: 'Задания', to: ROUTES.TASKS },
    { label: 'Статистика', to: ROUTES.STATISTICS },
    { label: 'История уведомлений', to: ROUTES.NOTIFICATIONS_HISTORY },
    { label: 'УММ', to: ROUTES.UMM },
  ],
};

export const Sidebar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { unseenCount } = useAnnouncements();
  const canSeeAnnouncements =
    user?.role === RoleEnum.STUDENT ||
    user?.role === RoleEnum.GROUP_LEADER ||
    user?.role === RoleEnum.TEACHER;
  const shouldShowAnnouncements =
    isAuthenticated && canSeeAnnouncements && unseenCount > 0;

  const handleAnnouncementClick = () => {
    navigate(ROUTES.NOTIFICATIONS_HISTORY);
  };

  const navItems = [
    ...(!isAuthenticated ? commonNavItems : []),
    ...(user?.role ? (roleNavItems[user.role] ?? []) : []),
  ];

  return (
    <aside className={s.sidebar}>
      <div className={s.header}>
        <NavLink
          to={ROUTES.MAIN}
          end
          className={({ isActive }) =>
            `${s.brand} ${isActive ? s.brandActive : ''}`
          }
        >
          <div className={s.logo}>IVT</div>

          <div className={s.brandText}>
            <span className={s.brandTitle}>IVT Portal</span>
            <span className={s.brandSubtitle}>Учебный веб-портал</span>
          </div>
        </NavLink>
      </div>

      <div className={s.userSection}>
        <UserBlock />
      </div>

      {shouldShowAnnouncements && (
        <button
          type="button"
          className={s.announcementRow}
          onClick={handleAnnouncementClick}
          title="Перейти к истории уведомлений"
        >
          <span className={s.announcementLabel}>
            Новые уведомления
          </span>
          <span className={s.announcementBadge}>{unseenCount}</span>
        </button>
      )}

      <div className={s.navSection}>
        <span className={s.sectionTitle}>Навигация</span>

        <div className={s.linkList}>
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${s.navLink} ${isActive ? s.active : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </aside>
  );
};
