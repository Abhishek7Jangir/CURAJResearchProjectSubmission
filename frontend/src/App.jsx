import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/auth/Landing';
import ProfessorLayout from './layouts/professor/ProfessorLayout';
import HodDashboard from './pages/approvers/HodDashboard';
import DeanDashboard from './pages/approvers/DeanDashboard';
import RndHelperDashboard from './pages/approvers/RndHelperDashboard';
import RndMainDashboard from './pages/approvers/RndMainDashboard';
import AcademicIntegrityOfficerDashboard from './pages/approvers/AcademicIntegrityOfficerDashboard';
import FinanceOfficerHelperDashboard from './pages/approvers/FinanceOfficerHelperDashboard';
import FinanceOfficerMainDashboard from './pages/approvers/FinanceOfficerMainDashboard';
import RegistrarDashboard from './pages/approvers/RegistrarDashboard';
import VcOfficeDashboard from './pages/approvers/VcOfficeDashboard';
import ViceChancellorDashboard from './pages/approvers/ViceChancellorDashboard';

// ── Single source of truth for designation → route + allowed designations ──
const ROUTE_MAP = {
  pi:                       '/dashboard',
  professor:                '/dashboard', // backward compatibility
  hod:                      '/hod-dashboard',
  rnd:                      '/hod-dashboard',
  fund:                     '/hod-dashboard',
  dean:                     '/dean-dashboard',
  'r&d_helper':             '/rnd-helper-dashboard',
  rnd_helper:               '/rnd-helper-dashboard',
  'r&d_main':               '/rnd-main-dashboard',
  rnd_main:                 '/rnd-main-dashboard',
  academic_integrity_officer: '/academic-integrity-officer-dashboard',
  aio:                      '/academic-integrity-officer-dashboard',
  finance_officer_helper:   '/finance-officer-helper-dashboard',
  finance_officer_main:     '/finance-officer-main-dashboard',
  registrar:                '/registrar-dashboard',
  vc_office:                '/vc-office-dashboard',
  vice_chancellor:          '/vice-chancellor-dashboard',
  vc:                       '/vice-chancellor-dashboard',
};

const ROLE_NAMES = {
  pi:                       'PI',
  professor:                'PI', // backward compatibility
  hod:                      'HOD',
  dean:                     'Dean',
  'r&d_helper':             'R&D Office',
  rnd_helper:               'R&D Office',
  'r&d_main':               'R&D',
  rnd_main:                 'R&D',
  academic_integrity_officer: 'Internal Audit Officer',
  aio:                      'Internal Audit Officer',
  finance_officer_helper:   'Finance Office',
  finance_officer_main:     'Finance Officer',
  registrar:                'Registrar',
  rnd:                      'R&D Department',
  fund:                     'Fund Department',
  vc:                       'Vice Chancellor',
  vc_office:                'VC Office',
  vice_chancellor:          'Vice Chancellor',
};

export function getRoleName(designation) {
  return ROLE_NAMES[designation?.toLowerCase()] || 'User';
}

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const token = sessionStorage.getItem('token');   // ← sessionStorage
      if (token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
            setUser({ ...data.user, role: getRoleName(data.user.designation) });
          } else {
            sessionStorage.removeItem('token');         // ← sessionStorage
          }
        } catch (err) {
          console.error('Session restore failed', err);
          sessionStorage.removeItem('token');           // ← sessionStorage
        }
      }
      setAuthLoading(false);
    };
    checkUser();

    // NOTE: the 'storage' event listener has been intentionally removed.
    // The 'storage' event only fires for localStorage, never for sessionStorage,
    // so it would be a no-op here. Each tab manages its own session independently.
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogin = (userData) => {
    setUser(userData);
    showNotification('Welcome to CURAJ Research Portal!');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('token');                 // ← sessionStorage
    setUser(null);
    showNotification('Logged out successfully');
  };

  const getDashboardRoute = () => {
    if (!user) return '/';
    const key = user.designation?.toLowerCase();
    const route = ROUTE_MAP[key];
    if (!route) {
      console.warn('[getDashboardRoute] unrecognised designation:', key);
    }
    return route || '/';
  };

  const canAccess = (allowedDesignations) => {
    if (!user) return false;
    return allowedDesignations.includes(user.designation?.toLowerCase());
  };

  if (authLoading) {
    return (
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', fontFamily:'sans-serif', color:'#555' }}>
        Loading…
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to={getDashboardRoute()} replace /> : <Landing onLogin={handleLogin} />}
        />

        <Route
          path="/dashboard/*"
          element={
            canAccess(['pi','professor']) ? (
              <ProfessorLayout user={user} onLogout={handleLogout} notification={notification} showNotification={showNotification} />
            ) : <Navigate to="/" replace />
          }
        />

        <Route
          path="/hod-dashboard/*"
          element={
            canAccess(['hod','rnd','fund']) ? (
              <HodDashboard user={user} onLogout={handleLogout} notification={notification} showNotification={showNotification} />
            ) : <Navigate to="/" replace />
          }
        />

        <Route
          path="/dean-dashboard/*"
          element={
            canAccess(['dean']) ? (
              <DeanDashboard user={user} onLogout={handleLogout} notification={notification} showNotification={showNotification} />
            ) : <Navigate to="/" replace />
          }
        />

        <Route
          path="/rnd-helper-dashboard/*"
          element={
            canAccess(['r&d_helper','rnd_helper']) ? (
              <RndHelperDashboard user={user} onLogout={handleLogout} notification={notification} showNotification={showNotification} />
            ) : <Navigate to="/" replace />
          }
        />

        <Route
          path="/rnd-main-dashboard/*"
          element={
            canAccess(['r&d_main','rnd_main']) ? (
              <RndMainDashboard user={user} onLogout={handleLogout} notification={notification} showNotification={showNotification} />
            ) : <Navigate to="/" replace />
          }
        />

        <Route
          path="/academic-integrity-officer-dashboard/*"
          element={
            canAccess(['academic_integrity_officer','aio']) ? (
              <AcademicIntegrityOfficerDashboard user={user} onLogout={handleLogout} notification={notification} showNotification={showNotification} />
            ) : <Navigate to="/" replace />
          }
        />

        <Route
          path="/finance-officer-helper-dashboard/*"
          element={
            canAccess(['finance_officer_helper']) ? (
              <FinanceOfficerHelperDashboard user={user} onLogout={handleLogout} notification={notification} showNotification={showNotification} />
            ) : <Navigate to="/" replace />
          }
        />

        <Route
          path="/finance-officer-main-dashboard/*"
          element={
            canAccess(['finance_officer_main']) ? (
              <FinanceOfficerMainDashboard user={user} onLogout={handleLogout} notification={notification} showNotification={showNotification} />
            ) : <Navigate to="/" replace />
          }
        />

        <Route
          path="/registrar-dashboard/*"
          element={
            canAccess(['registrar']) ? (
              <RegistrarDashboard user={user} onLogout={handleLogout} notification={notification} showNotification={showNotification} />
            ) : <Navigate to="/" replace />
          }
        />

        <Route
          path="/vc-office-dashboard/*"
          element={
            canAccess(['vc_office']) ? (
              <VcOfficeDashboard user={user} onLogout={handleLogout} notification={notification} showNotification={showNotification} />
            ) : <Navigate to="/" replace />
          }
        />

        <Route
          path="/vice-chancellor-dashboard/*"
          element={
            canAccess(['vice_chancellor','vc']) ? (
              <ViceChancellorDashboard user={user} onLogout={handleLogout} notification={notification} showNotification={showNotification} />
            ) : <Navigate to="/" replace />
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;