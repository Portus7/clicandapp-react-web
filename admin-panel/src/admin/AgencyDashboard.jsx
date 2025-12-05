import React, { useState, useEffect } from 'react';
import {
    Building2, Smartphone, Settings, Tag, Plus, Trash2,
    X, Save, CheckCircle, AlertCircle, Search
} from 'lucide-react';

// URL del Backend
const API_URL = import.meta.env.VITE_API_URL || "https://wa.clicandapp.com";

export default function AgencyDashboard() {
    // Simulamos obtener el Agency ID (en prod vendría por URL params o Auth context)
    // ej: tudominio.com/agency?agencyId=...
    const queryParams = new URLSearchParams(window.location.search);
    const AGENCY_ID = queryParams.get("agencyId") || "AGENCY_DEMO_ID";

    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null); // Para el Modal
    const [loading, setLoading] = useState(true);

    // --- Cargar Locations ---
    useEffect(() => {
        fetch(`${API_URL}/agency/locations?agencyId=${AGENCY_ID}`)
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) setLocations(data);
                setLoading(false);
            })
            .catch(console.error);
    }, [AGENCY_ID]);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-indigo-600 rounded-lg text-white">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Panel de Agencia</h1>
                        <p className="text-gray-500 text-sm">Gestiona tus subcuentas y configuraciones de WhatsApp</p>
                    </div>
                </div>

                {/* Grid de Locations */}
                {loading ? (
                    <p className="text-center py-10">Cargando subcuentas...</p>
                ) : locations.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
                        <p className="text-gray-500">No hay subcuentas instaladas para esta agencia.</p>
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
                                            {loc.location_id}
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
                                    <span>Dispositivos conectados:</span>
                                    {/* Aquí podrías poner lógica real de conteo si la tuvieras en el endpoint inicial */}
                                    <span className="font-bold text-gray-800">Ver detalles →</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* MODAL DETALLES */}
                {selectedLocation && (
                    <LocationDetailsModal
                        location={selectedLocation}
                        onClose={() => setSelectedLocation(null)}
                    />
                )}

            </div>
        </div>
    );
}

// --- SUB-COMPONENTE: MODAL DE DETALLES ---
function LocationDetailsModal({ location, onClose }) {
    const [activeTab, setActiveTab] = useState('slots'); // 'slots' | 'settings' | 'keywords'
    const [details, setDetails] = useState({ slots: [], keywords: [], settings: {} });
    const [loading, setLoading] = useState(true);

    // Cargar detalles al abrir
    useEffect(() => {
        setLoading(true);
        fetch(`${API_URL}/agency/location-details/${location.location_id}`)
            .then(r => r.json())
            .then(data => {
                setDetails(data);
                setLoading(false);
            })
            .catch(console.error);
    }, [location]);

    // Actualizar Settings
    const toggleSetting = async (key) => {
        const newSettings = { ...details.settings, [key]: !details.settings[key] };
        setDetails(prev => ({ ...prev, settings: newSettings }));

        // Guardar en backend
        await fetch(`${API_URL}/agency/settings/${location.location_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
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

        const res = await fetch(`${API_URL}/agency/keywords`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ locationId: location.location_id, keyword, tag })
        });
        const newRule = await res.json();
        setDetails(prev => ({ ...prev, keywords: [newRule, ...prev.keywords] }));
        e.target.reset();
    };

    // Borrar Keyword
    const deleteKeyword = async (id) => {
        await fetch(`${API_URL}/agency/keywords/${id}`, { method: 'DELETE' });
        setDetails(prev => ({ ...prev, keywords: prev.keywords.filter(k => k.id !== id) }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

                {/* Header Modal */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Administrar Subcuenta</h2>
                        <p className="text-sm text-gray-500 font-mono">{location.location_id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><X size={24} /></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 px-6">
                    <TabButton active={activeTab === 'slots'} onClick={() => setActiveTab('slots')} icon={<Smartphone size={18} />} label="Dispositivos" />
                    <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={18} />} label="Configuración" />
                    <TabButton active={activeTab === 'keywords'} onClick={() => setActiveTab('keywords')} icon={<Tag size={18} />} label="Palabras Clave" />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {loading ? (
                        <div className="flex justify-center items-center h-40"><RefreshCw className="animate-spin text-indigo-600" /></div>
                    ) : (
                        <>
                            {/* VISTA: DISPOSITIVOS */}
                            {activeTab === 'slots' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Siempre mostramos 3 slots por defecto o los que vengan de DB */}
                                    {[1, 2, 3].map(num => {
                                        const slotData = details.slots.find(s => s.slot_id === num);
                                        // Simulamos estado conectado si hay numero (en prod mejorar con ping real)
                                        const isConnected = !!slotData?.phone_number;

                                        return (
                                            <div key={num} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="font-bold text-gray-700">{slotData?.slot_name || `Dispositivo #${num}`}</span>
                                                    <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                        {isConnected ? 'Conectado' : 'Desconectado'}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-600 mb-2">
                                                    {isConnected ? `📞 +${slotData.phone_number}` : 'Esperando vinculación...'}
                                                </div>
                                                {/* Aquí podrías agregar botón para editar nombre del slot */}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* VISTA: SETTINGS */}
                            {activeTab === 'settings' && (
                                <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-6">
                                    <SettingRow
                                        label="Mostrar Source Label"
                                        desc='Añade "Source: +1234" al final de los mensajes.'
                                        checked={details.settings?.show_source_label ?? true}
                                        onChange={() => toggleSetting('show_source_label')}
                                    />
                                    <SettingRow
                                        label="IA Transcripción de Audio"
                                        desc='Usa OpenAI para transcribir notas de voz recibidas.'
                                        checked={details.settings?.transcribe_audio ?? true}
                                        onChange={() => toggleSetting('transcribe_audio')}
                                    />
                                    <SettingRow
                                        label="Crear Contactos Nuevos"
                                        desc='Registrar números desconocidos en GHL automáticamente.'
                                        checked={details.settings?.create_unknown_contacts ?? true}
                                        onChange={() => toggleSetting('create_unknown_contacts')}
                                    />
                                </div>
                            )}

                            {/* VISTA: KEYWORDS (NUEVO) */}
                            {activeTab === 'keywords' && (
                                <div className="space-y-6">
                                    {/* Formulario de Agregar */}
                                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Plus size={16} /> Nueva Regla</h3>
                                        <form onSubmit={handleAddKeyword} className="flex flex-col sm:flex-row gap-3">
                                            <input name="keyword" required placeholder="Si el mensaje contiene..." className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                            <input name="tag" required placeholder="Agregar etiqueta en GHL..." className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">Guardar</button>
                                        </form>
                                    </div>

                                    {/* Lista de Keywords */}
                                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-4 py-3 font-medium text-gray-500">Palabra Clave</th>
                                                    <th className="px-4 py-3 font-medium text-gray-500">Etiqueta (Tag)</th>
                                                    <th className="px-4 py-3 text-right"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {details.keywords.length === 0 ? (
                                                    <tr><td colSpan="3" className="p-4 text-center text-gray-400">No hay reglas configuradas.</td></tr>
                                                ) : (
                                                    details.keywords.map(k => (
                                                        <tr key={k.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 font-medium text-gray-800">"{k.keyword}"</td>
                                                            <td className="px-4 py-3"><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">{k.tag}</span></td>
                                                            <td className="px-4 py-3 text-right">
                                                                <button onClick={() => deleteKeyword(k.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
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

// --- UI COMPONENTS HELPERS ---
const TabButton = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition ${active ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
    >
        {icon} {label}
    </button>
);

const SettingRow = ({ label, desc, checked, onChange }) => (
    <div className="flex items-center justify-between">
        <div>
            <p className="text-sm font-medium text-gray-800">{label}</p>
            <p className="text-xs text-gray-500">{desc}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
    </div>
);

// Icono de carga auxiliar (si no usas lucide, usa svg)
const RefreshCw = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>
);