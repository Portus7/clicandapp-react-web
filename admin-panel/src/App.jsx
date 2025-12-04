import React from 'react';
import AdminDashboard from './admin/Dashboard'; // Importamos tu panel
import './index.css'; // Aseguramos que cargue Tailwind

function App() {
  return (
    // Renderizamos directamente tu Dashboard
    <AdminDashboard />
  );
}

export default App;