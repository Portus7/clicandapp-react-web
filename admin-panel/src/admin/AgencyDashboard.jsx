import React, { useState, useEffect } from 'react';
import {
    Building2, Smartphone, Settings, Tag, Plus, Trash2,
    X, RefreshCw, Edit2, ExternalLink, Link2, Loader2
} from 'lucide-react';

// URL del Backend
const API_URL = (import.meta.env.VITE_API_URL || "https://wa.clicandapp.com").replace(/\/$/, "");

// URL de Instalación de tu App en GHL Marketplace
const INSTALL_APP_URL = import.meta.env.INSTALL_APP_URL || "https://gestion.clicandapp.com/integration/691623d58a49cdcb2c56ce9c";

export default function AgencyDashboard({ token, onLogout }) {
    // Estado para el ID de agencia (puede cambiar si se vincula una nueva cuenta)
    const [storedAgencyId, setStoredAgencyId] = useState(localStorage.getItem("agencyId"));
    const queryParams = new URLSearchParams(window.location.search);

    // Prioridad: Estado local > URL (para admins)
    const AGENCY_ID = storedAgencyId || queryParams.get("agencyId");

    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [loading, setLoading] = useState(true);

    // Estado para la pantalla de carga de vinculación
    const [isAutoSyncing, setIsAutoSyncing] = useState(false);

    // --- Helper para peticiones autenticadas ---
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
            throw new Error("Sesión expirada o acceso denegado");
        }

        return res;
    };

    // --- 1. LÓGICA DE AUTO-VINCULACIÓN (Post-Instalación) ---
    useEffect(() => {
        const newInstallId = queryParams.get("new_install");

        if (newInstallId && !isAutoSyncing) {
            autoSyncAgency(newInstallId);
        }
    }, []);

    const autoSyncAgency = async (locationId) => {
        setIsAutoSyncing(true);
        try {
            // Esperamos 2s para dar tiempo al webhook del backend a procesar la DB
            await new Promise(r => setTimeout(r, 2000));

            const res = await authFetch(`/agency/sync-ghl`, {
                method: "POST",
                body: JSON.stringify({ locationIdToVerify: locationId })
            });
            const data = await res.json();

            if (data.success && data.newAgencyId) {
                // Guardamos el nuevo ID real de la agencia
                localStorage.setItem("agencyId", data.newAgencyId);
                setStoredAgencyId(data.newAgencyId);

                // Limpiamos la URL para quitar el parámetro ?new_install=...
                window.history.replaceState({}, document.title, window.location.pathname);
                alert("¡Vinculación exitosa! Tu agencia ha sido verificada.");
            } else {
                console.error("Error vinculando:", data.error);
                alert("Hubo un problema verificando la instalación. Por favor intenta recargar.");
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión al vincular.");
        } finally {
            setIsAutoSyncing(false);
            // Forzamos la recarga de datos con el nuevo ID
            if (AGENCY_ID) fetchLocations();
        }
    };

    // --- 2. Cargar Locations ---
    const fetchLocations = () => {
        if (!AGENCY_ID) {
            setLoading(false);
            return;
        }
        setLoading(true);
        authFetch(`/agency/locations?agencyId=${AGENCY_ID}`)
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) setLocations(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchLocations();
    }, [AGENCY_ID]);

    // --- Acción de Instalar App ---
    const handleInstallApp = () => {
        // Redirigimos en la misma ventana para mantener el flujo OAuth limpio
        window.location.href = INSTALL_APP_URL;
    };

    // --- RENDERIZADO: Pantalla de Carga Vinculación ---
    if (isAutoSyncing) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 animate-in fade-in">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-gray-100">
                    <div className="mb-6 flex justify-center">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
                                <Link2 size={24} />
                            </div>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Finalizando Instalación</h2>
                    <p className="text-gray-500">Estamos vinculando tu cuenta de GoHighLevel con el panel...</p>
                </div>
            </div>
        );
    }

    // --- RENDERIZADO: Usuario Nuevo (Sin Agencia Vinculada) ---
    if (!AGENCY_ID) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-lg border border-gray-100">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Building2 className="text-indigo-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Conecta tu Agencia</h2>
                    <p className="text-gray-500 mb-8 leading-relaxed">
                        Para comenzar, necesitamos verificar tu cuenta. Haz clic abajo para instalar la app en cualquiera de tus subcuentas de GoHighLevel.
                    </p>
                    <button
                        onClick={handleInstallApp}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 hover:-translate-y-1"
                    >
                        Comenzar Instalación <ExternalLink size={20} />
                    </button>
                    <button onClick={onLogout} className="mt-6 text-sm text-gray-400 hover:text-gray-600 font-medium">
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        );
    }

    // --- RENDERIZADO: Dashboard Principal ---
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 bg-white p-4 rounded-xl border border-gray-100 shadow-sm gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-lg text-white shadow-md shadow-indigo-200">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-800">Panel de Agencia</h1>
                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded border border-gray-200 text-xs">
                                    ID: {AGENCY_ID.startsWith('AG-') ? 'Pendiente Sync' : AGENCY_ID}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchLocations}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition"
                            title="Recargar lista"
                        >
                            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                        </button>

                        <button
                            onClick={handleInstallApp}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm shadow-indigo-200"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">Nueva Subcuenta</span>
                        </button>

                        <div className="h-6 w-px bg-gray-200 mx-1"></div>

                        <button
                            onClick={onLogout}
                            className="text-sm text-red-600 hover:text-red-800 font-medium bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors border border-red-100"
                        >
                            Salir
                        </button>
                    </div>
                </div>

                {/* Grid de Locations */}
                {loading ? (
                    <div className="text-center py-20">
                        <RefreshCw className="animate-spin mx-auto text-indigo-500 mb-3" size={32} />
                        <p className="text-gray-400">Cargando tus subcuentas...</p>
                    </div>
                ) : locations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 border-dashed animate-in fade-in zoom-in-95 duration-500">
                        <div className="bg-indigo-50 p-4 rounded-full mb-4">
                            <Smartphone className="text-indigo-400" size={48} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">No tienes subcuentas vinculadas</h3>
                        <p className="text-gray-500 max-w-md mx-auto mt-2 text-center mb-8">
                            Para verlas aquí, instala la aplicación en tus subcuentas de GoHighLevel.
                        </p>

                        <button
                            onClick={handleInstallApp}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transform hover:-translate-y-1"
                        >
                            <Plus size={20} />
                            Instalar App en GHL
                            <ExternalLink size={16} className="opacity-70" />
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {locations.map(loc => (
                            <div
                                key={loc.location_id}
                                onClick={() => setSelectedLocation(loc)}
                                className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-indigo-300 hover:-translate-y-1 transition-all duration-200 cursor-pointer group relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800 group-hover:text-indigo-600 transition truncate max-w-[200px]">
                                            {loc.name || loc.location_name || loc.location_id}
                                        </h3>
                                        <div className="mt-1 flex gap-2">
                                            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold border ${loc.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>
                                                {loc.status || 'UNKNOWN'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-2.5 rounded-lg text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                        <Settings size={20} />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-50 flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-1.5 text-gray-500">
                                        <Smartphone size={16} />
                                        <span>{loc.total_slots || 0} Dispositivos</span>
                                    </div>
                                    <span className="font-bold text-indigo-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
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

// ---------------------------------------------------------------------
// SUB-COMPONENTE: MODAL DE DETALLES
// ---------------------------------------------------------------------
function LocationDetailsModal({ location, onClose, token, onLogout }) {
    const [activeTab, setActiveTab] = useState('slots');
    const [details, setDetails] = useState({ slots: [], keywords: [], settings: {} });
    const [loading, setLoading] = useState(true);
    const [deletingSlotId, setDeletingSlotId] = useState(null);

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
            onClose();
            return null;
        }
        return res;
    };

    useEffect(() => {
        setLoading(true);
        authFetch(`/agency/location-details/${location.location_id}`)
            .then(r => r && r.json())
            .then(data => {
                if (data) {
                    setDetails(data);
                    setLoading(false);
                }
            })
            .catch(console.error);
    }, [location]);

    const toggleSetting = async (key) => {
        const newSettings = { ...details.settings, [key]: !details.settings[key] };
        setDetails(prev => ({ ...prev, settings: newSettings }));
        await authFetch(`/agency/settings/${location.location_id}`, {
            method: 'PUT',
            body: JSON.stringify({ settings: newSettings })
        });
    };

    const handleAddKeyword = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const keyword = formData.get('keyword');
        const tag = formData.get('tag');
        if (!keyword || !tag) return;
        const res = await authFetch(`/agency/keywords`, {
            method: 'POST',
            body: JSON.stringify({ locationId: location.location_id, keyword, tag })
        });
        if (res && res.ok) {
            const newRule = await res.json();
            setDetails(prev => ({ ...prev, keywords: [newRule, ...prev.keywords] }));
            e.target.reset();
        }
    };

    const deleteKeyword = async (id) => {
        const res = await authFetch(`/agency/keywords/${id}`, { method: 'DELETE' });
        if (res && res.ok) {
            setDetails(prev => ({ ...prev, keywords: prev.keywords.filter(k => k.id !== id) }));
        }
    };

    const handleAddSlot = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`/agency/add-slot`, {
                method: "POST",
                body: JSON.stringify({ locationId: location.location_id })
            });
            if (res && res.ok) {
                const data = await res.json();
                setDetails(prev => ({
                    ...prev,
                    slots: [...prev.slots, {
                        slot_id: data.slot_id,
                        slot_name: data.slot_name,
                        phone_number: null,
                        priority: data.slot_id
                    }]
                }));
            }
        } catch (error) {
            console.error(error);
            alert("Error creando dispositivo");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSlot = async (slotId) => {
        if (!confirm("¿Seguro que deseas eliminar este dispositivo? Se cerrará la sesión de WhatsApp.")) return;

        setDeletingSlotId(slotId); // Activar carga para este slot específico

        try {
            const res = await authFetch(`/agency/slots/${location.location_id}/${slotId}`, {
                method: "DELETE"
            });

            if (res && res.ok) {
                setDetails(prev => ({
                    ...prev,
                    slots: prev.slots.filter(s => s.slot_id !== slotId)
                }));
            } else {
                alert("No se pudo desvincular correctamente.");
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión al eliminar.");
        } finally {
            setDeletingSlotId(null); // Desactivar carga
        }
    };

    const editSlotName = async (slotId, currentName) => {
        const newName = prompt("Nuevo nombre:", currentName || "");
        if (newName && newName !== currentName) {
            const res = await authFetch(`/config-slot`, {
                method: "POST",
                body: JSON.stringify({ locationId: location.location_id, slot: slotId, slotName: newName })
            });
            if (res && res.ok) {
                setDetails(prev => ({
                    ...prev,
                    slots: prev.slots.map(s => s.slot_id === slotId ? { ...s, slot_name: newName } : s)
                }));
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 transform transition-all scale-100">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <div className="bg-indigo-50 p-1.5 rounded text-indigo-600"><Smartphone size={20} /></div>
                            {location.name || location.location_name || location.location_id}
                        </h2>
                        <p className="text-xs text-gray-400 mt-1 ml-10">Configuración de Subcuenta</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><X size={24} /></button>
                </div>

                <div className="flex border-b border-gray-100 px-6 bg-gray-50/50">
                    <TabButton active={activeTab === 'slots'} onClick={() => setActiveTab('slots')} icon={<Smartphone size={16} />} label="Dispositivos" />
                    <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={16} />} label="Configuración" />
                    <TabButton active={activeTab === 'keywords'} onClick={() => setActiveTab('keywords')} icon={<Tag size={16} />} label="Palabras Clave" />
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                    {loading ? (
                        <div className="flex justify-center items-center h-40 text-indigo-600"><RefreshCw className="animate-spin" /></div>
                    ) : (
                        <>
                            {activeTab === 'slots' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-4 px-1">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gestión de Conexiones</h3>
                                        <button onClick={handleAddSlot} className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition shadow-sm hover:shadow">
                                            <Plus size={14} /> Nuevo Dispositivo
                                        </button>
                                    </div>

                                    {details.slots.length === 0 ? (
                                        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                            <p className="text-gray-400 text-sm font-medium">No hay dispositivos configurados.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {details.slots.map(slot => {
                                                const isConnected = !!slot.phone_number;
                                                return (
                                                    <div key={slot.slot_id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group hover:border-indigo-300 transition-all hover:shadow-md">
                                                        <button
                                                            onClick={() => handleDeleteSlot(slot.slot_id)}
                                                            disabled={deletingSlotId === slot.slot_id}
                                                            className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            {deletingSlotId === slot.slot_id ? (
                                                                <Loader2 size={14} className="animate-spin text-red-500" />
                                                            ) : (
                                                                <Trash2 size={14} />
                                                            )}
                                                        </button>                                                        <div className={`absolute top-0 left-0 w-1.5 h-full rounded-l-xl ${isConnected ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                                                        <div className="pl-3">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Slot {slot.slot_id}</span>
                                                                {isConnected && <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>}
                                                            </div>
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <span className="font-bold text-gray-800 text-sm truncate max-w-[120px]" title={slot.slot_name}>
                                                                    {slot.slot_name || `Dispositivo #${slot.slot_id}`}
                                                                </span>
                                                                <button onClick={() => editSlotName(slot.slot_id, slot.slot_name)} className="text-gray-300 hover:text-indigo-600 transition"><Edit2 size={12} /></button>
                                                            </div>
                                                            <div className={`text-xs font-mono px-2 py-1 rounded border inline-block ${isConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                                                {isConnected ? `+${slot.phone_number}` : 'Desconectado'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'settings' && (
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                                    <SettingRow label="Firma de Origen" desc='Añade "Source: [Nombre]" al final de los mensajes.' checked={details.settings?.show_source_label ?? true} onChange={() => toggleSetting('show_source_label')} />
                                    <div className="h-px bg-gray-100"></div>
                                    <SettingRow label="Transcripción IA" desc='Convierte notas de voz a texto automáticamente.' checked={details.settings?.transcribe_audio ?? true} onChange={() => toggleSetting('transcribe_audio')} />
                                    <div className="h-px bg-gray-100"></div>
                                    <SettingRow label="Auto-Contactos" desc='Crea contactos desconocidos en el CRM.' checked={details.settings?.create_unknown_contacts ?? true} onChange={() => toggleSetting('create_unknown_contacts')} />
                                </div>
                            )}

                            {activeTab === 'keywords' && (
                                <div className="space-y-6">
                                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                        <h3 className="text-xs font-bold text-indigo-800 mb-3 uppercase">Nueva Regla de Etiquetado</h3>
                                        <form onSubmit={handleAddKeyword} className="flex gap-2">
                                            <input name="keyword" required placeholder='Si el cliente dice... (ej: "precio")' className="flex-1 border border-indigo-100 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                            <input name="tag" required placeholder='Agregar tag... (ej: "interesado")' className="flex-1 border border-indigo-100 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                            <button type="submit" className="bg-indigo-600 text-white px-4 rounded-lg hover:bg-indigo-700 transition shadow-sm"><Plus size={20} /></button>
                                        </form>
                                    </div>

                                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                        {details.keywords.length === 0 ? (
                                            <div className="p-8 text-center text-gray-400 text-sm">No hay reglas definidas.</div>
                                        ) : (
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
                                                    <tr>
                                                        <th className="px-4 py-3 font-semibold">Mensaje contiene</th>
                                                        <th className="px-4 py-3 font-semibold">Acción (Tag)</th>
                                                        <th className="px-4 py-3 text-right"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {details.keywords.map(k => (
                                                        <tr key={k.id} className="hover:bg-gray-50 transition">
                                                            <td className="px-4 py-3 text-gray-900 font-medium">"{k.keyword}"</td>
                                                            <td className="px-4 py-3"><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-bold border border-blue-200">{k.tag}</span></td>
                                                            <td className="px-4 py-3 text-right"><button onClick={() => deleteKeyword(k.id)} className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-md transition"><Trash2 size={16} /></button></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// UI Helpers
const TabButton = ({ active, onClick, icon, label }) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-all ${active ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>
        {icon} {label}
    </button>
);

const SettingRow = ({ label, desc, checked, onChange }) => (
    <div className="flex items-center justify-between group">
        <div><p className="text-sm font-bold text-gray-800">{label}</p><p className="text-xs text-gray-500">{desc}</p></div>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
    </div>
);
