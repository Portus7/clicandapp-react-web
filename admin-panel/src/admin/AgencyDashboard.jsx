import React, { useState, useEffect } from 'react';
import {
    Building2, Smartphone, Settings, Tag, Plus, Trash2,
    X, RefreshCw
} from 'lucide-react';

// URL del Backend
const API_URL = (import.meta.env.VITE_API_URL || "https://wa.clicandapp.com").replace(/\/$/, "");

// 👇 IMPORTANTE: Recibimos el 'token' y 'onLogout' desde App.jsx
export default function AgencyDashboard({ token, onLogout }) {
    // Obtener Agency ID de la URL
    const queryParams = new URLSearchParams(window.location.search);
    const AGENCY_ID = queryParams.get("agencyId") || "AGENCY_DEMO_ID";

    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- Helper para peticiones autenticadas (Reemplaza el fetch normal) ---
    const authFetch = async (endpoint, options = {}) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                ...options.headers,
                'Content-Type': 'application/json',
                // 👇 AQUÍ LA SOLUCIÓN: Usamos el token estándar en vez de x-admin-secret
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.status === 401 || res.status === 403) {
            onLogout(); // Si el token vence, cerramos sesión
            throw new Error("Sesión expirada o acceso denegado");
        }

        return res;
    };

    // --- Cargar Locations ---
    useEffect(() => {
        setLoading(true);
        // Usamos authFetch en lugar de fetch directo
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
    }, [AGENCY_ID, token]);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-600 rounded-lg text-white">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Panel de Agencia</h1>
                            <p className="text-gray-500 text-sm">Gestionando: {AGENCY_ID}</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="text-sm text-red-600 hover:text-red-800 font-medium bg-red-50 px-4 py-2 rounded-lg transition"
                    >
                        Cerrar Sesión
                    </button>
                </div>

                {/* Grid de Locations */}
                {loading ? (
                    <p className="text-center py-10 text-gray-500">Cargando subcuentas...</p>
                ) : locations.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                        <p className="text-gray-500">No hay subcuentas instaladas o acceso denegado.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {locations.map(loc => (
                            <div
                                key={loc.location_id}
                                onClick={() => setSelectedLocation(loc)}
                                className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800 group-hover:text-indigo-600 transition">
                                            {loc.name || loc.location_name || loc.location_id}
                                        </h3>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${loc.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {loc.status?.toUpperCase() || 'UNKNOWN'}
                                        </span>
                                    </div>
                                    <div className="bg-gray-100 p-2 rounded-full text-gray-500">
                                        <Smartphone size={20} />
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500 flex justify-between items-center">
                                    <span>Dispositivos: {loc.total_slots || 0}</span>
                                    <span className="font-bold text-gray-800 text-xs">Gestionar →</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* MODAL DETALLES */}
                {selectedLocation && (
                    <LocationDetailsModal
                        location={selectedLocation}
                        token={token}       // Pasamos el token
                        onLogout={onLogout} // Pasamos logout
                        onClose={() => setSelectedLocation(null)}
                    />
                )}
            </div>
        </div>
    );
}

// --- SUB-COMPONENTE: MODAL DE DETALLES ---
function LocationDetailsModal({ location, onClose, token, onLogout }) {
    const [activeTab, setActiveTab] = useState('slots');
    const [details, setDetails] = useState({ slots: [], keywords: [], settings: {} });
    const [loading, setLoading] = useState(true);

    // Helper interno reutilizable
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

    // Cargar detalles al abrir
    useEffect(() => {
        setLoading(true);
        authFetch(`/agency/location-details/${location.location_id}`)
            .then(r => r && r.json()) // r && r.json() evita error si authFetch devolvió null
            .then(data => {
                if (data) {
                    setDetails(data);
                    setLoading(false);
                }
            })
            .catch(console.error);
    }, [location]);

    // Actualizar Settings
    const toggleSetting = async (key) => {
        const newSettings = { ...details.settings, [key]: !details.settings[key] };
        setDetails(prev => ({ ...prev, settings: newSettings }));

        await authFetch(`/agency/settings/${location.location_id}`, {
            method: 'PUT',
            body: JSON.stringify({ settings: newSettings })
        });
    };

    // Agregar Keyword
    const handleAddKeyword = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const keyword = formData.get('keyword');
        const tag = formData.get('tag');

        if (!keyword || !tag) return;

        const res = await authFetch(`${API_URL}/agency/keywords`, {
            method: 'POST',
            body: JSON.stringify({ locationId: location.location_id, keyword, tag })
        });

        if (res && res.ok) {
            const newRule = await res.json();
            setDetails(prev => ({ ...prev, keywords: [newRule, ...prev.keywords] }));
            e.target.reset();
        }
    };

    // Borrar Keyword
    const deleteKeyword = async (id) => {
        const res = await authFetch(`${API_URL}/agency/keywords/${id}`, { method: 'DELETE' });
        if (res && res.ok) {
            setDetails(prev => ({ ...prev, keywords: prev.keywords.filter(k => k.id !== id) }));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

                {/* Header Modal */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Smartphone size={20} className="text-indigo-600" />
                            {location.name || location.location_name || location.location_id}
                        </h2>
                        <p className="text-xs text-gray-400">Configuración de Subcuenta</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><X size={24} /></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 px-6 bg-gray-50">
                    <TabButton active={activeTab === 'slots'} onClick={() => setActiveTab('slots')} icon={<Smartphone size={16} />} label="Dispositivos" />
                    <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={16} />} label="Configuración" />
                    <TabButton active={activeTab === 'keywords'} onClick={() => setActiveTab('keywords')} icon={<Tag size={16} />} label="Palabras Clave" />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    {loading ? (
                        <div className="flex justify-center items-center h-40 text-indigo-600"><RefreshCw className="animate-spin" /></div>
                    ) : (
                        <>
                            {/* VISTA: DISPOSITIVOS */}
                            {activeTab === 'slots' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[1, 2, 3].map(num => {
                                        const slotData = details.slots.find(s => s.slot_id === num);
                                        const isConnected = !!slotData?.phone_number;

                                        return (
                                            <div key={num} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
                                                <div className={`absolute top-0 left-0 w-1 h-full ${isConnected ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                                <div className="pl-3">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-bold text-gray-700 text-sm">{slotData?.slot_name || `Slot ${num}`}</span>
                                                        {isConnected && <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.6)]"></div>}
                                                    </div>
                                                    <div className="text-xs text-gray-500 font-mono bg-gray-50 inline-block px-2 py-1 rounded border border-gray-100">
                                                        {isConnected ? `+${slotData.phone_number}` : 'Desconectado'}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* VISTA: SETTINGS */}
                            {activeTab === 'settings' && (
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                                    <SettingRow
                                        label="Source Label"
                                        desc='Añade "Source: +1234" al final de los mensajes.'
                                        checked={details.settings?.show_source_label ?? true}
                                        onChange={() => toggleSetting('show_source_label')}
                                    />
                                    <div className="h-px bg-gray-100"></div>
                                    <SettingRow
                                        label="IA Transcripción"
                                        desc='Transcribir audios con Whisper OpenAI.'
                                        checked={details.settings?.transcribe_audio ?? true}
                                        onChange={() => toggleSetting('transcribe_audio')}
                                    />
                                    <div className="h-px bg-gray-100"></div>
                                    <SettingRow
                                        label="Crear Contactos"
                                        desc='Registrar números nuevos en GHL.'
                                        checked={details.settings?.create_unknown_contacts ?? true}
                                        onChange={() => toggleSetting('create_unknown_contacts')}
                                    />
                                </div>
                            )}

                            {/* VISTA: KEYWORDS */}
                            {activeTab === 'keywords' && (
                                <div className="space-y-6">
                                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                        <h3 className="text-xs font-bold text-indigo-800 mb-2 uppercase tracking-wide">Nueva Regla</h3>
                                        <form onSubmit={handleAddKeyword} className="flex gap-2">
                                            <input name="keyword" required placeholder='Ej: "info precio"' className="flex-1 border-0 rounded-lg p-2 text-sm shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500" />
                                            <input name="tag" required placeholder='Tag GHL (Ej: "interesado")' className="flex-1 border-0 rounded-lg p-2 text-sm shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500" />
                                            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm"><Plus size={18} /></button>
                                        </form>
                                    </div>

                                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs">
                                                <tr>
                                                    <th className="px-4 py-3 font-semibold">Si dice...</th>
                                                    <th className="px-4 py-3 font-semibold">Agregar Tag</th>
                                                    <th className="px-4 py-3 text-right"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {details.keywords.length === 0 ? (
                                                    <tr><td colSpan="3" className="p-6 text-center text-gray-400 italic">Sin reglas de etiquetado.</td></tr>
                                                ) : (
                                                    details.keywords.map(k => (
                                                        <tr key={k.id} className="hover:bg-gray-50 transition">
                                                            <td className="px-4 py-3 font-medium text-gray-900">"{k.keyword}"</td>
                                                            <td className="px-4 py-3"><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">{k.tag}</span></td>
                                                            <td className="px-4 py-3 text-right">
                                                                <button onClick={() => deleteKeyword(k.id)} className="text-gray-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition"><Trash2 size={16} /></button>
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

// UI HELPERS (Iguales que antes)
const TabButton = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${active ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
    >
        {icon} {label}
    </button>
);

const SettingRow = ({ label, desc, checked, onChange }) => (
    <div className="flex items-center justify-between">
        <div>
            <p className="text-sm font-bold text-gray-800">{label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
    </div>
);