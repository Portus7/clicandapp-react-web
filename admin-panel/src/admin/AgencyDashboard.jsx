import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import LocationDetailsModal from './LocationDetailsModal';
import SubscriptionModal from './SubscriptionModal';
import ThemeToggle from '../components/ThemeToggle';
import {
    LayoutDashboard, Users, CreditCard, LifeBuoy, LogOut,
    Plus, Search, Building2, Smartphone, RefreshCw,
    ExternalLink, Menu, X, ChevronRight, CheckCircle2,
    AlertTriangle, TrendingUp, ShieldCheck, Settings
} from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || "https://wa.clicandapp.com").replace(/\/$/, "");
const INSTALL_APP_URL = import.meta.env.INSTALL_APP_URL || "https://gestion.clicandapp.com/integration/691623d58a49cdcb2c56ce9c";
const SUPPORT_PHONE = "595984756159";

export default function AgencyDashboard({ token, onLogout }) {
    const [storedAgencyId, setStoredAgencyId] = useState(localStorage.getItem("agencyId"));
    const queryParams = new URLSearchParams(window.location.search);
    const AGENCY_ID = storedAgencyId || queryParams.get("agencyId");

    // Estado de UI
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'subaccounts', 'billing'
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Datos
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAutoSyncing, setIsAutoSyncing] = useState(false);
    const [showSubModal, setShowSubModal] = useState(false);
    const [accountInfo, setAccountInfo] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

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

    // --- EFECTOS DE INICIO ---
    useEffect(() => {
        const newInstallId = queryParams.get("new_install");
        if (newInstallId && !isAutoSyncing) autoSyncAgency(newInstallId);
    }, []);

    useEffect(() => {
        if (AGENCY_ID) {
            fetchLocations();
            fetchAccountInfo();
        }
    }, [AGENCY_ID]);

    // --- FUNCIONES DE CARGA ---
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

    const autoSyncAgency = async (locationId) => {
        setIsAutoSyncing(true);
        toast.promise(
            (async () => {
                await new Promise(r => setTimeout(r, 2000));
                const res = await authFetch(`/agency/sync-ghl`, { method: "POST", body: JSON.stringify({ locationIdToVerify: locationId }) });
                const data = await res.json();
                if (!data.success || !data.newAgencyId) throw new Error("Fallo al verificar.");
                return data;
            })(),
            {
                loading: 'Vinculando cuenta...',
                success: (data) => {
                    localStorage.setItem("agencyId", data.newAgencyId);
                    setStoredAgencyId(data.newAgencyId);
                    window.history.replaceState({}, document.title, window.location.pathname);
                    return '¡Vinculación exitosa!';
                },
                error: 'Error de verificación.'
            }
        );
        setTimeout(() => {
            setIsAutoSyncing(false);
            if (AGENCY_ID) { fetchLocations(); fetchAccountInfo(); }
        }, 1000);
    };

    const handleInstallApp = () => {
        if (accountInfo) {
            const { used_subagencies, max_subagencies } = accountInfo.limits;
            if (used_subagencies >= max_subagencies) {
                toast.error("Cupo de Subagencias Agotado", {
                    description: "Amplía tu plan para conectar más cuentas.",
                    icon: <AlertTriangle className="text-amber-500" />,
                    action: { label: 'Ampliar Plan', onClick: () => setShowSubModal(true) }
                });
                return;
            }
        }
        window.location.href = INSTALL_APP_URL;
    };

    const handlePortal = async () => {
        const tId = toast.loading("Abriendo facturación...");
        try {
            const res = await authFetch('/payments/portal', { method: 'POST' });
            const data = await res.json();
            toast.dismiss(tId);
            if (data.url) window.location.href = data.url;
            else toast.error("No se pudo abrir el portal.");
        } catch (e) { toast.dismiss(tId); toast.error("Error de conexión."); }
    };

    // Filtros
    const filteredLocations = locations.filter(loc =>
        loc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.location_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- VISTA DE BIENVENIDA (SIN AGENCIA) ---
    if (!AGENCY_ID && !isAutoSyncing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
                <div className="text-center max-w-md w-full">
                    <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/30">
                        <Building2 className="text-white" size={40} />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">Bienvenido</h2>
                    <p className="text-gray-500 mb-8">Conecta tu cuenta de GoHighLevel para comenzar.</p>
                    <button onClick={handleInstallApp} className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-600 transition flex items-center justify-center gap-2">
                        Conectar Agencia <ExternalLink size={18} />
                    </button>
                    <button onClick={onLogout} className="mt-6 text-sm text-gray-400 hover:text-red-500">Cerrar Sesión</button>
                </div>
            </div>
        );
    }

    if (isAutoSyncing) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>;

    // --- COMPONENTES INTERNOS ---

    const SidebarItem = ({ id, icon: Icon, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm mb-1
                ${activeTab === id
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
        >
            <Icon size={20} />
            {sidebarOpen && <span>{label}</span>}
        </button>
    );

    const StatCard = ({ title, value, subtext, icon: Icon, color }) => (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">{value}</h3>
                {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
        </div>
    );

    // --- RENDER PRINCIPAL ---
    return (
        <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#0f1117] font-sans overflow-hidden">

            {/* 1. SIDEBAR */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col z-30`}>
                <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0">CA</div>
                    {sidebarOpen && <span className="ml-3 font-bold text-gray-900 dark:text-white tracking-tight">Panel Agencia</span>}
                </div>

                <div className="flex-1 p-4 overflow-y-auto">
                    <p className={`text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2 ${!sidebarOpen && 'hidden'}`}>Menú Principal</p>
                    <SidebarItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
                    <SidebarItem id="subaccounts" icon={Users} label="Subcuentas" />
                    <SidebarItem id="billing" icon={CreditCard} label="Suscripción" />

                    <div className="my-6 border-t border-gray-100 dark:border-gray-800"></div>

                    <p className={`text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2 ${!sidebarOpen && 'hidden'}`}>Ayuda</p>
                    <a href={`https://wa.me/${SUPPORT_PHONE}`} target="_blank" rel="noreferrer" className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-gray-500 hover:text-indigo-600 hover:bg-indigo-50`}>
                        <LifeBuoy size={20} />
                        {sidebarOpen && <span>Soporte Técnico</span>}
                    </a>
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all font-medium text-sm">
                        <LogOut size={20} />
                        {sidebarOpen && <span>Cerrar Sesión</span>}
                    </button>
                </div>
            </aside>

            {/* 2. AREA DE CONTENIDO */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">

                {/* TOP HEADER */}
                <header className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800 flex items-center justify-between px-6 z-20">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500">
                            <Menu size={20} />
                        </button>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize">{activeTab === 'subaccounts' ? 'Gestión de Subcuentas' : activeTab}</h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800">
                            AG
                        </div>
                    </div>
                </header>

                {/* SCROLLABLE MAIN */}
                <main className="flex-1 overflow-y-auto p-6 md:p-8">

                    {/* VISTA: DASHBOARD */}
                    {activeTab === 'dashboard' && accountInfo && (
                        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Resumen */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard
                                    title="Subcuentas"
                                    value={`${accountInfo.limits.used_subagencies} / ${accountInfo.limits.max_subagencies}`}
                                    icon={Building2}
                                    color="bg-indigo-500"
                                />
                                <StatCard
                                    title="Conexiones WhatsApp"
                                    value={`${accountInfo.limits.used_slots} / ${accountInfo.limits.max_slots}`}
                                    icon={Smartphone}
                                    color="bg-emerald-500"
                                />
                                <StatCard
                                    title="Estado Plan"
                                    value={accountInfo.plan === 'active' ? 'Activo' : 'Trial'}
                                    subtext={accountInfo.trial_ends ? `Fin: ${new Date(accountInfo.trial_ends).toLocaleDateString()}` : null}
                                    icon={ShieldCheck}
                                    color={accountInfo.plan === 'active' ? "bg-blue-500" : "bg-amber-500"}
                                />
                                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-2xl text-white shadow-lg flex flex-col justify-between cursor-pointer hover:shadow-indigo-500/25 transition-shadow" onClick={() => setShowSubModal(true)}>
                                    <div>
                                        <p className="text-indigo-200 text-sm font-medium mb-1">¿Necesitas más?</p>
                                        <h3 className="text-xl font-bold">Mejorar Plan</h3>
                                    </div>
                                    <div className="self-end bg-white/20 p-2 rounded-lg mt-2"><TrendingUp size={20} /></div>
                                </div>
                            </div>

                            {/* Accesos Rápidos */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Acciones Rápidas</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button onClick={handleInstallApp} className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center gap-4 hover:border-indigo-500 transition-colors group text-left">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            <Plus size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white">Nueva Subcuenta</h4>
                                            <p className="text-sm text-gray-500">Conectar una nueva ubicación de GHL.</p>
                                        </div>
                                    </button>
                                    <button onClick={() => setActiveTab('subaccounts')} className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center gap-4 hover:border-emerald-500 transition-colors group text-left">
                                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                            <Settings size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white">Gestionar Dispositivos</h4>
                                            <p className="text-sm text-gray-500">Configurar números y reglas.</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* VISTA: SUBCUENTAS (GRID + HUECOS VACÍOS) */}
                    {activeTab === 'subaccounts' && (
                        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

                            {/* Toolbar */}
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre o ID..."
                                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={fetchLocations} className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:text-indigo-600 transition"><RefreshCw size={20} className={loading ? "animate-spin" : ""} /></button>
                                    <button onClick={handleInstallApp} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none"><Plus size={18} /> <span className="hidden sm:inline">Nueva</span></button>
                                </div>
                            </div>

                            {/* Grid de Tarjetas */}
                            {loading ? (
                                <div className="py-20 text-center text-gray-400">Cargando datos...</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                                    {/* 1. Subcuentas Activas */}
                                    {filteredLocations.map(loc => (
                                        <div
                                            key={loc.location_id}
                                            onClick={() => setSelectedLocation(loc)}
                                            className="group bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-all duration-300 cursor-pointer relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 dark:bg-indigo-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

                                            <div className="relative z-10">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="w-12 h-12 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors shadow-sm">
                                                        <Building2 size={24} />
                                                    </div>
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${loc.status === 'active'
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900'
                                                            : 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                                                        }`}>
                                                        {loc.status}
                                                    </span>
                                                </div>

                                                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate pr-2" title={loc.name}>{loc.name || "Sin Nombre"}</h4>
                                                <p className="text-xs font-mono text-gray-400 mb-6 bg-gray-50 dark:bg-gray-800/50 inline-block px-1.5 py-0.5 rounded">{loc.location_id}</p>

                                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                                                    <p className="text-sm font-bold text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                                        <Smartphone size={16} className="text-indigo-500" />
                                                        {loc.total_slots || 0} <span className="text-gray-400 font-normal text-xs">Conexiones</span>
                                                    </p>
                                                    <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                        <ChevronRight size={16} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* 2. Espacios Vacíos (Slots de Subagencia Disponibles) */}
                                    {!searchTerm && accountInfo && Array.from({ length: Math.max(0, accountInfo.limits.max_subagencies - locations.length) }).map((_, idx) => (
                                        <div
                                            key={`empty-${idx}`}
                                            onClick={handleInstallApp}
                                            className="group relative bg-gray-50/50 dark:bg-gray-900/20 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all duration-300 min-h-[220px]"
                                        >
                                            <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100 dark:border-gray-700 group-hover:scale-110 group-hover:border-indigo-200 transition-all">
                                                <Plus size={32} className="text-gray-300 group-hover:text-indigo-600 dark:text-gray-600 dark:group-hover:text-indigo-400" />
                                            </div>
                                            <h4 className="font-bold text-gray-900 dark:text-white mb-1">Espacio Disponible</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 px-6 leading-relaxed">
                                                Tienes licencia para conectar una nueva subagencia. Haz clic para instalar.
                                            </p>
                                        </div>
                                    ))}

                                    {/* Botón de "Comprar Más" si no hay huecos vacíos */}
                                    {!searchTerm && accountInfo && (accountInfo.limits.max_subagencies - locations.length) === 0 && (
                                        <div
                                            onClick={() => setShowSubModal(true)}
                                            className="group relative bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-1 transition-all duration-300 min-h-[220px]"
                                        >
                                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm group-hover:bg-white/20 transition-all">
                                                <TrendingUp size={32} className="text-white" />
                                            </div>
                                            <h4 className="font-bold text-white mb-1 text-lg">¿Necesitas más?</h4>
                                            <p className="text-xs text-indigo-100 px-4 leading-relaxed mb-4">
                                                Has usado todas tus licencias. Amplía tu plan para seguir creciendo.
                                            </p>
                                            <span className="px-4 py-2 bg-white text-indigo-600 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm">
                                                Mejorar Plan
                                            </span>
                                        </div>
                                    )}

                                </div>
                            )}
                        </div>
                    )}

                    {/* VISTA: BILLING (Redirige al modal por ahora) */}
                    {activeTab === 'billing' && (
                        <div className="max-w-4xl mx-auto text-center py-20">
                            <CreditCard size={64} className="mx-auto text-gray-300 mb-6" />
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Gestión de Suscripción</h3>
                            <p className="text-gray-500 mb-8 max-w-md mx-auto">Administra tu plan, métodos de pago y descarga tus facturas directamente desde nuestro portal seguro.</p>
                            <div className="flex justify-center gap-4">
                                <button onClick={handlePortal} className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition">Portal de Facturación</button>
                                <button onClick={() => setShowSubModal(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition">Cambiar Plan</button>
                            </div>
                        </div>
                    )}

                </main>
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
                    accountInfo={accountInfo}
                />
            )}
        </div>
    );
}