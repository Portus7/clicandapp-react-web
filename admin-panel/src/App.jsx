import React, { useState, useEffect } from 'react';
import AdminDashboard from './admin/Dashboard';
import AgencyDashboard from './admin/AgencyDashboard';
import WelcomeAuth from './admin/WelcomeAuth';
import './index.css';

function App() {
    const [token, setToken] = useState(localStorage.getItem("authToken"));
    const [role, setRole] = useState(localStorage.getItem("userRole"));

    // Manejar Login Exitoso
    const handleLoginSuccess = (data) => {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("userRole", data.role);

        // Guardar Agency ID para el panel
        if (data.agencyId) {
            localStorage.setItem("agencyId", data.agencyId);
        } else {
            localStorage.removeItem("agencyId");
        }

        setToken(data.token);
        setRole(data.role);
    };

    const logout = () => {
        localStorage.clear();
        setToken(null);
        setRole(null);
        window.history.pushState({}, document.title, "/");
    };

    // 1. Sin Token -> Bienvenida
    if (!token) {
        return <WelcomeAuth onLoginSuccess={handleLoginSuccess} />;
    }

    // 2. Rol Admin -> Panel Maestro
    if (role === 'admin') {
        return <AdminDashboard token={token} onLogout={logout} />;
    }

    // 3. Rol Agencia -> Panel Agencia
    if (role === 'agency') {
        return <AgencyDashboard token={token} onLogout={logout} />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <p>Rol desconocido.</p> <button onClick={logout}>Salir</button>
        </div>
    );
}

export default App;