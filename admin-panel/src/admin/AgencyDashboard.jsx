// src/admin/AgencyDashboard.jsx
import React, { useState, useEffect } from 'react';
import LocationDetailsModal from './LocationDetailsModal'; // Componente externo
import ThemeToggle from '../components/ThemeToggle'; // Componente de tema
import {
    Building2, Smartphone, Settings, Plus, RefreshCw, ExternalLink, Link2, LogOut
} from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || "https://wa.clicandapp.com").replace(/\/$/, "");
const INSTALL_APP_URL = import.meta.env.INSTALL_APP_URL || "https://gestion.clicandapp.com/integration/691623d58a49cdcb2c56ce9c";

export default function AgencyDashboard({ token, onLogout }) {
    const [storedAgencyId, setStoredAgencyId] = useState(localStorage.getItem("agencyId"));
    const queryParams = new URLSearchParams(window.location.search);
    const AGENCY_ID = storedAgencyId || queryParams.get("agencyId");

    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAutoSyncing, setIsAutoSyncing] = useState(false);

    const authFetch = async (endpoint, options = {}) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                ...options.headers,
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.status === 401 || res.status === 403) {
            onLogout();
            throw new Error("Sesión expirada");
        }
        return res;
    };

    useEffect(() => {
        const newInstallId = queryParams.get("new_install");
        if (newInstallId && !isAutoSyncing) autoSyncAgency(newInstallId);
    }, []);

    const autoSyncAgency = async (locationId) => {
        setIsAutoSyncing(true);
        try {
            await new Promise(r => setTimeout(r, 2000));
            const res = await authFetch(`/agency/sync-ghl`, { method: "POST", body: JSON.stringify({ locationIdToVerify: locationId }) });
            const data = await res.json();

            if (data.success && data.newAgencyId) {
                localStorage.setItem("agencyId", data.newAgencyId);
                setStoredAgencyId(data.newAgencyId);
                window.history.replaceState({}, document.title, window.location.pathname);
                alert("¡Vinculación exitosa!");
            } else {
                alert("Hubo un problema verificando la instalación.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsAutoSyncing(false);
            if (AGENCY_ID) fetchLocations();
        }
    };

    const fetchLocations = () => {
        if (!AGENCY_ID) { setLoading(false); return; }
        setLoading(true);
        authFetch(`/agency/locations?agencyId=${AGENCY_ID}`)
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) setLocations(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => { fetchLocations(); }, [AGENCY_ID]);

    const handleInstallApp = () => window.location.href = INSTALL_APP_URL;

    // --- RENDERIZADO: Auto-Sync ---
    if (isAutoSyncing) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-center">
                    <div className="animate-spin text-indigo-600 dark:text-indigo-400 mb-4 mx-auto w-10 h-10 border-4 border-t-transparent rounded-full"></div>
                    <h2 className="text-xl font-bold">Vinculando cuenta...</h2>
                </div>
            </div>
        );
    }

    // --- RENDERIZADO: Nueva Agencia ---
    if (!AGENCY_ID) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 text-center max-w-lg w-full">
                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Building2 className="text-indigo-600 dark:text-indigo-400" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Conecta tu Agencia</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">Instala la app para comenzar.</p>
                    <button onClick={handleInstallApp} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-xl font-bold transition flex items-center justify-center gap-2">
                        Comenzar Instalación <ExternalLink size={20} />
                    </button>
                    <div className="mt-6 flex justify-between items-center px-2">
                        <ThemeToggle />
                        <button onClick={onLogout} className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Cerrar Sesión</button>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDERIZADO: Panel Principal ---
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans p-6 transition-colors duration-200">
            <div className="max-w-7xl mx-auto">
                {/* Header Card */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                            <Building2 size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Panel de Agencia</h1>
                            <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                {AGENCY_ID}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <button onClick={fetchLocations} className="p-2.5 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 bg-gray-100 dark:bg-gray-800 rounded-lg transition hover:scale-105">
                            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                        </button>
                        <button onClick={handleInstallApp} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-bold shadow-md transition hover:-translate-y-0.5">
                            <Plus size={18} /><span className="hidden sm:inline">Nueva Subcuenta</span>
                        </button>
                        <button onClick={onLogout} className="p-2.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30 transition">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>

                {/* Lista de Locations */}
                {loading ? (
                    <div className="text-center py-20">
                        <RefreshCw className="animate-spin mx-auto text-indigo-500 mb-3" size={32} />
                        <p className="text-gray-400">Cargando datos...</p>
                    </div>
                ) : locations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                        <Smartphone className="text-gray-300 dark:text-gray-600 mb-4" size={48} />
                        <h3 className="text-xl font-bold text-gray-500 dark:text-gray-400">Sin subcuentas vinculadas</h3>
                        <button onClick={handleInstallApp} className="mt-4 text-indigo-600 font-bold hover:underline">Instalar App ahora</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {locations.map(loc => (
                            <div
                                key={loc.location_id}
                                onClick={() => setSelectedLocation(loc)}
                                className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-indigo-400 dark:hover:border-indigo-600 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                            >
                                {/* Efecto Hover Sutil */}
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Smartphone size={80} />
                                </div>

                                <div className="relative z-10 flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-lg text-gray-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate max-w-[200px] transition-colors">
                                        {loc.name || loc.location_name}
                                    </h3>
                                    <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg text-gray-400 dark:text-gray-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        <Settings size={20} />
                                    </div>
                                </div>
                                <div className="relative z-10 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                        <Smartphone size={16} />
                                        <span>{loc.total_slots || 0} Disp.</span>
                                    </div>
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                        Gestionar →
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* MODAL DETALLES */}
                {selectedLocation && (
                    <LocationDetailsModal
                        location={selectedLocation}
                        token={token}
                        onLogout={onLogout}
                        onClose={() => setSelectedLocation(null)}
                    />
                )}
            </div>
        </div>
    );
}