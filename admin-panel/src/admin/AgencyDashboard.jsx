import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import LocationDetailsModal from './LocationDetailsModal';
import SubscriptionModal from './SubscriptionModal';
import ThemeToggle from '../components/ThemeToggle';
import {
    LayoutDashboard, Users, CreditCard, LifeBuoy, LogOut,
    Plus, Search, Building2, Smartphone, RefreshCw,
    ExternalLink, Menu, X, ChevronRight, CheckCircle2,
    AlertTriangle, TrendingUp, ShieldCheck, Settings, Trash2 // 👈 Asegúrate que Trash2 esté aquí
} from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || "https://wa.clicandapp.com").replace(/\/$/, "");
const INSTALL_APP_URL = import.meta.env.INSTALL_APP_URL || "https://gestion.clicandapp.com/integration/691623d58a49cdcb2c56ce9c";
const SUPPORT_PHONE = "595984756159";

export default function AgencyDashboard({ token, onLogout }) {
    const [storedAgencyId, setStoredAgencyId] = useState(localStorage.getItem("agencyId"));
    const queryParams = new URLSearchParams(window.location.search);
    const AGENCY_ID = storedAgencyId || queryParams.get("agencyId");

    // Estado de UI
    const [activeTab, setActiveTab] = useState('dashboard');
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

    // 🔥 NUEVA FUNCIÓN: ELIMINAR SUBCUENTA
    const handleDeleteTenant = async (e, locationId, name) => {
        e.stopPropagation(); // Evitar abrir el modal de detalles

        if (!confirm(`⚠️ ¿Estás seguro de eliminar la subcuenta "${name || locationId}"?\n\n- Se desconectarán todos los WhatsApps.\n- Se borrarán las configuraciones.\n- La licencia quedará libre para usarla en otro cliente.`)) {
            return;
        }

        const tId = toast.loading("Eliminando subcuenta y liberando recursos...");
        try {
            const res = await authFetch(`/agency/tenants/${locationId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Subcuenta eliminada correctamente");
                fetchLocations();     // Recargar lista
                fetchAccountInfo();   // Recargar barras de uso
            } else {
                throw new Error("No se pudo eliminar");
            }
        } catch (err) {
            toast.error("Error al eliminar subcuenta");
        } finally {
            toast.dismiss(tId);
        }
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

    // ... (Vista de Bienvenida y AutoSync se mantienen igual)
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


    // --- RENDER PRINCIPAL ---
    return (
        <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#0f1117] font-sans overflow-hidden">

            {/* SIDEBAR (Se mantiene igual) */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col z-30`}>
                <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0">CA</div>
                    {sidebarOpen && <span className="ml-3 font-bold text-gray-900 dark:text-white tracking-tight">Panel Agencia</span>}
                </div>
                <div className="flex-1 p-4 overflow-y-auto">
                    <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm mb-1 ${activeTab === 'dashboard' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}><LayoutDashboard size={20} />{sidebarOpen && <span>Dashboard</span>}</button>
                    <button onClick={() => setActiveTab('subaccounts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm mb-1 ${activeTab === 'subaccounts' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}><Users size={20} />{sidebarOpen && <span>Subcuentas</span>}</button>
                    <button onClick={() => setActiveTab('billing')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm mb-1 ${activeTab === 'billing' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}><CreditCard size={20} />{sidebarOpen && <span>Suscripción</span>}</button>
                    <div className="my-6 border-t border-gray-100 dark:border-gray-800"></div>
                    <a href={`https://wa.me/${SUPPORT_PHONE}`} target="_blank" rel="noreferrer" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"><LifeBuoy size={20} />{sidebarOpen && <span>Soporte</span>}</a>
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-800"><button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-medium text-sm"><LogOut size={20} />{sidebarOpen && <span>Salir</span>}</button></div>
            </aside>

            {/* CONTENIDO */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* HEADER */}
                <header className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800 flex items-center justify-between px-6 z-20">
                    <div className="flex items-center gap-4"><button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500"><Menu size={20} /></button><h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize">{activeTab === 'subaccounts' ? 'Gestión de Subcuentas' : activeTab}</h2></div>
                    <div className="flex items-center gap-4"><ThemeToggle /><div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200">AG</div></div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 md:p-8">

                    {/* DASHBOARD */}
                    {activeTab === 'dashboard' && accountInfo && (
                        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex justify-between"><div><p className="text-sm font-medium text-gray-500">Subcuentas</p><h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">{accountInfo.limits.used_subagencies} / {accountInfo.limits.max_subagencies}</h3></div><div className="p-3 rounded-xl bg-indigo-500"><Building2 size={24} className="text-white" /></div></div>
                                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex justify-between"><div><p className="text-sm font-medium text-gray-500">Conexiones WA</p><h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">{accountInfo.limits.used_slots} / {accountInfo.limits.max_slots}</h3></div><div className="p-3 rounded-xl bg-emerald-500"><Smartphone size={24} className="text-white" /></div></div>
                                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex justify-between"><div><p className="text-sm font-medium text-gray-500">Plan</p><h3 className="text-2xl font-extrabold text-gray-900 dark:text-white uppercase">{accountInfo.plan}</h3></div><div className="p-3 rounded-xl bg-blue-500"><ShieldCheck size={24} className="text-white" /></div></div>
                                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-2xl text-white shadow-lg flex flex-col justify-between cursor-pointer hover:shadow-xl transition" onClick={() => setShowSubModal(true)}><div><p className="text-indigo-200 text-sm font-medium">¿Necesitas más?</p><h3 className="text-xl font-bold">Mejorar Plan</h3></div><div className="self-end bg-white/20 p-2 rounded-lg"><TrendingUp size={20} /></div></div>
                            </div>
                        </div>
                    )}

                    {/* SUBCUENTAS */}
                    {activeTab === 'subaccounts' && (
                        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="flex justify-between gap-4">
                                <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
                                <div className="flex gap-3"><button onClick={fetchLocations} className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:text-indigo-600"><RefreshCw size={20} className={loading ? "animate-spin" : ""} /></button><button onClick={handleInstallApp} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex gap-2"><Plus size={18} /> Nueva</button></div>
                            </div>

                            {loading ? <div className="py-20 text-center text-gray-400">Cargando...</div> : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* ACTIVAS */}
                                    {filteredLocations.map(loc => (
                                        <div key={loc.location_id} onClick={() => setSelectedLocation(loc)} className="group bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl hover:border-indigo-500 transition-all cursor-pointer relative overflow-hidden">

                                            {/* Header Card */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-12 h-12 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-indigo-600 transition-colors shadow-sm">
                                                    <Building2 size={24} />
                                                </div>

                                                {/* 🔥 BOTÓN ELIMINAR (Solo aparece en hover) */}
                                                <button
                                                    onClick={(e) => handleDeleteTenant(e, loc.location_id, loc.name)}
                                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition opacity-0 group-hover:opacity-100"
                                                    title="Eliminar Subcuenta"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>

                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">{loc.name || "Sin Nombre"}</h4>
                                            <p className="text-xs font-mono text-gray-400 mb-6 bg-gray-50 dark:bg-gray-800/50 inline-block px-1.5 py-0.5 rounded">{loc.location_id}</p>

                                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                                                <p className="text-sm font-bold text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                                    <Smartphone size={16} className="text-indigo-500" /> {loc.total_slots || 0}
                                                </p>
                                                <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${loc.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {loc.status}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* VACÍAS */}
                                    {!searchTerm && accountInfo && Array.from({ length: Math.max(0, accountInfo.limits.max_subagencies - locations.length) }).map((_, idx) => (
                                        <div key={`empty-${idx}`} onClick={handleInstallApp} className="group bg-gray-50/50 dark:bg-gray-900/20 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 transition-all min-h-[200px]">
                                            <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform"><Plus size={28} className="text-gray-300 group-hover:text-indigo-600" /></div>
                                            <h4 className="font-bold text-gray-900 dark:text-white">Espacio Disponible</h4>
                                            <p className="text-xs text-gray-500 mt-1">Clic para conectar nueva subcuenta.</p>
                                        </div>
                                    ))}

                                    {/* UPSELL */}
                                    {!searchTerm && accountInfo && (accountInfo.limits.max_subagencies - locations.length) === 0 && (
                                        <div onClick={() => setShowSubModal(true)} className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer shadow-lg hover:-translate-y-1 transition-transform min-h-[200px]">
                                            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-4 text-white"><TrendingUp size={28} /></div>
                                            <h4 className="font-bold text-white text-lg">¿Necesitas más?</h4>
                                            <button className="mt-4 px-4 py-2 bg-white text-indigo-600 rounded-lg text-xs font-bold uppercase shadow-sm hover:bg-gray-50">Mejorar Plan</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SUSCRIPCIÓN */}
                    {activeTab === 'billing' && (
                        <div className="max-w-4xl mx-auto text-center py-20">
                            <CreditCard size={64} className="mx-auto text-gray-300 mb-6" />
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Gestión de Suscripción</h3>
                            <p className="text-gray-500 mb-8 max-w-md mx-auto">Administra tu plan y facturas.</p>
                            <div className="flex justify-center gap-4">
                                <button onClick={handlePortal} className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700">Portal Facturación</button>
                                <button onClick={() => setShowSubModal(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">Cambiar Plan</button>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {selectedLocation && <LocationDetailsModal location={selectedLocation} token={token} onLogout={onLogout} onClose={() => setSelectedLocation(null)} onUpgrade={() => setShowSubModal(true)} />}
            {showSubModal && <SubscriptionModal onClose={() => setShowSubModal(false)} token={token} accountInfo={accountInfo} />}
        </div>
    );
}