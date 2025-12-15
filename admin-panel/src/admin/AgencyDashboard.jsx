import React, { useState, useEffect } from 'react';
import LocationDetailsModal from './LocationDetailsModal';
import SubscriptionModal from './SubscriptionModal';
import ThemeToggle from '../components/ThemeToggle';
import {
    Building2, Smartphone, Settings, Plus, RefreshCw, ExternalLink,
    LogOut, CreditCard, Zap, ChevronRight, AlertTriangle, CheckCircle2,
    LayoutDashboard
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
    const [showSubModal, setShowSubModal] = useState(false);
    const [accountInfo, setAccountInfo] = useState(null);

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
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsAutoSyncing(false);
            if (AGENCY_ID) {
                fetchLocations();
                fetchAccountInfo();
            }
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

    const fetchAccountInfo = async () => {
        try {
            const res = await authFetch('/agency/info');
            if (res.ok) {
                const data = await res.json();
                setAccountInfo(data);
            }
        } catch (e) { console.error("Error info cuenta", e); }
    };

    const handlePortal = async () => {
        try {
            const res = await authFetch('/payments/portal', { method: 'POST' });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
            else alert("Error abriendo portal o no tienes suscripción activa.");
        } catch (e) { alert("Error de conexión"); }
    };

    useEffect(() => {
        if (AGENCY_ID) {
            fetchLocations();
            fetchAccountInfo();
        }
    }, [AGENCY_ID]);

    const handleInstallApp = () => window.location.href = INSTALL_APP_URL;

    // --- COMPONENTES VISUALES ---

    // Barra de Progreso Reutilizable
    const UsageBar = ({ current, max, label, icon: Icon, colorClass }) => {
        const percent = Math.min((current / max) * 100, 100);
        const isOverLimit = current > max;

        return (
            <div className="group">
                <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Icon size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
                    </div>
                    <div className="text-right">
                        <span className={`text-lg font-bold ${isOverLimit ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                            {current}
                        </span>
                        <span className="text-xs text-gray-400 font-medium"> / {max}</span>
                    </div>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ${isOverLimit ? 'bg-red-500' : colorClass}`}
                        style={{ width: `${percent}%` }}
                    ></div>
                </div>
                {isOverLimit && (
                    <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1">
                        <AlertTriangle size={10} /> Límite excedido. Actualiza tu plan.
                    </p>
                )}
            </div>
        );
    };

    // --- RENDERIZADO: Auto-Sync ---
    if (isAutoSyncing) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 text-center animate-pulse">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Sincronizando...</h2>
                </div>
            </div>
        );
    }

    // --- RENDERIZADO: Nueva Agencia ---
    if (!AGENCY_ID) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
                <div className="bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 text-center max-w-md w-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                    <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Building2 className="text-indigo-600 dark:text-indigo-400" size={40} />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">Bienvenido</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                        Para comenzar a automatizar WhatsApp, necesitamos vincular tu cuenta de GoHighLevel.
                    </p>
                    <button onClick={handleInstallApp} className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-indigo-600 dark:hover:bg-indigo-50 px-6 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-3">
                        <ExternalLink size={20} /> Conectar Agencia
                    </button>
                    <div className="mt-8 flex justify-center items-center gap-4">
                        <ThemeToggle />
                        <button onClick={onLogout} className="text-xs font-bold text-gray-400 hover:text-red-500 transition">CERRAR SESIÓN</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#0B0F19] text-gray-900 dark:text-gray-100 font-sans pb-20 transition-colors duration-200">

            {/* TOP BAR */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">CA</div>
                        <span className="font-bold text-lg tracking-tight hidden sm:block">Clic&App</span>
                        <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-2"></div>
                        <span className="text-xs font-mono text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{AGENCY_ID}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <button onClick={() => { fetchLocations(); fetchAccountInfo(); }} className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition" title="Recargar">
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        </button>
                        <button onClick={onLogout} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Salir">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* 1. SECCIÓN DE ESTADO DE CUENTA (UNIFICADA) */}
                {accountInfo && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden relative">
                        {/* Gradiente superior sutil */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-800">

                            {/* COLUMNA IZQUIERDA: PLAN & ACCIONES */}
                            <div className="p-6 md:w-1/3 flex flex-col justify-between relative bg-gray-50/50 dark:bg-gray-900/50">
                                <div>
                                    <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <Zap size={14} className="text-yellow-500" fill="currentColor" /> Tu Suscripción
                                    </h2>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white capitalize">
                                            {accountInfo.plan === 'active' ? 'Plan Pro' : accountInfo.plan}
                                        </h1>
                                        {accountInfo.plan === 'active' && <CheckCircle2 size={20} className="text-emerald-500" />}
                                    </div>

                                    {accountInfo.plan === 'trial' && accountInfo.trial_ends && (
                                        <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-100 dark:border-amber-900 mb-4">
                                            <AlertTriangle size={12} />
                                            Prueba termina: {new Date(accountInfo.trial_ends).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6">
                                    {accountInfo.plan === 'active' ? (
                                        <button onClick={handlePortal} className="w-full py-2.5 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 transition-all flex items-center justify-center gap-2 shadow-sm">
                                            <CreditCard size={16} /> Gestionar Pagos
                                        </button>
                                    ) : (
                                        <button onClick={() => setShowSubModal(true)} className="w-full py-3 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-bold hover:bg-indigo-600 dark:hover:bg-indigo-50 transition-all shadow-lg hover:shadow-indigo-500/20 flex items-center justify-center gap-2 group">
                                            <Zap size={16} className="group-hover:fill-current" /> Actualizar a Premium
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* COLUMNA DERECHA: MÉTRICAS */}
                            <div className="p-6 md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-8 items-center bg-white dark:bg-gray-900">
                                <UsageBar
                                    label="Subagencias Activas"
                                    icon={Building2}
                                    current={accountInfo.limits.used_subagencies}
                                    max={accountInfo.limits.max_subagencies}
                                    colorClass="bg-indigo-500"
                                />
                                <UsageBar
                                    label="Números Conectados (Slots)"
                                    icon={Smartphone}
                                    current={accountInfo.limits.used_slots}
                                    max={accountInfo.limits.max_slots}
                                    colorClass="bg-emerald-500"
                                />

                                <div className="sm:col-span-2 mt-2 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400">
                                    <span>Recursos actualizados en tiempo real</span>
                                    <button onClick={() => setShowSubModal(true)} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                                        ¿Necesitas más capacidad?
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. BARRA DE ACCIÓN SUBCUENTAS */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <LayoutDashboard size={20} className="text-gray-400" /> Subcuentas
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestiona tus conexiones de WhatsApp por ubicación.</p>
                    </div>
                    <button onClick={handleInstallApp} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-indigo-200 dark:shadow-none transition flex items-center gap-2">
                        <Plus size={18} /> Nueva Subcuenta
                    </button>
                </div>

                {/* 3. GRID DE SUBCUENTAS (CARDS REDISEÑADAS) */}
                {loading ? (
                    <div className="py-20 text-center">
                        <RefreshCw className="animate-spin mx-auto text-indigo-500 mb-4" size={32} />
                        <p className="text-gray-400 font-medium">Cargando tus subcuentas...</p>
                    </div>
                ) : locations.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-800 p-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Building2 className="text-gray-400" size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No tienes subcuentas</h3>
                        <p className="text-gray-500 mb-6">Conecta tu primera cuenta de GHL para empezar.</p>
                        <button onClick={handleInstallApp} className="text-indigo-600 font-bold hover:underline">Instalar App ahora</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {locations.map(loc => (
                            <div
                                key={loc.location_id}
                                onClick={() => setSelectedLocation(loc)}
                                className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 cursor-pointer relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                                        <Building2 size={20} />
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${loc.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900'
                                        : 'bg-gray-50 text-gray-500 border-gray-100'
                                        }`}>
                                        {loc.status || 'Desconocido'}
                                    </div>
                                </div>

                                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1 truncate pr-4 group-hover:text-indigo-600 transition-colors">
                                    {loc.name || "Sin Nombre"}
                                </h3>
                                <p className="text-xs font-mono text-gray-400 mb-6">{loc.location_id}</p>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                                        <Smartphone size={16} className="text-gray-400" />
                                        {loc.total_slots || 0} Slots
                                    </div>
                                    <span className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                        <ChevronRight size={16} />
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* MODAL DETALLES (Se mantiene igual) */}
                {selectedLocation && (
                    <LocationDetailsModal
                        location={selectedLocation}
                        token={token}
                        onLogout={onLogout}
                        onClose={() => setSelectedLocation(null)}
                    />
                )}

                {/* MODAL SUSCRIPCIÓN (Se mantiene igual)    */}
                {showSubModal && (
                    <SubscriptionModal
                        onClose={() => setShowSubModal(false)}
                        token={token}
                    />
                )}
            </main>
        </div>
    );
}