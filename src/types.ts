export interface User {
  id: number;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
}

export interface Appointment {
  id: number;
  patient_id: number;
  doctor_name: string;
  specialty: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface Medication {
  id: number;
  user_id: number;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
