import React, { useState, useEffect } from 'react';
import {
    X, Smartphone, Plus, Trash2, Settings, Tag,
    RefreshCw, Edit2, Loader2, User, Hash
} from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || "https://wa.clicandapp.com").replace(/\/$/, "");

export default function LocationDetailsModal({ location, onClose, token, onLogout }) {
    const [slots, setSlots] = useState([]);
    const [keywords, setKeywords] = useState([]);
    const [ghlUsers, setGhlUsers] = useState([]); // 👈 NUEVO: Lista de usuarios GHL
    const [loading, setLoading] = useState(true);
    const [expandedSlotId, setExpandedSlotId] = useState(null);
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
            onLogout(); onClose(); return null;
        }
        return res;
    };

    useEffect(() => {
        loadData();
    }, [location]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Cargar slots, keywords y nombre
            const detailsRes = await authFetch(`/agency/location-details/${location.location_id}`);
            const detailsData = await detailsRes.json();

            if (detailsData) {
                setSlots(detailsData.slots || []);
                setKeywords(detailsData.keywords || []);
            }

            // 🆕 Cargar usuarios de GHL para el dropdown
            const usersRes = await authFetch(`/agency/ghl-users/${location.location_id}`);
            if (usersRes.ok) {
                const usersData = await usersRes.json();
                setGhlUsers(usersData || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // --- SLOTS ---
    const handleAddSlot = async () => {
        const res = await authFetch(`/agency/add-slot`, {
            method: "POST",
            body: JSON.stringify({ locationId: location.location_id })
        });
        if (res && res.ok) loadData();
    };

    const handleDeleteSlot = async (slotId) => {
        if (!confirm("¿Eliminar dispositivo? Se cerrará la sesión de WhatsApp.")) return;
        setDeletingSlotId(slotId);
        await authFetch(`/agency/slots/${location.location_id}/${slotId}`, { method: "DELETE" });
        setDeletingSlotId(null);
        loadData();
    };

    const editSlotName = async (slotId, currentName) => {
        const newName = prompt("Nuevo nombre:", currentName || "");
        if (newName && newName !== currentName) {
            const res = await authFetch(`/config-slot`, {
                method: "POST",
                body: JSON.stringify({ locationId: location.location_id, slot: slotId, slotName: newName })
            });
            if (res && res.ok) {
                setSlots(prev => prev.map(s => s.slot_id === slotId ? { ...s, slot_name: newName } : s));
            }
        }
    };

    // --- CONFIGURACIÓN POR SLOT ---

    // Función auxiliar para obtener defaults
    const getSafeSettings = (currentSettings) => ({
        show_source_label: true,
        transcribe_audio: true,
        create_unknown_contacts: true,
        send_disconnect_message: true,
        ghl_contact_tag: "",       // 👈 Default vacío
        ghl_assigned_user: ""      // 👈 Default vacío
    });

    // Toggle para Booleanos
    const toggleSlotSetting = async (slotId, key, currentSettings) => {
        const safeSettings = { ...getSafeSettings(currentSettings), ...currentSettings };
        const newSettings = { ...safeSettings, [key]: !safeSettings[key] };
        updateSettingsBackend(slotId, newSettings);
    };

    // 🆕 Cambio para Textos/Selects
    const changeSlotSetting = async (slotId, key, value, currentSettings) => {
        const safeSettings = { ...getSafeSettings(currentSettings), ...currentSettings };
        const newSettings = { ...safeSettings, [key]: value };
        updateSettingsBackend(slotId, newSettings);
    };

    const updateSettingsBackend = async (slotId, newSettings) => {
        // Optimista UI Update
        setSlots(prev => prev.map(s => s.slot_id === slotId ? { ...s, settings: newSettings } : s));

        await authFetch(`/agency/slots/${location.location_id}/${slotId}/settings`, {
            method: 'PUT',
            body: JSON.stringify({ settings: newSettings })
        });
    };

    // --- KEYWORDS POR SLOT ---
    const handleAddKeyword = async (e, slotId) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const keyword = formData.get('keyword');
        const tag = formData.get('tag');

        const res = await authFetch(`/agency/keywords`, {
            method: 'POST',
            body: JSON.stringify({ locationId: location.location_id, slotId, keyword, tag })
        });
        if (res && res.ok) loadData();
    };

    const deleteKeyword = async (id) => {
        await authFetch(`/agency/keywords/${id}`, { method: 'DELETE' });
        loadData();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-300 dark:border-gray-700">

                {/* HEADER */}
                <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Smartphone className="text-indigo-600 dark:text-indigo-400" size={24} />
                            {location.name || location.location_id}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestión individual de dispositivos</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition text-gray-500 dark:text-gray-400">
                        <X size={24} />
                    </button>
                </div>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950">
                    <div className="flex justify-end mb-6">
                        <button onClick={handleAddSlot} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 shadow-md transition">
                            <Plus size={18} /> Agregar Nuevo Número
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-10"><RefreshCw className="animate-spin text-indigo-600" /></div>
                    ) : slots.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900">
                            <p className="text-gray-500 dark:text-gray-400 font-medium">No hay números configurados.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {slots.map(slot => {
                                const isExpanded = expandedSlotId === slot.slot_id;
                                const isConnected = !!slot.phone_number;
                                const slotKeywords = keywords.filter(k => k.slot_id === slot.slot_id);
                                const currentSettings = slot.settings || {};

                                return (
                                    <div key={slot.slot_id} className={`bg-white dark:bg-gray-900 border rounded-xl transition-all duration-300 ${isExpanded
                                            ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-lg'
                                            : 'border-gray-300 dark:border-gray-700 shadow-sm hover:border-indigo-300'
                                        }`}>

                                        {/* CABECERA SLOT */}
                                        <div
                                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-t-xl transition-colors"
                                            onClick={() => setExpandedSlotId(isExpanded ? null : slot.slot_id)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-gray-400'}`}></div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">{slot.slot_name || `Slot ${slot.slot_id}`}</h3>
                                                        <button onClick={(e) => { e.stopPropagation(); editSlotName(slot.slot_id, slot.slot_name); }} className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                                                            <Edit2 size={14} />
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                                                        {isConnected ? `+${slot.phone_number}` : 'Desconectado'} • ID: {slot.slot_id}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <span className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${isExpanded
                                                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                                                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                                    }`}>
                                                    {isExpanded ? 'Configurando...' : 'Gestionar'}
                                                </span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteSlot(slot.slot_id); }}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                                                    disabled={deletingSlotId === slot.slot_id}
                                                >
                                                    {deletingSlotId === slot.slot_id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* CUERPO EXPANDIBLE */}
                                        {isExpanded && (
                                            <div className="border-t border-gray-200 dark:border-gray-800 p-6 bg-gray-50 dark:bg-gray-950/50 rounded-b-xl">
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                                                    {/* COLUMNA 1: CONFIGURACIÓN GENERAL */}
                                                    <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-5">
                                                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                            <Settings size={14} /> Preferencias del Dispositivo
                                                        </h4>

                                                        {/* Toggles Existentes */}
                                                        <div className="space-y-4">
                                                            <SettingRow
                                                                label="Firma de Origen"
                                                                desc="Añadir 'Source: [Nombre]'."
                                                                checked={currentSettings.show_source_label ?? true}
                                                                onChange={() => toggleSlotSetting(slot.slot_id, 'show_source_label', slot.settings)}
                                                            />
                                                            <SettingRow label="Transcripción IA" desc="Audio a texto." checked={currentSettings.transcribe_audio ?? true} onChange={() => toggleSlotSetting(slot.slot_id, 'transcribe_audio', slot.settings)} />
                                                            <SettingRow label="Crear Contactos" desc="Registrar leads." checked={currentSettings.create_unknown_contacts ?? true} onChange={() => toggleSlotSetting(slot.slot_id, 'create_unknown_contacts', slot.settings)} />
                                                            <SettingRow label="Alerta Desconexión" desc="Avisar cierre sesión." checked={currentSettings.send_disconnect_message ?? true} onChange={() => toggleSlotSetting(slot.slot_id, 'send_disconnect_message', slot.settings)} />
                                                        </div>

                                                        {/* 👇 NUEVOS CAMPOS: TAG Y RESPONSABLE */}
                                                        <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">

                                                            {/* Input Tag */}
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                                                                    <Hash size={12} /> Tag Automático (Entrante)
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Ej: whatsapp-ventas"
                                                                    className="w-full text-sm p-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                                                    value={currentSettings.ghl_contact_tag || ""}
                                                                    onChange={(e) => changeSlotSetting(slot.slot_id, 'ghl_contact_tag', e.target.value, slot.settings)}
                                                                />
                                                                <p className="text-[10px] text-gray-400 mt-1">Se aplicará a contactos que escriban a este número.</p>
                                                            </div>

                                                            {/* Dropdown Responsable */}
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                                                                    <User size={12} /> Usuario Responsable (GHL)
                                                                </label>
                                                                <div className="relative">
                                                                    <select
                                                                        className="w-full text-sm p-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                                                                        value={currentSettings.ghl_assigned_user || ""}
                                                                        onChange={(e) => changeSlotSetting(slot.slot_id, 'ghl_assigned_user', e.target.value, slot.settings)}
                                                                    >
                                                                        <option value="">-- Sin asignar --</option>
                                                                        {ghlUsers.map(u => (
                                                                            <option key={u.id} value={u.id}>
                                                                                {u.name} ({u.role || 'User'})
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    {/* Flechita custom para el select */}
                                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                                                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                                                    </div>
                                                                </div>
                                                                <p className="text-[10px] text-gray-400 mt-1">Las conversaciones se asignarán a este usuario.</p>
                                                            </div>

                                                        </div>
                                                    </div>

                                                    {/* COLUMNA 2: KEYWORDS (IGUAL QUE ANTES) */}
                                                    <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                            <Tag size={14} /> Etiquetas por Palabra Clave
                                                        </h4>

                                                        <form onSubmit={(e) => handleAddKeyword(e, slot.slot_id)} className="flex gap-2 mb-4">
                                                            <input name="keyword" required placeholder="Si dice..." className="flex-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                                            <input name="tag" required placeholder="Tag..." className="w-1/3 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                                            <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700"><Plus size={18} /></button>
                                                        </form>

                                                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                                                            {slotKeywords.length === 0 ? (
                                                                <p className="text-center text-xs text-gray-400 py-4 italic">Sin reglas.</p>
                                                            ) : (
                                                                slotKeywords.map(k => (
                                                                    <div key={k.id} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                                                                        <div className="flex gap-2 items-center overflow-hidden">
                                                                            <span className="font-medium text-gray-700 dark:text-gray-200">"{k.keyword}"</span>
                                                                            <span className="text-gray-400">→</span>
                                                                            <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 text-xs px-2 py-0.5 rounded font-bold">{k.tag}</span>
                                                                        </div>
                                                                        <button onClick={() => deleteKeyword(k.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Componente SettingRow
const SettingRow = ({ label, desc, checked, onChange }) => (
    <div className="flex items-center justify-between group">
        <div>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{label}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:ring-4 peer-focus:ring-indigo-100 dark:peer-focus:ring-indigo-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
    </div>
);