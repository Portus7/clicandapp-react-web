import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import LocationDetailsModal from './LocationDetailsModal';
import SubscriptionModal from './SubscriptionModal';
import ThemeToggle from '../components/ThemeToggle';
import {
    Building2, Smartphone, Settings, Plus, RefreshCw, ExternalLink,
    LogOut, CreditCard, Zap, ChevronRight, AlertTriangle, CheckCircle2,
    LayoutDashboard, TrendingUp, ShieldCheck
} from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || "https://wa.clicandapp.com").replace(/\/$/, "");
const INSTALL_APP_URL = import.meta.env.INSTALL_APP_URL || "https://gestion.clicandapp.com/integration/691623d58a49cdcb2c56ce9c";
// 👇 CAMBIA ESTO POR TU NÚMERO DE SOPORTE REAL
const SUPPORT_PHONE = "595984756159";

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

        if (res.status === 401) {
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
        toast.promise(
            (async () => {
                await new Promise(r => setTimeout(r, 2000));
                const res = await authFetch(`/agency/sync-ghl`, { method: "POST", body: JSON.stringify({ locationIdToVerify: locationId }) });
                const data = await res.json();
                if (!data.success || !data.newAgencyId) throw new Error("No se pudo verificar la instalación.");
                return data;
            })(),
            {
                loading: 'Vinculando cuenta con GoHighLevel...',
                success: (data) => {
                    localStorage.setItem("agencyId", data.newAgencyId);
                    setStoredAgencyId(data.newAgencyId);
                    window.history.replaceState({}, document.title, window.location.pathname);
                    return '¡Vinculación exitosa! Bienvenido.';
                },
                error: 'Hubo un problema verificando la instalación.'
            }
        );

        setTimeout(() => {
            setIsAutoSyncing(false);
            if (AGENCY_ID) {
                fetchLocations();
                fetchAccountInfo();
            }
        }, 1000);
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
        const loadingToast = toast.loading("Conectando con Stripe...");
        try {
            const res = await authFetch('/payments/portal', { method: 'POST' });
            const data = await res.json();
            toast.dismiss(loadingToast);

            if (data.url) window.location.href = data.url;
            else toast.error("No se pudo abrir el portal de facturación.");
        } catch (e) {
            toast.dismiss(loadingToast);
            toast.error("Error de conexión con el servidor de pagos.");
        }
    };

    useEffect(() => {
        if (AGENCY_ID) {
            fetchLocations();
            fetchAccountInfo();
        }
    }, [AGENCY_ID]);

    // ✅ NUEVA LÓGICA DE INSTALACIÓN CON VERIFICACIÓN
    const handleInstallApp = () => {
        // 1. Verificar si tenemos la info de la cuenta cargada
        if (accountInfo) {
            const { used_subagencies, max_subagencies } = accountInfo.limits;

            // 2. Comprobar límites
            if (used_subagencies >= max_subagencies) {
                toast.error("Cupo de Subagencias Agotado", {
                    description: `Has usado ${used_subagencies} de ${max_subagencies} licencias disponibles.`,
                    duration: 6000,
                    icon: <AlertTriangle className="text-amber-500" />,
                    action: {
                        label: 'Contactar Soporte',
                        onClick: () => window.open(`https://wa.me/${SUPPORT_PHONE}`, "_blank")
                    }
                });
                return; // ⛔ DETENER LA REDIRECCIÓN
            }
        }

        // 3. Si todo bien (o info aun no carga), proceder
        window.location.href = INSTALL_APP_URL;
    };

    // --- COMPONENTES VISUALES ---

    const UsageBar = ({ current, max, label, icon: Icon, colorClass, bgClass }) => {
        const percent = Math.min((current / max) * 100, 100);
        const isOverLimit = current > max;

        return (
            <div className="relative group">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${bgClass} text-white dark:text-gray-100 shadow-sm`}>
                            <Icon size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{label}</p>
                            <p className={`text-xl font-extrabold leading-none mt-0.5 ${isOverLimit ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                                {current} <span className="text-sm font-medium text-gray-400">/ {max}</span>
                            </p>
                        </div>
                    </div>
                </div>
                <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner border border-gray-200 dark:border-gray-700/50">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${isOverLimit ? 'bg-red-500' : colorClass}`}
                        style={{ width: `${percent}%` }}
                    ></div>
                </div>
                {isOverLimit && (
                    <p className="absolute -bottom-5 right-0 text-[10px] text-red-500 font-bold flex items-center gap-1 animate-pulse">
                        <AlertTriangle size={10} /> Límite excedido
                    </p>
                )}
            </div>
        );
    };

    // --- RENDERIZADO: Auto-Sync ---
    if (isAutoSyncing) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700 text-center animate-in fade-in zoom-in duration-300">
                    <div className="relative w-16 h-16 mx-auto mb-6">
                        <div className="absolute inset-0 border-4 border-indigo-100 dark:border-indigo-900/30 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sincronizando</h2>
                    <p className="text-sm text-gray-500">Conectando con tu agencia...</p>
                </div>
            </div>
        );
    }

    // --- RENDERIZADO: Nueva Agencia ---
    if (!AGENCY_ID) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute -top-20 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute top-40 -left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
                </div>

                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/50 dark:border-gray-700 text-center max-w-md w-full relative z-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30 transform rotate-3">
                        <Building2 className="text-white" size={40} />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">Bienvenido</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                        Conecta tu cuenta de GoHighLevel para activar tu panel de automatización de WhatsApp.
                    </p>
                    <button onClick={handleInstallApp} className="w-full group relative bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-indigo-600 dark:hover:bg-indigo-50 px-6 py-4 rounded-xl font-bold transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-3 overflow-hidden">
                        <span className="relative z-10 flex items-center gap-2">Conectar Agencia <ExternalLink size={18} /></span>
                    </button>
                    <div className="mt-8 flex justify-center items-center gap-4">
                        <ThemeToggle />
                        <button onClick={onLogout} className="text-xs font-bold text-gray-400 hover:text-red-500 transition uppercase tracking-wider">Cerrar Sesión</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0f1117] text-gray-900 dark:text-gray-100 font-sans pb-20 transition-colors duration-300">

            {/* 1. NAVBAR FLOTANTE */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-[#0f1117]/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
                            CA
                        </div>
                        <div>
                            <h1 className="font-bold text-base leading-tight text-gray-900 dark:text-white">Panel de Agencia</h1>
                            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">{AGENCY_ID}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 mx-1"></div>
                        <button onClick={onLogout} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all" title="Salir">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

                {/* 2. HERO SECTION: ESTADO DE CUENTA */}
                {accountInfo && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">

                        {/* TARJETA DE PLAN */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200/60 dark:border-gray-800 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/20"></div>

                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${accountInfo.plan === 'active'
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-900'
                                            : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900'
                                            }`}>
                                            {accountInfo.plan === 'active' ? '● Activo' : '● Prueba'}
                                        </div>
                                    </div>
                                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1">
                                        {accountInfo.plan === 'active' ? 'Plan Premium' : 'Plan Trial'}
                                    </h2>
                                    {accountInfo.plan === 'trial' && accountInfo.trial_ends && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Vence el {new Date(accountInfo.trial_ends).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>

                                <div className="mt-6">
                                    {accountInfo.plan === 'active' ? (
                                        <button onClick={handlePortal} className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-all shadow-sm hover:shadow-md text-sm">
                                            <CreditCard size={16} /> Facturación y Métodos
                                        </button>
                                    ) : (
                                        <button onClick={() => setShowSubModal(true)} className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl transition-all shadow-lg shadow-gray-200 dark:shadow-none hover:scale-[1.02] active:scale-95 text-sm">
                                            <Zap size={16} className="text-yellow-400 dark:text-yellow-600 fill-current" /> Mejorar Suscripción
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* TARJETA DE RECURSOS */}
                        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm border border-gray-200/60 dark:border-gray-800 flex flex-col justify-center">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <TrendingUp size={20} className="text-indigo-600 dark:text-indigo-400" /> Consumo de Recursos
                                </h3>
                                <button onClick={() => setShowSubModal(true)} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                                    Aumentar Límites
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                                <UsageBar
                                    label="Subcuentas"
                                    icon={Building2}
                                    current={accountInfo.limits.used_subagencies}
                                    max={accountInfo.limits.max_subagencies}
                                    colorClass="bg-gradient-to-r from-blue-500 to-indigo-600"
                                    bgClass="bg-indigo-600"
                                />
                                <UsageBar
                                    label="Números (Slots)"
                                    icon={Smartphone}
                                    current={accountInfo.limits.used_slots}
                                    max={accountInfo.limits.max_slots}
                                    colorClass="bg-gradient-to-r from-emerald-400 to-teal-500"
                                    bgClass="bg-teal-600"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. ZONA DE SUBCUENTAS */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <LayoutDashboard size={22} className="text-gray-400" /> Subcuentas Vinculadas
                            </h2>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { fetchLocations(); fetchAccountInfo(); }}
                                className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition shadow-sm hover:shadow"
                            >
                                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                            </button>
                            <button
                                onClick={handleInstallApp}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:translate-y-px active:translate-y-0.5"
                            >
                                <Plus size={18} /> <span className="hidden sm:inline">Nueva Subcuenta</span>
                            </button>
                        </div>
                    </div>

                    {/* GRID DE SUBCUENTAS */}
                    {loading ? (
                        <div className="py-24 text-center">
                            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-400 font-medium">Cargando subcuentas...</p>
                        </div>
                    ) : locations.length === 0 ? (
                        <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 p-16 text-center">
                            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Building2 className="text-gray-300 dark:text-gray-600" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No hay subcuentas activas</h3>
                            <p className="text-gray-500 mb-8 max-w-sm mx-auto">Tus subcuentas aparecerán aquí una vez que instales la aplicación en una ubicación de GHL.</p>
                            <button onClick={handleInstallApp} className="text-indigo-600 font-bold hover:underline flex items-center justify-center gap-1 mx-auto">
                                Instalar App ahora <ExternalLink size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {locations.map(loc => (
                                <div
                                    key={loc.location_id}
                                    onClick={() => setSelectedLocation(loc)}
                                    className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 relative overflow-hidden"
                                >
                                    {/* Cabecera Tarjeta */}
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-white dark:from-gray-800 dark:to-gray-800 border border-indigo-50 dark:border-gray-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                            <Building2 size={24} />
                                        </div>
                                        {loc.status === 'active' ? (
                                            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                                                <CheckCircle2 size={12} /> Activo
                                            </div>
                                        ) : (
                                            <div className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                                                {loc.status}
                                            </div>
                                        )}
                                    </div>

                                    {/* Info Principal */}
                                    <div className="mb-6">
                                        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1 truncate pr-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {loc.name || "Ubicación Sin Nombre"}
                                        </h3>
                                        <p className="text-xs font-mono text-gray-400 bg-gray-50 dark:bg-gray-800/50 inline-block px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-800">
                                            {loc.location_id}
                                        </p>
                                    </div>

                                    {/* Footer Tarjeta */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center gap-2">
                                            <div className="flex -space-x-2">
                                                {[...Array(Math.min(3, loc.total_slots || 0))].map((_, i) => (
                                                    <div key={i} className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] text-indigo-600">
                                                        <Smartphone size={12} />
                                                    </div>
                                                ))}
                                            </div>
                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                                {loc.total_slots || 0} Slots
                                            </span>
                                        </div>

                                        <span className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            <ChevronRight size={16} />
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* MODALES */}
                {selectedLocation && (
                    <LocationDetailsModal
                        location={selectedLocation}
                        token={token}
                        onLogout={onLogout}
                        onClose={() => setSelectedLocation(null)}
                        onUpgrade={() => setShowSubModal(true)}
                    />
                )}

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