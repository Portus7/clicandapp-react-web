import React, { useState, useEffect } from 'react';
import SupportManager from './SupportManager';
// 👇 Importamos el nuevo componente
import LocationDetailsModal from './LocationDetailsModal';
import {
    Settings, Search, CheckCircle,
    RefreshCw, Building2, Smartphone,
    ArrowLeft
} from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || "https://wa.clicandapp.com").replace(/\/$/, "");

export default function AdminDashboard({ token, onLogout }) {
    const [view, setView] = useState('agencies');
    const [selectedAgency, setSelectedAgency] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);

    const [agencies, setAgencies] = useState([]);
    const [subaccounts, setSubaccounts] = useState([]);
    const [loading, setLoading] = useState(true);
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

        if (res.status === 401 || res.status === 403) {
            onLogout();
            throw new Error("Sesión expirada");
        }
        return res;
    };

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

    const filteredAgencies = agencies.filter(a => {
        const term = searchTerm.toLowerCase();
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
                <div className="mb-8">
                    <div className="relative w-full max-w-md mx-auto sm:mx-0">
                        {view === 'agencies' && <SupportManager token={token} />}
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

                {/* VISTA AGENCIAS */}
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
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="bg-indigo-50 p-2.5 rounded-lg text-indigo-600">
                                                    <Building2 size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-800 truncate max-w-[180px]">
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

                {/* VISTA SUBCUENTAS */}
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
                                            <th className="px-6 py-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredSubaccounts.map(sub => (
                                            <tr key={sub.location_id} className="hover:bg-indigo-50/30 transition duration-150">
                                                <td className="px-6 py-4"><div className="font-bold text-gray-900">{sub.name || "Sin Nombre"}</div></td>
                                                <td className="px-6 py-4"><span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">{sub.location_id}</span></td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${sub.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                        {sub.status === 'active' && <CheckCircle size={12} className="mr-1" />}
                                                        {sub.status?.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 capitalize">{sub.plan_name || 'Trial'}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => setSelectedLocation(sub)} className="inline-flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 hover:text-indigo-600 hover:border-indigo-600 px-3 py-1.5 rounded-lg text-sm font-medium transition shadow-sm">
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

                {/* 👇 AQUI ESTÁ EL CAMBIO IMPORTANTE: Usamos el componente importado */}
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