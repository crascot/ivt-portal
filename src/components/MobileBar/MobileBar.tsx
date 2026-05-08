import { NavLink } from 'react-router-dom';
import { FiMenu } from 'react-icons/fi';

import { ROUTES } from '@utils/routes';
import s from './MobileBar.module.css';

type MobileBarProps = {
  isMenuOpen: boolean;
  onMenuClick: () => void;
};

export const MobileBar = ({ isMenuOpen, onMenuClick }: MobileBarProps) => {
  return (
    <header className={s.mobileBar}>
      <NavLink to={ROUTES.MAIN} end className={s.brand}>
        <div className={s.logo}>IVT</div>

        <div className={s.brandText}>
          <span className={s.brandTitle}>IVT Portal</span>
          <span className={s.brandSubtitle}>Учебный веб-портал</span>
        </div>
      </NavLink>

      <button
        type="button"
        className={s.menuButton}
        onClick={onMenuClick}
        aria-label="Открыть меню"
        aria-controls="main-sidebar"
        aria-expanded={isMenuOpen}
      >
        <FiMenu size={24} aria-hidden="true" focusable="false" />
      </button>
    </header>
  );
};
