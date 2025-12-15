import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
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

    return (
        <>
            {/* ✅ AGREGAR EL TOASTER AQUÍ */}
            <Toaster
                position="top-center"
                richColors
                closeButton
                theme="system" // Se adapta a tu ThemeContext automáticamente si usas la clase 'dark' en HTML
            />

            {/* Lógica de Router Manual (igual que antes) */}
            {!token ? (
                <WelcomeAuth onLoginSuccess={handleLoginSuccess} />
            ) : role === 'admin' ? (
                <AdminDashboard token={token} onLogout={logout} />
            ) : role === 'agency' ? (
                <AgencyDashboard token={token} onLogout={logout} />
            ) : (
                <div className="min-h-screen flex items-center justify-center">
                    <p>Rol desconocido.</p> <button onClick={logout}>Salir</button>
                </div>
            )}
        </>
    );
}

export default App;