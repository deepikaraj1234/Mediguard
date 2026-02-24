import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Calendar, 
  ShieldAlert, 
  Activity, 
  TrendingUp, 
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
  Search
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export default function Admin() {
  const { token } = useAuth();
  const [stats, setStats] = useState({ users: { count: 0 }, appointments: { count: 0 } });

  useEffect(() => {
    const fetchStats = async () => {
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setStats(await res.json());
    };
    fetchStats();
  }, [token]);

  const cards = [
    { label: 'Total Patients', value: stats.users.count, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%', up: true },
    { label: 'Active Appointments', value: stats.appointments.count, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+5%', up: true },
    { label: 'Security Incidents', value: '0', icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50', trend: '0%', up: true },
    { label: 'AI Performance', value: '99.4%', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50', trend: '+0.2%', up: true },
  ];

  return (
    <div className="p-8 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">System-wide performance and management.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-all">
            Export Reports
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">
            <UserPlus className="w-4 h-4" />
            Add Doctor
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-3 rounded-2xl", card.bg)}>
                <card.icon className={cn("w-6 h-6", card.color)} />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                card.up ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
              )}>
                {card.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {card.trend}
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{card.value}</div>
            <p className="text-sm text-slate-500 mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">Recent System Activity</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search logs..." 
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
          <div className="space-y-4">
            {[
              { user: 'Dr. Sarah Johnson', action: 'Completed consultation', time: '2 mins ago', status: 'success' },
              { user: 'System AI', action: 'Emergency escalation detected', time: '15 mins ago', status: 'warning' },
              { user: 'Admin', action: 'Updated security protocols', time: '1 hour ago', status: 'info' },
              { user: 'Patient #4421', action: 'New appointment booked', time: '3 hours ago', status: 'success' },
            ].map((log, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100">
                    <Activity className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{log.user}</h4>
                    <p className="text-xs text-slate-500">{log.action}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-medium">{log.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6">System Health</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600 font-medium">API Response Time</span>
                <span className="text-emerald-600 font-bold">42ms</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[95%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600 font-medium">Database Load</span>
                <span className="text-emerald-600 font-bold">12%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[12%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600 font-medium">AI Accuracy</span>
                <span className="text-emerald-600 font-bold">99.8%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[99%]" />
              </div>
            </div>
          </div>
          <div className="mt-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <div className="flex items-center gap-2 text-emerald-700 font-bold mb-1">
              <ShieldAlert className="w-4 h-4" />
              <span>All Systems Operational</span>
            </div>
            <p className="text-xs text-emerald-600">MediGuard AI is performing within optimal parameters.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Admin component ends here
