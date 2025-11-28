import React from 'react';
import { useStore } from '../context/StoreContext';
import { 
  Users, Calendar, LogOut, LayoutDashboard, 
  ShieldCheck, FileText, Menu, X 
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  const { user, logout } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const NavItem = ({ page, icon: Icon, label }: { page: string, icon: any, label: string }) => (
    <button
      onClick={() => { onNavigate(page); setMobileMenuOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        currentPage === page 
          ? 'bg-brand-600 text-white shadow-md' 
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 print:bg-white print:block">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 w-full bg-white z-20 border-b px-4 py-3 flex justify-between items-center shadow-sm no-print">
        <h1 className="text-xl font-bold text-brand-700">PlanMaster Pro</h1>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar - Marked as no-print explicitly */}
      <aside className={`
        fixed inset-y-0 left-0 z-10 w-64 bg-white border-r shadow-sm transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        pt-16 lg:pt-0
        no-print
      `}>
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-brand-700 flex items-center gap-2">
            <LayoutDashboard className="text-brand-600" />
            PlanMaster
          </h1>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded border">
            <ShieldCheck size={14} className="text-emerald-500" />
            <div>
              <p className="font-semibold text-slate-700">{user?.name}</p>
              <p className="uppercase tracking-wider text-[10px]">{user?.role}</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <NavItem page="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem page="members" icon={Users} label="Mitglieder" />
          <NavItem page="events" icon={Calendar} label="Veranstaltungen" />
          {user?.role === 'ADMIN' && (
             <NavItem page="audit" icon={FileText} label="Audit Logs" />
          )}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t bg-slate-50">
          <button 
            onClick={logout}
            className="w-full flex items-center gap-2 text-slate-600 hover:text-red-600 transition-colors px-4 py-2"
          >
            <LogOut size={18} />
            <span>Abmelden</span>
          </button>
        </div>
      </aside>

      {/* Main Content - Reset constraints for print handled in global CSS now */}
      <main className="flex-1 pt-16 lg:pt-0 overflow-auto h-screen print:h-auto print:overflow-visible print:w-full">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto print:p-0 print:max-w-none print:mx-0">
          {children}
        </div>
      </main>
    </div>
  );
};