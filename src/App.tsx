import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import SpecialtyChat from './pages/SpecialtyChat';
import Appointments from './pages/Appointments';
import Medications from './pages/Medications';
import DietPlanner from './pages/DietPlanner';
import Admin from './pages/Admin';
import Profile from './pages/Profile';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  return token ? <>{children}</> : <Navigate to="/" />;
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
          <Route path="/chat" element={<PrivateRoute><Layout><Chat /></Layout></PrivateRoute>} />
          <Route path="/specialty-chat/:specialty" element={<PrivateRoute><Layout><SpecialtyChat /></Layout></PrivateRoute>} />
          <Route path="/appointments" element={<PrivateRoute><Layout><Appointments /></Layout></PrivateRoute>} />
          <Route path="/medications" element={<PrivateRoute><Layout><Medications /></Layout></PrivateRoute>} />
          <Route path="/diet-planner" element={<PrivateRoute><Layout><DietPlanner /></Layout></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute><Layout><Admin /></Layout></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
