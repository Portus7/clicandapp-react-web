// admin-panel/src/App.jsx
import React, { useState, useEffect } from 'react';
import AdminDashboard from './admin/Dashboard';
import AgencyDashboard from './admin/AgencyDashboard';
import WelcomeAuth from './admin/WelcomeAuth'; // El nuevo componente del punto 3
import './index.css';

function App() {
    const [token, setToken] = useState(localStorage.getItem("authToken"));
    const [role, setRole] = useState(localStorage.getItem("userRole")); // 'admin' | 'agency'

    // Función Login exitoso
    const handleLoginSuccess = (data) => {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("userRole", data.role);
        // Si es agencia, guardamos su ID para que el dashboard sepa qué cargar
        if (data.agencyId) localStorage.setItem("agencyId", data.agencyId);

        setToken(data.token);
        setRole(data.role);
    };

    const logout = () => {
        localStorage.clear();
        setToken(null);
        setRole(null);
    };

    if (!token) {
        // Usamos el nuevo componente de bienvenida
        return <WelcomeAuth onLoginSuccess={handleLoginSuccess} />;
    }

    // RENDERIZADO CONDICIONAL POR ROL
    if (role === 'admin') {
        return <AdminDashboard token={token} onLogout={logout} />;
    }

    if (role === 'agency') {
        return <AgencyDashboard token={token} onLogout={logout} />;
    }

    return <div className="p-10 text-center">Rol desconocido. Contacte soporte. <button onClick={logout}>Salir</button></div>;
}

export default App;