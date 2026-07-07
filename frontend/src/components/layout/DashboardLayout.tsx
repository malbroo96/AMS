import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeSidebarOnMobile = () => {
    if (window.matchMedia('(max-width: 767px)').matches) {
      setSidebarOpen(false);
    }
  };

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 1024px)');

    const syncSidebarState = () => {
      if (desktopQuery.matches) {
        setSidebarOpen(true);
        return;
      }

      setSidebarOpen(false);
    };

    syncSidebarState();
    desktopQuery.addEventListener('change', syncSidebarState);

    return () => {
      desktopQuery.removeEventListener('change', syncSidebarState);
    };
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;
    const mobileQuery = window.matchMedia('(max-width: 767px)');

    if (!mobileQuery.matches) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      if (sidebarRef.current?.contains(target) || menuButtonRef.current?.contains(target)) {
        return;
      }

      setSidebarOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [sidebarOpen]);

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar
        ref={sidebarRef}
        role={user.role}
        open={sidebarOpen}
        onClose={closeSidebarOnMobile}
      />
      <div className={`flex flex-1 flex-col transition-[margin] duration-300 ease-in-out md:ml-[5.25rem] lg:ml-72${sidebarOpen ? ' md:ml-72' : ''}`}>
        <Navbar
          menuButtonRef={menuButtonRef}
          menuOpen={sidebarOpen}
          onMenuToggle={() => setSidebarOpen((open) => !open)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
