import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Search, 
  Filter,
  CheckCircle2,
  XCircle,
  Plus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Appointment } from '../types';

export default function Appointments() {
  const { token } = useAuth();
  const location = useLocation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    doctor_name: '',
    specialty: '',
    date: '',
    time: ''
  });

  useEffect(() => {
    if (location.state?.specialty) {
      setSelectedSpecialty(location.state.specialty);
      setFormData(prev => ({ ...prev, specialty: location.state.specialty }));
    }
  }, [location.state]);

  const fetchAppointments = async () => {
    const res = await fetch('/api/appointments', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setAppointments(await res.json());
  };

  useEffect(() => {
    fetchAppointments();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setShowModal(false);
      setFormData({ doctor_name: '', specialty: '', date: '', time: '' });
      fetchAppointments();
    }
  };

  const doctors = [
    { name: 'Dr. Sarah Johnson', specialty: 'Cardiology', availability: 'Available Today' },
    { name: 'Dr. Michael Chen', specialty: 'Neurology', availability: 'Available Tomorrow' },
    { name: 'Dr. Emily Brown', specialty: 'Pediatrics', availability: 'Next Week' },
    { name: 'Dr. James Wilson', specialty: 'Dermatology', availability: 'Available Today' },
    { name: 'Dr. Robert Miller', specialty: 'Orthopedics', availability: 'Available Today' },
    { name: 'Dr. Lisa Wang', specialty: 'General Medicine', availability: 'Available Today' },
    { name: 'Dr. David Smith', specialty: 'Pulmonology', availability: 'Available Tomorrow' },
    { name: 'Dr. Anna Garcia', specialty: 'Psychiatry', availability: 'Next Week' },
    { name: 'Dr. Kevin Lee', specialty: 'Oncology', availability: 'Available Today' },
    { name: 'Dr. Maria Rodriguez', specialty: 'Ophthalmology', availability: 'Available Tomorrow' },
    { name: 'Dr. John Doe', specialty: 'Emergency', availability: 'Available Now' },
    { name: 'Dr. Sophie Taylor', specialty: 'Nutrition', availability: 'Available Today' },
    { name: 'Dr. Chris Evans', specialty: 'Fitness', availability: 'Available Today' },
    { name: 'Dr. Rachel Green', specialty: 'Preventive Care', availability: 'Available Tomorrow' },
    { name: 'Dr. Tom Hardy', specialty: 'Vaccination', availability: 'Available Today' },
  ];

  const filteredDoctors = doctors.filter(doc => {
    const matchesSpecialty = selectedSpecialty ? doc.specialty === selectedSpecialty : true;
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpecialty && matchesSearch;
  });

  return (
    <div className="p-8 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Appointments</h1>
          <p className="text-slate-500 mt-1">Manage your consultations and medical visits.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
        >
          <Plus className="w-5 h-5" />
          Book Appointment
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Appointment List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search doctors or specialties..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <button className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">
              <Filter className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {appointments.map((app) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                    <span className="text-xs font-bold uppercase">{app.date.split('-')[1]}</span>
                    <span className="text-2xl font-bold leading-none">{app.date.split('-')[2]}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{app.doctor_name}</h3>
                    <p className="text-slate-500 font-medium">{app.specialty}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1.5 text-sm text-slate-400">
                        <Clock className="w-4 h-4" /> {app.time}
                      </span>
                      <span className="flex items-center gap-1.5 text-sm text-slate-400">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Confirmed
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                    Reschedule
                  </button>
                  <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                    Cancel
                  </button>
                </div>
              </motion.div>
            ))}
            {appointments.length === 0 && (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                <CalendarIcon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900">No appointments yet</h3>
                <p className="text-slate-500 max-w-xs mx-auto mt-2">Book your first consultation with our specialist doctors.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Recommended Doctors */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">
              {selectedSpecialty ? `${selectedSpecialty} Specialists` : 'Recommended Doctors'}
            </h2>
            {selectedSpecialty && (
              <button 
                onClick={() => setSelectedSpecialty(null)}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg"
              >
                Clear Filter
              </button>
            )}
          </div>
          <div className="space-y-4">
            {filteredDoctors.map((doc) => (
              <div key={doc.name} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{doc.name}</h4>
                    <p className="text-xs text-slate-500">{doc.specialty}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    {doc.availability}
                  </span>
                  <button 
                    onClick={() => {
                      setFormData({ ...formData, doctor_name: doc.name, specialty: doc.specialty });
                      setShowModal(true);
                    }}
                    className="text-sm font-bold text-emerald-600 hover:underline"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative"
          >
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Book Appointment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Doctor Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={formData.doctor_name}
                  onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Specialty</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Time</label>
                  <input 
                    type="time" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all mt-4"
              >
                Confirm Booking
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
