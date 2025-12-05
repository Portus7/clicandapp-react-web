import React from 'react';
import AdminDashboard from './admin/Dashboard'; // Importamos tu panel
import AgencyDashboard from './admin/AgencyDashboard';
import './index.css'; // Aseguramos que cargue Tailwind

function App() {
  // Detectar si estamos en modo agencia por URL (ej: /?mode=agency)
  // O idealmente usar react-router-dom
  const params = new URLSearchParams(window.location.search);
  const isAgencyMode = params.get("mode") === "agency" || window.location.pathname.includes("/agency");

  return isAgencyMode ? <AgencyDashboard /> : <AdminDashboard />;
}

export default App;