import React, { useState, useEffect } from 'react';
import {
    Users, Settings, Plus, Search, CheckCircle,
    AlertCircle, X, RefreshCw, Building2, Smartphone,
    ArrowLeft, Tag, Trash2
} from 'lucide-react';

// Configuración de entorno
const API_URL = (import.meta.env.VITE_API_URL || "https://wa.clicandapp.com").replace(/\/$/, "");

// 👇 Recibimos token y onLogout
export default function AdminDashboard({ token, onLogout }) {
    const [view, setView] = useState('agencies'); // 'agencies' | 'subaccounts'
    const [selectedAgency, setSelectedAgency] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null); // Para el Modal Detalle prueba 2222

    // Datos
    const [agencies, setAgencies] = useState([]);
    const [subaccounts, setSubaccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // --- Helper Autenticado ---
    const authFetch = async (endpoint, options = {}) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                ...options.headers,
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // ✅ Token JWT
            }
        });

        if (res.status === 401 || res.status === 403) {
            onLogout();
            throw new Error("Sesión expirada");
        }
        return res;
    };

    // --- CARGA DE DATOS ---
    const fetchAgencies = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`/admin/agencies`);
            const data = await res.json();
            setAgencies(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error cargando agencias:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubaccounts = async (agencyId) => {
        setLoading(true);
        try {
            const safeId = encodeURIComponent(agencyId);
            const res = await authFetch(`/admin/tenants?agencyId=${safeId}`);
            const data = await res.json();
            setSubaccounts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error cargando subcuentas:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgencies();
    }, []);

    // --- NAVEGACIÓN ---
    const handleAgencyClick = (agency) => {
        setSelectedAgency(agency);
        setView('subaccounts');
        setSearchTerm("");
        fetchSubaccounts(agency.agency_id);
    };

    const handleBackToAgencies = () => {
        setSelectedAgency(null);
        setView('agencies');
        setSearchTerm("");
        setSubaccounts([]);
        fetchAgencies();
    };

    // --- FILTRADO ---
    const filteredAgencies = agencies.filter(a =>
        a.agency_name && a.agency_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredSubaccounts = subaccounts.filter(s =>
        s.location_name && s.location_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            {/* HEADER */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {view === 'subaccounts' && (
                            <button onClick={handleBackToAgencies} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition text-gray-600">
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                            CA
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight leading-tight text-gray-800">
                                {view === 'agencies' ? 'Panel Maestro' : `Agencia: ${selectedAgency?.agency_id}`}
                            </h1>
                            {view === 'subaccounts' && <p className="text-xs text-gray-500">Gestionando {subaccounts.length} subcuentas</p>}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => view === 'agencies' ? fetchAgencies() : fetchSubaccounts(selectedAgency.agency_id)}
                            className="p-2 text-gray-400 hover:text-indigo-600 transition bg-gray-50 rounded-full hover:bg-indigo-50"
                            title="Recargar datos"
                        >
                            <RefreshCw size={20} />
                        </button>
                        <div className="h-6 w-px bg-gray-200 mx-2"></div>
                        <button
                            onClick={onLogout}
                            className="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1.5 rounded hover:bg-red-50 transition"
                        >
                            Salir
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* BARRA DE BÚSQUEDA GLOBAL */}
                <div className="mb-8">
                    <div className="relative w-full max-w-md mx-auto sm:mx-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder={view === 'agencies' ? "Buscar agencia..." : "Buscar subcuenta..."}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* --- VISTA 1: LISTA DE AGENCIAS --- */}
                {view === 'agencies' && (
                    <>
                        {loading ? (
                            <div className="text-center py-20">
                                <RefreshCw className="animate-spin mx-auto text-indigo-500 mb-2" size={32} />
                                <p className="text-gray-400">Cargando agencias...</p>
                            </div>
                        ) : filteredAgencies.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                                <Building2 className="mx-auto text-gray-300 mb-3" size={48} />
                                <p className="text-gray-500">No se encontraron agencias.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredAgencies.map((agency) => (
                                    <div
                                        key={agency.agency_id}
                                        onClick={() => handleAgencyClick(agency)}
                                        className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-indigo-300 hover:-translate-y-1 transition-all duration-200 cursor-pointer group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                                            <Building2 size={64} className="text-indigo-600" />
                                        </div>

                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="bg-indigo-50 p-2.5 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                    <Building2 size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-800 group-hover:text-indigo-700 truncate max-w-[180px]">
                                                        {agency.agency_name || agency.agency_id}
                                                    </h3>
                                                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Agencia</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
                                                <div className="text-center">
                                                    <p className="text-2xl font-bold text-gray-900">{agency.total_subaccounts}</p>
                                                    <p className="text-xs text-gray-500 font-medium">Total</p>
                                                </div>
                                                <div className="h-8 w-px bg-gray-100"></div>
                                                <div className="text-center">
                                                    <p className="text-2xl font-bold text-emerald-600">{agency.active_subaccounts || 0}</p>
                                                    <p className="text-xs text-gray-500 font-medium">Activas</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* --- VISTA 2: LISTA DE SUBCUENTAS --- */}
                {view === 'subaccounts' && (
                    <>
                        {loading ? (
                            <div className="text-center py-20">
                                <RefreshCw className="animate-spin mx-auto text-indigo-500 mb-2" size={32} />
                                <p className="text-gray-400">Cargando subcuentas...</p>
                            </div>
                        ) : filteredSubaccounts.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
                                <Smartphone className="mx-auto text-gray-300 mb-3" size={48} />
                                <p className="text-gray-500 text-lg">Esta agencia no tiene subcuentas vinculadas.</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4">Location ID</th>
                                            <th className="px-6 py-4">Estado</th>
                                            <th className="px-6 py-4">Plan</th>
                                            <th className="px-6 py-4">Creado</th>
                                            <th className="px-6 py-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredSubaccounts.map(sub => (
                                            <tr key={sub.location_id} className="hover:bg-indigo-50/30 transition duration-150">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
                                                            <Smartphone size={18} />
                                                        </div>
                                                        <div className="font-medium text-gray-900">{sub.location_id}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${sub.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        sub.status === 'trial' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            'bg-red-50 text-red-700 border-red-200'
                                                        }`}>
                                                        {sub.status === 'active' && <CheckCircle size={12} className="mr-1" />}
                                                        {sub.status?.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 capitalize">{sub.plan_name || 'Trial'}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 tabular-nums">{new Date(sub.created_at).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => setSelectedLocation(sub)}
                                                        className="inline-flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 hover:text-indigo-600 hover:border-indigo-600 px-3 py-1.5 rounded-lg text-sm font-medium transition shadow-sm"
                                                    >
                                                        <Settings size={14} /> Gestionar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {/* --- MODAL DETALLES --- */}
                {selectedLocation && (
                    <LocationDetailsModal
                        location={selectedLocation}
                        token={token}       // ✅ Pasa el token
                        onLogout={onLogout} // ✅ Pasa logout
                        onClose={() => setSelectedLocation(null)}
                    />
                )}
            </main>
        </div>
    );
}

// ---------------------------------------------------------------------
// COMPONENTE MODAL DE DETALLES (Actualizado con Auth)
// ---------------------------------------------------------------------
function LocationDetailsModal({ location, onClose, token, onLogout }) {
    const [activeTab, setActiveTab] = useState('slots');
    const [details, setDetails] = useState({ slots: [], keywords: [], settings: {} });
    const [loading, setLoading] = useState(true);

    // Helper fetch con auth para el modal
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

    // Cargar datos completos
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

    // --- ACCIONES ---

    // 1. Guardar Settings
    const toggleSetting = async (key) => {
        const newSettings = { ...details.settings, [key]: !details.settings[key] };
        setDetails(prev => ({ ...prev, settings: newSettings }));

        await authFetch(`/agency/settings/${location.location_id}`, {
            method: 'PUT',
            body: JSON.stringify({ settings: newSettings })
        });
    };

    // 2. Agregar Keyword
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

    // 3. Borrar Keyword
    const deleteKeyword = async (id) => {
        const res = await authFetch(`/agency/keywords/${id}`, { method: 'DELETE' });
        if (res && res.ok) {
            setDetails(prev => ({ ...prev, keywords: prev.keywords.filter(k => k.id !== id) }));
        }
    };

    // 4. Editar Nombre de Slot
    const editSlotName = async (slotId, currentName) => {
        const newName = prompt("Nombre para este dispositivo (Ej: Ventas, Soporte):", currentName || "");
        if (newName !== null && newName !== currentName) {
            await authFetch(`/config-slot`, {
                method: "POST",
                body: JSON.stringify({
                    locationId: location.location_id,
                    slot: slotId,
                    slotName: newName
                })
            });
            // Actualizar estado local
            setDetails(prev => ({
                ...prev,
                slots: prev.slots.map(s => s.slot_id === slotId ? { ...s, slot_name: newName } : s)
            }));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-opacity" style={{ zIndex: 9999 }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-gray-200">

                {/* Modal Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <div className="bg-indigo-100 p-1.5 rounded-md text-indigo-600"><Smartphone size={20} /></div>
                            {location.location_id}
                        </h2>
                        <p className="text-xs text-gray-400 mt-1 ml-1">Panel de configuración avanzado</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition"><X size={22} /></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 px-6 bg-gray-50/50">
                    <TabButton active={activeTab === 'slots'} onClick={() => setActiveTab('slots')} icon={<Smartphone size={16} />} label="Dispositivos" />
                    <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={16} />} label="Configuración" />
                    <TabButton active={activeTab === 'keywords'} onClick={() => setActiveTab('keywords')} icon={<Tag size={16} />} label="Palabras Clave" />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                    {loading ? (
                        <div className="flex justify-center items-center h-40 text-indigo-600"><RefreshCw className="animate-spin" /></div>
                    ) : (
                        <>
                            {/* --- TAB 1: DISPOSITIVOS --- */}
                            {activeTab === 'slots' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[1, 2, 3].map(num => {
                                        const slot = details.slots.find(s => s.slot_id === num);
                                        const isConnected = !!slot?.phone_number;

                                        return (
                                            <div key={num} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
                                                <div>
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-400'}`}></div>
                                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Slot {num}</span>
                                                        </div>
                                                        {isConnected && (
                                                            <button onClick={() => editSlotName(num, slot?.slot_name)} className="text-gray-300 hover:text-indigo-600 transition p-1">
                                                                <Settings size={14} />
                                                            </button>
                                                        )}
                                                    </div>

                                                    <h4 className="font-bold text-gray-800 text-lg mb-1">
                                                        {slot?.slot_name || `Dispositivo #${num}`}
                                                    </h4>

                                                    <div className="text-sm text-gray-500 font-mono bg-gray-50 inline-block px-2 py-1 rounded mb-4 border border-gray-100">
                                                        {isConnected ? `+${slot.phone_number}` : 'Sin vincular'}
                                                    </div>
                                                </div>

                                                <div className={`text-xs font-medium px-3 py-1.5 rounded-lg text-center border ${isConnected ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                                                    {isConnected ? '● ONLINE' : '○ DESCONECTADO'}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* --- TAB 2: SETTINGS --- */}
                            {activeTab === 'settings' && (
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-8">
                                    <SettingRow
                                        label="Source Label"
                                        desc="Añadir firma 'Source: ...' al final de los mensajes salientes."
                                        checked={details.settings?.show_source_label ?? true}
                                        onChange={() => toggleSetting('show_source_label')}
                                        icon={<Tag size={20} className="text-gray-400" />}
                                    />
                                    <div className="h-px bg-gray-100"></div>
                                    <SettingRow
                                        label="IA Transcripción (Whisper)"
                                        desc="Transcribir automáticamente audios recibidos en GHL a texto."
                                        checked={details.settings?.transcribe_audio ?? true}
                                        onChange={() => toggleSetting('transcribe_audio')}
                                        icon={<div className="text-gray-400 font-serif italic font-bold text-lg">Tx</div>}
                                    />
                                    <div className="h-px bg-gray-100"></div>
                                    <SettingRow
                                        label="Capturar Desconocidos"
                                        desc="Crear contacto en GHL automáticamente si un número nuevo escribe."
                                        checked={details.settings?.create_unknown_contacts ?? true}
                                        onChange={() => toggleSetting('create_unknown_contacts')}
                                        icon={<Users size={20} className="text-gray-400" />}
                                    />
                                </div>
                            )}

                            {/* --- TAB 3: KEYWORDS --- */}
                            {activeTab === 'keywords' && (
                                <div className="space-y-6">
                                    {/* Input Area */}
                                    <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100">
                                        <h3 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                                            <div className="bg-indigo-100 p-1 rounded"><Plus size={14} /></div> Nueva Regla de Etiquetado
                                        </h3>
                                        <form onSubmit={handleAddKeyword} className="flex flex-col sm:flex-row gap-3 items-start">
                                            <div className="flex-1 w-full">
                                                <input name="keyword" required placeholder="Si el mensaje contiene..." className="w-full border border-indigo-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white shadow-sm" />
                                                <p className="text-[10px] text-indigo-400 mt-1 pl-1">Ej: "quiero precio", "info"</p>
                                            </div>
                                            <div className="flex-1 w-full">
                                                <input name="tag" required placeholder="Agregar etiqueta en GHL..." className="w-full border border-indigo-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white shadow-sm" />
                                                <p className="text-[10px] text-indigo-400 mt-1 pl-1">Ej: "interesado", "hot-lead"</p>
                                            </div>
                                            <button type="submit" className="w-full sm:w-auto bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-md transition active:scale-95">
                                                Guardar Regla
                                            </button>
                                        </form>
                                    </div>

                                    {/* Table */}
                                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs tracking-wider">
                                                <tr>
                                                    <th className="px-5 py-3 font-semibold">Frase / Palabra Clave</th>
                                                    <th className="px-5 py-3 font-semibold">Etiqueta a aplicar</th>
                                                    <th className="px-5 py-3 text-right">Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {details.keywords.length === 0 ? (
                                                    <tr><td colSpan="3" className="p-8 text-center text-gray-400 italic">No hay reglas configuradas aún.</td></tr>
                                                ) : (
                                                    details.keywords.map(k => (
                                                        <tr key={k.id} className="hover:bg-gray-50 group transition-colors">
                                                            <td className="px-5 py-3 font-medium text-gray-800">"{k.keyword}"</td>
                                                            <td className="px-5 py-3">
                                                                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-bold border border-blue-100 shadow-sm">
                                                                    {k.tag}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-3 text-right">
                                                                <button onClick={() => deleteKeyword(k.id)} className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
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

// --- UI HELPERS ---
const TabButton = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${active ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
    >
        {icon} {label}
    </button>
);

const SettingRow = ({ label, desc, checked, onChange, icon }) => (
    <div className="flex items-center justify-between group">
        <div className="flex gap-4 items-start">
            <div className="mt-1 hidden sm:block">{icon}</div>
            <div>
                <p className="text-sm font-bold text-gray-800 group-hover:text-indigo-700 transition-colors">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed max-w-xs">{desc}</p>
            </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
    </div>
);