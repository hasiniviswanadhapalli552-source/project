import { type ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Brain,
  Target,
  AlertTriangle,
  LogOut,
  GraduationCap,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/ai-training', label: 'AI Training', icon: Brain },
  { to: '/ai-prediction', label: 'AI Prediction', icon: Target },
  { to: '/at-risk', label: 'At-Risk Students', icon: AlertTriangle },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const NavLinks = () => (
    <nav className="flex flex-col gap-1">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={() => setSidebarOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`
          }
        >
          <Icon className="w-5 h-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-slate-900 fixed inset-y-0 left-0 z-30">
        <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">Performance</h1>
            <p className="text-slate-500 text-xs">Analytics & AI</p>
          </div>
        </div>
        <div className="flex-1 px-3 py-4">
          <NavLinks />
        </div>
        <div className="px-3 py-4 border-t border-slate-800">
          <div className="px-4 py-2 mb-2">
            <p className="text-slate-500 text-xs truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-400 hover:text-white hover:bg-red-500/10 transition-all w-full"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-slate-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-sm">Performance Analytics</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400">
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 flex flex-col pt-16 pb-4 overflow-y-auto">
            <div className="flex-1 px-3 py-4">
              <NavLinks />
            </div>
            <div className="px-3 py-4 border-t border-slate-800">
              <div className="px-4 py-2 mb-2">
                <p className="text-slate-500 text-xs truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-400 hover:text-white hover:bg-red-500/10 transition-all w-full"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
