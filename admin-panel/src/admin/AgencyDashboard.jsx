import React, { useState, useEffect } from 'react';
// 👇 Importamos el nuevo componente
import LocationDetailsModal from './LocationDetailsModal';
import {
    Building2, Smartphone, Settings, Plus, RefreshCw, ExternalLink, Link2
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

    if (isAutoSyncing) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <div className="bg-white p-8 rounded-xl shadow text-center border border-gray-100">
                    <Loader2 size={40} className="animate-spin text-indigo-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold">Vinculando cuenta...</h2>
                </div>
            </div>
        );
    }

    if (!AGENCY_ID) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-lg border border-gray-100">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Building2 className="text-indigo-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Conecta tu Agencia</h2>
                    <button onClick={handleInstallApp} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-xl font-bold transition flex items-center justify-center gap-2">
                        Comenzar Instalación <ExternalLink size={20} />
                    </button>
                    <button onClick={onLogout} className="mt-6 text-sm text-gray-400 hover:text-gray-600">Cerrar Sesión</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 bg-white p-4 rounded-xl border border-gray-100 shadow-sm gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-lg text-white">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-800">Panel de Agencia</h1>
                            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-500">ID: {AGENCY_ID}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={fetchLocations} className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg transition"><RefreshCw size={20} className={loading ? "animate-spin" : ""} /></button>
                        <button onClick={handleInstallApp} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm"><Plus size={18} /><span className="hidden sm:inline">Nueva Subcuenta</span></button>
                        <button onClick={onLogout} className="text-sm text-red-600 hover:text-red-800 font-medium px-4 py-2 rounded-lg border border-red-100">Salir</button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20"><RefreshCw className="animate-spin mx-auto text-indigo-500 mb-3" size={32} /><p className="text-gray-400">Cargando...</p></div>
                ) : locations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
                        <Smartphone className="text-indigo-400 mb-4" size={48} />
                        <h3 className="text-xl font-bold text-gray-900">Sin subcuentas</h3>
                        <button onClick={handleInstallApp} className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold">Instalar App</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {locations.map(loc => (
                            <div key={loc.location_id} onClick={() => setSelectedLocation(loc)} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-indigo-300 transition cursor-pointer group">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-lg text-gray-800 group-hover:text-indigo-600 truncate max-w-[200px]">{loc.name || loc.location_name}</h3>
                                    <div className="bg-gray-50 p-2.5 rounded-lg text-gray-400"><Settings size={20} /></div>
                                </div>
                                <div className="pt-4 border-t border-gray-50 flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-1.5 text-gray-500"><Smartphone size={16} /><span>{loc.total_slots || 0} Dispositivos</span></div>
                                    <span className="font-bold text-indigo-600 text-xs opacity-0 group-hover:opacity-100 transition">Gestionar →</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 👇 MODAL REUTILIZABLE IMPORTADO */}
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