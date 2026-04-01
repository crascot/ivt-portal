import { NavLink } from 'react-router-dom';

import { ROUTES } from '@utils/routes';
import { UserBlock } from './UserBlock/UserBlock';
import s from './Sidebar.module.css';
import { useAuth } from '@context/AuthContext';

type NavItem = {
  label: string;
  to: string;
};

const commonNavItems: NavItem[] = [
  { label: 'Главная', to: ROUTES.MAIN },
  { label: 'О портале', to: ROUTES.ABOUT },
];

const roleNavItems: Record<string, NavItem[]> = {
  STUDENT: [],
  TEACHER: [],
  ADMIN: [{ label: 'Заявки', to: '/admin/pending-users' }],
  GROUP_LEADER: [],
};

export const Sidebar = () => {
  const { user } = useAuth();

  const navItems = [
    ...commonNavItems,
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
