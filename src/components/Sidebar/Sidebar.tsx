import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiBarChart2,
  FiBell,
  FiBookOpen,
  FiCalendar,
  FiClipboard,
  FiHome,
  FiInfo,
  FiLayers,
  FiUsers,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';

import { ROUTES } from '@utils/routes';
import { UserBlock } from './UserBlock/UserBlock';
import s from './Sidebar.module.css';
import { useAuth } from '@context/AuthContext';
import { useAnnouncements } from '@context/AnnouncementContext';
import { RoleEnum } from '@entities/role-enum';

type NavItem = {
  label: string;
  to: string;
  icon: IconType;
};

type SidebarProps = {
  isOpen?: boolean;
  onNavigate?: () => void;
};

const commonNavItems: NavItem[] = [
  { label: 'Главная', to: ROUTES.MAIN, icon: FiHome },
];

const roleNavItems: Record<string, NavItem[]> = {
  STUDENT: [
    { label: 'Расписание', to: ROUTES.SCHEDULE, icon: FiCalendar },
    { label: 'Преподаватели', to: ROUTES.TEACHERS, icon: FiUsers },
    { label: 'Задания', to: ROUTES.TASKS, icon: FiClipboard },
    { label: 'Статистика', to: ROUTES.STATISTICS, icon: FiBarChart2 },
    {
      label: 'История уведомлений',
      to: ROUTES.NOTIFICATIONS_HISTORY,
      icon: FiBell,
    },
    { label: 'УММ', to: ROUTES.UMM, icon: FiLayers },
  ],
  TEACHER: [
    { label: 'Расписание', to: ROUTES.SCHEDULE, icon: FiCalendar },
    { label: 'Преподаватели', to: ROUTES.TEACHERS, icon: FiUsers },
    { label: 'Задания', to: ROUTES.TASKS, icon: FiClipboard },
    { label: 'Статистика', to: ROUTES.STATISTICS, icon: FiBarChart2 },
    {
      label: 'История уведомлений',
      to: ROUTES.NOTIFICATIONS_HISTORY,
      icon: FiBell,
    },
    { label: 'УММ', to: ROUTES.UMM, icon: FiLayers },
  ],
  ADMIN: [
    { label: 'Заявки', to: ROUTES.ADMIN_PENDING_USERS, icon: FiClipboard },
    { label: 'Группы', to: ROUTES.ADMIN_GROUPS, icon: FiUsers },
    { label: 'Дисциплины', to: ROUTES.ADMIN_DISCIPLINES, icon: FiBookOpen },
    { label: 'Расписание', to: ROUTES.SCHEDULE, icon: FiCalendar },
    { label: 'Преподаватели', to: ROUTES.TEACHERS, icon: FiUsers },
    { label: 'Задания', to: ROUTES.TASKS, icon: FiClipboard },
    { label: 'Статистика', to: ROUTES.STATISTICS, icon: FiBarChart2 },
    { label: 'УММ', to: ROUTES.UMM, icon: FiLayers },
  ],
  GROUP_LEADER: [
    { label: 'Расписание', to: ROUTES.SCHEDULE, icon: FiCalendar },
    { label: 'Преподаватели', to: ROUTES.TEACHERS, icon: FiUsers },
    { label: 'Задания', to: ROUTES.TASKS, icon: FiClipboard },
    { label: 'Статистика', to: ROUTES.STATISTICS, icon: FiBarChart2 },
    {
      label: 'История уведомлений',
      to: ROUTES.NOTIFICATIONS_HISTORY,
      icon: FiBell,
    },
    { label: 'УММ', to: ROUTES.UMM, icon: FiLayers },
  ],
};

const aboutNavItem: NavItem = {
  label: 'О портале',
  to: ROUTES.ABOUT,
  icon: FiInfo,
};

export const Sidebar = ({ isOpen = false, onNavigate }: SidebarProps) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { unseenCount } = useAnnouncements();
  const AboutIcon = aboutNavItem.icon;
  const canSeeAnnouncements =
    user?.role === RoleEnum.STUDENT ||
    user?.role === RoleEnum.GROUP_LEADER ||
    user?.role === RoleEnum.TEACHER;
  const shouldShowAnnouncements =
    isAuthenticated && canSeeAnnouncements && unseenCount > 0;

  const handleAnnouncementClick = () => {
    navigate(ROUTES.NOTIFICATIONS_HISTORY);
    onNavigate?.();
  };

  const navItems = [
    ...(!isAuthenticated ? commonNavItems : []),
    ...(user?.role ? (roleNavItems[user.role] ?? []) : []),
  ];

  return (
    <aside id="main-sidebar" className={`${s.sidebar} ${isOpen ? s.open : ''}`}>
      <div className={s.header}>
        <NavLink
          to={ROUTES.MAIN}
          end
          onClick={onNavigate}
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
        <UserBlock onNavigate={onNavigate} />
      </div>

      {shouldShowAnnouncements && (
        <button
          type="button"
          className={s.announcementRow}
          onClick={handleAnnouncementClick}
          title="Перейти к истории уведомлений"
        >
          <span className={s.announcementLabel}>Новые уведомления</span>
          <span className={s.announcementBadge}>{unseenCount}</span>
        </button>
      )}

      <div className={s.navSection}>
        <span className={s.sectionTitle}>Навигация</span>

        <div className={s.linkList}>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `${s.navLink} ${isActive ? s.active : ''}`
              }
            >
              <Icon className={s.navIcon} size={22} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      <div className={s.footerSection}>
        <NavLink
          to={aboutNavItem.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `${s.navLink} ${s.footerLink} ${isActive ? s.active : ''}`
          }
        >
          <AboutIcon className={s.navIcon} size={22} aria-hidden="true" />
          <span>{aboutNavItem.label}</span>
        </NavLink>
      </div>
    </aside>
  );
};
