import { FiMenu } from 'react-icons/fi';

import s from './MobileBar.module.css';

type MobileBarProps = {
  isMenuOpen: boolean;
  onMenuClick: () => void;
};

export const MobileBar = ({ isMenuOpen, onMenuClick }: MobileBarProps) => {
  return (
    <header className={s.mobileBar}>
      <div className={s.brand}>
        <div className={s.logo}>
          <img
            src="/logo.svg"
            alt=""
            className={s.logoImage}
            aria-hidden="true"
          />
        </div>

        <div className={s.brandText}>
          <span className={s.brandTitle}>Университет</span>
          <span className={s.brandSubtitle}>Студенческий портал</span>
        </div>
      </div>

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
