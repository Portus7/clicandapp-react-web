import React, { useState, useEffect } from 'react';
import AdminDashboard from './admin/Dashboard';
import AgencyDashboard from './admin/AgencyDashboard';
import Login from './admin/Login';
import './index.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem("authToken"));

  // Detectar modo (admin o agencia)
  const params = new URLSearchParams(window.location.search);
  const isAgencyMode = params.get("mode") === "agency" || window.location.pathname.includes("/agency");

  // Si no hay token, mostramos Login
  if (!token) {
    return <Login onLoginSuccess={(newToken) => setToken(newToken)} />;
  }

  // Opción para cerrar sesión (puedes pasarla como prop a los dashboards)
  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    setToken(null);
  };

  return isAgencyMode
    ? <AgencyDashboard token={token} onLogout={logout} />
    : <AdminDashboard token={token} onLogout={logout} />;
}

export default App;