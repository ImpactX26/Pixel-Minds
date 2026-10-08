import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HeroPage from './pages/HeroPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';

// ProtectedRoute component to guard internal application routes
function ProtectedRoute({ children }) {
  const isAuth = localStorage.getItem('pixelmind_demo_auth') === 'true';
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export function App() {
  return (
    <Routes>
      {/* Route 1: FRONT2 Hero/Landing Page */}
      <Route path="/" element={<HeroPage />} />

      {/* Route 2: Demo Login Page */}
      <Route path="/login" element={<LoginPage />} />

      {/* Route 3: FRONT1 Home/Dashboard (Protected) */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
