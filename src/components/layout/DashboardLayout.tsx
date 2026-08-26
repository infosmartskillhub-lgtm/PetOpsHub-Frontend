import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PawPrint, 
  Calendar, 
  FileText, 
  MessageSquare, 
  DollarSign, 
  Settings, 
  LogOut,
  Menu,
  X,
  User
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/pets', label: 'My Pets', icon: PawPrint },
  { path: '/appointments', label: 'Appointments', icon: Calendar },
  { path: '/medical-records', label: 'Medical Records', icon: FileText },
  { path: '/documents', label: 'Documents', icon: FileText },
  { path: '/messages', label: 'Messages', icon: MessageSquare },
  { path: '/invoices', label: 'Invoices', icon: DollarSign },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const DashboardLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-teal-500/20 flex items-center justify-center">
            <PawPrint className="h-5 w-5 text-teal-400" />
          </div>
          <span className="font-bold text-slate-200">PetOpsHub</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-slate-400 hover:text-slate-200 focus:outline-none"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        ${isMobileMenuOpen ? 'block' : 'hidden'} 
        md:block
        fixed md:sticky top-[73px] md:top-0 left-0
        w-full md:w-64 h-[calc(100vh-73px)] md:h-screen
        bg-slate-900 border-r border-slate-800
        flex flex-col z-40 transition-all duration-300
      `}>
        {/* Desktop Branding */}
        <div className="hidden md:flex items-center gap-3 p-6 border-b border-slate-800">
          <div className="h-10 w-10 rounded-full bg-teal-500/20 flex items-center justify-center">
            <PawPrint className="h-6 w-6 text-teal-400" />
          </div>
          <span className="text-xl font-bold text-slate-200 tracking-tight">PetOpsHub</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive 
                  ? 'bg-teal-500/10 text-teal-400' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }
              `}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User Profile / Logout */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <div className="flex flex-col truncate">
                <span className="text-sm font-medium text-slate-200 truncate">
                  {user?.first_name ? `${user.first_name} ${user.last_name}` : 'Client'}
                </span>
                <span className="text-xs text-slate-500 truncate">{user?.email || 'portal@petopshub.com'}</span>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-x-hidden">
        <div className="flex-1 w-full mx-auto pb-10">
          <Outlet />
        </div>
      </main>

    </div>
  );
};
