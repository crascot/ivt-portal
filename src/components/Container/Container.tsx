import { ReactNode, useEffect, useState } from 'react';

import { MobileBar } from '@components/MobileBar/MobileBar';
import { Sidebar } from '@components/Sidebar/Sidebar';

type Props = {
  children: ReactNode;
};

export const Container = ({ children }: Props) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = () => {
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  useEffect(() => {
    if (!isSidebarOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSidebarOpen]);

  return (
    <div className="app">
      <MobileBar isMenuOpen={isSidebarOpen} onMenuClick={openSidebar} />
      <Sidebar isOpen={isSidebarOpen} onNavigate={closeSidebar} />
      <button
        type="button"
        className={`sidebar-overlay ${
          isSidebarOpen ? 'sidebar-overlay--visible' : ''
        }`}
        onClick={closeSidebar}
        aria-label="Закрыть меню"
      />

      <main className="main-content">
        <div className="page-shell">
          <div className="page">{children}</div>
        </div>
      </main>
    </div>
  );
};
