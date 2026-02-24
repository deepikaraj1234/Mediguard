import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Calendar, 
  Pill, 
  Settings, 
  LogOut, 
  Activity,
  AlertCircle,
  ShieldCheck,
  User,
  Utensils
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Sidebar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: MessageSquare, label: 'AI Consultation', path: '/chat' },
    { icon: Calendar, label: 'Appointments', path: '/appointments' },
    { icon: Pill, label: 'Medications', path: '/medications' },
    { icon: Utensils, label: 'Diet Planner', path: '/diet-planner' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ icon: ShieldCheck, label: 'Admin Panel', path: '/admin' });
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
          <Activity className="text-white w-6 h-6" />
        </div>
        <span className="font-bold text-xl text-slate-900">MediGuard</span>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              isActive 
                ? "bg-emerald-50 text-emerald-700 font-medium" 
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 transition-colors",
              "group-hover:text-emerald-600"
            )} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-red-50 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 text-red-700 font-bold mb-1">
            <AlertCircle className="w-4 h-4" />
            <span>Emergency SOS (India)</span>
          </div>
          <p className="text-xs text-red-600 mb-3">Dial 108 for immediate assistance</p>
          <a 
            href="tel:108"
            className="block w-full py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 text-center"
          >
            Call 108 Ambulance
          </a>
        </div>

        <button
          onClick={() => { logout(); navigate('/'); }}
          className="flex items-center gap-3 px-4 py-3 w-full text-slate-500 hover:bg-slate-50 hover:text-red-600 rounded-xl transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
