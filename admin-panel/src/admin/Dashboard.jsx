import React, { useState, useEffect } from 'react';
import SupportManager from './SupportManager';
import {
    Users, Settings, Plus, Search, CheckCircle,
    AlertCircle, X, RefreshCw, Building2, Smartphone,
    ArrowLeft, Tag, Trash2, Edit2
} from 'lucide-react';

// Configuración de entorno
const API_URL = (import.meta.env.VITE_API_URL || "https://wa.clicandapp.com").replace(/\/$/, "");

// 👇 Recibimos token y onLogout
export default function AdminDashboard({ token, onLogout }) {
    const [view, setView] = useState('agencies'); // 'agencies' | 'subaccounts'
    const [selectedAgency, setSelectedAgency] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);

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
    const filteredAgencies = agencies.filter(a => {
        const term = searchTerm.toLowerCase();
        // 🔥 FIX: Ahora buscamos por ID O por Nombre
        const idMatch = a.agency_id && a.agency_id.toLowerCase().includes(term);
        const nameMatch = a.agency_name && a.agency_name.toLowerCase().includes(term);
        return idMatch || nameMatch;
    });

    const filteredSubaccounts = subaccounts.filter(s => {
        const term = searchTerm.toLowerCase();
        const nameMatch = s.name && s.name.toLowerCase().includes(term);
        const idMatch = s.location_id && s.location_id.toLowerCase().includes(term);
        return nameMatch || idMatch;
    });

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
                                {view === 'agencies' ? 'Panel Maestro' : `Agencia: ${selectedAgency?.agency_name}`}
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
                        {view === 'agencies' && (
                            <SupportManager token={token} />
                        )}
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
                                            <th className="px-6 py-4">Nombre</th>
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
                                                    <div className="font-bold text-gray-900 text-base">
                                                        {sub.name || "Sin Nombre"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-gray-100 p-1.5 rounded text-gray-500">
                                                            <Smartphone size={16} />
                                                        </div>
                                                        <div className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                                            {sub.location_id}
                                                        </div>
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
                        token={token}
                        onLogout={onLogout}
                        onClose={() => setSelectedLocation(null)}
                    />
                )}
            </main>
        </div>
    );
}

// ---------------------------------------------------------------------
// COMPONENTE MODAL DE DETALLES (COPIADO DE AGENCYDASHBOARD PARA UNIFICAR)
// ---------------------------------------------------------------------
function LocationDetailsModal({ location, onClose, token, onLogout }) {
    const [activeTab, setActiveTab] = useState('slots');
    const [details, setDetails] = useState({ slots: [], keywords: [], settings: {} });
    const [loading, setLoading] = useState(true);

    // Helper fetch con auth
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

    // Cargar datos
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

    // Actions
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

    // --- NUEVAS FUNCIONES DE SLOTS (Las mismas que en AgencyDashboard) ---
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
        if (!confirm("¿Estás seguro?")) return;
        try {
            const res = await authFetch(`/agency/slots/${location.location_id}/${slotId}`, {
                method: "DELETE"
            });
            if (res && res.ok) {
                setDetails(prev => ({
                    ...prev,
                    slots: prev.slots.filter(s => s.slot_id !== slotId)
                }));
            }
        } catch (error) {
            console.error(error);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" style={{ zIndex: 9999 }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-gray-200">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <div className="bg-indigo-100 p-1.5 rounded-md text-indigo-600"><Smartphone size={20} /></div>
                            {location.name || location.location_id}
                        </h2>
                        <p className="text-xs text-gray-400 mt-1">Panel Maestro (Admin)</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition"><X size={22} /></button>
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
                                        <h3 className="text-sm font-bold text-gray-500 uppercase">Lista de Dispositivos</h3>
                                        <button onClick={handleAddSlot} className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition">
                                            <Plus size={14} /> Agregar
                                        </button>
                                    </div>

                                    {details.slots.length === 0 ? (
                                        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">Sin dispositivos.</div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {details.slots.map(slot => {
                                                const isConnected = !!slot.phone_number;
                                                return (
                                                    <div key={slot.slot_id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group hover:border-indigo-300 transition">
                                                        <button onClick={() => handleDeleteSlot(slot.slot_id)} className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-600 rounded-md opacity-0 group-hover:opacity-100 transition"><Trash2 size={14} /></button>
                                                        <div className={`absolute top-0 left-0 w-1 h-full ${isConnected ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                                        <div className="pl-3">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Slot {slot.slot_id}</span>
                                                                {isConnected && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                                                            </div>
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <span className="font-bold text-gray-800 text-sm truncate">{slot.slot_name || `Dispositivo #${slot.slot_id}`}</span>
                                                                <button onClick={() => editSlotName(slot.slot_id, slot.slot_name)}><Edit2 size={12} className="text-gray-300 hover:text-indigo-600" /></button>
                                                            </div>
                                                            <div className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-100">
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
                                    <SettingRow label="Source Label" desc="Firma en mensajes" checked={details.settings?.show_source_label ?? true} onChange={() => toggleSetting('show_source_label')} />
                                    <div className="h-px bg-gray-100"></div>
                                    <SettingRow label="IA Transcripción" desc="Audio a texto" checked={details.settings?.transcribe_audio ?? true} onChange={() => toggleSetting('transcribe_audio')} />
                                    <div className="h-px bg-gray-100"></div>
                                    <SettingRow label="Crear Contactos" desc="Nuevos leads" checked={details.settings?.create_unknown_contacts ?? true} onChange={() => toggleSetting('create_unknown_contacts')} />
                                </div>
                            )}

                            {activeTab === 'keywords' && (
                                <div className="space-y-6">
                                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                        <form onSubmit={handleAddKeyword} className="flex gap-2">
                                            <input name="keyword" required placeholder="Si dice..." className="flex-1 border-0 rounded p-2 text-sm" />
                                            <input name="tag" required placeholder="Tag..." className="flex-1 border-0 rounded p-2 text-sm" />
                                            <button type="submit" className="bg-indigo-600 text-white px-3 rounded"><Plus size={18} /></button>
                                        </form>
                                    </div>
                                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                        <table className="w-full text-left text-sm">
                                            <tbody className="divide-y divide-gray-100">
                                                {details.keywords.map(k => (
                                                    <tr key={k.id}>
                                                        <td className="px-4 py-3">"{k.keyword}"</td>
                                                        <td className="px-4 py-3"><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs">{k.tag}</span></td>
                                                        <td className="px-4 py-3 text-right"><button onClick={() => deleteKeyword(k.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button></td>
                                                    </tr>
                                                ))}
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

// UI Helpers
const TabButton = ({ active, onClick, icon, label }) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${active ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
        {icon} {label}
    </button>
);
const SettingRow = ({ label, desc, checked, onChange }) => (
    <div className="flex items-center justify-between">
        <div><p className="text-sm font-bold text-gray-800">{label}</p><p className="text-xs text-gray-500">{desc}</p></div>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
    </div>
);