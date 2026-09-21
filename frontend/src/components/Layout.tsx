import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopHUD } from './TopHUD';
import { useAppStore } from '../hooks/useAppStore';
import { cn } from '../utils/cn';

export function Layout() {
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen } = useAppStore();

  return (
    <div className="min-h-screen bg-bg-primary bg-grid-pattern">
      <Sidebar />
      <div className={cn('flex min-h-screen flex-col transition-all duration-300', sidebarCollapsed ? 'lg:pl-[76px]' : 'lg:pl-[240px]')}>
        <TopHUD />
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
