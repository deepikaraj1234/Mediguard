import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Heart, 
  Droplets, 
  Wind,
  Plus,
  ArrowRight,
  Pill,
  Stethoscope,
  Brain,
  Bone,
  Baby,
  Eye,
  Ribbon,
  Apple,
  Dumbbell,
  ShieldCheck,
  Syringe,
  Smile,
  BrainCircuit
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Appointment, Medication } from '../types';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appRes, medRes] = await Promise.all([
          fetch('/api/appointments', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/medications', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        if (appRes.ok) setAppointments(await appRes.json());
        if (medRes.ok) setMedications(await medRes.json());
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [token]);

  const stats = [
    { label: 'Heart Rate', value: '72', unit: 'bpm', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Blood Sugar', value: '98', unit: 'mg/dL', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Oxygen', value: '99', unit: '%', icon: Wind, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Activity', value: '8.4k', unit: 'steps', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  const specialties = [
    { name: 'General Medicine', icon: Stethoscope, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { name: 'Cardiology', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
    { name: 'Neurology', icon: Brain, color: 'text-purple-500', bg: 'bg-purple-50' },
    { name: 'Orthopedics', icon: Bone, color: 'text-blue-500', bg: 'bg-blue-50' },
    { name: 'Dermatology', icon: Smile, color: 'text-orange-500', bg: 'bg-orange-50' },
    { name: 'Pediatrics', icon: Baby, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    { name: 'Pulmonology', icon: Wind, color: 'text-sky-500', bg: 'bg-sky-50' },
    { name: 'Psychiatry', icon: BrainCircuit, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { name: 'Oncology', icon: Ribbon, color: 'text-pink-500', bg: 'bg-pink-50' },
    { name: 'Ophthalmology', icon: Eye, color: 'text-teal-500', bg: 'bg-teal-50' },
    { name: 'Emergency', icon: Activity, color: 'text-red-500', bg: 'bg-red-50' },
    { name: 'Nutrition', icon: Apple, color: 'text-green-500', bg: 'bg-green-50' },
    { name: 'Fitness', icon: Dumbbell, color: 'text-amber-500', bg: 'bg-amber-50' },
    { name: 'Preventive Care', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Vaccination', icon: Syringe, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="p-8 space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user?.name}</h1>
          <p className="text-slate-500 mt-1">Here's your health overview for today.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">
            <Plus className="w-4 h-4" />
            Log Health Data
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-3 rounded-2xl", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+2.5%</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
              <span className="text-sm text-slate-500">{stat.unit}</span>
            </div>
            <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Medical Specialties Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Medical Specialties</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {specialties.map((spec, i) => (
            <motion.div
              key={spec.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/specialty-chat/${encodeURIComponent(spec.name)}`)}
              className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer flex flex-col items-center text-center group"
            >
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110", spec.bg)}>
                <spec.icon className={cn("w-6 h-6", spec.color)} />
              </div>
              <span className="text-xs font-bold text-slate-700 leading-tight">{spec.name}</span>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Appointments */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">Upcoming Appointments</h2>
            <button className="text-sm text-emerald-600 font-medium flex items-center gap-1 hover:underline">
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {appointments.length > 0 ? appointments.map((app) => (
              <div key={app.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 hover:border-emerald-200 transition-colors">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex flex-col items-center justify-center text-slate-500">
                  <span className="text-xs font-bold uppercase">{app.date.split('-')[1]}</span>
                  <span className="text-lg font-bold leading-none">{app.date.split('-')[2]}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">{app.doctor_name}</h3>
                  <p className="text-sm text-slate-500">{app.specialty} • {app.time}</p>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">
                  Confirmed
                </span>
              </div>
            )) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No upcoming appointments</p>
                <button className="mt-4 text-emerald-600 font-bold">Book Now</button>
              </div>
            )}
          </div>
        </div>

        {/* Medication Reminders */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Medications</h2>
          <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-6">
            {medications.length > 0 ? medications.map((med) => (
              <div key={med.id} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Pill className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{med.name}</h3>
                  <p className="text-xs text-slate-500">{med.dosage} • {med.frequency}</p>
                  <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold mt-2">
                    <Clock className="w-3 h-3" />
                    Next: {med.time}
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-slate-500 text-sm text-center py-4">No medications logged</p>
            )}
            <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 text-sm font-medium hover:border-emerald-200 hover:text-emerald-600 transition-all">
              + Add Medication
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard component ends here
