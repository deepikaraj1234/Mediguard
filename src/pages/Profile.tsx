import React from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Bell, 
  Lock,
  ChevronRight,
  Camera
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  const sections = [
    { icon: Shield, label: 'Privacy & Security', desc: 'Manage your data and encryption keys' },
    { icon: Bell, label: 'Notifications', desc: 'Configure health alerts and reminders' },
    { icon: Lock, label: 'Two-Factor Auth', desc: 'Secure your account with 2FA' },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 mt-1">Manage your personal information and health settings.</p>
      </header>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="h-32 bg-emerald-600 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="relative group">
              <div className="w-24 h-24 bg-white rounded-3xl p-1 shadow-lg">
                <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden">
                  <User className="w-12 h-12 text-slate-300" />
                </div>
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-white rounded-xl shadow-md border border-slate-100 text-emerald-600 hover:text-emerald-700 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="pt-16 pb-8 px-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{user?.name}</h2>
              <p className="text-slate-500 font-medium uppercase text-xs tracking-wider mt-1">{user?.role} Account</p>
            </div>
            <button className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">
              Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Mail className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Email Address</p>
                <p className="text-slate-700 font-medium">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Phone className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Phone Number</p>
                <p className="text-slate-700 font-medium">+1 (555) 000-0000</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <MapPin className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Location</p>
                <p className="text-slate-700 font-medium">New York, USA</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Shield className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Blood Type</p>
                <p className="text-slate-700 font-medium">O Positive (O+)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900">Account Settings</h3>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
          {sections.map((section) => (
            <button key={section.label} className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                  <section.icon className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-slate-900">{section.label}</h4>
                  <p className="text-sm text-slate-500">{section.desc}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
