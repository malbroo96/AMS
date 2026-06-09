import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!sidebarOpen) return;

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
        menuButtonRef={menuButtonRef}
        onMenuToggle={() => setSidebarOpen((open) => !open)}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col lg:ml-0">
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
