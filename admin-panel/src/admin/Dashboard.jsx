import React, { useState, useEffect } from 'react';
import {
    Users, Settings, Plus, Search, CheckCircle,
    AlertCircle, XCircle, MoreHorizontal, Save, RefreshCw
} from 'lucide-react';

// NOTA: En producción, pon esto en un .env
const API_URL = import.meta.env.VITE_API_URL || "https://api-backend.tudominio.com";
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || "admin123";

export default function AdminDashboard() {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTenant, setSelectedTenant] = useState(null); // Para el modal de edición
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // --- API CALLS ---
    const fetchTenants = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/tenants`, {
                headers: { 'x-admin-secret': ADMIN_SECRET }
            });
            const data = await res.json();
            if (Array.isArray(data)) setTenants(data);
        } catch (error) {
            console.error("Error cargando clientes:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateTenant = async (id, updates) => {
        try {
            await fetch(`${API_URL}/admin/tenants/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-secret': ADMIN_SECRET
                },
                body: JSON.stringify(updates)
            });
            // Actualizar estado local para feedback inmediato
            setTenants(prev => prev.map(t => t.location_id === id ? { ...t, ...updates } : t));
            if (selectedTenant) setSelectedTenant(prev => ({ ...prev, ...updates }));
        } catch (error) {
            alert("Error actualizando");
        }
    };

    const createTenant = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = {
            locationId: formData.get('locationId'),
            planName: formData.get('planName'),
            days: 14 // Días por defecto
        };

        try {
            await fetch(`${API_URL}/admin/tenants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-secret': ADMIN_SECRET
                },
                body: JSON.stringify(payload)
            });
            setIsCreateModalOpen(false);
            fetchTenants();
        } catch (error) {
            alert("Error creando cliente");
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    // --- FILTROS ---
    const filteredTenants = tenants.filter(t =>
        t.location_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.status && t.status.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // --- RENDER HELPERS ---
    const StatusBadge = ({ status }) => {
        const styles = {
            active: "bg-emerald-100 text-emerald-700 border-emerald-200",
            trial: "bg-amber-100 text-amber-700 border-amber-200",
            suspended: "bg-red-100 text-red-700 border-red-200",
            cancelled: "bg-gray-100 text-gray-700 border-gray-200"
        };
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.cancelled}`}>
                {status ? status.toUpperCase() : "UNKNOWN"}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            {/* --- TOP BAR --- */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                            CA
                        </div>
                        <h1 className="text-lg font-semibold tracking-tight">Clic&App Admin</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={fetchTenants} className="p-2 text-gray-400 hover:text-indigo-600 transition">
                            <RefreshCw size={20} />
                        </button>
                        <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-sm font-medium text-gray-600">
                            A
                        </div>
                    </div>
                </div>
            </header>

            {/* --- MAIN CONTENT --- */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* STATS OVERVIEW */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Total Clientes</p>
                                <p className="text-3xl font-bold mt-1 text-gray-800">{tenants.length}</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg text-blue-600"><Users size={24} /></div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Activos / Trial</p>
                                <p className="text-3xl font-bold mt-1 text-emerald-600">
                                    {tenants.filter(t => t.status === 'active' || t.status === 'trial').length}
                                </p>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600"><CheckCircle size={24} /></div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Suspendidos</p>
                                <p className="text-3xl font-bold mt-1 text-red-600">
                                    {tenants.filter(t => t.status === 'suspended').length}
                                </p>
                            </div>
                            <div className="p-3 bg-red-50 rounded-lg text-red-600"><AlertCircle size={24} /></div>
                        </div>
                    </div>
                </div>

                {/* ACTIONS BAR */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por Location ID..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm"
                    >
                        <Plus size={18} /> Nuevo Cliente
                    </button>
                </div>

                {/* TABLE */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                    <th className="px-6 py-4">Location ID / Cliente</th>
                                    <th className="px-6 py-4">Plan</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4">Fin del Trial</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">Cargando datos...</td></tr>
                                ) : filteredTenants.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">No se encontraron clientes.</td></tr>
                                ) : (
                                    filteredTenants.map((tenant) => (
                                        <tr key={tenant.location_id} className="hover:bg-gray-50 transition group">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{tenant.location_id}</div>
                                                <div className="text-xs text-gray-400 mt-0.5">Registrado: {new Date(tenant.created_at).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                                                {tenant.plan_name || 'Desconocido'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={tenant.status} />
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {tenant.trial_ends_at ? new Date(tenant.trial_ends_at).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => setSelectedTenant(tenant)}
                                                    className="text-gray-400 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-50 transition"
                                                >
                                                    <Settings size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* --- EDIT MODAL (SLIDE OVER) --- */}
            {selectedTenant && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSelectedTenant(null)}></div>
                    <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Configuración</h2>
                            <button onClick={() => setSelectedTenant(null)} className="p-1 hover:bg-gray-100 rounded-full"><XCircle size={24} className="text-gray-400" /></button>
                        </div>

                        <div className="space-y-6">
                            {/* Info Card */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">ID del Cliente</p>
                                <p className="font-mono text-sm text-gray-700 break-all">{selectedTenant.location_id}</p>
                            </div>

                            {/* Status Control */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Estado de Suscripción</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={selectedTenant.status}
                                    onChange={(e) => updateTenant(selectedTenant.location_id, { status: e.target.value })}
                                >
                                    <option value="active">Activo (Pagado)</option>
                                    <option value="trial">Periodo de Prueba</option>
                                    <option value="suspended">Suspendido (Falta Pago)</option>
                                    <option value="cancelled">Cancelado</option>
                                </select>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Feature Toggles */}
                            <div>
                                <h3 className="text-md font-semibold text-gray-800 mb-4">Funcionalidades (Settings)</h3>
                                <div className="space-y-4">

                                    {/* Toggle 1: Source Label */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Mostrar "Source: +1234"</p>
                                            <p className="text-xs text-gray-500">Añade la firma al final del mensaje.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={selectedTenant.settings?.show_source_label ?? true}
                                                onChange={(e) => {
                                                    const newSettings = { ...selectedTenant.settings, show_source_label: e.target.checked };
                                                    updateTenant(selectedTenant.location_id, { settings: newSettings });
                                                }}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>

                                    {/* Toggle 2: Transcribe Audio */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">IA Transcripción de Audio</p>
                                            <p className="text-xs text-gray-500">Usa OpenAI Whisper para notas de voz.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={selectedTenant.settings?.transcribe_audio ?? true}
                                                onChange={(e) => {
                                                    const newSettings = { ...selectedTenant.settings, transcribe_audio: e.target.checked };
                                                    updateTenant(selectedTenant.location_id, { settings: newSettings });
                                                }}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>

                                    {/* Toggle 3: Create Unknown Contacts */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Crear Contactos Desconocidos</p>
                                            <p className="text-xs text-gray-500">Registrar en GHL si no existen.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={selectedTenant.settings?.create_unknown_contacts ?? true}
                                                onChange={(e) => {
                                                    const newSettings = { ...selectedTenant.settings, create_unknown_contacts: e.target.checked };
                                                    updateTenant(selectedTenant.location_id, { settings: newSettings });
                                                }}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CREATE MODAL --- */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-lg font-bold mb-4">Registrar Nuevo Cliente</h2>
                        <form onSubmit={createTenant} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">GoHighLevel Location ID</label>
                                <input name="locationId" required type="text" placeholder="Ej: ve9EPMs..." className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Inicial</label>
                                <select name="planName" className="w-full border border-gray-300 rounded-lg p-2 bg-white outline-none">
                                    <option value="trial">Trial (Prueba Gratuita)</option>
                                    <option value="pro">Pro (Pago)</option>
                                </select>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button>
                                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md">Registrar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}