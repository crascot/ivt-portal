import { Link } from 'react-router-dom';
import s from './Navbar.module.css';
import { isAuthenticated } from '@utils/helpers';

export const Navbar = () => {
  const isValid = isAuthenticated();

  return (
    <nav className={s.navbar}>
      <div className={s.navContainer}>
        <Link to="/" className={s.navBrand}>
          IVT Portal
        </Link>
        <ul className={s.navMenu}>
          <li className={s.navItem}>
            <Link to="/" className={s.navLink}>
              Home
            </Link>
          </li>
          <li className={s.navItem}>
            <Link to="/about" className={s.navLink}>
              About
            </Link>
          </li>

          {isValid ? (
            <li className={s.navItem}>
              <Link to="/profile" className={s.navLink}>
                Profile
              </Link>
            </li>
          ) : (
            <>
              <li className={s.navItem}>
                <Link to="/signin" className={s.navLink}>
                  Sign In
                </Link>
              </li>
              <li className={s.navItem}>
                <Link to="/signup" className={s.navLink}>
                  Sign Up
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};
